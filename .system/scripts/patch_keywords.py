import sys

def patch_file(path, patches):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in patches:
        if old not in content:
            print(f"Error: Could not find snippet in {path}\n{old[:100]}...")
            sys.exit(1)
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {path}")

# KEYWORDS.PY
keywords_patches = [
(
r'''    "EARTH-SCIENCE": ["geology", "meteorology", "oceanography", "plate tectonics", "atmosphere", "climate", "erosion", "volcano", "earthquake"],''',
r'''    "EARTH-GEOLOGY": ["geology", "rock", "mineral", "plate tectonics", "erosion", "volcano", "earthquake"],
    "EARTH-METEOROLOGY": ["meteorology", "weather", "atmosphere", "storm", "hurricane"],
    "EARTH-OCEANOGRAPHY": ["oceanography", "ocean", "tide", "current", "marine"],
    "EARTH-CLIMATE": ["climate", "global warming", "carbon cycle", "greenhouse"],'''
),
(
r'''    "MATH-DISCRETE": ["discrete mathematics", "graph theory", "combinatorics", "set theory", "logic", "proof", "induction", "recursion", "modulus"],''',
r'''    "MATH-PURE": ["pure mathematics", "topology", "number theory", "real analysis", "complex analysis", "abstract algebra"],
    "MATH-GEOMETRY": ["geometry", "shape", "angle", "euclidean", "trigonometry", "manifold"],
    "MATH-DISCRETE": ["discrete mathematics", "graph theory", "combinatorics", "set theory", "logic", "proof", "induction", "recursion", "modulus"],'''
),
(
r'''    "CS-GENERAL": ["computer science", "algorithms", "data structures", "complexity", "big o", "turing", "computation"],''',
r'''    "CS-GENERAL": ["computer science", "algorithms", "data structures", "complexity", "big o", "turing", "computation"],
    "CS-NETWORKS": ["network", "tcp", "ip", "routing", "packet", "osi model", "socket", "dns", "bandwidth", "latency"],
    "CS-OS": ["operating system", "kernel", "process", "thread", "memory management", "file system", "concurrency", "mutex", "deadlock"],'''
),
(
r'''    "ECON-MICRO": ["microeconomics", "supply", "demand", "elasticity", "marginal cost", "utility", "market failure", "monopoly", "oligopoly", "competition", "equilibrium", "producer", "consumer"],''',
r'''    "ECON-MICRO": ["microeconomics", "supply", "demand", "elasticity", "marginal cost", "utility", "market failure", "monopoly", "oligopoly", "competition", "equilibrium", "producer", "consumer"],
    "ECON-FINANCE": ["finance", "asset", "equity", "liability", "investment", "portfolio", "risk", "bond", "stock"],
    "ECON-METRICS": ["econometrics", "statistical model", "regression", "time series", "causality"],
    "ECON-BEHAVIORAL": ["behavioral economics", "nudge", "heuristic", "bias", "prospect theory"],
    "ECON-HISTORY": ["economic history", "industrial revolution", "gold standard", "trade"],'''
),
(
r'''    "POLI-SCIENCE": ["politics", "government", "democracy", "state", "sovereignty", "ideology", "policy", "international relations", "voting", "diplomacy"],''',
r'''    "POLI-SCIENCE": ["politics", "government", "democracy", "state", "sovereignty", "voting", "election"],
    "POLI-THEORY": ["political theory", "ideology", "liberalism", "marxism", "socialism", "fascism"],
    "POLI-RELATIONS": ["international relations", "diplomacy", "geopolitics", "treaty", "united nations"],
    "POLI-POLICY": ["public policy", "welfare", "taxation", "regulation", "healthcare policy"],'''
),
(
r'''    "SOCIOLOGY": ["sociology", "society", "culture", "norm", "social structure", "stratification", "demographics", "institution", "globalization"],''',
r'''    "SOCIOLOGY": ["sociology", "society", "norm", "institution", "socialization"],
    "SOC-STRATIFICATION": ["stratification", "class", "inequality", "mobility", "caste", "status"],
    "SOC-CULTURE": ["culture", "subculture", "counterculture", "cultural capital", "assimilation"],
    "SOC-DEMOGRAPHICS": ["demographics", "population", "migration", "urbanization", "birth rate", "mortality"],'''
),
(
r'''    "PSYCHOLOGY": ["psychology", "behavior", "cognition", "emotion", "personality", "therapy", "neuroscience", "perception", "memory", "learning"],''',
r'''    "PSYCHOLOGY": ["psychology", "mind", "brain", "emotion", "perception"],
    "PSYCH-COGNITIVE": ["cognitive psychology", "memory", "attention", "learning", "problem solving", "heuristics"],
    "PSYCH-CLINICAL": ["clinical psychology", "therapy", "disorder", "depression", "anxiety", "schizophrenia", "dsm"],
    "PSYCH-DEVELOPMENTAL": ["developmental psychology", "childhood", "aging", "piaget", "attachment", "puberty"],
    "PSYCH-BEHAVIORAL": ["behavioral psychology", "conditioning", "reinforcement", "punishment", "skinner", "pavlov"],'''
),
(
r'''    "ANTHROPOLOGY": ["anthropology", "ethnography", "human evolution", "archaeology", "kinship", "ritual", "myth", "linguistic anthropology"],''',
r'''    "ANTHROPOLOGY": ["anthropology", "humanity", "kinship", "ritual", "myth"],
    "ANTHRO-ETHNOGRAPHY": ["ethnography", "fieldwork", "participant observation", "tribe"],
    "ANTHRO-ARCHAEOLOGY": ["archaeology", "artifact", "excavation", "ruins", "antiquity"],'''
),
(
r'''    "HISTORY-GENERAL": ["history", "era", "civilization", "revolution", "war", "renaissance", "enlightenment", "colonialism", "modernity"],''',
r'''    "HISTORY-GENERAL": ["history", "era", "civilization", "revolution", "war", "chronology"],
    "HIST-ANCIENT": ["ancient history", "rome", "greece", "egypt", "mesopotamia", "antiquity"],
    "HIST-MODERN": ["modern history", "world war", "industrialization", "cold war", "imperialism"],
    "HIST-MEDIEVAL": ["medieval history", "middle ages", "feudalism", "crusades", "byzantine"],
    "HIST-REGIONAL": ["regional history", "dynasty", "empire", "kingdom"],'''
),
(
r'''    "GEOGRAPHY": ["geography", "cartography", "gis", "topography", "demography", "urbanization", "environment", "region"],''',
r'''    "GEOGRAPHY": ["geography", "cartography", "topography", "map", "spatial"],
    "GEO-PHYSICAL": ["physical geography", "landform", "biome", "hydrology"],
    "GEO-HUMAN": ["human geography", "demography", "urbanization", "migration", "cultural landscape"],
    "GEO-GIS": ["gis", "geographic information system", "spatial analysis", "remote sensing"],'''
),
(
r'''    "LAW-GENERAL": ["law", "justice", "jurisdiction", "statute", "precedent", "litigation", "contract", "tort", "crime", "constitutional", "rights"],''',
r'''    "LAW-GENERAL": ["law", "justice", "jurisdiction", "statute", "precedent", "litigation", "rights"],
    "LAW-CONSTITUTIONAL": ["constitutional law", "supreme court", "amendment", "civil rights"],
    "LAW-CONTRACT": ["contract law", "agreement", "breach", "liability", "obligation"],
    "LAW-CRIMINAL": ["criminal law", "felony", "misdemeanor", "prosecution", "defense", "sentence"],
    "LAW-TORT": ["tort law", "negligence", "damages", "injury", "malpractice"],
    "LAW-INTERNATIONAL": ["international law", "treaty", "sovereignty", "geneva convention"],'''
),
(
r'''    "PHILOSOPHY": ["philosophy", "ethics", "metaphysics", "epistemology", "logic", "existentialism", "virtue", "truth", "justice"],''',
r'''    "PHILOSOPHY": ["philosophy", "thinker", "existentialism", "truth", "reasoning"],
    "PHIL-ETHICS": ["ethics", "morality", "virtue", "utilitarianism", "deontology", "values"],
    "PHIL-METAPHYSICS": ["metaphysics", "ontology", "being", "reality", "space", "time", "free will"],
    "PHIL-EPISTEMOLOGY": ["epistemology", "knowledge", "belief", "truth", "justification", "skepticism"],
    "PHIL-AESTHETICS": ["aesthetics", "beauty", "art", "taste", "sublime"],'''
),
(
r'''    "ARTS-VISUAL": ["painting", "sculpture", "photography", "composition", "style", "medium", "museum", "aesthetics"],
    "ARTS-PERFORMING": ["theater", "dance", "performance", "acting", "choreography", "stage", "audience"],''',
r'''    "ARTS-VISUAL": ["painting", "sculpture", "photography", "composition", "style", "medium", "museum", "aesthetics"],
    "ARTS-PERFORMING": ["theater", "dance", "performance", "acting", "choreography", "stage", "audience"],
    "ARTS-HISTORY": ["art history", "movement", "impressionism", "surrealism", "cubism", "baroque"],
    "ARTS-THEORY": ["art theory", "criticism", "formalism", "expressionism"],'''
),
(
r'''    "RELIGION": ["religion", "theology", "faith", "ritual", "scripture", "deity", "spirituality", "mythology"],''',
r'''    "RELIGION": ["religion", "faith", "belief", "sacred", "profane"],
    "REL-THEOLOGY": ["theology", "doctrine", "dogma", "divine", "scripture", "deity"],
    "REL-HISTORY": ["religious history", "schism", "reformation", "prophet"],
    "REL-COMPARATIVE": ["comparative religion", "buddhism", "christianity", "islam", "hinduism", "judaism"],'''
),
(
r'''    "ENGINEERING-MECH": ["mechanical engineering", "thermodynamics", "fluids", "mechanics", "design", "robotics", "manufacturing", "engine"],
    "ENGINEERING-ELEC": ["electrical engineering", "circuit", "signal", "power", "electronics", "microprocessor", "telecom", "semiconductor"],
    "ENGINEERING-CIVIL": ["civil engineering", "structure", "bridge", "road", "hydraulics", "geotechnical", "transportation", "urban planning"],''',
r'''    "ENGINEERING-MECH": ["mechanical engineering", "thermodynamics", "fluids", "mechanics", "design", "robotics", "manufacturing", "engine"],
    "ENGINEERING-ELEC": ["electrical engineering", "circuit", "signal", "power", "electronics", "microprocessor", "telecom", "semiconductor"],
    "ENGINEERING-CIVIL": ["civil engineering", "structure", "bridge", "road", "hydraulics", "geotechnical", "transportation", "urban planning"],
    "ENGINEERING-CHEM": ["chemical engineering", "process", "reactor", "separation", "transport phenomena", "materials"],
    "ENGINEERING-AERO": ["aerospace engineering", "aerodynamics", "propulsion", "aircraft", "spacecraft", "orbital mechanics"],
    "ENGINEERING-SOFTWARE": ["software engineering", "agile", "scrum", "architecture", "design pattern", "testing", "ci/cd", "version control"],'''
),
(
r'''    "MEDICINE-GENERAL": ["medicine", "health", "anatomy", "physiology", "pathology", "pharmacology", "surgery", "diagnosis", "therapy", "clinical"],''',
r'''    "MEDICINE-GENERAL": ["medicine", "health", "diagnosis", "clinical", "disease", "patient"],
    "MED-ANATOMY": ["anatomy", "organ", "tissue", "skeleton", "muscle", "nervous system"],
    "MED-PHYSIOLOGY": ["physiology", "homeostasis", "blood pressure", "heart rate", "hormone", "respiration"],
    "MED-PHARMA": ["pharmacology", "drug", "dosage", "side effect", "receptor", "toxicity"],
    "MED-SURGERY": ["surgery", "operation", "incision", "anesthesia", "suture"],'''
),
(
r'''    "BUSINESS-FINANCE": ["finance", "accounting", "marketing", "management", "strategy", "investment", "asset", "liability", "revenue", "profit"],''',
r'''    "BUSINESS-FINANCE": ["finance", "investment", "asset", "liability", "revenue", "profit"],
    "BIZ-MARKETING": ["marketing", "advertising", "brand", "consumer", "campaign", "pricing"],
    "BIZ-STRATEGY": ["business strategy", "competitive advantage", "porter", "swot", "value chain", "merger"],
    "BIZ-OPERATIONS": ["operations management", "supply chain", "logistics", "inventory", "quality control", "six sigma"],
    "BIZ-MANAGEMENT": ["management", "leadership", "organization", "hr", "motivation", "delegation"],
    "BIZ-ACCOUNTING": ["accounting", "balance sheet", "income statement", "cash flow", "audit", "tax", "ledger"],'''
),
(
r'''    "EDUCATION": ["education", "pedagogy", "learning", "curriculum", "instruction", "assessment", "school", "teaching", "literacy"],''',
r'''    "EDUCATION": ["education", "school", "teaching", "literacy", "classroom"],
    "EDU-PEDAGOGY": ["pedagogy", "instruction", "scaffolding", "constructivism", "differentiation"],
    "EDU-CURRICULUM": ["curriculum", "syllabus", "lesson plan", "standards", "rubric"],
    "EDU-ASSESSMENT": ["assessment", "evaluation", "grading", "formative", "summative", "standardized test"],
    "EDU-TECHNOLOGY": ["educational technology", "edtech", "e-learning", "lms", "blended learning"],'''
),
(
r'''    "AGRICULTURE": ["agriculture", "farming", "crop", "soil", "irrigation", "livestock", "sustainability", "pest control"],''',
r'''    "AGRICULTURE": ["agriculture", "farming", "soil", "irrigation", "sustainability", "pest control"],
    "AGRI-FARMING": ["farming", "harvest", "tractor", "plow", "cultivation"],
    "AGRI-CROP": ["crop", "yield", "fertilizer", "seed", "wheat", "corn", "rice"],
    "AGRI-LIVESTOCK": ["livestock", "cattle", "poultry", "grazing", "pasture", "dairy"],'''
),
(
r'''    "MUSIC-THEORY": ["music theory", "harmony", "melody", "rhythm", "scale", "chord", "composition", "notation", "tempo", "dynamics"],''',
r'''    "MUSIC-THEORY": ["music theory", "harmony", "melody", "rhythm", "scale", "chord", "notation", "tempo", "dynamics"],
    "MUSIC-HISTORY": ["music history", "classical", "baroque", "romantic", "jazz", "blues", "genre"],
    "MUSIC-COMPOSITION": ["composition", "arrangement", "score", "orchestration", "counterpoint"],
    "MUSIC-PERFORMANCE": ["performance", "instrument", "vocal", "choir", "orchestra", "recital", "acoustic"],'''
),
(
r'''    "DESIGN-UX-UI": ["ux design", "ui design", "usability", "wireframe", "prototype", "interaction", "accessibility", "user experience", "interface"],''',
r'''    "DESIGN-UX-UI": ["ux design", "ui design", "usability", "wireframe", "prototype", "interaction", "accessibility", "user experience", "interface"],
    "DESIGN-GRAPHIC": ["graphic design", "typography", "layout", "color theory", "logo", "branding", "vector"],
    "DESIGN-INDUSTRIAL": ["industrial design", "product design", "ergonomics", "cad", "manufacturing", "material"],
    "DESIGN-FASHION": ["fashion design", "garment", "fabric", "textile", "pattern", "apparel", "sewing"],'''
),
(
r'''    "CRAFTSMANSHIP": ["woodworking", "metalworking", "pottery", "textile", "technique", "tool", "material", "craft"]''',
r'''    "CRAFTSMANSHIP": ["craftsmanship", "technique", "tool", "artisan", "handmade"],
    "CRAFT-WOOD": ["woodworking", "carpentry", "timber", "carving", "joinery", "furniture"],
    "CRAFT-METAL": ["metalworking", "welding", "forging", "blacksmithing", "casting", "alloy"],
    "CRAFT-TEXTILE": ["textile", "weaving", "knitting", "sewing", "yarn", "fabric", "loom"],
    "LOGIC-FORMAL": ["formal logic", "propositional", "predicate", "syllogism", "deduction", "validity"],
    "MATH-LOGIC": ["mathematical logic", "boolean algebra", "truth table", "gödel", "incompleteness"],
    "COSMOLOGY": ["cosmology", "universe", "expansion", "dark matter", "dark energy", "relativity"],
    "ASTROPHYSICS": ["astrophysics", "stellar", "fusion", "spectroscopy", "radiation", "luminosity"]'''
)
]
patch_file("apps/api/src/domains/ater/keywords.py", keywords_patches)
