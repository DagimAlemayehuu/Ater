with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

old_tutor = """@router.post("/oracle/tutor/{note_path:path}")
async def oracle_tutor_session(
    note_path: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    user_message = payload.get("message")
    session_id = payload.get("session_id")
    if not user_message:
        raise HTTPException(status_code=400, detail="message is required")
    try:"""

new_tutor = """@router.post("/oracle/tutor/{note_path:path}")
async def oracle_tutor_session(
    note_path: str,
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    
    try:
        resolve_vault_path(secrets.vault_path, note_path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")
        
    user_message = payload.get("message")
    session_id = payload.get("session_id")
    if not user_message:
        raise HTTPException(status_code=400, detail="message is required")
    try:"""

content = content.replace(old_tutor, new_tutor)

with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
