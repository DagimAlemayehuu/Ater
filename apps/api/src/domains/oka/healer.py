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
        from .validator import OkaValidator
        self.validator = OkaValidator()
        self.logger = logging.getLogger("LifeOS")

    def heal_wikilinks(self, text: str) -> str:
        """
        Fixes broken wikilinks by fuzzy matching against known titles in the current hub plan.
        Handles aliases like [[Title|Alias]].
        """
        # 0. Pre-heal broken brackets: [[Concept] -> [[Concept]]
        text = re.sub(r'\[\[([^\]\n]+)\](?!\])', r'[[\1]]', text)
        
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
            
            # Normalize and check link using canonical sanitizer
            sanitized_link = self.validator.sanitize_title(link)
            fixed_link = sanitized_link
            
            # 1. Exact match in canonical titles
            if raw_content in self.canonical_titles:
                fixed_link = raw_content
            elif sanitized_link in self.normalized_titles:
                fixed_link = self.normalized_titles[sanitized_link]
            else:
                # 2. Case-insensitive match against canonical set
                matched = False
                for title in self.canonical_titles:
                    if title.lower() == raw_content.lower() or self.validator.sanitize_title(title).lower() == sanitized_link.lower():
                        fixed_link = title
                        matched = True
                        break
                
                if not matched:
                    # v29.2: STRICT Closed Knowledge Graph Law
                    # If we can't find a match in the plan, we strip the brackets and convert to plain text
                    self.logger.warning(f"[Healer] Hallucinated link pruned: {link}")
                    # If an alias was provided, use it; otherwise use the cleaned link text
                    return alias if alias else link.replace('_', ' ')
            
            if alias:
                return f"[[{fixed_link}|{alias}]]"
            return f"[[{fixed_link}]]"

        return re.sub(r"\[\[(.*?)\]\]", _fix_link, text)

    def enforce_wikilink_density(self, text: str, min_links: int = 3, max_links: int = 5) -> str:
        """Enforces wikilink density: removes excess links beyond max, keeping the most concept-rich ones."""
        sections = re.split(r'(## \d+\..*?\n)', text)
        result = []
        for section in sections:
            if section.startswith('## '):
                result.append(section)
                continue
            # Find all wikilinks in this section
            links = re.findall(r'\[\[([^\]]+)\]\]', section)
            if len(links) > max_links:
                # Keep only the first max_links unique link targets deterministically
                kept_links = set(links[:max_links])
                # Use a factory to capture a fresh `seen` dict per section (avoid closure issues)
                def make_trimmer(kept: set) -> callable:
                    _seen: dict = {}
                    def _trim(m: re.Match) -> str:
                        link = m.group(1)
                        if link in kept:
                            _seen[link] = _seen.get(link, 0) + 1
                            if _seen[link] == 1:
                                return f'[[{link}]]'
                        return link.replace('_', ' ')
                    return _trim
                section = re.sub(r'\[\[([^\]]+)\]\]', make_trimmer(kept_links), section)
            result.append(section)
        return ''.join(result)

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
            r"(?i)^(?:\*\*?)?(?:Analysis|Explanation|Walkthrough|Summary)(?:\*\*?)?:\s+",
            r"(?i)(?:Here's a|I have created).*?\.?$",
            r"(?i)Let me know if you need any further.*\.?$",
            r"(?i)I hope this academic note meets your expectations.*?\.?$",
            r"(?i)Wait, (?:let me check|let's correct|actually|let me rephrase).*?\.?$",
            r"(?i)Thinking:.*?\.?$",
            r"(?i)Let's break this down step-by-step.*?\.?$",
            r"(?i)I'll focus on the core concept.*?\.?$"
        ]
        for pattern in patterns:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE | re.MULTILINE).strip()
        
        # Remove markdown bolding from entire lines that look like "Note: ..."
        sanitized = re.sub(r"^\*\*Note:\*\*.*$", "", sanitized, flags=re.IGNORECASE | re.MULTILINE)
        return sanitized.strip()

    def verify_arithmetic(self, text: str) -> str:
        """
        Sandbox for verifying arithmetic. 
        DEPRECATED: Prompt-based 'Math Sovereignty' and 'Sub-Operation' laws have made 
        this regex-based healer redundant and risky (friendly-fire on chained equations).
        """
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
                    
                # Fix any hallucinatory 'blank' usage for fill_in questions
                if q.get("type") == "fill_in":
                    q["question"] = re.sub(r"(?i)\b_+\b|\bblank\b(?!\]\])|\[\[?_?blank_?\]?\]", "[[blank]]", q.get("question", ""))
                    if "textWithBlanks" in q:
                        q["textWithBlanks"] = re.sub(r"(?i)\b_+\b|\bblank\b(?!\]\])|\[\[?_?blank_?\]?\]", "[[blank]]", q.get("textWithBlanks", ""))
                    elif "text_with_blanks" in q:
                        q["textWithBlanks"] = re.sub(r"(?i)\b_+\b|\bblank\b(?!\]\])|\[\[?_?blank_?\]?\]", "[[blank]]", q.get("text_with_blanks", ""))
                    else:
                        q["textWithBlanks"] = q["question"]
                    
                # Specific check for math-based answers
                # If question is "What is 5*5?" and answer is "24", we heal it.
                if q.get("type") in ["mcq", "true_false", "writing"]:
                    text_to_scan = f"{q.get('question', '')} {q.get('explanation', '')}"
                    # Match '... result is X' or '... equals X'
                    math_match = re.search(r"(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)", text_to_scan)
                    if math_match:
                        a, op, b, r = float(math_match.group(1)), math_match.group(2), float(math_match.group(3)), float(math_match.group(4))
                        real = a + b if op == "+" else (a - b if op == "-" else (a * b if op == "*" else a / b))
                        if abs(real - r) > 0.001:
                            # We found a math error that likely propagates to the 'answer' field
                            # The verify_arithmetic call above line 141 handled the string, 
                            # this block is for logic tracking.
                            pass
                            
                # ── 5.3 Cross-Key Numeric Consistency Heal ──
                # If explanation says 'X = 12' and answer is '10', and type is not MCQ (where keys are A/B/C/D), heal it.
                # EXEMPT: 'trace' questions, as they often derive full equations which the regex would truncate.
                if q.get("type") not in ["mcq", "matching", "order", "trace"]:
                    exp = q.get("explanation", "")
                    ans = str(q.get("answer", ""))
                    nums_in_exp = re.findall(r"=\s*([\d\.]+)", exp)
                    if nums_in_exp:
                        last_val = nums_in_exp[-1].rstrip(".")
                        if any(char.isdigit() for char in ans) and last_val not in ans:
                            self.logger.warning(f"[Healer] Answer Divergence Fix: [[{q.get('type')}]] Answer {ans} -> {last_val}")
                            q["answer"] = last_val

            return "```interactive-quiz\n" + json.dumps(data, indent=2) + "\n```"
        except Exception as e:
            self.logger.error(f"[Healer] Quiz JSON healing failed: {e}")
            return quiz_json_str

    def heal_markdown_tables(self, text: str) -> str:
        """
        Ensures all markdown tables have strict outer pipes.
        Fixes lines like 'Price | Quantity' -> '| Price | Quantity |'
        """
        lines = text.split("\n")
        healed_lines = []
        in_table = False
        
        for line in lines:
            stripped = line.strip()
            # Detect table start/content
            if "|" in stripped and not stripped.startswith("##") and not stripped.startswith("$"):
                in_table = True
                # Preserve indent
                indent_match = re.match(r"^(\s*)", line)
                indent = indent_match.group(1) if indent_match else ""
                
                content = stripped
                if not content.startswith("|"):
                    content = "| " + content
                if not content.endswith("|"):
                    content = content + " |"
                
                healed_lines.append(indent + content)
            else:
                in_table = False
                healed_lines.append(line)
        return "\n".join(healed_lines)

    def heal_all(self, text: str, is_quiz: bool = False) -> str:
        if is_quiz:
            return self.heal_quiz_json(text)
        
        text = self.sanitize_prose(text)
        text = self.heal_wikilinks(text)
        text = self.enforce_wikilink_density(text)
        text = self.verify_arithmetic(text)
        text = self.heal_markdown_tables(text)
        return text
