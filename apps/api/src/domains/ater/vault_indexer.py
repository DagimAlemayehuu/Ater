import hashlib
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from .academic_db import AcademicDB
from .embeddings_linker import EmbeddingsLinker

class VaultIndexer:
    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.db = AcademicDB(self.vault_path)
        self.linker = EmbeddingsLinker()

    def get_content_hash(self, content: str) -> str:
        return hashlib.md5(content.encode("utf-8")).hexdigest()

    def index_note(self, relative_path: str, content: str) -> bool:
        """Indexes a single note if its content hash has changed."""
        try:
            content_hash = self.get_content_hash(content)
            
            # Check cache in DB
            row = self.db.db.execute(
                "SELECT content_hash FROM note_embeddings WHERE note_path = ?", (relative_path,)
            ).fetchone()
            if row and row[0] == content_hash:
                return False  # Already indexed and unchanged
                
            # Extract plain text for embeddings (title + content body)
            title = Path(relative_path).stem.replace("_", " ")
            text_to_embed = f"{title}\n{content}"
            
            # Limit size to prevent massive embedding overhead
            text_to_embed = text_to_embed[:8000]
            
            # Get embedding
            embeddings = self.linker.get_embeddings([text_to_embed])
            if len(embeddings) > 0:
                vector = list(embeddings[0].astype(float))
                self.db.save_embedding(relative_path, content_hash, vector)
                return True
        except Exception as e:
            print(f"[VaultIndexer] Failed to index note {relative_path}: {e}")
        return False

    def index_vault(self):
        """Discovers and indexes all Markdown files in the vault under Notes/ and database/."""
        count = 0
        supported_dirs = ["Notes", "database"]
        for subdir in supported_dirs:
            dir_path = self.vault_path / subdir
            if not dir_path.exists() or not dir_path.is_dir():
                continue
            for f in dir_path.rglob("*.md"):
                if f.is_file() and not f.name.startswith("."):
                    try:
                        rel_path = f.relative_to(self.vault_path).as_posix()
                        with open(f, "r", encoding="utf-8") as file:
                            content = file.read()
                        if self.index_note(rel_path, content):
                            count += 1
                    except Exception:
                        pass
        return count

    def semantic_search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Searches across all notes using cosine similarity."""
        try:
            # 1. Embed query
            query_embs = self.linker.get_embeddings([query])
            if len(query_embs) == 0:
                return []
            query_vector = query_embs[0]
            
            # 2. Get all embeddings from db
            all_embs = self.db.get_all_embeddings()
            if not all_embs:
                return []
                
            # 3. Calculate similarities
            results = []
            for path, vector in all_embs.items():
                sim = float(np.dot(query_vector, np.array(vector)))
                results.append({
                    "path": path,
                    "title": Path(path).stem.replace("_", " "),
                    "similarity": sim
                })
                
            # 4. Sort and limit
            results.sort(key=lambda x: x["similarity"], reverse=True)
            return results[:limit]
        except Exception as e:
            print(f"[VaultIndexer] Semantic search failed: {e}")
            return []
