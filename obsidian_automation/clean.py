#!/usr/bin/env python3
import os
import sys
import re
from pathlib import Path
from typing import List, Set, Dict, Any

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

def find_all_wiki_links(all_notes_metadata: List[Dict[str, Any]]) -> Dict[Path, List[str]]:
    all_found_links: Dict[Path, List[str]] = {}
    print("\n--- Scanning recognized notes for wiki-links ---")
    link_pattern = re.compile(r"\[\[([^\]]+?)\]\]")

    for note_meta in all_notes_metadata:
        file_path_raw = note_meta.get("_file_path")
        if not file_path_raw: continue
        
        file_path = Path(file_path_raw)
        if not file_path.is_file(): continue

        try:
            content = vault_utils.read_file(file_path)
            links = link_pattern.findall(content)
            if links: all_found_links[file_path] = links
        except Exception as e:
            print(f"Error reading '{file_path.name}': {e}")
            continue
            
    print("Link scan completed.")
    return all_found_links

def get_unique_canonical_links_from_dict(links_dict: Dict[Path, List[str]]) -> Set[str]:
    unique_canonical_links = set()
    for _, raw_links in links_dict.items():
        for raw_link_target in raw_links:
            unique_canonical_links.add(vault_utils.get_canonical_title(raw_link_target))
    return unique_canonical_links

def get_unique_canonical_links_from_text(text: str) -> Set[str]:
    unique_canonical_links = set()
    link_pattern = re.compile(r"\[\[([^\]]+?)\]\]")
    raw_links = link_pattern.findall(text)
    for raw_link_target in raw_links:
        unique_canonical_links.add(vault_utils.get_canonical_title(raw_link_target))
    return unique_canonical_links

def create_link_source_map(all_links_in_vault_raw_map: Dict[Path, List[str]]) -> Dict[str, List[Path]]:
    link_source_map: Dict[str, List[Path]] = {}
    for source_file_path, raw_links_in_file in all_links_in_vault_raw_map.items():
        for raw_link_target in raw_links_in_file:
            canonical_target = vault_utils.get_canonical_title(raw_link_target)
            if canonical_target not in link_source_map:
                link_source_map[canonical_target] = []
            if source_file_path not in link_source_map[canonical_target]:
                link_source_map[canonical_target].append(source_file_path)
    return link_source_map

def fix_broken_links(broken_link_targets: List[str], link_source_map: Dict[str, List[Path]]):
    if not broken_link_targets:
        print("\nNo broken wiki-links identified that require fixing.")
        return

    print("\n--- Initiating Fix for Broken Wiki-Links ---")
    print(f"Found {len(broken_link_targets)} broken links.")
    for link_target in broken_link_targets:
        print(f"- [[{link_target}]]")

    # --- GUI COMPATIBILITY FIX ---
    # We flush stdout to ensure the user sees the question before input() blocks the thread
    print("\nDo you want to proceed with converting these broken links to plain text? (yes/no): ", end="")
    sys.stdout.flush()
    confirmation = input().strip().lower()

    if confirmation != "yes":
        print("Broken link fixing cancelled by user.")
        return

    total_links_fixed = 0
    modified_files: Set[Path] = set()

    for broken_link_target in broken_link_targets:
        source_files = link_source_map.get(broken_link_target, [])
        link_pattern_for_replacement = re.compile(r"\[\[" + re.escape(broken_link_target) + r"(?:\|[^\]]+?)?\]\]", re.IGNORECASE)

        for source_file_path in source_files:
            try:
                original_content = vault_utils.read_file(source_file_path)
                new_content, num_replacements = re.subn(link_pattern_for_replacement, broken_link_target, original_content)

                if num_replacements > 0:
                    vault_utils.write_file(source_file_path, new_content)
                    print(f"  ✅ Fixed '[[{broken_link_target}]]' ({num_replacements}x) in '{source_file_path.name}'")
                    total_links_fixed += num_replacements
                    modified_files.add(source_file_path)

            except Exception as e:
                print(f"  ❌ Error fixing '[[{broken_link_target}]]': {e}")
    
    print(f"\n--- Broken Link Fix Summary ---")
    print(f"Total links converted: {total_links_fixed}")
    print(f"Total files modified: {len(modified_files)}")

def main():
    print("=== Obsidian Vault Cleaner ===")
    
    if not VAULT_PATH.is_dir():
        print(f"ERROR: Vault path '{VAULT_PATH}' does not exist.")
        return

    all_notes = vault_utils.load_all_notes_metadata(VAULT_PATH)
    
    # Map canonical titles to types
    canonical_title_to_type = {vault_utils.get_canonical_title(n.get("title")): n.get("type") for n in all_notes if n.get("title")}

    # 1. Identify Unit Hub Connections
    unit_hubs_metadata = [n for n in all_notes if n.get("type") == "Unit"]
    all_hub_connections: Set[str] = set()
    
    print(f"\nScanning {len(unit_hubs_metadata)} Unit Hubs for connections...")
    for hub_meta in unit_hubs_metadata:
        hub_path = hub_meta.get("_file_path")
        if not hub_path: continue
        
        try:
            content = vault_utils.read_file(hub_path)
            match = re.search(r"^# Connections\s*\n(.*?)(?=\n(?:#+\s|\-\-\-))", content, re.DOTALL | re.MULTILINE)
            if match:
                all_hub_connections.update(get_unique_canonical_links_from_text(match.group(1)))
        except: pass
    
    # 2. Scan all links
    all_links_map = find_all_wiki_links(all_notes)
    all_unique_links = get_unique_canonical_links_from_dict(all_links_map)
    link_source_map = create_link_source_map(all_links_map)

    # 3. Filter invalid
    truly_broken_links = []
    potential_invalid = sorted(list(all_unique_links - all_hub_connections))

    print("\n--- Validating Links ---")
    for link in potential_invalid:
        target_type = canonical_title_to_type.get(link)
        
        # Valid exclusions
        if target_type in ["Unit", "Questions", "MOC"]: continue
        
        if link not in canonical_title_to_type:
            truly_broken_links.append(link)
            print(f"❌ Broken Link: [[{link}]] (No note found)")
        else:
            print(f"⚠️  Orphaned Link: [[{link}]] (Exists, but not in any Unit Hub #Connections)")

    # 4. Fix
    if truly_broken_links:
        fix_broken_links(truly_broken_links, link_source_map)
    else:
        print("\n✅ No broken links found.")

if __name__ == "__main__":
    main()