import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..pdf_extractor import load_pdf_robust
from .store import ChatStorage
from src.domains.ater.source_service import SourceIngestionService

class AttachmentManager:
    def __init__(self, storage: ChatStorage, vault_path: Optional[str] = None):
        self.storage = storage
        self.vault_path = Path(vault_path) if vault_path else None

    def extract_and_chunk(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Extracts content from a file and returns chunk metadata.
        Supported types: 'pdf', 'markdown', 'text', 'note' (Obsidian note), 'artifact'.
        """
        path = Path(file_path)
        if not path.exists() and file_type != 'note':
            raise FileNotFoundError(f"Attachment file not found: {file_path}")

        filename = path.name
        extracted_text = ""
        chunk_metadata = []

        if file_type == 'pdf':
            # PDF loader
            docs = load_pdf_robust(file_path)
            pages_content = []
            for idx, doc in enumerate(docs):
                content = doc.page_content if hasattr(doc, 'page_content') else ""
                page_num = idx + 1
                if hasattr(doc, 'metadata') and doc.metadata and 'page' in doc.metadata:
                    page_num = doc.metadata['page'] + 1
                pages_content.append(content)
                chunk_metadata.append({
                    "page": page_num,
                    "length": len(content),
                    "offset": len(extracted_text)
                })
                extracted_text += content + "\n"
        elif file_type in ('markdown', 'text'):
            with open(file_path, "r", encoding="utf-8") as f:
                extracted_text = f.read()
            # Simple chunking by paragraph or lines
            paragraphs = [p.strip() for p in extracted_text.split("\n\n") if p.strip()]
            offset = 0
            for idx, para in enumerate(paragraphs):
                chunk_metadata.append({
                    "paragraph": idx + 1,
                    "length": len(para),
                    "offset": offset
                })
                offset += len(para) + 2
        elif file_type == 'note':
            # Obsidian note: if vault_path is set, resolve relative path, otherwise read absolute
            full_path = path
            if self.vault_path and not path.is_absolute():
                full_path = self.vault_path / path
            
            if not full_path.exists():
                raise FileNotFoundError(f"Obsidian note not found: {full_path}")
                
            with open(full_path, "r", encoding="utf-8") as f:
                extracted_text = f.read()
            chunk_metadata.append({
                "note_path": str(path),
                "length": len(extracted_text),
                "offset": 0
            })
        elif file_type == 'artifact':
            # Simple text read of local artifact file
            with open(file_path, "r", encoding="utf-8") as f:
                extracted_text = f.read()
            chunk_metadata.append({
                "artifact_path": file_path,
                "length": len(extracted_text),
                "offset": 0
            })
        else:
            raise ValueError(f"Unsupported attachment file type: {file_type}")

        return {
            "filename": filename,
            "extracted_text": extracted_text,
            "chunk_metadata": chunk_metadata
        }

    def attach_file(self, conversation_id: str, file_path: str, file_type: str, message_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts, chunks and saves the file in the database.
        """
        extracted = self.extract_and_chunk(file_path, file_type)
        return self.storage.create_attachment(
            conv_id=conversation_id,
            filename=extracted["filename"],
            file_path=file_path,
            file_type=file_type,
            extracted_text=extracted["extracted_text"],
            chunk_metadata=extracted["chunk_metadata"],
            message_id=message_id
        )

    def get_attachments(self, conversation_id: str) -> List[Dict[str, Any]]:
        return self.storage.get_attachments(conversation_id)

    def promote_to_source_grounded_curriculum(self, attachment_id: str) -> Dict[str, Any]:
        """
        Promotes a chat attachment to the source ingestion structure for the curriculum planner.
        Returns the data structure expected by SourceGroundedPlanner.
        """
        # Fetch attachment from storage
        # We need to query by id. Since get_attachments fetches by conversation_id,
        # we can list attachments and filter by ID, or we add an API to get by ID.
        # Let's query all attachments in the database or resolve it.
        # To be simple, we can fetch from file_path directly.
        # But wait, let's query from storage. Let's list attachments in conversation
        # or list all attachments and filter.
        # Let's get the connection from storage and select.
        conn = self.storage._get_connection()
        try:
            row = conn.execute("SELECT * FROM chat_attachments WHERE id = ?", (attachment_id,)).fetchone()
            if not row:
                raise ValueError(f"Attachment not found: {attachment_id}")
            attachment = dict(row)
        finally:
            conn.close()

        file_path = attachment["file_path"]
        file_type = attachment["file_type"]

        if file_type == 'pdf':
            # Use SourceIngestionService to ingest the pdf
            ingestion_service = SourceIngestionService()
            ingested = ingestion_service.ingest_pdf(file_path)
            return ingested
        else:
            # Markdown/text fallback promotion
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return {
                "file_name": attachment["filename"],
                "pages": [{"page_number": 1, "content": content}],
                "warnings": []
            }
