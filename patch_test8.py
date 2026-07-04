with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Starlette seems to aggressively strip `/../` sequences out of the path *before* it even matches paths.
# If Starlette collapses `/api/ater/notes/dir/../../escape.md/restore` it becomes `/api/ater/escape.md/restore`.
# Which doesn't match `/api/ater/notes/{note_path:path}/restore`.
# What about passing an absolute path in the `{note_path:path}` like `/etc/passwd`? 
# Wait, if `resolve_vault_path` decodes the string, what if we use URL encoded characters for the dots and slashes?
# Like `%2e%2e%2f` instead of `..%2f` so Starlette doesn't parse it as a path segment traversal. Wait, `%2f` is a slash. 
# FastAPI `TestClient` parses the URL using httpx which might do client-side path normalization.
# Let's use `app.url_path_for` or pass the params directly to bypass TestClient URL normalization.
# Actually, TestClient normalizes `..` in URL strings before sending to ASGI app!
# We need to construct the Request manually or just use a path like `dir/..%2f..%2fescape.md` without literal `/` for the dots.

content = content.replace('"/api/ater/notes/dir%2F..%2F..%2Fescape.md/restore"', '"/api/ater/notes/dir%2F%2E%2E%2F%2E%2E%2Fescape.md/restore"')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
