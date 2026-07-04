with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Add missing ASGI keys to scope
content = content.replace('"raw_path": b"/api/ater/notes/%2E%2E%2Fescape.md/restore",', '"raw_path": b"/api/ater/notes/%2E%2E%2Fescape.md/restore",\n        "query_string": b"",\n        "client": ("127.0.0.1", 8000),')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
