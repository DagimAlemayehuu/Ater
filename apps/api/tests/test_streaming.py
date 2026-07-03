import os
import tempfile
import pytest
import asyncio
from pathlib import Path
from types import SimpleNamespace
from src.api.deps import AppSecrets
from src.domains.ater.chat_runtime import ChatStorage
from src.domains.ater.chat_runtime.memory import MemoryManager
from src.domains.ater.chat_runtime.attachments import AttachmentManager
from src.domains.ater.chat_runtime.streaming import StreamingManager

@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db_path = Path(path)
    yield db_path
    if db_path.exists():
        db_path.unlink()

@pytest.fixture
def secrets():
    return AppSecrets(
        ai_key="test-key",
        ai_provider="google",
        ai_model="gemini-2.0-flash",
        inbox_path=""
    )

@pytest.mark.asyncio
async def test_streaming_success_and_tool_audit(temp_db, secrets):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    am = AttachmentManager(storage)
    sm = StreamingManager(storage, mm, am)
    
    conv = storage.create_conversation("Stream Chat")
    cid = conv["id"]
    
    events = []
    async for event in sm.stream_assistant_turn(cid, "Hello! Please run tool.", secrets):
        events.append(event)
    print("EVENTS ARE:", events)
    assert len(events) > 0
    assert any("run_start" in e for e in events)
    assert any("chunk" in e for e in events)
    assert any("completed" in e for e in events)
    
    # Check messages in db
    msgs = storage.get_messages(cid)
    assert len(msgs) == 2
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "assistant"
    assert msgs[1]["status"] == "completed"
    assert "Hello! I am Ater Oracle" in msgs[1]["content"]
    start_event = next(e for e in events if "run_start" in e)
    import json
    start_payload = json.loads(start_event.replace("data: ", "").strip())
    assert start_payload["parent_message_id"] == msgs[0]["id"]

    # Check tool audits
    tc = storage.get_tool_calls(msgs[1]["id"])
    assert len(tc) == 1
    assert tc[0]["tool_name"] == "file_lister"
    assert tc[0]["arguments"] == {"cmd": "list_files", "secret_key": "[REDACTED]"} # redacted!
    assert tc[0]["status"] == "completed"
    assert tc[0]["result_summary"] == "Found 5 notes."
    assert tc[0]["emitted_actions"] == [{"action": "toast", "message": "Files listed"}]

@pytest.mark.asyncio
async def test_streaming_cancellation(temp_db, secrets):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    am = AttachmentManager(storage)
    sm = StreamingManager(storage, mm, am)
    
    conv = storage.create_conversation("Cancel Chat")
    cid = conv["id"]
    
    # Cancel run after first event
    generator = sm.stream_assistant_turn(cid, "Hello!", secrets)
    events = []
    
    async for event in generator:
        events.append(event)
        # Parse run_id to cancel
        if "run_start" in event:
            import json
            data = json.loads(event.replace("data: ", "").strip())
            run_id = data["run_id"]
            sm.cancel_stream_run(run_id)
            
    assert any("cancelled" in e for e in events)
    # The message should remain status="incomplete" in DB
    msgs = storage.get_messages(cid)
    assert msgs[1]["status"] == "incomplete"

def test_regenerate_and_branch(temp_db, secrets):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    am = AttachmentManager(storage)
    sm = StreamingManager(storage, mm, am)
    
    conv = storage.create_conversation("Regen Branch")
    cid = conv["id"]
    
    m1 = storage.append_message(cid, "user", "Topic A")
    m2 = storage.append_message(cid, "assistant", "Answer A", parent_message_id=m1["id"])
    
    # Sibling regeneration
    regen_prompt = sm.regenerate_message(cid, m2["id"], secrets)
    assert regen_prompt == "Topic A"
    
    # Branching from m1
    res = sm.branch_from_message(cid, m1["id"], "Edited Topic A", secrets)
    assert res["branch_id"] is not None
    assert res["new_user_message_id"] is not None
    
    # Verify branches in db
    branches = storage.get_branches(cid)
    assert len(branches) == 1
    assert branches[0]["leaf_message_id"] == res["new_user_message_id"]

