# src/domains/ater/keywords.py

import re

"""
The definitive keyword map for the Ater Domain Router.
Covers the breadth of human knowledge across Natural Sciences, Formal Sciences, 
Social Sciences, Humanities, Applied Sciences, and Arts.
"""

DOMAIN_KEYWORDS = {
    # --- FORMAL SCIENCES ---
    "CS-GENERAL": ["computer science", "algorithms", "data structures", "complexity", "big o", "turing", "computation"],
    "CS-NETWORKS": ["network", "tcp", "ip", "routing", "packet", "osi model", "socket", "dns", "bandwidth", "latency"],
    "CS-OS": ["operating system", "kernel", "process", "thread", "memory management", "file system", "concurrency", "mutex", "deadlock"],
    "CS-WEB-DEV": ["html", "css", "javascript", "react", "vue", "angular", "dom", "browser", "http", "cookies", "session", "responsive", "frontend", "backend", "fullstack", "typescript", "node.js", "npm", "webpack", "vite", "tailwind"],
    "CS-DATA-SYSTEMS": ["database", "sql", "nosql", "postgres", "mongodb", "schema", "query", "normalization", "acid", "distributed", "spark", "kafka", "etl"],
    "CS-AI-ML": ["machine learning", "neural network", "deep learning", "transformer", "llm", "inference", "training", "weights", "bias", "activation", "gradient", "backpropagation", "supervised", "unsupervised"],
    "CS-CYBER-SEC": ["security", "encryption", "hashing", "firewall", "vulnerability", "exploit", "malware", "phishing", "authentication", "authorization", "oauth", "jwt"],
    "MATH-PURE": ["pure mathematics", "topology", "number theory", "real analysis", "complex analysis", "abstract algebra"],
    "MATH-GEOMETRY": ["geometry", "shape", "angle", "euclidean", "trigonometry", "manifold"],
    "MATH-DISCRETE": ["discrete mathematics", "graph theory", "combinatorics", "set theory", "logic", "proof", "induction", "recursion", "modulus"],
    "MATH-CALCULUS": ["calculus", "derivative", "integral", "limit", "function", "continuity", "series", "convergence", "differentiation"],
    "MATH-ALGEBRA": ["linear algebra", "matrix", "vector", "eigenvalue", "determinant", "space", "field", "group theory"],
    "MATH-STATS": ["statistics", "probability", "mean", "median", "variance", "distribution", "hypothesis", "regression", "bayes", "p-value"],

    # --- NATURAL SCIENCES ---
    "PHYS-MECHANICS": ["physics", "mechanics", "force", "mass", "acceleration", "velocity", "gravity", "energy", "work", "power", "momentum", "torque"],
    "PHYS-QUANTUM": ["quantum", "wave", "particle", "electron", "photon", "atom", "uncertainty", "entanglement", "spin", "field theory"],
    "PHYS-THERMO": ["thermodynamics", "entropy", "heat", "temperature", "enthalpy", "gas law", "conduction", "convection"],
    "CHEM-ORGANIC": ["organic chemistry", "carbon", "molecule", "bond", "functional group", "reaction", "synthesis", "polymer", "isomer"],
    "CHEM-INORGANIC": ["inorganic chemistry", "metal", "catalyst", "complex", "crystal", "periodic table", "oxidation", "reduction"],
    "BIO-GENETICS": ["dna", "rna", "gene", "chromosome", "allele", "genotype", "phenotype", "mutation", "crispr", "inheritance", "mendelian"],
    "BIO-CELL": ["cell", "mitochondria", "nucleus", "membrane", "protein", "enzyme", "metabolism", "atp", "organelle"],
    "BIO-ECOLOGY": ["ecology", "ecosystem", "species", "biodiversity", "habitat", "niche", "biomess", "conservation", "evolution", "selection"],
    "EARTH-GEOLOGY": ["geology", "rock", "mineral", "plate tectonics", "erosion", "volcano", "earthquake"],
    "EARTH-METEOROLOGY": ["meteorology", "weather", "atmosphere", "storm", "hurricane"],
    "EARTH-OCEANOGRAPHY": ["oceanography", "ocean", "tide", "current", "marine"],
    "EARTH-CLIMATE": ["climate", "global warming", "carbon cycle", "greenhouse"],
    "ASTRONOMY": ["astronomy", "galaxy", "star", "planet", "black hole", "nebula", "cosmology", "big bang", "telescope", "orbit"],

    # --- SOCIAL SCIENCES ---
    "ECON-MICRO": ["microeconomics", "supply", "demand", "elasticity", "marginal cost", "utility", "market failure", "monopoly", "oligopoly", "competition", "equilibrium", "producer", "consumer"],
    "ECON-FINANCE": ["finance", "asset", "equity", "liability", "investment", "portfolio", "risk", "bond", "stock"],
    "ECON-METRICS": ["econometrics", "statistical model", "regression", "time series", "causality"],
    "ECON-BEHAVIORAL": ["behavioral economics", "nudge", "heuristic", "bias", "prospect theory"],
    "ECON-HISTORY": ["economic history", "industrial revolution", "gold standard", "trade"],
    "ECON-MACRO": ["macroeconomics", "gdp", "inflation", "unemployment", "monetary policy", "fiscal policy", "central bank", "aggregate demand", "interest rate", "recession", "growth"],
    "POLI-SCIENCE": ["politics", "government", "democracy", "state", "sovereignty", "voting", "election"],
    "POLI-THEORY": ["political theory", "ideology", "liberalism", "marxism", "socialism", "fascism"],
    "POLI-RELATIONS": ["international relations", "diplomacy", "geopolitics", "treaty", "united nations"],
    "POLI-POLICY": ["public policy", "welfare", "taxation", "regulation", "healthcare policy"],
    "SOCIOLOGY": ["sociology", "society", "norm", "institution", "socialization"],
    "SOC-STRATIFICATION": ["stratification", "class", "inequality", "mobility", "caste", "status"],
    "SOC-CULTURE": ["culture", "subculture", "counterculture", "cultural capital", "assimilation"],
    "SOC-DEMOGRAPHICS": ["demographics", "population", "migration", "urbanization", "birth rate", "mortality"],
    "PSYCHOLOGY": ["psychology", "mind", "brain", "emotion", "perception"],
    "PSYCH-COGNITIVE": ["cognitive psychology", "memory", "attention", "learning", "problem solving", "heuristics"],
    "PSYCH-CLINICAL": ["clinical psychology", "therapy", "disorder", "depression", "anxiety", "schizophrenia", "dsm"],
    "PSYCH-DEVELOPMENTAL": ["developmental psychology", "childhood", "aging", "piaget", "attachment", "puberty"],
    "PSYCH-BEHAVIORAL": ["behavioral psychology", "conditioning", "reinforcement", "punishment", "skinner", "pavlov"],
    "ANTHROPOLOGY": ["anthropology", "humanity", "kinship", "ritual", "myth"],
    "ANTHRO-ETHNOGRAPHY": ["ethnography", "fieldwork", "participant observation", "tribe"],
    "ANTHRO-ARCHAEOLOGY": ["archaeology", "artifact", "excavation", "ruins", "antiquity"],
    "HISTORY-GENERAL": ["history", "era", "civilization", "revolution", "war", "chronology"],
    "HIST-ANCIENT": ["ancient history", "rome", "greece", "egypt", "mesopotamia", "antiquity"],
    "HIST-MODERN": ["modern history", "world war", "industrialization", "cold war", "imperialism"],
    "HIST-MEDIEVAL": ["medieval history", "middle ages", "feudalism", "crusades", "byzantine"],
    "HIST-REGIONAL": ["regional history", "dynasty", "empire", "kingdom"],
    "GEOGRAPHY": ["geography", "cartography", "topography", "map", "spatial"],
    "GEO-PHYSICAL": ["physical geography", "landform", "biome", "hydrology"],
    "GEO-HUMAN": ["human geography", "demography", "urbanization", "migration", "cultural landscape"],
    "GEO-GIS": ["gis", "geographic information system", "spatial analysis", "remote sensing"],
    "LAW-GENERAL": ["law", "justice", "jurisdiction", "statute", "precedent", "litigation", "rights"],
    "LAW-CONSTITUTIONAL": ["constitutional law", "supreme court", "amendment", "civil rights"],
    "LAW-CONTRACT": ["contract law", "agreement", "breach", "liability", "obligation"],
    "LAW-CRIMINAL": ["criminal law", "felony", "misdemeanor", "prosecution", "defense", "sentence"],
    "LAW-TORT": ["tort law", "negligence", "damages", "injury", "malpractice"],
    "LAW-INTERNATIONAL": ["international law", "treaty", "sovereignty", "geneva convention"],

    # --- HUMANITIES ---
    "PHILOSOPHY": ["philosophy", "thinker", "existentialism", "truth", "reasoning"],
    "PHIL-ETHICS": ["ethics", "morality", "virtue", "utilitarianism", "deontology", "values"],
    "PHIL-METAPHYSICS": ["metaphysics", "ontology", "being", "reality", "space", "time", "free will"],
    "PHIL-EPISTEMOLOGY": ["epistemology", "knowledge", "belief", "truth", "justification", "skepticism"],
    "PHIL-AESTHETICS": ["aesthetics", "beauty", "art", "taste", "sublime"],
    "LINGUISTICS": ["linguistics", "syntax", "semantics", "phonology", "morphology", "pragmatics", "language", "grammar", "dialect"],
    "LITERATURE": ["literature", "fiction", "poetry", "drama", "narrative", "criticism", "metaphor", "genre", "author"],
    "ARTS-VISUAL": ["painting", "sculpture", "photography", "composition", "style", "medium", "museum", "aesthetics"],
    "ARTS-PERFORMING": ["theater", "dance", "performance", "acting", "choreography", "stage", "audience"],
    "ARTS-HISTORY": ["art history", "movement", "impressionism", "surrealism", "cubism", "baroque"],
    "ARTS-THEORY": ["art theory", "criticism", "formalism", "expressionism"],
    "RELIGION": ["religion", "faith", "belief", "sacred", "profane"],
    "REL-THEOLOGY": ["theology", "doctrine", "dogma", "divine", "scripture", "deity"],
    "REL-HISTORY": ["religious history", "schism", "reformation", "prophet"],
    "REL-COMPARATIVE": ["comparative religion", "buddhism", "christianity", "islam", "hinduism", "judaism"],

    # --- APPLIED SCIENCES & PROFESSIONS ---
    "ENGINEERING-MECH": ["mechanical engineering", "thermodynamics", "fluids", "mechanics", "design", "robotics", "manufacturing", "engine"],
    "ENGINEERING-ELEC": ["electrical engineering", "circuit", "signal", "power", "electronics", "microprocessor", "telecom", "semiconductor"],
    "ENGINEERING-CIVIL": ["civil engineering", "structure", "bridge", "road", "hydraulics", "geotechnical", "transportation", "urban planning"],
    "ENGINEERING-CHEM": ["chemical engineering", "process", "reactor", "separation", "transport phenomena", "materials"],
    "ENGINEERING-AERO": ["aerospace engineering", "aerodynamics", "propulsion", "aircraft", "spacecraft", "orbital mechanics"],
    "ENGINEERING-SOFTWARE": ["software engineering", "agile", "scrum", "architecture", "design pattern", "testing", "ci/cd", "version control"],
    "MEDICINE-GENERAL": ["medicine", "health", "diagnosis", "clinical", "disease", "patient"],
    "MED-ANATOMY": ["anatomy", "organ", "tissue", "skeleton", "muscle", "nervous system"],
    "MED-PHYSIOLOGY": ["physiology", "homeostasis", "blood pressure", "heart rate", "hormone", "respiration"],
    "MED-PHARMA": ["pharmacology", "drug", "dosage", "side effect", "receptor", "toxicity"],
    "MED-SURGERY": ["surgery", "operation", "incision", "anesthesia", "suture"],
    "BUSINESS-FINANCE": ["finance", "investment", "asset", "liability", "revenue", "profit"],
    "BIZ-MARKETING": ["marketing", "advertising", "brand", "consumer", "campaign", "pricing"],
    "BIZ-STRATEGY": ["business strategy", "competitive advantage", "porter", "swot", "value chain", "merger"],
    "BIZ-OPERATIONS": ["operations management", "supply chain", "logistics", "inventory", "quality control", "six sigma"],
    "BIZ-MANAGEMENT": ["management", "leadership", "organization", "hr", "motivation", "delegation"],
    "BIZ-ACCOUNTING": ["accounting", "balance sheet", "income statement", "cash flow", "audit", "tax", "ledger"],
    "EDUCATION": ["education", "school", "teaching", "literacy", "classroom", "inclusiveness", "inclusion", "inclusive", "special needs", "disability", "diversity", "stakeholder", "collaboration", "partnership", "community development", "participation"],
    "EDU-PEDAGOGY": ["pedagogy", "instruction", "scaffolding", "constructivism", "differentiation"],
    "EDU-CURRICULUM": ["curriculum", "syllabus", "lesson plan", "standards", "rubric"],
    "EDU-ASSESSMENT": ["assessment", "evaluation", "grading", "formative", "summative", "standardized test"],
    "EDU-TECHNOLOGY": ["educational technology", "edtech", "e-learning", "lms", "blended learning"],
    "AGRICULTURE": ["agriculture", "farming", "soil", "irrigation", "sustainability", "pest control"],
    "AGRI-FARMING": ["farming", "harvest", "tractor", "plow", "cultivation"],
    "AGRI-CROP": ["crop", "yield", "fertilizer", "seed", "wheat", "corn", "rice"],
    "AGRI-LIVESTOCK": ["livestock", "cattle", "poultry", "grazing", "pasture", "dairy"],

    # --- FINE ARTS & CRAFTS ---
    "MUSIC-THEORY": ["music theory", "harmony", "melody", "rhythm", "scale", "chord", "notation", "tempo", "dynamics"],
    "MUSIC-HISTORY": ["music history", "classical", "baroque", "romantic", "jazz", "blues", "genre"],
    "MUSIC-COMPOSITION": ["composition", "arrangement", "score", "orchestration", "counterpoint"],
    "MUSIC-PERFORMANCE": ["performance", "instrument", "vocal", "choir", "orchestra", "recital", "acoustic"],
    "DESIGN-UX-UI": ["ux design", "ui design", "usability", "wireframe", "prototype", "interaction", "accessibility", "user experience", "interface"],
    "DESIGN-GRAPHIC": ["graphic design", "typography", "layout", "color theory", "logo", "branding", "vector"],
    "DESIGN-INDUSTRIAL": ["industrial design", "product design", "ergonomics", "cad", "manufacturing", "material"],
    "DESIGN-FASHION": ["fashion design", "garment", "fabric", "textile", "pattern", "apparel", "sewing"],
    "CRAFTSMANSHIP": ["craftsmanship", "technique", "tool", "artisan", "handmade"],
    "CRAFT-WOOD": ["woodworking", "carpentry", "timber", "carving", "joinery", "furniture"],
    "CRAFT-METAL": ["metalworking", "welding", "forging", "blacksmithing", "casting", "alloy"],
    "CRAFT-TEXTILE": ["textile", "weaving", "knitting", "sewing", "yarn", "fabric", "loom"],
    "LOGIC-FORMAL": ["formal logic", "propositional", "predicate", "syllogism", "deduction", "validity"],
    "MATH-LOGIC": ["mathematical logic", "boolean algebra", "truth table", "gödel", "incompleteness"],
    "COSMOLOGY": ["cosmology", "universe", "expansion", "dark matter", "dark energy", "relativity"],
    "ASTROPHYSICS": ["astrophysics", "stellar", "fusion", "spectroscopy", "radiation", "luminosity"]
}

