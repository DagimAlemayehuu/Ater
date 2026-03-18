#!/usr/bin/env python3
import os
import re
import yaml
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional # Added Optional

# CRITICAL FIX: Direct path to the user's Obsidian Vault
VAULT_BASE_PATH = Path("/Users/dabodestroyer/Library/Mobile Documents/iCloud~md~obsidian/Documents/Dagim Alemayehus Vault")
INTERNAL_INDEX_FILE = VAULT_BASE_PATH / "1-Academic" / "vault_index.json"

# New: Define a mapping for note types to their expected subdirectories within unit folder
# For this change, notes will go into the *unit folder*, and then if there were sub-types,
# this mapping would specify sub-dirs *within the unit folder*. Currently, they go directly
# into the unit folder, so these remain empty strings.
TYPE_TO_DIR_MAPPING = {
    "Unit": "", # Unit Hubs live directly in their unit folder
    "Foundational": "", # Foundational notes live directly in their unit folder
    "Core": "", # Core notes live directly in their unit folder
    "Supporting": "", # Supporting notes live directly in their unit folder
    "Questions": "" # Questions note also lives directly in its unit folder
    # MOCs are handled separately by Indexer.py
}


def process_code_blocks(content: str) -> str:
    """
    Processes custom code block markers (--- START_CODE:{language} --- / --- END_CODE:{language} ---)
    into standard Markdown triple backticks (```).
    Crucially, this function no longer converts custom LaTeX markers, as the AI is instructed
    to directly embed standard LaTeX delimiters ($...$ and $$...$$). These will now pass through unchanged.
    
    CRITICAL FIX: Includes aggressive passes to remove backticks, italics, bold around [[wiki-links]].
    ALIGNMENT CHANGE: Includes aggressive passes to remove display text from [[wiki-links]].
    """
    processed_lines = []
    lines = content.splitlines()
    in_code_block = False
    current_code_language = None
    current_code_buffer = []

    for line in lines:
        start_match = re.match(r"^\s*--- START_CODE:(\w+) ---\s*$", line)
        end_match = re.match(r"^\s*--- END_CODE:(\w+) ---\s*$", line)

        if start_match:
            language = start_match.group(1)
            if language in ["python", "java", "cpp", "sql", "json", "text", "mermaid"]:
                if in_code_block: # Defensive: flush and close previous block if it was somehow left open
                    processed_lines.extend(current_code_buffer)
                    current_code_buffer = []
                    processed_lines.append("```")

                in_code_block = True
                current_code_language = language
                processed_lines.append(f"```{current_code_language}")
            else:
                processed_lines.append(line)
        elif end_match and in_code_block and end_match.group(1) == current_code_language:
            if current_code_language in ["python", "java", "cpp", "sql", "json", "text", "mermaid"]:
                processed_lines.extend(current_code_buffer)
                current_code_buffer = []
                processed_lines.append("```")
                in_code_block = False
                current_code_language = None
            else:
                processed_lines.append(line)
        elif in_code_block:
            current_code_buffer.append(line)
        else:
            processed_lines.append(line)

    if in_code_block and current_code_language in ["python", "java", "cpp", "sql", "json", "text", "mermaid"]:
        processed_lines.extend(current_code_buffer)
        processed_lines.append("```")

    processed_content = "\n".join(processed_lines)

    # --- CRITICAL FIX START: Aggressive removal of all Markdown formatting around wiki-links ---
    # This is a multi-pass process to catch nested or complex wraps.
    # The order matters: outer wraps first, then inner.
    
    # Pass 1: Remove bold/italics surrounding backtick-wrapped links (most complex)
    processed_content = re.sub(r"(\*\*?\*)(`?\[\[([^\]]+)\]\]`?)(\*\*?\*)", r"[[\3]]", processed_content)
    
    # Pass 2: Remove bold/italics directly surrounding links
    processed_content = re.sub(r"(\*\*?\*)(\[\[([^\]]+)\]\])(\*\*?\*)", r"[[\3]]", processed_content)
    
    # Pass 3: Remove backticks directly surrounding links
    processed_content = re.sub(r"`(\[\[([^\]]+)\]\])`", r"[[\2]]", processed_content)

    # Pass 4: Catch any remaining single asterisks (italics)
    processed_content = re.sub(r"\*(\[\[([^\]]+)\]\])\*", r"[[\2]]", processed_content)
    
    # Ensure no empty links are left
    processed_content = re.sub(r"\[\[\s*\]\]", "", processed_content)

    # --- ALIGNMENT CHANGE: CRITICAL FIX: Aggressive removal of display text from wiki-links ---
    # MODIFIED: This now converts [[Link_Target | Display Text]] to [[Link_Target]]
    # instead of destroying the entire link and converting to plain text "Display Text".
    # This preserves the link while removing the prohibited display text.
    processed_content = re.sub(r"\[\[([^\]]+?)\|\s*[^\]]+?\]\]", r"[[\1]]", processed_content)


    return processed_content


