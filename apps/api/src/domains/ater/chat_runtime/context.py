import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from .store import ChatStorage

class ContextPacker:
    def __init__(self, storage: ChatStorage):
        self.storage = storage

    def estimate_tokens(self, text: str) -> int:
        try:
            import tiktoken
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
        except ImportError:
            # Word-based fallback estimation: approx 1 token = 4 characters or 0.75 words
            return max(1, len(text) // 4)

    def pack_context(
        self,
        conversation_id: str,
        current_request: str,
        system_prompt: str,
        durable_memories: List[Dict[str, Any]],
        session_memories: List[Dict[str, Any]],
        rag_context: List[str],
        attachments: List[Dict[str, Any]],
        active_artifact_context: Optional[str] = None,
        user_context: Optional[str] = None,
        tool_state: Optional[str] = None,
        token_budget: int = 8000
    ) -> Dict[str, Any]:
        """
        Packs context components into a single formatted prompt/payload within token_budget.
        Saves context snapshot in the database.
        """
        included_sections = []
        exclusion_reasons = {}
        token_counts = {}

        # 1. System Prompt & Current Request
        now_str = datetime.now().isoformat()
        sys_block = f"{system_prompt}\nCurrent Time: {now_str}"
        sys_tokens = self.estimate_tokens(sys_block)
        req_tokens = self.estimate_tokens(current_request)
        
        token_counts["system_prompt"] = sys_tokens
        token_counts["current_request"] = req_tokens
        current_used = sys_tokens + req_tokens

        # 2. Get active conversation summary
        summary_row = self.storage.get_summary(conversation_id)
        summary_text = summary_row["summary"] if summary_row else ""
        summary_block = f"Conversation Summary: {summary_text}" if summary_text else ""
        summary_tokens = self.estimate_tokens(summary_block) if summary_block else 0
        
        if summary_tokens > 0 and current_used + summary_tokens <= token_budget:
            current_used += summary_tokens
            token_counts["summary"] = summary_tokens
            included_sections.append("summary")
        elif summary_tokens > 0:
            exclusion_reasons["summary"] = "budget exceeded"

        # 3. Retrieve recent messages (last 6 messages)
        all_messages = self.storage.get_messages(conversation_id)
        # Filter completed or incomplete messages
        messages = [m for m in all_messages if m.get("status") in ("completed", "incomplete")]
        recent_messages = messages[-6:]
        prior_messages = messages[:-6]

        recent_msgs_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in recent_messages])
        recent_tokens = self.estimate_tokens(recent_msgs_str)
        
        if current_used + recent_tokens <= token_budget:
            current_used += recent_tokens
            token_counts["recent_messages"] = recent_tokens
            included_sections.append("recent_messages")
        else:
            # Clip recent messages if they exceed budget (unlikely for 6 messages, but guard rails are good)
            exclusion_reasons["recent_messages"] = "budget exceeded"

        # 4. Session memories
        session_str = "Session Memories:\n" + "\n".join([f"- {m['content']}" for m in session_memories]) if session_memories else ""
        session_tokens = self.estimate_tokens(session_str) if session_str else 0
        if session_tokens > 0 and current_used + session_tokens <= token_budget:
            current_used += session_tokens
            token_counts["session_memories"] = session_tokens
            included_sections.append("session_memories")
        elif session_tokens > 0:
            exclusion_reasons["session_memories"] = "budget exceeded"

        # 5. Durable memories
        durable_str = "Durable Memories:\n" + "\n".join([f"- {m['content']}" for m in durable_memories]) if durable_memories else ""
        durable_tokens = self.estimate_tokens(durable_str) if durable_str else 0
        if durable_tokens > 0 and current_used + durable_tokens <= token_budget:
            current_used += durable_tokens
            token_counts["durable_memories"] = durable_tokens
            included_sections.append("durable_memories")
        elif durable_tokens > 0:
            exclusion_reasons["durable_memories"] = "budget exceeded"

        # 6. Attachment excerpts
        attach_str = "Attachments:\n" + "\n".join([f"[{a['filename']}]: {a.get('extracted_text', '')[:1000]}" for a in attachments]) if attachments else ""
        attach_tokens = self.estimate_tokens(attach_str) if attach_str else 0
        if attach_tokens > 0 and current_used + attach_tokens <= token_budget:
            current_used += attach_tokens
            token_counts["attachments"] = attach_tokens
            included_sections.append("attachments")
        elif attach_tokens > 0:
            exclusion_reasons["attachments"] = "budget exceeded"

        # 7. Vault RAG
        rag_str = "Relevant Knowledge Snippets:\n" + "\n".join([f"- {s}" for s in rag_context]) if rag_context else ""
        rag_tokens = self.estimate_tokens(rag_str) if rag_str else 0
        if rag_tokens > 0 and current_used + rag_tokens <= token_budget:
            current_used += rag_tokens
            token_counts["rag_context"] = rag_tokens
            included_sections.append("rag_context")
        elif rag_tokens > 0:
            exclusion_reasons["rag_context"] = "budget exceeded"

        # 8. Active artifact context
        art_block = f"Active Artifact:\n{active_artifact_context}" if active_artifact_context else ""
        art_tokens = self.estimate_tokens(art_block) if art_block else 0
        if art_tokens > 0 and current_used + art_tokens <= token_budget:
            current_used += art_tokens
            token_counts["active_artifact_context"] = art_tokens
            included_sections.append("active_artifact_context")
        elif art_tokens > 0:
            exclusion_reasons["active_artifact_context"] = "budget exceeded"

        # 9. User context
        usr_block = f"User Context:\n{user_context}" if user_context else ""
        usr_tokens = self.estimate_tokens(usr_block) if usr_block else 0
        if usr_tokens > 0 and current_used + usr_tokens <= token_budget:
            current_used += usr_tokens
            token_counts["user_context"] = usr_tokens
            included_sections.append("user_context")
        elif usr_tokens > 0:
            exclusion_reasons["user_context"] = "budget exceeded"

        # 10. Prior messages (older conversation history)
        prior_msgs_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in prior_messages]) if prior_messages else ""
        prior_tokens = self.estimate_tokens(prior_msgs_str) if prior_msgs_str else 0
        if prior_tokens > 0 and current_used + prior_tokens <= token_budget:
            current_used += prior_tokens
            token_counts["prior_messages"] = prior_tokens
            included_sections.append("prior_messages")
        elif prior_tokens > 0:
            exclusion_reasons["prior_messages"] = "budget exceeded"

        # 11. Tool state
        tool_block = f"Recent Tool State:\n{tool_state}" if tool_state else ""
        tool_tokens = self.estimate_tokens(tool_block) if tool_block else 0
        if tool_tokens > 0 and current_used + tool_tokens <= token_budget:
            current_used += tool_tokens
            token_counts["tool_state"] = tool_tokens
            included_sections.append("tool_state")
        elif tool_tokens > 0:
            exclusion_reasons["tool_state"] = "budget exceeded"

        # Construct final packed prompt content or format
        packed_prompt = {
            "system_prompt": sys_block,
            "current_request": current_request,
            "summary": summary_block,
            "recent_messages": recent_msgs_str,
            "session_memories": session_str,
            "durable_memories": durable_str,
            "attachments": attach_str,
            "rag_context": rag_str,
            "active_artifact_context": art_block,
            "user_context": usr_block,
            "prior_messages": prior_msgs_str,
            "tool_state": tool_block
        }

        # Filter out sections not included
        final_packed = {}
        for sec in ["system_prompt", "current_request"] + included_sections:
            if packed_prompt.get(sec):
                final_packed[sec] = packed_prompt[sec]

        # Save snapshot
        snapshot_id = f"snap_{str(uuid.uuid4())}"
        snapshot_data = [
            {
                "included_sections": included_sections,
                "exclusion_reasons": exclusion_reasons,
                "token_counts": token_counts,
                "total_tokens": current_used,
                "budget": token_budget
            }
        ]
        
        # We need a user user message ID. For test/mocking, if there is no user message yet, we generate a dummy one or use the last one
        last_user_msg_id = None
        for m in reversed(recent_messages):
            if m["role"] == "user":
                last_user_msg_id = m["id"]
                break
        
        if not last_user_msg_id:
            last_user_msg_id = "dummy-msg-id"
            
        self.storage.create_context_snapshot(snapshot_id, conversation_id, last_user_msg_id, snapshot_data)

        return {
            "snapshot_id": snapshot_id,
            "packed_context": final_packed,
            "total_tokens": current_used,
            "snapshot_data": snapshot_data[0]
        }

    def generate_rolling_summary(self, conversation_id: str, max_messages_before_summary: int = 15) -> Optional[str]:
        """
        Creates or updates a rolling summary of the conversation if message count is large.
        Uses a deterministic fallback for offline / mocked mode.
        """
        messages = self.storage.get_messages(conversation_id)
        if len(messages) < max_messages_before_summary:
            return None
        
        # In a real system we would call LLM, in this offline-first codebase
        # we generate a high-quality deterministic fallback summary based on message topics/intents
        # and support mocked testing.
        topics = []
        for m in messages:
            if m["role"] == "user":
                content_lower = m["content"].lower()
                if "teach" in content_lower:
                    topics.append("user requested a roadmap on " + m["content"][:30])
                elif "learn" in content_lower:
                    topics.append("user asked to learn about " + m["content"][:30])
                elif "srs" in content_lower or "review" in content_lower:
                    topics.append("user reviewed spaced repetition cards")
                else:
                    topics.append("user discussed: " + m["content"][:30])
                    
        summary_text = "Rolling Summary: " + "; ".join(topics[-5:])
        last_msg_id = messages[-1]["id"]
        
        self.storage.set_summary(conversation_id, summary_text, last_msg_id)
        return summary_text
