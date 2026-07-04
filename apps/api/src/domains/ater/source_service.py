import os
import re
import sys
import json
import uuid
import sqlite3
import hashlib
import shutil
from datetime import datetime
from typing import Dict, Any, List, Optional, Literal, Tuple, Callable
from pydantic import BaseModel
from pathlib import Path

from src.domains.ater.planner import AterPlanner
from src.domains.ater.pdf_extractor import load_pdf_robust
from src.domains.ater import learning_object as lo
from src.domains.ai.factory import ModelFactory
from src.domains.ater.router import router as domain_router
from src.domains.ater.agents import get_persona, normalize_mode
from src.domains.ater.templates import build_skeleton_note

SOURCE_LEARNING_PIPELINE_VERSION = "source-roadmap-v5"

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
        profile["artifact_constraints"]["forbidden"] = ["Python", "R", "Java", "JavaScript", "programming code"]
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
    return f"SourceJobs/{job['job_id']}/{lo.normalize_title(note_title)}.md"


def _source_session_hub_rel_path(job: Dict[str, Any]) -> str:
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
    return " ".join(words[:9]).strip(" .:-\t").title()


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


def _is_teachable_title(title: str) -> bool:
    key = _concept_key(title)
    if not key or key in _CONCEPT_STOP_TITLES:
        return False
    weak_titles = {
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

    def sort_key(item: Dict[str, Any]):
        origin = item.get("origin_priority", 2)
        if origin == 0:
            return (origin, int(item.get("teaching_order") or 9999), item["title"].lower())
        return (origin, int(item.get("origin_index") or 9999), min(item.get("source_pages") or [9999]), item["title"].lower())

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


class SourceAtomicNoteCompiler:
    REQUIRED_SECTIONS = ["Mental Model", "Proving Grounds"]
    FORBIDDEN_PROMPT_MARKERS = ["system prompt", "developer message", "ignore previous", "chain of thought"]
    DRIFT_TERMS = ["central banking", "exchange rates", "python", "java", "biology", "aggregate demand"]

    def build_ai_prompt(self, job: Dict[str, Any], node: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        excerpts = "\n\n".join(
            f"[PAGE {ex.get('page')}]\n{ex.get('text', '')}"
            for ex in node.get("source_excerpts", [])
        )
        return {
            "system": (
                "Generate replaceable Atomic Note content only. Deterministic code owns YAML, headings, citations, "
                "quiz schema, deployment paths, and validation. Stay strictly inside the cited source excerpts."
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
                "source_excerpts": excerpts[:4000],
                "output_schema": {
                    "mental_model": "continuous source-aligned prose",
                    "core_explanation": "continuous source-aligned prose with valid [PAGE n] citations",
                    "artifact": "only if compatible with artifact_constraints",
                    "quiz": [{"id": "q1", "type": "mcq|writing|calculation|matching", "question": "...", "answer": "..."}],
                    "remediation": "source-grounded hint text",
                },
            },
        }

    def _valid_source_pages(self, node: Dict[str, Any]) -> set[int]:
        return {int(p) for p in node.get("source_pages", []) if str(p).isdigit()}

    def validate_content(self, content: str, node: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[bool, List[str]]:
        errors: List[str] = []
        text = content or ""
        lower = text.lower()
        for section in self.REQUIRED_SECTIONS:
            if section.lower() not in lower:
                errors.append(f"missing_section:{section}")
        valid_pages = self._valid_source_pages(node)
        cited_pages = {int(p) for p in re.findall(r"\[PAGE\s+(\d+)\]", text, flags=re.IGNORECASE)}
        if valid_pages and cited_pages and not cited_pages.issubset(valid_pages):
            errors.append("invalid_citation")
        if not cited_pages and valid_pages:
            errors.append("missing_citation")
        if "```interactive-quiz" in text:
            quiz_match = re.search(r"```interactive-quiz\s*(.*?)```", text, flags=re.DOTALL | re.IGNORECASE)
            try:
                parsed = json.loads(quiz_match.group(1).strip() if quiz_match else "")
                if not isinstance(parsed, list):
                    errors.append("invalid_quiz_json")
            except Exception:
                errors.append("invalid_quiz_json")
        else:
            errors.append("missing_quiz")
        forbidden_artifacts = [str(v).lower() for v in profile.get("artifact_constraints", {}).get("forbidden", [])]
        if any(item and item in lower for item in forbidden_artifacts):
            errors.append("forbidden_artifact")
        if node.get("domain") == "ECON-MICRO" and any(term in lower for term in self.DRIFT_TERMS if term not in ["python", "java"]):
            errors.append("domain_drift")
        if any(marker in lower for marker in self.FORBIDDEN_PROMPT_MARKERS):
            errors.append("prompt_leakage")
        return not errors, errors

    def repair_or_replace_content(self, content: str, job: Dict[str, Any], node: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        valid, errors = self.validate_content(content, node, profile)
        if valid:
            note = self.compile_fallback_note(job, node, profile)
            note["content"] = content
            note["fallback"] = False
            note["frontmatter"]["fallback_generation"] = False
            return note
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
    ) -> Dict[str, Any]:
        if not ai_generator:
            return self.compile_fallback_note(job, node, profile)
        try:
            content = ai_generator(self.build_ai_prompt(job, node, profile))
            return self.repair_or_replace_content(content, job, node, profile)
        except Exception as exc:
            note = self.compile_fallback_note(job, node, profile)
            note["validation_errors"] = [f"ai_failure:{type(exc).__name__}"]
            note["frontmatter"]["fallback_reason"] = "ai_failure"
            return note

    def compile_fallback_note(self, job: Dict[str, Any], node: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        source_pages = [int(p) for p in node.get("source_pages", [])]
        if not source_pages and "unresolved-source" not in node.get("warnings", []):
            raise ValueError("Source-grounded concept node requires source pages or an unresolved-source warning.")

        class NoteSchema:
            pass

        note_schema = NoteSchema()
        note_schema.title = lo.normalize_title(node.get("title", "Untitled Concept"))
        note_schema.description = node.get("title", "")
        note_schema.source_context = " ".join(ex.get("text", "") for ex in node.get("source_excerpts", []))
        note_schema.source_pages = source_pages
        note_schema.concept_modality = node.get("modality", "Qualitative/Definitional")
        note_schema.mode = node.get("domain", "ACADEMIC-GENERAL")
        body = build_skeleton_note(note_schema, note_schema.source_context, profile, all_titles=[node.get("title", "")])
        frontmatter = {
            "title": note_schema.title,
            "hub": f"[[{Path(_source_hub_rel_path(job)).stem}]]",
            "source": f"[[{job.get('file_name', '')}]]",
            "source_file": job.get("file_name"),
            "source_pages": source_pages,
            "source_job_id": job.get("job_id"),
            "domain": node.get("domain"),
            "concept_modality": node.get("modality"),
            "fallback_generation": True,
            "generated_by": "ater_source_job",
        }
        return {
            "note_title": note_schema.title,
            "frontmatter": frontmatter,
            "content": body,
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
    ) -> Dict[str, Any]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Source file not found: {file_path}")
        identity, digest, file_size = self._source_identity(path)
        now = datetime.now().isoformat()
        conn = self._connect()
        try:
            existing = conn.execute("SELECT job_id FROM source_learning_jobs WHERE source_identity = ?", (identity,)).fetchone()
            if existing:
                job_id = existing["job_id"]
                if not self._job_needs_rebuild(conn, job_id):
                    with conn:
                        conn.execute(
                            "UPDATE source_learning_jobs SET conversation_id = COALESCE(?, conversation_id), attachment_id = COALESCE(?, attachment_id), updated_at = ? WHERE job_id = ?",
                            (conversation_id, attachment_id, now, job_id),
                        )
                    return self.get_job(job_id)
                with conn:
                    self._delete_job_records(conn, job_id)

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
            nodes, edges, drift_warnings = SourceConceptGraphService().build_from_pages(topic, objectives, pages, domain)
            nodes, edges = scope_concept_graph_ids(job_id, nodes, edges)
            warnings.extend(drift_warnings)
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
                "concept_graph": {"nodes": nodes, "edges": self._rows(conn, "SELECT from_node_id, to_node_id, edge_type FROM concept_graph_edges WHERE job_id = ?", (job_id,))},
                "coverage": {"rows": coverage, "remaining": remaining},
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

    def start_learning(self, job_id: str) -> Dict[str, Any]:
        job = self.get_job(job_id)
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
                note = SourceAtomicNoteCompiler().compile_fallback_note(job, current_node, profile)
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
            note = SourceAtomicNoteCompiler().compile_fallback_note(job, first, profile)
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

    def deploy_to_vault(self, job_id: str, vault_path: str) -> Dict[str, Any]:
        vault = Path(vault_path)
        job = self.get_job(job_id)
        compiler = SourceAtomicNoteCompiler()
        written: List[str] = []
        collisions: List[Dict[str, str]] = []

        hub_rel_path = _source_hub_rel_path(job)
        hub_path = vault / hub_rel_path
        root = hub_path.parent
        root.mkdir(parents=True, exist_ok=True)

        note_links: List[str] = []
        for node in job["concept_graph"]["nodes"]:
            note = compiler.compile_fallback_note(job, node, node.get("teaching_profile") or {})
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

        chapter_path = vault / _source_chapter_rel_path(job)
        chapter_path.parent.mkdir(parents=True, exist_ok=True)
        chapter_path.write_text("---\ntype: \"Chapter\"\ngenerated_by: \"ater_source_job\"\nsource_job_id: " + json.dumps(job_id) + "\n---\n\n# Source Roadmap\n\n" + "\n".join(f"- {link}" for link in note_links) + "\n", encoding="utf-8")
        hub_title = Path(hub_rel_path).stem
        hub_path.write_text(self._build_hub_file(job, job_id, hub_title, note_links), encoding="utf-8")
        written.extend([chapter_path.relative_to(vault).as_posix(), hub_path.relative_to(vault).as_posix()])
        moved_source = self._move_processed_pdf(job, vault) if not collisions else None
        return {
            "job_id": job_id,
            "written_files": written,
            "collisions": collisions,
            "status": "review_required" if collisions else "deployed",
            "processed_source_path": moved_source,
        }

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
        destination = destination_dir / source_path.name
        if destination.exists():
            destination = destination_dir / f"{source_path.stem}_{job['job_id']}{source_path.suffix}"
        shutil.move(str(source_path), str(destination))
        return destination.relative_to(vault).as_posix()

    def _build_hub_file(self, job: Dict[str, Any], job_id: str, hub_title: str, note_links: List[str]) -> str:
        placement = job.get("placement") or _placement_from_job(job)
        topic = job.get("topic") or job.get("title") or hub_title
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
        body = [
            f"# {str(topic).replace('_', ' ')}",
            "",
            "[[Chapter_01_Source_Roadmap]]",
            "",
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
