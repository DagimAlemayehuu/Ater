#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple

# --- CRITICAL FIX: Conditional import for vault_utils ---
if __name__ == "__main__":
    _scripts_dir = Path(__file__).parent.parent.resolve()
    if str(_scripts_dir) not in sys.path:
        sys.path.insert(0, str(_scripts_dir))
    import obsidian_automation.vault_utils as vault_utils
else:
    from . import vault_utils
# --- CRITICAL FIX END ---

VAULT_PATH = vault_utils.VAULT_BASE_PATH
COMBINED_NOTES_DIR = VAULT_PATH / "Combined_notes"

def get_unit_hubs_by_hierarchical_context(all_notes_metadata: List[Dict[str, Any]]):
    units_by_context = {}
    unique_identifiers = set() 

    for note in all_notes_metadata:
        if note.get("type") == "Unit":
            unit_canon = vault_utils.get_canonical_title(note.get("unit", "Unsorted_Unit"))
            title_canon = vault_utils.get_canonical_title(note.get("title", ""))
            
            if not title_canon.endswith("_Hub"): continue

            year = note.get("year", "Unsorted")
            sem = note.get("semester", "Unsorted")
            course = note.get("course", "Unsorted")
            
            # Deduplication
            identifier = (year, sem, course, unit_canon)
            if identifier in unique_identifiers: continue
            unique_identifiers.add(identifier)

            if year not in units_by_context: units_by_context[year] = {}
            if sem not in units_by_context[year]: units_by_context[year][sem] = {}
            if course not in units_by_context[year][sem]: units_by_context[year][sem][course] = []
            
            units_by_context[year][sem][course].append(note)
    
    return units_by_context

def display_and_select_hubs(units_context):
    if not units_context:
        print("No Unit Hubs found.")
        return []

    print("\n=== Available Unit Hubs ===")
    selectable = []
    idx = 1

    # Simple sorting for display
    for year in sorted(units_context.keys()):
        print(f"\n🎓 {year}")
        for sem in sorted(units_context[year].keys()):
            print(f"  📅 {sem}")
            for course in sorted(units_context[year][sem].keys()):
                print(f"    📘 {course}")
                for unit_meta in sorted(units_context[year][sem][course], key=lambda x: x.get('title')):
                    display_name = unit_meta.get("unit", "UNKNOWN").replace("_", " ")
                    print(f"      [{idx}] {display_name}")
                    selectable.append(unit_meta)
                    idx += 1

    # --- GUI COMPATIBILITY FIX ---
    print("\nEnter numbers (e.g., '1, 3' or 'all'): ", end="")
    sys.stdout.flush() # Force display before input blocks
    selection = input().strip().lower()
    
    if selection == "all": return selectable
    
    selected_meta = []
    try:
        indices = [int(s.strip()) for s in selection.split(',') if s.strip().isdigit()]
        for i in indices:
            if 1 <= i <= len(selectable):
                selected_meta.append(selectable[i-1])
    except:
        print("Invalid input.")
    
    return selected_meta

def demote_headings(content: str) -> str:
    lines = []
    for line in content.splitlines():
        match = re.match(r"^(#+)(\s*)(.*)", line)
        if match:
            lines.append(f"#{match.group(1)}{match.group(2)}{match.group(3)}")
        else:
            lines.append(line)
    return "\n".join(lines)

def combine_and_save(selected_hubs, all_notes):
    COMBINED_NOTES_DIR.mkdir(parents=True, exist_ok=True)
    
    for hub_meta in selected_hubs:
        hub_title = hub_meta.get("title")
        print(f"\nProcessing: {hub_title}...")
        
        linked_notes = vault_utils.get_all_linked_notes_for_hub(hub_meta, all_notes)
        
        combined_lines = []
        display_title = hub_title.replace('_Hub', '').replace('_', ' ')
        
        # Header
        combined_lines.append(f"# {display_title}")
        combined_lines.append("")
        combined_lines.append(f"Comprehensive resource for {display_title}.")
        combined_lines.append("")

        for note in linked_notes:
            path = note.get("_file_path")
            if not path or not path.exists(): continue
            
            # Separator
            if combined_lines:
                combined_lines.append("")
                combined_lines.append("---")
                combined_lines.append("")

            # Title
            n_title = note.get("title", "").replace("_", " ")
            combined_lines.append(f"## {n_title}")
            combined_lines.append("")
            
            # Content
            try:
                raw = vault_utils.read_file(path)
                processed = vault_utils.process_code_blocks(raw)
                _, body, _ = vault_utils.extract_yaml_and_content(processed)
                
                # Remove redundant H1 of self
                body_lines = body.splitlines()
                # Simple cleanup logic
                clean_body = demote_headings("\n".join(body_lines))
                combined_lines.append(clean_body)
                
            except Exception as e:
                print(f"Error reading {n_title}: {e}")

        # Save
        filename = vault_utils.sanitize_filename(hub_title.replace("_Hub", "") + "_Combined.md")
        out_path = COMBINED_NOTES_DIR / filename
        
        try:
            vault_utils.write_file(out_path, "\n".join(combined_lines))
            print(f"✅ Created: {filename}")
        except Exception as e:
            print(f"❌ Failed to save {filename}: {e}")

def main():
    print("=== Unit Combiner ===")
    all_notes = vault_utils.load_all_notes_metadata(VAULT_PATH)
    if not all_notes: return

    units_context = get_unit_hubs_by_hierarchical_context(all_notes)
    if not units_context:
        print("No units found.")
        return

    selected = display_and_select_hubs(units_context)
    if selected:
        combine_and_save(selected, all_notes)
    else:
        print("No units selected.")

if __name__ == "__main__":
    main()