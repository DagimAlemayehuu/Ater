import os
import re
import sys
import json
import uuid
import sqlite3
import hashlib
import shutil
import time
import copy
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Literal, Tuple, Callable

logger = logging.getLogger(__name__)
from pydantic import BaseModel
from pathlib import Path

from src.domains.ater.planner import AterPlanner
from src.domains.ater.pdf_extractor import load_pdf_robust
from src.domains.ater import learning_object as lo
from src.domains.ai.factory import ModelFactory
from src.domains.ater.router import router as domain_router
from src.domains.ater.agents import get_persona, normalize_mode
from src.domains.ater.templates import build_skeleton_note
from src.domains.ater.quiz_builder import build_practice_blueprint, enrich_question_v2

SOURCE_LEARNING_PIPELINE_VERSION = "source-roadmap-v11-specific-page-ownership"


class SourceAIGenerationError(RuntimeError):
    """Raised when source-learning AI generation is required but fails."""


class SourceCitation(BaseModel):
    file_name: str
    pages: List[int]
    confidence_score: float

class CoverageWarning(BaseModel):
    concept: str
    dimension: Literal["definition", "mechanism", "failure_mode"]
    severity: Literal["low", "medium", "high"]
    description: str

class SourceGroundedNotePlan(BaseModel):
    title: str
    chapter_title: str
    citations: List[SourceCitation]
    suggested_concepts: List[str]

class SourceGroundedCurriculum(BaseModel):
    topic: str
    sources: List[str]
    notes: List[SourceGroundedNotePlan]
    warnings: List[CoverageWarning]

class SourceIngestionService:
    def ingest_pdf(self, path_str: str) -> Dict[str, Any]:
        path = Path(path_str)
        file_name = path.name
        docs = load_pdf_robust(path_str)
        
        pages_data = []
        warnings = []
        empty_pages = []
        
        for idx, doc in enumerate(docs):
            content = doc.page_content.strip() if hasattr(doc, 'page_content') else ""
            page_num = idx + 1
            if hasattr(doc, 'metadata') and doc.metadata and 'page' in doc.metadata:
                page_num = doc.metadata['page']
                if page_num == idx: # 0-indexed
                    page_num = idx + 1
            
            pages_data.append({
                "page_number": page_num,
                "content": content,
                "text_length": len(content)
            })
            
            if not content:
                empty_pages.append(page_num)
        
        if empty_pages:
            warnings.append(CoverageWarning(
                concept=file_name,
                dimension="definition",
                severity="high",
                description=f"PDF page(s) {', '.join(map(str, empty_pages))} in '{file_name}' contain no extractable text. Please run OCR or enable search augmentation."
            ))
            
        return {
            "file_name": file_name,
            "source_type": classify_source_type(file_name, pages_data),
            "page_count": len(pages_data),
            "pages": pages_data,
            "warnings": warnings
        }


def _as_dict_warning(warning: Any) -> Dict[str, Any]:
    if hasattr(warning, "model_dump"):
        return warning.model_dump()
    if isinstance(warning, dict):
        return warning
    return {
        "concept": getattr(warning, "concept", "source"),
        "dimension": getattr(warning, "dimension", "definition"),
        "severity": getattr(warning, "severity", "medium"),
        "description": str(warning),
    }


def normalize_modality(modality: str = "") -> str:
    value = str(modality or "").strip()
    if "Quant" in value:
        return "Quantitative"
    if "Proc" in value:
        return "Procedural"
    if "Comp" in value:
        return "Comparative"
    if "Caus" in value or "Hist" in value:
        return "Causal/Historical"
    return "Qualitative/Definitional"


def classify_source_type(file_name: str, pages: List[Dict[str, Any]]) -> str:
    lengths = [int(p.get("text_length", len(p.get("content", "")))) for p in pages]
    if file_name.lower().endswith(".pdf") and lengths:
        short_ratio = sum(1 for length in lengths if length < 700) / max(1, len(lengths))
        if short_ratio >= 0.60:
            return "ppt_exported_pdf"
    return "pdf"


def extract_source_objectives(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    objectives: List[Dict[str, Any]] = []
    seen = set()
    for page in pages:
        content = page.get("content", "")
        if not re.search(r"\b(objectives?|able to)\b", content, flags=re.IGNORECASE):
            continue
        chunks = re.split(r"(?:\n|•||\u2022)+", content)
        for chunk in chunks:
            text = re.sub(r"\s+", " ", chunk).strip(" :-\t")
            if len(text) < 12:
                continue
            lower = text.lower()
            if lower.startswith("chapter objectives") or lower.startswith("after successful"):
                continue
            if not re.match(r"^(explain|differentiate|define|discuss|derive|describe|identify|compare|analyze|understand|compute|calculate|list|demonstrate|distinguish|show|evaluate|interpret)\b", lower):
                continue
            key = lower.rstrip(".")
            if key in seen:
                continue
            seen.add(key)
            objectives.append({
                "id": f"obj_{len(objectives) + 1}",
                "text": text,
                "page_number": int(page.get("page_number", 1)),
                "required": True,
            })
    return objectives


_NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
}


def _parse_chapter_heading(text: str) -> Tuple[Optional[str], Optional[str]]:
    first = re.sub(r"\s+", " ", str(text or "")).strip()
    match = re.search(r"\bchapter\s+([a-z0-9]+)\b\.?\s*(.*)$", first, flags=re.IGNORECASE)
    if not match:
        return None, None
    raw_number = match.group(1).lower()
    number = int(raw_number) if raw_number.isdigit() else _NUMBER_WORDS.get(raw_number)
    title = f"Chapter {number}" if number else f"Chapter {raw_number.title()}"
    rest = match.group(2).strip(" .:-\t")
    if number:
        rest = re.sub(rf"^{number}\s*[\).:-]?\s*", "", rest).strip(" .:-\t")
    return title, (rest or None)


def infer_topic(pages: List[Dict[str, Any]], file_name: str = "") -> str:
    for page in pages[:4]:
        raw_content = page.get("content", "") or ""
        lines = [line.strip() for line in re.split(r"[\n\r]+", raw_content) if line.strip()]
        first_line = lines[0] if lines else ""
        content = re.sub(r"\s+", " ", first_line or raw_content).strip()
        if not content:
            continue
        _chapter_title, chapter_topic = _parse_chapter_heading(content)
        if chapter_topic:
            return chapter_topic[:80]
        if _chapter_title and len(lines) > 1:
            next_line = re.sub(r"\s+", " ", lines[1]).strip(" .:-\t")
            next_line = re.sub(r"^\d+\s*[\).:-]?\s*", "", next_line).strip(" .:-\t")
            if next_line and not re.match(r"^(objectives?|learning objectives?)$", next_line, flags=re.IGNORECASE):
                return next_line[:80]
        first_sentence = re.split(r"(?<=[.!?])\s+", content, maxsplit=1)[0].strip(" .:-\t")
        if first_sentence and len(first_sentence.split()) <= 12:
            return first_sentence[:80]
    fallback = Path(file_name).stem.replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", fallback).strip()[:80] or Path(file_name).stem


def extract_title(pages: List[Dict[str, Any]], file_name: str = "") -> str:
    first_raw = (pages[0].get("content", "") if pages else "") or Path(file_name).stem
    first = next((line.strip() for line in re.split(r"[\n\r]+", first_raw) if line.strip()), first_raw)
    chapter_title, _chapter_topic = _parse_chapter_heading(first)
    if chapter_title:
        return chapter_title
    title = re.split(r"[\n\r.]+", first, maxsplit=1)[0].strip(" .:-\t")
    return re.sub(r"\s+", " ", title).strip()[:80] or Path(file_name).stem


def classify_concept_modality(title: str, source_context: str = "", domain: str = "") -> str:
    text = f"{title} {source_context}".lower()
    if any(token in text for token in ["budget line", "equilibrium", "slope", "price", "income", "intercept", "equation", "derive"]):
        return "Quantitative"
    if any(token in text for token in ["cardinal", "ordinal", "versus", " vs ", "differentiate", "compare", "contrast"]):
        return "Comparative"
    if any(token in text for token in ["derive", "steps", "condition", "procedure", "process"]):
        return "Procedural"
    return "Qualitative/Definitional"


def build_teaching_profile(domain: str, modality: str, source_context: str = "") -> Dict[str, Any]:
    profile = dict(get_persona(domain, modality))
    profile["domain"] = normalize_mode(domain)
    profile["modality"] = normalize_modality(modality)
    profile.setdefault("walkthrough", "Source-grounded walkthrough")
    profile.setdefault("prohibitions", profile.get("prohibited_anti_patterns", "Stay inside the cited source."))
    profile["artifact_constraints"] = {
        "allowed": ["Markdown Table"],
        "forbidden": [],
        "source_compatible": True,
    }
    profile_type = str(profile.get("type", ""))
    if profile["domain"] == "ECON-MICRO" and profile["modality"] == "Quantitative":
        profile["artifact_constraints"]["allowed"] = ["LaTeX", "Markdown Table", "ASCII Graph"]
        profile["artifact_constraints"]["forbidden"] = ["Python", "R code", "Java", "JavaScript", "programming code"]
        profile["prohibitions"] = (
            str(profile.get("prohibitions", "")) +
            " DO NOT generate Python, R, Java, JavaScript, or programming code."
        ).strip()
    elif "code" in profile_type.lower() and not profile["domain"].startswith("CS-"):
        profile["artifact_constraints"]["forbidden"] = ["programming code"]
    return profile


def build_source_map_sections(file_name: str, pages: List[Dict[str, Any]], id_prefix: Optional[str] = None) -> List[Dict[str, Any]]:
    sections = []
    for page in pages:
        page_number = int(page.get("page_number", len(sections) + 1))
        content = page.get("content", "")
        first_line = re.split(r"[\n\r]+", content.strip(), maxsplit=1)[0] if content.strip() else ""
        title = re.sub(r"\s+", " ", first_line).strip()[:80] or f"Page {page_number}"
        local_id = f"section_{page_number}"
        sections.append({
            "id": f"{id_prefix}_{local_id}" if id_prefix else local_id,
            "title": title,
            "source_file": file_name,
            "pages": [page_number],
            "citations": [{"file": file_name, "page": page_number}],
        })
    return sections


def _normalize_path_part(value: Any, fallback: str = "General") -> str:
    normalized = lo.normalize_title(str(value or "").strip())
    return normalized or lo.normalize_title(fallback)


def _infer_learning_scope(path: Path, explicit_scope: Optional[str] = None) -> str:
    scope = str(explicit_scope or "").strip().lower()
    if scope in {"academic", "external"}:
        return scope
    parts = {part.lower() for part in path.parts}
    if "academic" in parts:
        return "academic"
    if "external" in parts:
        return "external"
    return "external"


def _build_placement(
    path: Path,
    topic: str,
    domain: str,
    learning_scope: Optional[str] = None,
    semester: Optional[str] = None,
    course: Optional[str] = None,
    unit: Optional[str] = None,
    external_domain: Optional[str] = None,
    parent_hub_path: Optional[str] = None,
    chapter_title: Optional[str] = None,
) -> Dict[str, Any]:
    scope = _infer_learning_scope(path, learning_scope)
    topic_part = _normalize_path_part(topic, path.stem)
    if scope == "academic":
        unit_part = _normalize_path_part(unit or chapter_title, topic_part)
        return {
            "learning_scope": "academic",
            "semester": _normalize_path_part(semester, "General"),
            "course": _normalize_path_part(course or domain, "General"),
            "unit": unit_part,
            "chapter_title": _normalize_path_part(chapter_title or unit_part, unit_part),
            "parent_hub_path": str(parent_hub_path or "").strip(),
            "chapter": "01_Source_Roadmap",
        }
    return {
        "learning_scope": "external",
        "external_domain": _normalize_path_part(external_domain or domain, "General"),
        "learning_path": topic_part,
        "chapter": "01_Source_Roadmap",
    }


