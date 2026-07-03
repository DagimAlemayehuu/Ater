import pytest
import os
import json
from fastapi.testclient import TestClient
from src.api.main import app
from src.api.deps import AppSecrets, get_app_secrets

# We mock get_app_secrets to supply a test directory for sqlite database
@pytest.fixture
def mock_secrets(tmp_path):
    inbox = tmp_path / "Inbox"
    inbox.mkdir()
    
    secrets = AppSecrets(
        ai_key="mock-key",
        ai_provider="google",
        ai_model="gemini-2.0-flash",
        inbox_path=str(inbox),
        vault_path=str(tmp_path)
    )
    
    app.dependency_overrides[get_app_secrets] = lambda: secrets
    yield secrets
    app.dependency_overrides.pop(get_app_secrets, None)

def test_conversations_api(mock_secrets):
    client = TestClient(app)
    
    # 1. Create
    resp = client.post("/api/chat/conversations", json={"title": "Test API Chat", "metadata": {"test": True}})
    assert resp.status_code == 200
    conv = resp.json()
    assert conv["title"] == "Test API Chat"
    conv_id = conv["id"]
    
    # 2. Get
    resp_get = client.get(f"/api/chat/conversations/{conv_id}")
    assert resp_get.status_code == 200
    assert resp_get.json()["title"] == "Test API Chat"
    
    # 3. List
    resp_list = client.get("/api/chat/conversations")
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == 1
    
    # 4. Patch
    resp_patch = client.patch(f"/api/chat/conversations/{conv_id}", json={"title": "Renamed"})
    assert resp_patch.status_code == 200
    assert resp_patch.json()["success"] is True
    
    # 5. Get after patch
    resp_get2 = client.get(f"/api/chat/conversations/{conv_id}")
    assert resp_get2.json()["title"] == "Renamed"
    
    # 6. Archive
    resp_arch = client.post(f"/api/chat/conversations/{conv_id}/archive")
    assert resp_arch.status_code == 200
    assert resp_arch.json()["success"] is True
    
    # 7. Delete
    resp_del = client.delete(f"/api/chat/conversations/{conv_id}")
    assert resp_del.status_code == 200
    assert resp_del.json()["success"] is True

def test_messaging_and_stream_api(mock_secrets, tmp_path):
    client = TestClient(app)
    
    # Create conversation
    conv = client.post("/api/chat/conversations", json={"title": "Messaging"}).json()
    cid = conv["id"]
    
    # 1. Stream turn
    # Use streaming response endpoint with TestClient (SSE event stream)
    # Since TestClient supports stream=True / read_line(), we can verify chunking
    # Note: request requires ai_key which we mocked as "mock-key"
    with client.stream("POST", f"/api/chat/conversations/{cid}/stream", json={"message": "hello run tool"}) as r:
        assert r.status_code == 200
        lines = [line if isinstance(line, str) else line.decode("utf-8") for line in r.iter_lines() if line]
        
    assert len(lines) > 0
    assert any("run_start" in l for l in lines)
    assert any("chunk" in l for l in lines)
    
    # 2. Verify messages persisted in DB
    resp_msgs = client.get(f"/api/chat/conversations/{cid}/messages")
    assert resp_msgs.status_code == 200
    msgs = resp_msgs.json()
    assert len(msgs) == 2
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "assistant"
    assert msgs[1]["status"] == "completed"
    
    # 3. Retrieve tool calls for the assistant message
    ast_msg_id = msgs[1]["id"]
    resp_tools = client.get(f"/api/chat/messages/{ast_msg_id}/tools")
    assert resp_tools.status_code == 200
    tools = resp_tools.json()
    assert len(tools) == 1
    assert tools[0]["tool_name"] == "file_lister"
    assert tools[0]["status"] == "completed"

