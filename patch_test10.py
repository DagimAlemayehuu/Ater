with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Let's see what happens if we pass the parameter without leading slash, but inside the path as a single encoded segment. Wait, if we use TestClient or httpx to pass `%2Fetc%2Fpasswd` it will get decoded to `/etc/passwd`.
# Let's try passing something that `Path` interprets as going out of bounds, but doesn't have multiple slashes.
# But `resolve_vault_path` explicitly does:
# decoded_path = urllib.parse.unquote(user_path)
# We can just pass "%2E%2E%2Fescape.md" inside the test, but disable TestClient URL building and use the raw ASGI dictionary!
# Easier: Just replace the test block with an explicit assertion against the `resolve_vault_path` function directly, or use `client.request` with `url` object that doesn't normalize. 
# Alternatively, I can just change the test to pass `..` without slash. Like `..` ? No, `..` as a filename doesn't escape because it's equivalent to the root.
# What about passing a single `%2E%2E%2Fescape.md`? Starlette's `{note_path:path}` will receive it if we pass it with unnormalized URL.
# Instead of battling httpx's URL normalizer, I can just mock `resolve_vault_path` to throw ValueError, or just let Starlette 404 be acceptable for this test since Starlette is blocking it anyway.
# But the BUG was that URL-encoded traversal can escape.
# Wait, let's look at httpx docs, to prevent url normalization, use `httpx.URL`.
# Actually, the problem is httpx normalizes `..` even if it's encoded!
# We can just skip this specific integration test and rely on a unit test for `resolve_vault_path`? No, the bug explicitly says `Test: assert /api/ater/notes/%2E%2E%2Fescape.md/restore returns 400`
# Let's see if we can use a raw string for url like `client.post(b"/api/ater/notes/%2E%2E%2Fescape.md/restore")` - TestClient accepts bytes? No.
# If we use `client.post("http://testserver/api/ater/notes/%2E%2E%2Fescape.md/restore")`?
# I can just write `from src.utils.vault_path import resolve_vault_path` and assert it raises ValueError.
# Let's try `client.post("/api/ater/notes/escape..%2f..%2fetc/restore")` -> if we embed it, it might work.
# What if we pass `note_path` directly in `app` via `app({"type": "http", ...})` ASGI interface directly?

content = content.replace('def test_note_version_restore_path_traversal():\n    response = client.post("/api/ater/notes//etc/passwd/restore", json={"version_id": "test"})\n    assert response.status_code == 400',
'''def test_note_version_restore_path_traversal():
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/ater/notes/%2E%2E%2Fescape.md/restore",
        "raw_path": b"/api/ater/notes/%2E%2E%2Fescape.md/restore",
        "headers": [(b"host", b"testserver"), (b"content-type", b"application/json")],
    }
    
    async def mock_receive():
        return {"type": "http.request", "body": b\'{"version_id": "test"}\'}
        
    responses = []
    async def mock_send(message):
        if message["type"] == "http.response.start":
            responses.append(message["status"])
            
    import asyncio
    asyncio.run(app(scope, mock_receive, mock_send))
    assert responses[0] == 400''')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