def _placement_from_job(job: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(job.get("placement"), dict) and job["placement"]:
        return job["placement"]
    metadata = job.get("metadata") or {}
    if isinstance(metadata, str):
        try:
            metadata = json.loads(metadata or "{}")
        except Exception:
            metadata = {}
    placement = metadata.get("placement") or {}
    if placement:
        return placement
    return _build_placement(
        Path(job.get("file_path") or job.get("file_name") or ""),
        job.get("topic") or job.get("title") or "Source",
        job.get("domain") or "General",
    )


def _source_note_rel_path(job: Dict[str, Any], note_title: str) -> str:
    placement = _placement_from_job(job)
    note_file = f"{lo.normalize_title(note_title)}.md"
    chapter = _normalize_path_part(placement.get("chapter"), "01_Source_Roadmap")
    if placement.get("learning_scope") == "academic":
        return (
            f"Notes/academic/{placement.get('semester')}/{placement.get('course')}/"
            f"{placement.get('unit')}/{chapter}/{note_file}"
        )
    return (
        f"Notes/external/{placement.get('external_domain')}/{placement.get('learning_path')}/"
        f"{chapter}/{note_file}"
    )


def _source_session_note_rel_path(job: Dict[str, Any], note_title: str) -> str:
    if _placement_from_job(job).get("learning_scope") == "academic":
        return _source_note_rel_path(job, note_title)
    return f"SourceJobs/{job['job_id']}/{lo.normalize_title(note_title)}.md"


def _source_session_hub_rel_path(job: Dict[str, Any]) -> str:
    if _placement_from_job(job).get("learning_scope") == "academic":
        return _source_hub_rel_path(job)
    title = lo.normalize_title(job.get("topic") or job.get("title") or "Source")
    return f"SourceJobs/{job['job_id']}/{title}_Hub.md"


def _source_hub_rel_path(job: Dict[str, Any]) -> str:
    placement = _placement_from_job(job)
    parent_hub_path = str(placement.get("parent_hub_path") or "").strip().strip("/")
    if parent_hub_path:
        return parent_hub_path
    hub_title = f"{lo.normalize_title(job.get('topic') or job.get('title') or 'Source')}_Hub.md"
    if placement.get("learning_scope") == "academic":
        return (
            f"database/study planner/{placement.get('semester')}/{placement.get('course')}/"
            f"{placement.get('unit')}/{hub_title}"
        )
    return f"database/external/{placement.get('external_domain')}/{placement.get('learning_path')}/{hub_title}"


def _source_chapter_rel_path(job: Dict[str, Any]) -> str:
    hub_path = Path(_source_hub_rel_path(job))
    return (hub_path.parent / "Chapter_01_Source_Roadmap.md").as_posix()


def scope_concept_graph_ids(job_id: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    id_map = {node["id"]: f"{job_id}_{node['id']}" for node in nodes}
    scoped_nodes = [{**node, "id": id_map[node["id"]]} for node in nodes]
    scoped_edges = [
        {
            **edge,
            "from": id_map.get(edge["from"], edge["from"]),
            "to": id_map.get(edge["to"], edge["to"]),
        }
        for edge in edges
    ]
    return scoped_nodes, scoped_edges


def _page_text_lookup(pages: List[Dict[str, Any]]) -> Dict[int, str]:
    return {int(p.get("page_number", idx + 1)): p.get("content", "") for idx, p in enumerate(pages)}


def _concept_title_from_text(text: str, fallback: str) -> str:
    cleaned = re.sub(r"\s+", " ", str(text or "")).strip(" :-\t")
    cleaned = re.sub(r"^\(?[a-z0-9]+[.)]\s+", "", cleaned, flags=re.IGNORECASE).strip(" .:-\t")
    cleaned = re.sub(r"\s*\([^)]{18,}\)", "", cleaned).strip(" .:-\t")
    if "(" in cleaned and ")" not in cleaned:
        before_open = cleaned.split("(", 1)[0].strip(" .:-\t")
        if before_open:
            cleaned = before_open
    cleaned = re.sub(r"\s+-\s+.*$", "", cleaned).strip(" .:-\t")
    command_re = re.compile(
        r"^(?:and|or)?\s*(?:explain|differentiate|define|discuss|derive|describe|identify|compare|analyze|understand|compute|calculate|list|demonstrate|distinguish|show|evaluate|interpret)\s+",
        flags=re.IGNORECASE,
    )
    while command_re.search(cleaned):
        cleaned = command_re.sub("", cleaned, count=1).strip(" .:-\t")
    cleaned = re.sub(r"^(?:and|or)\s+", "", cleaned, flags=re.IGNORECASE).strip(" .:-\t")
    cleaned = re.sub(
        r"\s+(?:and|or)\s+(?:explain|differentiate|define|discuss|derive|describe|identify|compare|analyze|understand|compute|calculate|list|demonstrate|distinguish|show|evaluate|interpret)\b.*$",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip(" .:-\t")
    cleaned = re.sub(r"^(?:between|the|a|an)\s+", "", cleaned, flags=re.IGNORECASE).strip(" .:-\t")
    cleaned = re.sub(r"\b(?:concept|definition)\b$", "", cleaned, flags=re.IGNORECASE).strip(" .:-\t")
    cleaned = re.sub(r"\b[A-Z]\b$", "", cleaned).strip(" .:-\t")
    if not cleaned:
        return fallback
    words = cleaned.split()
    title = " ".join(words[:9]).strip(" .:-\t").title()
    acronym_replacements = {
        "Id": "ID",
        "Css": "CSS",
        "Html": "HTML",
        "Atc": "ATC",
        "Ac": "AC",
        "Avc": "AVC",
        "Afc": "AFC",
        "Mc": "MC",
        "Mrs": "MRS",
        "Mu": "MU",
        "Tu": "TU",
    }
    for source, replacement in acronym_replacements.items():
        title = re.sub(rf"\b{source}\b", replacement, title)
    return title


_CONCEPT_STOP_TITLES = {
    "chapter",
    "chapter objectives",
    "after successful completion of this chapter",
    "objectives",
    "learning objectives",
    "introduction",
    "summary",
    "example",
    "examples",
    "exercise",
    "exercises",
    "review questions",
    "references",
}


def _concept_key(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(title or "").lower()).strip()


def _looks_like_code_or_selector_fragment(title: str) -> bool:
    raw = str(title or "").strip()
    lowered = raw.lower()
    key = _concept_key(raw)
    if not raw:
        return True
    if re.match(r"^(//|/\*|\*|#include\b|import\s+|package\s+)", raw):
        return True
    if any(ch in raw for ch in "{};"):
        return True
    if re.search(r"\b(public|private|protected)\s+(?:static\s+)?(?:final\s+)?(?:class|interface|void|int|double|string|boolean|[A-Z][A-Za-z0-9_]*)\b", raw):
        return True
    if re.search(r"\b(class|interface)\s+[A-Z][A-Za-z0-9_]*\b", raw):
        return True
    if re.search(r"\b(extends|implements|new|return|void)\b", lowered):
        return True
    if re.search(r"\b(system\.out\.println|console\.log|println|printstacktrace)\b", lowered):
        return True
    acronym_match = re.search(r"\(([A-Za-z]{2,8}(?:\s+or\s+[A-Za-z]{2,8}){0,2})\)", raw, flags=re.IGNORECASE)
    if re.search(r"\w+\s*\([^)]*\)", raw) and not acronym_match and not re.search(r"\b(function|method|constructor|selector|notation)\b", lowered):
        return True
    if re.search(r"^[.#$>*+~:[\]\w\s-]{1,24}$", raw) and any(ch in raw for ch in ".#$>*+~[]"):
        return True
    if key in {
        "in the",
        "for example",
        "syntax",
        "situations",
        "comments",
        "output from the program is shown here",
        "now consider the following invocation",
        "version and the second invokes another",
        "suppose we create the following reference variable",
    }:
        return True
    if key.startswith((
        "suppose we ",
        "now consider ",
        "output from ",
        "for example",
        "here ",
        "assign ",
        "the first ",
        "the second ",
    )):
        return True
    return False


def _is_teachable_title(title: str) -> bool:
    key = _concept_key(title)
    if not key or key in _CONCEPT_STOP_TITLES:
        return False
        
    cleaned_letters = re.sub(r"[^a-zA-Z]", "", title)
    if len(cleaned_letters) < 4:
        if cleaned_letters.lower() not in {"html", "css", "dom", "xml", "js"}:
            return False
            
    if any(token in key for token in ["present", "brief history", "2007", "199", "200"]):
        return False
        
    if _looks_like_code_or_selector_fragment(str(title)):
        return False
    weak_titles = {
        "contents",
        "content",
        "original",
        "essentially general",
        "essentially adjacent",
        "essentially attribute",
        "essentially child",
        "essentially sibling",
        "given as",
        "given by",
        "this shows",
        "assuming",
        "into two",
        "of output",
        "certain trend",
        "derivation",
        "will be able to",
        "measurement",
        "bundle",
        "consumer s utility",
        "consumer can only",
        "to the consumer",
        "consumer we need assumptions",
        "consider the following ic",
        "quantity product x 1 each product y 2 each",
    }
    if key in weak_titles:
        return False
    if key.startswith("chapter ") or key.startswith("page "):
        return False
    if key.startswith("example "):
        return False
    if key.startswith("fig ") or key.startswith("figure "):
        return False
    if key.startswith((
        "if you wish ",
        "we cannot ",
        "disconnect the definition ",
        "as saccount ",
        "assigning a child object ",
        "access specifiers ",
        "methods declared as final ",
        "use tools for website designing",
        "this ",
        "it ",
        "thus ",
        "hence ",
        "where ",
        "for the ",
        "of ",
        "which ",
        "are added ",
        "production that ",
        "determine ",
        "find ",
        "at what ",
        "what will ",
        "expressions of ",
        "finally ",
        "is used ",
        "consumer is ",
        "consumer is expected ",
        "total utility of a consumer is measured ",
        "assumption of cardinal utility is",
    )):
        return False
    if "?" in str(title):
        return False
    if len(words := key.split()) >= 7 and not any(
        anchor in key
        for anchor in [
            "marginal rate",
            "law of",
            "relationship between",
            "average total cost",
            "total average and marginal",
        ]
    ):
        return False
    if "certain cut flower" in key:
        return False
    if re.search(r"\b(can be|is given|would incorporate|we can identify|it considers)\b", key):
        return False
    if "objectives" in key or "after successful completion" in key:
        return False
    words = key.split()
    if len(words) > 12:
        return False
    if len(words) < 2 and len(key) < 6:
        return False
    weak_single_words = {
        "bundle",
        "cardinal",
        "consumer",
        "measurement",
        "preferences",
        "income",
        "graphically",
        "intercepts",
        "displays",
        "situations",
    }
    if len(words) == 1 and key in weak_single_words:
        return False
    if all(word.isdigit() for word in words):
        return False
    if not re.search(r"[a-z]", key):
        return False
    return True


def _looks_like_slide_deck(pages: List[Dict[str, Any]]) -> bool:
    if not pages:
        return False
    if len(pages) < 12:
        return False
    lengths = [int(page.get("text_length", len(page.get("content", "")))) for page in pages]
    short_ratio = sum(1 for length in lengths if length < 700) / max(1, len(lengths))
    return short_ratio >= 0.55


def _line_title_candidate(line: str, fallback: str) -> Optional[str]:
    cleaned = re.sub(r"\s+", " ", str(line or "")).strip(" .:-\t")
    if not cleaned:
        return None
    if re.search(r"[=∞]", cleaned):
        return None
    if len(cleaned.split()) > 12:
        return None
    title = _concept_title_from_text(cleaned, fallback)
    return title if _is_teachable_title(title) else None


def _extract_slide_concept_titles(content: str, topic: str, page_no: int) -> List[str]:
    titles: List[str] = []
    lines = []
    for raw in re.split(r"[\n\r]+", content or ""):
        line = re.sub(r"\s+", " ", raw.strip(" \t-•\u2022")).strip()
        if line:
            lines.append(line)
    if not lines:
        return titles

    heading = _line_title_candidate(lines[0], f"{topic} Page {page_no}")
    if heading:
        titles.append(heading)

    for line in lines[1:]:
        if ":" in line:
            label = line.split(":", 1)[0].strip()
        elif re.match(r"^\(?[a-z0-9]+[.)]\s+[A-Za-z]", line, flags=re.IGNORECASE):
            label = line
        elif re.match(r"^[>\-→•]\s*([A-Z][A-Za-z0-9\s().#*&,>-]+)$", line):
            label = re.sub(r"^[>\-→•]\s*", "", line).strip()
        else:
            continue
        label_title = _line_title_candidate(label, f"{topic} Page {page_no}")
        if label_title:
            titles.append(label_title)

    deduped: List[str] = []
    seen: set[str] = set()
    for title in titles:
        key = _concept_key(title)
        if key not in seen:
            seen.add(key)
            deduped.append(title)
    return deduped


def _split_objective_concepts(text: str, fallback: str) -> List[str]:
    raw = re.sub(r"\s+", " ", str(text or "")).strip()
    comparative = re.search(
        r"\b(?:differentiate|distinguish|compare)\s+(?:between\s+)?(.+?)\s+(?:and|versus|vs\.?)\s+(.+?)(?:\s+approach)?$",
        raw,
        flags=re.IGNORECASE,
    )
    if comparative:
        left = _concept_title_from_text(comparative.group(1), "")
        right = _concept_title_from_text(comparative.group(2), "")
        titles = []
        if _is_teachable_title(left) and len(left.split()) > 1:
            titles.append(left)
        if _is_teachable_title(right):
            titles.append(right)
        if left and right:
            titles.append(f"{left} Versus {right}")
        return titles

    core = _concept_title_from_text(text, fallback)
    core = re.sub(r"\b(and|or)\s+explain\b", ",", core, flags=re.IGNORECASE)
    parts = re.split(r"\s*,\s*|\s+;\s+|\s+\band\b\s+", core)
    cleaned = []
    for part in parts:
        title = _concept_title_from_text(part, "")
        if _is_teachable_title(title):
            cleaned.append(title)
    if _is_teachable_title(core):
        cleaned.insert(0, core)
    deduped: List[str] = []
    seen: set[str] = set()
    for title in cleaned:
        key = _concept_key(title)
        if key not in seen:
            seen.add(key)
            deduped.append(title)
    return deduped or ([core] if _is_teachable_title(core) else [])


def _extract_page_concept_titles(content: str, topic: str, page_no: int) -> List[str]:
    titles: List[str] = []
    raw_lines = [line.strip(" \t-•\u2022") for line in re.split(r"[\n\r]+", content or "")]
    for line in raw_lines:
        line = re.sub(r"\s+", " ", line).strip()
        if not line or len(line) < 6:
            continue
        if re.match(r"^(chapter|page)\s+\d+\b", line, flags=re.IGNORECASE):
            continue
        if re.search(r"\b(objectives?|after successful completion)\b", line, flags=re.IGNORECASE):
            continue
        before_colon = re.split(r"\s*[:–]\s*|\s+-\s+", line, maxsplit=1)[0].strip()
        if before_colon and before_colon != line and len(before_colon.split()) <= 10:
            titles.append(_concept_title_from_text(before_colon, f"{topic} Page {page_no}"))
        else:
            label_match = re.match(r"^([A-Z][A-Za-z0-9\s,/()&\-]{2,80})\.\s+[A-Za-z]", line)
            if label_match and len(label_match.group(1).split()) <= 10:
                titles.append(_concept_title_from_text(label_match.group(1), f"{topic} Page {page_no}"))
        if "." not in line and len(line.split()) <= 10 and (
            line[:1].isupper()
            or sum(1 for word in line.split() if word[:1].isupper()) >= max(2, len(line.split()) // 2)
        ):
            titles.append(_concept_title_from_text(line, f"{topic} Page {page_no}"))

    definition_patterns = [
        r"\b([A-Z][A-Za-z][A-Za-z0-9\s,/()&\-]{2,80}?)\s+(?:is|are|refers to|means|shows|occurs when|occurs where|updates|measures|include|includes)\b",
        r"\b(?:definition of|concept of)\s+([A-Za-z][A-Za-z0-9\s,/()&\-]{2,80})\b",
    ]
    for pattern in definition_patterns:
        for match in re.finditer(pattern, content or "", flags=re.IGNORECASE):
            candidate = re.sub(r"\s+", " ", match.group(1)).strip(" .:-\t")
            titles.append(_concept_title_from_text(candidate, f"{topic} Page {page_no}"))

    phrase_patterns = [
        r"\b(?:given|using|with)\s+([a-z][a-z0-9\s-]{3,60}?)(?:,|\.|;|\s+and\s+)",
        r"\b(?:include|includes|including|contains|cover|covers)\s+([a-z][a-z0-9\s-]{3,60}?)(?:,|\.|;|\s+and\s+)",
    ]
    for pattern in phrase_patterns:
        for match in re.finditer(pattern, content or "", flags=re.IGNORECASE):
            candidate = _concept_title_from_text(match.group(1), "")
            if candidate:
                titles.append(candidate)

    deduped: List[str] = []
    seen: set[str] = set()
    for title in titles:
        key = _concept_key(title)
        if _is_teachable_title(title) and key not in seen:
            seen.add(key)
            deduped.append(title)
    return deduped


def _build_generic_concept_nodes(
    topic: str,
    objectives: List[Dict[str, Any]],
    pages: List[Dict[str, Any]],
    domain: str,
    existing_nodes: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    page_text = _page_text_lookup(pages)
    by_key: Dict[str, Dict[str, Any]] = {}
    add_order = 0
    slide_deck = _looks_like_slide_deck(pages)

    def matching_objective_ids(title: str, page_no: int) -> List[str]:
        title_terms = {term for term in re.split(r"\W+", title.lower()) if len(term) > 3}
        if not title_terms:
            return []
        matched: List[str] = []
        for objective in objectives:
            if int(objective.get("page_number", page_no)) != page_no:
                continue
            objective_terms = {term for term in re.split(r"\W+", str(objective.get("text", "")).lower()) if len(term) > 3}
            if title_terms & objective_terms:
                matched.append(objective.get("id"))
        return [item for item in matched if item]

    def add_candidate(title: str, page_no: int, objective_id: Optional[str] = None, warning: Optional[str] = None):
        nonlocal add_order
        clean_title = _concept_title_from_text(title, "")
        if not _is_teachable_title(clean_title):
            return
        key = _concept_key(clean_title)
        source_text = re.sub(r"\s+", " ", page_text.get(page_no, "")).strip()
        objective_ids = [objective_id] if objective_id else matching_objective_ids(clean_title, page_no)
        existing = by_key.get(key)
        if existing:
            if page_no not in existing["source_pages"]:
                existing["source_pages"].append(page_no)
            for matched_objective_id in objective_ids:
                if matched_objective_id not in existing["objective_ids"]:
                    existing["objective_ids"].append(matched_objective_id)
            if source_text and not any(ex.get("page") == page_no for ex in existing["source_excerpts"]):
                existing["source_excerpts"].append({"page": page_no, "text": source_text[:800]})
            return
        add_order += 1
        modality = classify_concept_modality(clean_title, source_text, domain)
        by_key[key] = {
            "id": "",
            "title": clean_title[:80],
            "domain": domain,
            "modality": modality,
            "source_pages": [page_no],
            "intro_page": page_no,
            "source_excerpts": [{"page": page_no, "text": source_text[:800]}] if source_text else [],
            "objective_ids": objective_ids,
            "teaching_order": 0,
            "origin_priority": 1 if objective_ids else 2,
            "origin_index": add_order,
            "warnings": [warning] if warning else ([] if source_text else ["low-source-text"]),
        }

    for node in existing_nodes or []:
        pages_for_node = [int(p) for p in node.get("source_pages", []) if str(p).isdigit()]
        add_candidate(node.get("title", ""), pages_for_node[0] if pages_for_node else 1)
        key = _concept_key(node.get("title", ""))
        if key in by_key:
            by_key[key] = {**node, "source_pages": pages_for_node or by_key[key]["source_pages"], "origin_priority": 0}

    for idx, objective in enumerate(objectives, start=1):
        page_no = int(objective.get("page_number", 1))
        for title in _split_objective_concepts(objective.get("text", ""), f"{topic} Concept {idx}"):
            add_candidate(title, page_no, objective.get("id"))

    for page in pages:
        page_no = int(page.get("page_number", len(by_key) + 1))
        content = re.sub(r"\s+", " ", page.get("content", "")).strip()
        if len(content) < 20:
            continue
        extractor = _extract_slide_concept_titles if slide_deck else _extract_page_concept_titles
        for title in extractor(page.get("content", ""), topic, page_no):
            add_candidate(title, page_no, warning="objective_not_detected")

    for node in by_key.values():
        title_terms = {term for term in re.split(r"\W+", node["title"].lower()) if len(term) > 3}
        if not title_terms:
            continue
        title_phrase = node["title"].lower()
        for page in pages:
            page_no = int(page.get("page_number", 1))
            if page_no in node["source_pages"]:
                continue
            source_text = re.sub(r"\s+", " ", page.get("content", "") or "").strip()
            if not source_text:
                continue
            source_lower = source_text.lower()
            overlap = {term for term in title_terms if term in source_lower}
            if title_phrase in source_lower or (len(title_terms) >= 3 and len(overlap) == len(title_terms)):
                node["source_pages"].append(page_no)
                node["source_excerpts"].append({"page": page_no, "text": source_text[:800]})
            if len(node["source_excerpts"]) >= 3:
                break

    def sort_key(item: Dict[str, Any]):
        origin = item.get("origin_priority", 2)
        if origin == 0:
            return (origin, int(item.get("teaching_order") or 9999), item["title"].lower())
        intro = item.get("intro_page") or min(item.get("source_pages") or [9999])
        return (origin, int(item.get("origin_index") or 9999), intro, item["title"].lower())

    nodes = sorted(by_key.values(), key=sort_key)
    for idx, node in enumerate(nodes, start=1):
        node["id"] = f"concept_{idx}"
        node["teaching_order"] = idx
        node["source_pages"] = sorted({int(p) for p in node.get("source_pages", [])})
        node["source_excerpts"] = sorted(node.get("source_excerpts", []), key=lambda ex: int(ex.get("page", 9999)))[:3]
        node.pop("origin_priority", None)
        node.pop("origin_index", None)
    return nodes


def build_concept_graph(topic: str, objectives: List[Dict[str, Any]], pages: List[Dict[str, Any]], domain: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    nodes = _build_generic_concept_nodes(topic, objectives, pages, domain)
    edges = [
        {"from": nodes[i]["id"], "to": nodes[i + 1]["id"], "type": "prerequisite"}
        for i in range(len(nodes) - 1)
    ]
    return nodes, edges, []


RoadmapRefiner = Callable[[Dict[str, Any]], List[Dict[str, Any]]]


_COMPACT_FALLBACK_DROP_KEYS = {
    "complete",
    "reflexive",
    "transitivity",
}

_BROAD_ROADMAP_TITLE_PATTERNS = [
    r"^theory of ",
    r"^introduction to ",
    r"^overview of ",
    r"^chapter \d+",
]


def _edges_for_nodes(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [
        {"from": nodes[i]["id"], "to": nodes[i + 1]["id"], "type": "prerequisite"}
        for i in range(len(nodes) - 1)
    ]


def _node_evidence_score(node: Dict[str, Any]) -> float:
    title = str(node.get("title") or "")
    terms = {term for term in re.findall(r"[A-Za-z]{4,}", title.lower()) if term not in {"theory", "chapter", "approach"}}
    score = 0.0
    for excerpt in node.get("source_excerpts", []) or []:
        text = re.sub(r"\s+", " ", str(excerpt.get("text", ""))).strip()
        lowered = text.lower()
        if len(text) >= 80:
            score += 1.0
        overlap = {term for term in terms if term in lowered}
        score += min(4.0, len(overlap) * 1.5)
        if re.search(r"\b(is|are|means|refers to|shows|represents|measures|ranks|equals|occurs|defined)\b", lowered):
            score += 1.5
        if any(token in lowered for token in ["objective", "after successful completion", "chapter three", "chapter four"]):
            score -= 1.5
    return score


def _is_broad_weak_node(node: Dict[str, Any]) -> bool:
    title = str(node.get("title") or "").strip().lower()
    if not title:
        return True
    is_broad = any(re.search(pattern, title) for pattern in _BROAD_ROADMAP_TITLE_PATTERNS)
    if not is_broad:
        return False
    return _node_evidence_score(node) < 3.0


def _is_compaction_drop_title(title: str) -> bool:
    key = _concept_key(title)
    if not key:
        return True
    if key in _COMPACT_FALLBACK_DROP_KEYS:
        return True
    if key.startswith("minor slide heading"):
        return True
    if key.startswith("page "):
        return True
    return False


def _source_concept_weight(node: Dict[str, Any]) -> float:
    title = str(node.get("title") or "")
    score = _node_evidence_score(node)
    source_pages = [int(p) for p in node.get("source_pages", []) if str(p).isdigit()]
    excerpts = [
        re.sub(r"\s+", " ", str(excerpt.get("text", ""))).strip()
        for excerpt in node.get("source_excerpts", []) or []
        if str(excerpt.get("text", "")).strip()
    ]
    text = " ".join(excerpts).lower()
    if node.get("objective_ids"):
        score += 6.0
    if source_pages:
        score += 1.0
    if len(source_pages) >= 2:
        score += 0.5
    if re.search(r"[A-Za-z]\w*\s*[=+*/-]\s*[A-Za-z0-9]", text):
        score += 2.0
    if any(token in text for token in ["define", "definition", "means", "refers to", " is ", " are "]):
        score += 1.0
    if any(token in text for token in ["example", "case", "scenario", "process", "procedure", "compare", "contrast", "versus", " vs "]):
        score += 1.0
    if _is_roadmap_fragment_title(title):
        score -= 2.0
    if _is_compaction_drop_title(title):
        score -= 10.0
    return score


def _should_keep_source_weighted_node(node: Dict[str, Any]) -> bool:
    title = str(node.get("title") or "")
    if _is_compaction_drop_title(title):
        return False
    if _is_broad_weak_node(node):
        return False
    if not _node_source_page_set(node):
        return False
    if node.get("objective_ids"):
        return True
    return _source_concept_weight(node) >= 4.0


_ROADMAP_TITLE_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "between", "by", "for", "from", "how",
    "in", "into", "is", "it", "its", "of", "on", "or", "the", "their", "this", "to",
    "using", "with", "without",
}

_ROADMAP_DECORATOR_TOKENS = {
    "approach", "approaches", "analysis", "basic", "case", "chapter", "concept",
    "definition", "example", "examples", "framework", "general", "introduction",
    "method", "methods", "model", "overview", "principle", "set", "sets", "system",
    "theory", "topic", "type", "types",
}


def _singular_token(token: str) -> str:
    if token.endswith("ss"):
        return token
    if len(token) > 4 and token.endswith("ces"):
        return token[:-1]
    if len(token) > 4 and token.endswith("ies"):
        return token[:-3] + "y"
    if len(token) > 4 and token.endswith("es"):
        return token[:-2]
    if len(token) > 3 and token.endswith("s"):
        return token[:-1]
    return token


def _roadmap_title_tokens(title: str, *, include_decorators: bool = False) -> set[str]:
    normalized = re.sub(r"[^a-z0-9\s]", " ", str(title or "").lower())
    raw_tokens = re.findall(r"[a-z][a-z0-9]{2,}", normalized)
    tokens = {
        _singular_token(token)
        for token in raw_tokens
        if token not in _ROADMAP_TITLE_STOPWORDS
    }
    if include_decorators:
        return tokens
    return {token for token in tokens if token not in _ROADMAP_DECORATOR_TOKENS}


def _roadmap_context_tokens(node: Dict[str, Any], limit: int = 18) -> set[str]:
    title_tokens = _roadmap_title_tokens(str(node.get("title") or ""))
    text = " ".join(str(ex.get("text", "")) for ex in node.get("source_excerpts", []) or [])
    counts: Dict[str, int] = {}
    for token in _roadmap_title_tokens(text):
        if token in _ROADMAP_TITLE_STOPWORDS or len(token) < 3:
            continue
        counts[token] = counts.get(token, 0) + 1
    ranked = sorted(counts, key=lambda token: (-counts[token], token))[:limit]
    return title_tokens | set(ranked)


def _roadmap_token_similarity(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def _roadmap_page_overlap(left: Dict[str, Any], right: Dict[str, Any]) -> bool:
    left_pages = {int(p) for p in left.get("source_pages", []) if str(p).isdigit()}
    right_pages = {int(p) for p in right.get("source_pages", []) if str(p).isdigit()}
    return bool(left_pages and right_pages and left_pages & right_pages)


def _is_roadmap_fragment_title(title: str) -> bool:
    lowered = re.sub(r"\s+", " ", str(title or "").lower()).strip()
    core = _roadmap_title_tokens(lowered)
    all_tokens = _roadmap_title_tokens(lowered, include_decorators=True)
    if not lowered:
        return True
    if re.search(r"\b(concept|principle|law|rule|theory|model|framework|mechanism)\s+of\b", lowered) and core:
        return False
    if re.match(r"^(case|example|introduction|overview|chapter)\b", lowered):
        return True
    if len(core) <= 1 and bool(all_tokens & _ROADMAP_DECORATOR_TOKENS):
        return True
    if len(core) == 1 and re.search(r"\([^)]{1,8}\)", lowered):
        return True
    return False


def _should_merge_roadmap_nodes(left: Dict[str, Any], right: Dict[str, Any]) -> bool:
    left_core = _roadmap_title_tokens(str(left.get("title") or ""))
    right_core = _roadmap_title_tokens(str(right.get("title") or ""))
    if not left_core or not right_core:
        return False
    if left_core == right_core:
        return True

    smaller, larger = (left_core, right_core) if len(left_core) <= len(right_core) else (right_core, left_core)
    has_page_overlap = _roadmap_page_overlap(left, right)
    context_similarity = _roadmap_token_similarity(_roadmap_context_tokens(left), _roadmap_context_tokens(right))

    if smaller.issubset(larger) and (has_page_overlap or context_similarity >= 0.32):
        return True
    if _roadmap_token_similarity(left_core, right_core) >= 0.67:
        return True
    if len(smaller) <= 1 and has_page_overlap and context_similarity >= 0.42:
        return True
    if (
        (_is_roadmap_fragment_title(str(left.get("title") or "")) or _is_roadmap_fragment_title(str(right.get("title") or "")))
        and has_page_overlap
        and context_similarity >= 0.26
    ):
        return True
    return False


def _roadmap_cluster_key(title: str) -> str:
    tokens = sorted(_roadmap_title_tokens(title))
    return " ".join(tokens) if tokens else _concept_key(title)


def _canonical_roadmap_title(_cluster_key: str, group: List[Dict[str, Any]], current_title: str) -> str:
    if not group:
        return current_title
    group.sort(key=lambda item: (-_roadmap_title_score(item), len(str(item.get("title", "")))))
    return str(group[0].get("title") or current_title)


def _roadmap_title_score(node: Dict[str, Any]) -> float:
    title = str(node.get("title") or "")
    lowered = title.lower()
    score = _node_evidence_score(node)
    word_count = len(title.split())
    core_count = len(_roadmap_title_tokens(title))
    if 2 <= word_count <= 6:
        score += 1.0
    if 2 <= core_count <= 5:
        score += 1.0
    if len(_roadmap_title_tokens(title, include_decorators=True) & _ROADMAP_DECORATOR_TOKENS) and core_count >= 2:
        score += 0.5
    if re.search(r"\b(concept|principle|law|rule|theory|model|framework|mechanism)\s+of\b", lowered):
        score += 2.0
    if core_count <= 1:
        score -= 1.5
    if _is_roadmap_fragment_title(title):
        score -= 3.0
    if re.search(r"\b(of a|of an|of the)\b", lowered) and word_count > 5:
        score -= 1.0
    return score


def _merge_roadmap_duplicate_clusters(nodes: List[Dict[str, Any]], pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    indexed = [node for node in nodes if _roadmap_cluster_key(str(node.get("title", "")))]
    parent = list(range(len(indexed)))

    def find(idx: int) -> int:
        while parent[idx] != idx:
            parent[idx] = parent[parent[idx]]
            idx = parent[idx]
        return idx

    def union(left: int, right: int) -> None:
        left_root = find(left)
        right_root = find(right)
        if left_root != right_root:
            parent[right_root] = left_root

    for left_idx, left in enumerate(indexed):
        for right_idx in range(left_idx + 1, len(indexed)):
            if _should_merge_roadmap_nodes(left, indexed[right_idx]):
                union(left_idx, right_idx)

    clusters: Dict[int, List[Dict[str, Any]]] = {}
    order: List[int] = []
    for idx, node in enumerate(indexed):
        root = find(idx)
        if root not in clusters:
            clusters[root] = []
            order.append(root)
        clusters[root].append(node)

    merged: List[Dict[str, Any]] = []
    for root in order:
        group = clusters[root]
        if len(group) == 1 and _is_roadmap_fragment_title(str(group[0].get("title") or "")) and _node_evidence_score(group[0]) < 4.0:
            continue
        group.sort(key=lambda item: (-_roadmap_title_score(item), len(str(item.get("title", "")))))
        best = dict(group[0])
        source_pages = set()
        source_excerpts: List[Dict[str, Any]] = []
        objective_ids: List[str] = []
        warnings: List[str] = []
        for item in group:
            source_pages.update(int(p) for p in item.get("source_pages", []) if str(p).isdigit())
            for excerpt in item.get("source_excerpts", []) or []:
                if excerpt and not any(existing.get("page") == excerpt.get("page") for existing in source_excerpts):
                    source_excerpts.append(excerpt)
            for objective_id in item.get("objective_ids", []) or []:
                if objective_id not in objective_ids:
                    objective_ids.append(objective_id)
            for warning in item.get("warnings", []) or []:
                if warning not in warnings:
                    warnings.append(warning)
        best["source_pages"] = sorted(source_pages)
        best["source_excerpts"] = sorted(source_excerpts, key=lambda ex: int(ex.get("page", 9999)))[:4]
        best["objective_ids"] = objective_ids
        best["warnings"] = warnings
        best["title"] = _canonical_roadmap_title(_roadmap_cluster_key(best.get("title", "")), group, best.get("title", ""))
        merged.append(best)
    return merged


def _reconcile_refined_nodes(
    refined_nodes: List[Dict[str, Any]],
    deterministic_nodes: List[Dict[str, Any]],
    pages: List[Dict[str, Any]],
    domain: str,
) -> List[Dict[str, Any]]:
    deterministic_by_key = {_concept_key(node.get("title", "")): node for node in deterministic_nodes}
    merged: List[Dict[str, Any]] = []
    seen: set[str] = set()

    for node in refined_nodes:
        key = _concept_key(node.get("title", ""))
        if not key or key in seen:
            continue
        deterministic = deterministic_by_key.get(key)
        candidate = {**(deterministic or {}), **node}
        if deterministic:
            candidate["source_pages"] = sorted({int(p) for p in (deterministic.get("source_pages") or []) + (node.get("source_pages") or []) if str(p).isdigit()})
            candidate["source_excerpts"] = deterministic.get("source_excerpts") or node.get("source_excerpts") or []
            candidate["objective_ids"] = deterministic.get("objective_ids") or node.get("objective_ids") or []
        if _is_broad_weak_node(candidate):
            continue
        merged.append(candidate)
        seen.add(key)

    for node in deterministic_nodes:
        key = _concept_key(node.get("title", ""))
        if not key or key in seen:
            continue
        if _is_broad_weak_node(node):
            continue
        if _should_keep_source_weighted_node(node):
            merged.append(dict(node))
            seen.add(key)

    if not merged:
        merged = [dict(node) for node in deterministic_nodes if not _is_broad_weak_node(node)] or deterministic_nodes[:]

    def order_key(node: Dict[str, Any]) -> Tuple[int, int, str]:
        pages_for_node = [int(p) for p in node.get("source_pages", []) if str(p).isdigit()]
        first_page = min(pages_for_node) if pages_for_node else 9999
        objective_priority = 0 if node.get("objective_ids") else 1
        return (first_page, objective_priority, str(node.get("title", "")).lower())

    merged = _merge_roadmap_duplicate_clusters(merged, pages)

    merged.sort(key=order_key)

    for idx, node in enumerate(merged, start=1):
        node["id"] = f"concept_{idx}"
        node["teaching_order"] = idx
        node["domain"] = node.get("domain") or domain
        source_pages = sorted({int(p) for p in node.get("source_pages", []) if str(p).isdigit()})
        node["source_pages"] = source_pages
        node["source_excerpts"] = _source_excerpts_for_pages(pages, source_pages) or node.get("source_excerpts", [])
        source_context = " ".join(ex.get("text", "") for ex in node.get("source_excerpts", []))
        node["modality"] = node.get("modality") or classify_concept_modality(node.get("title", ""), source_context, node["domain"])
        node.setdefault("objective_ids", [])
        node.setdefault("warnings", [])
    return merged


def _compact_deterministic_nodes(nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    compacted: List[Dict[str, Any]] = []
    seen: set[str] = set()
    for node in nodes:
        title = str(node.get("title") or "").strip()
        key = _concept_key(title)
        if not key or key in seen:
            continue
        if _is_compaction_drop_title(title):
            continue
        compacted.append(dict(node))
        seen.add(key)
    if not compacted:
        compacted = [dict(node) for node in nodes]
    for idx, node in enumerate(compacted, start=1):
        node["id"] = f"concept_{idx}"
        node["teaching_order"] = idx
    return compacted


def _source_excerpts_for_pages(pages: List[Dict[str, Any]], source_pages: List[int]) -> List[Dict[str, Any]]:
    page_text = _page_text_lookup(pages)
    excerpts = []
    for page_no in source_pages:
        text = re.sub(r"\s+", " ", page_text.get(int(page_no), "")).strip()
        if text:
            excerpts.append({"page": int(page_no), "text": text[:800]})
    return excerpts


def _source_page_numbers(pages: List[Dict[str, Any]]) -> List[int]:
    return sorted({
        int(page.get("page_number") or 0)
        for page in pages
        if int(page.get("page_number") or 0) > 0
    })


def _node_source_page_set(node: Dict[str, Any]) -> set[int]:
    return {int(p) for p in node.get("source_pages", []) if str(p).isdigit()}


def _is_broad_family_node(node: Dict[str, Any]) -> bool:
    tokens = _roadmap_title_tokens(str(node.get("title") or ""))
    if not tokens:
        return False
    broad_families = [
        {"css", "selector"},
        {"selector"},
        {"source", "style"},
        {"style"},
        {"interface"},
        {"inheritance"},
        {"polymorphism"},
        {"utility"},
        {"cost"},
        {"curve"},
        {"equilibrium"},
    ]
    return any(tokens == family for family in broad_families)


def _nearest_node_for_page(nodes: List[Dict[str, Any]], page_number: int) -> Optional[Dict[str, Any]]:
    if not nodes:
        return None
    ranked = []
    for idx, node in enumerate(nodes):
        pages = _node_source_page_set(node)
        if not pages:
            continue
        distance = min(abs(page_number - page) for page in pages)
        direction_penalty = 0 if min(pages) <= page_number else 1
        ranked.append((distance, direction_penalty, idx, node))
    if ranked:
        ranked.sort(key=lambda item: item[:3])
        return ranked[0][3]
    return nodes[0]


def _nearest_specific_node_for_page(nodes: List[Dict[str, Any]], page_number: int) -> Optional[Dict[str, Any]]:
    specific_nodes = [node for node in nodes if not _is_broad_family_node(node)]
    return _nearest_node_for_page(specific_nodes, page_number)


def _page_title_candidates(page: Dict[str, Any], topic: str, slide_deck: bool) -> List[str]:
    page_no = int(page.get("page_number") or 1)
    extractor = _extract_slide_concept_titles if slide_deck else _extract_page_concept_titles
    content = str(page.get("content") or "")
    candidates: List[str] = []
    first_segment = re.split(r"[\n\r•]", content, maxsplit=1)[0]
    first_segment = re.sub(r"\s+", " ", first_segment).strip(" .:-\t")
    if ">" in first_segment:
        breadcrumb_title = first_segment.split(">")[-1].strip()
        breadcrumb_title = _clean_section_heading(breadcrumb_title)
        candidates.append(breadcrumb_title)
    if first_segment:
        candidates.append(_clean_section_heading(first_segment))
    candidates.extend(extractor(content, topic, page_no))

    cleaned: List[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        candidate = re.sub(r"\([^)]{1,8}\)", "", str(candidate))
        candidate = re.sub(r"\b\d{4}\s*[-–]\s*(?:present|\d{4})\b", "", candidate, flags=re.IGNORECASE)
        title = _concept_title_from_text(candidate, "")
        key = _concept_key(title)
        if title and key and _is_teachable_title(title) and key not in seen:
            cleaned.append(title)
            seen.add(key)
    return cleaned


def _clean_section_heading(raw_heading: str) -> str:
    heading = re.sub(r"\([^)]{1,16}\)", "", str(raw_heading or ""))
    heading = re.sub(r"\b\d{4}\s*[-–]\s*(?:present|\d{4})\b", "", heading, flags=re.IGNORECASE)
    heading = re.sub(r"\s+", " ", heading).strip(" .:-\t")
    if not heading:
        return ""

    words = re.findall(r"[A-Za-z][A-Za-z0-9&/#-]*", heading)
    lowered = [word.lower() for word in words]
    singulars = [_singular_token(word) for word in lowered]
    for size in range(min(6, len(words) // 2), 0, -1):
        if singulars[:size] == singulars[size:size * 2]:
            heading = " ".join(words[:size])
            words = words[:size]
            break

    heading = re.split(
        r"\b(?:also known|also called|is|are|was|were|has|have|allows?|used to|are used|is used|refers to|means|shows|selects?|targets?|matches?|contains?|includes?|works?|often|another|below|example)\b",
        heading,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip(" .:-\t")
    words = re.findall(r"[A-Za-z][A-Za-z0-9&/#-]*", heading)
    if len(words) >= 3 and words[-1].lower() in {word.lower() for word in words[:-1]}:
        heading = " ".join(words[:-1])
    return heading


def _generic_page_group_title(page: Dict[str, Any], topic: str, slide_deck: bool) -> Optional[str]:
    content = re.sub(r"\s+", " ", str(page.get("content") or "")).strip()
    lowered = content.lower()
    if not content or lowered.startswith("quiz"):
        return None
    topic_title = _concept_title_from_text(re.sub(r"\([^)]*\)", "", str(topic or "")), "Topic")
    if re.search(r"\b(planning|prototyping|mockups?|wireframes?|design tools?)\b", lowered):
        return "Planning And Prototyping"
    if re.search(r"\b(brief history|history|timeline|evolution|before\b|from .+ to .+)\b", lowered):
        return f"{topic_title} Evolution"
    if re.search(r"\b(pros and cons|advantages and disadvantages|benefits and limitations|strengths and weaknesses)\b", lowered):
        return f"{topic_title} Pros And Cons"
    if re.search(r"\b(why|benefits?|purpose|motivation|use cases?|applications?)\b", lowered):
        return f"{topic_title} Benefits And Use Cases"
    candidates = _page_title_candidates(page, topic, slide_deck)
    return candidates[0] if candidates else None


def _add_unmapped_page_nodes(
    nodes: List[Dict[str, Any]],
    pages: List[Dict[str, Any]],
    topic: str,
    domain: str,
) -> List[Dict[str, Any]]:
    assigned_pages = {page for node in nodes for page in _node_source_page_set(node)}
    grouped: Dict[str, Dict[str, Any]] = {}
    order: List[str] = []
    slide_deck = _looks_like_slide_deck(pages)
    for page in pages:
        page_no = int(page.get("page_number") or 0)
        if page_no <= 0 or page_no in assigned_pages:
            continue
        title = _generic_page_group_title(page, topic, slide_deck)
        if not title and int(page.get("text_length") or len(str(page.get("content") or ""))) < 80:
            continue
        if not title:
            candidates = _page_title_candidates(page, topic, slide_deck)
            title = candidates[0] if candidates else None
        if not title:
            continue
        key = _concept_key(title)
        if not key:
            continue
        if key not in grouped:
            grouped[key] = {
                "id": "",
                "title": title,
                "domain": domain,
                "modality": classify_concept_modality(title, str(page.get("content") or ""), domain),
                "source_pages": [],
                "source_excerpts": [],
                "objective_ids": [],
                "teaching_order": 0,
                "warnings": ["created_for_unmapped_source_page"],
            }
            order.append(key)
        grouped[key]["source_pages"].append(page_no)

    additions = [grouped[key] for key in order]
    for node in additions:
        source_pages = sorted(_node_source_page_set(node))
        node["source_pages"] = source_pages
        node["source_excerpts"] = _source_excerpts_for_pages(pages, source_pages)
    return nodes + additions


def _choose_split_title(
    parent_title: str,
    candidates: List[str],
    fallback_title: str,
) -> str:
    parent_tokens = _roadmap_title_tokens(parent_title)
    valid_candidates: List[Tuple[bool, bool, float, str]] = []
    for candidate in candidates:
        candidate = _concept_title_from_text(candidate, "")
        if re.match(r"^(quiz|page)\b", candidate, flags=re.IGNORECASE):
            continue
        if not _is_teachable_title(candidate):
            continue
        candidate_tokens = _roadmap_title_tokens(candidate)
        if not candidate_tokens:
            continue
        if candidate_tokens.issubset(parent_tokens) and len(candidate_tokens) <= 1 and len(candidate.split()) <= 1:
            continue
        valid_candidates.append((
            candidate_tokens == parent_tokens,
            parent_tokens.issubset(candidate_tokens) and candidate_tokens != parent_tokens,
            _roadmap_token_similarity(parent_tokens, candidate_tokens),
            candidate,
        ))
    exact = [item for item in valid_candidates if item[0]]
    if exact:
        exact.sort(key=lambda item: len(item[3]))
        if _concept_key(exact[0][3]) == _concept_key(parent_title):
            return parent_title
        return exact[0][3]
    overlapping = [item for item in valid_candidates if item[2] > 0]
    if overlapping:
        overlapping.sort(key=lambda item: (item[1], -item[2], len(item[3])))
        return overlapping[0][3]
    if valid_candidates:
        return valid_candidates[0][3]
    return fallback_title


def _split_oversized_source_nodes(
    nodes: List[Dict[str, Any]],
    pages: List[Dict[str, Any]],
    topic: str,
    domain: str,
) -> List[Dict[str, Any]]:
    page_by_number = {int(page.get("page_number") or 0): page for page in pages}
    slide_deck = _looks_like_slide_deck(pages)
    split_nodes: List[Dict[str, Any]] = []

    for node in nodes:
        source_pages = sorted(_node_source_page_set(node))
        if not source_pages:
            split_nodes.append(node)
            continue
        span = max(source_pages) - min(source_pages) + 1
        title = str(node.get("title") or "")
        title_tokens = _roadmap_title_tokens(title)
        broad_family = bool(
            title_tokens
            & {
                "selector",
                "style",
                "interface",
                "polymorphism",
                "inheritance",
                "utility",
                "equilibrium",
                "constraint",
                "curve",
                "cost",
            }
        )
        candidate_group_count = 0
        for page_no in source_pages:
            page = page_by_number.get(page_no, {"page_number": page_no, "content": ""})
            for candidate in _page_title_candidates(page, topic, slide_deck):
                candidate_tokens = _roadmap_title_tokens(candidate)
                if candidate_tokens and candidate_tokens != title_tokens:
                    candidate_group_count += 1
                    break
        should_split = (
            len(source_pages) >= 10
            or span >= 14
            or (broad_family and len(source_pages) >= 4 and candidate_group_count >= 3)
        )
        if not should_split:
            split_nodes.append(node)
            continue

        groups: Dict[str, Dict[str, Any]] = {}
        order: List[str] = []
        current_title = title
        for page_no in source_pages:
            page = page_by_number.get(page_no, {"page_number": page_no, "content": ""})
            chosen_title = _choose_split_title(
                title,
                _page_title_candidates(page, topic, slide_deck),
                current_title,
            )
            current_title = chosen_title
            key = _concept_key(chosen_title)
            if not key:
                continue
            if key not in groups:
                child = dict(node)
                child["title"] = chosen_title
                child["source_pages"] = []
                child["source_excerpts"] = []
                child["objective_ids"] = []
                child["warnings"] = sorted(set((node.get("warnings") or []) + ["split_from_oversized_atomic_note"]))
                child["modality"] = classify_concept_modality(chosen_title, str(page.get("content") or ""), domain)
                groups[key] = child
                order.append(key)
            groups[key]["source_pages"].append(page_no)

        children = [groups[key] for key in order]
        if len(children) <= 1:
            split_nodes.append(node)
            continue
        if len(children) > 24:
            split_nodes.append(node)
            continue

        parent_objectives = list(node.get("objective_ids") or [])
        for idx, child in enumerate(children):
            child_pages = sorted({int(p) for p in child.get("source_pages", []) if str(p).isdigit()})
            child["source_pages"] = child_pages
            child["source_excerpts"] = _source_excerpts_for_pages(pages, child_pages)
            child["objective_ids"] = parent_objectives if idx == 0 else []
            split_nodes.append(child)

    return split_nodes


def _assign_unmapped_pages_to_nearest_nodes(
    nodes: List[Dict[str, Any]],
    pages: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    if not nodes:
        return nodes
    assigned_pages = {page for node in nodes for page in _node_source_page_set(node)}
    for page_no in _source_page_numbers(pages):
        if page_no in assigned_pages:
            continue
        node = _nearest_node_for_page(nodes, page_no)
        if node and _is_broad_family_node(node):
            specific_node = _nearest_specific_node_for_page(nodes, page_no)
            if specific_node:
                node = specific_node
        if not node:
            continue
        node_pages = set(_node_source_page_set(node))
        node_pages.add(page_no)
        node["source_pages"] = sorted(node_pages)
        warnings = set(node.get("warnings") or [])
        warnings.add("unmapped_page_assigned_by_proximity")
        node["warnings"] = sorted(warnings)
    for node in nodes:
        source_pages = sorted(_node_source_page_set(node))
        node["source_pages"] = source_pages
        node["source_excerpts"] = _source_excerpts_for_pages(pages, source_pages) or node.get("source_excerpts", [])
    return nodes


def _specificity_score_for_overlap(node: Dict[str, Any]) -> int:
    tokens = _roadmap_title_tokens(str(node.get("title") or ""))
    score = len(tokens)
    if tokens & {"element", "class", "id", "descendant", "child", "adjacent", "sibling", "attribute", "universal", "grouping", "specificity", "cascade"}:
        score += 4
    if tokens in ({"css"}, {"selector"}, {"css", "selector"}, {"basic"}, {"syntax"}):
        score -= 4
    if len(_node_source_page_set(node)) >= 10:
        score -= 2
    return score


def _trim_broad_parent_page_overlaps(nodes: List[Dict[str, Any]], pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not nodes:
        return nodes
    exact_groups: Dict[str, Dict[str, Any]] = {}
    exact_order: List[str] = []
    for node in nodes:
        if not _is_teachable_title(str(node.get("title") or "")):
            continue
        key = _roadmap_cluster_key(str(node.get("title") or ""))
        if not key:
            continue
        if key not in exact_groups:
            exact_groups[key] = dict(node)
            exact_order.append(key)
            continue
        existing = exact_groups[key]
        existing["source_pages"] = sorted(_node_source_page_set(existing) | _node_source_page_set(node))
        existing["source_excerpts"] = _source_excerpts_for_pages(pages, existing["source_pages"])
        existing["objective_ids"] = list(dict.fromkeys((existing.get("objective_ids") or []) + (node.get("objective_ids") or [])))
        existing["warnings"] = sorted(set((existing.get("warnings") or []) + (node.get("warnings") or [])))
    nodes = [exact_groups[key] for key in exact_order]
    page_owner: Dict[int, Dict[str, Any]] = {}
    for node in sorted(nodes, key=lambda item: (-_specificity_score_for_overlap(item), int(item.get("teaching_order") or 9999))):
        for page_no in _node_source_page_set(node):
            page_owner.setdefault(page_no, node)

    trimmed: List[Dict[str, Any]] = []
    for node in nodes:
        pages_for_node = sorted(_node_source_page_set(node))
        if not pages_for_node:
            continue
        owned = [page_no for page_no in pages_for_node if page_owner.get(page_no) is node]
        if not owned:
            owned = pages_for_node[:2]
        if len(pages_for_node) >= 8 and len(owned) < len(pages_for_node):
            warnings = set(node.get("warnings") or [])
            warnings.add("overlap_trimmed_to_specific_atomic_notes")
            node["warnings"] = sorted(warnings)
        node["source_pages"] = sorted(set(owned))
        node["source_excerpts"] = _source_excerpts_for_pages(pages, node["source_pages"]) or node.get("source_excerpts", [])
        trimmed.append(node)
    return trimmed


def _ensure_all_pages_covered_after_trim(
    nodes: List[Dict[str, Any]],
    pages: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    covered = {page_no for node in nodes for page_no in _node_source_page_set(node)}
    for page_no in _source_page_numbers(pages):
        if page_no in covered:
            continue
        node = _nearest_node_for_page(nodes, page_no)
        if node and _is_broad_family_node(node):
            specific_node = _nearest_specific_node_for_page(nodes, page_no)
            if specific_node:
                node = specific_node
        if not node:
            continue
        node_pages = set(_node_source_page_set(node))
        node_pages.add(page_no)
        node["source_pages"] = sorted(node_pages)
        warnings = set(node.get("warnings") or [])
        warnings.add("coverage_page_restored_after_overlap_trim")
        node["warnings"] = sorted(warnings)
        covered.add(page_no)
    for node in nodes:
        source_pages = sorted(_node_source_page_set(node))
        node["source_pages"] = source_pages
        node["source_excerpts"] = _source_excerpts_for_pages(pages, source_pages) or node.get("source_excerpts", [])
    return nodes


def finalize_source_roadmap_nodes(
    nodes: List[Dict[str, Any]],
    pages: List[Dict[str, Any]],
    topic: str,
    domain: str,
) -> List[Dict[str, Any]]:
    finalized = _split_oversized_source_nodes([dict(node) for node in nodes], pages, topic, domain)
    finalized = _add_unmapped_page_nodes(finalized, pages, topic, domain)
    finalized = _assign_unmapped_pages_to_nearest_nodes(finalized, pages)
    finalized = _trim_broad_parent_page_overlaps(finalized, pages)
    finalized = _ensure_all_pages_covered_after_trim(finalized, pages)

    def order_key(node: Dict[str, Any]) -> Tuple[int, str]:
        pages_for_node = sorted(_node_source_page_set(node))
        return (min(pages_for_node) if pages_for_node else 9999, str(node.get("title") or "").lower())

    finalized.sort(key=order_key)
    for idx, node in enumerate(finalized, start=1):
        node["id"] = f"concept_{idx}"
        node["teaching_order"] = idx
        node["domain"] = node.get("domain") or domain
        source_pages = sorted(_node_source_page_set(node))
        node["source_pages"] = source_pages
        node["source_excerpts"] = _source_excerpts_for_pages(pages, source_pages) or node.get("source_excerpts", [])
        source_context = " ".join(ex.get("text", "") for ex in node.get("source_excerpts", []))
        node["modality"] = node.get("modality") or classify_concept_modality(node.get("title", ""), source_context, domain)
        node.setdefault("objective_ids", [])
        node.setdefault("warnings", [])
    return finalized


def _coverage_item_type(text: str) -> str:
    lowered = str(text or "").lower()
    if re.search(r"[A-Za-z]\w*\s*[=+*/-]\s*[A-Za-z0-9]", text or ""):
        return "formula"
    if any(token in lowered for token in [" versus ", " vs ", "compare", "differentiate", "contrast"]):
        return "comparison"
    if any(token in lowered for token in ["step", "process", "procedure", "sequence", "workflow", "event handling"]):
        return "process"
    if any(token in lowered for token in ["example", "case", "scenario"]):
        return "example"
    if any(token in lowered for token in ["define", "definition", " means ", " is ", " are ", "refers to"]):
        return "definition"
    return "concept"


def _coverage_importance(text: str, *, is_objective: bool = False, in_heading: bool = False) -> str:
    lowered = str(text or "").lower()
    if is_objective or in_heading:
        return "high"
    if re.search(r"[A-Za-z]\w*\s*[=+*/-]\s*[A-Za-z0-9]", text or ""):
        return "high"
    if any(token in lowered for token in ["define", "explain", "describe", "differentiate", "derive", "compare"]):
        return "high"
    if len(str(text or "").split()) >= 18:
        return "medium"
    return "low"


def _page_heading(page_content: str, page_number: int) -> str:
    for raw_line in str(page_content or "").splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip(" .:-\t")
        if not line:
            continue
        if re.match(r"^(objectives?|after successful completion)\b", line, flags=re.IGNORECASE):
            continue
        title = _concept_title_from_text(line, f"Page {page_number}")
        if title and _is_teachable_title(title):
            return title
    return f"Page {page_number} Source Content"


def _best_node_for_page(nodes: List[Dict[str, Any]], page_number: int) -> Optional[Dict[str, Any]]:
    candidates = [
        node for node in nodes
        if page_number in {int(p) for p in node.get("source_pages", []) if str(p).isdigit()}
    ]
    if not candidates:
        return _nearest_node_for_page(nodes, page_number)
    candidates.sort(key=lambda node: (int(node.get("teaching_order") or 9999), str(node.get("title") or "")))
    return candidates[0]


def build_source_coverage_items(
    pages: List[Dict[str, Any]],
    objectives: List[Dict[str, Any]],
    nodes: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Builds a source-item ledger where every meaningful page is accounted for.

    The ledger is intentionally deterministic. AI may improve names later, but it does
    not get to decide whether a source item silently disappears.
    """
    items: List[Dict[str, Any]] = []
    objective_by_page: Dict[int, List[Dict[str, Any]]] = {}
    for objective in objectives:
        page_number = int(objective.get("page_number") or 1)
        objective_by_page.setdefault(page_number, []).append(objective)

    for page in pages:
        page_number = int(page.get("page_number") or len(items) + 1)
        content = re.sub(r"\s+", " ", str(page.get("content") or "")).strip()
        if not content:
            items.append({
                "id": f"src_page_{page_number}",
                "page_number": page_number,
                "text": f"Page {page_number} has no extractable text.",
                "type": "warning",
                "importance": "high",
                "status": "warning",
                "assigned_note_id": None,
                "assigned_note_title": None,
                "reason": "empty_or_unreadable_page",
            })
            continue

        assigned_node = _best_node_for_page(nodes, page_number)
        assigned_id = assigned_node.get("id") if assigned_node else None
        assigned_title = assigned_node.get("title") if assigned_node else None

        for objective in objective_by_page.get(page_number, []):
            text = str(objective.get("text") or "").strip()
            if not text:
                continue
            items.append({
                "id": f"src_obj_{objective.get('objective_id') or page_number}_{len(items) + 1}",
                "page_number": page_number,
                "text": text,
                "type": "objective",
                "importance": "high",
                "status": "covered" if assigned_node else "warning",
                "assigned_note_id": assigned_id,
                "assigned_note_title": assigned_title,
                "reason": "learning_objective",
            })

        heading = _page_heading(str(page.get("content") or ""), page_number)
        item_type = _coverage_item_type(content)
        importance = _coverage_importance(content, in_heading=bool(heading))
        items.append({
            "id": f"src_page_{page_number}",
            "page_number": page_number,
            "text": content[:320],
            "title": heading,
            "type": item_type,
            "importance": importance,
            "status": "covered" if assigned_node else "warning",
            "assigned_note_id": assigned_id,
            "assigned_note_title": assigned_title,
            "reason": "page_content_mapped_to_nearest_atomic_note" if assigned_node else "no_atomic_note_mapped_to_page",
        })

    for node in nodes:
        pages_for_node = [int(p) for p in node.get("source_pages", []) if str(p).isdigit()]
        if not pages_for_node:
            continue
        items.append({
            "id": f"src_node_{node['id']}",
            "page_number": min(pages_for_node),
            "text": " ".join(str(ex.get("text", "")) for ex in node.get("source_excerpts", []) or [])[:320],
            "title": node.get("title"),
            "type": "atomic_concept",
            "importance": "high" if node.get("objective_ids") else "medium",
            "status": "covered",
            "assigned_note_id": node.get("id"),
            "assigned_note_title": node.get("title"),
            "reason": "planned_atomic_note",
        })

    return items


def _chapter_title_from_nodes(nodes: List[Dict[str, Any]], index: int) -> str:
    if not nodes:
        return f"Chapter {index}"
    first = str(nodes[0].get("title") or "Foundations").strip()
    last = str(nodes[-1].get("title") or first).strip()
    
    def clean(t: str) -> str:
        t = re.sub(r"\s*\([^)]*\)\s*$", "", t).strip()
        t = re.sub(r"^[>\-→•]\s*", "", t).strip()
        if len(t) > 30:
            words = t.split()
            if len(words) > 4:
                t = " ".join(words[:4]) + "..."
        return t

    first_clean = clean(first)
    last_clean = clean(last)

    if first_clean.lower() == last_clean.lower():
        core = first_clean
    else:
        if first_clean and last_clean:
            core = f"{first_clean} to {last_clean}"
        else:
            core = first_clean or last_clean or "Foundations"
            
    core = re.sub(r"\s+", " ", core).strip(" .:-\t") or "Foundations"
    return f"Chapter {index}: {core}"


def build_nested_chapters(job: Dict[str, Any], nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not nodes:
        return []
    ordered = sorted(nodes, key=lambda node: int(node.get("teaching_order") or 9999))
    target_size = 5
    if len(ordered) <= 6:
        target_size = max(3, len(ordered))
    elif len(ordered) >= 18:
        target_size = 6

    groups: List[List[Dict[str, Any]]] = []
    current: List[Dict[str, Any]] = []
    current_pages: set[int] = set()
    for node in ordered:
        node_pages = {int(p) for p in node.get("source_pages", []) if str(p).isdigit()}
        first_page = min(node_pages) if node_pages else None
        last_current_page = max(current_pages) if current_pages else None
        should_split = (
            current
            and len(current) >= 3
            and (
                len(current) >= target_size
                or (
                    first_page is not None
                    and last_current_page is not None
                    and first_page - last_current_page >= 3
                )
            )
        )
        if should_split:
            groups.append(current)
            current = []
            current_pages = set()
        current.append(node)
        current_pages.update(node_pages)
    if current:
        groups.append(current)

    chapters: List[Dict[str, Any]] = []
    for idx, group in enumerate(groups, start=1):
        pages = sorted({int(p) for node in group for p in node.get("source_pages", []) if str(p).isdigit()})
        chapter_id = f"chapter_{idx:02d}"
        chapters.append({
            "id": chapter_id,
            "order": idx,
            "title": _chapter_title_from_nodes(group, idx),
            "source_pages": pages,
            "atomic_notes": [
                {
                    "id": node.get("id"),
                    "title": node.get("title"),
                    "path": _source_note_rel_path(job, node.get("title", "Untitled Concept")),
                    "domain": node.get("domain"),
                    "modality": node.get("modality"),
                    "source_pages": node.get("source_pages", []),
                    "status": "ready",
                }
                for node in group
            ],
            "quiz_policy": "unlock_after_atomic_notes_mastered",
        })
    return chapters


def _refine_concept_graph(
    topic: str,
    objectives: List[Dict[str, Any]],
    pages: List[Dict[str, Any]],
    domain: str,
    nodes: List[Dict[str, Any]],
    roadmap_refiner: Optional[RoadmapRefiner] = None,
    strict_ai: bool = False,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    if not roadmap_refiner:
        edges = [
            {"from": nodes[i]["id"], "to": nodes[i + 1]["id"], "type": "prerequisite"}
            for i in range(len(nodes) - 1)
        ]
        return nodes, edges, []

    payload = {
        "topic": topic,
        "domain": domain,
        "objectives": objectives,
        "pages": [
            {
                "page_number": page.get("page_number"),
                "content": re.sub(r"\s+", " ", page.get("content", "")).strip()[:1200],
            }
            for page in pages
        ],
        "nodes": [
            {
                "title": node.get("title"),
                "domain": node.get("domain"),
                "modality": node.get("modality"),
                "source_pages": node.get("source_pages", []),
                "source_context": " ".join(ex.get("text", "") for ex in node.get("source_excerpts", []))[:1200],
            }
            for node in nodes
        ],
    }
    try:
        refined = roadmap_refiner(payload)
    except Exception as exc:
        if strict_ai:
            raise SourceAIGenerationError(f"AI roadmap refinement failed: {type(exc).__name__}: {exc}") from exc
        compacted = _compact_deterministic_nodes(nodes)
        return compacted, _edges_for_nodes(compacted), [{
            "concept": topic,
            "dimension": "definition",
            "severity": "medium",
            "description": f"AI roadmap refinement failed; compacted deterministic roadmap retained: {type(exc).__name__}",
        }]

    if not isinstance(refined, list) or not refined:
        if strict_ai:
            raise SourceAIGenerationError("AI roadmap refinement returned no usable concepts.")
        compacted = _compact_deterministic_nodes(nodes)
        return compacted, _edges_for_nodes(compacted), [{
            "concept": topic,
            "dimension": "definition",
            "severity": "medium",
            "description": "AI roadmap refinement returned no usable concepts; compacted deterministic roadmap retained.",
        }]

    page_numbers = {int(page.get("page_number", idx + 1)) for idx, page in enumerate(pages)}
    existing_by_title = {_concept_key(node.get("title", "")): node for node in nodes}
    refined_nodes: List[Dict[str, Any]] = []
    seen: set[str] = set()
    fallback_page = min(page_numbers) if page_numbers else 1
    for idx, item in enumerate(refined, start=1):
        if not isinstance(item, dict):
            continue
        title = _concept_title_from_text(item.get("title", ""), "")
        if not _is_teachable_title(title):
            continue
        key = _concept_key(title)
        if key in seen:
            continue
        seen.add(key)
        existing = existing_by_title.get(key) or {}
        raw_source_pages = item.get("source_pages") or existing.get("source_pages") or [fallback_page]
        source_pages = sorted({
            int(page_no)
            for page_no in raw_source_pages
            if str(page_no).isdigit() and int(page_no) in page_numbers
        }) or [fallback_page]
        source_excerpts = _source_excerpts_for_pages(pages, source_pages) or existing.get("source_excerpts", [])
        source_context = " ".join(ex.get("text", "") for ex in source_excerpts)
        refined_nodes.append({
            "id": f"concept_{idx}",
            "title": title[:80],
            "domain": item.get("domain") or existing.get("domain") or domain,
            "modality": item.get("modality") or existing.get("modality") or classify_concept_modality(title, source_context, domain),
            "source_pages": source_pages,
            "source_excerpts": source_excerpts,
            "objective_ids": item.get("objective_ids") or existing.get("objective_ids") or [],
            "teaching_order": len(refined_nodes) + 1,
            "warnings": item.get("warnings") or existing.get("warnings") or [],
        })

    if not refined_nodes:
        if strict_ai:
            raise SourceAIGenerationError("AI roadmap refinement returned only invalid concepts.")
        compacted = _compact_deterministic_nodes(nodes)
        return compacted, _edges_for_nodes(compacted), [{
            "concept": topic,
            "dimension": "definition",
            "severity": "medium",
            "description": "AI roadmap refinement returned only invalid concepts; compacted deterministic roadmap retained.",
        }]

    for idx, node in enumerate(refined_nodes, start=1):
        node["id"] = f"concept_{idx}"
        node["teaching_order"] = idx
    reconciled_nodes = _reconcile_refined_nodes(refined_nodes, nodes, pages, domain)
    warnings: List[Dict[str, Any]] = []
    if len(reconciled_nodes) > len(refined_nodes):
        warnings.append({
            "concept": topic,
            "dimension": "roadmap",
            "severity": "low",
            "description": "Deterministic source-backed concepts were restored after AI roadmap refinement.",
        })
    return reconciled_nodes, _edges_for_nodes(reconciled_nodes), warnings


class SourceAtomicNoteCompiler:
    REQUIRED_SECTIONS = ["Mental Model", "Proving Grounds"]
    FORBIDDEN_PROMPT_MARKERS = ["system prompt", "developer message", "ignore previous", "chain of thought"]
    DRIFT_TERMS = ["central banking", "exchange rates", "python", "java", "biology", "aggregate demand"]

    def _dynamic_teaching_headings(self, node: Dict[str, Any], profile: Dict[str, Any]) -> List[str]:
        domain = str(node.get("domain") or "").upper()
        modality = str(node.get("modality") or "Qualitative/Definitional")
        if domain.startswith("ECON"):
            if modality == "Quantitative":
                return ["The Economic Intuition", "The Calculation Logic", "The Formal Math & Models"]
            if modality == "Comparative":
                return ["The Economic Intuition", "The Comparison Mechanism", "The Formal Math & Models"]
            return ["The Economic Intuition", "The Choice Mechanism", "The Formal Math & Models"]
        if domain.startswith("CS"):
            return ["The Working Intuition", "The Implementation Logic", "Failure Modes And Edge Cases"]
        if domain.startswith("MATH"):
            return ["The Mathematical Intuition", "The Formal Structure", "Boundary Cases And Counterexamples"]
        if domain.startswith("MED"):
            return ["The Clinical Intuition", "The Body Mechanism", "Failure States And Interventions"]
        return ["The Core Intuition", "The Working Mechanism", "Limits And Transfer"]

    def _strip_visible_citations(self, text: str) -> str:
        stripped = re.sub(r"\s*\[PAGE\s+\d+\]", "", str(text or ""), flags=re.IGNORECASE)
        stripped = re.sub(r"[ \t]{2,}", " ", stripped)
        stripped = re.sub(r" *\n *", "\n", stripped)
        return stripped.strip()

    def build_ai_prompt(self, job: Dict[str, Any], node: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        excerpts = "\n\n".join(
            f"[PAGE {ex.get('page')}]\n{ex.get('text', '')}"
            for ex in node.get("source_excerpts", [])
        )
        practice_blueprint = build_practice_blueprint(
            note_title=node.get("title", "Untitled Concept"),
            modality=node.get("modality", "Qualitative/Definitional"),
            source_snippet=excerpts,
            prerequisites_count=len(node.get("prerequisites", []) or []),
            mode=node.get("domain") or "ACADEMIC-GENERAL",
            max_questions=5,
        )
        teaching_headings = self._dynamic_teaching_headings(node, profile)
        return {
            "system": (
                "Generate the complete Atomic Note Markdown body only. Deterministic code owns YAML and deployment paths, "
                "but YOU must output the required Markdown headings and exactly one ```interactive-quiz``` JSON block. "
                "Stay strictly inside the provided source excerpts, but do not show inline citations in the visible note."
            ),
            "user": {
                "source_file": job.get("file_name"),
                "valid_source_pages": node.get("source_pages", []),
                "concept": node.get("title"),
                "domain": node.get("domain"),
                "modality": node.get("modality"),
                "profile": {
                    "persona": profile.get("persona"),
                    "artifact_constraints": profile.get("artifact_constraints", {}),
                    "question_modes": profile.get("question_modes", []),
                    "prohibitions": profile.get("prohibitions", profile.get("prohibited_anti_patterns", "")),
                },
                "practice_blueprint": practice_blueprint,
                "teaching_headings": teaching_headings,
                "source_excerpts": excerpts[:4000],
                "required_markdown_contract": [
                    "Start with: ## Mental Model",
                    "Do not include visible [PAGE n] citations anywhere in the Markdown body.",
                    f"Then include exactly these three teaching headings in this order: ## {teaching_headings[0]}, ## {teaching_headings[1]}, ## {teaching_headings[2]}",
                    "Each teaching heading must contain detailed simple-English prose that takes a beginner from zero toward competency.",
                    "Use an artifact only when it helps the concept: table, LaTeX, Mermaid, code, or ASCII diagram.",
                    "End with: ## The Proving Grounds",
                    "Under Proving Grounds include exactly one fenced block starting with ```interactive-quiz",
                    "The interactive-quiz block must contain a JSON array with 3 to 5 question objects for normal concepts.",
                    "Question objects must follow practice_blueprint legacy_types/families/formats when possible.",
                    "The question type, family, format, and variant must be internally consistent.",
                    "Every question should include schema_version=2, family, format, variant, skill_target, rubric, and remediation.",
                    "Do not include YAML/frontmatter, markdown fences around the whole note, or explanatory prefaces.",
                ],
                "quiz_schema": [{
                    "id": "q1",
                    "type": "mcq|writing|calculation|matching",
                    "schema_version": 2,
                    "family": "recognize|recall|explain|apply|solve|trace|debug|diagnose|compare|construct|critique",
                    "format": "choice|short_text|long_text|blank|match|order|code_editor|table_editor|diagram_task|sandbox|self_grade",
                    "variant": "domain-specific question variant",
                    "skill_target": node.get("title"),
                    "question": "standalone source-grounded question",
                    "options": {"A": "required for mcq", "B": "required for mcq"},
                    "answer": "correct answer",
                    "explanation": "why the answer follows from the cited source",
                    "rubric": {"grading_mode": "objective|rubric|hybrid", "must_include": []},
                    "remediation": {"misconception_codes": ["missing_definition"], "follow_up_policy": "different_family_or_format"},
                }],
            },
        }

    def build_ai_repair_prompt(
        self,
        base_prompt: Dict[str, Any],
        invalid_content: str,
        validation_errors: List[str],
    ) -> Dict[str, Any]:
        repaired = copy.deepcopy(base_prompt)
        repaired["system"] = (
            f"{base_prompt.get('system', '')}\n\n"
            "Repair the previous malformed note into the exact required contract. Preserve any useful source-grounded "
            "teaching content, but return a complete valid Atomic Note body. Do not apologize or explain the repair."
        )
        user = dict(repaired.get("user") or {})
        user["validation_errors_to_fix"] = validation_errors
        user["previous_invalid_output"] = str(invalid_content or "")[:5000]
        user["repair_requirements"] = [
            "The repaired output must contain literal heading text: ## Mental Model",
            "The repaired output must contain exactly three teaching headings between Mental Model and The Proving Grounds.",
            "The repaired output must contain literal heading text: ## The Proving Grounds",
            "The repaired output must contain exactly one ```interactive-quiz fenced JSON array.",
            "The repaired output must not include visible [PAGE n] citations.",
            "If any quiz item has type mcq, it must include an options object with at least A and B choices and answer must be one option key.",
            "Every quiz item must have internally consistent type, family, format, and variant.",
            "Return Markdown body only.",
        ]
        repaired["user"] = user
        return repaired

    def _contains_forbidden_artifact(self, text: str, forbidden_items: List[str]) -> bool:
        lower = text.lower()
        for raw_item in forbidden_items:
            item = str(raw_item or "").strip().lower()
            if not item:
                continue
            if len(item) <= 2:
                if re.search(rf"(?<![a-z0-9]){re.escape(item)}(?![a-z0-9])", lower):
                    return True
            elif " " in item:
                if item in lower:
                    return True
            elif re.search(rf"(?<![a-z0-9]){re.escape(item)}(?![a-z0-9])", lower):
                return True
        return False

    def _valid_source_pages(self, node: Dict[str, Any]) -> set[int]:
        return {int(p) for p in node.get("source_pages", []) if str(p).isdigit()}

    def validate_content(self, content: str, node: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[bool, List[str]]:
        errors: List[str] = []
        raw_text = content or ""
        raw_cited_pages = {int(p) for p in re.findall(r"\[PAGE\s+(\d+)\]", raw_text, flags=re.IGNORECASE)}
        text = raw_text
        text = self._strip_visible_citations(text)
        lower = text.lower()
        for section in self.REQUIRED_SECTIONS:
            if section.lower() not in lower:
                errors.append(f"missing_section:{section}")
        valid_pages = self._valid_source_pages(node)
        if valid_pages and raw_cited_pages and not raw_cited_pages.issubset(valid_pages):
            errors.append("invalid_citation")
        cited_pages_after_strip = {int(p) for p in re.findall(r"\[PAGE\s+(\d+)\]", text, flags=re.IGNORECASE)}
        if cited_pages_after_strip:
            errors.append("visible_citation")
        headings = re.findall(r"^##\s+(.+?)\s*$", text, flags=re.MULTILINE)
        teaching_headings = [
            heading for heading in headings
            if heading.lower() not in {"mental model", "the proving grounds"}
        ]
        if len(teaching_headings) != 3:
            errors.append("invalid_teaching_heading_count")
        if "```interactive-quiz" in text:
            quiz_match = re.search(r"```interactive-quiz\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)
            try:
                parsed = json.loads(quiz_match.group(1).strip() if quiz_match else "")
                if not isinstance(parsed, list):
                    errors.append("invalid_quiz_json")
                else:
                    if not (1 <= len(parsed) <= 5):
                        errors.append("invalid_quiz_count")
                    for idx, item in enumerate(parsed, start=1):
                        if not isinstance(item, dict):
                            errors.append(f"invalid_quiz_item:{idx}")
                            continue
                        q_type = str(item.get("type", "")).lower()
                        family = str(item.get("family", "")).lower()
                        q_format = str(item.get("format", "")).lower()
                        if not item.get("question"):
                            errors.append(f"missing_quiz_question:{idx}")
                        if q_type == "mcq":
                            options = item.get("options")
                            if not isinstance(options, dict) or len(options) < 2:
                                errors.append(f"missing_mcq_options:{idx}")
                            elif str(item.get("answer", "")) not in {str(key) for key in options.keys()}:
                                errors.append(f"invalid_mcq_answer:{idx}")
                        expected_by_type = {
                            "mcq": ("recognize", "choice"),
                            "true_false": ("recognize", "choice"),
                            "fill_in": ("recall", "blank"),
                            "matching": ("compare", "match"),
                            "order": ("trace", "order"),
                            "writing": ("explain", "short_text"),
                            "scenario": ("apply", "long_text"),
                            "synthesis": ("construct", "long_text"),
                            "calculation": ("solve", "short_text"),
                            "data_analysis": ("diagnose", "table_editor"),
                            "trace": ("trace", "short_text"),
                            "debug": ("debug", "long_text"),
                            "code": ("construct", "code_editor"),
                            "find_error": ("diagnose", "long_text"),
                        }
                        expected = expected_by_type.get(q_type)
                        if expected and (family and family != expected[0] or q_format and q_format != expected[1]):
                            errors.append(f"inconsistent_quiz_toolkit:{idx}")
            except Exception:
                errors.append("invalid_quiz_json")
        else:
            errors.append("missing_quiz")
        forbidden_artifacts = [str(v).lower() for v in profile.get("artifact_constraints", {}).get("forbidden", [])]
        if self._contains_forbidden_artifact(text, forbidden_artifacts):
            errors.append("forbidden_artifact")
        if node.get("domain") == "ECON-MICRO" and any(term in lower for term in self.DRIFT_TERMS if term not in ["python", "java"]):
            errors.append("domain_drift")
        if any(marker in lower for marker in self.FORBIDDEN_PROMPT_MARKERS):
            errors.append("prompt_leakage")
        return not errors, errors

    def _heal_quiz_metadata_in_content(self, content: str) -> str:
        if "```interactive-quiz" not in content:
            return content
        quiz_match = re.search(r"```interactive-quiz\s*(.*?)```", content, flags=re.DOTALL | re.IGNORECASE)
        if not quiz_match:
            return content
        try:
            parsed = json.loads(quiz_match.group(1).strip())
            if not isinstance(parsed, list):
                return content
            expected_by_type = {
                "mcq": ("recognize", "choice"),
                "true_false": ("recognize", "choice"),
                "fill_in": ("recall", "blank"),
                "matching": ("compare", "match"),
                "order": ("trace", "order"),
                "writing": ("explain", "short_text"),
                "scenario": ("apply", "long_text"),
                "synthesis": ("construct", "long_text"),
                "calculation": ("solve", "short_text"),
                "data_analysis": ("diagnose", "table_editor"),
                "trace": ("trace", "short_text"),
                "debug": ("debug", "long_text"),
                "code": ("construct", "code_editor"),
                "find_error": ("diagnose", "long_text"),
            }
            healed_list = []
            for item in parsed:
                if not isinstance(item, dict):
                    healed_list.append(item)
                    continue
                healed_item = dict(item)
                q_type = str(healed_item.get("type", "")).lower().strip()
                if not q_type:
                    q_format = str(healed_item.get("format", "")).lower().strip()
                    if "choice" in q_format:
                        q_type = "mcq"
                    elif "blank" in q_format:
                        q_type = "fill_in"
                    elif "match" in q_format:
                        q_type = "matching"
                    elif "order" in q_format:
                        q_type = "order"
                    elif "short_text" in q_format or "recall" in str(healed_item.get("family", "")).lower():
                        q_type = "writing"
                    else:
                        q_type = "writing"
                    healed_item["type"] = q_type
                expected = expected_by_type.get(q_type)
                if expected:
                    healed_item["family"] = expected[0]
                    healed_item["format"] = expected[1]
                else:
                    healed_item["type"] = "writing"
                    healed_item["family"] = "explain"
                    healed_item["format"] = "short_text"
                healed_list.append(healed_item)
            fixed_json = json.dumps(healed_list, ensure_ascii=False, indent=2)
            start_idx = quiz_match.start()
            end_idx = quiz_match.end()
            return content[:start_idx] + "```interactive-quiz\n" + fixed_json + "\n```" + content[end_idx:]
        except Exception:
            return content

    def repair_or_replace_content(
        self,
        content: str,
        job: Dict[str, Any],
        node: Dict[str, Any],
        profile: Dict[str, Any],
        strict_ai: bool = False,
    ) -> Dict[str, Any]:
        content = self._heal_quiz_metadata_in_content(content)
        valid, errors = self.validate_content(content, node, profile)
        if valid:
            note = self.compile_fallback_note(job, node, profile)
            note["content"] = self._strip_visible_citations(content)
            note["fallback"] = False
            note["frontmatter"]["fallback_generation"] = False
            return note
        if strict_ai:
            raise SourceAIGenerationError(f"AI note generation failed validation: {','.join(errors)}")
        note = self.compile_fallback_note(job, node, profile)
        note["validation_errors"] = errors
        note["frontmatter"]["fallback_reason"] = ",".join(errors)
        return note

    def compile_note(
        self,
        job: Dict[str, Any],
        node: Dict[str, Any],
        profile: Dict[str, Any],
        ai_generator: Optional[Callable[[Dict[str, Any]], str]] = None,
        strict_ai: bool = False,
    ) -> Dict[str, Any]:
        if not ai_generator:
            note = self.compile_fallback_note(job, node, profile)
            if strict_ai:
                note["validation_errors"] = ["ai_unavailable"]
                note["frontmatter"]["fallback_reason"] = "ai_unavailable"
                raise SourceAIGenerationError("AI generator not available in strict mode")
            return note
        try:
            prompt = self.build_ai_prompt(job, node, profile)
            content = self._trim_ai_preamble(ai_generator(prompt))
            valid, errors = self.validate_content(content, node, profile)
            if not valid:
                content = self._trim_ai_preamble(ai_generator(self.build_ai_repair_prompt(prompt, content, errors)))
            return self.repair_or_replace_content(content, job, node, profile, strict_ai=strict_ai)
        except Exception as exc:
            if strict_ai:
                if isinstance(exc, SourceAIGenerationError):
                    raise
                raise SourceAIGenerationError(f"AI note generation failed: {exc}") from exc
            note = self.compile_fallback_note(job, node, profile)
            note["validation_errors"] = [f"ai_failure:{type(exc).__name__}"]
            note["frontmatter"]["fallback_reason"] = "ai_failure"
            return note

    def _coerce_structured_ai_note(self, payload_str: str, node: Dict[str, Any]) -> str:
        try:
            data = json.loads(payload_str)
        except Exception:
            return payload_str
        if not isinstance(data, dict):
            return payload_str
        mental_model = data.get("mental_model", "")
        how_it_works = data.get("how_it_works", "")
        sections = data.get("sections")
        if isinstance(sections, list) and len(sections) >= 3:
            h1 = sections[0].get("title", "How it Works")
            p1 = sections[0].get("content", "")
            h2 = sections[1].get("title", "Core Mechanism")
            p2 = sections[1].get("content", "")
            h3 = sections[2].get("title", "Practical Impact")
            p3 = sections[2].get("content", "")
        else:
            h1, h2, h3 = "How the Economics Actually Work", "Core Mechanism", "Practical Impact"
            p1, p2, p3 = how_it_works, "Secondary concept details.", "Tertiary concept details."
        lines = [
            "## Mental Model\n",
            f"{mental_model}\n",
            f"## {h1}\n",
            f"{p1}\n",
            f"## {h2}\n",
            f"{p2}\n",
            f"## {h3}\n",
            f"{p3}\n",
            "## The Proving Grounds\n",
            "```interactive-quiz",
            json.dumps(data.get("quiz", []), indent=2),
            "```"
        ]
        return "\n".join(lines)

    def _trim_ai_preamble(self, content: str) -> str:
        text = str(content or "").strip()
        match = re.search(r"(?im)^##\s+(Mental Model|How the Economics Actually Work|The Proving Grounds)\s*$", text)
        if match:
            return text[match.start():].strip()
        return text

    def _source_sentences(self, node: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        candidates: List[Dict[str, Any]] = []
        seen = set()
        title = str(node.get("title", ""))
        for excerpt in node.get("source_excerpts", []) or []:
            page = int(excerpt.get("page") or (node.get("source_pages") or [1])[0])
            text = self._normalize_source_excerpt(str(excerpt.get("text", "")))
            for raw in re.split(r"(?<=[.!?])\s+|[•●\uf0a7\uf0b7\uf0a8]+|\s+-\s+", text):
                sentence = self._clean_fact(raw, title)
                if self._reject_source_fact(sentence):
                    continue
                key = sentence.lower()
                if key in seen:
                    continue
                seen.add(key)
                candidates.append({"page": page, "text": sentence, "score": self._source_fact_score(sentence, title)})
        candidates.sort(key=lambda item: (-float(item.get("score", 0)), int(item.get("page", 0))))
        return [{"page": item["page"], "text": item["text"]} for item in candidates[:limit]]

    def _normalize_source_excerpt(self, text: str) -> str:
        text = str(text or "")
        text = text.replace("\uf0a7", ". ").replace("\uf0b7", ". ").replace("\uf0a8", ". ")
        text = text.replace("", ". ").replace("•", ". ").replace("●", ". ")
        text = text.replace("GivenThree", "Given three")
        text = text.replace("Bergur", "Burger")
        text = text.replace("you preference", "your preference")
        # Slide exports often encode lists as ": 1. First 2. Second"; remove list counters
        # while keeping the item text and normal sentence boundaries.
        text = re.sub(r":\s*1\.\s*([^.;:]+?)\s+2\.\s*([^.;:]+?)(?=\.|$)", r": \1 and \2", text)
        text = re.sub(r"\b(The\s+[A-Za-z]+ist\s+school)\s*\.\s+(was|is|uses|measures|compares)\b", r"\1 \2", text)
        text = re.sub(r"\b(The\s+[A-Za-z]+\s+school)\s*\.\s+(was|is|uses|measures|compares)\b", r"\1 \2", text)
        text = re.sub(r"(?<=:)\s*\d+\.\s*", " ", text)
        text = re.sub(r"\s+\d+\.\s*", ". ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def _title_terms(self, title: str) -> List[str]:
        stop = {
            "and", "or", "of", "the", "a", "an", "to", "for", "in", "on", "with", "by",
            "is", "are", "case", "concept", "approach", "approaches", "theory",
        }
        return [term for term in re.findall(r"[A-Za-z]{3,}", str(title).lower()) if term not in stop]

    def _reject_source_fact(self, sentence: str) -> bool:
        if len(sentence) < 18:
            return True
        lowered = sentence.lower().strip()
        if (
            "chapter objectives" in lowered
            or "after successful completion" in lowered
            or lowered.startswith(("our goal ", "the goal ", "this chapter is to "))
            or lowered.startswith(("explain ", "differentiate ", "define ", "derive ", "describe ", "discuss "))
            or lowered.startswith(("rank them ", "which bundle ", "which bundles ", "which of "))
        ):
            return True
        if sentence.endswith("?") and len(sentence.split()) < 12:
            return True
        if re.fullmatch(r"[\d\s.:-]+", sentence):
            return True
        if re.fullmatch(r"[A-Z][A-Za-z /&()-]{2,40}", sentence) and len(sentence.split()) <= 5:
            return True
        if re.search(r":\s*\d+\.?$", sentence):
            return True
        if re.search(r"\b\d+\.\s*$", sentence):
            return True
        return False

    def _source_fact_score(self, sentence: str, title: str) -> float:
        lowered = sentence.lower()
        title_lower = str(title or "").lower()
        terms = self._title_terms(title)
        score = 0.0
        for term in terms:
            if term in lowered:
                score += 3.0
        if re.search(r"\b(is|are|means|refers to|shows|represents|contains|include|includes|measures|ranks)\b", lowered):
            score += 2.5
        if re.search(r"[A-Za-z]\w*\s*[+*/=-]\s*[A-Za-z0-9]", sentence):
            score += 3.0
        if any(token in lowered for token in ["equation", "slope", "price", "income", "utility", "preference", "affordable", "constraint", "rank"]):
            score += 1.5
        word_count = len(sentence.split())
        if 8 <= word_count <= 35:
            score += 1.0
        elif word_count > 55:
            score -= 1.0
        if self._looks_like_slide_heading(sentence):
            score -= 6.0
        score += self._title_intent_adjustment(lowered, title_lower)
        score += self._opposing_term_adjustment(lowered, title_lower)
        return score

    def _looks_like_slide_heading(self, sentence: str) -> bool:
        stripped = sentence.strip()
        words = stripped.split()
        lowered = stripped.lower()
        if len(words) <= 7 and ":" in stripped and not re.search(r"\b(is|are|means|refers to|shows|contains|include|includes|measures|ranks|equals)\b", lowered):
            return True
        if len(words) <= 5 and re.fullmatch(r"[A-Z][A-Za-z /&():-]+", stripped):
            return True
        if lowered.startswith(("approaches of ", "chapter ", "limitations", "basic concepts")) and len(words) <= 8:
            return True
        return False

    def _title_intent_adjustment(self, lowered_sentence: str, lowered_title: str) -> float:
        adjustment = 0.0
        if "preference" in lowered_title:
            if any(token in lowered_sentence for token in ["choose", "choice", "choices", "prefer", "preference"]):
                adjustment += 5.0
            if any(token in lowered_sentence for token in ["compare", "comparing", "rank", "ranking", "order of preference"]):
                adjustment += 5.0
            if "bundle" in lowered_sentence:
                adjustment += 1.0
        if "utility" in lowered_title:
            if any(token in lowered_sentence for token in ["satisfaction", "usefulness", "utility", "utils", "rank", "ranking", "measure", "measured"]):
                adjustment += 2.0
        if "budget" in lowered_title:
            if any(token in lowered_sentence for token in ["affordable", "unaffordable", "income", "price", "prices", "cost", "equation", "slope"]):
                adjustment += 4.0
        if "equilibrium" in lowered_title:
            if any(token in lowered_sentence for token in ["equilibrium", "maximize", "maximum", "equal", "condition", "optimal"]):
                adjustment += 4.0
        return adjustment

    def _opposing_term_adjustment(self, lowered_sentence: str, lowered_title: str) -> float:
        opposing_pairs = [
            {
                "left": "ordinal",
                "right": "cardinal",
                "left_signals": ["ordinalist", "ranking", "rank", "order of preference", "preference order"],
                "right_signals": ["cardinalist", "cardinal number", "utils", "quantitative terms", "numerically"],
            },
            {
                "left": "variable",
                "right": "fixed",
                "left_signals": ["variable input", "changes", "altered"],
                "right_signals": ["fixed input", "cannot readily be changed", "does not change"],
            },
        ]
        adjustment = 0.0
        for pair in opposing_pairs:
            left = pair["left"]
            right = pair["right"]
            if left in lowered_title and right not in lowered_title:
                has_left = left in lowered_sentence or any(signal in lowered_sentence for signal in pair["left_signals"])
                has_right = right in lowered_sentence or any(signal in lowered_sentence for signal in pair["right_signals"])
                if any(signal in lowered_sentence for signal in pair["left_signals"]):
                    adjustment += 6.0
                elif has_left:
                    adjustment += 2.0
                else:
                    adjustment -= 3.0
                if has_right and not has_left:
                    adjustment -= 8.0
                elif has_right and has_left and not any(signal in lowered_sentence for signal in pair["left_signals"]):
                    adjustment -= 5.0
            if right in lowered_title and left not in lowered_title:
                has_right = right in lowered_sentence or any(signal in lowered_sentence for signal in pair["right_signals"])
                has_left = left in lowered_sentence or any(signal in lowered_sentence for signal in pair["left_signals"])
                if any(signal in lowered_sentence for signal in pair["right_signals"]):
                    adjustment += 6.0
                elif has_right:
                    adjustment += 2.0
                else:
                    adjustment -= 3.0
                if has_left and not has_right:
                    adjustment -= 8.0
                elif has_left and has_right and not any(signal in lowered_sentence for signal in pair["right_signals"]):
                    adjustment -= 5.0
        return adjustment

    def _clean_fact(self, sentence: str, title: str) -> str:
        fact = str(sentence or "")
        fact = fact.replace("\uf0a7", " ").replace("\uf0b7", " ").replace("\uf0a8", " ")
        fact = fact.replace("", " ").replace("•", " ").replace("●", " ")
        fact = fact.replace("GivenThree", "Given three")
        fact = fact.replace("Bergur", "Burger")
        fact = fact.replace("you preference", "your preference")
        fact = fact.replace("Consumers makes choices", "Consumers make choices")
        fact = fact.replace("consumers makes choices", "consumers make choices")
        fact = fact.replace("comparing bundle of goods", "comparing bundles of goods")
        fact = re.sub(r":\s*1\.\s*([^.;:]+?)\s+2\.\s*([^.;:]+?)(?=\.|$)", r": \1 and \2", fact)
        fact = re.sub(r"(?<=:)\s*\d+\.\s*", " ", fact)
        fact = re.sub(r"\s+\d+\.\s*", ". ", fact)
        fact = re.sub(r"\s+", " ", fact).strip(" .")
        title_pattern = re.escape(str(title or "").strip())
        if title_pattern:
            fact = re.sub(rf"^{title_pattern}\s*[:.\-–]?\s*", "", fact, flags=re.IGNORECASE).strip(" .")
        if len(fact) > 180:
            fact = fact[:177].rsplit(" ", 1)[0] + "..."
        return fact

    def _build_fallback_quiz(self, title: str, facts: List[Dict[str, Any]], source_pages: List[int]) -> List[Dict[str, Any]]:
        primary = facts[0] if facts else {"text": f"{title} is defined by the cited source pages.", "page": source_pages[0] if source_pages else 1}
        primary_text = self._clean_fact(primary["text"], title)
        page = int(primary.get("page") or (source_pages[0] if source_pages else 1))
        second = facts[1]["text"] if len(facts) > 1 else f"{title} is unrelated to the source's consumer-choice model."
        title_keywords = [word.lower() for word in re.findall(r"[A-Za-z]{4,}", title)[:3]] or ["source"]
        distractors = self._concept_distractors(title, primary_text, [self._clean_fact(f.get("text", ""), title) for f in facts])
        application_case = self._application_case(title)
        quiz = [
            {
                "type": "mcq",
                "question": f"Which statement best preserves the mechanism of {title}?",
                "options": {
                    "A": primary_text,
                    "B": distractors[0],
                    "C": distractors[1],
                    "D": distractors[2],
                },
                "answer": "A",
                "explanation": f"The correct option keeps the source relationship intact for {title}; the distractors confuse it with a nearby but different idea.",
                "explanation_page": page,
            },
            {
                "type": "scenario",
                "question": f"In this new case, apply {title} without confusing it with a neighboring concept: {application_case}",
                "answer": self._scenario_answer(title, primary_text),
                "required_keywords": title_keywords,
                "explanation": f"This checks whether the learner can transfer {title} beyond copied wording while preserving the source relationship.",
                "explanation_page": int(facts[1].get("page", page)) if len(facts) > 1 else page,
            },
            {
                "type": "writing",
                "question": f"Explain {title} in one precise paragraph. Include the object being studied, the relationship being tested, and the common mistake to avoid.",
                "answer": f"A strong answer defines {title}, states the source-specific rule or relationship, and separates it from nearby concepts that look similar but do different work.",
                "required_keywords": title_keywords,
                "explanation": f"This checks whether the learner can use the source facts for {title}, not just recognize the term.",
                "explanation_page": page,
            },
        ]
        return [
            enrich_question_v2(
                question,
                q_type=question.get("type"),
                concept=title,
                note_title=title,
                source_pages=source_pages,
            )
            for question in quiz
        ]

    def _concept_distractors(self, title: str, primary_text: str, fact_texts: List[str]) -> List[str]:
        haystack = f"{title} {primary_text} {' '.join(fact_texts)}".lower()
        if "preference" in haystack or "bundle" in haystack:
            return [
                "It means the consumer can only rank bundles after prices and income determine what is affordable.",
                "It measures the exact number of happiness units produced by each bundle.",
                "It describes the final purchased bundle rather than the ranking of possible bundles.",
            ]
        if "budget" in haystack or "income" in haystack or "price" in haystack:
            return [
                "It ranks what the consumer wants most before prices are considered.",
                "It measures psychological satisfaction from consuming one extra unit.",
                "It says every desirable bundle can be purchased if the consumer prefers it strongly enough.",
            ]
        if "marginal" in haystack:
            return [
                "It is the total amount accumulated after all units are consumed.",
                "It is the consumer's ranking of two complete bundles before consumption happens.",
                "It is the money limit that decides which bundles are affordable.",
            ]
        if "utility" in haystack:
            return [
                "It is the market price paid for a good rather than satisfaction from consuming it.",
                "It is the income boundary that separates affordable from unaffordable bundles.",
                "It is the historical reason the good exists, not the consumer's valuation of it.",
            ]
        if any(token in haystack for token in ["code", "algorithm", "function", "data", "query"]):
            return [
                "It describes the user interface label but not the logic or data transformation.",
                "It assumes the implementation has no edge cases, inputs, or failure states.",
                "It treats output formatting as the same thing as the algorithm's mechanism.",
            ]
        if any(token in haystack for token in ["law", "case", "liability", "contract"]):
            return [
                "It states the policy preference but skips the legal elements that must be proven.",
                "It treats the remedy as automatic without checking the rule's conditions.",
                "It replaces the governing rule with a moral intuition about fairness.",
            ]
        return [
            "It swaps the concept's mechanism with a related label that appears nearby in the source.",
            "It gives an example but does not preserve the rule or relationship being tested.",
            "It treats a consequence of the concept as if it were the definition of the concept.",
        ]

    def _application_case(self, title: str) -> str:
        lowered = title.lower()
        if "preference" in lowered:
            return "A student likes Bundle A more than Bundle B, but Bundle A is too expensive this week. Explain what remains true about the student's preference."
        if "budget" in lowered:
            return "A buyer wants the most attractive bundle, but income and prices rule out some options. Explain what the budget line is doing."
        if "marginal" in lowered:
            return "A consumer gets a different amount of added satisfaction from the next unit than from all previous units combined. Explain which quantity is marginal."
        if "utility" in lowered:
            return "Two goods cost the same, but one gives the consumer more satisfaction. Explain what utility is tracking."
        return f"A learner sees {title} used in a new example. Explain what must stay true for the application to be valid."

    def _scenario_answer(self, title: str, primary_text: str) -> str:
        lowered = title.lower()
        if "preference" in lowered:
            return "The student can still prefer Bundle A; affordability affects choice, not the underlying ranking of desirability."
        if "budget" in lowered:
            return "The budget line separates affordable from unaffordable bundles using income and prices; it does not decide desire by itself."
        if "marginal" in lowered:
            return "The marginal quantity is the extra change from one additional unit, not the accumulated total."
        if "utility" in lowered:
            return "Utility tracks satisfaction or usefulness to the consumer, not the market price alone."
        return f"The answer must preserve this source-grounded relationship: {primary_text}"

    def _econ_concept_kind(self, title: str, facts: List[str]) -> str:
        lowered_title = str(title or "").lower()
        lowered_all = f"{lowered_title} {' '.join(facts)}".lower()
        if "budget" in lowered_title or "budget line" in lowered_title:
            return "budget"
        if "equilibrium" in lowered_title or "optimal choice" in lowered_title:
            return "equilibrium"
        if "indifference" in lowered_title:
            return "indifference"
        if "marginal rate of substitution" in lowered_title or lowered_title.endswith("mrs"):
            return "mrs"
        if "diminishing marginal utility" in lowered_title or "law of diminishing" in lowered_title:
            return "ldmu"
        if "total and marginal" in lowered_title or lowered_title in {"total utility", "marginal utility"}:
            return "total_marginal_utility"
        if "cardinal" in lowered_title and "ordinal" in lowered_title:
            return "cardinal_vs_ordinal"
        if "cardinal" in lowered_title:
            return "cardinal_utility"
        if "ordinal" in lowered_title:
            return "ordinal_utility"
        if "utility" in lowered_title:
            return "utility"
        if "axiom" in lowered_title or "assumption" in lowered_title and "preference" in lowered_title:
            return "preference_axioms"
        if "preference" in lowered_title:
            return "preferences"
        if any(token in lowered_all for token in ["budget", "income", "price", "affordable"]):
            return "budget"
        if any(token in lowered_all for token in ["utility", "satisfaction", "utils", "marginal"]):
            return "utility"
        return "general"

    def _concept_task(self, title: str, facts: List[str]) -> str:
        kind = self._econ_concept_kind(title, facts)
        if kind == "budget":
            return "separating affordable choices from choices ruled out by income and prices"
        if kind == "equilibrium":
            return "identifying the condition where the consumer has no better affordable choice"
        if kind in {"preferences", "preference_axioms", "ordinal_utility", "indifference"}:
            return "tracking how the consumer compares and ranks bundles before making a choice"
        if kind == "mrs":
            return "measuring how much of one good the consumer gives up to gain more of another while staying equally satisfied"
        if kind == "ldmu":
            return "showing that each additional unit can add less extra satisfaction than the previous unit"
        if kind == "total_marginal_utility":
            return "separating accumulated satisfaction from the extra satisfaction added by one more unit"
        if kind in {"utility", "cardinal_utility", "cardinal_vs_ordinal"}:
            return "connecting satisfaction from consumption to the rule or comparison used in the model"
        return "preserving the source's exact relationship between the concept, its conditions, and its consequence"

    def _formal_anchor(self, facts: List[str], fallback: str) -> str:
        equation = next(
            (
                text
                for text in facts
                if re.search(r"[A-Za-z]\w*\s*[+*/=-]\s*[A-Za-z0-9]", text)
                or ("=" in text and any(operator in text for operator in ["+", "-", "−", "*", "/"]))
            ),
            None,
        )
        if equation:
            return equation
        formal_tokens = ["equation", "slope", "ratio", "marginal", "rank", "measure", "condition", "equals", "maximum"]
        formal = next(
            (
                text
                for text in facts
                if not self._looks_like_slide_heading(text)
                and any(token in text.lower() for token in formal_tokens)
            ),
            None,
        )
        if formal:
            return formal
        return next((text for text in facts if not self._looks_like_slide_heading(text)), fallback)

    def _build_fallback_content(self, title: str, facts: List[Dict[str, Any]], quiz: List[Dict[str, Any]], node: Dict[str, Any], profile: Dict[str, Any]) -> str:
        fact_texts = [self._clean_fact(fact["text"], title) for fact in facts]
        fact_texts = [fact for fact in fact_texts if fact and not fact.lower().startswith("the source introduces")]
        first = fact_texts[0] if fact_texts else self._thin_source_anchor(title, node)
        second = fact_texts[1] if len(fact_texts) > 1 else first
        third = fact_texts[2] if len(fact_texts) > 2 else second
        concept_task = self._concept_task(title, fact_texts)
        formal = self._formal_anchor(fact_texts, third)
        headings = self._dynamic_teaching_headings(node, profile)
        artifact = self._fallback_artifact(title, fact_texts, formal)
        quiz_block = "```interactive-quiz\n" + json.dumps(quiz, indent=2) + "\n```"
        return (
            "## Mental Model\n\n"
            f"{self._mental_model(title, node, fact_texts)}\n\n"
            f"## {headings[0]}\n\n"
            f"{self._intuition_section(title, first, node)}\n\n"
            f"## {headings[1]}\n\n"
            f"{self._mechanism_section(title, concept_task, second, node, fact_texts)}\n\n"
            f"{artifact}\n\n"
            f"## {headings[2]}\n\n"
            f"{self._formal_section(title, formal, node)}\n\n"
            "---\n\n"
            "## The Proving Grounds\n\n"
            f"{quiz_block}"
        )

    def _thin_source_anchor(self, title: str, node: Dict[str, Any]) -> str:
        excerpts = " ".join(str(ex.get("text", "")) for ex in node.get("source_excerpts", []) or [])
        cleaned = self._normalize_source_excerpt(excerpts)
        sentences = []
        for raw in re.split(r"(?<=[.!?])\s+|[•●\uf0a7\uf0b7\uf0a8]+", cleaned):
            fact = self._clean_fact(raw, title)
            if fact and not self._reject_source_fact(fact):
                sentences.append(fact)
        if sentences:
            return sentences[0]
        return f"{title} is the chapter concept being isolated from the available source pages; use the surrounding roadmap concepts to give it precise meaning."

    def _mental_model(self, title: str, node: Dict[str, Any], facts: List[str]) -> str:
        domain = str(node.get("domain") or "").upper()
        lowered = f"{title} {' '.join(facts)}".lower()
        if domain.startswith("ECON") or any(t in lowered for t in ["consumer", "utility", "budget", "preference"]):
            kind = self._econ_concept_kind(title, facts)
            if kind in {"preferences", "preference_axioms"}:
                return f"Imagine a person sorting complete baskets of goods from most wanted to least wanted before checking the price tags. {title} is that sorting rule. It does not ask what the person can afford yet; it asks how the person ranks whole bundles when comparing them."
            if kind == "budget":
                return f"Imagine drawing a fence around every bundle a person can actually buy with their income. {title} is that affordability fence. Preferences say what the consumer wants, but this concept says which wanted bundles are possible."
            if kind == "cardinal_utility":
                return f"Imagine putting a rough satisfaction score on each bite, glass, or bundle. {title} treats satisfaction as something you can measure in units, so the learner can compare how much utility is gained and how much extra utility the next unit adds."
            if kind == "ordinal_utility":
                return f"Imagine a consumer making a ranked list without needing exact happiness numbers. {title} says the order matters more than the size of the score: first choice, second choice, tied choices, and worse choices."
            if kind == "cardinal_vs_ordinal":
                return f"Imagine two ways to describe taste. One gives satisfaction scores; the other only ranks options. {title} is the fork between measuring utility with numbers and comparing utility by order of preference."
            if kind == "ldmu":
                return f"Imagine eating slices of pizza when you are hungry. The first slice helps a lot, the second still helps, and later slices may add less. {title} is the pattern where the extra satisfaction from each added unit tends to fall."
            if kind == "total_marginal_utility":
                return f"Imagine keeping two counters while consuming a good. One counter tracks total satisfaction so far; the other tracks only what the newest unit added. {title} is the discipline of not mixing those counters."
            if kind == "indifference":
                return f"Imagine drawing a line through bundles the consumer would accept equally. {title} groups different combinations that feel just as good to the consumer, even though the mix of goods changes."
            if kind == "mrs":
                return f"Imagine trading some soda for more pizza while trying to stay just as happy. {title} measures the trade the consumer is willing to make between two goods without changing total satisfaction."
            if kind == "equilibrium":
                return f"Imagine the consumer searching inside the affordability fence for the best reachable basket. {title} is the stopping point where the preferred affordable bundle has been found."
            return f"Imagine the consumer as a decision-maker comparing options, satisfaction, and limits. {title} is one piece of that decision machine. The goal is to know what the concept measures, what it compares, and what mistake it prevents."
        if domain.startswith("CS"):
            return f"Imagine a machine that receives inputs, transforms them through rules, and produces an output. {title} is best learned by naming the input, the transformation, the output, and the failure case."
        if domain.startswith("MATH"):
            return f"Imagine the concept as a rule that turns loose intuition into a precise statement. {title} starts with a pattern you can picture, then becomes a formal condition you can test."
        if domain.startswith("MED"):
            return f"Imagine the body as a chain of connected systems. {title} names one link in that chain: what enters, what changes, what exits, and what can fail."
        return f"Imagine {title} as a small engine inside the source material. To master it, identify what goes in, what rule acts on it, what comes out, and which nearby idea it is often confused with."

    def _intuition_section(self, title: str, first: str, node: Dict[str, Any]) -> str:
        domain = str(node.get("domain") or "").upper()
        if domain.startswith("ECON"):
            kind = self._econ_concept_kind(title, [first])
            if kind == "cardinal_utility":
                return f"Start with satisfaction as a measurable idea. The source anchor is: {first}. In the cardinal approach, utility is treated as countable enough to support marginal utility analysis, so the learner should ask how much satisfaction is gained and how that amount changes."
            if kind == "ordinal_utility":
                return f"Start with ranking, not measuring. The source anchor is: {first}. Ordinal utility cares whether one bundle is preferred to another, not how many exact units of happiness separate them."
            if kind == "ldmu":
                return f"Start with the next unit, not the whole pile. The source anchor is: {first}. The law is about the added satisfaction from one more unit and whether that added satisfaction declines as consumption increases."
            if kind == "budget":
                return f"Start with affordability. The source anchor is: {first}. A budget concept does not say what the consumer likes most; it says which bundles prices and income allow."
            if kind == "equilibrium":
                return f"Start with the best reachable choice. The source anchor is: {first}. Equilibrium joins preference and constraint: the consumer wants the best bundle, but only among affordable options."
            return f"Start with the economic object being studied, then ask what relationship the concept adds. Here, the usable source fact is: {first}. Read that as a rule about decisions, not as decoration. If the concept is about preferences, it ranks desirability. If it is about budgets, it limits affordability. If it is about utility, it describes satisfaction."
        if domain.startswith("CS"):
            return f"Start by separating the name of the system from the behavior it performs. The usable source fact is: {first}. A good explanation should say what data enters, what operation happens, and what output or state change proves the operation worked."
        if domain.startswith("MATH"):
            return f"Start with the plain-language pattern before the notation. The usable source fact is: {first}. The formal expression is only useful after you know what each symbol is trying to preserve."
        return f"Start with the source's strongest usable fact: {first}. Treat it as the anchor for the concept, then explain how the concept changes, constrains, classifies, or predicts something."

    def _mechanism_section(self, title: str, concept_task: str, second: str, node: Dict[str, Any], facts: List[str]) -> str:
        domain = str(node.get("domain") or "").upper()
        source_clues = self._source_clues(facts)
        if domain.startswith("ECON"):
            kind = self._econ_concept_kind(title, facts)
            if kind in {"cardinal_utility", "utility", "ldmu", "total_marginal_utility"}:
                return f"The mechanism is {concept_task}. {second}. The clean source clues are: {source_clues}. Use it by separating total satisfaction, added satisfaction, and price. The common failure is to treat utility as the same thing as money, even though utility is about satisfaction from consumption."
            if kind in {"budget", "equilibrium"}:
                return f"The mechanism is {concept_task}. {second}. The clean source clues are: {source_clues}. Use it by separating desire from feasibility: preferences rank bundles, the budget filters bundles, and equilibrium selects the best affordable bundle."
            if kind in {"ordinal_utility", "indifference", "mrs", "cardinal_vs_ordinal"}:
                return f"The mechanism is {concept_task}. {second}. The clean source clues are: {source_clues}. Use it by reading rankings, equal-satisfaction bundles, or tradeoffs as comparisons, not as exact happiness measurements unless the concept explicitly says cardinal."
            return f"The mechanism is {concept_task}. {second}. The clean source clues are: {source_clues}. To use the concept correctly, first name the economic objects, then name the relationship between them, then keep that relationship separate from later constraints such as income, prices, or equilibrium conditions."
        if domain.startswith("CS"):
            return f"The mechanism is {concept_task}. {second}. The clean source clues are: {source_clues}. Trace it like execution: input, rule, intermediate state, output, then edge case. If you cannot identify those five parts, you have only memorized the label."
        if domain.startswith("MATH"):
            return f"The mechanism is {concept_task}. {second}. The clean source clues are: {source_clues}. Move from example to abstraction carefully: define the objects, state the operation or condition, then test whether the rule still works at the boundary."
        return f"The mechanism is {concept_task}. {second}. The clean source clues are: {source_clues}. Use the concept by naming the condition, applying the rule, and checking the consequence without importing facts the source did not support."

    def _source_clues(self, facts: List[str]) -> str:
        clean = [fact for fact in facts if fact and not self._looks_like_slide_heading(fact)]
        if not clean:
            return "the source provides only a thin extractable anchor, so the note preserves the strongest available relationship"
        return "; ".join(clean[:3])

    def _formal_section(self, title: str, formal: str, node: Dict[str, Any]) -> str:
        lowered = title.lower()
        domain = str(node.get("domain") or "").upper()
        kind = self._econ_concept_kind(title, [formal])
        if domain.startswith("CS"):
            return (
                f"The formal anchor is: {formal}. In a programming concept, preserve the exact syntax only when it explains the rule. "
                "Then translate the syntax into input, operation, output, and failure case so the learner can trace it without memorizing the slide."
            )
        if "preference" in lowered:
            return (
                f"The formal anchor is: {formal}. In consumer theory, write bundle comparisons as compact sentences. "
                "`X > Y` or `X ≻ Y` means X is strictly preferred to Y. `X ~ Y` means the consumer is indifferent between them. "
                "`X >= Y` or `X ⪰ Y` means X is at least as good as Y. The symbols are not arithmetic; they encode a ranking of complete bundles."
            )
        if kind == "budget":
            return (
                f"The formal anchor is: {formal}. A budget relationship usually connects income, prices, and quantities. "
                "The key test is whether a bundle is affordable, not whether it is desirable."
            )
        if kind in {"ldmu", "total_marginal_utility", "mrs"}:
            return f"The formal anchor is: {formal}. Marginal means extra change from one more unit, so practice should distinguish total accumulated amount from the additional amount."
        if kind == "cardinal_utility":
            return f"The formal anchor is: {formal}. Cardinal analysis treats utility as measurable enough to compare amounts, then uses marginal utility to reason about the added satisfaction from extra consumption."
        if kind == "ordinal_utility":
            return f"The formal anchor is: {formal}. Ordinal analysis preserves order of preference, so the formal move is ranking bundles rather than assigning exact utility units."
        if kind == "equilibrium":
            return f"The formal anchor is: {formal}. Equilibrium should be read as a condition: the chosen bundle must be affordable and no other affordable bundle should be preferred."
        return f"The formal anchor is: {formal}. If this is an equation, condition, ranking, schema, rule, or named relationship, preserve its structure exactly before paraphrasing it."

    def _fallback_artifact(self, title: str, facts: List[str], formal: str) -> str:
        lowered = f"{title} {' '.join(facts)} {formal}".lower()
        kind = self._econ_concept_kind(title, facts + [formal])
        if re.search(r"\b(public|private|protected|class|interface|extends|implements|void|new|return|System\.out\.println)\b", formal):
            return f"```java\n{formal}\n```"
        if re.search(r"\b(function|const|let|var|document\.|querySelector|addEventListener)\b|[.#][A-Za-z][\\w-]*\\s*\\{", formal):
            return f"```javascript\n{formal}\n```"
        if any(token in lowered for token in ["css", "style sheet", "selector", "html", "attribute selector"]):
            return (
                "| Web Layer | What It Controls | Mistake To Avoid |\n"
                "|---|---|---|\n"
                "| HTML | Document structure and meaning | Do not use structure tags only for visual styling. |\n"
                "| CSS | Presentation, layout, and cascade | Do not confuse source order, specificity, and inheritance. |\n"
                "| Browser/user styles | Defaults before author CSS overrides them | Do not assume every visible style came from your stylesheet. |"
            )
        if kind in {"preferences", "preference_axioms", "ordinal_utility", "indifference"}:
            return (
                "| Symbol | Read It As | What It Tests |\n"
                "|---|---|---|\n"
                "| `X ≻ Y` | X is strictly preferred to Y | One bundle is ranked higher. |\n"
                "| `X ~ Y` | X and Y are equally desirable | The consumer is indifferent. |\n"
                "| `X ⪰ Y` | X is at least as good as Y | Weak preference includes strict preference or indifference. |"
            )
        if kind == "budget":
            return (
                "```mermaid\n"
                "flowchart LR\n"
                "  Income[Income] --> Constraint[Budget Constraint]\n"
                "  Prices[Prices] --> Constraint\n"
                "  Constraint --> Affordable[Affordable Bundles]\n"
                "  Constraint --> Unaffordable[Unaffordable Bundles]\n"
                "```"
            )
        if kind in {"cardinal_utility", "ldmu", "total_marginal_utility"}:
            return (
                "| Quantity | Plain Meaning | Mistake To Avoid |\n"
                "|---|---|---|\n"
                "| Total utility | Satisfaction accumulated from all consumed units | Do not call it the extra gain from one more unit. |\n"
                "| Marginal utility | Extra satisfaction from the next unit | Do not confuse it with total satisfaction. |\n"
                "| Diminishing marginal utility | Later units add less extra satisfaction | Do not claim total utility must always fall. |"
            )
        if kind == "cardinal_vs_ordinal":
            return (
                "| Approach | What It Preserves | Typical Test |\n"
                "|---|---|---|\n"
                "| Cardinal utility | Measurable satisfaction units | Compare how much utility changes. |\n"
                "| Ordinal utility | Ranking of bundles | Decide which bundle is preferred or indifferent. |\n"
                "| Common trap | Mixing scores with rankings | Do not demand exact numbers from an ordinal model. |"
            )
        if kind == "equilibrium":
            return (
                "```mermaid\n"
                "flowchart TD\n"
                "  Preferences[Preferences rank bundles] --> Candidate[Best-looking bundles]\n"
                "  Budget[Budget constraint filters affordability] --> Candidate\n"
                "  Candidate --> Equilibrium[Best affordable bundle]\n"
                "  Equilibrium --> Check[No preferred affordable alternative]\n"
                "```"
            )
        if re.search(r"[A-Za-z]\w*\s*[=+*/-]\s*[A-Za-z0-9]", formal):
            return f"$$\n{formal}\n$$"
        if any(token in lowered for token in ["process", "step", "pipeline", "pathway", "sequence"]):
            return (
                "```mermaid\n"
                "flowchart TD\n"
                "  A[Condition] --> B[Mechanism]\n"
                "  B --> C[Result]\n"
                "  C --> D[Limit or Failure Case]\n"
                "```"
            )
        return (
            "| Part | Question To Ask | Mastery Check |\n"
            "|---|---|---|\n"
            f"| Concept | What does {title} name? | Give the definition without swapping in a nearby concept. |\n"
            "| Mechanism | What relationship changes or gets tested? | Explain the rule in one new example. |\n"
            "| Failure | What mistake would break the idea? | Identify the tempting but wrong interpretation. |"
        )

    def _source_file_ref(self, job: Dict[str, Any]) -> str:
        return job.get("processed_source_path") or job.get("source_file_path") or job.get("file_name") or ""

    def compile_fallback_note(self, job: Dict[str, Any], node: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        source_pages = [int(p) for p in node.get("source_pages", [])]
        if not source_pages and "unresolved-source" not in node.get("warnings", []):
            raise ValueError("Source-grounded concept node requires source pages or an unresolved-source warning.")
        title = node.get("title", "Untitled Concept")
        note_title = lo.normalize_title(title)
        facts = self._source_sentences(node)
        quiz = self._build_fallback_quiz(title, facts, source_pages)
        body = self._build_fallback_content(title, facts, quiz, node, profile)
        frontmatter = {
            "title": note_title,
            "hub": f"[[{Path(_source_hub_rel_path(job)).stem}]]",
            "source": f"[[{job.get('file_name', '')}]]",
            "source_file": self._source_file_ref(job),
            "source_pages": source_pages,
            "source_job_id": job.get("job_id"),
            "domain": node.get("domain"),
            "concept_modality": node.get("modality"),
            "fallback_generation": True,
            "generated_by": "ater_source_job",
        }
        return {
            "note_title": note_title,
            "frontmatter": frontmatter,
            "content": body,
            "quiz": quiz,
            "valid": True,
            "fallback": True,
        }


class SourceConceptGraphService:
    """Reusable source graph seam around the old compiler's pure post-processing helpers."""

    def __init__(self, ater_service: Any = None):
        self.ater_service = ater_service

    def build_from_pages(self, topic: str, objectives: List[Dict[str, Any]], pages: List[Dict[str, Any]], domain: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        full_text = "\n\n".join(f"[PAGE {p.get('page_number')}]\n{p.get('content', '')}" for p in pages)
        nodes, edges, warnings = build_concept_graph(topic, objectives, pages, domain)
        if not self.ater_service:
            return nodes, edges, warnings
        try:
            from .keywords import reduce_concepts
            reduced = reduce_concepts([
                {
                    "title": node["title"],
                    "description": node["title"],
                    "source_context": " ".join(ex.get("text", "") for ex in node.get("source_excerpts", [])),
                    "source_pages": node.get("source_pages", []),
                    "prerequisites": [],
                    "concept_modality": node.get("modality"),
                    "mode": node.get("domain"),
                }
                for node in nodes
            ])
            by_title = {item.get("title"): item for item in reduced}
            for node in nodes:
                old_item = by_title.get(node["title"])
                if not old_item:
                    continue
                packet, anchors = self.ater_service._build_concept_source_packet(
                    full_text=full_text,
                    seed_context=old_item.get("source_context") or "",
                    title=node["title"],
                    source_pages=old_item.get("source_pages") or node.get("source_pages") or [],
                )
                if anchors:
                    node["source_pages"] = anchors
                    node["source_excerpts"] = [{"page": p, "text": packet[:800]} for p in anchors]
                node["prerequisites"] = old_item.get("prerequisites", [])
        except Exception as exc:
            warnings.append({
                "concept": topic,
                "dimension": "definition",
                "severity": "medium",
                "description": f"Old compiler graph seam degraded to deterministic fallback: {type(exc).__name__}",
            })
        return nodes, edges, warnings


class SourceLearningJobService:
    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self):
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _runtime_root(self) -> Path:
        parent = self.db_path.parent
        if parent.name.lower() == "inbox":
            return parent.parent
        return parent

    def _write_session_note(self, job: Dict[str, Any], note: Dict[str, Any]) -> str:
        rel_path = _source_session_note_rel_path(job, note["note_title"])
        note_path = self._runtime_root() / rel_path
        note_path.parent.mkdir(parents=True, exist_ok=True)
        yaml_lines = ["---"] + [f"{key}: {json.dumps(value)}" for key, value in note["frontmatter"].items()] + ["---", ""]
        note_path.write_text("\n".join(yaml_lines) + note["content"].strip() + "\n", encoding="utf-8")
        return rel_path

    def _write_session_hub(self, job: Dict[str, Any], curriculum: List[str]) -> str:
        rel_path = _source_session_hub_rel_path(job)
        hub_path = self._runtime_root() / rel_path
        hub_path.parent.mkdir(parents=True, exist_ok=True)
        title = Path(rel_path).stem
        links = "\n".join(f"- [[{Path(path).stem}]]" for path in curriculum)
        hub_path.write_text(
            "---\n"
            f"title: {json.dumps(title)}\n"
            "type: \"Learning Hub\"\n"
            "generated_by: \"ater_source_job\"\n"
            f"source_job_id: {json.dumps(job['job_id'])}\n"
            "---\n\n"
            f"# {title.replace('_', ' ')}\n\n"
            "## Curriculum Map\n"
            f"{links}\n",
            encoding="utf-8",
        )
        return rel_path

    def _init_schema(self):
        conn = self._connect()
        try:
            with conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS source_learning_jobs (
                        job_id TEXT PRIMARY KEY,
                        source_identity TEXT UNIQUE NOT NULL,
                        file_path TEXT NOT NULL,
                        file_name TEXT NOT NULL,
                        file_size INTEGER DEFAULT 0,
                        content_hash TEXT,
                        title TEXT,
                        topic TEXT,
                        domain TEXT,
                        source_type TEXT,
                        page_count INTEGER DEFAULT 0,
                        status TEXT DEFAULT 'audited',
                        conversation_id TEXT,
                        attachment_id TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        metadata TEXT DEFAULT '{}'
                    )
                """)
                conn.execute("CREATE TABLE IF NOT EXISTS source_pages (job_id TEXT, page_number INTEGER, content TEXT, text_length INTEGER, PRIMARY KEY(job_id, page_number))")
                conn.execute("CREATE TABLE IF NOT EXISTS source_audit_warnings (id TEXT PRIMARY KEY, job_id TEXT, concept TEXT, dimension TEXT, severity TEXT, description TEXT, resolved INTEGER DEFAULT 0)")
                conn.execute("CREATE TABLE IF NOT EXISTS source_map_sections (id TEXT PRIMARY KEY, job_id TEXT, title TEXT, source_file TEXT, pages TEXT, citations TEXT)")
                conn.execute("CREATE TABLE IF NOT EXISTS source_objectives (id TEXT PRIMARY KEY, job_id TEXT, objective_id TEXT, text TEXT, page_number INTEGER, required INTEGER DEFAULT 1, mapped INTEGER DEFAULT 0)")
                conn.execute("CREATE TABLE IF NOT EXISTS concept_graph_nodes (id TEXT PRIMARY KEY, job_id TEXT, title TEXT, domain TEXT, modality TEXT, source_pages TEXT, source_excerpts TEXT, objective_ids TEXT, teaching_order INTEGER, warnings TEXT DEFAULT '[]')")
                conn.execute("CREATE TABLE IF NOT EXISTS concept_graph_edges (id TEXT PRIMARY KEY, job_id TEXT, from_node_id TEXT, to_node_id TEXT, edge_type TEXT)")
                conn.execute("CREATE TABLE IF NOT EXISTS teaching_profiles (id TEXT PRIMARY KEY, job_id TEXT, concept_node_id TEXT, profile TEXT)")
                conn.execute("CREATE TABLE IF NOT EXISTS coverage_matrix_rows (id TEXT PRIMARY KEY, job_id TEXT, row_type TEXT, objective_id TEXT, concept_node_id TEXT, source_extracted INTEGER DEFAULT 0, objective_mapped INTEGER DEFAULT 0, note_compiled INTEGER DEFAULT 0, taught INTEGER DEFAULT 0, recall_passed INTEGER DEFAULT 0, transfer_passed INTEGER DEFAULT 0, remediation_required INTEGER DEFAULT 0, remediation_completed INTEGER DEFAULT 0, practice_scheduled INTEGER DEFAULT 0, vault_deployed INTEGER DEFAULT 0, mastery_state TEXT DEFAULT 'not_started', warnings TEXT DEFAULT '[]', updated_at TEXT)")
                conn.execute("CREATE TABLE IF NOT EXISTS source_job_errors (id TEXT PRIMARY KEY, job_id TEXT, stage TEXT, message TEXT, created_at TEXT)")
                conn.execute("CREATE TABLE IF NOT EXISTS source_job_tutor_links (job_id TEXT PRIMARY KEY, tutor_session_id TEXT, current_concept_node_id TEXT, current_note_path TEXT, updated_at TEXT)")
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS tutor_sessions (
                        session_id TEXT PRIMARY KEY,
                        hub_path TEXT,
                        current_note_path TEXT,
                        completed_notes TEXT DEFAULT '[]',
                        wagers TEXT DEFAULT '{}',
                        score INTEGER DEFAULT 0,
                        status TEXT DEFAULT 'active',
                        updated_at TEXT,
                        active_note_unlocks TEXT DEFAULT '[]',
                        consecutive_failures TEXT DEFAULT '{}',
                        active_question_overrides TEXT DEFAULT '{}',
                        generated_ahead_paths TEXT DEFAULT '[]',
                        transfer_gate_outcomes TEXT DEFAULT '{}',
                        offline_readiness TEXT DEFAULT '{}',
                        source_job_id TEXT,
                        current_concept_node_id TEXT
                    )
                """)
                for col_name in ["source_job_id", "current_concept_node_id"]:
                    try:
                        conn.execute(f"ALTER TABLE tutor_sessions ADD COLUMN {col_name} TEXT")
                    except sqlite3.OperationalError as e:
                        if "duplicate column name" not in str(e).lower():
                            raise
        finally:
            conn.close()

    def _source_identity(self, path: Path) -> Tuple[str, str, int]:
        stat = path.stat()
        hasher = hashlib.sha256()
        with open(path, "rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                hasher.update(chunk)
        digest = hasher.hexdigest()
        identity = hashlib.sha256(f"{path.resolve()}:{stat.st_size}:{digest}".encode("utf-8")).hexdigest()
        return identity, digest, stat.st_size

    def _metadata_for_new_job(self) -> Dict[str, Any]:
        return {
            "next_action": "start_learning",
            "pipeline_version": SOURCE_LEARNING_PIPELINE_VERSION,
            "pipeline_version_reason": "atomic roadmap quality, title filtering, broad-node splitting, and specific page ownership",
        }

    def _job_needs_rebuild(self, conn, job_id: str) -> bool:
        row = conn.execute("SELECT metadata FROM source_learning_jobs WHERE job_id = ?", (job_id,)).fetchone()
        try:
            metadata = json.loads(row["metadata"] or "{}") if row else {}
        except Exception:
            metadata = {}
        if metadata.get("pipeline_version") != SOURCE_LEARNING_PIPELINE_VERSION:
            return True
        return False

    def _delete_job_records(self, conn, job_id: str):
        for table in [
            "source_pages",
            "source_audit_warnings",
            "source_map_sections",
            "source_objectives",
            "concept_graph_nodes",
            "concept_graph_edges",
            "teaching_profiles",
            "coverage_matrix_rows",
            "source_job_errors",
            "source_job_tutor_links",
        ]:
            conn.execute(f"DELETE FROM {table} WHERE job_id = ?", (job_id,))
        conn.execute("DELETE FROM source_learning_jobs WHERE job_id = ?", (job_id,))

    def create_or_resume_from_path(
        self,
        file_path: str,
        conversation_id: Optional[str] = None,
        attachment_id: Optional[str] = None,
        learning_scope: Optional[str] = None,
        semester: Optional[str] = None,
        course: Optional[str] = None,
        unit: Optional[str] = None,
        external_domain: Optional[str] = None,
        parent_hub_path: Optional[str] = None,
        chapter_title: Optional[str] = None,
        roadmap_refiner: Optional[RoadmapRefiner] = None,
        strict_ai: bool = False,
    ) -> Dict[str, Any]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Source file not found: {file_path}")
        identity, digest, file_size = self._source_identity(path)
        now = datetime.now().isoformat()
        conn = self._connect()
        try:
            job_id = None
            existing = conn.execute("SELECT job_id FROM source_learning_jobs WHERE source_identity = ?", (identity,)).fetchone()
            if existing:
                existing_job_id = existing["job_id"]
                if self._job_needs_rebuild(conn, existing_job_id):
                    with conn:
                        self._delete_job_records(conn, existing_job_id)
                    job_id = None
                else:
                    with conn:
                        self._delete_job_records(conn, existing_job_id)
                    job_id = existing_job_id

            ingestion = SourceIngestionService().ingest_pdf(str(path))
            pages = ingestion["pages"]
            title = extract_title(pages, path.name)
            topic = infer_topic(pages, path.name)
            full_text = "\n".join(p.get("content", "") for p in pages)
            domain = domain_router.route(full_text, course=topic)
            placement = _build_placement(
                path,
                topic,
                domain,
                learning_scope=learning_scope,
                semester=semester,
                course=course,
                unit=unit,
                external_domain=external_domain,
                parent_hub_path=parent_hub_path,
                chapter_title=chapter_title,
            )
            objectives = extract_source_objectives(pages)
            if not job_id:
                job_id = f"srcjob_{uuid.uuid4().hex[:16]}"
            sections = build_source_map_sections(path.name, pages, id_prefix=job_id)
            warnings = [_as_dict_warning(w) for w in ingestion.get("warnings", [])]
            low_text_pages = [p["page_number"] for p in pages if 0 < p.get("text_length", 0) < 80]
            if low_text_pages:
                warnings.append({
                    "concept": path.name,
                    "dimension": "definition",
                    "severity": "medium",
                    "description": f"Page(s) {', '.join(map(str, low_text_pages[:12]))} have low extractable text; diagrams, graphs, or slide visuals may require review.",
                })
            nodes, _edges, drift_warnings = SourceConceptGraphService().build_from_pages(topic, objectives, pages, domain)
            nodes, edges, refine_warnings = _refine_concept_graph(
                topic,
                objectives,
                pages,
                domain,
                nodes,
                roadmap_refiner=roadmap_refiner,
                strict_ai=strict_ai,
            )
            nodes = finalize_source_roadmap_nodes(nodes, pages, topic, domain)
            edges = _edges_for_nodes(nodes)
            nodes, edges = scope_concept_graph_ids(job_id, nodes, edges)
            warnings.extend(drift_warnings)
            warnings.extend(refine_warnings)
            with conn:
                conn.execute("""
                    INSERT INTO source_learning_jobs (job_id, source_identity, file_path, file_name, file_size, content_hash, title, topic, domain, source_type, page_count, status, conversation_id, attachment_id, created_at, updated_at, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    job_id, identity, str(path), path.name, file_size, digest, title, topic, domain,
                    ingestion.get("source_type"), len(pages), "roadmap_ready", conversation_id, attachment_id,
                    now, now, json.dumps({**self._metadata_for_new_job(), "placement": placement}),
                ))
                for page in pages:
                    conn.execute("INSERT OR REPLACE INTO source_pages VALUES (?, ?, ?, ?)", (job_id, page["page_number"], page.get("content", ""), page.get("text_length", len(page.get("content", "")))))
                for warning in warnings:
                    conn.execute("INSERT INTO source_audit_warnings VALUES (?, ?, ?, ?, ?, ?, 0)", (f"warn_{uuid.uuid4().hex}", job_id, warning["concept"], warning["dimension"], warning["severity"], warning["description"]))
                for section in sections:
                    conn.execute("INSERT INTO source_map_sections VALUES (?, ?, ?, ?, ?, ?)", (section["id"], job_id, section["title"], section["source_file"], json.dumps(section["pages"]), json.dumps(section["citations"])))
                for obj in objectives:
                    mapped = any(obj["id"] in node.get("objective_ids", []) for node in nodes)
                    conn.execute("INSERT INTO source_objectives VALUES (?, ?, ?, ?, ?, ?, ?)", (f"{job_id}_{obj['id']}", job_id, obj["id"], obj["text"], obj["page_number"], 1, 1 if mapped else 0))
                    conn.execute("INSERT INTO coverage_matrix_rows (id, job_id, row_type, objective_id, source_extracted, objective_mapped, mastery_state, updated_at) VALUES (?, ?, 'objective', ?, 1, ?, 'not_started', ?)", (f"cov_{job_id}_{obj['id']}", job_id, obj["id"], 1 if mapped else 0, now))
                for node in nodes:
                    conn.execute("INSERT INTO concept_graph_nodes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (node["id"], job_id, node["title"], node["domain"], node["modality"], json.dumps(node["source_pages"]), json.dumps(node["source_excerpts"]), json.dumps(node["objective_ids"]), node["teaching_order"], json.dumps(node["warnings"])))
                    profile = build_teaching_profile(node["domain"], node["modality"], " ".join(ex.get("text", "") for ex in node.get("source_excerpts", [])))
                    conn.execute("INSERT INTO teaching_profiles VALUES (?, ?, ?, ?)", (f"profile_{job_id}_{node['id']}", job_id, node["id"], json.dumps(profile)))
                    conn.execute("INSERT INTO coverage_matrix_rows (id, job_id, row_type, concept_node_id, source_extracted, objective_mapped, mastery_state, updated_at) VALUES (?, ?, 'concept', ?, 1, ?, 'not_started', ?)", (f"cov_{job_id}_{node['id']}", job_id, node["id"], 1 if node.get("objective_ids") else 0, now))
                for edge in edges:
                    conn.execute("INSERT INTO concept_graph_edges VALUES (?, ?, ?, ?, ?)", (f"edge_{job_id}_{edge['from']}_{edge['to']}", job_id, edge["from"], edge["to"], edge["type"]))
            return self.get_job(job_id)
        finally:
            conn.close()

    def _rows(self, conn, query: str, args: Tuple[Any, ...] = ()) -> List[Dict[str, Any]]:
        return [dict(row) for row in conn.execute(query, args).fetchall()]

    def get_job(self, job_id: str) -> Dict[str, Any]:
        conn = self._connect()
        try:
            row = conn.execute("SELECT * FROM source_learning_jobs WHERE job_id = ?", (job_id,)).fetchone()
            if not row:
                raise ValueError(f"Source learning job not found: {job_id}")
            job = dict(row)
            try:
                job["metadata"] = json.loads(job.get("metadata") or "{}")
            except Exception:
                job["metadata"] = {}
            warnings = self._rows(conn, "SELECT concept, dimension, severity, description, resolved FROM source_audit_warnings WHERE job_id = ?", (job_id,))
            objectives = self._rows(conn, "SELECT objective_id, text, page_number, required, mapped FROM source_objectives WHERE job_id = ? ORDER BY page_number, objective_id", (job_id,))
            nodes = self._rows(conn, "SELECT * FROM concept_graph_nodes WHERE job_id = ? ORDER BY teaching_order", (job_id,))
            for node in nodes:
                node["source_pages"] = json.loads(node.get("source_pages") or "[]")
                node["source_excerpts"] = json.loads(node.get("source_excerpts") or "[]")
                node["objective_ids"] = json.loads(node.get("objective_ids") or "[]")
                profile_row = conn.execute("SELECT profile FROM teaching_profiles WHERE job_id = ? AND concept_node_id = ?", (job_id, node["id"])).fetchone()
                node["teaching_profile"] = json.loads(profile_row["profile"]) if profile_row else {}
            sections = self._rows(conn, "SELECT * FROM source_map_sections WHERE job_id = ?", (job_id,))
            for section in sections:
                section["pages"] = json.loads(section.get("pages") or "[]")
                section["citations"] = json.loads(section.get("citations") or "[]")
            coverage = self._rows(conn, "SELECT * FROM coverage_matrix_rows WHERE job_id = ? ORDER BY row_type, id", (job_id,))
            pages = self._rows(conn, "SELECT page_number, content, text_length FROM source_pages WHERE job_id = ? ORDER BY page_number", (job_id,))
            nested_chapters = build_nested_chapters(job, nodes)
            source_items = build_source_coverage_items(pages, objectives, nodes)
            tutor_link = conn.execute("SELECT * FROM source_job_tutor_links WHERE job_id = ?", (job_id,)).fetchone()
            high_warnings = [w for w in warnings if w["severity"] == "high" and not w["resolved"]]
            remaining = [
                obj["text"] for obj in objectives
                if not obj["mapped"]
            ] + [
                node["title"] for node in nodes
                if not any(c.get("concept_node_id") == node["id"] and c.get("mastery_state") == "mastered" for c in coverage)
            ]
            return {
                "job_id": job["job_id"],
                "status": job["status"],
                "next_action": "resolve_warnings" if high_warnings else "start_learning",
                "file_path": job["file_path"],
                "file_name": job["file_name"],
                "title": job["title"],
                "topic": job["topic"],
                "domain": job["domain"],
                "source_type": job["source_type"],
                "hub_path": _source_hub_rel_path(job),
                "chapter_path": _source_chapter_rel_path(job),
                "audit": {
                    "page_count": job["page_count"],
                    "title": job["title"],
                    "per_page_text_lengths": {r["page_number"]: r["text_length"] for r in self._rows(conn, "SELECT page_number, text_length FROM source_pages WHERE job_id = ? ORDER BY page_number", (job_id,))},
                    "warnings": warnings,
                    "blocks_completion": bool(high_warnings),
                },
                "source_map": {"topic": job["topic"], "objectives": objectives, "sections": sections},
                "roadmap": [{
                    "id": n["id"],
                    "title": n["title"],
                    "path": _source_note_rel_path(job, n["title"]),
                    "domain": n["domain"],
                    "modality": n["modality"],
                    "source_pages": n["source_pages"],
                    "status": "ready",
                } for n in nodes],
                "chapters": nested_chapters,
                "concept_graph": {"nodes": nodes, "edges": self._rows(conn, "SELECT from_node_id, to_node_id, edge_type FROM concept_graph_edges WHERE job_id = ?", (job_id,))},
                "coverage": {
                    "rows": coverage,
                    "source_items": source_items,
                    "covered_source_items": len([item for item in source_items if item.get("status") in {"covered", "merged", "ignored"}]),
                    "total_source_items": len(source_items),
                    "remaining": remaining,
                },
                "warnings": warnings,
                "placement": _placement_from_job(job),
                "current_tutor_link": dict(tutor_link) if tutor_link else None,
            }
        finally:
            conn.close()

    def update_roadmap_titles(self, job_id: str, titles: List[str]) -> Dict[str, Any]:
        cleaned_titles = [str(title or "").strip() for title in titles if str(title or "").strip()]
        if not cleaned_titles:
            raise ValueError("At least one roadmap title is required.")
        conn = self._connect()
        try:
            with conn:
                existing_nodes = conn.execute(
                    "SELECT * FROM concept_graph_nodes WHERE job_id = ? ORDER BY teaching_order",
                    (job_id,),
                ).fetchall()
                if not existing_nodes:
                    raise ValueError(f"Source learning job not found or has no roadmap: {job_id}")
                
                new_nodes = []
                # 1. Update existing and insert new
                for idx, title in enumerate(cleaned_titles):
                    if idx < len(existing_nodes):
                        node = existing_nodes[idx]
                        node_id = node["id"]
                        conn.execute(
                            "UPDATE concept_graph_nodes SET title = ?, teaching_order = ? WHERE id = ?",
                            (title, idx, node_id),
                        )
                        new_nodes.append(node_id)
                    else:
                        ref_node = existing_nodes[-1]
                        import uuid
                        new_node_id = f"node_{job_id}_{uuid.uuid4().hex[:8]}"
                        conn.execute(
                            "INSERT INTO concept_graph_nodes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            (
                                new_node_id,
                                job_id,
                                title,
                                ref_node["domain"],
                                ref_node["modality"],
                                ref_node["source_pages"],
                                ref_node["source_excerpts"],
                                ref_node["objective_ids"],
                                idx,
                                ref_node["warnings"]
                            )
                        )
                        new_nodes.append(new_node_id)
                
                # 2. Delete extra nodes
                if len(existing_nodes) > len(cleaned_titles):
                    extra_node_ids = [node["id"] for node in existing_nodes[len(cleaned_titles):]]
                    for extra_id in extra_node_ids:
                        conn.execute(
                            "DELETE FROM concept_graph_nodes WHERE id = ?",
                            (extra_id,),
                        )
                
                # 3. Recreate edges
                conn.execute(
                    "DELETE FROM concept_graph_edges WHERE job_id = ?",
                    (job_id,),
                )
                for idx in range(len(new_nodes) - 1):
                    from_id = new_nodes[idx]
                    to_id = new_nodes[idx + 1]
                    edge_id = f"edge_{job_id}_{from_id}_{to_id}"
                    conn.execute(
                        "INSERT INTO concept_graph_edges VALUES (?, ?, ?, ?, ?)",
                        (edge_id, job_id, from_id, to_id, "prerequisite"),
                    )
                
                # 4. Update job timestamp
                conn.execute(
                    "UPDATE source_learning_jobs SET updated_at = ? WHERE job_id = ?",
                    (datetime.now().isoformat(), job_id),
                )
            return self.get_job(job_id)
        finally:
            conn.close()

    def start_learning(
        self,
        job_id: str,
        ai_generator: Optional[Callable[[Dict[str, Any]], str]] = None,
        ai_metadata: Optional[Dict[str, Any]] = None,
        strict_ai: bool = False,
    ) -> Dict[str, Any]:
        job = self.get_job(job_id)
        processed_source_path = self._processed_pdf_destination_rel_path(job, self._runtime_root())
        if processed_source_path:
            job["processed_source_path"] = processed_source_path
        nodes = job["concept_graph"]["nodes"]
        if not nodes:
            raise ValueError("Source job has no teachable concept graph nodes.")
        session_id = f"source_tutor_{job_id}"
        hub_path = _source_session_hub_rel_path(job)
        curriculum = [
            _source_session_note_rel_path(job, node["title"])
            for node in nodes
        ]
        self._write_session_hub(job, curriculum)
        node_by_id = {node["id"]: node for node in nodes}
        conn = self._connect()
        try:
            existing = conn.execute("SELECT * FROM tutor_sessions WHERE session_id = ?", (session_id,)).fetchone()
            if existing:
                existing_dict = dict(existing)
                current_node_id = existing_dict.get("current_concept_node_id") or nodes[0]["id"]
                completed_notes = json.loads(existing_dict.get("completed_notes") or "[]")
                active_unlocks = json.loads(existing_dict.get("active_note_unlocks") or "[]")
                current_note_path = existing_dict.get("current_note_path") or (active_unlocks[0] if active_unlocks else curriculum[0])
                roadmap = [
                    {
                        "id": node["id"],
                        "title": node["title"],
                        "path": path,
                        "status": "completed" if path in completed_notes else ("current" if node["id"] == current_node_id else ("ready" if path in active_unlocks else "locked")),
                        "offline_ready": True,
                        "source_pages": node.get("source_pages", []),
                    }
                    for node, path in zip(nodes, curriculum)
                ]
                current_node = node_by_id.get(current_node_id, nodes[0])
                profile = current_node.get("teaching_profile") or build_teaching_profile(current_node["domain"], current_node["modality"])
                note = SourceAtomicNoteCompiler().compile_note(
                    job,
                    current_node,
                    profile,
                    ai_generator=ai_generator,
                    strict_ai=strict_ai,
                )
                if ai_metadata:
                    note["frontmatter"].update({k: v for k, v in ai_metadata.items() if v is not None})
                return {
                    "source_job": self.get_job(job_id),
                    "tutor_session": {
                        "session_id": session_id,
                        "source_job_id": job_id,
                        "current_concept_node_id": current_node_id,
                        "current_note_path": current_note_path,
                        "current_note": note,
                        "hub_path": existing_dict.get("hub_path") or hub_path,
                        "curriculum": curriculum,
                        "roadmap": roadmap,
                        "active_note_unlocks": active_unlocks or [current_note_path],
                        "completed_notes": completed_notes,
                    }
                }

            first = nodes[0]
            profile = first.get("teaching_profile") or build_teaching_profile(first["domain"], first["modality"])
            note = SourceAtomicNoteCompiler().compile_note(
                job,
                first,
                profile,
                ai_generator=ai_generator,
                strict_ai=strict_ai,
            )
            if ai_metadata:
                note["frontmatter"].update({k: v for k, v in ai_metadata.items() if v is not None})
            now = datetime.now().isoformat()
            current_note_path = self._write_session_note(job, note)
            roadmap = [
                {
                    "id": node["id"],
                    "title": node["title"],
                    "path": path,
                    "status": "current" if node["id"] == first["id"] else "locked",
                    "offline_ready": True,
                    "source_pages": node.get("source_pages", []),
                }
                for node, path in zip(nodes, curriculum)
            ]
            with conn:
                conn.execute("INSERT OR REPLACE INTO source_job_tutor_links VALUES (?, ?, ?, ?, ?)", (job_id, session_id, first["id"], current_note_path, now))
                conn.execute("""
                    INSERT OR REPLACE INTO tutor_sessions
                    (session_id, hub_path, current_note_path, completed_notes, wagers, score, status, updated_at, active_note_unlocks, consecutive_failures, active_question_overrides, generated_ahead_paths, transfer_gate_outcomes, offline_readiness, source_job_id, current_concept_node_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id, hub_path, current_note_path, json.dumps([]), json.dumps({}), 0, "active", now,
                    json.dumps([current_note_path]), json.dumps({}), json.dumps({}), json.dumps([]), json.dumps({}),
                    json.dumps({current_note_path: True}), job_id, first["id"],
                ))
                conn.execute("UPDATE coverage_matrix_rows SET note_compiled = 1, taught = 1, mastery_state = 'in_progress', updated_at = ? WHERE job_id = ? AND concept_node_id = ?", (now, job_id, first["id"]))
                conn.execute("UPDATE source_learning_jobs SET status = 'learning_active', updated_at = ? WHERE job_id = ?", (now, job_id))
            return {
                "source_job": self.get_job(job_id),
                "tutor_session": {
                    "session_id": session_id,
                    "source_job_id": job_id,
                    "current_concept_node_id": first["id"],
                    "current_note_path": current_note_path,
                    "current_note": note,
                    "hub_path": hub_path,
                    "curriculum": curriculum,
                    "roadmap": roadmap,
                    "active_note_unlocks": [current_note_path],
                    "completed_notes": [],
                }
            }
        finally:
            conn.close()

    def update_coverage_for_answer(self, job_id: str, concept_node_id: str, correct: bool, transfer_passed: bool = False, remediation_completed: bool = False):
        now = datetime.now().isoformat()
        mastery = "mastered" if correct and transfer_passed else ("remediation" if not correct else "recall_passed")
        conn = self._connect()
        try:
            with conn:
                conn.execute("""
                    UPDATE coverage_matrix_rows
                    SET recall_passed = ?, transfer_passed = ?, remediation_required = ?, remediation_completed = ?, practice_scheduled = ?, mastery_state = ?, updated_at = ?
                    WHERE job_id = ? AND concept_node_id = ?
                """, (1 if correct else 0, 1 if transfer_passed else 0, 0 if correct else 1, 1 if remediation_completed else 0, 1 if correct and transfer_passed else 0, mastery, now, job_id, concept_node_id))
        finally:
            conn.close()

    def record_deployment(self, job_id: str, concept_node_id: str, note_path: str, deployed: bool, warning: Optional[str] = None):
        now = datetime.now().isoformat()
        conn = self._connect()
        try:
            with conn:
                row = conn.execute("SELECT warnings FROM coverage_matrix_rows WHERE job_id = ? AND concept_node_id = ?", (job_id, concept_node_id)).fetchone()
                warnings = json.loads(row["warnings"] or "[]") if row else []
                if warning and warning not in warnings:
                    warnings.append(warning)
                conn.execute("""
                    UPDATE coverage_matrix_rows
                    SET vault_deployed = ?, warnings = ?, updated_at = ?
                    WHERE job_id = ? AND concept_node_id = ?
                """, (1 if deployed else 0, json.dumps(warnings), now, job_id, concept_node_id))
                link = conn.execute("SELECT tutor_session_id FROM source_job_tutor_links WHERE job_id = ?", (job_id,)).fetchone()
                current_link = conn.execute("SELECT tutor_session_id FROM source_job_tutor_links WHERE job_id = ? AND current_concept_node_id = ?", (job_id, concept_node_id)).fetchone()
                if link and current_link:
                    conn.execute("UPDATE source_job_tutor_links SET current_note_path = ?, updated_at = ? WHERE job_id = ?", (note_path, now, job_id))
                    conn.execute("UPDATE tutor_sessions SET current_note_path = ?, active_note_unlocks = ?, offline_readiness = ?, updated_at = ? WHERE session_id = ?", (note_path, json.dumps([note_path]), json.dumps({note_path: deployed}), now, link["tutor_session_id"]))
        finally:
            conn.close()

    def deploy_to_vault(
        self,
        job_id: str,
        vault_path: str,
        ai_generator: Optional[Callable[[Dict[str, Any]], str]] = None,
        ai_metadata: Optional[Dict[str, Any]] = None,
        ai_node_ids: Optional[set[str]] = None,
        strict_ai: bool = False,
        write_node_ids: Optional[set[str]] = None,
        write_hub_files: bool = True,
        per_note_delay_seconds: float = 0.0,
    ) -> Dict[str, Any]:
        vault = Path(vault_path)
        job = self.get_job(job_id)
        compiler = SourceAtomicNoteCompiler()
        written: List[str] = []
        collisions: List[Dict[str, str]] = []

        hub_rel_path = _source_hub_rel_path(job)
        hub_path = vault / hub_rel_path
        root = hub_path.parent
        root.mkdir(parents=True, exist_ok=True)
        processed_source_path = self._processed_pdf_destination_rel_path(job, vault)
        if processed_source_path:
            job["processed_source_path"] = processed_source_path

        note_links: List[str] = []
        for node in job["concept_graph"]["nodes"]:
            if write_node_ids is not None and node.get("id") not in write_node_ids:
                continue
            node_ai_generator = ai_generator
            if ai_node_ids is not None and node.get("id") not in ai_node_ids:
                node_ai_generator = None
            node_strict_ai = strict_ai and (ai_node_ids is None or node.get("id") in ai_node_ids)
            try:
                note = compiler.compile_note(
                    job,
                    node,
                    node.get("teaching_profile") or {},
                    ai_generator=node_ai_generator,
                    strict_ai=node_strict_ai,
                )
            except Exception as exc:
                if strict_ai and write_node_ids and len(write_node_ids) == 1:
                    raise
                logger.error("[SourceLearning] AI note generation failed for %s: %s", node.get("title", "Untitled"), exc)
                note = compiler.compile_fallback_note(job, node, node.get("teaching_profile") or {})
                note["validation_errors"] = [str(exc)]
                note["frontmatter"]["fallback_reason"] = "ai_generation_error"
            if ai_metadata:
                for key, value in ai_metadata.items():
                    if value is not None:
                        note["frontmatter"][key] = value
            note_title = note["note_title"]
            note_rel = _source_note_rel_path(job, note_title)
            note_path = vault / note_rel
            note_path.parent.mkdir(parents=True, exist_ok=True)
            rel_path = note_path.relative_to(vault).as_posix()
            yaml_lines = ["---"] + [f"{key}: {json.dumps(value)}" for key, value in note["frontmatter"].items()] + ["---", ""]
            full_content = "\n".join(yaml_lines) + note["content"].strip() + "\n"
            if note_path.exists():
                existing = note_path.read_text(encoding="utf-8")
                owns_note = (
                    f"source_job_id: \"{job_id}\"" in existing
                    or f"source_job_id: {json.dumps(job_id)}" in existing
                    or f"source_job_id: {job_id}" in existing
                    or "generated_by: \"ater_source_job\"" in existing
                    or "generated_by: ater_source_job" in existing
                )
                if not owns_note:
                    collisions.append({"path": rel_path, "status": "review_required"})
                    self.record_deployment(job_id, node["id"], rel_path, False, "review_required_collision")
                    continue
                if existing == full_content:
                    status = "reused"
                else:
                    note_path.write_text(full_content, encoding="utf-8")
                    status = "updated"
            else:
                note_path.write_text(full_content, encoding="utf-8")
                status = "written"
            written.append(rel_path)
            note_links.append(f"[[{note_title}]]")
            self.record_deployment(job_id, node["id"], rel_path, True)
            if per_note_delay_seconds > 0:
                time.sleep(per_note_delay_seconds)

        if write_hub_files:
            full_note_links = [f"[[{lo.normalize_title(node.get('title', 'Untitled Concept'))}]]" for node in job["concept_graph"]["nodes"]]
            chapter_path = vault / _source_chapter_rel_path(job)
            chapter_path.parent.mkdir(parents=True, exist_ok=True)
            chapter_path.write_text("---\ntype: \"Chapter\"\ngenerated_by: \"ater_source_job\"\nsource_job_id: " + json.dumps(job_id) + "\n---\n\n# Source Roadmap\n\n" + "\n".join(f"- {link}" for link in full_note_links) + "\n", encoding="utf-8")
            hub_title = Path(hub_rel_path).stem
            hub_path.write_text(self._build_hub_file(job, job_id, hub_title, full_note_links), encoding="utf-8")
            written.extend([chapter_path.relative_to(vault).as_posix(), hub_path.relative_to(vault).as_posix()])
        moved_source = self._move_processed_pdf(job, vault) if write_hub_files and not collisions else None
        return {
            "job_id": job_id,
            "written_files": written,
            "collisions": collisions,
            "status": "review_required" if collisions else "deployed",
            "processed_source_path": moved_source,
        }

    def _processed_pdf_destination_rel_path(self, job: Dict[str, Any], vault: Path) -> Optional[str]:
        if str(job.get("source_type") or "").lower() == "synthetic_source_pack":
            return None
        placement = job.get("placement") or _placement_from_job(job)
        scope = "academic" if placement.get("learning_scope") == "academic" else "external"
        file_name = str(job.get("file_name") or "")
        if file_name:
            existing_generated = vault / "Inbox" / "generated" / scope / file_name
            if existing_generated.exists():
                return existing_generated.relative_to(vault).as_posix()
        source_path = Path(job.get("file_path") or "")
        if not source_path.exists() or source_path.suffix.lower() != ".pdf":
            return None
        try:
            source_path.resolve().relative_to((vault / "Inbox").resolve())
        except Exception:
            return None
        destination_dir = vault / "Inbox" / "generated" / scope
        destination = destination_dir / source_path.name
        if destination.exists():
            destination = destination_dir / f"{source_path.stem}_{job['job_id']}{source_path.suffix}"
        return destination.relative_to(vault).as_posix()

    def _move_processed_pdf(self, job: Dict[str, Any], vault: Path) -> Optional[str]:
        if str(job.get("source_type") or "").lower() == "synthetic_source_pack":
            return None
        source_path = Path(job.get("file_path") or "")
        if not source_path.exists() or source_path.suffix.lower() != ".pdf":
            return None
        try:
            source_path.resolve().relative_to((vault / "Inbox").resolve())
        except Exception:
            return None
        placement = job.get("placement") or _placement_from_job(job)
        scope = "academic" if placement.get("learning_scope") == "academic" else "external"
        destination_dir = vault / "Inbox" / "generated" / scope
        destination_dir.mkdir(parents=True, exist_ok=True)
        destination_rel = job.get("processed_source_path") or self._processed_pdf_destination_rel_path(job, vault)
        destination = vault / destination_rel if destination_rel else destination_dir / source_path.name
        shutil.move(str(source_path), str(destination))
        return destination.relative_to(vault).as_posix()

    def _build_hub_file(self, job: Dict[str, Any], job_id: str, hub_title: str, note_links: List[str]) -> str:
        placement = job.get("placement") or _placement_from_job(job)
        topic = job.get("topic") or job.get("title") or hub_title
        chapters = job.get("chapters") or build_nested_chapters(job, (job.get("concept_graph") or {}).get("nodes") or [])
        metadata = {
            "title": hub_title,
            "type": "Hub",
            "generated_by": "ater_source_job",
            "source_job_id": job_id,
            "learning_scope": placement.get("learning_scope") or "external",
            "semester": placement.get("semester"),
            "course": placement.get("course"),
            "unit": placement.get("unit") or placement.get("learning_path"),
            "chapter_title": placement.get("chapter_title") or placement.get("unit") or placement.get("learning_path"),
            "status": "In Progress",
            "current_lesson_path": _source_note_rel_path(job, job["roadmap"][0]["title"]) if job.get("roadmap") else "",
            "chapters": ["[[Chapter_01_Source_Roadmap]]"],
        }
        yaml_lines = ["---"]
        for key, value in metadata.items():
            if value is None:
                continue
            yaml_lines.append(f"{key}: {json.dumps(value)}")
        yaml_lines.append("---")
        roadmap_lines: List[str] = []
        if chapters:
            for chapter in chapters:
                source_pages = chapter.get("source_pages") or []
                pages_label = f" _(pages {', '.join(map(str, source_pages))})_" if source_pages else ""
                roadmap_lines.append(f"### {chapter.get('title', 'Chapter')}{pages_label}")
                for note in chapter.get("atomic_notes") or []:
                    title = lo.normalize_title(note.get("title") or "Untitled Concept")
                    note_pages = note.get("source_pages") or []
                    note_pages_label = f" — pages {', '.join(map(str, note_pages))}" if note_pages else ""
                    roadmap_lines.append(f"- [[{title}]]{note_pages_label}")
                roadmap_lines.append("")
        else:
            roadmap_lines = [*[f"- {link}" for link in note_links], ""]
        body = [
            f"# {str(topic).replace('_', ' ')}",
            "",
            "[[Chapter_01_Source_Roadmap]]",
            "",
            "## Chapter Roadmap",
            *roadmap_lines,
            "## Atomic Notes",
            *[f"- {link}" for link in note_links],
            "",
        ]
        return "\n".join(yaml_lines + [""] + body)

class SourceGroundedPlanner(AterPlanner):
    async def generate_grounded_curriculum(
        self, 
        prompt: str, 
        sources: List[Dict[str, Any]], 
        learning_mode: str = "self-study"
    ) -> SourceGroundedCurriculum:
        if not self.llm:
            raise ValueError("LLM client is not configured.")
        
        sources_context = ""
        for src in sources:
            file_name = src.get("file_name", "Unknown")
            for pg in src.get("pages", []):
                pg_num = pg.get("page_number", 0)
                content = pg.get("content", "")[:1000]
                sources_context += f"--- Source File: {file_name}, Page: {pg_num} ---\n{content}\n\n"
        
        system_prompt = (
            f"You are Ater's Source-Grounded Curriculum Planner.\n"
            f"Your job is to design a structured curriculum (Chapters & Atomic Notes) directly mapped to specific source pages or sections.\n"
            f"Set the learning_mode to '{learning_mode}'.\n"
            f"Analyze the user prompt and the provided source texts to extract topics and map each Atomic Note to its pages in the source.\n"
            f"Output the structured JSON matching the SourceGroundedCurriculum schema.\n"
            f"For each note, identify the specific pages in the citations and provide confidence scores."
        )
        
        user_prompt = f"User Request: {prompt}\n\nReference Sources Context:\n{sources_context}"
        
        structured_llm = self.llm.with_structured_output(SourceGroundedCurriculum)
        curriculum = await structured_llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        return curriculum

    def write_grounded_curriculum(
        self, 
        curriculum: SourceGroundedCurriculum, 
        mode: Literal["Generate All", "Progressive"], 
        semester: Optional[str] = None, 
        course: Optional[str] = None, 
        unit: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.vault_path:
            raise ValueError("Vault path is not configured.")
        
        topic = curriculum.topic or "Unknown"
        learning_mode = "self-study"
        
        chapters_map = {}
        for note in curriculum.notes:
            ch_title = note.chapter_title
            if ch_title not in chapters_map:
                chapters_map[ch_title] = []
            chapters_map[ch_title].append(note)
            
        chapters_data = []
        order = 1
        for ch_title, notes in chapters_map.items():
            chapters_data.append({
                "title": ch_title,
                "order": order,
                "atomic_notes": [n.title for n in notes]
            })
            order += 1
            
        hub_rel_path = lo.get_hub_path(topic, semester, course, unit)
        hub_abs_path = self.vault_path / hub_rel_path
        hub_abs_path.parent.mkdir(parents=True, exist_ok=True)
        
        all_chapter_links = []
        for ch in chapters_data:
            ch_title = ch["title"]
            ch_order = ch["order"]
            norm_ch_title = lo.normalize_title(ch_title)
            padded_order = f"{ch_order:02d}"
            all_chapter_links.append(f"Chapter_{padded_order}_{norm_ch_title}")
            
        existing_hub_chapters = []
        is_existing = hub_abs_path.exists()
        if is_existing:
            try:
                import frontmatter
                post = frontmatter.loads(hub_abs_path.read_text(encoding="utf-8"))
                existing_hub_chapters = post.metadata.get("chapters", [])
            except Exception:
                pass
                
        merged_chapters = list(existing_hub_chapters)
        for link in all_chapter_links:
            clean_link = re.sub(r"[\[\]]+", "", link).strip()
            if clean_link not in [re.sub(r"[\[\]]+", "", x).strip() for x in merged_chapters]:
                merged_chapters.append(link)
                
        hub_content = lo.build_hub_content(topic, learning_mode, merged_chapters)
        hub_abs_path.write_text(hub_content, encoding="utf-8")
        
        written_files = [str(hub_rel_path)]
        
        for idx, ch in enumerate(chapters_data):
            ch_title = ch["title"]
            ch_order = ch["order"]
            ch_notes = ch["atomic_notes"]
            
            norm_notes = [lo.normalize_title(n) for n in ch_notes]
            ch_rel_path = lo.get_chapter_path(topic, ch_title, ch_order, semester, course, unit)
            ch_abs_path = self.vault_path / ch_rel_path
            
            should_write = True
            if mode == "Progressive" and idx > 0:
                should_write = False
                
            if should_write:
                ch_abs_path.parent.mkdir(parents=True, exist_ok=True)
                ch_content = lo.build_chapter_content(f"{lo.normalize_title(topic)}_Hub", ch_order, norm_notes)
                ch_abs_path.write_text(ch_content, encoding="utf-8")
                written_files.append(str(ch_rel_path))
                
                for note_title in norm_notes:
                    note_rel_path = lo.get_note_path(topic, ch_title, ch_order, note_title, semester, course, unit)
                    note_abs_path = self.vault_path / note_rel_path
                    note_abs_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    art_pack_rel = lo.get_artifact_pack_path(note_rel_path)
                    art_pack_abs = self.vault_path / art_pack_rel
                    art_pack_abs.parent.mkdir(parents=True, exist_ok=True)
                    
                    if not art_pack_abs.exists():
                        minimal_pack = lo.build_minimal_artifact_pack(note_title, str(note_rel_path))
                        art_pack_abs.write_text(json.dumps(minimal_pack, indent=2), encoding="utf-8")
                    
                    existing_content = ""
                    if note_abs_path.exists():
                        existing_content = note_abs_path.read_text(encoding="utf-8")
                        
                    citations_list = []
                    note_plan_opt = [n for n in curriculum.notes if lo.normalize_title(n.title) == note_title]
                    if note_plan_opt:
                        for cit in note_plan_opt[0].citations:
                            citations_list.append({
                                "file": cit.file_name,
                                "pages": cit.pages
                            })
                            
                    note_content = lo.merge_atomic_note_metadata(
                        existing_content=existing_content,
                        chapter_title=f"Chapter_{ch_order:02d}_{lo.normalize_title(ch_title)}",
                        lesson_variants={},
                        artifact_pack_path=art_pack_rel,
                        hub_title=f"{lo.normalize_title(topic)}_Hub",
                        sources=citations_list if citations_list else None
                    )
                    note_abs_path.write_text(note_content, encoding="utf-8")
                    written_files.append(str(note_rel_path))
                    
        return {
            "hub_path": str(hub_rel_path),
            "written_files": written_files,
            "chapters_merged": len(merged_chapters)
        }

class CoverageCheckResponse(BaseModel):
    warnings: List[CoverageWarning]

class SourceWeaknessDetector:
    def __init__(self, secrets, llm=None):
        self.secrets = secrets
        self.llm = llm
        if not self.llm and secrets.ai_key:
            self.llm = ModelFactory.get_model(
                provider=secrets.ai_provider,
                model_name=secrets.ai_model,
                api_key=secrets.ai_key,
                temperature=0.0,
                max_retries=0
            )

    async def analyze_coverage(
        self, 
        curriculum: SourceGroundedCurriculum, 
        sources: List[Dict[str, Any]]
    ) -> List[CoverageWarning]:
        if not self.llm:
            return []
        
        source_map = {}
        for src in sources:
            fname = src.get("file_name", "")
            source_map[fname] = {}
            for pg in src.get("pages", []):
                pg_num = pg.get("page_number", 0)
                source_map[fname][pg_num] = pg.get("content", "")
                
        notes_analysis_input = ""
        for note in curriculum.notes:
            cited_text = ""
            for cit in note.citations:
                fname = cit.file_name
                for p in cit.pages:
                    cited_text += source_map.get(fname, {}).get(p, "")
            cited_text = cited_text[:2000]
            notes_analysis_input += (
                f"Note Title: {note.title}\n"
                f"Suggested Concepts: {', '.join(note.suggested_concepts)}\n"
                f"Cited Text Context:\n{cited_text}\n"
                f"==================================\n"
            )
            
        system_prompt = (
            "You are Ater's Source Weakness Detector.\n"
            "Your task is to analyze if the cited reference texts cover the suggested concepts for each planned note along three dimensions:\n"
            "1. Definition (what the concept is)\n"
            "2. Mechanism (how it works)\n"
            "3. Failure Mode (risks, traps, errors, common pitfalls)\n\n"
            "If the source text lacks explanation for any of these dimensions for a concept, generate a CoverageWarning.\n"
            "If mechanism or failure mode explanations are lacking, set severity to 'high'. Otherwise, use 'medium' or 'low'.\n"
            "Return the list of warnings structured as CoverageCheckResponse JSON matching the schema."
        )
        
        structured_llm = self.llm.with_structured_output(CoverageCheckResponse)
        response = await structured_llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Notes to Analyze:\n{notes_analysis_input}"}
        ])
        return response.warnings

class SearchAugmentationEngine:
    def __init__(self):
        pass
        
    def search_query(self, query: str) -> List[Dict[str, Any]]:
        if "pytest" in sys.modules or os.environ.get("ATER_TEST_MODE") == "1":
            return [
                {
                    "title": f"Mock Search: {query}",
                    "url": f"https://example.com/search?q={query}",
                    "body": f"This is mock web search explanation context for {query} covering its definition, mechanism, and common failure modes."
                }
            ]
            
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=3))
            return [
                {
                    "title": r.get("title", f"Search result for {query}"),
                    "url": r.get("href", ""),
                    "body": r.get("body", "")
                } for r in results
            ]
        except Exception:
            return []

    def augment_context(self, concept: str, results: List[Dict[str, Any]]) -> str:
        if not results:
            return ""
        context = f"### Web Search Augmentation: {concept}\n"
        for r in results:
            context += f"Source: {r['title']} ({r['url']})\nContent: {r['body']}\n\n"
        return context