from typing import List, Dict, Any
import math
import re as _re


def chunk_text(text: str, chunk_size: int = 4000, overlap: int = 1000) -> List[str]:
    """
    Slices a continuous text string into overlapping chunks.
    Cleans leading/trailing whitespace and garbage characters.
    chunk_size and overlap are in characters.
    """
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start += (chunk_size - overlap)
    return chunks


def compute_note_budget(full_text: str) -> int:
    """
    Compute the ideal number of atomic notes for a PDF based on content length.
    Rule: ~1 note per 400 words of actual content (words, not chars).
    Floor: 5 notes. No ceiling — coverage is always the goal.
    """
    word_count = len(full_text.split())
    budget = max(5, word_count // 400)
    print(f"[note_budget] PDF word count: {word_count} → target note budget: {budget}")
    return budget


def _build_vocab(notes: List[Dict[str, Any]]) -> Dict[str, int]:
    """Build a shared vocabulary index from note titles and descriptions."""
    vocab: Dict[str, int] = {}
    for note in notes:
        text = f"{note.get('title', '')} {note.get('description', '')}"
        for w in _re.findall(r'[a-z]{3,}', text.lower()):
            if w not in vocab:
                vocab[w] = len(vocab)
    return vocab


def _tfidf_vector(text: str, vocab: Dict[str, int]) -> Dict[int, float]:
    """Build a simple TF vector over the shared vocab."""
    words = _re.findall(r'[a-z]{3,}', text.lower())
    tf: Dict[int, float] = {}
    for w in words:
        if w in vocab:
            idx = vocab[w]
            tf[idx] = tf.get(idx, 0) + 1
    total = sum(tf.values()) or 1
    return {k: v / total for k, v in tf.items()}


def _cosine(v1: Dict[int, float], v2: Dict[int, float]) -> float:
    """Cosine similarity between two sparse TF vectors."""
    if not v1 or not v2:
        return 0.0
    dot = sum(v1.get(k, 0.0) * v2.get(k, 0.0) for k in v2)
    mag1 = math.sqrt(sum(x * x for x in v1.values()))
    mag2 = math.sqrt(sum(x * x for x in v2.values()))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)


