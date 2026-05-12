import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent.parent))

from apps.api.src.domains.ater.post_processing import validate_quiz_stub_free, sanitize_body

def audit_directory(dir_path: str):
    unit_dir = Path(dir_path)
    if not unit_dir.exists():
        print(f"Directory not found: {unit_dir}")
        return

    print(f"Auditing Ater unit: {unit_dir.name}\n")
    
    broken_notes = []
    
    for note_path in unit_dir.glob("*.md"):
        # 1. Check for quiz stubs
        stubs = validate_quiz_stub_free(note_path)
        if stubs:
            print(f"❌ {note_path.name}: Found dead quiz stubs: {stubs}")
            broken_notes.append(note_path)
            continue
            
        # 2. Check for leaked scaffolding
        content = note_path.read_text(encoding='utf-8')
        parts = content.split("---", 2)
        if len(parts) == 3:
            body = parts[2]
            _, fixes = sanitize_body(body)
            if fixes:
                print(f"⚠️ {note_path.name}: Requires sanitization: {fixes}")
                
        print(f"✅ {note_path.name}: Clean")

    print("\n--- Summary ---")
    print(f"Total notes checked: {len(list(unit_dir.glob('*.md')))}")
    print(f"Notes requiring regeneration: {len(broken_notes)}")
    
    if broken_notes:
        print("\nRemoving broken notes to trigger regeneration...")
        for p in broken_notes:
            print(f"Deleting {p.name}")
            p.unlink()
        print("Done. Re-run the generation queue.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audit_notes.py <path_to_unit_directory>")
        sys.exit(1)
        
    audit_directory(sys.argv[1])
