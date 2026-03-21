import logging
from pathlib import Path
import os
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

    def index_file(self, file_path: str):
        """
        Reads a markdown file, chunks it, and indexes it.
        Deletes existing chunks for this file first to prevent duplication.
        """
        path = Path(file_path)
        if not path.exists() or not path.is_file() or path.suffix != '.md':
            return
            
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if not content.strip():
                self.chroma.delete_file_chunks(str(path))
                return

            # 1. Clean old chunks
            self.chroma.delete_file_chunks(str(path))
            
            # 2. Split by Markdown Headers
            md_docs = self.markdown_splitter.split_text(content)
            
            # 3. Fallback split if chunks are too big
            final_docs = self.char_splitter.split_documents(md_docs)
            
            if not final_docs:
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
            logger.info(f"Indexed {path.name} ({len(documents)} chunks)")
            
        except Exception as e:
            logger.error(f"Failed to index {file_path}: {e}")

    def remove_file(self, file_path: str):
        """Removes a file's chunks from the index."""
        logger.info(f"Removing {file_path} from index")
        self.chroma.delete_file_chunks(file_path)
