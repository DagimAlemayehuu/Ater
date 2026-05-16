from pathlib import Path
from typing import List, Dict, Any, Optional
import datetime

class ObsidianClient:
    """
    Ater Obsidian Vault Scanner.
    Provides local access to Markdown knowledge files.
    """

    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path)

    def is_valid_vault(self) -> bool:
        """
        Check if the path exists and contains an Obsidian-like structure.
        """
        return self.vault_path.exists() and self.vault_path.is_dir()

    def list_files(self, extensions: List[str] = [".md", ".pdf"]) -> List[Dict[str, Any]]:
        """
        Recursively lists all supported files and directories in the vault.
        """
        if not self.is_valid_vault():
            print(f"[ObsidianClient] Invalid or missing vault path: {self.vault_path}")
            return []

        items = []
        try:
            abs_vault = self.vault_path.absolute()
            print(f"[ObsidianClient] Scanning: {abs_vault}")
            
            # Using rglob("*") to find everything
            for entry in abs_vault.rglob("*"):
                # Skip hidden folders like .obsidian and anything inside them
                if ".obsidian" in entry.parts:
                    continue

                try:
                    rel_path = str(entry.relative_to(abs_vault))
                    
                    if entry.is_dir():
                        items.append({
                            "name": entry.name,
                            "path": rel_path,
                            "is_dir": True
                        })
                    elif entry.suffix.lower() in [ext.lower() for ext in extensions]:
                        stats = entry.stat()
                        items.append({
                            "name": entry.name,
                            "path": rel_path,
                            "is_dir": False,
                            "size": stats.st_size,
                            "modified": datetime.datetime.fromtimestamp(stats.st_mtime).isoformat()
                        })
                except Exception as e:
                    print(f"[ObsidianClient] Skip entry {entry}: {e}")
            
            print(f"[ObsidianClient] Found {len(items)} items.")
        except Exception as e:
            print(f"[ObsidianClient] Scan error: {e}")
            
        return items

    def read_note(self, relative_path: str) -> Optional[Dict[str, Any]]:
        """
        Reads the content of a specific note and its frontmatter.
        """
        import frontmatter
        full_path = self.vault_path / relative_path
        if full_path.exists() and full_path.is_file():
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    post = frontmatter.load(f)
                    return {
                        "metadata": post.metadata,
                        "content": post.content
                    }
            except Exception as e:
                print(f"[ObsidianClient] Error reading {relative_path}: {e}")
                return None
        return None

    def write_note(self, relative_path: str, content: str) -> bool:
        """
        Writes (creates or updates) a specific note atomically to prevent race 
        conditions with Obsidian's internal indexer.
        """
        import uuid
        import os
        full_path = self.vault_path / relative_path
        # Ensure parent directory exists
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Create a hidden tmp file in the SAME directory to ensure it is on the same disk drive
        # (Required for os.replace to be atomic)
        tmp_path = full_path.with_suffix(f".{uuid.uuid4().hex[:8]}.tmp")
        
        try:
            # Write to the temporary file first
            with open(tmp_path, "w", encoding="utf-8") as f:
                f.write(content)
            
            # Atomically swap the tmp file into the target file.
            os.replace(tmp_path, full_path)
            return True
        except Exception as e:
            print(f"[ObsidianClient] Failed atomic write for {relative_path}: {e}")
            if tmp_path.exists():
                tmp_path.unlink() # Cleanup orphaned tmp file
            return False

    def delete_item(self, relative_path: str) -> bool:
        """
        Deletes a specific note or folder (recursively).
        """
        import shutil
        full_path = self.vault_path / relative_path
        
        # Security check: ensure the path is within the vault
        try:
            full_path.resolve().relative_to(self.vault_path.resolve())
        except ValueError:
            print(f"[ObsidianClient] Security error: Attempted to delete outside vault: {full_path}")
            return False

        if full_path.exists():
            if full_path.is_file():
                full_path.unlink()
                return True
            elif full_path.is_dir():
                shutil.rmtree(full_path)
                return True
        return False

    def rename_item(self, old_relative_path: str, new_relative_path: str) -> bool:
        """
        Renames or moves a file or folder.
        """
        old_path = self.vault_path / old_relative_path
        new_path = self.vault_path / new_relative_path

        # Security check
        try:
            old_path.resolve().relative_to(self.vault_path.resolve())
            new_path.parent.resolve().relative_to(self.vault_path.resolve())
        except ValueError:
            return False

        if old_path.exists():
            new_path.parent.mkdir(parents=True, exist_ok=True)
            old_path.rename(new_path)
            return True
        return False

    def create_folder(self, relative_path: str) -> bool:
        """
        Creates a new folder.
        """
        full_path = self.vault_path / relative_path
        
        # Security check
        try:
            full_path.resolve() # This might not work if it doesn't exist yet, but we can check the parent
            if full_path.exists(): return True
        except Exception: pass

        full_path.mkdir(parents=True, exist_ok=True)
        return True
