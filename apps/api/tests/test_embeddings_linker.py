import sys
import pytest
import numpy as np
import re
from unittest.mock import MagicMock

# ──────────────────────────────────────────────────────────────────────────────
# Guard: mock heavy ML deps so this module can be collected in environments
# where `transformers` and `onnxruntime` are not installed.
# ──────────────────────────────────────────────────────────────────────────────
_mock_transformers = MagicMock()
_mock_tokenizer_instance = MagicMock()
_mock_tokenizer_instance.return_value = {
    "input_ids": np.array([[1, 2, 3]]),
    "attention_mask": np.array([[1, 1, 1]]),
}
_mock_transformers.AutoTokenizer.from_pretrained.return_value = _mock_tokenizer_instance
sys.modules.setdefault("transformers", _mock_transformers)
sys.modules.setdefault("onnxruntime", MagicMock())

from src.domains.ater.keywords import chunk_text, reduce_concepts
from src.domains.ater.embeddings_linker import EmbeddingsLinker
from src.domains.ater.validator import AterValidator

# Detect if a real ONNX model is available — only when transformers is genuinely installed
_MODEL_AVAILABLE = False
try:
    import sys as _sys
    _real_transformers = _sys.modules.get("transformers")
    _is_mocked = isinstance(_real_transformers, MagicMock)
    if not _is_mocked:
        _linker_check = EmbeddingsLinker()
        _mp = _linker_check._get_model_paths()
        _MODEL_AVAILABLE = _mp[1].exists()
except Exception:
    pass

requires_model = pytest.mark.skipif(
    not _MODEL_AVAILABLE,
    reason="ONNX model file not available in this environment"
)

def test_chunk_text_slicing():
    """Verify overlapping text slicing, clean boundary handling, and whitespace/junk pruning."""
    # Test simple slicing with overlap
    text = "abcdefghijklmnopqrstuvwxyz"
    # Slices with size 10, overlap 3
    # Slice 1: text[0:10] = "abcdefghij"
    # Slice 2: text[7:17] = "hijklmnopq"
    # Slice 3: text[14:24] = "opqrstuvwx"
    # Slice 4: text[21:26] = "vwxyz"
    chunks = chunk_text(text, chunk_size=10, overlap=3)
    assert len(chunks) == 4
    assert chunks[0] == "abcdefghij"
    assert chunks[1] == "hijklmnopq"
    assert chunks[2] == "opqrstuvwx"
    assert chunks[3] == "vwxyz"

    # Test leading/trailing space/junk cleaning
    junk_text = "\n\n  --- Some text here ---\n\n"
    cleaned_chunks = chunk_text(junk_text, chunk_size=100, overlap=10)
    assert len(cleaned_chunks) == 1
    assert cleaned_chunks[0] == "--- Some text here ---"


def test_reduce_concepts():
    """Verify programmatic map-reduce concept merging, page unioning, contextual concatenations, and prerequisite deduplication."""
    notes = [
        {
            "title": "Quantum_Computing",
            "description": "Short description of Quantum Computing.",
            "source_context": "Context from Chapter 1.",
            "source_pages": [1, 2],
            "prerequisites": ["[[Physics]]"],
            "concept_modality": "Qualitative/Definitional",
            "mode": "core"
        },
        {
            "title": "quantum computing",
            "description": "A much longer and more informative description for Quantum Computing, providing detailed execution paradigms.",
            "source_context": "Context from Chapter 2.",
            "source_pages": [2, 3],
            "prerequisites": ["[[Linear_Algebra]]", "[[Physics]]"],
            "concept_modality": "Qualitative/Definitional",
            "mode": "core"
        }
    ]

    merged = reduce_concepts(notes)
    assert len(merged) == 1
    note = merged[0]
    
    # 1. Correct Title Normalization
    assert note["title"] == "Quantum_Computing"
    # 2. Keep the longer description
    assert note["description"] == "A much longer and more informative description for Quantum Computing, providing detailed execution paradigms."
    # 3. Double-newline clean context join
    assert note["source_context"] == "Context from Chapter 1.\n\nContext from Chapter 2."
    # 4. Pages sorted ascending union
    assert note["source_pages"] == [1, 2, 3]
    # 5. Prerequisites deduplicated
    assert sorted(note["prerequisites"]) == sorted(["[[Physics]]", "[[Linear_Algebra]]"])


