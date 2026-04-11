#!/usr/bin/env python3
"""
Obsidian Knowledge Cluster Indexer
- Validates links within notes (only existence and supported type).
- Generates MOC (Maps of Content) notes.
- Course MOCs now include a Syllabus view by aggregating Unit Hub Connections.
"""

import os
import re
import yaml
import sys
from pathlib import Path
from datetime import datetime
from typing import Tuple, List, Dict, Any

# --- CRITICAL FIX START: Conditional import for vault_utils ---
if __name__ == "__main__":
    _scripts_dir = Path(__file__).parent.parent.resolve()
    if str(_scripts_dir) not in sys.path:
        sys.path.insert(0, str(_scripts_dir))
    import obsidian_automation.vault_utils as vault_utils
else:
    from . import vault_utils
# --- CRITICAL FIX END ---

# ===========================
# CONFIG
# ===========================
VAULT_PATH = vault_utils.VAULT_BASE_PATH

# ===========================
# HELPER FUNCTIONS
# ===========================

def extract_connections_from_hub(file_path: Path) -> str:
    """
    Reads a Unit Hub file and extracts the content specifically under the 
    '# Connections' heading until the next heading or end of file.
    """
    if not file_path or not file_path.exists():
        return "*Error: Unit Hub file not found, cannot extract concepts.*"

    try:
        content = vault_utils.read_file(file_path)
        # Regex: Find '# Connections', capture everything until next heading (#) or separator (---)
        match = re.search(r"^# Connections\s*\n(.*?)(?=\n(?:#+\s|\-\-\-|\Z))", content, re.DOTALL | re.MULTILINE)
        
        if match:
            extracted_text = match.group(1).strip()
            if not extracted_text:
                return "*(No concepts listed in this Unit Hub)*"
            return extracted_text
        return "*(No '# Connections' section found in Unit Hub)*"
    except Exception as e:
        return f"*(Error reading file: {e})*"

# ===========================
# INDEXER FUNCTIONS
# ===========================

def validate_links(all_notes_metadata: list) -> Tuple[bool, List[str], List[str]]:
    """
    Validates internal [[wiki-links]] against existing note titles and UIDs.
    Returns (overall_success: bool, errors: List[str], warnings: List[str]).
    """
    errors: List[str] = []
    warnings: List[str] = []
    
    title_to_meta = {vault_utils.get_canonical_title(meta.get("title")): meta for meta in all_notes_metadata if meta.get("title")}
    
    for note_meta in all_notes_metadata:
        note_title = note_meta.get('title', 'Untitled Note')
        note_path_raw = note_meta.get('_file_path', 'Unknown Path')
        current_note_path = Path(note_path_raw) if isinstance(note_path_raw, str) else note_path_raw
        
        try:
            if not current_note_path.exists():
                warnings.append(f"Note '{note_title}' has an invalid file path.")
                continue

            content = vault_utils.read_file(current_note_path)
            links = re.findall(r"\[\[([^\]]+?)\]\]", content)
        except Exception as e:
            errors.append(f"Could not read content for link validation in '{note_title}': {e}.")
            continue

        for link_target in links:
            canonical_link_target = vault_utils.get_canonical_title(link_target)
            if canonical_link_target not in title_to_meta:
                errors.append(f"Note '{note_title}' links to missing note '[[{link_target}]]'.")
            else:
                target_note_type = title_to_meta[canonical_link_target].get('type')
                if target_note_type not in ["Unit", "Foundational", "Core", "Supporting", "MOC", "Questions"]:
                    errors.append(f"Note '{note_title}' links to '[[{link_target}]]' which is of unsupported type '{target_note_type}'.")

    return not errors, errors, warnings


