import os
import tempfile
import pytest
import asyncio
from pathlib import Path
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