def test_append_message_preserves_metadata(mock_secrets):
    client = TestClient(app)
    conv = client.post("/api/chat/conversations", json={"title": "Metadata"}).json()
    cid = conv["id"]

    resp = client.post(
        f"/api/chat/conversations/{cid}/messages",
        json={
            "role": "assistant",
            "content": "Click **Start Lesson**",
            "metadata": {"sourceTeacherAction": {"sourceJobId": "srcjob_1"}},
        },
    )
    assert resp.status_code == 200
    assert resp.json()["metadata"]["sourceTeacherAction"]["sourceJobId"] == "srcjob_1"

    messages = client.get(f"/api/chat/conversations/{cid}/messages").json()
    assert messages[0]["metadata"]["sourceTeacherAction"]["sourceJobId"] == "srcjob_1"

def test_memories_api(mock_secrets):
    client = TestClient(app)
    
    # 1. Create Memory
    resp = client.post("/api/chat/memories", json={"scope": "durable", "content": "I like dark mode.", "confidence": 0.95})
    assert resp.status_code == 200
    mem = resp.json()
    assert mem["scope"] == "durable"
    assert mem["content"] == "I like dark mode."
    mem_id = mem["id"]
    
    # 2. List memories
    resp_list = client.get("/api/chat/memories")
    assert resp_list.status_code == 200
    assert len(resp_list.json()) == 1
    assert resp_list.json()[0]["id"] == mem_id
    
    # 3. Patch Memory (disable)
    resp_patch = client.patch(f"/api/chat/memories/{mem_id}", json={"enabled": False})
    assert resp_patch.status_code == 200
    assert resp_patch.json()["success"] is True
    
    # Now it should be excluded from active memories list
    assert len(client.get("/api/chat/memories").json()) == 0
    
    # 4. Delete memory
    resp_del = client.delete(f"/api/chat/memories/{mem_id}")
    assert resp_del.status_code == 200
    assert resp_del.json()["success"] is True

def test_regenerate_and_branch_api(mock_secrets):
    client = TestClient(app)
    
    # Create conversation
    conv = client.post("/api/chat/conversations", json={"title": "BranchRegen"}).json()
    cid = conv["id"]
    
    # 1. First stream to get messages
    with client.stream("POST", f"/api/chat/conversations/{cid}/stream", json={"message": "First message"}) as r:
        assert r.status_code == 200
        list(r.iter_lines())
        
    resp_msgs = client.get(f"/api/chat/conversations/{cid}/messages").json()
    assert len(resp_msgs) == 2
    ast_msg_id = resp_msgs[1]["id"]
    user_msg_id = resp_msgs[0]["id"]
    
    # 2. Test Regenerate API (streams response)
    with client.stream("POST", f"/api/chat/conversations/{cid}/regenerate", json={"message_id": ast_msg_id}) as r:
        assert r.status_code == 200
        lines = [line if isinstance(line, str) else line.decode("utf-8") for line in r.iter_lines() if line]
    assert len(lines) > 0
    assert any("chunk" in l for l in lines)
    
    # Check that a sibling assistant message was added
    resp_msgs2 = client.get(f"/api/chat/conversations/{cid}/messages").json()
    assert len(resp_msgs2) == 3 # user, assistant1, assistant2 (sibling)
    
    # 3. Test Branch API (streams response)
    with client.stream("POST", f"/api/chat/conversations/{cid}/branch", json={"message_id": user_msg_id, "content": "Edited message"}) as r:
        assert r.status_code == 200
        lines = [line if isinstance(line, str) else line.decode("utf-8") for line in r.iter_lines() if line]
    assert len(lines) > 0
    assert any("branch_created" in l for l in lines)
    assert any("chunk" in l for l in lines)
    
    # Check that another user message and assistant message were added
    resp_msgs3 = client.get(f"/api/chat/conversations/{cid}/messages").json()
    # Should contain: user1, assistant1, assistant2, user_edited, assistant_edited
    assert len(resp_msgs3) == 5
