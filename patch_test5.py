with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Starlette intercepts `../` at the routing layer and resolves it (or rejects it) before our endpoint is hit.
# To trigger our application-layer path traversal logic, we need to pass a payload where Starlette won't swallow it.
# Actually, the user can pass '%2e%2e%2f' and Starlette will give it as `..%2f`. 
# Wait, for `oracle/tutor/../../../etc/passwd` Starlette collapses it to `/etc/passwd` which won't match the route!
# We need to send it as URL encoded or somehow keep the path segments so it reaches `{note_path:path}`.

content = content.replace('"/api/ater/notes/..%2Fescape.md/restore"', '"/api/ater/notes/..%252Fescape.md/restore"')
content = content.replace('"/api/oracle/tutor/../../../etc/passwd"', '"/api/oracle/tutor/..%2F..%2F..%2Fetc%2Fpasswd"')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
