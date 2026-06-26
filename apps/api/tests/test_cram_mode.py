from src.domains.ater.cram_service import calculate_weakness_score, calculate_phase_allocations, check_rescue_mode, filter_question_mix, CramPhase

def test_phase_allocations():
    # 60 minutes
    alloc = calculate_phase_allocations(60)
    assert alloc[CramPhase.orientation.value] == 6.0
    assert alloc[CramPhase.high_yield.value] == 12.0
    assert alloc[CramPhase.active_recall.value] == 30.0
    assert alloc[CramPhase.mistake_repair.value] == 12.0
    
    # 15 minutes (compressed)
    alloc_short = calculate_phase_allocations(15)
    assert alloc_short[CramPhase.orientation.value] == 0.0
    assert alloc_short[CramPhase.high_yield.value] == 3.0
    assert alloc_short[CramPhase.active_recall.value] == 9.0
    assert alloc_short[CramPhase.mistake_repair.value] == 3.0

def test_weakness_prioritization():
    # Base case
    base = calculate_weakness_score(diagnostic_incorrect=False, diagnostic_taken=True)
    # High confidence mistake should have higher score
    high_mismatch = calculate_weakness_score(diagnostic_incorrect=False, diagnostic_taken=True, high_confidence_mistakes=2)
    assert high_mismatch > base
    
    # Low FSRS retrievability
    low_fsrs = calculate_weakness_score(diagnostic_incorrect=False, diagnostic_taken=True, fsrs_retrievability=0.2)
    assert low_fsrs > base

def test_fallback_scoring():
    # No FSRS, no telemetry
    fallback = calculate_weakness_score(fsrs_retrievability=None, yield_weight=None)
    assert fallback > 0

def test_rescue_mode():
    assert check_rescue_mode(4.0, 60)
    assert check_rescue_mode(8.0, 60) # 8 < 60*0.15 = 9
    assert not check_rescue_mode(15.0, 60)

def test_filter_question_mix():
    questions = [
        {"type": "short-answer"},
        {"type": "essay"},
        {"type": "essay"},
        {"type": "trace"}
    ]
    filtered = filter_question_mix(questions)
    assert len(filtered) == 3 # 2 rapid, 1 essay
    assert filtered[0]["type"] == "short-answer"
    assert filtered[1]["type"] == "trace"
    assert filtered[2]["type"] == "essay"
