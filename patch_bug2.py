import re

with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

# Replace get_practice_session
old_get = """    p = Path(path)
    if not p.is_absolute() or not p.exists():
        if secrets.vault_path:
            resolved_p = Path(secrets.vault_path) / path
            if resolved_p.exists():
                p = resolved_p
    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice not found")"""

new_get = """    try:
        p = resolve_vault_path(secrets.vault_path or ".", path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")

    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice not found")"""

content = content.replace(old_get, new_get)

# Replace update_practice_score
old_score = """    p = Path(path)
    if not p.is_absolute() or not p.exists():
        if secrets.vault_path:
            resolved_p = Path(secrets.vault_path) / path
            if resolved_p.exists():
                p = resolved_p
    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice file not found")"""

new_score = """    try:
        p = resolve_vault_path(secrets.vault_path or ".", path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")

    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice file not found")"""

content = content.replace(old_score, new_score)

with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
