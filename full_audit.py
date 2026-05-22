
import pypdf
from pathlib import Path

def full_audit_extraction(path):
    try:
        reader = pypdf.PdfReader(path)
        total = len(reader.pages)
        print(f"--- SOURCE: {path} (Total Pages: {total}) ---")
        
        # Sample pages mentioned in the note metadata: 1, 3, 28
        targets = [1, 3, 28]
        for p_num in targets:
            if p_num <= total:
                print(f"\n[PAGE {p_num}]")
                print(reader.pages[p_num-1].extract_text() or "--- NO TEXT ---")
            else:
                print(f"\n[PAGE {p_num}] - OUT OF BOUNDS")

    except Exception as e:
        print(f"Error: {e}")

full_audit_extraction("Test/Inbox/Chapter1-ocr.pdf")
