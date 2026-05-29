# src/domains/ater/keywords.py

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

import re
from typing import List, Dict, Any

def chunk_text(text: str, chunk_size: int = 4000, overlap: int = 1000) -> List[str]:
    """
    Slices a continuous text string into overlapping chunks.
    Cleans leading/trailing whitespace and garbage characters.
    """
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]
        # Clean trailing and leading newlines/junk character boundaries from each slice
        chunk = chunk.strip()
        if chunk:
            chunks.append(chunk)
        # Advance by chunk_size - overlap
        if end == len(text):
            break
        start += (chunk_size - overlap)
    return chunks

def reduce_concepts(atomic_notes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Merges duplicate concept dicts using Title_Case_With_Underscores.
    - Concatenates unique source_contexts.
    - Unions and sorts source_pages.
    - Deduplicates prerequisites.
    """
    merged = {}
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
            seen_pages = set()
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
            new_prereqs = note.get("prerequisites") or []
            for pr in new_prereqs:
                existing_prereqs.add(pr)
            existing["prerequisites"] = list(existing_prereqs)
            
            # Save the longer description
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

    # ── BUDGET CAP (Dynamic Sweet Spot) ──────────────────────
    # Dynamically scale MAX_NOTES based on the total unique pages scanned in the document.
    all_pages = set()
    for note in result:
        for p in note.get("source_pages", []):
            if str(p).isdigit():
                all_pages.add(int(p))
                
    # Sovereign Sweet Spot: 4 to 15 notes per unit
    total_pages = len(all_pages)
    if total_pages > 0:
        dynamic_cap = max(4, min(15, int(total_pages * 0.3) + 4))
    else:
        dynamic_cap = 8
    
    MAX_NOTES = dynamic_cap
    if len(result) > MAX_NOTES:
        # Build prerequisite centrality map: how many notes list each concept as a dependency
        prereq_counts: Dict[str, int] = {}
        for note in result:
            for p in (note.get("prerequisites") or []):
                prereq_counts[p] = prereq_counts.get(p, 0) + 1

        def _concept_score(note: Dict[str, Any]) -> float:
            page_coverage = len(set(note.get("source_pages") or []))          # breadth
            context_depth = len(note.get("source_context") or "") / 200       # substance
            centrality    = prereq_counts.get(note["title"], 0)               # architectural importance
            return (page_coverage * 3.0) + context_depth + (centrality * 2.0)

        result.sort(key=_concept_score, reverse=True)
        kept_notes = result[:MAX_NOTES]
        dropped_notes = result[MAX_NOTES:]
        
        # Merge dropped concepts into kept concepts to preserve coverage!
        kept_titles = {n["title"] for n in kept_notes}
        for d_note in dropped_notes:
            d_title = d_note["title"]
            d_desc = d_note.get("description", "").strip()
            if not d_desc:
                continue
            
            # Find the best matching kept note to absorb this term.
            # Strategy: 1. A kept note that lists this dropped note as a prerequisite,
            #           2. A kept note that shares the same source pages.
            absorber = None
            
            # Check 1: Prerequisite relationship
            for k_note in kept_notes:
                k_prereqs = [p.replace("[[", "").replace("]]", "") for p in (k_note.get("prerequisites") or [])]
                if d_title in k_prereqs:
                    absorber = k_note
                    break
            
            # Check 2: Shared page overlap
            if not absorber:
                d_pages = set(d_note.get("source_pages") or [])
                best_overlap = 0
                for k_note in kept_notes:
                    k_pages = set(k_note.get("source_pages") or [])
                    overlap = len(d_pages.intersection(k_pages))
                    if overlap > best_overlap:
                        best_overlap = overlap
                        absorber = k_note
            
            # Fallback Check 3: Absorb in the first kept note
            if not absorber and kept_notes:
                absorber = kept_notes[0]
                
            if absorber:
                # Inject subconcept definition directly into source context of absorber
                prefix = absorber.get("source_context", "").strip()
                subconcept_text = f"\n\n[SUBCONCEPT DEFINITION] {d_title}: {d_desc}"
                absorber["source_context"] = prefix + subconcept_text
                
                # Union the pages
                seen = set(absorber.get("source_pages") or [])
                for p in d_note.get("source_pages", []):
                    if p not in seen:
                        absorber.setdefault("source_pages", []).append(p)
                        
        result = kept_notes
        print(f"[reduce_concepts] Budget cap: kept top {MAX_NOTES}, consolidated {len(dropped_notes)} secondary concepts.")

    return result

