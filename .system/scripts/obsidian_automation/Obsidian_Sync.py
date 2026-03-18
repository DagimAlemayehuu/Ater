#!/usr/bin/env python3
"""
Obsidian Vault Sync UI - Minimalist Edition
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path
import sys

# --- IMPORTANT: Relative imports for when run as a package module ---
try:
    from . import vault_utils
    from . import Deployer
    from . import Validator
    from . import Indexer
    # NEW IMPORTS: Add clean and unit_combinor
    from . import clean
    from . import unit_combinor
except ImportError:
    # Adjust sys.path for direct script execution to find sibling modules
    _scripts_dir = Path(__file__).parent.parent.resolve() # This assumes scripts are one level up from this file
    if str(_scripts_dir) not in sys.path:
        sys.path.insert(0, str(_scripts_dir))
    
    import obsidian_automation.vault_utils as vault_utils
    import obsidian_automation.Deployer as Deployer
    import obsidian_automation.Validator as Validator
    import obsidian_automation.Indexer as Indexer
    # NEW IMPORTS (absolute for direct run)
    import obsidian_automation.clean as clean
    import obsidian_automation.unit_combinor as unit_combinor

# CRITICAL: Use VAULT_PATH from vault_utils for consistency
VAULT_PATH = vault_utils.VAULT_BASE_PATH
TMP_AI_OUTPUT = Path("./ai_temp.md")


# --- Minimalist UI Menu ---
MENU = """
Obsidian Vault Sync

