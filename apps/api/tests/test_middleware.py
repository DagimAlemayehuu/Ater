import pytest
from src.api.main import _VaultPathCacheMiddleware
from src.api import state

@pytest.fixture(autouse=True)
def reset_state():
    """Reset global state before and after each test."""
    original_state = state._cached_vault_path
    state._cached_vault_path = None
    yield
    state._cached_vault_path = original_state

async def mock_asgi_app(scope, receive, send):
    """A dummy ASGI app that records if it was called."""
    scope["app_called"] = True

@pytest.mark.asyncio
async def test_vault_path_cache_middleware_happy_path():
    """Test that a valid x-vault-path header sets the state correctly."""
    middleware = _VaultPathCacheMiddleware(mock_asgi_app)
    scope = {
        "type": "http",
        "headers": [(b"x-vault-path", b"/test/vault/path")]
    }
    await middleware(scope, None, None)
    assert state._cached_vault_path == "/test/vault/path"
    assert scope.get("app_called") is True

@pytest.mark.asyncio
async def test_vault_path_cache_middleware_uppercase_header():
    """Test that header matching is case-insensitive."""
    middleware = _VaultPathCacheMiddleware(mock_asgi_app)
    scope = {
        "type": "http",
        "headers": [(b"X-Vault-Path", b"/test/vault/path2")]
    }
    await middleware(scope, None, None)
    assert state._cached_vault_path == "/test/vault/path2"
    assert scope.get("app_called") is True

@pytest.mark.asyncio
async def test_vault_path_cache_middleware_missing_header():
    """Test that missing header doesn't alter state."""
    middleware = _VaultPathCacheMiddleware(mock_asgi_app)
    scope = {
        "type": "http",
        "headers": [(b"other-header", b"value")]
    }
    await middleware(scope, None, None)
    assert state._cached_vault_path is None
    assert scope.get("app_called") is True

@pytest.mark.asyncio
async def test_vault_path_cache_middleware_empty_header():
    """Test that empty or whitespace header doesn't alter state."""
    middleware = _VaultPathCacheMiddleware(mock_asgi_app)
    scope = {
        "type": "http",
        "headers": [(b"x-vault-path", b"   ")]
    }
    await middleware(scope, None, None)
    assert state._cached_vault_path is None
    assert scope.get("app_called") is True

@pytest.mark.asyncio
async def test_vault_path_cache_middleware_non_http_scope():
    """Test that non-HTTP scopes (e.g. websocket) bypass header checks."""
    middleware = _VaultPathCacheMiddleware(mock_asgi_app)
    scope = {
        "type": "websocket",
        "headers": [(b"x-vault-path", b"/test/vault/path3")]
    }
    await middleware(scope, None, None)
    assert state._cached_vault_path is None
    assert scope.get("app_called") is True

@pytest.mark.asyncio
async def test_vault_path_cache_middleware_multiple_headers():
    """Test when multiple headers are present, and the right one is picked."""
    middleware = _VaultPathCacheMiddleware(mock_asgi_app)
    scope = {
        "type": "http",
        "headers": [
            (b"content-type", b"application/json"),
            (b"x-vault-path", b"/test/vault/path4"),
            (b"accept", b"*/*")
        ]
    }
    await middleware(scope, None, None)
    assert state._cached_vault_path == "/test/vault/path4"
    assert scope.get("app_called") is True
