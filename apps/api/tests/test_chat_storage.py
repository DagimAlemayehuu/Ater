import os
import tempfile
import pytest
from pathlib import Path
from src.domains.ater.chat_runtime import ChatStorage

@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    db_path = Path(path)
    yield db_path
    if db_path.exists():
        db_path.unlink()

def test_schema_initialization(temp_db):
    storage = ChatStorage(temp_db)
    # Check that database file was created and tables can be queried
    conn = storage._get_connection()
    try:
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        table_names = [t["name"] for t in tables]
        assert "chat_conversations" in table_names
        assert "chat_messages" in table_names
        assert "chat_message_branches" in table_names
        assert "chat_attachments" in table_names
        assert "chat_summaries" in table_names
        assert "chat_memories" in table_names
        assert "chat_tool_calls" in table_names
        assert "chat_context_snapshots" in table_names
        assert "chat_stream_runs" in table_names
    finally:
        conn.close()

def test_conversation_crud(temp_db):
    storage = ChatStorage(temp_db)
    
    # 1. Create
    conv = storage.create_conversation(title="Test Chat", metadata={"test_key": "test_val"})
    assert conv["title"] == "Test Chat"
    assert conv["metadata"] == {"test_key": "test_val"}
    conv_id = conv["id"]
    
    # 2. Read
    fetched = storage.get_conversation(conv_id)
    assert fetched is not None
    assert fetched["title"] == "Test Chat"
    assert fetched["metadata"] == {"test_key": "test_val"}
    
    # 3. List
    convs = storage.list_conversations()
    assert len(convs) == 1
    assert convs[0]["id"] == conv_id
    
    # 4. Rename
    rename_ok = storage.rename_conversation(conv_id, "New Title")
    assert rename_ok
    fetched = storage.get_conversation(conv_id)
    assert fetched["title"] == "New Title"
    
    # 5. Metadata Update
    meta_ok = storage.update_conversation_metadata(conv_id, {"updated": True})
    assert meta_ok
    fetched = storage.get_conversation(conv_id)
    assert fetched["metadata"] == {"updated": True}
    
    # 6. Archive
    archive_ok = storage.archive_conversation(conv_id, archive=True)
    assert archive_ok
    fetched = storage.get_conversation(conv_id)
    assert fetched["archived"] == 1
    # list should exclude archived by default
    convs_no_archived = storage.list_conversations(include_archived=False)
    assert len(convs_no_archived) == 0
    # list with archived
    convs_with_archived = storage.list_conversations(include_archived=True)
    assert len(convs_with_archived) == 1
    
    # 7. Delete (Soft)
    delete_ok = storage.delete_conversation(conv_id, hard=False)
    assert delete_ok
    assert storage.get_conversation(conv_id) is None
    
    # 8. Delete (Hard)
    storage.create_conversation(title="Hard Delete", conv_id="hard-id")
    assert storage.get_conversation("hard-id") is not None
    assert storage.delete_conversation("hard-id", hard=True)
    assert storage.get_conversation("hard-id") is None

def test_message_persistence_and_branch_ancestry(temp_db):
    storage = ChatStorage(temp_db)
    conv = storage.create_conversation("Chat")
    cid = conv["id"]
    
    # 1. Append messages
    m1 = storage.append_message(cid, "system", "You are helpful.")
    m2 = storage.append_message(cid, "user", "Hello", parent_message_id=m1["id"])
    m3 = storage.append_message(cid, "assistant", "Hi!", parent_message_id=m2["id"])
    
    # Sibling branch (Regenerate)
    m3_sibling = storage.append_message(cid, "assistant", "Hello there!", parent_message_id=m2["id"])
    
    msgs = storage.get_messages(cid)
    assert len(msgs) == 4
    
    # 2. Ancestry check
    ancestry1 = storage.get_branch_ancestry(m3["id"])
    # should be: system -> user -> assistant (Hi!)
    assert len(ancestry1) == 3
    assert ancestry1[0]["id"] == m1["id"]
    assert ancestry1[1]["id"] == m2["id"]
    assert ancestry1[2]["id"] == m3["id"]
    
    ancestry2 = storage.get_branch_ancestry(m3_sibling["id"])
    # should be: system -> user -> assistant (Hello there!)
    assert len(ancestry2) == 3
    assert ancestry2[0]["id"] == m1["id"]
    assert ancestry2[1]["id"] == m2["id"]
    assert ancestry2[2]["id"] == m3_sibling["id"]
    
    # 3. Create branch record
    branch = storage.create_branch(cid, "Branch A", m3_sibling["id"])
    assert branch["leaf_message_id"] == m3_sibling["id"]
    
    branches = storage.get_branches(cid)
    assert len(branches) == 1
    assert branches[0]["id"] == branch["id"]