def extract_yaml_and_content(note_block: str) -> Tuple[dict, str, bool]:
    """
    Extracts YAML frontmatter and Markdown body content from a note block.
    Returns (metadata_dict, body_content_string, yaml_error_occurred_bool).
    """
    # Use a non-greedy match (.*?) to correctly handle multiple --- blocks if they exist
    yaml_match = re.search(r"^---\s*\n(.*?)\n---\s*(?=\n|$)", note_block, re.DOTALL)
    if not yaml_match:
        # If no YAML, the whole block is body content.
        # This is okay for some files like raw AI output before deployer adds YAML.
        return {}, note_block, False
    
    yaml_str = yaml_match.group(1)
    body_content = note_block[yaml_match.end():]
    
    try:
        meta = yaml.safe_load(yaml_str) or {}
        return meta, body_content, False
    except yaml.YAMLError as e:
        return {}, body_content, True # Indicate YAML parsing error


def sanitize_filename(name: str) -> str:
    """
    Sanitizes a string for use as a filesystem path component (filename or directory name).
    This function internally applies `get_canonical_title` to the base name
    to ensure consistent casing (`Title_Case_With_Underscores`) for the filename component,
    thereby preventing case-related file duplication. It **NO LONGER converts underscores to hyphens**,
    to strictly adhere to the system instruction (1.2.1) for underscore-separated filenames.
    """
    base_name, extension = os.path.splitext(name)

    prefix = ""
    rest_of_base_name = base_name

    # Check for numeric prefix like "1-" only at the very beginning
    # and extract it.
    prefix_match = re.match(r"^(\d+)[-_]?(.*)$", base_name)
    if prefix_match:
        prefix = f"{prefix_match.group(1)}_" # Force to "NUMBER_" for canonical filename
        rest_of_base_name = prefix_match.group(2)
    
    # CRITICAL FIX: Canonicalize the 'rest_of_base_name' to enforce Title_Case_With_Underscores.
    # This step is paramount for ensuring consistent casing for the physical filename.
    canonical_rest = get_canonical_title(rest_of_base_name)

    # The canonical_rest should now primarily contain alphanumeric characters, underscores, and '+'.
    # This regex ensures that only allowed characters remain, replacing any others with underscores.
    # It explicitly allows word characters (\w which includes a-z, A-Z, 0-9, _) and the '+' character.
    final_sanitized_base_name_part = re.sub(r"[^\w+]", "_", canonical_rest)
    final_sanitized_base_name_part = re.sub(r"_+", "_", final_sanitized_base_name_part) # Collapse multiple underscores
    final_sanitized_base_name_part = final_sanitized_base_name_part.strip('_') # Strip leading/trailing underscores
    
    sanitized_base_name = f"{prefix}{final_sanitized_base_name_part}" if final_sanitized_base_name_part else prefix
    sanitized_base_name = sanitized_base_name.strip('_') # Final strip just in case prefix ended in _ and final_sanitized_base_name_part started with _
    
    return f"{sanitized_base_name}{extension}"


