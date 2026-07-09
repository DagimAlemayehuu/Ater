import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.api.deps import get_app_secrets, AppSecrets
from src.api.routers.ai import get_chat_runtime_components
from unittest.mock import MagicMock
import os
import tempfile
import shutil

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest.fixture
def mock_secrets():
    return AppSecrets(ai_key="test_key", ai_provider="test_provider")

@pytest.fixture
def mock_storage():
    storage = MagicMock()
    return storage

@pytest.fixture
def client(test_client, mock_secrets, mock_storage):
    def override_secrets():
        return mock_secrets
    
    def override_components():
        return {"storage": mock_storage, "streaming_manager": MagicMock(), "attachment_manager": MagicMock()}

    app.dependency_overrides[get_app_secrets] = override_secrets
    app.dependency_overrides[get_chat_runtime_components] = override_components
    
    yield test_client
    
    app.dependency_overrides.clear()

def test_single_artifact_generate_route():
    def find_route(routes, target_path, prefix=''):
        found = []
        for r in routes:
            r_path = getattr(r, 'path', None)
            full_path = prefix + (r_path or '')
            if r_path and full_path == target_path:
                found.append(r)

            if hasattr(r, 'router'):
                found.extend(find_route(r.router.routes, target_path, full_path))
            elif hasattr(r, 'original_router'):
                # In main.py prefix is /api
                found.extend(find_route(r.original_router.routes, target_path, prefix + '/api'))
        return found

    routes = find_route(app.routes, "/api/ater/artifact/generate")
            
    assert len(routes) == 1
    # Check that it is the route in ater.py
    assert routes[0].endpoint.__name__ == "generate_artifacts_endpoint"

def test_upload_temp_cleanup(client, tmp_path, monkeypatch):
    test_file_content = b"test content"
    
    # Check if a file leak happened in the current working dir
    initial_files = set(os.listdir("."))
    
    response = client.post(
        "/api/ai/upload",
        files={"file": ("test_file.txt", test_file_content, "text/plain")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "test_file.txt"
    assert data["file_uri"] == "temp:test_file.txt"
    
    final_files = set(os.listdir("."))
    new_files = final_files - initial_files
    
    # There should be no new files in the working directory
    # Ignore any pycache or unrelated files if necessary, but explicitly check for "temp_" or similar leaks
    temp_leaks = [f for f in new_files if f.startswith("temp_") or "ater_upload" in f]
    assert len(temp_leaks) == 0

def test_upload_sanitizes_filename(client):
    response = client.post(
        "/api/ai/upload",
        files={"file": ("../escape.txt", b"test content", "text/plain")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "escape.txt"
    assert data["file_uri"] == "temp:escape.txt"

def test_soft_delete_message_gate(client, mock_storage):
    # Setup mock storage to return a soft-deleted conversation
    mock_storage.get_conversation.return_value = {"id": "conv1", "deleted_at": "2023-01-01T00:00:00Z"}
    
    response = client.get("/api/chat/conversations/conv1/messages")
    assert response.status_code == 404
    assert response.json()["detail"] == "Conversation not found"
    
    # It should work fine if not deleted
    mock_storage.get_conversation.return_value = {"id": "conv2", "deleted_at": None}
    mock_storage.get_messages.return_value = [{"id": "msg1", "content": "hello"}]
    
    response = client.get("/api/chat/conversations/conv2/messages")
    assert response.status_code == 200
    assert response.json() == [{"id": "msg1", "content": "hello"}]

def test_cross_conversation_branch_rejection(client, mock_storage):
    # Setup mock storage to return messages for a conversation
    mock_storage.get_messages.return_value = [{"id": "msg1"}]
    
    # Branching with a message ID not in the conversation should fail
    response = client.post(
        "/api/chat/conversations/conv1/branch",
        json={"message_id": "msg2", "content": "new branch"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Message does not belong to this conversation"
    
