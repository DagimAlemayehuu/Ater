import re
from typing import Dict, List
from .agents import DOMAIN_MATRIX, MODE_SPECIALITIES

class DomainRouter:
    """
    Deterministic keyword-based router to offload domain classification from LLMs.
    Uses frequency analysis of discipline-specific terminology.
    """
    
    def __init__(self):
        # Build a reverse lookup of keywords to modes
        self.keyword_map: Dict[str, str] = {}
        self._build_keyword_map()

    def _build_keyword_map(self):
        # 1. Use MODE_SPECIALITIES as high-weight keywords
        for mode, specialities in MODE_SPECIALITIES.items():
            for spec in specialities:
                # Clean and tokenize
                words = re.findall(r'\w+', spec.lower())
                for word in words:
                    if len(word) > 3: # Ignore small stop words
                        self.keyword_map[word] = mode

        # 2. Add manual "anchor" keywords for high-risk boundaries
        anchors = {
            "microeconomics": "ECON-MICRO",
            "micro": "ECON-MICRO",
            "supply": "ECON-MICRO",
            "demand": "ECON-MICRO",
            "elasticity": "ECON-MICRO",
            "macroeconomics": "ECON-MACRO",
            "macro": "ECON-MACRO",
            "gdp": "ECON-MACRO",
            "inflation": "ECON-MACRO",
            "unemployment": "ECON-MACRO",
            "central bank": "ECON-MACRO",
            "software": "CS-SOFTWARE",
            "programming": "CS-SOFTWARE",
            "algorithm": "CS-SOFTWARE",
            "database": "CS-DB",
            "sql": "CS-DB",
            "quantum": "PHYSICS-QUANTUM",
            "calculus": "MATH-PURE",
            "integral": "MATH-PURE",
            "derivative": "MATH-PURE",
            "statistics": "MATH-STAT",
            "probability": "MATH-STAT",
            "geometry": "MATH-PURE",
            "algebra": "MATH-PURE",
            "law": "LAW-CASE",
            "contract": "LAW-CONTRACT",
            "criminal": "LAW-CRIMINAL",
            "anatomy": "MED-ANATOMY",
            "pathology": "MED-PATHOLOGY",
            "marketing": "BIZ-MARKETING",
            "strategy": "BIZ-STRATEGY",
        }
        for kw, mode in anchors.items():
            self.keyword_map[kw.lower()] = mode

    def route(self, text: str) -> str:
        """
        Analyzes text and returns the most likely DOMAIN_MATRIX key.
        Returns 'ACADEMIC-GENERAL' if no clear winner is found.
        """
        text_lower = text.lower()
        scores: Dict[str, int] = {}

        # Scan for keywords
        for kw, mode in self.keyword_map.items():
            # Use regex for word boundaries to avoid partial matches
            count = len(re.findall(rf'\b{re.escape(kw)}\b', text_lower))
            if count > 0:
                scores[mode] = scores.get(mode, 0) + count

        if not scores:
            return "ACADEMIC-GENERAL"

        # Find the winner
        winner = max(scores, key=scores.get)
        
        # Confidence check: Winner must have at least 20% lead over runner-up
        sorted_scores = sorted(scores.values(), reverse=True)
        if len(sorted_scores) > 1:
            if sorted_scores[0] < sorted_scores[1] * 1.2:
                # Too close to call, default to general to avoid contamination
                return "ACADEMIC-GENERAL"

        return winner

# Global instance
router = DomainRouter()
