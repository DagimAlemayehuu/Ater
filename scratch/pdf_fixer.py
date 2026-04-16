import os
import time
from pypdf import PdfReader, PdfWriter
from loguru import logger

# Configuration
PDF_STORE_PATH = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/5-Pdf Store"
TARGET_HEIGHT = 1080 # Standardizing to high-res (1080p equivalent)
CHECK_INTERVAL = 60 # Seconds between autonomous scans

def is_normalized(reader):
    """Checks if the first page is already at target resolution."""
    try:
        page = reader.pages[0]
        return round(float(page.mediabox.height)) == TARGET_HEIGHT
    except:
        return True # Skip if we can't read it

def normalize_pdf(file_path):
    try:
        reader = PdfReader(file_path)
        
        if is_normalized(reader):
            return False

        logger.info(f"Normalizing resolution for: {os.path.basename(file_path)}")
        
        writer = PdfWriter()
        for page in reader.pages:
            current_height = float(page.mediabox.height)
            if current_height <= 0: continue
            
            scale_factor = TARGET_HEIGHT / current_height
            page.scale_by(scale_factor)
            writer.add_page(page)

        # Atomic Write
        temp_path = file_path + ".tmp"
        with open(temp_path, "wb") as f:
            writer.write(f)
        
        os.replace(temp_path, file_path)
        return True
    except Exception as e:
        logger.error(f"Failed to normalize {file_path}: {e}")
        return False

def scan_and_fix():
    logger.info("Starting Autonomous PDF Normalizer Scan...")
    count = 0
    for root, dirs, files in os.walk(PDF_STORE_PATH):
        for file in files:
            if file.lower().endswith(".pdf"):
                full_path = os.path.join(root, file)
                if normalize_pdf(full_path):
                    count += 1
    if count > 0:
        logger.success(f"Sanitized and Normalized {count} PDFs.")
    else:
        logger.info("No normalization required.")

if __name__ == "__main__":
    # For initial one-off run, then it can stay as a background process
    scan_and_fix()
