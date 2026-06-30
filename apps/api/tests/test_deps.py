import pytest
from src.api.deps import sanitize_api_key

def test_sanitize_api_key_none():
    assert sanitize_api_key(None) is None

def test_sanitize_api_key_empty():
    assert sanitize_api_key("") is None
    assert sanitize_api_key("   ") is None
    assert sanitize_api_key("\n\r\t") is None

def test_sanitize_api_key_normal():
    assert sanitize_api_key("normal_api_key_123") == "normal_api_key_123"

def test_sanitize_api_key_whitespace():
    assert sanitize_api_key("  spaced_key  ") == "spaced_key"
    assert sanitize_api_key("\n\rnewline_key\r\n") == "newline_key"

def test_sanitize_api_key_quotes():
    assert sanitize_api_key("'single_quote_key'") == "single_quote_key"
    assert sanitize_api_key('"double_quote_key"') == "double_quote_key"
    assert sanitize_api_key("'  mixed_quote_key  \"") == "mixed_quote_key"

def test_sanitize_api_key_bearer():
    assert sanitize_api_key("Bearer my_token_123") == "my_token_123"
    assert sanitize_api_key("bearer my_token_123") == "my_token_123"
    assert sanitize_api_key("BEARER my_token_123") == "my_token_123"
    assert sanitize_api_key("Bearer   'my_token_123'  ") == "my_token_123"

def test_sanitize_api_key_non_ascii():
    assert sanitize_api_key("key_with_non_ascii_🚀") == "key_with_non_ascii_"
    assert sanitize_api_key("  Bearer  '🚀my_token_🤖'  ") == "my_token_"

def test_sanitize_api_key_empty_after_strip():
    assert sanitize_api_key("'\"'") is None
    assert sanitize_api_key("🚀") is None
