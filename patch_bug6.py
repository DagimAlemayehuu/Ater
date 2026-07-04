with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

new_route = """@router.post("/ater/interactive-quiz")
async def ater_interactive_quiz(
    payload: Dict[str, Any] = Body(...),
    secrets: AppSecrets = Depends(get_app_secrets)
):
    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault path missing")
    
    note_path = payload.get("note_path")
    if not note_path:
        raise HTTPException(status_code=400, detail="note_path is required")
        
    try:
        full_path = resolve_vault_path(secrets.vault_path, note_path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")
        
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Note file not found")
        
    try:
        from src.domains.ater.service import AterService
        service = AterService(secrets)
        # Using the same configuration format as generate_practice
        config = payload.get("config", {})
        # Note: In the absence of a dedicated interactive-quiz method, 
        # reusing generate_practice which takes a note path or hub ID
        return await service.generate_practice(note_path, config)
    except NotImplementedError:
         raise HTTPException(status_code=501, detail="Interactive quiz generation not yet fully wired")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""

# Insert right before regenerate_note_quiz
content = content.replace(
"""@router.post("/ater/notes/regenerate-quiz")""",
new_route + """@router.post("/ater/notes/regenerate-quiz")"""
)

with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