@pytest.mark.asyncio
async def test_teach_anything_metadata_persistence(temp_db, secrets):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    am = AttachmentManager(storage)
    sm = StreamingManager(storage, mm, am)
    
    conv = storage.create_conversation("Teach Chat")
    cid = conv["id"]
    
    events = []
    async for event in sm.stream_assistant_turn(cid, "teach me machine learning", secrets):
        events.append(event)
        
    assert any("lesson_created" in e for e in events)
    
    # Retrieve messages and check metadata
    msgs = storage.get_messages(cid)
    assert len(msgs) == 2
    assistant_msg = msgs[1]
    assert assistant_msg["role"] == "assistant"
    
    meta = assistant_msg["metadata"]
    assert meta.get("session_id") == "real-session-999"
    assert meta.get("title") == "Machine Learning Foundations"
    assert meta.get("workspace") == "workspace-123"
    assert meta.get("note_path") == "courses/ML_Foundations.md"
    assert meta.get("lesson_path") == "courses/ML_Foundations_lesson.md"
    assert meta.get("hub_path") == "hubs/ML_Hub.md"
    assert meta.get("curriculum") == [{"chapter": "Intro"}]

@pytest.mark.asyncio
async def test_prompt_teacher_job_metadata_persistence(temp_db, monkeypatch):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    am = AttachmentManager(storage)
    sm = StreamingManager(storage, mm, am)

    conv = storage.create_conversation("Prompt Teacher Chat")
    cid = conv["id"]
    secrets = AppSecrets(
        ai_key="real-key",
        ai_provider="google",
        ai_model="gemini-2.0-flash",
        inbox_path=""
    )

    async def fake_run_assistant_chat(**kwargs):
        yield 'data: {"type":"chunk","content":"## Consumer Behavior - Learning Roadmap"}\n\n'
        yield 'data: {"type":"prompt_teacher_job","job_id":"promptjob_1","prompt_job_id":"promptjob_1","status":"roadmap_ready","next_action":"start_learning","roadmap":[{"title":"Budget Line"}],"coverage":{"remaining":["Budget Line"]},"warnings":[{"severity":"medium"}],"assumptions":["beginner default"]}\n\n'
        yield 'data: {"type":"lesson_created","session_id":"source_tutor_promptjob_1","source_job_id":"promptjob_1","prompt_job_id":"promptjob_1","current_concept_node_id":"concept_1","note_path":"SourceJobs/promptjob_1/Budget_Line.md","lesson_path":"SourceJobs/promptjob_1/Budget_Line.md","hub_path":"SourceJobs/promptjob_1/Prompt_Teacher_Hub.md","curriculum":["Budget Line"],"roadmap":[{"title":"Budget Line"}],"coverage":{"remaining":[]}}\n\n'

    import src.domains.ater.assistant as assistant_module
    monkeypatch.setattr(assistant_module, "run_assistant_chat", fake_run_assistant_chat)

    async for _event in sm.stream_assistant_turn(cid, "teach me consumer behavior", secrets):
        pass

    meta = storage.get_messages(cid)[1]["metadata"]
    assert meta["prompt_job_id"] == "promptjob_1"
    assert meta["source_job_id"] == "promptjob_1"
    assert meta["current_concept_node_id"] == "concept_1"
    assert meta["roadmap"] == [{"title": "Budget Line"}]
    assert meta["coverage"] == {"remaining": []}
    assert meta["assumptions"] == ["beginner default"]

@pytest.mark.asyncio
async def test_attached_source_lesson_promotes_to_source_job(temp_db, monkeypatch):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    am = AttachmentManager(storage)
    sm = StreamingManager(storage, mm, am)

    conv = storage.create_conversation("Source Chat")
    cid = conv["id"]
    source_path = temp_db.parent / "chapter.pdf"
    source_path.write_bytes(b"fake pdf bytes")
    storage.create_attachment(cid, "chapter.pdf", str(source_path), "pdf", "Consumer Preferences and utility.", [])

    fake_docs = [
        SimpleNamespace(page_content="CHAPTER THREE Theory of Consumer Behavior", metadata={"page": 0}),
        SimpleNamespace(
            page_content=(
                "Chapter objectives explain consumer preferences and utility "
                "derive and explain the budget line describe consumer equilibrium"
            ),
            metadata={"page": 1},
        ),
        SimpleNamespace(page_content="Budget Line: affordable bundles depend on income and prices.", metadata={"page": 2}),
    ]
    monkeypatch.setattr("src.domains.ater.source_service.load_pdf_robust", lambda _path: fake_docs)

    secrets = AppSecrets(
        ai_key="real-key",
        ai_provider="google",
        ai_model="gemini-2.0-flash",
        inbox_path=str(temp_db.parent),
    )

    events = []
    async for event in sm.stream_assistant_turn(cid, "teach me from this source", secrets):
        events.append(event)

    assert any('"type": "source_learning_job"' in event for event in events)
    assert not any("prompt_teacher_job" in event for event in events)
    meta = storage.get_messages(cid)[1]["metadata"]
    assert meta["source_job_id"].startswith("srcjob_")
    assert meta["source_teacher_next_action"] == "start_learning"
    assert meta["roadmap"]

