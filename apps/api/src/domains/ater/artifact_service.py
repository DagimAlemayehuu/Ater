import datetime
import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Union, Literal, Any, Optional
from pydantic import BaseModel, Field, ValidationError

# =====================================================================
# 1. Pydantic Models for 10 Artifact Types
# =====================================================================

class RevealCard(BaseModel):
    type: Literal["reveal_card"] = "reveal_card"
    front: str
    back: str

class ClozeMulti(BaseModel):
    type: Literal["cloze_multi"] = "cloze_multi"
    text: str
    options: List[str]

class MatchingPairItem(BaseModel):
    left: str
    right: str

class MatchingPairs(BaseModel):
    type: Literal["matching_pairs"] = "matching_pairs"
    pairs: List[MatchingPairItem]

class SortableSteps(BaseModel):
    type: Literal["sortable_steps"] = "sortable_steps"
    steps: List[str]

class StateStepper(BaseModel):
    type: Literal["state_stepper"] = "state_stepper"
    states: List[str]
    transitions: List[str]

class ConceptNode(BaseModel):
    id: str
    label: str

class ConceptEdge(BaseModel):
    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    label: str

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True

class ConceptMap(BaseModel):
    type: Literal["concept_map"] = "concept_map"
    nodes: List[ConceptNode]
    edges: List[ConceptEdge]

class TableLens(BaseModel):
    type: Literal["table_lens"] = "table_lens"
    headers: List[str]
    rows: List[List[str]]

class CodeTrace(BaseModel):
    type: Literal["code_trace"] = "code_trace"
    code: str
    steps: List[str]
    variables: List[Dict[str, str]]

class FormulaCard(BaseModel):
    type: Literal["formula_card"] = "formula_card"
    expression: str
    variables: Dict[str, str]
    derivation: List[str]

class TimelineEvent(BaseModel):
    date: str
    description: str

class Timeline(BaseModel):
    type: Literal["timeline"] = "timeline"
    events: List[TimelineEvent]

class SQLQueryPlayground(BaseModel):
    type: Literal["sql_query_playground"] = "sql_query_playground"
    schema_ddl: str
    seed_sql: str
    target_query: str
    initial_query: str
    table_headers: List[str]

class SimulationPredict(BaseModel):
    type: Literal["simulation_predict"] = "simulation_predict"
    states: List[Dict[str, Any]]
    checkpoints: List[Dict[str, Any]]

class ProofStep(BaseModel):
    type: Literal["proof_step"] = "proof_step"
    steps: List[str]
    reasons: List[str]
    correct_order: List[int]
    reason_mappings: List[int]

class EvidenceSelect(BaseModel):
    type: Literal["evidence_select"] = "evidence_select"
    raw_text: str
    selectable_spans: List[Dict[str, Any]]
    target_spans: List[int]

class CaseSimulation(BaseModel):
    type: Literal["case_simulation"] = "case_simulation"
    stages: Dict[str, Dict[str, Any]]
    metrics: Dict[str, float]
    success_conditions: Dict[str, Any]

Artifact = Union[
    RevealCard, ClozeMulti, MatchingPairs, SortableSteps, StateStepper,
    ConceptMap, TableLens, CodeTrace, FormulaCard, Timeline,
    SQLQueryPlayground, SimulationPredict, ProofStep, EvidenceSelect, CaseSimulation
]

# Helper to validate single artifact dict
def validate_artifact(data: dict) -> Artifact:
    """Validates that a single artifact dict strictly matches its schema."""
    if "type" not in data:
        raise ValidationError("Missing 'type' field in artifact")
    t = data["type"]
    if t == "reveal_card":
        return RevealCard(**data)
    elif t == "cloze_multi":
        return ClozeMulti(**data)
    elif t == "matching_pairs":
        return MatchingPairs(**data)
    elif t == "sortable_steps":
        return SortableSteps(**data)
    elif t == "state_stepper":
        return StateStepper(**data)
    elif t == "concept_map":
        return ConceptMap(**data)
    elif t == "table_lens":
        return TableLens(**data)
    elif t == "code_trace":
        return CodeTrace(**data)
    elif t == "formula_card":
        return FormulaCard(**data)
    elif t == "timeline":
        return Timeline(**data)
    elif t == "sql_query_playground":
        return SQLQueryPlayground(**data)
    elif t == "simulation_predict":
        return SimulationPredict(**data)
    elif t == "proof_step":
        return ProofStep(**data)
    elif t == "evidence_select":
        return EvidenceSelect(**data)
    elif t == "case_simulation":
        return CaseSimulation(**data)
    else:
        raise ValidationError(f"Unknown artifact type: {t}")

# =====================================================================
# 2. Modality Mapping Logic
# =====================================================================

