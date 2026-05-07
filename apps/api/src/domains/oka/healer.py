import re
import logging
from typing import List, Set, Dict

class LogicHealer:
    """
    Self-healing engine for OKA notes. Fixes wikilinks, sanitizes LLM-speak,
    and performs basic mathematical verification.
    """
    
    def __init__(self, canonical_titles: Set[str]):
        # Store both original and underscored versions for flexible matching
        self.canonical_titles = {t.strip() for t in canonical_titles}
        self.normalized_titles = {t.replace(" ", "_").strip(): t.strip() for t in canonical_titles}
        self.logger = logging.getLogger("LifeOS")

    def heal_wikilinks(self, text: str) -> str:
        """
        Fixes broken wikilinks by fuzzy matching against known titles in the current hub plan.
        Handles aliases like [[Title|Alias]].
        """
        def _fix_link(match):
            raw_content = match.group(1).strip()
            
            # Split into link and alias
            if "|" in raw_content:
                link, alias = raw_content.split("|", 1)
                link = link.strip()
                alias = alias.strip()
            else:
                link = raw_content
                alias = None
            
            # Normalize and check link
            normalized_link = link.replace(" ", "_")
            fixed_link = normalized_link
            
            # 1. Exact match in canonical titles
            if raw_content in self.canonical_titles:
                fixed_link = raw_content
            elif normalized_link in self.normalized_titles:
                fixed_link = self.normalized_titles[normalized_link]
            else:
                # 2. Case-insensitive match
                matched = False
                for title in self.canonical_titles:
                    if title.lower() == raw_content.lower() or title.lower().replace(" ", "_") == normalized_link.lower():
                        fixed_link = title
                        matched = True
                        break
                
                if not matched:
                    self.logger.warning(f"[Healer] Unresolved wikilink: {link}")
                    fixed_link = link # Fallback to original
            
            if alias:
                return f"[[{fixed_link}|{alias}]]"
            return f"[[{fixed_link}]]"

        return re.sub(r"\[\[(.*?)\]\]", _fix_link, text)

    def sanitize_prose(self, text: str) -> str:
        """
        Violently removes LLM conversational filler and metatalk.
        """
        # Aggressive patterns for LLM conversational sludge
        patterns = [
            r"(?i)(?:Sure|Certainly|Here is|Great choice|Okay|As an?|Absolutely|I understand),?.*?(?:explaining|overview|analysis|help|note|here is).*?[:\.]\s*",
            r"(?i)(?:In this section|This note|The following).*?[:\.]\s*",
            r"(?i)(?:Note|Tip|Hint|Important|Pro Tip):\s*",
            r"(?i)Hope this (?:helps|is useful|clarifies).*?\.?$",
            r"(?i)(?:If you have|Feel free to).*?\.?$",
            r"(?i)(?:Analysis|Explanation|Walkthrough|Summary):\s*",
            r"(?i)(?:Here's a|I have created).*?\.?$",
            r"(?i)Let me know if you need any further.*\.?$",
            r"(?i)I hope this academic note meets your expectations.*?\.?$"
        ]
        sanitized = text
        for pattern in patterns:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE | re.MULTILINE).strip()
        
        # Remove markdown bolding from entire lines that look like "Note: ..."
        sanitized = re.sub(r"^\*\*Note:\*\*.*$", "", sanitized, flags=re.IGNORECASE | re.MULTILINE)
        return sanitized.strip()

    def verify_arithmetic(self, text: str) -> str:
        """
        Sandbox for verifying arithmetic within prose or artifacts.
        Supports: +, -, *, /, ^, **
        """
        # Regex for common expressions including scientific notation and powers
        # Format: [num] [op] [num] = [res]
        expr_pattern = r"(\d+(?:\.\d+)?(?:e[\+\-]\d+)?)\s*([\+\-\*\/^]|\*\*)\s*(\d+(?:\.\d+)?(?:e[\+\-]\d+)?)\s*=\s*(\d+(?:\.\d+)?(?:e[\+\-]\d+)?)"
        exprs = re.findall(expr_pattern, text, re.IGNORECASE)
        
        for num1, op, num2, res in exprs:
            try:
                n1, n2, r = float(num1), float(num2), float(res)
                if op == '+': real = n1 + n2
                elif op == '-': real = n1 - n2
                elif op == '*': real = n1 * n2
                elif op == '/': real = n1 / n2 if n2 != 0 else 0
                elif op in ['^', '**']: real = n1 ** n2
                
                # Use a small epsilon for float comparison
                if abs(real - r) > abs(real * 0.001):
                    real_str = f"{real:g}"
                    self.logger.warning(f"[Healer] Math Fix: {num1}{op}{num2} -> {real_str} (was {res})")
                    # Replace all occurrences of the incorrect equation
                    incorrect = f"{num1} {op} {num2} = {res}"
                    correct = f"{num1} {op} {num2} = {real_str}"
                    text = text.replace(incorrect, correct)
                    # Also try compact version
                    text = text.replace(incorrect.replace(" ", ""), correct.replace(" ", ""))
            except Exception:
                continue
        return text

    def heal_quiz_json(self, quiz_json_str: str) -> str:
        """
        Parses the interactive-quiz JSON and heals internal math inconsistencies.
        """
        import json
        try:
            # Ripping JSON out of markdown block if necessary
            raw_json = quiz_json_str.replace("```interactive-quiz", "").replace("```json", "").replace("```", "").strip()
            data = json.loads(raw_json)
            
            for q in data:
                # Heal the explanation and question text
                if "explanation" in q:
                    q["explanation"] = self.verify_arithmetic(self.sanitize_prose(q["explanation"]))
                if "question" in q:
                    q["question"] = self.verify_arithmetic(q["question"])
                    
                # Specific check for math-based answers
                # If question is "What is 5*5?" and answer is "24", we heal it.
                if q.get("type") in ["mcq", "true_false", "writing"]:
                    text_to_scan = f"{q.get('question', '')} {q.get('explanation', '')}"
                    # Match '... result is X' or '... equals X'
                    math_match = re.search(r"(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)", text_to_scan)
                    if math_match:
                        n1, op, n2, r = float(math_match.group(1)), math_match.group(2), float(math_match.group(3)), float(math_match.group(4))
                        if op == '*': real = n1 * n2
                        elif op == '+': real = n1 + n2
                        elif op == '-': real = n1 - n2
                        elif op == '/': real = n1 / n2 if n2 != 0 else 0
                        
                        if abs(real - r) > 0.001:
                            # We found a math error that likely propagates to the 'answer' field
                            # For now, we just log it and ensure the explanation is fixed.
                            # Fixing MCQ options requires more complex logic, but healing the explanation is Step 1.
                            pass

            return "```interactive-quiz\n" + json.dumps(data, indent=2) + "\n```"
        except Exception as e:
            self.logger.error(f"[Healer] Quiz JSON healing failed: {e}")
            return quiz_json_str

    def heal_all(self, text: str, is_quiz: bool = False) -> str:
        if is_quiz:
            return self.heal_quiz_json(text)
        
        text = self.sanitize_prose(text)
        text = self.heal_wikilinks(text)
        text = self.verify_arithmetic(text)
        return text
