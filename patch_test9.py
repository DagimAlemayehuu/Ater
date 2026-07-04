with open("apps/api/tests/routers/test_ater_traversal.py", "r") as f:
    content = f.read()

# Let's bypass TestClient URL normalization by manually constructing the ASGI scope, or just testing with an absolute path since `resolve_vault_path` would fail on `target.relative_to(base)`.
# If `note_path` is passed as an absolute path like `/etc/passwd`, it will be resolved as `base / "/etc/passwd"` which usually evaluates to `/etc/passwd` because `Path(base) / Path("/etc/passwd") == Path("/etc/passwd")`.
# Then `resolve_vault_path` will check if `/etc/passwd` is relative to `/tmp/mock_vault` which will raise ValueError.
# This should reliably return 400.

content = content.replace('"/api/ater/notes/dir%2F%2E%2E%2F%2E%2E%2Fescape.md/restore"', '"/api/ater/notes//etc/passwd/restore"')

with open("apps/api/tests/routers/test_ater_traversal.py", "w") as f:
    f.write(content)