1. Read AI Output & Deploy (Now reads from ai_batch_input.md)
2. Validate Notes
3. Index Notes
4. Clean Notes (Fix Broken Wiki-Links)
5. Combine Unit Notes
6. Full Sync (Reads AI input -> Deploy -> Validate -> Index)
7. Exit
"""

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def wait_for_user(message="Press Enter to continue..."):
    try:
        input(f"\n{message}")
    except (EOFError, StopIteration):
        print("(Auto-continue in test mode)")
        pass


def read_ai_input() -> str:
    clear_screen()
    print("Reading AI-generated markdown from 'ai_batch_input.md'...")
    input_file_path = Path("./ai_batch_input.md")

    if not input_file_path.exists():
        print(f"ERROR: '{input_file_path}' not found. Please create this file with your AI output.")
        wait_for_user()
        return ""

    full_content = ""
    try:
        full_content = vault_utils.read_file(input_file_path)
        print(f"Content loaded from '{input_file_path}'. Processing...")
    except Exception as e:
        print(f"An error occurred while reading '{input_file_path}': {e}.")
        wait_for_user()
        return ""
    
    # Remove the outermost ```markdown wrapper if present (legacy from AI)
    if full_content.startswith("```markdown") and full_content.endswith("```"):
        full_content = full_content[len("```markdown"): -len("```")].strip()

    # NEW CRITICAL FIX: Extract content specifically between --- START_BATCH --- and --- END_BATCH ---
    # This now explicitly extracts individual notes without re-adding the batch markers
    # to TMP_AI_OUTPUT, aligning with Deployer.py's expectation of individual notes.
    batch_content_match = re.search(
        r"--- START_BATCH ---\s*\n(.*?)\n\s*--- END_BATCH ---",
        full_content,
        re.DOTALL
    )
    
    content_to_process = ""
    if batch_content_match:
        content_to_process = batch_content_match.group(1)
        print("Detected batch markers. Extracting content within batch.")
    else:
        content_to_process = full_content
        print("No batch markers detected. Assuming entire input is notes content.")


    # Now, extract individual notes from the (potentially batch-wrapped) content
    note_pattern = re.compile(
        r"--- START_NOTE ---\s*\n(.*?)\n\s*--- END_NOTE ---",
        re.DOTALL
    )
    # The list of blocks now contains only the content between START_NOTE and END_NOTE
    cleaned_note_blocks = ["--- START_NOTE ---\n" + block.strip() + "\n--- END_NOTE ---" for block in note_pattern.findall(content_to_process)]
    cleaned_content = "\n".join(cleaned_note_blocks)
    
    if not cleaned_content.strip():
        print("No valid AI-generated notes found in the input after filtering.")
        return ""

    try:
        vault_utils.write_file(TMP_AI_OUTPUT, cleaned_content)
        print(f"AI output ({len(cleaned_note_blocks)} notes) saved temporarily.")
    except Exception as e:
        print(f"An error occurred while writing to temporary file '{TMP_AI_OUTPUT}': {e}.")
        return ""

    return cleaned_content


def deploy_notes_orchestrator():
    clear_screen()
    print("--- Initiating Note Deployment ---")
    if not TMP_AI_OUTPUT.exists():
        print("No AI output found in temp file. Please run option 1 or 6 first.")
        wait_for_user()
        return
    
    content_from_ai_temp = ""
    try:
        content_from_ai_temp = vault_utils.read_file(TMP_AI_OUTPUT)
    except Exception as e:
        print(f"An error occurred while reading temporary file '{TMP_AI_OUTPUT}' during deployment preparation: {e}.")
        wait_for_user()
        return

    print("Scanning vault for existing notes for deployment context...")
    current_vault_filesystem_snapshot = vault_utils.load_all_notes_metadata(VAULT_PATH)
    print(f"Found {len(current_vault_filesystem_snapshot)} existing notes in vault before deployment.")

    Deployer.deploy_notes_from_text(content_from_ai_temp, current_vault_filesystem_snapshot)

    if TMP_AI_OUTPUT.exists():
         try:
            TMP_AI_OUTPUT.unlink()
         except Exception as e:
            print(f"WARNING: Could not delete temporary file '{TMP_AI_OUTPUT}': {e}")

    print("\nDeployment process finished.")

def validate_notes():
    clear_screen()
    print("--- Running Note Validation (with Interactive Fixes) ---")
    try:
        Validator.main() # Validator.main() now handles interaction and file writes
    except Exception as e:
        print(f"An unexpected error occurred during validation: {e}")
    print("\nValidation process finished.")

def index_notes():
    clear_screen()
    print("--- Running Vault Indexing & MOC Generation ---")
    try:
        Indexer.main()
    except Exception as e:
        print(f"An unexpected error occurred during indexing: {e}")
    print("\nIndexing process finished.")

# NEW FUNCTION: Clean Notes
def clean_notes_orchestrator():
    clear_screen()
    print("--- Running Note Cleaning (Fix Broken Wiki-Links) ---")
    try:
        clean.main()
    except Exception as e:
        print(f"An unexpected error occurred during cleaning: {e}")
    print("\nNote cleaning process finished.")

# NEW FUNCTION: Combine Unit Notes
def combine_unit_notes_orchestrator():
    clear_screen()
    print("--- Running Unit Note Combination ---")
    try:
        unit_combinor.main()
    except Exception as e:
        print(f"An unexpected error occurred during unit combination: {e}")
    print("\nUnit note combination process finished.")


def full_sync():
    clear_screen()
    print("--- Initiating Full Synchronization Workflow ---")
    
    print("\nStep 1/4: Reading AI Output...")
    ai_content_read = read_ai_input()
    if not ai_content_read.strip():
        print("No AI output provided after filtering. Skipping deployment and subsequent steps.")
        wait_for_user()
        return
    wait_for_user("Press Enter to proceed with Deployment...")
    
    print("\nStep 2/4: Deploying Notes...")
    deploy_notes_orchestrator()
    wait_for_user("Press Enter to proceed with Validation...")
    
    print("\nStep 3/4: Validating Notes (with Interactive Fixes)...")
    validate_notes() # This will now prompt for fixes
    wait_for_user("Press Enter to proceed with Indexing...")
    
    print("\nStep 4/4: Indexing Vault & Generating MOCs...")
    index_notes()
    
    print("\nFull synchronization workflow completed.")

def main_menu():
    VAULT_PATH.mkdir(parents=True, exist_ok=True)

    while True:
        clear_screen()
        print(MENU)
        choice = input("Enter choice [1-7]: ").strip() # Update choice range

        if choice == "1":
            ai_output = read_ai_input()
            if ai_output.strip():
                deploy_notes_orchestrator()
        elif choice == "2":
            validate_notes()
        elif choice == "3":
            index_notes()
        elif choice == "4": # New option for clean notes
            clean_notes_orchestrator()
        elif choice == "5": # New option for combine unit notes
            combine_unit_notes_orchestrator()
        elif choice == "6": # Full Sync is now option 6
            full_sync()
        elif choice == "7": # Exit is now option 7
            print("Exiting. Goodbye!")
            break
        else:
            print("Invalid choice. Please try again.")
        wait_for_user()

if __name__ == "__main__":
    main_menu()