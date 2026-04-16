import sys
from pathlib import Path

# Add project root to sys.path to import local modules
sys.path.append('.')

from apps.api.src.domains.oka.vault_manager import VaultManager

vm = VaultManager('.')
meta = {
    'course': '[[Database Systems]]',
    'unit': 3,
    'source': '[[Chapter_3.pdf]]'
}

print(f"--- START YAML TEST ---")
print(vm.dump_obsidian_yaml(meta))
print(f"--- END YAML TEST ---")
