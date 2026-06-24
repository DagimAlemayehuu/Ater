import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from src.api.main import app
from src.domains.ater.artifact_service import (
    validate_artifact,
    select_candidate_types,
    evaluate_sql_query,
    evaluate_case_step,
    SQLQueryPlayground,
    SimulationPredict,
    ProofStep,
    EvidenceSelect,
    CaseSimulation
)

client = TestClient(app)

# =====================================================================
# 1. Advanced Schema Validation Tests
# =====================================================================

def test_validation_sql_query_playground():
    data = {
        "type": "sql_query_playground",
        "schema_ddl": "CREATE TABLE test (id INT);",
        "seed_sql": "INSERT INTO test VALUES (1);",
        "target_query": "SELECT * FROM test;",
        "initial_query": "SELECT * FROM test LIMIT 1;",
        "table_headers": ["id"]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, SQLQueryPlayground)
    assert obj.schema_ddl == data["schema_ddl"]

    # Missing field
    with pytest.raises(ValidationError):
        validate_artifact({
            "type": "sql_query_playground",
            "schema_ddl": "CREATE TABLE test (id INT);"
        })

def test_validation_simulation_predict():
    data = {
        "type": "simulation_predict",
        "states": [{"step": 0, "vars": {"x": 1}}],
        "checkpoints": [{"step_index": 0, "target_var": "x", "expected_value": "1", "question": "What is x?"}]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, SimulationPredict)
    assert obj.states[0]["vars"]["x"] == 1

def test_validation_proof_step():
    data = {
        "type": "proof_step",
        "steps": ["Step 1", "Step 2"],
        "reasons": ["Reason 1", "Reason 2"],
        "correct_order": [0, 1],
        "reason_mappings": [0, 1]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, ProofStep)
    assert obj.steps[0] == "Step 1"

def test_validation_evidence_select():
    data = {
        "type": "evidence_select",
        "raw_text": "hello world",
        "selectable_spans": [{"id": 0, "start": 0, "end": 5, "text": "hello"}],
        "target_spans": [0]
    }
    obj = validate_artifact(data)
    assert isinstance(obj, EvidenceSelect)
    assert obj.selectable_spans[0]["id"] == 0

def test_validation_case_simulation():
    data = {
        "type": "case_simulation",
        "stages": {
            "start": {
                "text": "Starting scenario",
                "choices": [{"text": "Go next", "next": "end", "modifications": {"integrity": -0.1}}]
            }
        },
        "metrics": {"integrity": 1.0, "time": 0.0},
        "success_conditions": {"integrity": {"min": 0.5}}
    }
    obj = validate_artifact(data)
    assert isinstance(obj, CaseSimulation)
    assert obj.metrics["integrity"] == 1.0

# =====================================================================
# 2. Modality Mapping Keyword Routing Tests
# =====================================================================

def test_modality_mapping_advanced_routing():
    # SQL query keyword routing
    types = select_candidate_types({"concept_modality": "Procedural"}, "Let's build a SQL database query.")
    assert "sql_query_playground" in types

    # Proof keyword routing
    types = select_candidate_types({"concept_modality": "Qualitative/Definitional"}, "Consider the logical theorem proof by induction.")
    assert "proof_step" in types

    # Trace/simulate keyword routing
    types = select_candidate_types({"concept_modality": "Procedural"}, "Trace this algorithm and simulate the array state in each iteration.")
    assert "simulation_predict" in types

    # Bug finding keyword routing
    types = select_candidate_types({"concept_modality": "Procedural"}, "Find error and locate line matching the bug or identify evidence.")
    assert "evidence_select" in types

    # Branching case study keyword routing
    types = select_candidate_types({"concept_modality": "Comparative"}, "Perform a branching case decision study scenario simulation.")
    assert "case_simulation" in types

# =====================================================================
# 3. Local SQL Evaluation Tests
# =====================================================================

def test_sql_evaluation_correct():
    schema = "CREATE TABLE users (id INT, name TEXT);"
    seed = "INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');"
    target = "SELECT name FROM users WHERE id = 1;"
    
    # Correct user query
    user_correct = "SELECT name FROM users WHERE id = 1;"
    res = evaluate_sql_query(schema, seed, target, user_correct)
    assert res["success"] is True
    assert res["error"] is None
    assert res["dataset"] == [{"name": "Alice"}]