@pytest.mark.asyncio
async def test_real_stream_path_forwards_tool_observer(temp_db, monkeypatch):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    am = AttachmentManager(storage)
    sm = StreamingManager(storage, mm, am)

    conv = storage.create_conversation("Observed Tools")
    cid = conv["id"]
    secrets = AppSecrets(
        ai_key="real-key",
        ai_provider="google",
        ai_model="gemini-2.0-flash",
        inbox_path=""
    )

    async def fake_run_assistant_chat(**kwargs):
        observer = kwargs.get("tool_observer")
        assert callable(observer)

        async def execute_fn(tool_name, tool_args):
            assert tool_name == "file_lister"
            assert tool_args["secret_token"] == "SENSITIVE"
            return 'ACTION:{"action":"toast","message":"Audited"}'

        await observer("file_lister", {"secret_token": "SENSITIVE"}, execute_fn)
        yield 'data: {"type":"chunk","content":"Audited response"}\n\n'

    import src.domains.ater.assistant as assistant_module
    monkeypatch.setattr(assistant_module, "run_assistant_chat", fake_run_assistant_chat)

    events = []
    async for event in sm.stream_assistant_turn(cid, "please use a real tool", secrets):
        events.append(event)

    assert not any('"type":"error"' in event.replace(" ", "") for event in events)
    msgs = storage.get_messages(cid)
    tool_calls = storage.get_tool_calls(msgs[1]["id"])
    assert len(tool_calls) == 1
    assert tool_calls[0]["tool_name"] == "file_lister"
    assert tool_calls[0]["arguments"] == {"secret_token": "[REDACTED]"}
    assert tool_calls[0]["emitted_actions"] == [{"action": "toast", "message": "Audited"}]

@pytest.mark.asyncio
async def test_regenerate_history_ends_at_parent_user_message(temp_db, monkeypatch):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    am = AttachmentManager(storage)
    sm = StreamingManager(storage, mm, am)

    conv = storage.create_conversation("Regenerate History")
    cid = conv["id"]
    user_msg = storage.append_message(cid, "user", "Explain photosynthesis")
    storage.append_message(cid, "assistant", "Old answer", parent_message_id=user_msg["id"])
    storage.append_message(cid, "assistant", "", status="completed", parent_message_id=user_msg["id"])

    secrets = AppSecrets(
        ai_key="real-key",
        ai_provider="google",
        ai_model="gemini-2.0-flash",
        inbox_path=""
    )

    async def fake_run_assistant_chat(**kwargs):
        history = kwargs["messages_history"]
        assert history[-1] == {"role": "user", "content": "Explain photosynthesis"}
        assert not any(m["role"] == "assistant" and m["content"] in ("Old answer", "") for m in history)
        yield 'data: {"type":"chunk","content":"New regenerated answer"}\n\n'

    import src.domains.ater.assistant as assistant_module
    monkeypatch.setattr(assistant_module, "run_assistant_chat", fake_run_assistant_chat)

    events = []
    async for event in sm.stream_assistant_turn(
        cid,
        user_msg["content"],
        secrets,
        parent_message_id=user_msg["id"],
        is_regenerate=True,
    ):
        events.append(event)

    assert any("New regenerated answer" in event for event in events)
    msgs = storage.get_messages(cid)
    regenerated = msgs[-1]
    assert regenerated["role"] == "assistant"
    assert regenerated["parent_message_id"] == user_msg["id"]
    assert regenerated["content"] == "New regenerated answer"

def test_source_grounded_lesson_prompt_uses_attachment_title_and_excerpt():
    from src.domains.ater.assistant import _source_grounded_lesson_prompt

    prompt = _source_grounded_lesson_prompt(
        "Teach me from this source.",
        {
            "attachments": (
                "Attachments:\n"
                "[AI_for_Wellness_Tools,_Trends_&_Startup_Opportunities_pptx.pdf]: "
                "WELLNESS HACKATHON 2026\nAI FOR WELLNESS\nTools, Trends & Opportunities"
            )
        },
    )

    assert prompt is not None
    assert "AI for Wellness Tools" in prompt
    assert "WELLNESS HACKATHON 2026" in prompt
    assert "Teach me from this source" not in prompt

def test_lesson_detection_uses_latest_user_request_only():
    from src.domains.ater.assistant import _is_lesson_request

    is_lesson, topic = _is_lesson_request([
        {"role": "user", "content": "Teach me from this source"},
        {"role": "assistant", "content": "## AI for Wellness — Learning Roadmap"},
        {"role": "user", "content": "who is the prime minister of ethiopia as of today"},
    ])

    assert is_lesson is False
    assert topic == ""
