import zipfile
import json
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional
from .service import AterService
from .srs import SRSEngine

class StudyPackManager:
    def __init__(self, vault_path: Path, db_path: Path, secrets: Optional[Any] = None):
        self.vault_path = Path(vault_path)
        self.db_path = Path(db_path)
        self.secrets = secrets

    def export_pack(self, hub_id: str, output_zip_path: Path) -> Path:
        """Packages a study hub and its note metadata into a shareable ZIP pack."""
        if not self.secrets:
            from src.api.deps import AppSecrets
            self.secrets = AppSecrets(
                vault_path=str(self.vault_path),
                inbox_path=str(self.db_path.parent),
                academic_path="Notes"
            )
            
        service = AterService(self.secrets)
        
        hub_notes = service.list_atomic_notes(hub_id)
        srs = SRSEngine(self.db_path)
        
        hub = service._find_hub(hub_id)
        if not hub:
            raise ValueError(f"Hub {hub_id} not found.")
            
        hub_file = self.vault_path / hub["path"]
        
        metadata = {
            "hub_id": hub_id,
            "hub_info": hub,
            "notes": []
        }
        
        temp_dir = self.vault_path / ".ater" / "temp_export"
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            if hub_file.exists():
                shutil.copy(hub_file, temp_dir / hub_file.name)
                
            for note in hub_notes:
                note_file = self.vault_path / note["path"]
                if note_file.exists():
                    shutil.copy(note_file, temp_dir / note_file.name)
                    
                card = srs.get_card(note["path"])
                metadata["notes"].append({
                    "path": note["path"],
                    "filename": note_file.name,
                    "srs_data": {
                        "stability": card.stability,
                        "difficulty": card.difficulty,
                        "reps": card.reps,
                        "lapses": card.lapses
                    }
                })
                
            with open(temp_dir / "pack_metadata.json", "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2)
                
            output_zip_path.parent.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for file_path in temp_dir.glob("*"):
                    zip_file.write(file_path, arcname=file_path.name)
                    
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
            
        return output_zip_path

    def import_pack(self, zip_path: Path, conflict_strategy: str = "overwrite") -> Dict[str, Any]:
        """Imports note files and metadata from a ZIP study pack."""
        temp_dir = self.vault_path / ".ater" / "temp_import"
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        imported_notes = []
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
                
            meta_file = temp_dir / "pack_metadata.json"
            if not meta_file.exists():
                raise ValueError("Invalid study pack: pack_metadata.json is missing.")
                
            with open(meta_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)
                
            srs = SRSEngine(self.db_path)
            
            hub_info = metadata["hub_info"]
            hub_target_path = self.vault_path / hub_info["path"]
            hub_target_path.parent.mkdir(parents=True, exist_ok=True)
            
            temp_hub_file = temp_dir / Path(hub_info["path"]).name
            if temp_hub_file.exists():
                if conflict_strategy == "overwrite" or not hub_target_path.exists():
                    shutil.copy(temp_hub_file, hub_target_path)
            
            for note_meta in metadata["notes"]:
                target_note_path = self.vault_path / note_meta["path"]
                target_note_path.parent.mkdir(parents=True, exist_ok=True)
                
                temp_note_file = temp_dir / note_meta["filename"]
                if temp_note_file.exists():
                    if conflict_strategy == "overwrite" or not target_note_path.exists():
                        shutil.copy(temp_note_file, target_note_path)
                        imported_notes.append(note_meta["path"])
                        
                        srs_data = note_meta.get("srs_data") or {}
                        if srs_data:
                            card = srs.get_card(note_meta["path"])
                            card.stability = srs_data.get("stability", 1.0)
                            card.difficulty = srs_data.get("difficulty", 5.0)
                            card.reps = srs_data.get("reps", 0)
                            card.lapses = srs_data.get("lapses", 0)
                            srs.db.execute("""
                                INSERT OR REPLACE INTO srs_cards
                                VALUES (?,?,?,?,?,?,?)
                            """, (
                                card.note_path, card.stability, card.difficulty,
                                card.due.isoformat(), card.reps, card.lapses,
                                card.last_review.isoformat() if card.last_review else None
                            ))
                            srs.db.commit()
                            
            from .vault_indexer import VaultIndexer
            indexer = VaultIndexer(self.vault_path)
            for note_p in imported_notes:
                try:
                    full_p = self.vault_path / note_p
                    if full_p.exists():
                        with open(full_p, "r", encoding="utf-8") as f:
                            indexer.index_note(note_p, f.read())
                except Exception:
                    pass
                    
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
            
        return {
            "success": True,
            "hub_id": metadata.get("hub_id"),
            "notes_imported_count": len(imported_notes)
        }