def _semantic_dedup(notes: List[Dict[str, Any]], threshold: float = 0.82) -> List[Dict[str, Any]]:
    """
    Remove semantic duplicates using lightweight TF cosine similarity.
    For each pair of notes with similarity > threshold, keep the one with
    more source_pages (richer evidence); discard the weaker duplicate.
    O(n^2) — acceptable for typical note counts (< 500).
    """
    if len(notes) <= 1:
        return notes

    vocab = _build_vocab(notes)
    vectors = []
    for note in notes:
        text = f"{note.get('title', '')} {note.get('description', '')}"
        vectors.append(_tfidf_vector(text, vocab))

    removed: set = set()
    n = len(notes)
    for i in range(n):
        if i in removed:
            continue
        for j in range(i + 1, n):
            if j in removed:
                continue
            sim = _cosine(vectors[i], vectors[j])
            if sim >= threshold:
                # Keep the note with more source evidence
                pages_i = len(notes[i].get('source_pages', []))
                pages_j = len(notes[j].get('source_pages', []))
                loser = j if pages_i >= pages_j else i
                winner = i if loser == j else j
                removed.add(loser)
                print(
                    f"[semantic_dedup] Merged '{notes[loser]['title']}' into "
                    f"'{notes[winner]['title']}' (sim={sim:.2f})"
                )

    return [note for idx, note in enumerate(notes) if idx not in removed]


