import json
from typing import List, Dict, Optional, Union, Literal, Any
from pydantic import BaseModel, Field, field_validator

class YAMLFrontmatter(BaseModel):
    """
    Structured Pydantic schema for YAML Frontmatter.
    Forces standard Ater 3-Section Sandwich metadata layout.
    """
    title: str = Field(..., description="Sanitized Title_Case_With_Underscores title of the note.")
    type: str = Field(..., description="Note type (e.g., 'Atomic Note', 'Synthesis Note').")
    course: str = Field(..., description="Academic course name.")
    semester: str = Field(..., description="Semester name (e.g., 'Spring 2026').")
    unit: str = Field(..., description="Unit identifier (e.g., 'Unit 1').")
    hub: str = Field(..., description="Wikilink to the Unit Mastery Hub, e.g., '[[Hub_Name]]'.")
    source: str = Field(..., description="Wikilink to the source PDF textbook, e.g., '[[Textbook_Path.pdf]]'.")
    source_pages: List[int] = Field(default_factory=list, description="Pages referenced from the source PDF.")
    read: bool = Field(default=False, description="Read completion flag.")
    generated: bool = Field(default=True, description="Indicates programmatic note compilation.")

    @field_validator("hub", "source")
    @classmethod
    def validate_wikilink(cls, v: str) -> str:
        v = v.strip()
        # Enforce wikilink wrapping and Underscore_Title_Case normalization
        if not (v.startswith("[[") and v.endswith("]]")):
            cleaned = v.replace("[", "").replace("]", "").strip()
            cleaned = "_".join(part.capitalize() for part in cleaned.split("_") if part)
            cleaned = "_".join(part.capitalize() for part in cleaned.split(" ") if part)
            return f"[[{cleaned}]]"
        else:
            cleaned = v[2:-2].strip()
            # Normalize spaces/underscores inside
            cleaned = "_".join(part.capitalize() for part in cleaned.replace(" ", "_").split("_") if part)
            return f"[[{cleaned}]]"

class QuizQuestion(BaseModel):
    """
    Structured schema for individual practice questions.
    Restricts types and validates MCQ and True/False parameters.
    """
    type: Literal["mcq", "true_false", "writing"] = Field(..., description="Epistemic question mode.")
    question: str = Field(..., description="Clear and concise question text.")
    options: Optional[Dict[str, str]] = Field(
        default=None, 
        description="Option map (a, b, c, d) for MCQ questions. Must be None/null for others."
    )
    answer: Union[str, bool] = Field(..., description="Correct answer. Union of string (MCQ key, writing answer) or boolean.")
    explanation: str = Field(..., description="Step-by-step diagnostic feedback.")
    explanation_page: int = Field(..., description="Source page reference for explanation.")

    @field_validator("options")
    @classmethod
    def validate_options(cls, v: Optional[Dict[str, str]], info) -> Optional[Dict[str, str]]:
        q_type = info.data.get("type")
        if q_type == "mcq":
            if not v:
                raise ValueError("MCQ question requires option mappings.")
            allowed_keys = {"a", "b", "c", "d"}
            # Clean keys to lowercase and strip
            v_cleaned = {k.strip().lower(): val.strip() for k, val in v.items()}
            if not set(v_cleaned.keys()).issubset(allowed_keys):
                raise ValueError(f"MCQ option keys must be restricted to a, b, c, d. Got: {list(v.keys())}")
            if len(v_cleaned) < 2:
                raise ValueError("MCQ must have at least 2 options.")
            return v_cleaned
        else:
            if v is not None:
                return None
        return v

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v: Union[str, bool], info) -> Union[str, bool]:
        q_type = info.data.get("type")
        if q_type == "true_false":
            if isinstance(v, str):
                v_lower = v.strip().lower()
                if v_lower in ("true", "t", "1", "yes", "y"):
                    return True
                elif v_lower in ("false", "f", "0", "no", "n"):
                    return False
                else:
                    raise ValueError("true_false answer must resolve to a valid boolean.")
            elif isinstance(v, bool):
                return v
            else:
                raise ValueError("true_false answer must be a boolean.")
        elif q_type == "mcq":
            if isinstance(v, str):
                ans = v.strip().lower()
                if ans not in ("a", "b", "c", "d"):
                    raise ValueError(f"MCQ answer must match option keys (a, b, c, d). Got: '{v}'")
                return ans
            else:
                raise ValueError("MCQ answer must be a string key (a, b, c, d).")
        return v

class InteractiveQuizBatch(BaseModel):
    """
    Standard schema for the Proving Grounds quiz block.
    Forces output as a strict array of parsed questions.
    """
    questions: List[QuizQuestion] = Field(..., description="Array of active recall questions.")

def get_outlines_json_schema(model_class) -> str:
    """
    Helper compiling Pydantic model into JSON Schema format
    for Outlines constrained logit decoders.
    """
    return json.dumps(model_class.model_json_schema(), indent=2)
