import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from ..pdf_extractor import load_pdf_robust
from .store import ChatStorage
from src.domains.ater.source_service import SourceLearningJobService

class AttachmentManager:
    def __init__(self, storage: ChatStorage, vault_path: Optional[str] = None, inbox_path: Optional[str] = None):
        self.storage = storage
        self.vault_path = Path(vault_path) if vault_path else None
        self.inbox_path = Path(inbox_path) if inbox_path else Path(storage.db_path).parent

    def extract_and_chunk(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Extracts content from a file and returns chunk metadata.
        Supported types: 'pdf', 'markdown', 'text', 'note' (Obsidian note), 'artifact'.
        """
        path = Path(file_path)
        
        # Helper to check if child path resolves inside parent path
        def is_subpath(child: Path, parent: Path) -> bool:
            try:
                # We use resolve() to handle symlinks and relative parts cleanly
                child.resolve().relative_to(parent.resolve())
                return True
            except ValueError:
                return False

        # Safety Check: only allow approved roots
        if file_type == 'note':
            resolved_path = path if path.is_absolute() else (self.vault_path / path if self.vault_path else path)
            if not self.vault_path or not is_subpath(resolved_path, self.vault_path):
                raise ValueError("Access Denied: Obsidian note must reside inside the vault.")
        elif file_type == 'artifact':
            # Artifacts should not require arbitrary path reads. Allow inside workspace or vault or inbox.
            # If path is arbitrary and not in approved roots, reject.
            in_inbox = self.inbox_path and is_subpath(path, self.inbox_path)
            in_vault = self.vault_path and is_subpath(path, self.vault_path)
            # Allow workspace path if in current folder or app folder
            in_workspace = is_subpath(path, Path(".").resolve())
            if not in_inbox and not in_vault and not in_workspace:
                raise ValueError("Access Denied: Artifact path must reside inside the workspace, vault, or inbox.")
        else:
            # pdf, markdown, text must reside in inbox_path or vault_path
            in_inbox = self.inbox_path and is_subpath(path, self.inbox_path)
            in_vault = self.vault_path and is_subpath(path, self.vault_path)
            if not in_inbox and not in_vault:
                raise ValueError("Access Denied: Attachment file must reside inside the approved roots (Inbox or Vault).")

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

    def _validate_path(self, file_path: str, file_type: str) -> Path:
        from src.utils.vault_path import resolve_vault_path
        allowed_roots: list[Path] = []
        if self.vault_path:
            allowed_roots.append(self.vault_path)
        if file_type != 'note' and self.inbox_path:
            allowed_roots.append(self.inbox_path)
        if file_type == 'artifact':
            allowed_roots.append(Path(".").resolve())

        if file_type == 'note' and not self.vault_path:
            raise ValueError("Access Denied: Obsidian note must reside inside the vault.")
        if not allowed_roots:
            raise ValueError("Access Denied: Attachment file must reside inside an approved root.")

        for root in allowed_roots:
            try:
                return resolve_vault_path(root, file_path)
            except ValueError:
                continue

        raise ValueError("Access Denied: Attachment file must reside inside an approved root.")

    def attach_file(self, conversation_id: str, file_path: str, file_type: str, message_id: Optional[str] = None, content: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts, chunks and saves the file in the database.
        """
        if content is not None:
            if file_type != 'artifact':
                self._validate_path(file_path, file_type)
            import uuid
            safe_base = self.inbox_path or Path(self.storage.db_path).parent
            safe_dir = safe_base / ".chat_attachments"
            try:
                safe_dir.mkdir(parents=True, exist_ok=True)
            except OSError:
                safe_dir = Path(self.storage.db_path).parent / ".chat_attachments"
                safe_dir.mkdir(parents=True, exist_ok=True)
            if safe_dir:
                safe_name = f"{uuid.uuid4().hex}_{Path(file_path).name}"
                internal_path = safe_dir / safe_name
                internal_path.write_text(content, encoding="utf-8")
                stored_file_path = str(internal_path)

            return self.storage.create_attachment(
                conv_id=conversation_id,
                filename=Path(file_path).name,
                file_path=stored_file_path,
                file_type=file_type,
                extracted_text=content,
                chunk_metadata=[{"length": len(content), "offset": 0}],
                message_id=message_id
            )
        resolved_path = self._validate_path(file_path, file_type)
        extracted = self.extract_and_chunk(str(resolved_path), file_type)
        return self.storage.create_attachment(
            conv_id=conversation_id,
            filename=extracted["filename"],
            file_path=str(resolved_path),
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

        # Validate the stored file path to ensure no traversal upon promotion
        self._validate_path(file_path, file_type)

        if file_type == 'pdf':
            service = SourceLearningJobService(self.storage.db_path)
            return service.create_or_resume_from_path(
                file_path,
                conversation_id=attachment.get("conversation_id"),
                attachment_id=attachment_id,
            )
        else:
            # Markdown/text fallback promotion
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return {
                "file_name": attachment["filename"],
                "pages": [{"page_number": 1, "content": content}],
                "warnings": []
            }