def select_candidate_types(frontmatter: dict, content: str) -> List[str]:
    """Selects and prioritizes artifact types based on frontmatter and content clues."""
    modality = frontmatter.get("concept_modality", "Qualitative/Definitional")
    mode = str(frontmatter.get("mode", "")).upper()
    content_lower = content.lower()

    # Route advanced modalities first based on keyphrase matching
    if any(k in content_lower for k in ["sql", "query", "database", "select"]):
        return ["sql_query_playground", "table_lens"]
    if any(k in content_lower for k in ["theorem", "induction", "proof", "logic"]):
        return ["proof_step", "reveal_card"]
    if any(k in content_lower for k in ["trace", "simulate", "array state", "iteration"]):
        return ["simulation_predict", "code_trace"]
    if any(k in content_lower for k in ["bug", "find error", "locate line", "identify evidence"]):
        return ["evidence_select", "cloze_multi"]
    if any(k in content_lower for k in ["branching case", "decision study", "scenario simulation"]):
        return ["case_simulation", "timeline"]

    # Detect programming code or commands
    is_programming = (
        "code" in content_lower or
        "python" in content_lower or
        "javascript" in content_lower or
        "rust" in content_lower or
        "c++" in content_lower or
        "```" in content or
        any(k in mode for k in ["CS", "PROG", "CODE", "SOFTWARE"])
    )

    if is_programming and (modality in ["Procedural", "Quantitative"]):
        return ["code_trace", "sortable_steps"]

    if modality == "Quantitative" or any(k in mode for k in ["MATH", "PHYS", "STAT"]):
        return ["formula_card", "reveal_card"]

    if modality == "Causal/Historical" or any(k in mode for k in ["HIST", "CHRON"]):
        return ["timeline", "reveal_card"]

    if modality == "Procedural":
        return ["sortable_steps", "state_stepper"]

    if modality == "Comparative":
        return ["concept_map", "table_lens"]

    # Qualitative/Definitional (default)
    return ["reveal_card", "cloze_multi", "matching_pairs"]

# =====================================================================
# 3. Artifact Generator & Service
# =====================================================================