def reduce_concepts(atomic_notes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Merges duplicate concept dicts using Title_Case_With_Underscores.
    Pipeline:
      1. Lexical merge by sanitized title (merge contexts, pages, prereqs)
      2. Garbage-title filter (course codes, slide numbers, sentence frags)
      3. Semantic dedup — catches same-concept different-title duplicates
         using lightweight TF cosine similarity (threshold=0.82)
    Coverage is the goal: no hard note count cap is applied.
    """
    merged: Dict[str, Any] = {}
    from .validator import AterValidator

    for note in atomic_notes:
        raw_title = note.get("title", "")
        sanitized_title = AterValidator.sanitize_title(raw_title)
        if not sanitized_title:
            continue

        if sanitized_title not in merged:
            merged[sanitized_title] = {
                "title": sanitized_title,
                "description": note.get("description", ""),
                "source_context": note.get("source_context", "") or "",
                "source_pages": list(note.get("source_pages", []) or []),
                "prerequisites": list(note.get("prerequisites", []) or []),
                "concept_modality": note.get("concept_modality", "Qualitative/Definitional"),
                "mode": note.get("mode", ""),
            }
        else:
            existing = merged[sanitized_title]

            # Combine source contexts cleanly with double newlines
            existing_contexts = [c.strip() for c in existing["source_context"].split("\n\n") if c.strip()]
            new_context = (note.get("source_context") or "").strip()
            if new_context and new_context not in existing_contexts:
                existing_contexts.append(new_context)
            existing["source_context"] = "\n\n".join(existing_contexts)

            # Union pages while preserving priority order
            seen_pages: set = set()
            merged_pages = []
            for p in existing.get("source_pages", []):
                if str(p).isdigit():
                    p_int = int(p)
                    if p_int not in seen_pages:
                        seen_pages.add(p_int)
                        merged_pages.append(p_int)
            for p in (note.get("source_pages") or []):
                if str(p).isdigit():
                    p_int = int(p)
                    if p_int not in seen_pages:
                        seen_pages.add(p_int)
                        merged_pages.append(p_int)
            existing["source_pages"] = merged_pages

            # Deduplicate prerequisites
            existing_prereqs = set(existing["prerequisites"])
            for pr in (note.get("prerequisites") or []):
                existing_prereqs.add(pr)
            existing["prerequisites"] = list(existing_prereqs)

            # Keep the longer description
            desc1 = existing["description"] or ""
            desc2 = note.get("description") or ""
            if len(desc2) > len(desc1):
                existing["description"] = desc2

            # Mode & Modality fallbacks
            if not existing["mode"] and note.get("mode"):
                existing["mode"] = note.get("mode")
            if not existing["concept_modality"] and note.get("concept_modality"):
                existing["concept_modality"] = note.get("concept_modality")

    result = list(merged.values())

    # ── METADATA / GARBAGE TITLE FILTER (Python-level, LLM-agnostic) ─────────
    _METADATA_PATTERN = _re.compile(
        r"^(?:"
        r"(?:[A-Z][a-z]?[_\s:]*\d+(?:[_:\s]|$))"
        r"|(?:Lecture|Week|Slide|Chapter|Unit|Module"
        r"|Section|Lab|Quiz|Test|Exam|Hw|Ps|Assignment)[_\s]*\d+"
        r"|(?:Part|Topic)[_\s]*\d+"
        r"|Essentially[_\s]"
        r"|\d+[_\s]"
        r"|(?:If|As|When|For|In|Using|Creating|Given"
        r"|Since|Although|Because|While|After|Before)"
        r"[_\s](?:[A-Z][a-z_]+[_\s]){2}"
        r")",
        _re.IGNORECASE,
    )

    _GENERIC_TITLES = {
        "Contents", "Introduction", "Summary", "Overview", "Appendix",
        "Outline", "Preface", "Index", "Foreword", "Conclusion",
        "References", "Bibliography", "Objectives", "Topics",
    }

    def _is_garbage_title(title: str) -> bool:
        if _METADATA_PATTERN.match(title):
            return True
        if title in _GENERIC_TITLES:
            return True
        if "," in title or "." in title:
            return True
        word_count = len([w for w in title.split("_") if w])
        if word_count >= 7:
            return True
        return False

    before_filter = len(result)
    result = [n for n in result if not _is_garbage_title(n["title"])]
    if len(result) < before_filter:
        print(f"[reduce_concepts] Garbage filter removed {before_filter - len(result)} artefact titles.")

    # ── SEMANTIC DEDUP (catches same concept with different title) ─────────────
    before_semantic = len(result)
    result = _semantic_dedup(result)
    if len(result) < before_semantic:
        print(f"[reduce_concepts] Semantic dedup removed {before_semantic - len(result)} near-duplicate concepts.")

    print(f"[reduce_concepts] Final concept count: {len(result)} (coverage-first — no cap applied).")
    return result

