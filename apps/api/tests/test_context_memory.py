import os
import tempfile
import pytest
from pathlib import Path
from src.domains.ater.chat_runtime import ChatStorage
from src.domains.ater.chat_runtime.memory import MemoryManager
from src.domains.ater.chat_runtime.context import ContextPacker

@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db_path = Path(path)
    yield db_path
    if db_path.exists():
        db_path.unlink()

def test_memory_management_and_isolation(temp_db):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    
    # 1. Create durable memory
    dur1 = mm.create_durable_memory("User prefers Outfit font.", confidence=0.95)
    assert dur1["scope"] == "durable"
    assert dur1["status"] == "accepted"
    
    # Pending memory (needs approval, should not be returned by list_memories until accepted)
    dur_pending = mm.create_durable_memory("User likes dark mode.", confidence=0.8, status="pending")
    assert dur_pending["status"] == "pending"
    
    # 2. Create session memory scoped to conversation A
    conv_a = storage.create_conversation("Chat A")["id"]
    conv_b = storage.create_conversation("Chat B")["id"]
    
    sess_a = mm.create_session_memory(conv_a, "Active task: Math tutor.")
    assert sess_a["scope"] == "session"
    assert sess_a["conversation_id"] == conv_a
    
    # 3. Retrieve memories for conversation A
    mems_a = mm.list_memories(conv_a)
    content_a = [m["content"] for m in mems_a]
    assert "User prefers Outfit font." in content_a
    assert "Active task: Math tutor." in content_a
    assert "User likes dark mode." not in content_a  # pending
    
    # 4. Retrieve memories for conversation B (session memory A must be isolated!)
    mems_b = mm.list_memories(conv_b)
    content_b = [m["content"] for m in mems_b]
    assert "User prefers Outfit font." in content_b
    assert "Active task: Math tutor." not in content_b  # isolated
    
    # 5. Delete memory
    mm.storage.delete_memory(dur1["id"])
    mems_b_post_delete = mm.list_memories(conv_b)
    assert len(mems_b_post_delete) == 0

def test_conservative_memory_extraction(temp_db):
    storage = ChatStorage(temp_db)
    mm = MemoryManager(storage)
    
    conv_id = storage.create_conversation("Extraction test")["id"]
    
    # Heuristic matching: user preferences
    extracted = mm.extract_memories_from_turn(
        conversation_id=conv_id,
        user_message="Remember that I prefer dark mode and clean UI.",
        assistant_response="Sure, I will keep that in mind.",
        message_id="msg-1"
    )
    assert len(extracted) == 1
    assert extracted[0]["scope"] == "durable"
    assert extracted[0]["status"] == "pending"
    assert "dark mode" in extracted[0]["content"]

    # Heuristic matching: session task
    extracted_sess = mm.extract_memories_from_turn(
        conversation_id=conv_id,
        user_message="In this chat, I want to learn calculus.",
        assistant_response="Let's start with limits.",
        message_id="msg-2"
    )
    assert len(extracted_sess) == 1
    assert extracted_sess[0]["scope"] == "session"
    assert extracted_sess[0]["status"] == "accepted"
    assert "calculus" in extracted_sess[0]["content"]

def test_context_packing_and_budget_clipping(temp_db):
    storage = ChatStorage(temp_db)
    packer = ContextPacker(storage)
    
    conv = storage.create_conversation("Context Packing")
    cid = conv["id"]
    
    # Append user and assistant messages
    msg_u = storage.append_message(cid, "user", "I want to study limit theorems.")
    msg_a = storage.append_message(cid, "assistant", "Sure, let's explore limits.")
    
    # Durable and session memories
    durable_memories = [{"content": "User prefers python code."}]
    session_memories = [{"content": "Session is about limits."}]
    rag_context = ["Limit definition: f(x) approaches L as x approaches c."]
    attachments = [{"filename": "notes.md", "extracted_text": "Limit of 1/x as x goes to infinity is 0."}]
    
    # 1. Normal context packing (fits in budget)
    res = packer.pack_context(
        conversation_id=cid,
        current_request="Show me a limit proof.",
        system_prompt="You are a helpful tutor.",
        durable_memories=durable_memories,
        session_memories=session_memories,
        rag_context=rag_context,
        attachments=attachments,
        token_budget=1000
    )
    assert res["snapshot_id"] is not None
    assert "rag_context" in res["packed_context"]
    assert "durable_memories" in res["packed_context"]
    assert "attachments" in res["packed_context"]
    
    # 2. Strict budget clipping (e.g. token_budget is tiny, forcing exclusion of low priority elements)
    res_clipped = packer.pack_context(
        conversation_id=cid,
        current_request="Show me a limit proof.",
        system_prompt="You are a helpful tutor.",
        durable_memories=durable_memories,
        session_memories=session_memories,
        rag_context=rag_context,
        attachments=attachments,
        token_budget=30  # very low budget!
    )
    # Lower priority elements (like tool state, prior messages, RAG, active artifact, etc.) should be excluded
    # Only essential system prompt & current request should fit
    assert "rag_context" not in res_clipped["packed_context"]
    assert res_clipped["snapshot_data"]["exclusion_reasons"]["rag_context"] == "budget exceeded"

def test_rolling_summary_creation(temp_db):
    storage = ChatStorage(temp_db)
    packer = ContextPacker(storage)
    
    conv = storage.create_conversation("Rolling Summary")
    cid = conv["id"]
    
    # Append 16 messages to trigger summary
    parent_id = None
    for i in range(8):
        mu = storage.append_message(cid, "user", f"message user {i}", parent_message_id=parent_id)
        ma = storage.append_message(cid, "assistant", f"message assistant {i}", parent_message_id=mu["id"])
        parent_id = ma["id"]
        
    summary = packer.generate_rolling_summary(cid, max_messages_before_summary=15)
    assert summary is not None
    assert "Rolling Summary" in summary
    
    # Fetch from db
    saved_summary = storage.get_summary(cid)
    assert saved_summary is not None
    assert saved_summary["summary"] == summary
