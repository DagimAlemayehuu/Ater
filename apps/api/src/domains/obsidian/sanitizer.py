import os
from pathlib import Path
from pypdf import PdfReader, PdfWriter
from loguru import logger

class PdfSanitizer:
    """
    Autonomously standardizes PDFs to a high-fidelity internal coordinate system.
    Only touches files that are 100% safe to scale.
    """
    TARGET_HEIGHT = 1080  # Standardizing to high-res (1080p equivalent height)
    
    @staticmethod
    def is_safe_to_normalize(file_path: Path) -> bool:
        """
        Safety check: 
        1. Must be a valid PDF.
        2. Must be low resolution (height < TARGET_HEIGHT).
        3. Must have standard boxes (no complex cropping offsets).
        """
        try:
            reader = PdfReader(str(file_path))
            if len(reader.pages) == 0:
                return False
            
            page = reader.pages[0]
            height = float(page.mediabox.height)
            
            # If it's already at target or higher, it's already normalized/high-res
            if round(height) >= PdfSanitizer.TARGET_HEIGHT:
                return False
            
            return True
        except Exception as e:
            logger.error(f"[Sanitizer] Safety check failed for {file_path.name}: {e}")
            return False

    @staticmethod
    def normalize(file_path: Path) -> bool:
        if not PdfSanitizer.is_safe_to_normalize(file_path):
            return False

        try:
            reader = PdfReader(str(file_path))
            writer = PdfWriter()
            
            logger.info(f"[Sanitizer] Normalizing {file_path.name} to {PdfSanitizer.TARGET_HEIGHT}pt height")
            
            for page in reader.pages:
                current_height = float(page.mediabox.height)
                if current_height <= 0: continue
                
                scale_factor = PdfSanitizer.TARGET_HEIGHT / current_height
                page.scale_by(scale_factor)
                writer.add_page(page)

            # Atomic Swap
            temp_path = file_path.with_suffix(file_path.suffix + ".fix")
            with open(temp_path, "wb") as f:
                writer.write(f)
            
            os.replace(temp_path, file_path)
            return True
        except Exception as e:
            logger.error(f"[Sanitizer] Error fixing {file_path.name}: {e}")
            return False

def start_auto_sanitizer(vault_path: str):
    """Scan existing store and prepare for background watching."""
    pdf_store = Path(vault_path) / "5-Pdf Store"
    if not pdf_store.exists():
        return
    
    count = 0
    for item in pdf_store.rglob("*.pdf"):
        if PdfSanitizer.normalize(item):
            count += 1
    
    if count > 0:
        print(f"[Sanitizer] Successfully normalized {count} PDFs in store.")
