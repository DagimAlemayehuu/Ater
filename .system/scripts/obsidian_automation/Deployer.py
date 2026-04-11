#!/usr/bin/env python3
import os
import re
import yaml
import uuid
from pathlib import Path
from datetime import datetime

# Import shared utilities using relative import
from . import vault_utils

def deploy_notes_from_text(ai_output_text: str, vault_snapshot_before_deployment: list):
    """
    Deploys AI-generated notes to the Obsidian vault.
    Creates new notes or updates existing ones based on UID/title matching.
    Handles hierarchical pathing.
    
    Args:
        ai_output_text (str): The raw text output from the AI, containing one or more notes.
        vault_snapshot_before_deployment (list): A list of dictionaries, each containing
                                                  metadata for a note currently existing in the vault,
                                                  including its '_file_path' (as a Path object).
    """
    # CRITICAL FIX: Modify note_pattern to capture the entire block *including* its wrappers
    # This ensures that processed_blocks retains the START_NOTE/END_NOTE markers
    note_pattern = re.compile(
        r"(--- START_NOTE ---\s*\n.*?\n\s*--- END_NOTE ---)", # Capture the whole block
        re.DOTALL
    )
    processed_blocks = [block.strip() for block in note_pattern.findall(ai_output_text)]

    if not processed_blocks:
        print("No valid notes found in AI output for deployment.")
        return

    print(f"Starting deployment of {len(processed_blocks)} notes...")

    # Maps for quick lookup of existing notes
    existing_notes_map_by_uid = {meta["uid"]: meta for meta in vault_snapshot_before_deployment if "uid" in meta}
    # CRITICAL: Ensure map key is always canonical title
    existing_notes_map_by_canonical_title = {vault_utils.get_canonical_title(meta["title"]): meta for meta in vault_snapshot_before_deployment if "title" in meta}

    for i, block_content_with_note_wrappers in enumerate(processed_blocks):
        note_title_for_log = "N/A"
        note_uid_for_log = "N/A"
        current_note_canonical_title = None

        try:
            # Now, this inner_note_match correctly extracts the YAML + Markdown body
            # from within the '--- START_NOTE ---' and '--- END_NOTE ---' wrappers.
            inner_note_match = re.search(
                r"--- START_NOTE ---\s*\n(.*?)\n\s*--- END_NOTE ---",
                block_content_with_note_wrappers, # Search within the full block, which now contains the wrappers
                re.DOTALL
            )

            if not inner_note_match:
                print(f"❌ Deployer Error: Malformed individual note block {i+1} - missing START/END_NOTE markers. Skipping.")
                continue
            
            # This is the content that starts with '---' (YAML delimiter)
            actual_note_content_for_yaml_parsing = inner_note_match.group(1)

            # Process content block for wiki-link formatting cleanup before YAML extraction
            cleaned_block_content = vault_utils.process_code_blocks(actual_note_content_for_yaml_parsing)
            
            meta, body_content_raw, yaml_error_occurred = vault_utils.extract_yaml_and_content(cleaned_block_content)

            if yaml_error_occurred:
                print(f"❌ YAML Error processing note {i+1} (Title: N/A, UID: N/A): Malformed YAML detected. Skipping this note.")
                continue

            note_title_for_log = meta.get("title", "Untitled")
            note_uid_for_log = meta.get("uid")
            
            # CRITICAL: Always canonicalize the title from AI output for internal logic
            current_note_canonical_title = vault_utils.get_canonical_title(note_title_for_log)

            if not note_title_for_log or current_note_canonical_title.lower() == "untitled_note":
                print(f"⚠️ WARNING: Note {i+1} (UID: {note_uid_for_log if note_uid_for_log else 'N/A'}) has no meaningful title, skipping. Raw block start: {block_content_with_note_wrappers[:50]}...")
                continue
            
            processed_body_stripped = body_content_raw.strip()
            
            existing_note_info = None
            original_file_path_obj = None # Will be a Path object if found

            if note_uid_for_log and note_uid_for_log in existing_notes_map_by_uid:
                existing_note_info = existing_notes_map_by_uid[note_uid_for_log]
                original_file_path_obj = existing_note_info.get("_file_path")
            # If no UID, or UID match not found, try matching by canonical title
            elif current_note_canonical_title in existing_notes_map_by_canonical_title:
                existing_note_info = existing_notes_map_by_canonical_title[current_note_canonical_title]
                original_file_path_obj = existing_note_info.get("_file_path")
                if not note_uid_for_log: # If input AI note didn't have a UID, assign the existing one
                    meta["uid"] = existing_note_info.get("uid")
                    note_uid_for_log = existing_note_info.get("uid")

            current_utc_iso = datetime.utcnow().isoformat(timespec='seconds') + 'Z'

            if existing_note_info:
                # Use existing metadata for UID and created_at to preserve history
                meta["uid"] = existing_note_info["uid"]
                meta["created_at"] = existing_note_info.get("created_at", current_utc_iso)
                meta["last_modified"] = current_utc_iso
                
                # --- CRITICAL BUG FIX: Preserve existing hierarchy to prevent unintended moves/deletions ---
                # If the note already exists, we should favor the existing location (Year/Semester/Course/Unit)
                # unless we explicitly want the AI to be able to move notes (which is risky).
                # To fix the 'old ones get deleted' bug, we force the new metadata to match the old metadata
                # for the hierarchical fields.
                for field in ["year", "semester", "course", "unit"]:
                    if field in existing_note_info and existing_note_info[field]:
                        meta[field] = existing_note_info[field]

                # Update ai_refinement_log
                ai_log_from_input = meta.get("ai_refinement_log")
                if ai_log_from_input:
                    existing_log = existing_note_info.get("ai_refinement_log", "")
                    if existing_log and isinstance(existing_log, str):
                        meta["ai_refinement_log"] = f"{existing_log}\n{current_utc_iso}: AI refined note with specific log: {ai_log_from_input}"
                    else:
                        meta["ai_refinement_log"] = f"{current_utc_iso}: AI refined note with specific log: {ai_log_from_input}"
                else:
                    existing_log = existing_note_info.get("ai_refinement_log", "")
                    if existing_log and isinstance(existing_log, str):
                        meta["ai_refinement_log"] = f"{existing_log}\n{current_utc_iso}: AI updated note (generic)."
                    else:
                        meta["ai_refinement_log"] = f"{current_utc_iso}: AI updated note (generic)."
            else:
                # New note creation
                meta["uid"] = vault_utils.generate_unique_uid()
                meta["created_at"] = current_utc_iso
                meta["last_modified"] = current_utc_iso
                meta.setdefault("deployment_batch_id", "AI_GENERATED_BATCH")
                # Remove ai_refinement_log if it's a new note and AI somehow put it there
                if "ai_refinement_log" in meta:
                    del meta["ai_refinement_log"]

            # CRITICAL: Ensure all path components in metadata are canonicalized here
            # before `get_note_path_hierarchical` uses them (even though `get_note_path_hierarchical`
            # now also canonicalizes them internally for robustness, this is good practice).
            meta['title'] = current_note_canonical_title # Use the canonical title derived earlier
            meta['year'] = vault_utils.get_canonical_title(meta.get('year', 'Unsorted_Year'))
            meta['semester'] = vault_utils.get_canonical_title(meta.get('semester', 'Unsorted_Semester'))
            meta['course'] = vault_utils.get_canonical_title(meta.get('course', 'Unsorted_Course'))
            if meta.get('unit'):
                meta['unit'] = vault_utils.get_canonical_title(meta['unit'])
            if meta.get('parent'):
                meta['parent'] = vault_utils.get_canonical_title(meta['parent'])
            
            target_path = vault_utils.get_note_path_hierarchical(meta, vault_utils.VAULT_BASE_PATH)
            
            yaml_dumped_content = yaml.dump(meta, sort_keys=False, allow_unicode=True).rstrip('\n')
            full_note_content = f"---\n{yaml_dumped_content}\n---\n\n{processed_body_stripped}\n"

            if existing_note_info and original_file_path_obj:
                # CRITICAL: Compare the new target path (which now has canonical casing)
                # with the existing file's path. If they are different, it means either
                # the path hierarchy changed, or the filename casing itself changed,
                # which requires a move/rename.
                if target_path != original_file_path_obj:
                    # Determine reason for move for better logging
                    old_rel = original_file_path_obj.relative_to(vault_utils.VAULT_BASE_PATH)
                    new_rel = target_path.relative_to(vault_utils.VAULT_BASE_PATH)
                    
                    move_reason = "Path/Hierarchy change"
                    if original_file_path_obj.name != target_path.name:
                        move_reason = f"Title/Filename change ('{original_file_path_obj.stem}' -> '{target_path.stem}')"
                    
                    print(f"⬆️ Renaming/Moving: '{old_rel}' to '{new_rel}' (Reason: {move_reason}, UID: {meta['uid']})")
                    
                    # SAFE MOVE PROTOCOL: Write new file FIRST, then delete old one.
                    try:
                        vault_utils.write_file(target_path, full_note_content)
                        # Only delete if write was successful
                        if original_file_path_obj.exists():
                            try:
                                original_file_path_obj.unlink(missing_ok=True)
                                vault_utils.clean_empty_dirs(original_file_path_obj.parent, vault_utils.VAULT_BASE_PATH)
                            except OSError as e:
                                print(f"WARNING: Failed to delete old file '{old_rel}': {e}")
                    except IOError as e:
                        print(f"ERROR: Could not write new file '{new_rel}' during rename/move: {e}. Old file preserved.")
                    except Exception as e:
                        print(f"An unexpected error occurred during move for '{new_rel}': {e}. Old file preserved.")
                else:
                    print(f"🔄 Updating: '{target_path.relative_to(vault_utils.VAULT_BASE_PATH)}' (UID: {meta['uid']})")
                    try:
                        vault_utils.write_file(target_path, full_note_content)
                    except IOError as e:
                        print(f"ERROR: Could not update file '{target_path.relative_to(vault_utils.VAULT_BASE_PATH)}': {e}")
                    except Exception as e:
                        print(f"An unexpected error occurred while updating file '{target_path.relative_to(vault_utils.VAULT_BASE_PATH)}': {e}")
            else:
                print(f"➕ Deploying new note: '{target_path.relative_to(vault_utils.VAULT_BASE_PATH)}' (UID: {meta['uid']})")
                try:
                    vault_utils.write_file(target_path, full_note_content)
                except IOError as e:
                    print(f"ERROR: Could not write new note '{target_path.relative_to(vault_utils.VAULT_BASE_PATH)}': {e}")
                except Exception as e:
                    print(f"An unexpected error occurred while writing new note '{target_path.relative_to(vault_utils.VAULT_BASE_PATH)}': {e}")
            
        except Exception as e:
            print(f"❌ Unexpected Error processing note {i+1} (Title: {note_title_for_log}, UID: {note_uid_for_log if note_uid_for_log else 'N/A'}): {e}. Skipping this note.")

    print("\nDeployment process completed.")

if __name__ == "__main__":
    print("This script is typically orchestrated by Obsidian_Sync.py.")
    print("If running standalone, provide AI output and existing metadata explicitly.")