def get_canonical_title(title_or_link_target: Any) -> str: # Changed type hint to Any
    """
    Converts a string into its canonical, underscore-separated, Title_Case_With_Underscores format,
    as strictly required for YAML 'title', 'aliases', 'unit', 'parent' fields and '[[wiki-link]]' targets.
    This function replaces problematic characters with underscores, collapses multiples.
    It *preserves* "C++" specifically, and then applies Title Case to each resulting word segment,
    preserving specific acronyms/Roman numerals.
    Parentheses, apostrophes, periods, hyphens, and '#' are replaced with underscores.

    CRITICAL FIX: Reordered operations to ensure C++ placeholder is restored *before*
    collapsing multiple underscores, preventing the placeholder from being corrupted.
    """
    if not isinstance(title_or_link_target, str):
        # Handle non-string input gracefully, returning an empty string
        # This prevents TypeError when None or other non-string types are passed.
        return ""

    ALWAYS_UPPERCASE_WORDS = {
        "MOC", "OOP", "SQL", "API", "HTML", "CSS", "DOM", "UI", "UX", "CPU", "RAM", "OS", "AI", "NLP",
        "ERD", "CSV", "PDF", "UML", "MVC", "CRUD", "SDK", "IDE", "JVM", "REST", "SOAP", "URI", "URL",
        "GUI", "CLI", "FTP", "SSH", "SSL", "TLS", "VPN", "WAN", "LAN", "IOT", "JS", "V1", "V2", "V3",
        "ROM", "GPU", "IO", "I_O", "HTTP", "HTTPS", "DNS", "DHCP", "NTP", "ARP", "ICMP",
        "TCP", "UDP", "IP", "MAC", "WAN", "LAN", "GAN", "CNN", "RNN", "LSTM", "BERT", "GPT", "DL", "ML", "KBS",
        "IR", "IT", "SAD", "CD",
        "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
        "C++", # CRITICAL: Added C++ to always preserve its casing
    }

    numeric_part = ""
    rest_of_title = title_or_link_target

    # Extract numeric prefix (e.g., "3" from "3-Control_Structure")
    # and ensure it's separated by an underscore for the canonical name
    numeric_prefix_match = re.match(r"^(\d+)\s*[-_]?(.*)$", title_or_link_target)
    if numeric_prefix_match:
        numeric_part = numeric_prefix_match.group(1)
        rest_of_title = numeric_prefix_match.group(2) # The part after the number and its separator

    # Define a placeholder to protect "C++"
    CPP_PLACEHOLDER = "__CPP_PLACEHOLDER__"
    temp_rest = re.sub(r"C\+\+", CPP_PLACEHOLDER, rest_of_title, flags=re.IGNORECASE)

    # Replace problematic characters with underscores (apostrophes, periods, spaces, hyphens, parentheses, #)
    cleaned_rest_intermediate = re.sub(r"['\.\s\-#\(\)]+", "_", temp_rest)
    # Also replace any remaining non-alphanumeric (and not '+') with underscores
    cleaned_rest_intermediate = re.sub(r"[^\w+]+", "_", cleaned_rest_intermediate)

    # CRITICAL FIX: Restore "C++" BEFORE collapsing multiple underscores
    cleaned_rest_intermediate = cleaned_rest_intermediate.replace(CPP_PLACEHOLDER, "C++")

    # Collapse any multiple underscores (now safe to do)
    cleaned_rest_intermediate = re.sub(r"_+", "_", cleaned_rest_intermediate)
    
    # Apply Title Case to each word, preserving specific acronyms/Roman numerals and C++.
    words = []
    if cleaned_rest_intermediate: # Only process if there's actual content after prefix
        for word_segment in cleaned_rest_intermediate.split('_'):
            if not word_segment:
                continue
            
            if word_segment == "C++": # Specific C++ handling
                words.append("C++")
            elif word_segment.upper() in ALWAYS_UPPERCASE_WORDS:
                words.append(word_segment.upper())
            elif word_segment.isupper() and len(word_segment) > 1: # Preserve other existing all-caps multi-character words
                words.append(word_segment)
            else:
                words.append(word_segment.title())

    canonical_rest = '_'.join(words)
    
    # Combine numeric part (if any) with the canonical rest, separated by underscore if both exist.
    if numeric_part and canonical_rest:
        final_canonical = f"{numeric_part}_{canonical_rest}"
    elif numeric_part: # Only numeric part exists (e.g., "1" as a title -> "1")
        final_canonical = numeric_part 
    else: # No numeric prefix, just canonical rest (e.g., "My_Title")
        final_canonical = canonical_rest
            
    return final_canonical.strip('_')

def get_unit_folder_name(unit_canonical_title: str) -> str:
    """
    Derives the unit subfolder name from a canonical unit title.
    It strips the '_Hub' suffix and ensures consistent naming.
    Example: "1_Combinatorics_Hub" -> "1_Combinatorics"
    """
    if unit_canonical_title.endswith("_Hub"):
        return unit_canonical_title[:-len("_Hub")]
    return unit_canonical_title


