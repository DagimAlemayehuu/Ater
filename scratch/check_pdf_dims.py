import os
from pypdf import PdfReader

files = [
    "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/5-Pdf Store/note generated/Semester I/Computer Programming/Chapter 1.pdf",
    "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/5-Pdf Store/note generated/Semester I/Discrete Mathematics/1_Combinatorics.pdf",
    "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/5-Pdf Store/note generated/Semester I/Inclusiveness/1.pdf"
]

for f in files:
    if os.path.exists(f):
        reader = PdfReader(f)
        page = reader.pages[0]
        box = page.mediabox
        width = float(box.width)
        height = float(box.height)
        ratio = width / height
        print(f"File: {os.path.basename(f)}")
        print(f"  Dimensions: {width}pt x {height}pt")
        print(f"  Ratio: {ratio:.3f}")
        
        # Categorize
        if 1.3 < ratio < 1.4:
            print("  Category: 4:3 (Traditional Slides)")
        elif 1.7 < ratio < 1.8:
            print("  Category: 16:9 (Widescreen Slides)")
        elif 0.7 < ratio < 0.8:
            print("  Category: A4 / Letter (Vertical Document)")
        else:
            print("  Category: Custom")
    else:
        print(f"File Not Found: {f}")