@requires_model
def test_embeddings_linker_onnx():
    """Verify local ONNX lazy-loading, shape validation of embeddings (N, 384), normalization, and manual unload memory release."""
    linker = EmbeddingsLinker()
    
    # 1. Lazy-loading session and tokenizer
    session, tokenizer = linker.load_model()
    assert session is not None
    assert tokenizer is not None

    # 2. Shape validation of embeddings (N, 384)
    texts = ["Hello, this is a test concept definition.", "Another concept description here."]
    embeddings = linker.get_embeddings(texts)
    assert embeddings.shape == (2, 384)

    # 3. Verify normalization (norms are exactly unit vectors)
    norms = np.linalg.norm(embeddings, axis=1)
    assert np.allclose(norms, 1.0, atol=1e-5)

    # 4. Memory unload resource release
    linker.unload()
    assert EmbeddingsLinker._session is None
    assert EmbeddingsLinker._tokenizer is None


@requires_model
def test_prerequisite_mapping():
    """Verify semantic prerequisites mapping (>0.65), exact-page co-requisites resolution, and programmatically escaped title regex matching."""
    notes = [
        {
            "title": "Quantum_Physics",
            "description": "Quantum physics deals with discrete units of energy called quanta.",
            "source_pages": [1],
            "prerequisites": [],
            "concept_modality": "Qualitative/Definitional"
        },
        {
            "title": "Quantum_Computing",
            "description": "Quantum Computing leverages the principles of Quantum Physics to compute complex algorithms in parallel.",
            "source_pages": [5],
            "prerequisites": [],
            "concept_modality": "Qualitative/Definitional"
        },
        {
            "title": "Same_Page_Concept",
            "description": "This concept is on the exact same page, discussing Quantum Physics without being a prerequisite.",
            "source_pages": [1],
            "prerequisites": [],
            "concept_modality": "Qualitative/Definitional"
        }
    ]

    linker = EmbeddingsLinker()
    res = linker.map_prerequisites(notes, full_text="quantum physics quantum computing same page concept")
    
    physics_note = next(n for n in res if n["title"] == "Quantum_Physics")
    computing_note = next(n for n in res if n["title"] == "Quantum_Computing")
    same_page_note = next(n for n in res if n["title"] == "Same_Page_Concept")

    # 1. Explicit cross-reference should match "Quantum Physics" inside Quantum Computing's description (ignoring case/underscores)
    assert "[[Quantum_Physics]]" in computing_note["prerequisites"]

    # 2. Co-requisites tie-breaker: Quantum_Physics and Same_Page_Concept are on the exact same page. No prerequisite edge should be formed.
    assert "[[Quantum_Physics]]" not in same_page_note["prerequisites"]
    assert "[[Same_Page_Concept]]" not in physics_note["prerequisites"]


def test_cycle_breaking():
    """Verify DFS loop detection and weakest edge pruning based on similarity weights."""
    # Setup a cycle: A -> B -> C -> A
    notes = [
        {
            "title": "Concept_A",
            "description": "First concept",
            "source_pages": [1],
            "prerequisites": ["[[Concept_C]]"] # C -> A
        },
        {
            "title": "Concept_B",
            "description": "Second concept",
            "source_pages": [2],
            "prerequisites": ["[[Concept_A]]"] # A -> B
        },
        {
            "title": "Concept_C",
            "description": "Third concept",
            "source_pages": [3],
            "prerequisites": ["[[Concept_B]]"] # B -> C
        }
    ]

    # Mock Similarity Matrix:
    # A=0, B=1, C=2
    # Sim(A, B) = 0.95
    # Sim(B, C) = 0.85
    # Sim(C, A) = 0.70  <- Weakest edge
    sim_matrix = np.array([
        [1.0, 0.95, 0.70],
        [0.95, 1.0, 0.85],
        [0.70, 0.85, 1.0]
    ])
    title_to_idx = {"Concept_A": 0, "Concept_B": 1, "Concept_C": 2}

    linker = EmbeddingsLinker()
    res = linker.break_cycles(notes, sim_matrix, title_to_idx)
    
    note_a = next(n for n in res if n["title"] == "Concept_A")
    note_b = next(n for n in res if n["title"] == "Concept_B")
    note_c = next(n for n in res if n["title"] == "Concept_C")

    # The weakest edge C -> A (where C is the prerequisite of A) must be removed.
    assert "[[Concept_C]]" not in note_a["prerequisites"]
    # The other stronger edges must be preserved
    assert "[[Concept_A]]" in note_b["prerequisites"]
    assert "[[Concept_B]]" in note_c["prerequisites"]


