import re

with open("apps/api/src/api/routers/ater.py", "r") as f:
    content = f.read()

# Import resolve_vault_path
if "from src.utils.vault_path import resolve_vault_path" not in content:
    content = content.replace("from pathlib import Path\n", "from pathlib import Path\nfrom src.utils.vault_path import resolve_vault_path\n")

# read_obsidian_file
content = content.replace(
"""    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    full_path = Path(secrets.vault_path) / path""",
"""    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    try:
        full_path = resolve_vault_path(secrets.vault_path, path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")""")

# write_obsidian_file
content = content.replace(
"""    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    full_path = Path(secrets.vault_path) / path""",
"""    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    try:
        full_path = resolve_vault_path(secrets.vault_path, path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")""")

# delete_obsidian_item
content = content.replace(
"""    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    full_path = Path(secrets.vault_path) / path""",
"""    if not secrets.vault_path:
        raise HTTPException(status_code=400, detail="Vault Path missing")
        
    try:
        full_path = resolve_vault_path(secrets.vault_path, path)
    except ValueError:
        raise HTTPException(status_code=400, detail="Path escapes vault")""")


with open("apps/api/src/api/routers/ater.py", "w") as f:
    f.write(content)
