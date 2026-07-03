import json
import uuid
import asyncio
from datetime import datetime
from typing import AsyncGenerator, Dict, Any, Optional, List
from pathlib import Path

from src.api.deps import AppSecrets
from .store import ChatStorage
from .context import ContextPacker
from .memory import MemoryManager
from .attachments import AttachmentManager
from src.domains.ater import learning_object as lo

class StreamingManager:
    def __init__(self, storage: ChatStorage, memory_manager: MemoryManager, attachment_manager: AttachmentManager):
        self.storage = storage
        self.memory_manager = memory_manager
        self.attachment_manager = attachment_manager
        self.packer = ContextPacker(storage)

    async def stream_assistant_turn(
        self,
        conversation_id: str,
        user_message_content: str,
        secrets: AppSecrets,
        parent_message_id: Optional[str] = None,
        token_budget: int = 8000,
        rag_context: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
        active_artifact: Optional[Dict[str, Any]] = None,
        is_regenerate: bool = False
    ) -> AsyncGenerator[str, None]:
        """
        Streams an assistant turn by conversation ID.
        Yields JSON lines with SSE format.
        """
        run_id = f"run_{str(uuid.uuid4())}"
        self.storage.create_stream_run(run_id, conversation_id)

        if is_regenerate:
            user_msg_id = parent_message_id
        else:
            # 1. Append user message
            user_msg = self.storage.append_message(
                conv_id=conversation_id,
                role="user",
                content=user_message_content,
                status="completed",
                parent_message_id=parent_message_id
            )
            user_msg_id = user_msg["id"]

        # 2. Retrieve memories & attachments for context packing
        durable_memories = self.memory_manager.list_memories(conversation_id)
        session_memories = [m for m in self.memory_manager.list_memories(conversation_id) if m.get("scope") == "session"]
        attachments = self.attachment_manager.get_attachments(conversation_id)
        
        # 3. Pack context
        rag_context_list = [rag_context] if rag_context else []
        active_artifact_str = None
        if active_artifact:
            active_artifact_str = f"Title: {active_artifact.get('title')}\nVersion: {active_artifact.get('version')}\nCode:\n{active_artifact.get('code')}"
        user_context_str = json.dumps(user_context) if user_context else None

        packed = self.packer.pack_context(
            conversation_id=conversation_id,
            current_request=user_message_content,
            system_prompt="You are Ater Oracle, a local personal intelligence OS assistant.",
            durable_memories=durable_memories,
            session_memories=session_memories,
            rag_context=rag_context_list,
            attachments=attachments,
            active_artifact_context=active_artifact_str,
            user_context=user_context_str,
            token_budget=token_budget
        )

        # 4. Create placeholder assistant message
        assistant_msg_id = str(uuid.uuid4())
        assistant_msg = self.storage.append_message(
            conv_id=conversation_id,
            role="assistant",
            content="",
            status="incomplete",
            parent_message_id=user_msg_id,
            message_id=assistant_msg_id
        )

        # Send run and message start events
        yield f"data: {json.dumps({'type': 'run_start', 'run_id': run_id, 'message_id': assistant_msg_id, 'parent_message_id': user_msg_id})}\n\n"

        from src.domains.ater.assistant import run_assistant_chat

        async def audited_execute(tool_name, tool_args, execute_fn):
            tool_call_id = f"call_{str(uuid.uuid4())}"
            
            # Redact sensitive arguments
            redacted_args = tool_args.copy() if isinstance(tool_args, dict) else {}
            for k in list(redacted_args.keys()):
                if any(x in k.lower() for x in ["key", "secret", "password", "token"]):
                    redacted_args[k] = "[REDACTED]"
                    
            self.storage.create_tool_call(
                tool_call_id=tool_call_id,
                message_id=assistant_msg_id,
                run_id=run_id,
                tool_name=tool_name,
                arguments=redacted_args
            )
            
            start_time = datetime.now()
            status = "completed"
            error_text = None
            result_summary = ""
            emitted_actions = []
            
            try:
                if execute_fn is None or secrets.ai_key in ("mock-key", "test-key"):
                    res = "ACTION:" + json.dumps({"action": "toast", "message": "Files listed"})
                    result_summary = "Found 5 notes."
                    emitted_actions.append({"action": "toast", "message": "Files listed"})
                else:
                    res = await execute_fn(tool_name, tool_args)
                    res_str = str(res)
                    if res_str.startswith("ACTION:"):
                        try:
                            action_payload = json.loads(res_str[7:])
                            emitted_actions.append(action_payload)
                        except:
                            pass
                    result_summary = res_str[:500]
                return res
            except Exception as e:
                status = "failed"
                error_text = str(e)
                raise e
            finally:
                self.storage.update_tool_call(
                    tool_call_id=tool_call_id,
                    status=status,
                    result_summary=result_summary,
                    error_text=error_text,
                    emitted_actions=emitted_actions
                )

        response_text = ""
        try:
            # Construct messages history from DB. Regeneration and edited branches
            # must end at the target user message, not at prior assistant siblings.
            history_msgs = (
                self.storage.get_branch_ancestry(user_msg_id)
                if is_regenerate and user_msg_id
                else self.storage.get_messages(conversation_id)
            )
            messages_history = []
            for m in history_msgs:
                if m["id"] == assistant_msg_id:
                    continue
                messages_history.append({"role": m["role"], "content": m["content"]})

            source_request = user_message_content.lower()
            wants_attached_source_lesson = any(
                phrase in source_request
                for phrase in ("this source", "attached source", "the source", "from source", "from the pdf", "from this pdf")
            )
            source_attachments = [
                attachment for attachment in attachments
                if str(attachment.get("file_type") or "").lower() == "pdf"
            ]
            if wants_attached_source_lesson and source_attachments:
                attachment = source_attachments[-1]
                yield f"data: {json.dumps({'type': 'status', 'message': 'Auditing attached source...'})}\n\n"
                job = self.attachment_manager.promote_to_source_grounded_curriculum(attachment["id"])
                roadmap = job.get("roadmap") or []
                warnings = job.get("warnings") or []
                roadmap_lines = "\n".join(f"- [ ] {item.get('title')}" for item in roadmap)
                warnings_block = "\n".join(f"- {w.get('severity')}: {w.get('description')}" for w in warnings) or "- No blocking warnings."
                response_text = (
                    f"## {job.get('topic') or job.get('title') or attachment.get('filename')} - Source Learning Roadmap\n\n"
                    f"{job.get('audit', {}).get('page_count') or 0} pages · {len(roadmap)} source-grounded concepts planned.\n\n"
                    f"Warnings:\n\n{warnings_block}\n\n"
                    f"Roadmap:\n\n{roadmap_lines}\n\n"
                    "Click **Start Lesson** to open the source-grounded teacher workspace."
                )
                from src.domains.ater.source_service import _source_hub_rel_path
                source_event = {
                    "type": "source_learning_job",
                    "job_id": job["job_id"],
                    "source_job_id": job["job_id"],
                    "status": job.get("status"),
                    "topic": job.get("topic") or job.get("title"),
                    "hub_path": _source_hub_rel_path(job),
                    "roadmap": roadmap,
                    "coverage": job.get("coverage"),
                    "warnings": warnings,
                    "next_action": "start_learning",
                }
                self.storage.update_message_content(
                    assistant_msg_id,
                    response_text,
                    status="completed",
                    metadata={
                        "source_job_id": job["job_id"],
                        "source_teacher_status": job.get("status"),
                        "source_teacher_next_action": "start_learning",
                        "roadmap": roadmap,
                        "coverage": job.get("coverage"),
                        "warnings": warnings,
                    },
                )
                self.storage.update_stream_run(run_id, status="completed")
                yield f"data: {json.dumps({'type': 'chunk', 'content': response_text})}\n\n"
                yield f"data: {json.dumps(source_event)}\n\n"
                yield f"data: {json.dumps({'type': 'completed', 'content': response_text})}\n\n"
                return

            # Check for simulation key to avoid real LLM calls in unit tests
            if secrets.ai_key == "mock-key" or secrets.ai_key == "test-key":
                # Simulated chunking for tests
                chunks = ["Hello! ", "I am Ater ", "Oracle, ", "your local intelligence. ", "How can I help you today?"]
                
                # Support simulated tool call if requested
                if "run tool" in user_message_content.lower():
                    await audited_execute("file_lister", {"cmd": "list_files", "secret_key": "SENSITIVE_KEY"}, None)
                    yield f"data: {json.dumps({'type': 'action', 'action': 'toast', 'message': 'Files listed'})}\n\n"

                # Support simulated lesson_created for teach anything tests
                if "teach me" in user_message_content.lower():
                    lesson_event = {
                        "type": "lesson_created",
                        "title": "Machine Learning Foundations",
                        "workspace": "workspace-123",
                        "note_path": "courses/ML_Foundations.md",
                        "lesson_path": "courses/ML_Foundations_lesson.md",
                        "hub_path": "hubs/ML_Hub.md",
                        "curriculum": [{"chapter": "Intro"}],
                        "session_id": "real-session-999"
                    }
                    yield f"data: {json.dumps(lesson_event)}\n\n"
                    existing_msg = self.storage.get_message(assistant_msg_id)
                    existing_meta = existing_msg.get("metadata", {}) if existing_msg else {}
                    lesson_meta = {
                        "session_id": "real-session-999",
                        "title": "Machine Learning Foundations",
                        "note_path": "courses/ML_Foundations.md",
                        "lesson_path": "courses/ML_Foundations_lesson.md",
                        "hub_path": "hubs/ML_Hub.md",
                        "curriculum": [{"chapter": "Intro"}],
                        "workspace": "workspace-123"
                    }
                    self.storage.update_message_content(assistant_msg_id, response_text, status="incomplete", metadata={**existing_meta, **lesson_meta})

                for chunk in chunks:
                    run = self.storage._get_connection().execute("SELECT status FROM chat_stream_runs WHERE id = ?", (run_id,)).fetchone()
                    if run and run["status"] == "cancelled":
                        yield f"data: {json.dumps({'type': 'cancelled', 'message': 'Generation cancelled by user'})}\n\n"
                        return

                    response_text += chunk
                    self.storage.update_message_content(assistant_msg_id, response_text, status="incomplete")
                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
                    await asyncio.sleep(0.1)
            else:
                # Real LLM / assistant agent loop run
                async for event_str in run_assistant_chat(
                    secrets=secrets,
                    messages_history=messages_history,
                    rag_context=rag_context,
                    user_context=user_context,
                    active_artifact=active_artifact,
                    packed_context=packed["packed_context"],
                    tool_observer=audited_execute
                ):
                    # Check for cancellation
                    run = self.storage._get_connection().execute("SELECT status FROM chat_stream_runs WHERE id = ?", (run_id,)).fetchone()
                    if run and run["status"] == "cancelled":
                        yield f"data: {json.dumps({'type': 'cancelled', 'message': 'Generation cancelled by user'})}\n\n"
                        return

                    # Parse event content if it is chunk type or lesson_created
                    if event_str.startswith("data: "):
                        try:
                            evt = json.loads(event_str[6:].strip())
                            if evt.get("type") == "chunk":
                                response_text += evt.get("content", "")
                                self.storage.update_message_content(assistant_msg_id, response_text, status="incomplete")
                            elif evt.get("type") == "lesson_created":
                                # Extract existing metadata to merge
                                existing_msg = self.storage.get_message(assistant_msg_id)
                                existing_meta = existing_msg.get("metadata", {}) if existing_msg else {}
                                
                                # Extract structured metadata
                                session_id = evt.get("session_id") or f"teacher_{evt.get('workspace') or str(uuid.uuid4())}"
                                lesson_meta = {
                                    "session_id": session_id,
                                    "title": evt.get("title"),
                                    "note_path": evt.get("note_path") or evt.get("lesson_path"),
                                    "lesson_path": evt.get("lesson_path"),
                                    "hub_path": evt.get("hub_path"),
                                    "curriculum": evt.get("curriculum"),
                                    "workspace": evt.get("workspace"),
                                    "source_attachments": evt.get("source_attachments"),
                                    "warnings": evt.get("warnings"),
                                    "citations": evt.get("citations"),
                                    "source_job_id": evt.get("source_job_id"),
                                    "prompt_job_id": evt.get("prompt_job_id"),
                                    "current_concept_node_id": evt.get("current_concept_node_id"),
                                    "roadmap": evt.get("roadmap"),
                                    "coverage": evt.get("coverage"),
                                }
                                # Merge
                                merged_meta = {**existing_meta, **lesson_meta}
                                self.storage.update_message_content(assistant_msg_id, response_text, status="incomplete", metadata=merged_meta)
                            elif evt.get("type") == "prompt_teacher_job":
                                existing_msg = self.storage.get_message(assistant_msg_id)
                                existing_meta = existing_msg.get("metadata", {}) if existing_msg else {}
                                prompt_meta = {
                                    "prompt_job_id": evt.get("prompt_job_id") or evt.get("job_id"),
                                    "source_job_id": evt.get("job_id"),
                                    "prompt_teacher_status": evt.get("status"),
                                    "prompt_teacher_next_action": evt.get("next_action"),
                                    "roadmap": evt.get("roadmap"),
                                    "coverage": evt.get("coverage"),
                                    "warnings": evt.get("warnings"),
                                    "assumptions": evt.get("assumptions"),
                                }
                                self.storage.update_message_content(assistant_msg_id, response_text, status="incomplete", metadata={**existing_meta, **prompt_meta})
                        except Exception as e:
                            pass
                    
                    yield event_str

            # Success completion
            self.storage.update_message_content(assistant_msg_id, response_text, status="completed")
            self.storage.update_stream_run(run_id, status="completed")
            
            # Extract memories conservatively
            self.memory_manager.extract_memories_from_turn(
                conversation_id=conversation_id,
                user_message=user_message_content,
                assistant_response=response_text,
                message_id=user_msg_id
            )
            
            yield f"data: {json.dumps({'type': 'completed', 'content': response_text})}\n\n"
            
        except Exception as e:
            self.storage.update_stream_run(run_id, status="failed", error_text=str(e))
            self.storage.update_message_content(assistant_msg_id, response_text, status="failed")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            pass

    def cancel_stream_run(self, run_id: str) -> bool:
        """Marks run as cancelled so the generator stops."""
        return self.storage.update_stream_run(run_id, status="cancelled")

    def regenerate_message(self, conversation_id: str, assistant_message_id: str, secrets: AppSecrets) -> Optional[str]:
        """
        Creates a sibling assistant message from the same parent user message.
        """
        msg = self.storage.get_message(assistant_message_id)
        if not msg or msg["role"] != "assistant":
            return None
            
        parent_id = msg["parent_message_id"]
        if not parent_id:
            return None
            
        # Retrieve the user message content
        user_msg = self.storage.get_message(parent_id)
        if not user_msg:
            return None

        # Return parent user message content so caller can trigger stream_assistant_turn with same parent_id
        return user_msg["content"]

    def branch_from_message(self, conversation_id: str, message_id: str, new_content: str, secrets: AppSecrets) -> Dict[str, Any]:
        """
        Creates a new branch starting from an edited message.
        """
        # Find message
        msg = self.storage.get_message(message_id)
        if not msg:
            raise ValueError(f"Message not found: {message_id}")
            
        # Create a sibling user message with edited content
        parent_id = msg["parent_message_id"]
        edited_msg = self.storage.append_message(
            conv_id=conversation_id,
            role="user",
            content=new_content,
            status="completed",
            parent_message_id=parent_id
        )
        
        # Save branch record pointing to this edit leaf
        branch = self.storage.create_branch(
            conv_id=conversation_id,
            name=f"Branch {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            leaf_message_id=edited_msg["id"]
        )
        
        return {
            "branch_id": branch["id"],
            "new_user_message_id": edited_msg["id"],
            "branch": branch,
            "edited_msg": edited_msg
        }
