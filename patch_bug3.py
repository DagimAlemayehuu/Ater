with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

old_restore = """        full_path = Path(secrets.vault_path) / note_path
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(version["content"])"""

new_restore = """        try:
            full_path = resolve_vault_path(secrets.vault_path, note_path)
        except ValueError:
            raise HTTPException(status_code=400, detail="Path escapes vault")
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(version["content"])"""

content = content.replace(old_restore, new_restore)

with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