def test_cluster_synthesis_notes():
    """Verify Connected Components Single-Linkage clustering (>0.75) and deterministic name formatting."""
    notes = [
        {"title": "Concept_A", "description": "Details of Concept A.", "source_pages": [1], "source_context": "Context A", "prerequisites": []},
        {"title": "Concept_B", "description": "Details of Concept B.", "source_pages": [2], "source_context": "Context B", "prerequisites": []},
        {"title": "Concept_C", "description": "Details of Concept C.", "source_pages": [3], "source_context": "Context C", "prerequisites": []}
    ]

    # Matrix:
    # Sim(A, B) = 0.80 (cluster connection)
    # Sim(B, C) = 0.78 (cluster connection)
    # Sim(A, C) = 0.60 (not directly similar, but connected under single-linkage linkage)
    sim_matrix = np.array([
        [1.0, 0.80, 0.60],
        [0.80, 1.0, 0.78],
        [0.60, 0.78, 1.0]
    ])

    linker = EmbeddingsLinker()
    res = linker.cluster_synthesis_notes(notes, sim_matrix)

    # A, B, and C must group into a single cluster synthesis note
    assert len(res) == 4
    synth_note = res[-1]
    
    # 1. Alphabetically sorted naming
    assert synth_note["title"] == "Concept_A_Concept_B_Concept_C_Synthesis"
    # 2. Default modality
    assert synth_note["concept_modality"] == "Comparative"
    # 3. Direct members as prerequisites
    assert sorted(synth_note["prerequisites"]) == sorted(["[[Concept_A]]", "[[Concept_B]]", "[[Concept_C]]"])
    # 4. Pages union
    assert synth_note["source_pages"] == [1, 2, 3]
    # 5. Concatenated contexts
    assert synth_note["source_context"] == "Context A\n\nContext B\n\nContext C"


def test_cluster_synthesis_notes_many():
    """Verify synthesis naming for larger clusters (>3 members) appends _And_Others_Synthesis."""
    notes = [
        {"title": "Concept_D", "description": "Details D.", "source_pages": [4], "source_context": "Ctx D"},
        {"title": "Concept_A", "description": "Details A.", "source_pages": [1], "source_context": "Ctx A"},
        {"title": "Concept_C", "description": "Details C.", "source_pages": [3], "source_context": "Ctx C"},
        {"title": "Concept_B", "description": "Details B.", "source_pages": [2], "source_context": "Ctx B"}
    ]
    # All highly similar
    sim_matrix = np.ones((4, 4))
    
    linker = EmbeddingsLinker()
    res = linker.cluster_synthesis_notes(notes, sim_matrix)
    
    synth_note = res[-1]
    assert synth_note["title"] == "Concept_A_Concept_B_Concept_C_And_Others_Synthesis"


def test_topological_sort():
    """Verify Kahn's topological sorting resolving dependencies, with page numbers and text character offset tie-breakers."""
    notes = [
        {
            "title": "Concept_B",
            "prerequisites": ["[[Concept_A]]"],
            "source_pages": [3],
            "description": "Concept B details"
        },
        {
            "title": "Concept_A",
            "prerequisites": [],
            "source_pages": [2],
            "description": "Concept A details"
        },
        {
            "title": "Concept_C",
            "prerequisites": [],
            "source_pages": [2],
            "description": "Concept C details"
        },
        {
            "title": "Concept_D",
            "prerequisites": [],
            "source_pages": [1],
            "description": "Concept D details"
        }
    ]
    
    raw_text = "Here we introduce Concept D. Later on page 2, Concept C is explained, and then we discuss Concept A."
    # offsets check:
    # Concept_D starts at index 25
    # Concept_C starts at index 50
    # Concept_A starts at index 90
    
    linker = EmbeddingsLinker()
    sorted_notes = linker.topological_sort(notes, raw_text)
    
    sorted_titles = [n["title"] for n in sorted_notes]
    
    # 1. Concept_D on page 1 must come first
    # 2. Concept_C (page 2, offset 50) must come before Concept_A (page 2, offset 90) because of raw text offset tie-breaker
    # 3. Concept_B (page 3, depends on Concept_A) must come last
    assert sorted_titles == ["Concept_D", "Concept_C", "Concept_A", "Concept_B"]
