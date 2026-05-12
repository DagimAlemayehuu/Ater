import sys
from pathlib import Path

# Add the parent directory to sys.path to import vault_utils
_automation_dir = Path(__file__).parent.parent / "obsidian_automation"
if str(_automation_dir) not in sys.path:
    sys.path.insert(0, str(_automation_dir))

import vault_utils
import yaml

def deploy_single_note(cleaned_content: str):
    """
    Deploys a single cleaned note string to the vault using the Safe Move Protocol.
    """
    if not cleaned_content:
        print("Empty content received for deployment.")
        return

    # 1. Extract Metadata and Body
    # We strip the --- START_NOTE --- wrapper for parsing
    parseable_text = cleaned_content.replace("--- START_NOTE ---", "").replace("--- END_NOTE ---", "").strip()
    
    meta, body, error = vault_utils.extract_yaml_and_content(parseable_text)
    if error or not meta:
        print("❌ Metadata Extraction Error: Could not parse YAML. Note not deployed.")
        return

    title = meta.get("title")
    if not title:
        print("❌ Error: Note has no title. Skipping deployment.")
        return

    canonical_title = vault_utils.get_canonical_title(title)
    meta["title"] = canonical_title # Force canonical title

    # 2. Check for Existing Note (UID or Title)
    current_snapshot = vault_utils.load_all_notes_metadata(vault_utils.VAULT_BASE_PATH)
    existing_note_info = None
    
    uid = meta.get("uid")
    if uid and uid != "PLACEHOLDER_UID":
        for note in current_snapshot:
            if note.get("uid") == uid:
                existing_note_info = note
                break
    
    if not existing_note_info:
        for note in current_snapshot:
            if vault_utils.get_canonical_title(note.get("title")) == canonical_title:
                existing_note_info = note
                break

    # 3. Synchronize Hierarchical Metadata (Prevent Deletions/Moves)
    if existing_note_info:
        for field in ["year", "semester", "course", "unit"]:
            if field in existing_note_info and existing_note_info[field]:
                meta[field] = existing_note_info[field]
        # Preserve UID and Created At
        meta["uid"] = existing_note_info["uid"]
        meta["created_at"] = existing_note_info.get("created_at")
    else:
        # Generate new UID if it's a truly new note
        if not uid or uid == "PLACEHOLDER_UID":
            meta["uid"] = vault_utils.generate_unique_uid()
        import datetime
        current_iso = datetime.datetime.utcnow().isoformat(timespec='seconds') + 'Z'
        meta["created_at"] = current_iso
        meta["last_modified"] = current_iso

    # 4. Determine Target Path
    target_path = vault_utils.get_note_path_hierarchical(meta, vault_utils.VAULT_BASE_PATH)
    
    # 5. Execute Safe Move / Write (WITH BLOCKADE PROTOCOL)
    full_content_to_write = f"---\n{yaml.dump(meta, sort_keys=False, allow_unicode=True)}---\n\n{body.strip()}\n"
    
    original_path = Path(existing_note_info["_file_path"]) if existing_note_info and "_file_path" in existing_note_info else None

    # THE BLOCKADE: If it's already in Uncategorized_Notes, we NEVER move it out or delete it.
    is_already_in_inbox = original_path and "Uncategorized_Notes" in original_path.parts
    
    if original_path and target_path != original_path and not is_already_in_inbox:
        print(f"⬆️ Moving existing note: '{original_path.name}' -> '{target_path.relative_to(vault_utils.VAULT_BASE_PATH)}'")
        try:
            vault_utils.write_file(target_path, full_content_to_write)
            if original_path.exists():
                original_path.unlink()
                vault_utils.clean_empty_dirs(original_path.parent, vault_utils.VAULT_BASE_PATH)
        except Exception as e:
            print(f"❌ Deployer Error during move: {e}")
    else:
        # If it's already in the inbox (or it's a new note), we just write/update it in place.
        # Use original_path if it exists to ensure we don't create a second file with a slightly different title
        final_write_path = original_path if is_already_in_inbox else target_path
        
        verb = "Updating" if existing_note_info else "Creating"
        print(f"✅ {verb} note: '{final_write_path.relative_to(vault_utils.VAULT_BASE_PATH)}'")
        try:
            vault_utils.write_file(final_write_path, full_content_to_write)
        except Exception as e:
            print(f"❌ Deployer Error during write: {e}")
