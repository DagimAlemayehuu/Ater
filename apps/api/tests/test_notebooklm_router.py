import pytest
from src.api.routers.notebooklm import safe_artifact_filename

def test_safe_artifact_filename_basic():
    filename = safe_artifact_filename(
        notebook_id="1234567890",
        artifact_type="audio",
        artifact_id="abc",
        output_format=None
    )
    assert filename == "12345678_audio_abc.m4a"

def test_safe_artifact_filename_with_output_format():
    filename = safe_artifact_filename(
        notebook_id="1234567890",
        artifact_type="audio",
        artifact_id="abc",
        output_format="pdf"
    )
    assert filename == "12345678_audio_abc.pdf"

def test_safe_artifact_filename_missing_artifact_id():
    filename = safe_artifact_filename(
        notebook_id="1234567890",
        artifact_type="audio",
        artifact_id=None,
        output_format=None
    )
    assert filename == "12345678_audio_latest.m4a"

def test_safe_artifact_filename_sanitization():
    filename = safe_artifact_filename(
        notebook_id="!@#$%^&*",
        artifact_type="audio",
        artifact_id="abc!@#def",
        output_format=None
    )
    assert filename == "_________audio_abc___def.m4a"

def test_safe_artifact_filename_unknown_artifact_type():
    filename = safe_artifact_filename(
        notebook_id="12345678",
        artifact_type="unknown",
        artifact_id="abc",
        output_format=None
    )
    assert filename == "12345678_unknown_abc.bin"

def test_safe_artifact_filename_unknown_output_format():
    filename = safe_artifact_filename(
        notebook_id="12345678",
        artifact_type="audio",
        artifact_id="abc",
        output_format="unknown_format"
    )
    assert filename == "12345678_audio_abc.m4a"
