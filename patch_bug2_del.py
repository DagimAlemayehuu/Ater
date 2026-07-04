with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

old_del = """    p = Path(path)
    if not p.is_absolute() or not p.exists():
        if secrets.vault_path:
            resolved_p = Path(secrets.vault_path) / path
            if resolved_p.exists():
                p = resolved_p
    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice file not found")
        
    try:
        abs_p = p.resolve().absolute()
        abs_vault = Path(secrets.vault_path).resolve().absolute()
        if abs_vault not in abs_p.parents and abs_vault != abs_p:
             raise HTTPException(status_code=403, detail="Cannot delete files outside the vault")
             
        p.unlink()"""

new_del = """    try:
        p = resolve_vault_path(secrets.vault_path or ".", path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")

    if not p.exists():
        raise HTTPException(status_code=404, detail="Practice file not found")
        
    try:
        p.unlink()"""

content = content.replace(old_del, new_del)

with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
