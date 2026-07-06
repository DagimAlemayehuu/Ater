"""
pdf_extractor.py — Robust multi-strategy PDF text extractor for Ater.

Extraction priority chain:
  1. PyMuPDF (fitz)  — handles multi-column, embedded fonts, equations as text
  2. pdfplumber      — superior table extraction, fixes column merge issues
  3. pypdf           — legacy fallback
  4. Empty result    — caller handles missing pages gracefully

Each extracted page is returned as an object with:
  .page_content : str  — full cleaned text of the page
  .metadata     : dict — {"page": 0-indexed int, "source": str, "extraction_method": str}

The output format is identical to the old PyPDFLoader output so all downstream
code (chunk_text, source packet builder) requires zero changes.
"""

from __future__ import annotations
import re
import logging
from pathlib import Path
from types import SimpleNamespace
from typing import List

logger = logging.getLogger("Ater")

# ── Optional heavy dependencies — imported lazily so the sidecar boots even if
# a library isn't installed yet. The chain tries each in order. ────────────────


def _try_import_fitz():
    try:
        import fitz  # PyMuPDF
        return fitz
    except ImportError:
        return None


def _try_import_pdfplumber():
    try:
        import pdfplumber
        return pdfplumber
    except ImportError:
        return None


def _try_import_pypdf():
    try:
        import pypdf
        return pypdf
    except ImportError:
        return None


# ── Text cleaning helpers ─────────────────────────────────────────────────────

_MULTI_NEWLINE = re.compile(r"\n{3,}")
_TRAILING_SPACE = re.compile(r"[ \t]+\n")
_NON_PRINTABLE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_LIGATURE_MAP = str.maketrans({
    "\ufb00": "ff", "\ufb01": "fi", "\ufb02": "fl",
    "\ufb03": "ffi", "\ufb04": "ffl", "\u2019": "'",
    "\u2018": "'", "\u201c": '"', "\u201d": '"',
    "\u2013": "-", "\u2014": "--", "\u00a0": " ",
})


def _clean_page_text(raw: str) -> str:
    """Normalise raw page text extracted from any PDF library."""
    if not raw:
        return ""
    text = raw.translate(_LIGATURE_MAP)
    text = _NON_PRINTABLE.sub("", text)
    text = _TRAILING_SPACE.sub("\n", text)
    text = _MULTI_NEWLINE.sub("\n\n", text)
    return text.strip()


def _make_page(content: str, page_idx: int, source: str, method: str) -> SimpleNamespace:
    return SimpleNamespace(
        page_content=content,
        metadata={"page": page_idx, "source": source, "extraction_method": method},
    )


# ── Strategy 1: PyMuPDF ───────────────────────────────────────────────────────

def _extract_with_fitz(path_str: str) -> List[SimpleNamespace]:
    """
    PyMuPDF extraction with multi-column support.
    Uses get_text("dict") to rebuild reading order correctly, then falls back
    to the simpler get_text("text") if block parsing fails.
    Also extracts embedded table text via block sorting.
    """
    fitz = _try_import_fitz()
    if fitz is None:
        raise ImportError("PyMuPDF (fitz) not installed")

    docs = []
    pdf = fitz.open(path_str)
    try:
        for page_idx, page in enumerate(pdf):
            try:
                # Attempt structured block extraction for proper reading order
                blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
                lines = []
                for block in sorted(blocks, key=lambda b: (round(b["bbox"][1] / 20), b["bbox"][0])):
                    if block["type"] == 0:  # text block
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                txt = span.get("text", "").strip()
                                if txt:
                                    lines.append(txt)
                        lines.append("")  # paragraph separator
                text = "\n".join(lines)
            except Exception:
                # Fallback to simple text extraction
                text = page.get_text("text")

            cleaned = _clean_page_text(text)
            if cleaned:
                docs.append(_make_page(cleaned, page_idx, path_str, "pymupdf"))
            else:
                # Page has no selectable text — likely image-only; leave placeholder
                docs.append(_make_page("[IMAGE-ONLY PAGE — no extractable text]", page_idx, path_str, "pymupdf-empty"))
    finally:
        pdf.close()

    return docs


# ── Strategy 2: pdfplumber (table-aware) ─────────────────────────────────────

