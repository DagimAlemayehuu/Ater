import os
import lancedb
import pyarrow as pa
import pandas as pd
from typing import List, Dict, Any, Optional
from pathlib import Path
from google import genai
from google.genai import types
import datetime
import hashlib
from loguru import logger

class VaultManager:
    """
    Manages the LanceDB vector store for the Obsidian vault.
    Provides embedding generation and similarity search.
    """

    def __init__(self, vault_path: str, gemini_key: str):
        self.vault_path = Path(vault_path)
        self.db_path = self.vault_path / ".lifeos_index"
        self.db_path.mkdir(parents=True, exist_ok=True)
        
        self.gemini_key = gemini_key
        self.client = genai.Client(api_key=gemini_key)
        self.db = lancedb.connect(str(self.db_path))
        self.table_name = "vault_chunks"
        
        # Schema definition
        self.schema = pa.schema([
            pa.field("id", pa.string()),
            pa.field("path", pa.string()),
            pa.field("content", pa.string()),
            pa.field("vector", pa.list_(pa.float32(), 768)), # Gemini embedding-004 is 768
            pa.field("modified", pa.string()),
        ])

    def _get_table(self):
        """Returns the LanceDB table, creating it if it doesn't exist."""
        if self.table_name not in self.db.table_names():
            return self.db.create_table(self.table_name, schema=self.schema)
        return self.db.open_table(self.table_name)

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a list of strings using Gemini."""
        if not texts:
            return []
        
        try:
            # text-embedding-004 is the latest standard embedding model
            response = self.client.models.embed_content(
                model="text-embedding-004",
                contents=texts
            )
            return [e.values for e in response.embeddings]
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            raise

    async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Performs a vector similarity search."""
        table = self._get_table()
        query_vector = (await self.embed_texts([query]))[0]
        
        results = table.search(query_vector).limit(limit).to_list()
        # Clean up results for return (remove vector if needed or keep it)
        return results

    async def upsert_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Upserts a list of chunks into the vector store.
        Each chunk should have: path, content, modified.
        """
        if not chunks:
            return

        texts = [c["content"] for c in chunks]
        vectors = await self.embed_texts(texts)
        
        data = []
        for i, chunk in enumerate(chunks):
            # Generate a stable ID based on path and content hash
            content_hash = hashlib.md5(chunk["content"].encode()).hexdigest()
            chunk_id = f"{chunk['path']}_{content_hash}"
            
            data.append({
                "id": chunk_id,
                "path": chunk["path"],
                "content": chunk["content"],
                "vector": vectors[i],
                "modified": chunk["modified"]
            })
            
        table = self._get_table()
        table.merge_insert("id").when_matched_update_all().when_not_matched_insert_all().execute(data)
        logger.info(f"Upserted {len(data)} chunks to {self.table_name}")

    def delete_by_path(self, path: str):
        """Deletes all chunks associated with a specific file path."""
        table = self._get_table()
        table.delete(f'path = "{path}"')
        logger.info(f"Deleted chunks for path: {path}")

    def clear_index(self):
        """Removes the table entirely."""
        if self.table_name in self.db.table_names():
            self.db.drop_table(self.table_name)
            logger.warning(f"Dropped table {self.table_name}")