def generate_mocs(all_notes_metadata: list, output_root_path: Path) -> Tuple[bool, List[Path], List[str]]:
    """
    Generates MOC notes.
    Now includes logic to inject Unit Hub concepts into Course MOCs.
    """
    generated_mocs: List[Path] = []
    errors: List[str] = []

    # Group notes for MOC creation
    notes_for_mocs: List[Dict[str, Any]] = [
        n for n in all_notes_metadata if n.get("type") not in ["MOC", "Questions"]
    ]

    notes_by_year: Dict[str, Dict[str, Dict[str, List[Dict[str, Any]]]]] = {}
    notes_by_semester: Dict[Tuple[str, str], List[Dict[str, Any]]] = {} 
    notes_by_course: Dict[Tuple[str, str, str], List[Dict[str, Any]]] = {} 

    unique_years = sorted(list(set(n.get("year") for n in notes_for_mocs if n.get("year"))))

    for note in notes_for_mocs: 
        year = note.get("year", "Unsorted_Year")
        semester = note.get("semester", "Unsorted_Semester")
        course = note.get("course", "Unsorted_Course")
        
        if year not in notes_by_year: notes_by_year[year] = {}
        if semester not in notes_by_year[year]: notes_by_year[year][semester] = {}
        if course not in notes_by_year[year][semester]: notes_by_year[year][semester][course] = []
        notes_by_year[year][semester][course].append(note)
        
        sem_key = (year, semester)
        if sem_key not in notes_by_semester: notes_by_semester[sem_key] = []
        notes_by_semester[sem_key].append(note)

        course_key = (year, semester, course)
        if course_key not in notes_by_course: notes_by_course[course_key] = []
        notes_by_course[course_key].append(note)

    # --- 1. Computer Science Degree MOC ---
    cs_moc_title_canonical = vault_utils.get_canonical_title("Computer Science MOC")
    cs_moc_path = output_root_path / "2-Academic" / "Mocs" / f"{vault_utils.sanitize_filename(cs_moc_title_canonical)}.md"
    cs_moc_path.parent.mkdir(parents=True, exist_ok=True)

    current_utc_iso = datetime.utcnow().isoformat(timespec='seconds') + 'Z'
    
    # Simple metadata construction for MOCs
    cs_moc_content = [
        "---",
        f"title: \"{cs_moc_title_canonical}\"",
        f"created_at: \"{current_utc_iso}\"",
        f"last_modified: \"{current_utc_iso}\"",
        "deployment_batch_id: INDEXER_GENERATED_BATCH",
        f"uid: \"{vault_utils.generate_unique_uid()}\"",
        "type: MOC",
        "year: MOC-Overview",
        "semester: MOC-Overview", 
        "course: MOC-Overview",
        "original_source: Indexer Generated",
        "aliases:",
        f"  - \"{vault_utils.get_canonical_title('Computer Science Overview')}\"",
        "---",
        "",
        "# Years",
        ""
    ]

    for year in sorted(unique_years):
        year_moc_title = vault_utils.get_canonical_title(f"{year} MOC")
        cs_moc_content.append(f"- [[{year_moc_title}]]")
    
    cs_moc_content.append("\n---")
    
    try:
        vault_utils.write_file(cs_moc_path, "\n".join(cs_moc_content))
        generated_mocs.append(cs_moc_path)
    except Exception as e:
        errors.append(f"Failed to generate CS MOC: {e}")

    # --- 2. Year MOCs ---
    for year, semesters_data in notes_by_year.items():
        moc_title_canonical = vault_utils.get_canonical_title(f"{year} MOC")
        moc_path = output_root_path / "2-Academic" / "Mocs" / "Years" / f"{vault_utils.sanitize_filename(moc_title_canonical)}.md"
        moc_path.parent.mkdir(parents=True, exist_ok=True)

        content = [
            "---",
            f"title: \"{moc_title_canonical}\"",
            f"created_at: \"{current_utc_iso}\"",
            f"last_modified: \"{current_utc_iso}\"",
            "deployment_batch_id: INDEXER_GENERATED_BATCH",
            f"uid: \"{vault_utils.generate_unique_uid()}\"",
            "type: MOC",
            f"year: \"{year}\"",
            "semester: MOC-Overview",
            "course: MOC-Overview",
            "original_source: Indexer Generated",
            "aliases:",
            f"  - \"{vault_utils.get_canonical_title(year + ' Overview')}\"",
            "---",
            "",
            "# Semesters",
            ""
        ]
        
        for semester in sorted(semesters_data.keys()):
            sem_moc_title = vault_utils.get_canonical_title(f"{year} {semester} MOC")
            content.append(f"- [[{sem_moc_title}]]")
        
        content.append("\n---")
        try:
            vault_utils.write_file(moc_path, "\n".join(content))
            generated_mocs.append(moc_path)
        except Exception as e:
            errors.append(f"Failed to generate Year MOC '{moc_title_canonical}': {e}")

    # --- 3. Semester MOCs ---
    for sem_key, notes in notes_by_semester.items():
        year, semester = sem_key
        moc_title_canonical = vault_utils.get_canonical_title(f"{year} {semester} MOC")
        moc_path = output_root_path / "2-Academic" / "Mocs" / "Semesters" / f"{vault_utils.sanitize_filename(moc_title_canonical)}.md"
        moc_path.parent.mkdir(parents=True, exist_ok=True)

        content = [
            "---",
            f"title: \"{moc_title_canonical}\"",
            f"created_at: \"{current_utc_iso}\"",
            f"last_modified: \"{current_utc_iso}\"",
            "deployment_batch_id: INDEXER_GENERATED_BATCH",
            f"uid: \"{vault_utils.generate_unique_uid()}\"",
            "type: MOC",
            f"year: \"{year}\"",
            f"semester: \"{semester}\"",
            "course: MOC-Overview",
            "original_source: Indexer Generated",
            "aliases:",
            f"  - \"{vault_utils.get_canonical_title(f'{year} {semester} Overview')}\"",
            "---",
            "",
            "# Courses",
            ""
        ]
        
        seen_courses = set()
        for note in notes:
            course = note.get("course")
            if course and course not in seen_courses:
                course_moc_title = vault_utils.get_canonical_title(f"{course} MOC")
                content.append(f"- [[{course_moc_title}]]")
                seen_courses.add(course)
        
        content.append("\n---")
        try:
            vault_utils.write_file(moc_path, "\n".join(content))
            generated_mocs.append(moc_path)
        except Exception as e:
            errors.append(f"Failed to generate Semester MOC '{moc_title_canonical}': {e}")
            
    # --- 4. Course MOCs (UPDATED WITH CONCEPTS) ---
    for course_key, notes in notes_by_course.items():
        year, semester, course = course_key
        moc_title_canonical = vault_utils.get_canonical_title(f"{course} MOC")
        moc_path = output_root_path / "2-Academic" / "Mocs" / "Courses" / f"{vault_utils.sanitize_filename(moc_title_canonical)}.md"
        moc_path.parent.mkdir(parents=True, exist_ok=True)

        content = [
            "---",
            f"title: \"{moc_title_canonical}\"",
            f"created_at: \"{current_utc_iso}\"",
            f"last_modified: \"{current_utc_iso}\"",
            "deployment_batch_id: INDEXER_GENERATED_BATCH",
            f"uid: \"{vault_utils.generate_unique_uid()}\"",
            "type: MOC",
            f"year: \"{year}\"",
            f"semester: \"{semester}\"",
            f"course: \"{course}\"",
            "original_source: Indexer Generated",
            "aliases:",
            f"  - \"{vault_utils.get_canonical_title(course + ' Overview')}\"",
            "---",
            "",
            "# Hubs",
            ""
        ]

        # Identify Hubs for this course
        unit_hubs_in_course = [n for n in notes if n.get('type') == 'Unit']
        # Sort hubs alphabetically (or by title)
        unit_hubs_in_course.sort(key=lambda x: vault_utils.get_canonical_title(x.get('title')))

        # Section 1: List of Hubs
        for hub_meta in unit_hubs_in_course:
            hub_title = vault_utils.get_canonical_title(hub_meta.get('title'))
            content.append(f"- [[{hub_title}]]")
        
        # Section 2: Concepts (Extracted from Hubs)
        content.append("")
        content.append("# Concepts")
        content.append("")
        
        for hub_meta in unit_hubs_in_course:
            hub_title = vault_utils.get_canonical_title(hub_meta.get('title'))
            file_path = hub_meta.get('_file_path')

            # Add Heading for the specific Hub
            content.append(f"## [[{hub_title}]]")
            
            # Extract and inject the text
            extracted_concepts = extract_connections_from_hub(file_path)
            content.append(extracted_concepts)
            content.append("") # Blank line after extraction

        content.append("---")

        try:
            vault_utils.write_file(moc_path, "\n".join(content))
            generated_mocs.append(moc_path)
        except Exception as e:
            errors.append(f"Failed to generate Course MOC '{moc_title_canonical}': {e}")
    
    return not errors, generated_mocs, errors


