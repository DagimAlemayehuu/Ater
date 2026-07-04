import pytest
from pathlib import Path
from src.utils.vault_path import resolve_vault_path, is_safe_vault_path

@pytest.fixture
def vault_root(tmp_path):
    root = tmp_path / "vault"
    root.mkdir()
    return root

def test_resolve_vault_path_normal_relative(vault_root):
    # 1. Normal relative path inside vault resolves correctly
    user_path = "notes/a.md"
    expected = (vault_root / "notes/a.md").resolve()
    assert resolve_vault_path(vault_root, user_path) == expected

def test_resolve_vault_path_traversal(vault_root):
    # 2. Traversal "../escape.md" raises ValueError
    with pytest.raises(ValueError, match="Path escapes vault"):
        resolve_vault_path(vault_root, "../escape.md")

def test_resolve_vault_path_double_traversal(vault_root):
    # 3. Double traversal "notes/../../escape.md" raises ValueError
    with pytest.raises(ValueError, match="Path escapes vault"):
        resolve_vault_path(vault_root, "notes/../../escape.md")

def test_resolve_vault_path_url_encoded_traversal(vault_root):
    # 4. URL-encoded traversal "%2E%2E%2Fescape.md" raises ValueError
    with pytest.raises(ValueError, match="Path escapes vault"):
        resolve_vault_path(vault_root, "%2E%2E%2Fescape.md")

def test_resolve_vault_path_url_encoded_slash_traversal(vault_root):
    # 5. Encoded slash "%2F" in traversal raises ValueError
    with pytest.raises(ValueError, match="Path escapes vault"):
        resolve_vault_path(vault_root, "..%2Fescape.md")

def test_resolve_vault_path_absolute_inside_vault(vault_root):
    # 6. Absolute path inside vault is accepted
    abs_path = (vault_root / "notes/a.md").resolve()
    assert resolve_vault_path(vault_root, abs_path) == abs_path

def test_resolve_vault_path_absolute_outside_vault(vault_root):
    # 7. Absolute path outside vault ("/etc/passwd") raises ValueError
    with pytest.raises(ValueError, match="Path escapes vault"):
        resolve_vault_path(vault_root, "/etc/passwd")

def test_is_safe_vault_path_true(vault_root):
    # 8. is_safe_vault_path returns True for safe path
    assert is_safe_vault_path(vault_root, "notes/a.md") is True

def test_is_safe_vault_path_false(vault_root):
    # 9. is_safe_vault_path returns False for traversal
    assert is_safe_vault_path(vault_root, "../escape.md") is False
