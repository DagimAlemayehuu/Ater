with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

# Ah! The HTTP 404 is happening inside the `try` block before the traversal check!
# `version = db.get_version_by_id(version_id)` is returning None because our mock db has no version, and then it raises 404 Not Found before doing the path traversal check!
# I need to move the traversal check to the top of the endpoint!

old_restore = """    try:
        from src.domains.ater.academic_db import AcademicDB
        db = AcademicDB(Path(secrets.vault_path))
        version = db.get_version_by_id(version_id)
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        try:
            full_path = resolve_vault_path(secrets.vault_path, note_path)
        except ValueError:
            raise HTTPException(status_code=400, detail="Path escapes vault")
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(version["content"])
        return {"success": True}"""

new_restore = """    try:
        full_path = resolve_vault_path(secrets.vault_path, note_path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")
        
    try:
        from src.domains.ater.academic_db import AcademicDB
        db = AcademicDB(Path(secrets.vault_path))
        version = db.get_version_by_id(version_id)
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
            
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(version["content"])
        return {"success": True}"""

content = content.replace(old_restore, new_restore)

with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
