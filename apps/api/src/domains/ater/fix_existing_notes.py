import sys
from pathlib import Path
import re
import yaml

# Add the domains path to sys.path
sys.path.append(str(Path('/Users/dabodestroyer/code/Antigravity/Ater/apps/api/src')))

from domains.ater.post_processing import sanitize_body, canonicalize_unit

def fix_all_notes(unit_dir_path):
    unit_dir = Path(unit_dir_path)
    if not unit_dir.exists():
        print(f"Error: {unit_dir} not found")
        return

    print(f"Fixing notes in {unit_dir}...")
    
    # 1. Run canonicalize_unit (includes sanitize_body fixes)
    canonicalize_unit(unit_dir)
    
    # 2. Re-read and apply any extra fixes if needed
    for note_file in unit_dir.glob("*.md"):
        content = note_file.read_text(encoding="utf-8")
        # Split frontmatter
        parts = content.split("---", 2)
        if len(parts) < 3: continue
        
        fm = parts[1]
        body = parts[2]
        
        # Apply additional sanitization if needed (though canonicalize_unit does it)
        # But wait, canonicalize_unit calls sanitize_body, which I just updated.
        
        # One thing canonicalize_unit doesn't do is fix the hallucinations, 
        # but it can fix the rendering.
        
    print("Done.")

if __name__ == "__main__":
    fix_all_notes("/Users/dabodestroyer/code/Antigravity/Ater/Obsidian_Vault/Notes/Winter 2026/Economics/1_Basics_Of_Economics")
