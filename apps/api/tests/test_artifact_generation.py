from src.api.routers.ai import _build_rubiks_cube_sandbox, _is_rubiks_sandbox_request


def test_rubiks_sandbox_request_is_detected_from_common_misspelling():
    assert _is_rubiks_sandbox_request("interactive rubics cube stepper")


def test_rubiks_sandbox_contains_cube_controls_and_reset():
    code = _build_rubiks_cube_sandbox()

    assert "Rubik" in code
    assert 'const moves=["U","U' in code
    assert "button.dataset.move=move" in code
    assert "applyMove(move)" in code
    assert "rotateFace(face" in code
    assert "const cubeState" in code
    assert "Reset" in code
    assert "<script>" in code


def test_rubiks_sandbox_uses_large_interactive_cube_stage():
    code = _build_rubiks_cube_sandbox()

    assert "cube-net" in code
    assert "applySequence" in code
    assert "aria-label=\"Practice move" in code
    assert "data-face" in code
    assert "cube.appendChild(faceEl)" in code


def test_rubiks_sandbox_detection_with_previous_code():
    # If no previous code, default sandbox spec containing "button" and "color" should still return True
    prompt = "interactive Rubik's Cube lesson stepper with reset button and simple colored 3D cube visualization"
    assert _is_rubiks_sandbox_request(prompt, "") is True

    # If there is previous code, any edit request containing "color" or "neon" should return False
    assert _is_rubiks_sandbox_request("change the colors to bright neon", "existing-code") is False

    # If there is previous code, we should always return False to let the LLM edit it inline
    assert _is_rubiks_sandbox_request("teach me rubik", "existing-code") is False


def test_generate_artifact_code_rubiks_edit():
    from unittest.mock import MagicMock, patch, AsyncMock
    from fastapi.testclient import TestClient
    from src.api.main import app
    from src.api.deps import get_app_secrets

    client = TestClient(app)
    
    mock_resp = MagicMock()
    mock_resp.content = "modified cube code"
    
    mock_secrets = MagicMock()
    mock_secrets.ai_key = "mock-key"
    mock_secrets.ai_provider = "google"
    mock_secrets.ai_model = "gemini-2.0-flash"
    app.dependency_overrides[get_app_secrets] = lambda: mock_secrets
    
    try:
        with patch("src.api.routers.ai.ModelFactory.get_model") as mock_factory:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(return_value=mock_resp)
            mock_factory.return_value = mock_llm
            
            payload = {
                "prompt": "make it black and white",
                "context": "Rubik's cube lesson",
                "previous_code": "<div class=\"rubik-shell\">...</div>"
            }
            
            response = client.post("/api/ater/artifact/generate", json=payload)
            
            assert response.status_code == 200
            assert response.json()["code"] == "modified cube code"
            
            mock_llm.ainvoke.assert_called_once()
            args, _ = mock_llm.ainvoke.call_args
            messages = args[0]
            
            system_msg = messages[0][1]
            human_msg = messages[1][1]
            
            assert "Rubik's Cube Flat Net Simulator" in system_msg
            assert "<div class=\"rubik-shell\">...</div>" in human_msg
            assert "make it black and white" in human_msg
    finally:
        app.dependency_overrides.clear()