def _extract_with_pdfplumber(path_str: str) -> List[SimpleNamespace]:
    """
    pdfplumber is best at detecting tables and multi-column layouts.
    We extract tables first, then overlay the plain text, giving precedence to
    table content that pypdf and fitz often mangle.
    """
    pdfplumber = _try_import_pdfplumber()
    if pdfplumber is None:
        raise ImportError("pdfplumber not installed")

    docs = []
    with pdfplumber.open(path_str) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            parts = []

            # 1. Extract tables as markdown-like text
            try:
                for table in page.extract_tables():
                    if table:
                        rows = []
                        for row in table:
                            row_clean = [str(cell).strip() if cell else "" for cell in row]
                            rows.append(" | ".join(row_clean))
                        if rows:
                            parts.append("\n".join(rows))
            except Exception:
                pass

            # 2. Plain text (may duplicate some table content but gives prose context)
            try:
                plain = page.extract_text(x_tolerance=3, y_tolerance=3) or ""
                if plain.strip():
                    parts.append(plain)
            except Exception:
                pass

            combined = "\n\n".join(parts)
            cleaned = _clean_page_text(combined)
            if cleaned:
                docs.append(_make_page(cleaned, page_idx, path_str, "pdfplumber"))
            else:
                docs.append(_make_page("[IMAGE-ONLY PAGE — no extractable text]", page_idx, path_str, "pdfplumber-empty"))

    return docs


# ── Strategy 3: pypdf (legacy fallback) ──────────────────────────────────────

def _extract_with_pypdf(path_str: str) -> List[SimpleNamespace]:
    pypdf = _try_import_pypdf()
    if pypdf is None:
        raise ImportError("pypdf not installed")

    reader = pypdf.PdfReader(path_str)
    docs = []
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        cleaned = _clean_page_text(text)
        docs.append(_make_page(
            cleaned or "[IMAGE-ONLY PAGE — no extractable text]",
            i, path_str, "pypdf"
        ))
    return docs


# ── Quality scorer ────────────────────────────────────────────────────────────

def _score_extraction(docs: List[SimpleNamespace]) -> float:
    """
    Heuristic quality score for an extraction result.
    Higher is better. Used to pick the best strategy output.
    """
    if not docs:
        return 0.0
    total_chars = sum(len(d.page_content) for d in docs)
    non_empty = sum(
        1 for d in docs
        if len(d.page_content) > 50 and "IMAGE-ONLY" not in d.page_content
    )
    coverage = non_empty / max(1, len(docs))
    avg_chars = total_chars / max(1, len(docs))
    return coverage * min(avg_chars, 2000)  # cap at 2000 to avoid single-page bias


# ── Public API ────────────────────────────────────────────────────────────────

def load_pdf_robust(path_str: str) -> List[SimpleNamespace]:
    """
    Load a PDF using the best available extraction method.

    Tries each strategy, scores the output, and returns the best result.
    If all strategies yield the same page count, we prefer PyMuPDF for text
    quality then pdfplumber for table-heavy PDFs.

    Returns a list of page objects with .page_content and .metadata attributes
    compatible with the rest of the Ater pipeline.
    """
    path = Path(path_str)
    if not path.exists():
        logger.error(f"[PDF] File not found: {path_str}")
        return []

    results: list = []  # list of (score, docs)

    # Strategy 1: PyMuPDF
    try:
        fitz_docs = _extract_with_fitz(path_str)
        score = _score_extraction(fitz_docs)
        results.append((score, fitz_docs))
        logger.info(f"[PDF] PyMuPDF: {len(fitz_docs)} pages, score={score:.1f}")
    except Exception as e:
        logger.warning(f"[PDF] PyMuPDF failed: {e}")

    # Strategy 2: pdfplumber
    try:
        plumber_docs = _extract_with_pdfplumber(path_str)
        score = _score_extraction(plumber_docs)
        results.append((score, plumber_docs))
        logger.info(f"[PDF] pdfplumber: {len(plumber_docs)} pages, score={score:.1f}")
    except Exception as e:
        logger.warning(f"[PDF] pdfplumber failed: {e}")

    # Strategy 3: pypdf
    try:
        pypdf_docs = _extract_with_pypdf(path_str)
        score = _score_extraction(pypdf_docs)
        results.append((score, pypdf_docs))
        logger.info(f"[PDF] pypdf: {len(pypdf_docs)} pages, score={score:.1f}")
    except Exception as e:
        logger.warning(f"[PDF] pypdf failed: {e}")

    if not results:
        logger.error(f"[PDF] All extraction strategies failed for: {path_str}")
        return []

    # Pick the highest-scoring extraction
    results.sort(key=lambda x: x[0], reverse=True)
    best_score, best_docs = results[0]
    method = best_docs[0].metadata.get("extraction_method", "unknown") if best_docs else "none"
    logger.info(f"[PDF] Selected: {method} (score={best_score:.1f}, {len(best_docs)} pages)")

    # Filter out pure image-only placeholder pages so downstream doesn't waste tokens
    content_pages = [d for d in best_docs if "IMAGE-ONLY" not in d.page_content]
    image_only_count = len(best_docs) - len(content_pages)
    if image_only_count > 0:
        logger.warning(f"[PDF] Skipped {image_only_count} image-only pages (no selectable text)")

    return content_pages if content_pages else best_docs
