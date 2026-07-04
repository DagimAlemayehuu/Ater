with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Replace encoded slash for note version restore because Starlette will resolve it to 404 since encoded slashes aren't matched by default in path params unless configured
content = content.replace('"/api/ater/notes/%2E%2E%2Fescape.md/restore"', '"/api/ater/notes/..%2Fescape.md/restore"')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
