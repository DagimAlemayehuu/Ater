from pathlib import Path
from urllib.parse import unquote

def resolve_vault_path(vault_root: str | Path, user_path: str | Path) -> Path:
    """
    Safely resolve user_path relative to vault_root.
    Raises ValueError if the resolved path escapes vault_root.
    Handles:
      - Relative paths: "notes/a.md" → /vault/notes/a.md
      - Traversal: "../escape" → raises ValueError
      - URL-encoded traversal: "%2E%2E%2Fescape" → raises ValueError
      - Absolute paths inside vault: "/vault/notes/a.md" → OK
      - Absolute paths outside vault: "/etc/passwd" → raises ValueError
    """
    # 1. Decode any percent-encoding in user_path
    decoded = unquote(str(user_path))
    # 2. Resolve vault root to absolute
    root = Path(vault_root).resolve()
    # 3. If decoded is absolute, check containment directly
    candidate = Path(decoded)
    if candidate.is_absolute():
        resolved = candidate.resolve()
    else:
        resolved = (root / decoded).resolve()
    # 4. Enforce containment
    try:
        resolved.relative_to(root)
    except ValueError:
        raise ValueError(f"Path escapes vault: {user_path!r}")
    return resolved

def is_safe_vault_path(vault_root: str | Path, user_path: str | Path) -> bool:
    """Return True if user_path safely resolves inside vault_root, False otherwise."""
    try:
        resolve_vault_path(vault_root, user_path)
        return True
    except ValueError:
        return False
