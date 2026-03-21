import logging
from pathlib import Path
import os
import json
from typing import List, Dict, Any

# Adjusting to current LangChain imports
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from src.domains.rag.vector_store import ChromaManager

logger = logging.getLogger(__name__)

class VaultIndexer:
    """
    Handles reading Obsidian markdown files, chunking them intelligently,
    and pushing them to the ChromaManager.
    """
    def __init__(self, chroma_manager: ChromaManager):
        self.chroma = chroma_manager
        # Track indexed mtimes to allow for incremental syncs
        self.persist_path = Path(self.chroma.persist_dir) / "indexed_mtimes.json"
        self.indexed_mtimes: Dict[str, float] = self._load_mtimes()
        
        # We split by headers first so chunks retain their context in the note
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
        self.markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
        
        # If a section under a header is still too long, we use a character splitter as a fallback
        self.char_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )

    def _load_mtimes(self) -> Dict[str, float]:
        """Loads mtimes from disk."""
        if self.persist_path.exists():
            try:
                with open(self.persist_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load indexed mtimes: {e}")
        return {}

    def clear_all(self):
        """Clears the entire ChromaDB and resets local tracker."""
        success = self.chroma.clear_db()
        if success:
            self.indexed_mtimes = {}
            self._save_mtimes()
            logger.info("ChromaDB and local mtimes tracking cleared successfully.")
        return success

    def _save_mtimes(self):
        """Saves mtimes to disk."""
        try:
            with open(self.persist_path, 'w') as f:
                json.dump(self.indexed_mtimes, f)
        except Exception as e:
            logger.error(f"Failed to save indexed mtimes: {e}")

    def index_file(self, file_path: str, force: bool = False, should_save: bool = True):
        """
        Reads a markdown file, chunks it, and indexes it.
        Deletes existing chunks for this file first to prevent duplication.
        If force is False, only indexes if the file has been modified since last index.
        """
        path = Path(file_path)
        if not path.exists() or not path.is_file() or path.suffix != '.md':
            return
            
        try:
            mtime = os.path.getmtime(path)
            if not force and self.indexed_mtimes.get(str(path)) == mtime:
                # Already indexed and not modified
                return

            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if not content.strip():
                self.chroma.delete_file_chunks(str(path))
                self.indexed_mtimes[str(path)] = mtime
                if should_save: self._save_mtimes()
                return

            # 1. Clean old chunks
            self.chroma.delete_file_chunks(str(path))
            
            # 2. Split by Markdown Headers
            md_docs = self.markdown_splitter.split_text(content)
            
            # 3. Fallback split if chunks are too big
            final_docs = self.char_splitter.split_documents(md_docs)
            
            if not final_docs:
                self.indexed_mtimes[str(path)] = mtime
                if should_save: self._save_mtimes()
                return
                
            documents = []
            metadatas = []
            ids = []
            
            for i, doc in enumerate(final_docs):
                documents.append(doc.page_content)
                
                # Combine markdown header metadata with file metadata
                meta = doc.metadata.copy()
                meta.update({
                    "source": str(path),
                    "filename": path.name,
                    "folder": path.parent.name
                })
                metadatas.append(meta)
                
                # Create a unique ID for each chunk
                ids.append(f"{path}_{i}")
                
            # 4. Push to Vector Store
            self.chroma.add_documents(documents=documents, metadatas=metadatas, ids=ids)
            self.indexed_mtimes[str(path)] = mtime
            
            # Save to disk (batch or immediate)
            if should_save:
                self._save_mtimes()
                
            logger.info(f"Indexed {path.name} ({len(documents)} chunks)")
            
        except Exception as e:
            logger.error(f"Failed to index {file_path}: {e}")

    def save_index(self):
        """Public method to force save the mtimes to disk."""
        self._save_mtimes()

    def remove_file(self, file_path: str, should_save: bool = True):
        """Removes a file's chunks from the vector store and tracking when deleted."""
        path_str = str(file_path)
        self.chroma.delete_file_chunks(path_str)
        if path_str in self.indexed_mtimes:
            self.indexed_mtimes.pop(path_str)
        if should_save:
            self._save_mtimes()
        logger.info(f"Removed chunks for deleted file: {file_path}")
