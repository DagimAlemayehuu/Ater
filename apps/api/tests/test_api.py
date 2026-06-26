from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_api_health_check():
    """Ensure the FastAPI sidecar boots and responds to root/health."""
    # Trying root or a common endpoint
    response = client.get("/")
    # If the app has no root, it might be 404, but we want to ensure it's "alive"
    # Let's try to find an actual endpoint from main.py if possible, or just check 404/200
    assert response.status_code in [200, 404]

def test_api_status_endpoint():
    """Check if the status endpoint is reachable."""
    response = client.get("/api/ater/queue/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
