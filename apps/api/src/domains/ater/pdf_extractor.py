from pathlib import Path
import logging

logger = logging.getLogger("Ater")

_PyPDFLoader = None
try:
    from langchain_community.document_loaders import PyPDFLoader as _PyPDFLoader
except ImportError:
    pass

def load_pdf_robust(path_str: str):
    """Load a PDF using the best available method. Returns list of documents/namespaces."""
    path = Path(path_str)

    # Strategy 1: langchain_community PyPDFLoader
    if _PyPDFLoader is not None:
        try:
            loader = _PyPDFLoader(path_str)
            pages = loader.load_and_split()
            if pages:
                return pages
        except Exception as e:
            logger.warning(f"[PDF] PyPDFLoader failed ({e}), trying pypdf fallback...")

    # Strategy 2: pypdf directly
    try:
        import pypdf
        from types import SimpleNamespace
        reader = pypdf.PdfReader(str(path))
        docs = []
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            doc = SimpleNamespace(
                page_content=text,
                metadata={"page": i, "source": path_str}
            )
            docs.append(doc)
        if docs:
            return docs
    except Exception as e:
        logger.warning(f"[PDF] pypdf fallback failed ({e}), using empty result")

    return []