def main():
    import sys
    _scripts_dir = Path(__file__).parent.parent.resolve()
    if str(_scripts_dir) not in sys.path:
        sys.path.insert(0, str(_scripts_dir))
    global vault_utils, VAULT_PATH
    import obsidian_automation.vault_utils as vault_utils_actual
    globals()['vault_utils'] = vault_utils_actual
    globals()['VAULT_PATH'] = vault_utils_actual.VAULT_BASE_PATH


    print("=== Running Indexer ===")
    all_notes = vault_utils.load_all_notes_metadata(VAULT_PATH)
    
    if not all_notes:
        print("No notes found in vault to index. Exiting Indexer.")
        return

    # 1. Validate Links
    print("\n--- Validating Links ---")
    links_overall_success, link_errors, link_warnings = validate_links(all_notes)
    if link_errors:
        print("❌ Link validation failed with errors:")
        for err in link_errors: print(f"  - {err}")
    if link_warnings:
        print("⚠️ Link validation completed with warnings:")
        for warn in link_warnings: print(f"  - {warn}")
    if links_overall_success and not link_errors: 
        print("✅ All wiki-links are valid.")

    # 2. Generate MOC Notes
    print("\n--- Generating MOC Notes (with Syllabus Aggregation) ---")
    moc_overall_success, generated_moc_files, moc_errors = generate_mocs(all_notes, VAULT_PATH)
    if moc_errors:
        print("❌ MOC generation failed with errors:")
        for err in moc_errors: print(f"  - {err}")
    else:
        print(f"✅ Generated {len(generated_moc_files)} MOC notes.")

    print("\nAll Indexer tasks completed.")

if __name__ == "__main__":
    main()