class ArtifactService:
    def __init__(self, llm=None, vault_path: Optional[str] = None):
        self.llm = llm
        self.vault_path = Path(vault_path) if vault_path else None

    def get_artifact_pack_path(self, note_title: str) -> Path:
        """Finds or constructs the path to the note's artifact pack file."""
        if not self.vault_path:
            raise ValueError("Vault path is not set")
        # Matches learning_object.py normalize_title / get_artifact_pack_path
        from src.domains.ater.learning_object import normalize_title
        norm_title = normalize_title(note_title)
        return self.vault_path / "artifacts" / f"{norm_title}.artifacts.json"

    def read_artifact_pack(self, note_title: str, note_path_rel: str) -> dict:
        """Reads or initializes an artifact pack for a note."""
        path = self.get_artifact_pack_path(note_title)
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        
        # Initialize new pack if missing/corrupt
        from src.domains.ater.learning_object import normalize_title
        pack = {
            "schema_version": 1,
            "note_title": normalize_title(note_title),
            "note_path": note_path_rel,
            "active_version": 1,
            "pinned_artifact_types": [],
            "versions": [
                {
                    "version": 1,
                    "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "artifacts": []
                }
            ]
        }
        return pack

    def write_artifact_pack(self, note_title: str, pack: dict):
        """Writes the artifact pack JSON to the vault."""
        path = self.get_artifact_pack_path(note_title)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(pack, f, indent=2, ensure_ascii=False)

    async def generate_artifacts(
        self,
        note_title: str,
        note_path_rel: str,
        frontmatter: dict,
        content: str,
        force_regenerate: bool = False
    ) -> dict:
        """Generates artifacts using the LLM client, governing count to max 3, and versioning them."""
        pack = self.read_artifact_pack(note_title, note_path_rel)
        pinned = pack.get("pinned_artifact_types", [])

        # Step 1: Modality mapping + Priority
        candidates = select_candidate_types(frontmatter, content)
        # Prioritize pinned types first
        prioritized = [p for p in pinned if p in candidates] + [c for c in candidates if c not in pinned]
        if not prioritized:
            prioritized = candidates if candidates else ["reveal_card"]

        # Step 2: Structured output call via LLM
        prompt = f"""You are generating educational learning objects (artifacts) for an Atomic Note.
Note Title: {note_title}
Note Content:
{content}

Please generate interactive learning objects matching the prioritized formats: {prioritized}.
You MUST generate valid JSON matching these Pydantic schemas:
- reveal_card: {{ "type": "reveal_card", "front": "...", "back": "..." }}
- cloze_multi: {{ "type": "cloze_multi", "text": "...", "options": ["...", "..."] }}
- matching_pairs: {{ "type": "matching_pairs", "pairs": [{{ "left": "...", "right": "..." }}] }}
- sortable_steps: {{ "type": "sortable_steps", "steps": ["...", "..."] }}
- state_stepper: {{ "type": "state_stepper", "states": ["...", "..."], "transitions": ["...", "..."] }}
- concept_map: {{ "type": "concept_map", "nodes": [{{ "id": "...", "label": "..." }}], "edges": [{{ "from": "...", "to": "...", "label": "..." }}] }}
- table_lens: {{ "type": "table_lens", "headers": ["...", "..."], "rows": [["...", "..."]] }}
- code_trace: {{ "type": "code_trace", "code": "...", "steps": ["..."], "variables": [{{ "var_name": "value" }}] }}
- formula_card: {{ "type": "formula_card", "expression": "...", "variables": {{ "x": "..." }}, "derivation": ["..."] }}
- timeline: {{ "type": "timeline", "events": [{{ "date": "...", "description": "..." }}] }}
- sql_query_playground: {{ "type": "sql_query_playground", "schema_ddl": "CREATE TABLE...", "seed_sql": "INSERT INTO...", "target_query": "SELECT...", "initial_query": "SELECT...", "table_headers": ["col1", "col2"] }}
- simulation_predict: {{ "type": "simulation_predict", "states": [{{ "step": 0, "vars": {{ "x": 1 }} }}], "checkpoints": [{{ "step_index": 0, "target_var": "x", "expected_value": "1", "question": "What is x?" }}] }}
- proof_step: {{ "type": "proof_step", "steps": ["step 1", "step 2"], "reasons": ["reason A", "reason B"], "correct_order": [0, 1], "reason_mappings": [0, 1] }}
- evidence_select: {{ "type": "evidence_select", "raw_text": "...", "selectable_spans": [{{ "id": 0, "start": 0, "end": 10, "text": "..." }}], "target_spans": [0] }}
- case_simulation: {{ "type": "case_simulation", "stages": {{ "start": {{ "text": "...", "choices": [{{ "text": "...", "next": "next_stage", "modifications": {{ "stability": -0.1 }} }}] }} }}, "metrics": {{ "stability": 1.0 }}, "success_conditions": {{ "stability": {{ "min": 0.5 }} }} }}

Respond ONLY with a valid JSON array of these objects. Do not include markdown code fences or headers.
"""
        generated_list = []
        if self.llm:
            try:
                res = await self.llm.ainvoke([
                    ("system", "You are a helpful teaching assistant that outputs raw JSON lists of artifacts."),
                    ("human", prompt)
                ])
                # Clean possible markdown block wraps
                clean_content = res.content.strip()
                if clean_content.startswith("```json"):
                    clean_content = clean_content[7:]
                if clean_content.endswith("```"):
                    clean_content = clean_content[:-3]
                clean_content = clean_content.strip()
                
                raw_items = json.loads(clean_content)
                if isinstance(raw_items, list):
                    for item in raw_items:
                        try:
                            # Validate schema
                            val_item = validate_artifact(item)
                            generated_list.append(val_item.model_dump(by_alias=True))
                        except Exception as ve:
                            print(f"[ArtifactService] Skipping item due to validation failure: {ve}")
            except Exception as e:
                print(f"[ArtifactService] LLM invocation failed: {e}")

        # Fallback if generation resulted in empty list
        if not generated_list:
            # Fallback to a simple reveal_card
            generated_list = [
                {
                    "type": "reveal_card",
                    "front": f"What is the core concept of {note_title}?",
                    "back": f"Details about {note_title} can be found in the note content."
                }
            ]

        # Step 3: Cognitive Load Governor (Max 3 active artifacts)
        if len(generated_list) > 3:
            # Prioritize pinned types first in the final list
            pinned_items = [g for g in generated_list if g["type"] in pinned]
            non_pinned_items = [g for g in generated_list if g["type"] not in pinned]
            combined = pinned_items + non_pinned_items
            generated_list = combined[:3]

        # Step 4: Append version and update pack
        next_ver_num = 1
        if "versions" in pack and pack["versions"]:
            next_ver_num = max(v.get("version", 0) for v in pack["versions"]) + 1

        new_version_block = {
            "version": next_ver_num,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "artifacts": generated_list
        }

        if "versions" not in pack:
            pack["versions"] = []
        pack["versions"].append(new_version_block)
        pack["active_version"] = next_ver_num

        self.write_artifact_pack(note_title, pack)
        return pack

    def rollback_version(self, note_title: str, note_path_rel: str, target_version: int) -> dict:
        """Rolls back the active_version parameter of the artifact pack."""
        pack = self.read_artifact_pack(note_title, note_path_rel)
        versions_list = pack.get("versions", [])
        available_nums = [v.get("version") for v in versions_list if isinstance(v, dict)]
        
        if target_version not in available_nums:
            raise ValueError(f"Version {target_version} does not exist in the versions list")

        pack["active_version"] = target_version
        self.write_artifact_pack(note_title, pack)
        return pack

    def pin_artifact_types(self, note_title: str, note_path_rel: str, pinned_types: List[str]) -> dict:
        """Updates the pinned_artifact_types list in the artifact pack."""
        pack = self.read_artifact_pack(note_title, note_path_rel)
        # Ensure they are valid types
        valid_types = {
            "reveal_card", "cloze_multi", "matching_pairs", "sortable_steps",
            "state_stepper", "concept_map", "table_lens", "code_trace",
            "formula_card", "timeline",
            "sql_query_playground", "simulation_predict", "proof_step", "evidence_select", "case_simulation"
        }
        filtered = [pt for pt in pinned_types if pt in valid_types]
        pack["pinned_artifact_types"] = filtered
        self.write_artifact_pack(note_title, pack)
        return pack

