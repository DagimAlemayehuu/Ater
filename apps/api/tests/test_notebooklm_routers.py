import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from src.api.routers.notebooklm import get_notebooklm_artifact_dir, safe_artifact_filename

def test_get_notebooklm_artifact_dir():
    with patch("src.api.routers.notebooklm.Path.home") as mock_home:
        mock_home_path = MagicMock(spec=Path)
        mock_home.return_value = mock_home_path

        mock_ater = MagicMock(spec=Path)
        mock_home_path.__truediv__.return_value = mock_ater

        mock_artifacts = MagicMock(spec=Path)
        mock_ater.__truediv__.return_value = mock_artifacts

        result = get_notebooklm_artifact_dir()

        assert result == mock_artifacts

        # Verify mkdir was called correctly
        mock_artifacts.mkdir.assert_called_once_with(parents=True, exist_ok=True)


class TestSafeArtifactFilename:
    @patch.dict("src.api.routers.notebooklm.DOWNLOAD_EXTENSIONS", {"quiz": "json"})
    def test_basic_generation(self):
        result = safe_artifact_filename(
            notebook_id="notebook123",
            artifact_type="quiz",
            artifact_id="art123",
            output_format=None
        )
        assert result == "notebook_quiz_art123.json"

    @patch.dict("src.api.routers.notebooklm.FORMAT_EXTENSIONS", {"markdown": "md"})
    def test_custom_output_format(self):
        result = safe_artifact_filename(
            notebook_id="notebook123",
            artifact_type="report",
            artifact_id="art123",
            output_format="markdown"
        )
        assert result == "notebook_report_art123.md"

    @patch.dict("src.api.routers.notebooklm.DOWNLOAD_EXTENSIONS", {"quiz": "json"})
    def test_truncation(self):
        result = safe_artifact_filename(
            notebook_id="1234567890",
            artifact_type="quiz",
            artifact_id="123456789012345",
            output_format=None
        )
        assert result == "12345678_quiz_123456789012.json"

    @patch.dict("src.api.routers.notebooklm.DOWNLOAD_EXTENSIONS", {"quiz": "json"})
    def test_default_artifact_id(self):
        result = safe_artifact_filename(
            notebook_id="nb1",
            artifact_type="quiz",
            artifact_id=None,
            output_format=None
        )
        assert result == "nb1_quiz_latest.json"

    def test_fallback_extension(self):
        result = safe_artifact_filename(
            notebook_id="nb1",
            artifact_type="unknown_type",
            artifact_id="art1",
            output_format=None
        )
        assert result == "nb1_unknown_type_art1.bin"

    def test_sanitization(self):
        result = safe_artifact_filename(
            notebook_id="n/b!1",
            artifact_type="qui z*",
            artifact_id="a@r#t",
            output_format=None
        )
        assert result == "n_b_1_qui_z__a_r_t.bin"
