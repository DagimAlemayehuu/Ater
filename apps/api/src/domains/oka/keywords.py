# src/domains/oka/keywords.py

"""
The definitive keyword map for the OKA Domain Router.
Covers the breadth of human knowledge across Natural Sciences, Formal Sciences, 
Social Sciences, Humanities, Applied Sciences, and Arts.
"""

DOMAIN_KEYWORDS = {
    # --- FORMAL SCIENCES ---
    "CS-GENERAL": ["computer science", "algorithms", "data structures", "complexity", "big o", "turing", "computation"],
    "CS-WEB-DEV": ["html", "css", "javascript", "react", "vue", "angular", "dom", "browser", "http", "cookies", "session", "responsive", "frontend", "backend", "fullstack", "typescript", "node.js", "npm", "webpack", "vite", "tailwind"],
    "CS-DATA-SYSTEMS": ["database", "sql", "nosql", "postgres", "mongodb", "schema", "query", "normalization", "acid", "distributed", "spark", "kafka", "etl"],
    "CS-AI-ML": ["machine learning", "neural network", "deep learning", "transformer", "llm", "inference", "training", "weights", "bias", "activation", "gradient", "backpropagation", "supervised", "unsupervised"],
    "CS-CYBER-SEC": ["security", "encryption", "hashing", "firewall", "vulnerability", "exploit", "malware", "phishing", "authentication", "authorization", "oauth", "jwt"],
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
    "EARTH-SCIENCE": ["geology", "meteorology", "oceanography", "plate tectonics", "atmosphere", "climate", "erosion", "volcano", "earthquake"],
    "ASTRONOMY": ["astronomy", "galaxy", "star", "planet", "black hole", "nebula", "cosmology", "big bang", "telescope", "orbit"],

    # --- SOCIAL SCIENCES ---
    "ECON-MICRO": ["microeconomics", "supply", "demand", "elasticity", "marginal cost", "utility", "market failure", "monopoly", "oligopoly", "competition", "equilibrium", "producer", "consumer"],
    "ECON-MACRO": ["macroeconomics", "gdp", "inflation", "unemployment", "monetary policy", "fiscal policy", "central bank", "aggregate demand", "interest rate", "recession", "growth"],
    "POLI-SCIENCE": ["politics", "government", "democracy", "state", "sovereignty", "ideology", "policy", "international relations", "voting", "diplomacy"],
    "SOCIOLOGY": ["sociology", "society", "culture", "norm", "social structure", "stratification", "demographics", "institution", "globalization"],
    "PSYCHOLOGY": ["psychology", "behavior", "cognition", "emotion", "personality", "therapy", "neuroscience", "perception", "memory", "learning"],
    "ANTHROPOLOGY": ["anthropology", "ethnography", "human evolution", "archaeology", "kinship", "ritual", "myth", "linguistic anthropology"],
    "HISTORY-GENERAL": ["history", "era", "civilization", "revolution", "war", "renaissance", "enlightenment", "colonialism", "modernity"],
    "GEOGRAPHY": ["geography", "cartography", "gis", "topography", "demography", "urbanization", "environment", "region"],
    "LAW-GENERAL": ["law", "justice", "jurisdiction", "statute", "precedent", "litigation", "contract", "tort", "crime", "constitutional", "rights"],

    # --- HUMANITIES ---
    "PHILOSOPHY": ["philosophy", "ethics", "metaphysics", "epistemology", "logic", "existentialism", "virtue", "truth", "justice"],
    "LINGUISTICS": ["linguistics", "syntax", "semantics", "phonology", "morphology", "pragmatics", "language", "grammar", "dialect"],
    "LITERATURE": ["literature", "fiction", "poetry", "drama", "narrative", "criticism", "metaphor", "genre", "author"],
    "ARTS-VISUAL": ["painting", "sculpture", "photography", "composition", "style", "medium", "museum", "aesthetics"],
    "ARTS-PERFORMING": ["theater", "dance", "performance", "acting", "choreography", "stage", "audience"],
    "RELIGION": ["religion", "theology", "faith", "ritual", "scripture", "deity", "spirituality", "mythology"],

    # --- APPLIED SCIENCES & PROFESSIONS ---
    "ENGINEERING-MECH": ["mechanical engineering", "thermodynamics", "fluids", "mechanics", "design", "robotics", "manufacturing", "engine"],
    "ENGINEERING-ELEC": ["electrical engineering", "circuit", "signal", "power", "electronics", "microprocessor", "telecom", "semiconductor"],
    "ENGINEERING-CIVIL": ["civil engineering", "structure", "bridge", "road", "hydraulics", "geotechnical", "transportation", "urban planning"],
    "MEDICINE-GENERAL": ["medicine", "health", "anatomy", "physiology", "pathology", "pharmacology", "surgery", "diagnosis", "therapy", "clinical"],
    "BUSINESS-FINANCE": ["finance", "accounting", "marketing", "management", "strategy", "investment", "asset", "liability", "revenue", "profit"],
    "EDUCATION": ["education", "pedagogy", "learning", "curriculum", "instruction", "assessment", "school", "teaching", "literacy"],
    "AGRICULTURE": ["agriculture", "farming", "crop", "soil", "irrigation", "livestock", "sustainability", "pest control"],

    # --- FINE ARTS & CRAFTS ---
    "MUSIC-THEORY": ["music theory", "harmony", "melody", "rhythm", "scale", "chord", "composition", "notation", "tempo", "dynamics"],
    "DESIGN-UX-UI": ["ux design", "ui design", "usability", "wireframe", "prototype", "interaction", "accessibility", "user experience", "interface"],
    "CRAFTSMANSHIP": ["woodworking", "metalworking", "pottery", "textile", "technique", "tool", "material", "craft"]
}