def get_note_path_hierarchical(meta: dict, base_path: Path) -> Path:
    """
    Determines the hierarchical file path for a note based on its YAML metadata.
    Includes the '1-Academic' top-level directory and uses sanitize_filename for all components.
    CRITICAL CHANGE: Now includes a unit-specific subfolder within the course folder.
    """
    # Ensure all path components are canonical BEFORE sanitizing for filename.
    year = get_canonical_title(meta.get("year", "Unsorted_Year"))
    semester = get_canonical_title(meta.get("semester", "Unsorted_Semester"))
    course = get_canonical_title(meta.get("course", "Unsorted_Course"))
    
    note_type = meta.get("type", "Unknown")

    # Determine the canonical unit title to derive the unit folder name
    unit_canonical_title = None
    if note_type == "Unit":
        # For a Unit Hub, its own title is the base for the unit folder
        unit_canonical_title = get_canonical_title(meta.get("title", "Uncategorized_Unit_Hub"))
    else:
        # For atomic notes, the 'unit' field specifies its parent unit
        unit_canonical_title = get_canonical_title(meta.get("unit", "Uncategorized_Unit_Hub"))

    # Derive the actual folder name (e.g., "1_Combinatorics" from "1_Combinatorics_Hub")
    unit_folder_name = get_unit_folder_name(unit_canonical_title)
    # Sanitize this for the filesystem
    sanitized_unit_folder_name = sanitize_filename(unit_folder_name)

    # Use the canonical title from meta for the note name component, then sanitize it for filename
    title_from_meta = meta.get("title", "Untitled_Note")
    # CRITICAL: Canonicalize the title before sanitizing for the base filename.
    title_for_filename_base = sanitize_filename(get_canonical_title(title_from_meta))
    
    # This type_subdir is for sub-subdirectories (e.g., Course/Unit/Foundational/Note.md),
    # which we are not currently using (empty strings in TYPE_TO_DIR_MAPPING).
    # Notes will go directly into the unit folder.
    type_subdir = TYPE_TO_DIR_MAPPING.get(note_type, "")

    # Construct the target directory including the new unit subfolder
    target_dir = (
        base_path / "1-Academic" / 
        sanitize_filename(year) / 
        sanitize_filename(semester) / 
        sanitize_filename(course) /
        sanitized_unit_folder_name # <--- NEW UNIT SUBFOLDER HERE
    )
    
    if type_subdir:
        target_dir = target_dir / sanitize_filename(type_subdir) # sanitize_filename on type_subdir too, just in case
    
    return target_dir / f"{title_for_filename_base}.md"

def load_all_notes_metadata(vault_path: Path) -> List[Dict[str, Any]]:
    """
    Scans the vault for all .md notes and extracts their YAML metadata.
    Returns a list of dictionaries, each including a '_file_path' (Path object).
    """
    all_metadata = []
    
    scan_root = vault_path / "1-Academic"
    if not scan_root.is_dir():
        scan_root = vault_path # Fallback to root if 1-Academic doesn't exist

    for root, _, files in os.walk(scan_root):
        for file in files:
            if file.endswith(".md"):
                file_path = Path(root) / file
                try:
                    with open(file_path, "r", encoding="utf-8") as f: content = f.read()
                    meta, _, _ = extract_yaml_and_content(content)
                    if meta.get("title"): 
                        meta["_file_path"] = file_path # Store original file path
                        all_metadata.append(meta)
                except Exception as e:
                    # print(f"WARNING: Unexpected error loading metadata from {file_path.name}: {e}")
                    pass
    return all_metadata

