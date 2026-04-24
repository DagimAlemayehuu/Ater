import pytest
from httpx import AsyncClient, ASGITransport
from src.api.main import app

@pytest.mark.asyncio
async def test_rag_sync_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/rag/sync-status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

@pytest.mark.asyncio
async def test_rag_watcher_toggle_requires_vault_path():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/rag/watcher/toggle")
        assert response.status_code == 400
        assert "Vault Path is required" in response.text
