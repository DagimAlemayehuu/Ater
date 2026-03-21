import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from langchain_huggingface import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

class ChromaManager:
    """
    Manages the local ChromaDB instance and the local embedding model.
    Uses 'all-MiniLM-L6-v2' to ensure peak memory usage remains under ~300MB.
    """
    def __init__(self, persist_directory: Optional[str] = None):
        # Default to a .lifeos directory in the user's home folder if not provided
        if not persist_directory:
            home_dir = Path.home()
            self.persist_dir = home_dir / ".lifeos" / "vector_store"
        else:
            self.persist_dir = Path(persist_directory)
            
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Initializing ChromaDB at {self.persist_dir}")
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=str(self.persist_dir),
            settings=Settings(
                anonymized_telemetry=False,
                is_persistent=True
            )
        )
        
        # Initialize Local Embeddings (Sentence Transformers)
        # all-MiniLM-L6-v2 is fast, tiny (~80MB), and perfect for personal RAG
        logger.info("Loading local embedding model: all-MiniLM-L6-v2...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': False}
        )
        
        # We will use one main collection for the entire Obsidian Vault
        self.collection_name = "lifeos_vault"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"ChromaDB initialized with collection: {self.collection_name}")

    def add_documents(self, documents: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        """
        Embeds and adds documents to the vector store.
        """
        if not documents:
            return
            
        try:
            # We use the raw chroma collection instead of the LangChain wrapper 
            # for more direct control over the local indexing process
            embeddings_list = self.embeddings.embed_documents(documents)
            
            self.collection.upsert(
                documents=documents,
                embeddings=embeddings_list,
                metadatas=metadatas,
                ids=ids
            )
            logger.debug(f"Upserted {len(documents)} chunks to ChromaDB.")
        except Exception as e:
            logger.error(f"Failed to add documents to ChromaDB: {e}")
            raise

    def query(self, query_text: str, n_results: int = 5, where: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Queries the vector store for the most relevant chunks.
        """
        try:
            query_embedding = self.embeddings.embed_query(query_text)
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where,
                include=["documents", "metadatas", "distances"]
            )
            
            formatted_results = []
            if results and results['documents'] and len(results['documents']) > 0:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        "content": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "distance": results['distances'][0][i]
                    })
                    
            return formatted_results
        except Exception as e:
            logger.error(f"Failed to query ChromaDB: {e}")
            return []

    def delete_file_chunks(self, file_path: str):
        """
        Deletes all chunks associated with a specific file path.
        This is crucial for updates/deletes in the Obsidian Watcher.
        """
        try:
            self.collection.delete(
                where={"source": file_path}
            )
            logger.debug(f"Deleted chunks for {file_path} from ChromaDB.")
        except Exception as e:
            logger.error(f"Failed to delete chunks for {file_path}: {e}")
