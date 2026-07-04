with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

old_upload = """    inbox_dir = Path(effective_inbox)
    inbox_dir.mkdir(parents=True, exist_ok=True)
    
    target_path = inbox_dir / file.filename
    try:
        with open(target_path, "wb") as f:
            f.write(await file.read())
        return {
            "status": "success", 
            "file_name": file.filename, 
            "path": str(target_path.absolute())
        }"""

new_upload = """    inbox_dir = Path(effective_inbox)
    inbox_dir.mkdir(parents=True, exist_ok=True)
    
    safe_basename = Path(file.filename).name
    if not safe_basename or safe_basename == "." or safe_basename == "..":
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    target_path = inbox_dir / safe_basename
    if target_path.exists():
        import uuid
        safe_basename = f"{uuid.uuid4().hex[:8]}_{safe_basename}"
        target_path = inbox_dir / safe_basename
        
    try:
        with open(target_path, "wb") as f:
            f.write(await file.read())
        return {
            "status": "success", 
            "file_name": safe_basename, 
            "path": str(target_path.absolute())
        }"""

content = content.replace(old_upload, new_upload)

with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