def evaluate_sql_query(schema_ddl: str, seed_sql: str, target_query: str, user_query: str) -> dict:
    conn = None
    try:
        # Create ephemeral connection
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        
        # Execute DDL
        for stmt in schema_ddl.split(";"):
            if stmt.strip():
                cursor.execute(stmt)
                
        # Execute Seed SQL
        for stmt in seed_sql.split(";"):
            if stmt.strip():
                cursor.execute(stmt)
                
        conn.commit()
        
        # Execute target query
        try:
            cursor.execute(target_query)
            target_cols = [desc[0] for desc in cursor.description] if cursor.description else []
            target_rows = cursor.fetchall()
        except sqlite3.Error as e:
            return {
                "success": False,
                "error": f"Target query execution failed: {type(e).__name__}: {str(e)}",
                "dataset": None
            }
            
        # Execute user query
        try:
            cursor.execute(user_query)
            user_cols = [desc[0] for desc in cursor.description] if cursor.description else []
            user_rows = cursor.fetchall()
        except sqlite3.Error as e:
            return {
                "success": False,
                "error": f"{type(e).__name__}: {str(e)}",
                "dataset": None
            }
            
        # Compare columns and rows
        if target_cols != user_cols:
            return {
                "success": False,
                "error": f"Column mismatch. Expected {target_cols}, got {user_cols}",
                "dataset": [dict(zip(user_cols, row)) for row in user_rows]
            }
            
        if target_rows != user_rows:
            return {
                "success": False,
                "error": f"Row data mismatch. Expected {len(target_rows)} rows, got {len(user_rows)} rows",
                "dataset": [dict(zip(user_cols, row)) for row in user_rows]
            }
            
        # Success
        return {
            "success": True,
            "error": None,
            "dataset": [dict(zip(user_cols, row)) for row in user_rows]
        }
    except Exception as ex:
        return {
            "success": False,
            "error": f"Unexpected error: {str(ex)}",
            "dataset": None
        }
    finally:
        if conn:
            conn.close()

def evaluate_case_step(
    stages: dict,
    current_stage: str,
    choice_index: int,
    current_metrics: dict,
    success_conditions: dict
) -> dict:
    if current_stage not in stages:
        return {"next_stage": current_stage, "metrics": current_metrics, "ended": True, "success": False}
        
    stage = stages[current_stage]
    choices = stage.get("choices", [])
    
    if not choices or choice_index < 0 or choice_index >= len(choices):
        return {"next_stage": current_stage, "metrics": current_metrics, "ended": True, "success": False}
        
    choice = choices[choice_index]
    next_stage = choice.get("next", "")
    modifications = choice.get("modifications", {})
    
    # Calculate new metrics
    new_metrics = {}
    for k, v in current_metrics.items():
        mod = modifications.get(k, 0.0)
        new_val = v + mod
        if k in ("integrity", "stability"):
            new_val = min(1.0, max(0.0, new_val))
        new_metrics[k] = new_val
        
    # Check if next stage is terminal
    next_stage_obj = stages.get(next_stage, {})
    next_choices = next_stage_obj.get("choices", [])
    ended = len(next_choices) == 0
    
    # Evaluate success if ended
    success = True
    if ended:
        for metric, condition in success_conditions.items():
            val = new_metrics.get(metric, 0.0)
            if "min" in condition and val < condition["min"]:
                success = False
            if "max" in condition and val > condition["max"]:
                success = False
                
    return {
        "next_stage": next_stage,
        "metrics": new_metrics,
        "ended": ended,
        "success": success
    }
