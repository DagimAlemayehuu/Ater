import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import datetime

class ObsidianClient:
    """
    Life OS Obsidian Vault Scanner.
    Provides local access to Markdown knowledge files.
    """

    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path)

    def is_valid_vault(self) -> bool:
        """
        Check if the path exists and contains an Obsidian-like structure.
        """
        return self.vault_path.exists() and self.vault_path.is_dir()

    def list_files(self, extension: str = ".md") -> List[Dict[str, Any]]:
        """
        Recursively lists files in the vault.
        """
        if not self.is_valid_vault():
            print(f"[ObsidianClient] Invalid or missing vault path: {self.vault_path}")
            return []

        files = []
        try:
            abs_vault = self.vault_path.absolute()
            print(f"[ObsidianClient] Scanning: {abs_vault}")
            
            for file_path in abs_vault.rglob(f"*{extension}"):
                # Skip hidden folders like .obsidian
                if ".obsidian" in file_path.parts:
                    continue

                try:
                    stats = file_path.stat()
                    files.append({
                        "name": file_path.name,
                        "path": str(file_path.relative_to(abs_vault)),
                        "full_path": str(file_path.absolute()),
                        "modified": datetime.datetime.fromtimestamp(stats.st_mtime).isoformat(),
                        "size": stats.st_size,
                    })
                except Exception as e:
                    print(f"[ObsidianClient] Skip file {file_path}: {e}")
            
            print(f"[ObsidianClient] Found {len(files)} notes.")
        except Exception as e:
            print(f"[ObsidianClient] Scan error: {e}")
            
        return files

    def read_note(self, relative_path: str) -> Optional[str]:
        """
        Reads the content of a specific note.
        """
        full_path = self.vault_path / relative_path
        if full_path.exists() and full_path.is_file():
            with open(full_path, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def write_note(self, relative_path: str, content: str) -> bool:
        """
        Writes (creates or updates) a specific note.
        """
        full_path = self.vault_path / relative_path
        # Ensure parent directory exists
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True

    def delete_note(self, relative_path: str) -> bool:
        """
        Deletes a specific note.
        """
        full_path = self.vault_path / relative_path
        if full_path.exists() and full_path.is_file():
            full_path.unlink()
            return True
        return False
