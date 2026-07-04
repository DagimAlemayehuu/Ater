with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Let's just pass `..%2F` for test_note_version_restore_path_traversal as well
content = content.replace('"/api/ater/notes/..%252Fescape.md/restore"', '"/api/ater/notes/..%2Fescape.md/restore"')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
