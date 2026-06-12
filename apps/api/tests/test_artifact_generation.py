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

    assert "cube-perspective" in code
    assert "face-net" not in code
    assert "applySequence" in code
    assert "aria-label=\"Practice move" in code
    assert "data-face" in code
    assert "cube.appendChild(faceEl)" in code
    assert "net.appendChild" not in code
