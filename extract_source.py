
import pypdf
from pathlib import Path

def extract_ocr_text(path):
    try:
        reader = pypdf.PdfReader(path)
        print(f"--- SOURCE: {path} ---")
        for i in range(min(10, len(reader.pages))):
            print(f"[PAGE {i+1}]")
            print(reader.pages[i].extract_text() or "")
    except Exception as e:
        print(f"Error: {e}")

extract_ocr_text("Test/Inbox/Chapter1-ocr.pdf")
