"""
OKA Vault Service - Handles Obsidian vault interactions for OKA.
Includes validation, hub structure parsing, and note deployment.
"""

import os
import re
from datetime import datetime
from loguru import logger


from src.domains.oka.vault_utils import VaultUtils


def is_valid_vault(vault_path: str) -> bool:
    """Checks if the given path is a valid Obsidian vault."""
    if not vault_path or not os.path.exists(vault_path):
        return False
    return os.path.isdir(os.path.join(vault_path, ".obsidian"))


def parse_hub_structure(hub_path: str) -> list[dict]:
    """
    Reads a Hub .md file and parses the `# Connections` section
    to determine which linked notes exist or are missing.
    """
    if not os.path.exists(hub_path):
        return []

    with open(hub_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    in_connections = False
    connections_text = []

    for line in lines:
        if line.startswith("# Connections"):
            in_connections = True
            continue
        if in_connections and line.startswith("# ") and not line.startswith("# Connections"):
            break
        if in_connections:
            connections_text.append(line)

    if not connections_text:
        return []

    results = []
    # Use vault base for recursive search
    # Assuming hub is inside the unit folder
    # Vault -> 1-Academic -> Year -> Sem -> Course -> Unit -> Hub
    vault_base = hub_path
    for _ in range(6): # Move up to vault root
        vault_base = os.path.dirname(vault_base)

    pattern = re.compile(r'-\s*\[.*?\]\s*\[\[(.*?)\]\]')

    for line in connections_text:
        match = pattern.search(line)
        if match:
            link_name = match.group(1)
            expected_file = f"{link_name}.md"

            exists = False
            for root, _, files in os.walk(vault_base):
                if expected_file in files:
                    exists = True
                    break

            results.append({
                "title": link_name,
                "status": "deployed" if exists else "missing",
            })

    return results


def deploy_notes_to_vault(notes: list, vault_path: str):
    """
    Deploys parsed notes to the Obsidian vault.
    Creates directory structure based on YAML frontmatter metadata.
    If a note is missing YAML, injects it from the note's own metadata.
    """
    logger.info(f"Starting deployment of {len(notes)} notes to {vault_path}")

    deployed: list[str] = []
    skipped: list[dict] = []

    for note in notes:
        content = note.get('content', '')
        note_title = note.get('title', 'Untitled')
        note_type = note.get('type', 'Concept')

        try:
            # 1. Validate YAML and extract metadata
            validation = VaultUtils.validate_yaml_integrity(content)
            if not validation["valid"]:
                logger.warning(f"Note '{note_title}' fails YAML validation: {validation.get('error')}. Injecting fallback YAML.")
                # Inject YAML frontmatter from note-level metadata
                canonical_title = VaultUtils.get_canonical_title(note_title)
                fallback_yaml = (
                    "---\n"
                    f'title: "{canonical_title}"\n'
                    f'type: "{note_type}"\n'
                    f'year: "Unsorted_Year"\n'
                    f'semester: "Unsorted_Semester"\n'
                    f'course: "General_Course"\n'
                    f'unit: "Uncategorized_Unit"\n'
                    "---\n\n"
                )
                # If content already has a broken YAML block, strip it
                import re as _re
                content = _re.sub(r'^---\s*[\s\S]*?\s*---\s*', '', content, count=1).lstrip()
                content = fallback_yaml + content
                # Re-validate
                validation = VaultUtils.validate_yaml_integrity(content)
                if not validation["valid"]:
                    logger.error(f"Note '{note_title}' still fails after YAML injection. Skipping.")
                    skipped.append({
                        "title": note_title,
                        "error": validation.get("error", "Invalid YAML after injection"),
                    })
                    continue

            metadata = validation["metadata"]
            
            # 2. Generate canonical path
            target_file = VaultUtils.get_note_path_hierarchical(vault_path, metadata)
            target_dir = os.path.dirname(target_file)
            
            os.makedirs(target_dir, exist_ok=True)

            logger.info(f"Deploying note to: {target_file}")

            # 3. Handle updates vs new notes
            if os.path.exists(target_file):
                with open(target_file, 'a', encoding='utf-8') as f:
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    f.write(f"\n\n---\n*AI Refinement Log appended on {timestamp}*\n\n{content}")
            else:
                with open(target_file, 'w', encoding='utf-8') as f:
                    f.write(content)
            deployed.append(target_file)

        except Exception as e:
            logger.error(f"Failed to deploy note '{note_title}': {e}")
            skipped.append({
                "title": note_title,
                "error": str(e),
            })

    return {"deployed": deployed, "skipped": skipped}

