import pytest
from src.domains.oka.vault_manager import VaultManager
from pathlib import Path

def test_vault_manager_dump_obsidian_yaml():
    vm = VaultManager("/tmp/mock_vault")
    metadata = {
        "title": "Test Title",
        "course": "Math 101",
        "hub": "[[Math Hub]]",
        "prerequisites": ["[[Calculus]]", "Algebra"],
        "normal_list": ["apple", "banana"]
    }
    yaml_str = vm.dump_obsidian_yaml(metadata)
    assert 'title: Test Title' in yaml_str
    assert 'hub: "[[Math Hub]]"' in yaml_str
    assert '- "[[Calculus]]"' in yaml_str
    # The normal list is not a wikilink field, so it won't force quotes unless necessary, but should match expectations
    assert '- apple' in yaml_str

def test_vault_manager_process_code_blocks():
    vm = VaultManager("/tmp/mock_vault")
    content = """
Here is some code:
--- START_CODE: python ---
def hello():
    print("hello")
--- END_CODE: python ---
And some normal text.
"""
    processed = vm.process_code_blocks(content)
    assert "```python" in processed
    assert "def hello():" in processed
    assert "--- START_CODE" not in processed
