with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# FastAPI encodes the path differently or matches path params differently. 
# So maybe our URL encoding trick for note_path is failing to route correctly because Starlette interprets '%2F' as literal '/' but then matches it, but wait:
# let's look at the error: 404. Starlette's `{note_path:path}` matches anything, but we need to make sure the endpoint prefix is matched exactly.
# Note that we didn't add the `api/` prefix to the `ater/` routes in the main app router! Let's check `apps/api/src/api/main.py`.

# Actually, the failing tests are:
# response = client.post("/api/ater/notes/%2E%2E%2Fescape.md/restore", json={"version_id": "test"})
# and response = client.post("/api/oracle/tutor/../../../etc/passwd", json={"message": "hello", "session_id": "123"})
# But wait, looking at ater.py, the routes are registered as `@router.post("/ater/notes/{note_path:path}/restore")`
# Note there's NO `/api` prefix inside the `ater.py` file itself. The router might be included with a `/api` prefix, but let's see.

content = content.replace('"/api/ater/notes/%2E%2E%2Fescape.md/restore"', '"/api/ater/notes/%2E%2E%2Fescape.md/restore"') # keep
with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
