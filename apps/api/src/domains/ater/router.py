import re
import json
from typing import Dict, Any
from .agents import MODE_SPECIALITIES, normalize_mode
from .keywords import DOMAIN_KEYWORDS

class DomainRouter:
    """
    Deterministic keyword-based router to offload domain classification from LLMs.
    Uses frequency analysis of discipline-specific terminology from keywords.py.
    """
    
    def __init__(self):
        # Build a reverse lookup of keywords to modes
        self.keyword_map: Dict[str, str] = {}
        self._build_keyword_map()

    def _build_keyword_map(self):
        # 1. Use canonical keywords from keywords.py
        for mode, keywords in DOMAIN_KEYWORDS.items():
            for kw in keywords:
                # Store multi-word keywords as-is for exact matching
                self.keyword_map[kw.lower()] = mode

        # 2. Integrate MODE_SPECIALITIES for high-level coverage
        for mode, specialities in MODE_SPECIALITIES.items():
            for spec in specialities:
                words = re.findall(r'\w+', spec.lower())
                for word in words:
                    if len(word) > 3 and word not in self.keyword_map:
                        self.keyword_map[word] = mode

    def route(self, text: str, parent_mode: str = None, course: str = "") -> str:
        """
        Analyzes text and returns the most likely DOMAIN_MATRIX key.
        Uses multi-word keyword matching and frequency analysis.
        """
        # 1. Course Lock (Highest Priority)
        if course:
            c_lower = course.lower()
            # Fast-path deterministic course → domain mapping
            # ORDER MATTERS: more specific entries first
            course_map = [
                # Education / social inclusion
                ("special needs education", "EDUCATION"),
                ("inclusive education", "EDUCATION"),
                ("inclusiveness",       "EDUCATION"),
                ("inclusion",           "EDUCATION"),
                ("disability",          "EDUCATION"),
                ("diversity",           "EDUCATION"),
                ("education",           "EDUCATION"),
                # Statistics / Probability — must come BEFORE economics to avoid ECON-METRICS bleed
                ("statistics",          "MATH-STAT"),
                ("probability",         "MATH-STAT"),
                ("data science",        "MATH-STAT"),
                ("data analysis",       "MATH-STAT"),
                ("biostatistics",       "MATH-STAT"),
                ("actuarial",           "MATH-STAT"),
                # Economics specialisations
                ("microeconomics",      "ECON-MICRO"),
                ("macroeconomics",      "ECON-MACRO"),
                ("econometrics",        "ECON-METRICS"),
                ("behavioral economics","ECON-BEHAVIORAL"),
                ("finance",             "ECON-FINANCE"),
                ("economics",           "ECON-MICRO"),   # default econ → micro
                # Sciences
                ("chemistry",           "CHEMISTRY"),
                ("organic chemistry",   "CHEM-ORGANIC"),
                ("biology",             "BIOLOGY"),
                ("physics",             "PHYSICS-KINEMATICS"),
                # Computer Science
                ("object oriented programming", "CS-SOFTWARE"),
                ("object-oriented programming", "CS-SOFTWARE"),
                ("oop with java",       "CS-SOFTWARE"),
                ("java programming",    "CS-SOFTWARE"),
                ("programming in java", "CS-SOFTWARE"),
                ("java",                "CS-SOFTWARE"),
                ("oop",                 "CS-SOFTWARE"),
                ("web development",     "CS-WEB-DEV"),
                ("html",                "CS-WEB-DEV"),
                ("javascript",          "CS-WEB-DEV"),
                ("computer programming","CS-SOFTWARE"),
                ("software engineering","CS-SOFTWARE"),
                ("software",            "CS-SOFTWARE"),
                ("database",            "CS-DB"),
                ("networking",          "CS-NETWORKING"),
                ("cybersecurity",       "CS-CYBERSECURITY"),
                ("machine learning",    "CS-AI"),
                ("artificial intelligence", "CS-AI"),
                # Math
                ("calculus",            "MATH-CALCULUS"),
                ("algebra",             "MATH-ALGEBRA"),
                ("discrete mathematics","MATH-DISCRETE"),
                ("mathematics",         "MATH-PURE"),
                ("math",                "MATH-PURE"),
                # Other
                ("philosophy",          "PHILOSOPHY"),
                ("law",                 "LAW-CASE"),
                ("history",             "HIST-CATALYST"),
            ]
            for keyword, mode in course_map:
                if keyword in c_lower:
                    return mode

        # 2. Keyword Frequency Analysis
        text_lower = text.lower()
        
        scores: Dict[str, float] = {mode: 0.0 for mode in set(self.keyword_map.values())}
        total_matches = 0
        
        # Check for multi-word keywords first (Greedy match)
        for kw, mode in self.keyword_map.items():
            if " " in kw:
                count = text_lower.count(kw)
                if count > 0:
                    scores[mode] += (count * 2.5) # Weight multi-word phrases higher
                    total_matches += count

        # Check for single-word keywords
        words = re.findall(r'\w+', text_lower)
        for word in words:
            if word in self.keyword_map:
                mode = self.keyword_map[word]
                scores[mode] += 1.0
                total_matches += 1

        if total_matches == 0:
            return normalize_mode(parent_mode, "DOMAIN-UNKNOWN") if parent_mode else "DOMAIN-UNKNOWN"

        # 3. Confidence Threshold (v30.0 Pantheon)
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_mode, top_count = sorted_scores[0]
        
        # Gravitational Anchor
        if parent_mode and parent_mode in scores:
            if top_mode != parent_mode:
                boosted_parent_count = scores[parent_mode] * 1.5
                if boosted_parent_count >= top_count:
                    top_mode = parent_mode
                    top_count = boosted_parent_count

        confidence = top_count / total_matches

        # Log for debugging low confidence
        if confidence < 0.40:
            import logging
            logging.getLogger("Ater").warning(f"[Taxonomy Gap] Confidence: {confidence:.2f} for top_mode: {top_mode}. Text snippet: {text[:50]}...")
        if confidence < 0.25:
            return normalize_mode(parent_mode, "DOMAIN-UNKNOWN") if parent_mode else "DOMAIN-UNKNOWN"

        return normalize_mode(top_mode)

    async def route_with_oracle(self, llm, briefing: Dict[str, Any], text: str, course: str = "") -> str:
        """Uses LLM-based wisdom to pick the single best domain from the taxonomy."""
        from .taxonomy import get_all_domains
        available_domains = get_all_domains()
        
        system = f"""You are a master librarian. Your goal is to assign this document to an existing department in your library.

**DOCUMENT BRIEFING:** 
{json.dumps(briefing, indent=2)}

**AVAILABLE DEPARTMENTS:** 
{", ".join(available_domains)}

Based on the briefing, which of the available departments is the single best fit? You are strictly forbidden from inventing a new department. Choose the closest possible match from the provided list."""

        user = f"Sample text from document:\n{text[:5000]}"
        
        try:
            # We use the deterministic router as a hint
            hint = self.route(text, course=course)
            
            # Adaptive instruction based on hint
            hint_note = f"\n\nHint from deterministic router: {hint}" if hint != "DOMAIN-UNKNOWN" else ""
            
            from langchain_core.messages import SystemMessage, HumanMessage
            res = await llm.ainvoke([
                SystemMessage(content=system),
                HumanMessage(content=f"{user}{hint_note}\n\nReturn ONLY the exact domain key (e.g., 'CS-DATA-SYSTEMS'). NO EXPLANATION.")
            ])
            
            mode = res.content.strip().strip("'\"").strip()
            # Clean up potential markdown formatting if AI ignored "NO MARKDOWN"
            if "```" in mode:
                mode = mode.split("```")[1].strip()
            
            normalized = normalize_mode(mode)
            if mode in available_domains or normalized != "ACADEMIC-GENERAL":
                print(f"[DomainRouter] Oracle routing successful: {mode} -> {normalized}")
                return normalized
            
            print(f"[DomainRouter] Oracle hallucinated mode '{mode}'. Falling back to deterministic hint: {hint}")
            return normalize_mode(hint)
        except Exception as e:
            print(f"[DomainRouter] Oracle routing failed: {e}")
            return normalize_mode(self.route(text, course=course))

# Global instance
router = DomainRouter()
