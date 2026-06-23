import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.domains.teacher.router import router


def _sse_events(text: str):
    events = []
    for block in text.split("\n\n"):
        block = block.strip()
        if not block.startswith("data: "):
            continue
        events.append(json.loads(block.removeprefix("data: ")))
    return events


def test_lesson_preview_url_does_not_require_vault_header(tmp_path: Path):
    app = FastAPI()
    app.include_router(router, prefix="/api")
    client = TestClient(app)

    # Step 1: Initial request gets roadmap
    response_roadmap = client.post(
        "/api/teacher/chat",
        headers={"X-Vault-Path": str(tmp_path)},
        json={"history": [{"role": "user", "content": "Teach me recursion"}]},
    )
    assert response_roadmap.status_code == 200
    events_roadmap = _sse_events(response_roadmap.text)
    assert any("Roadmap" in event.get("content", "") or "mermaid" in event.get("content", "").lower() for event in events_roadmap if event.get("type") == "chunk")

    # Step 2: Confirmation request gets lesson
    response = client.post(
        "/api/teacher/chat",
        headers={"X-Vault-Path": str(tmp_path)},
        json={
            "history": [
                {"role": "user", "content": "Teach me recursion"},
                {"role": "assistant", "content": "Proposed roadmap: ```mermaid\ngraph TD\nA --> B\n```"},
                {"role": "user", "content": "confirm"},
            ]
        },
    )

    assert response.status_code == 200
    events = _sse_events(response.text)
    created = next(event for event in events if event["type"] == "lesson_created")
    preview_url = created["preview_url"]
    assert "/api/teacher/lesson/" in preview_url

    preview = client.get(preview_url)
    assert preview.status_code == 200
    assert "text/html" in preview.headers["content-type"]
    assert "Recursion" in preview.text
