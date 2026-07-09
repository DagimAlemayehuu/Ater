import os
import pytest
from fastapi.testclient import TestClient

# We monkeypatch TestClient.request to automatically add the X-Ater-Token header
# This avoids having to update hundreds of individual test calls.
_original_request = TestClient.request

def _mocked_request(self, method, url, **kwargs):
    headers = kwargs.get("headers")
    if headers is None:
        headers = {}
        kwargs["headers"] = headers

    # Only add the token if it's not already explicitly provided (even if None)
    if "X-Ater-Token" not in headers and "x-ater-token" not in headers:
        headers["X-Ater-Token"] = "test-token"

    return _original_request(self, method, url, **kwargs)

TestClient.request = _mocked_request

@pytest.fixture(autouse=True)
def setup_sidecar_token(monkeypatch):
    """Automatically set ATER_SIDECAR_TOKEN for all tests."""
    monkeypatch.setenv("ATER_SIDECAR_TOKEN", "test-token")