def read_file(file_path: Path) -> str:
    """Helper to read file content robustly."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        raise IOError(f"Failed to read file {file_path}: {e}")

def write_file(file_path: Path, content: str):
    """Helper to write file content robustly using a temporary file for atomic writes."""
    temp_file_path = file_path.with_suffix(file_path.suffix + ".temp")
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True) # Ensure target directory exists
        with open(temp_file_path, "w", encoding="utf-8") as f:
            f.write(content)
        temp_file_path.rename(file_path) # Atomic rename
    except Exception as e:
        if temp_file_path.exists():
            temp_file_path.unlink() # Clean up temp file on error
        raise IOError(f"Failed to write file {file_path} atomically: {e}")

def generate_unique_uid():
    return str(uuid.uuid4())
    
def clean_empty_dirs(path: Path, top_level_path: Path):
    """
    Recursively cleans up empty directories starting from 'path' up to 'top_level_path'.
    Skips the '1-Academic' folder itself and ensures it doesn't try to delete the vault root.
    """
    current_path = path
    academic_folder_path = top_level_path / "1-Academic"

    while current_path != top_level_path and current_path != academic_folder_path and current_path != current_path.parent:
        try:
            ignored_names = {'.DS_Store', 'Thumbs.db', '.localized', '.gitkeep', '__pycache__'}
            
            contents = [
                entry for entry in current_path.iterdir()
                if entry.name not in ignored_names
            ]

            if not contents:
                current_path.rmdir()
            else:
                break
        except OSError: # Directory might not be empty (e.g. contains hidden files), or permission error
            break
        except Exception: # Catch any other unexpected errors
            break
        
        current_path = current_path.parent


def get_all_linked_notes_for_hub(unit_hub_meta: Dict[str, Any], all_notes_metadata: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extracts all canonical wiki-links from the Unit Hub's '# Connections' section
    and the '# Possible Questions' section, then resolves them to their full note metadata.
    Includes the Unit Hub itself.
    """
    found_linked_targets: set[str] = set()
    resolved_notes_meta: List[Dict[str, Any]] = []

    hub_file_path = unit_hub_meta.get("_file_path")
    if not hub_file_path or not Path(hub_file_path).exists():
        print(f"Error: Unit Hub file not found at {hub_file_path}")
        return []

    try:
        hub_content_raw = read_file(Path(hub_file_path))
        _, hub_body_content, _ = extract_yaml_and_content(hub_content_raw)
    except Exception as e:
        print(f"Error reading or parsing content for Unit Hub '{unit_hub_meta.get('title')}': {e}")
        return []

    # Add the hub itself first to the set of targets
    hub_title_canonical = get_canonical_title(unit_hub_meta.get("title", ""))
    found_linked_targets.add(hub_title_canonical)

    # Regex to find all [[Link_Target]] entries
    link_pattern = re.compile(r"\[\[([^\]]+)\]\]")

    # 1. Extract links from '# Connections' section
    connections_section_started = False
    for line in hub_body_content.splitlines():
        if line.strip() == "# Connections":
            connections_section_started = True
            continue
        # Stop collecting if we hit another H2 heading after # Connections
        # (Assuming # Connections is an H2, and other major sections are also H2)
        if connections_section_started and re.match(r"^##\s+\S+", line.strip()):
            break
        if connections_section_started:
            for match in link_pattern.finditer(line):
                link_target = get_canonical_title(match.group(1))
                found_linked_targets.add(link_target)
    
    # 2. Extract the link from '# Possible Questions' section
    # This section is always at the end of the Hub note, typically as a direct link.
    # The regex looks for '# Possible Questions' (H2), followed by optional whitespace,
    # then a newline, optional whitespace, and then the [[link]].
    questions_link_pattern = re.compile(r"^##\s+Possible Questions\s*\n\s*\[\[([^\]]+)\]\]", re.MULTILINE | re.DOTALL)
    questions_match = questions_link_pattern.search(hub_body_content)
    if questions_match:
        questions_note_target = get_canonical_title(questions_match.group(1))
        found_linked_targets.add(questions_note_target)

    # 3. Resolve all found canonical link targets to their full note metadata
    # The `unit_combinor.py` handles the sorting of atomic notes and placement.
    # We should return a list that includes the hub, all atomic notes found, and the questions note.
    # The sorting below ensures a consistent return order (Hub, Foundational, Core, Supporting, Questions)
    # even if unit_combinor.py does its own re-sorting for atomic notes later.
    
    # First, collect all potential notes (including the hub)
    for target in found_linked_targets:
        for note_meta in all_notes_metadata:
            if get_canonical_title(note_meta.get("title", "")) == target:
                resolved_notes_meta.append(note_meta)
                break
    
    # Then, sort the collected notes to maintain a sensible hierarchy
    # Define a custom order for note types
    type_order = {"Unit": 0, "Foundational": 1, "Core": 2, "Supporting": 3, "Questions": 4}

    def sort_key(note):
        title_for_sort = get_canonical_title(note.get("title", ""))
        return (type_order.get(note.get("type", "Unknown"), 99), title_for_sort)

    resolved_notes_meta.sort(key=sort_key)

    return resolved_notes_meta