import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import datetime
import re
from loguru import logger
from src.domains.vault.client import VaultManager
from src.domains.obsidian.client import ObsidianClient

class VaultIngestor:
    """
    Handles scanning and chunking of the Obsidian vault into the vector store.
    """

    def __init__(self, vault_manager: VaultManager, obsidian_client: ObsidianClient):
        self.vault_manager = vault_manager
        self.obsidian_client = obsidian_client

    def chunk_text(self, text: str, max_chunk_size: int = 1500, overlap: int = 200) -> List[str]:
        """
        Splits text into chunks by paragraphs or fixed length if necessary.
        """
        if not text or len(text) < 10:
            return []

        # Simple chunking by paragraph first
        paragraphs = re.split(r'\n\n+', text)
        chunks = []
        current_chunk = ""

        for p in paragraphs:
            if len(current_chunk) + len(p) <= max_chunk_size:
                current_chunk += p + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                
                # If a single paragraph is too large, split it by sentences or characters
                if len(p) > max_chunk_size:
                    # Very basic fallback: split by character limit
                    sub_chunks = [p[i:i+max_chunk_size] for i in range(0, len(p), max_chunk_size - overlap)]
                    chunks.extend(sub_chunks)
                    current_chunk = ""
                else:
                    current_chunk = p + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks

    async def sync_vault(self, force: bool = False):
        """
        Scans the vault and updates the vector store for changed or new files.
        """
        logger.info("Starting vault sync...")
        files = self.obsidian_client.list_files()
        
        # In a real scenario, we might want to query LanceDB for existing 'modified' times
        # to skip files that haven't changed. For now, we'll process all if force=True
        # or just process all and let merge_insert handle duplicates (though it's slower).
        
        total_chunks = 0
        for file_info in files:
            path = file_info["path"]
            modified = file_info["modified"]
            
            # TODO: Add logic to skip unchanged files by checking the index first
            
            content = self.obsidian_client.read_note(path)
            if not content:
                continue
                
            chunks = self.chunk_text(content)
            if not chunks:
                continue
            
            # Prepare chunks for upsert
            chunk_data = [
                {
                    "path": path,
                    "content": c,
                    "modified": modified
                } for c in chunks
            ]
            
            await self.vault_manager.upsert_chunks(chunk_data)
            total_chunks += len(chunks)
            
        logger.info(f"Vault sync complete. Processed {len(files)} files, {total_chunks} chunks.")
        return {"files_processed": len(files), "chunks_created": total_chunks}