def test_sql_evaluation_mismatch_data():
    schema = "CREATE TABLE users (id INT, name TEXT);"
    seed = "INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');"
    target = "SELECT name FROM users WHERE id = 1;"
    
    # Incorrect data
    user_incorrect = "SELECT name FROM users WHERE id = 2;"
    res = evaluate_sql_query(schema, seed, target, user_incorrect)
    assert res["success"] is False
    assert "mismatch" in res["error"].lower()

def test_sql_evaluation_syntax_error():
    schema = "CREATE TABLE users (id INT, name TEXT);"
    seed = "INSERT INTO users VALUES (1, 'Alice');"
    target = "SELECT name FROM users;"
    
    # Syntax error
    user_syntax_err = "SELECT name FRO users;" # misspelled FROM
    res = evaluate_sql_query(schema, seed, target, user_syntax_err)
    assert res["success"] is False
    assert "OperationalError" in res["error"] or "syntax error" in res["error"]

# =====================================================================
# 4. Case Simulation Metric Modification & Transition Tests
# =====================================================================

def test_case_simulation_evaluation():
    stages = {
        "start": {
            "text": "Root choice",
            "choices": [
                {"text": "Choice 1", "next": "stage_2", "modifications": {"integrity": -0.2, "stability": 0.1, "time": 10.0}}
            ]
        },
        "stage_2": {
            "text": "Second choice",
            "choices": []
        }
    }
    
    current_metrics = {"integrity": 1.0, "stability": 0.5, "time": 0.0}
    success_conditions = {"integrity": {"min": 0.7}, "stability": {"min": 0.4}}
    
    # Evaluate valid transition
    res = evaluate_case_step(stages, "start", 0, current_metrics, success_conditions)
    assert res["next_stage"] == "stage_2"
    # Clamping & updates
    assert res["metrics"]["integrity"] == pytest.approx(0.8)
    assert res["metrics"]["stability"] == pytest.approx(0.6)
    assert res["metrics"]["time"] == pytest.approx(10.0)
    assert res["ended"] is True
    assert res["success"] is True

    # Test clamping limits
    stages_clamp = {
        "start": {
            "text": "Root choice",
            "choices": [
                {"text": "Go down", "next": "end", "modifications": {"integrity": -1.5, "stability": 1.5}}
            ]
        },
        "end": {
            "text": "End",
            "choices": []
        }
    }
    res_clamp = evaluate_case_step(stages_clamp, "start", 0, current_metrics, success_conditions)
    assert res_clamp["metrics"]["integrity"] == 0.0 # Clamped to 0.0
    assert res_clamp["metrics"]["stability"] == 1.0 # Clamped to 1.0

# =====================================================================
# 5. FastAPI Endpoints Routing Tests
# =====================================================================

def test_endpoint_sql_evaluation():
    payload = {
        "playground": {
            "schema_ddl": "CREATE TABLE products (id INT, price INT);",
            "seed_sql": "INSERT INTO products VALUES (1, 100);",
            "target_query": "SELECT price FROM products WHERE id = 1;"
        },
        "query": "SELECT price FROM products WHERE id = 1;"
    }
    response = client.post("/api/ater/playground/sql/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["dataset"] == [{"price": 100}]

def test_endpoint_case_evaluation():
    payload = {
        "stages": {
            "start": {
                "text": "Decision time",
                "choices": [{"text": "Isolate system", "next": "stage_isolated", "modifications": {"stability": -0.1}}]
            },
            "stage_isolated": {
                "text": "System isolated",
                "choices": []
            }
        },
        "current_stage": "start",
        "choice_index": 0,
        "current_metrics": {"stability": 0.8},
        "success_conditions": {"stability": {"min": 0.5}}
    }
    response = client.post("/api/ater/playground/case/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["next_stage"] == "stage_isolated"
    assert data["metrics"]["stability"] == pytest.approx(0.7)
    assert data["ended"] is True
    assert data["success"] is True
