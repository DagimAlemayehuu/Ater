import os
import sys

# add apps/api to path
sys.path.append(os.path.join(os.getcwd(), 'apps/api/src'))
sys.path.append(os.path.join(os.getcwd(), 'apps/api'))

from src.domains.oka.vault_manager import VaultManager

vm = VaultManager("/mock/vault", academic_base="/mock/vault/Academic")
meta = {"title": "dummy", "course": "Test Course", "unit": "Test Unit"}
note_path = vm.get_note_path(meta)
print("Note path:", note_path)
print("Parent:", note_path.parent)
try:
    print("Relative:", note_path.parent.relative_to(vm.vault_path))
except ValueError as e:
    print("Relative error:", e)
