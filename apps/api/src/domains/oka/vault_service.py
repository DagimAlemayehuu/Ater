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
    """
    logger.info(f"Starting deployment of {len(notes)} notes to {vault_path}")

    for note in notes:
        content = note.get('content', '')
        
        # 1. Validate YAML and extract metadata
        validation = VaultUtils.validate_yaml_integrity(content)
        if not validation["valid"]:
            logger.error(f"Note fails YAML validation: {validation['error']}. Skipping.")
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
                # Append with refinement log style
                # Protocol A.1.3.6 mentions refinement log
                f.write(f"\n\n---\n*AI Refinement Log appended on {timestamp}*\n\n{content}")
        else:
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(content)

