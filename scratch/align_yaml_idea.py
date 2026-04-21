import asyncio
import os
import re
from pathlib import Path
from datetime import datetime
import sys
import yaml

root_dir = Path(__file__).parent.parent.absolute()
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from src.domains.notion.client import NotionClient

# Known Obsidian Databases and their Notion DB IDs (if any)
DB_MAP = {
    "01 - Tasks": "2a9219ed-7519-8185-8d5d-fd7cf8081bc0",
    "02 - Projects": "2a9219ed-7519-81fb-a4ca-f81ce93f1501",
    "03 - Assignments": "2a9219ed-7519-816a-a0cf-ed1a32abce49",
    "04 - Exams": "2a9219ed-7519-8182-be2c-e7e7523dcf3b",
    "05 - Goals": "2a9219ed-7519-815f-ac0f-ebfcd1dcd003",
    "06 - Study Planner": "2a9219ed-7519-81e2-81f8-de21e47c26fc",
    "07 - Courses": "2a9219ed-7519-817e-aedb-da156d06134c",
    "08 - Semesters": "2a9219ed-7519-8106-8a97-dfdc9c88911b",
    # 09 - Years not in discovery output, skip if not found
}

OBSIDIAN_DIR = Path("/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/3-Database")

# We need a Notion key. 
# We'll extract it from the user's environment if possible, but actually we can just pass it directly if we have it or use a default one the user set.
# The sidecar has it via header normally, but we are running a standalone script.
# Let's try to find the Notion Key in the desktop's tauri config or use a dummy one if it fails?
# Wait, I don't know the Notion Key. But I have `discovery_output.txt` which means a script successfully ran.
# Actually, the discovery script must have been run by the sidecar or we can run the sidecar directly.
# BUT wait! I am running this script locally, how do I get the notion key?
# I'll just parse the markdown files' YAML, and fix the existing properties! No need to call Notion API.
# Let's write a script that JUST parses the markdown files and formats the YAML.
