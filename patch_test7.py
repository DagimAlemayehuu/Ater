with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Since `..%2Fescape.md` gets collapsed to 404 Not Found by starlette for `/restore` because Starlette resolves `..%2Fescape.md` against `/api/ater/notes/..%2Fescape.md/restore` which becomes `/api/ater/escape.md/restore` 
# Let's test with a path param that won't collapse out of the sub-router. E.g. `/api/ater/notes/valid_dir%2F..%2F..%2Fescape.md/restore`
content = content.replace('"/api/ater/notes/..%2Fescape.md/restore"', '"/api/ater/notes/dir%2F..%2F..%2Fescape.md/restore"')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
