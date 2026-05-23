import re
import yaml
import json
from pathlib import Path
from typing import List, Tuple
from difflib import SequenceMatcher

# ── AGENT SCAFFOLDING LABELS ──────────────────────────────────────────────────
# These are PractitionerAgent/QuestionAgent internal labels that sometimes leak
# into student-facing note body text. Strip them deterministically.
_LEAKED_LABEL_PATTERNS = [
    r'^Technical Question:\s*',
    r'^Debug Section:\s*',
    r'^Mathematical Formula:\s*',
    r'^Example:\s*',
    r'^Worked Example:\s*',
    r'^Note:\s*(?=This|The|It|In|A)',   # generic "Note:" prefixes from chain-of-thought
    r'^Answer:\s*',                    # leaked from Q&A generation
    r'^Explanation:\s*',               # leaked from explanation generation
    r'^Mental Model:\s*',              # leaked from Section 1 headers
    r'^Economic Theory:\s*',           # leaked from Section 2 headers
    r'^Limitations & Edge Cases:\s*', # leaked from Section 3 headers
    r'^Economic Model:\s*',            # leaked from Section 4 headers
    r'^Walkthrough:\s*',               # leaked from Section 5 headers
    r'^The Proving Grounds:\s*',       # leaked from Section 6 headers
    r'^Technical Question:\s*',
    r'^Debug Section:\s*',
    r'^Note:\s*',
    r'^All of the above\s*$',           # forbidden distractor
    r'^None of the above\s*$',          # forbidden distractor
]
_LEAKED_LABEL_RE = re.compile(
    '|'.join(_LEAKED_LABEL_PATTERNS),
    re.MULTILINE
)

def sanitize_body(text: str) -> Tuple[str, List[str]]:
    """Deterministic content sanitizer for weak-LLM artifacts.

    Fixes applied (in order):
    1. Strip leaked agent scaffolding labels from prose.
    2. Fix broken Mermaid arrow syntax: -->|label|> → -->|label|.
    3. Deduplicate consecutive identical wikilinks: [[X]] [[X]] → [[X]].

    Returns (cleaned_text, list_of_fixes_applied).
    """
    fixes: List[str] = []
    original = text

    # 1. Strip leaked scaffolding labels
    cleaned = _LEAKED_LABEL_RE.sub('', text)
    if cleaned != text:
        fixes.append('stripped_agent_labels')
    text = cleaned

    # 2. Fix broken Mermaid syntax: -->|label|> and -->|label|>
    #    LLMs sometimes emit -->|Complementary Goods|> B[Bread] with an extra >
    mermaid_fixed = re.sub(r'(-->\s*\|[^|]*\|)(>)', r'\1', text)
    if mermaid_fixed != text:
        fixes.append('fixed_mermaid_arrow_syntax')
    text = mermaid_fixed

    # 3. Deduplicate consecutive identical wikilinks: [[X]] [[X]] → [[X]]
    deduped = re.sub(r'(\[\[[^\]]+\]\])(\s+\1)+', r'\1', text)
    if deduped != text:
        fixes.append('deduped_consecutive_wikilinks')
    text = deduped

    # 4. Normalize Walkthrough Headers deterministically
    def rewrite_steps(match):
        walkthrough_body = match.group(1)
        
        # Strip redundant "Step X:", "1. ", and "**Step X:**" prefixes inside the content
        # before we apply our own formatting. This allows for re-processing.
        # Uses a non-capturing group with '+' to strip multiple levels of hallucinated prefixes.
        cleaned_body = re.sub(
            r'^\s*(?:(?:#{1,3}\s*)?(?:\*\*|__)?(?:Step\s+)?\d+[\.:\s]*(?:\*\*|__)?[\.:\s]*)+',
            '',
            walkthrough_body,
            flags=re.MULTILINE
        )
        
        step_count = [0]
        def format_step(line):
            s_line = line.strip()
            if not s_line or s_line.startswith('---') or s_line.startswith('#'): 
                return None # Skip rules and headers in the walkthrough body
            step_count[0] += 1
            # Use bold text instead of headers for steps to prevent TOC pollution
            # and resolve the "all headings" complaint.
            content = s_line.lstrip('.: ')
            return f"**Step {step_count[0]}:** {content}"
        
        lines = [format_step(l) for l in cleaned_body.strip().split('\n') if l.strip()]
        # Filter out empty lines or None
        lines = [l for l in lines if l]
        normalized = "\n\n".join(lines)
        return f"## 5. Walkthrough\n\n{normalized}\n\n"
    
    walk_fixed = re.sub(
        r'## 5\. Walkthrough(.*?)(?=## 6\.|```interactive-quiz|$)',
        rewrite_steps,
        text,
        flags=re.DOTALL
    )
    if walk_fixed != text:
        fixes.append('normalized_walkthrough_steps')
    text = walk_fixed

    # 5. LaTeX Auto-Wrapping for standalone equations and variables
    # Wrap lines that are pure math like "Qd = 100 - 2P" or "Opportunity Cost = ..."
    def wrap_math(m):
        math_content = m.group(0).strip()
        # Skip if already wrapped
        if math_content.startswith('$') or math_content.startswith('\\('):
            return m.group(0)
        # Skip if it's a markdown table or list item or header or horizontal rule
        if math_content.startswith('|') or math_content.startswith('- ') or math_content.startswith('#') or math_content.startswith('---'):
            return m.group(0)
        # Avoid wrapping very short strings that might be titles unless they contain '=' or symbols
        if len(math_content) < 5 and '=' not in math_content and not any(s in math_content for s in ['\\', 'Δ', 'Δ', 'Σ']):
            return m.group(0)
            
        return f"$${math_content}$$"

    # Match lines that look like equations: "Alpha = Beta + Gamma" or "P = 10" or "100 - 90 = 10"
    # and not prose. Allowing Greek letters and Delta.
    math_pattern = re.compile(r'^[A-Za-z0-9\s\\Delta\u0394\u03A3\u03C3\*\+\-\/\^]+ = [^#\n]+$', re.MULTILINE)
    text = math_pattern.sub(wrap_math, text)

    # 6. Mermaid Cleanup
    # Ensure mermaid blocks are clean and have the correct language tag
    def clean_mermaid(m):
        code = m.group(1).strip()
        # Remove leading/trailing pipes often leaked by agents
        code = re.sub(r'^\|+|\|+$', '', code, flags=re.MULTILINE).strip()
        return f"```mermaid\n{code}\n```"
    
    text = re.sub(r'```(?:mermaid|CODE)?\s*\n(.*?)\n```', clean_mermaid, text, flags=re.DOTALL)

    # 7. Quiz Sanitization: Convert "Blank" or "___" to [[blank]]
    def fix_quiz_blanks(m):
        quiz_json = m.group(1)
        # Convert "Blank", "___", or "..." in text_with_blanks to [[blank]]
        # Using a more aggressive regex that handles punctuation and multiple placeholders
        fixed_json = re.sub(r'(?i)\bBlank\b|___+|\.{3,}', '[[blank]]', quiz_json)
        return f"```interactive-quiz\n{fixed_json}\n```"

    quiz_fixed = re.compile(r'```interactive-quiz\s*\n(.*?)\n```', re.DOTALL).sub(fix_quiz_blanks, text)
    if quiz_fixed != text:
        fixes.append('sanitized_quiz_blanks')
    text = quiz_fixed

    return text, fixes


def validate_quiz_stub_free(note_path: Path) -> List[str]:
    """Scan a deployed note for dead quiz stubs that slipped past validation.
    Returns list of stub markers found (empty = clean)."""
    content = note_path.read_text(encoding='utf-8')
    found = []
    if '"question": "Error generating question."' in content:
        found.append('ERROR_STUB_QUESTION')
    if '"answer": "N/A"' in content:
        found.append('ERROR_STUB_ANSWER')
    return found

def canonicalize_unit(unit_dir: Path):
    all_stems = sorted([f.stem for f in unit_dir.glob("*.md") if "Hub" not in f.stem and "PQ" not in f.stem and not f.name.startswith(".")])

    for note in unit_dir.glob("*.md"):
        # Skip directories and special files
        if note.is_dir() or note.name.startswith(".") or "Hub" in note.name or "PQ" in note.name:
            continue
            
        text = note.read_text(encoding="utf-8")
        changed = False

        parts = text.split("---", 2)
        if len(parts) == 3:
            fm_str = parts[1]
            body_block = parts[2]
            
            try:
                fm = yaml.safe_load(fm_str) or {}
            except Exception:
                fm = {}

            # 1. Clean OCR noise from frontmatter properties (course, semester, title)
            fm_changed = False
            for prop in ["course", "semester", "title"]:
                if fm.get(prop) and isinstance(fm[prop], str):
                    cleaned_prop = clean_ocr_noise(fm[prop])
                    if cleaned_prop != fm[prop]:
                        fm[prop] = cleaned_prop
                        fm_changed = True
            
            # Clean prerequisites and source pages if they exist
            prereqs = fm.get("prerequisites", [])
            source_pages = fm.get("source_pages", [])
            
            if prereqs and isinstance(prereqs, list):
                from src.domains.ater.validator import AterValidator
                sanitized_prereqs = AterValidator.sanitize_prerequisites(prereqs)
                if sanitized_prereqs != prereqs:
                    fm["prerequisites"] = sanitized_prereqs
                    fm_changed = True
                    prereqs = sanitized_prereqs
            
            if fm_changed:
                from src.domains.ater.vault_manager import VaultManager
                fm_str = VaultManager(".").dump_obsidian_yaml(fm)
                changed = True

            # 2. Merge extra dynamic headings to enforce strict 4-section H2 contract
            body_block, merged = merge_extra_sections_to_four(body_block)
            if merged:
                changed = True
                print(f"[Merge4Sections] Merged extra headings in {note.name}")

            # 3. Heal prose sentence truncations
            sections = re.split(r'(?m)^##\s+', body_block)
            if len(sections) >= 4:
                sec_changed = False
                for idx in range(1, len(sections)):
                    sec_text = sections[idx]
                    # Skip the quiz section (we heal that separately)
                    if any(k in sec_text.split('\n', 1)[0].lower() for k in ["proving", "grounds", "quiz"]):
                        continue
                        
                    lines = sec_text.split("\n", 1)
                    heading = lines[0].strip()
                    prose_body = lines[1] if len(lines) > 1 else ""
                    
                    healed_prose = heal_sentence_truncation(prose_body)
                    if healed_prose != prose_body:
                        sections[idx] = f"{heading}\n\n{healed_prose.strip()}"
                        sec_changed = True
                        
                if sec_changed:
                    body_block = reassemble_sections(sections)
                    changed = True

            # 4. Enforce graph link density (3-5 links in Core Logic)
            body_block, weave_changed = enforce_graph_density(
                body_block, 
                current_title=note.stem, 
                all_stems=all_stems, 
                prerequisites=prereqs
            )
            if weave_changed:
                changed = True
                print(f"[GraphDensity] Weaved/pruned links in {note.name}")

            # 5. Scaffolding IDs & Difficulty in Quiz Block
            quiz_match = re.search(r"```interactive-quiz\s*(.*?)\s*```", body_block, re.DOTALL)
            if quiz_match:
                quiz_str = quiz_match.group(0)
                healed_quiz_str = heal_quiz_scaffolding(quiz_str)
                if healed_quiz_str != quiz_str:
                    body_block = body_block.replace(quiz_str, healed_quiz_str)
                    changed = True
                    print(f"[QuizScaffold] Scaffolded quiz on disk for {note.name}")

            # 6. Standard cleanup pass (Mermaid arrows, bold-stems, etc.)
            sanitized_body, body_fixes = sanitize_body(body_block)
            if body_fixes:
                body_block = sanitized_body
                changed = True
                print(f"[SanitizeBody] Cleaned stubs in {note.name}: {body_fixes}")

            if changed:
                text = f"---\n{fm_str.strip()}\n---\n\n{body_block.strip()}\n"

        # ── Phase 1: Wikilink canonicalization ────────────────────────────────
        # Fix spaces inside brackets: [[ Title ]] → [[Title]]
        # Fix spaces in title: [[some title]] → [[Some_Title]]
        def fix(m):
            inner = m.group(1).strip()
            if "/" in inner:
                return f"[[{inner}]]"
            parts = inner.replace(" ", "_").split("_")
            capitalized_parts = []
            for w in parts:
                if not w: continue
                if w.lower() == "c++":
                    capitalized_parts.append("C++")
                else:
                    capitalized_parts.append(w.capitalize())
            inner = "_".join(capitalized_parts)
            return f"[[{inner}]]"
        
        fixed = re.sub(r'\[\[\s*([^\]]+?)\s*\]\]', fix, text)
        if fixed != text:
            changed = True
            text = fixed

        if changed:
            note.write_text(text, encoding="utf-8")
            print(f"[Canonicalized] Perfected on disk: {note.name}")

    # ── Phase 2: Link Convergence (Ghost Link Cleanup) ──────────────────
    reconcile_broken_links(unit_dir)

def infer_unit_prerequisites(unit_dir: Path):
    all_stems = {f.stem for f in unit_dir.glob("*.md")}
    
    for note_file in unit_dir.glob("*.md"):
        content = note_file.read_text(encoding="utf-8")
        parts = content.split("---", 2)
        if len(parts) < 3:
            continue
        
        frontmatter_str, body = parts[1], parts[2]
        try:
            frontmatter = yaml.safe_load(frontmatter_str) or {}
        except Exception:
            continue
        
        # Already has prerequisites → skip
        if frontmatter.get("prerequisites"):
            continue
        
        # Find all wikilinks in the body that match other unit notes
        body_links = re.findall(r'\[\[([^\]]+)\]\]', body)
        prereqs = [
            f"[[{link.strip()}]]"
            for link in body_links
            if link.strip() in all_stems and link.strip() != note_file.stem
        ]
        
        if prereqs:
            frontmatter["prerequisites"] = list(dict.fromkeys(prereqs))[:5]  # max 5, deduped
            from src.domains.ater.vault_manager import VaultManager
            new_yaml = VaultManager(".").dump_obsidian_yaml(frontmatter)
            note_file.write_text(f"---\n{new_yaml}---\n{body}", encoding="utf-8")
            print(f"[PrereqInfer] {note_file.stem}: {prereqs}")

def enforce_gutter(unit_dir: Path):
    """
    Enforces the Ater Gutter Law (v33.0):
    EXACTLY one blank line BEFORE and AFTER every heading, table, code block, and diagram.
    """
    PATTERNS = [
        r'^#{1,6}\s+',          # Headings
        r'^```',                 # Code fences
        r'^---$',                # Horizontal rules
        r'^>\s+\*\*.+\*\*',      # Artifact labels
    ]
    combined = re.compile('|'.join(PATTERNS))

    def is_table_row(l):
        s = l.strip()
        return s.startswith('|') and s.endswith('|') and len(s) > 1

    for note_file in unit_dir.glob("*.md"):
        content = note_file.read_text(encoding="utf-8")
        # Split into lines and strip trailing whitespace
        lines = [line.rstrip() for line in content.split('\n')]
        
        processed = []
        in_table = False
        for i, line in enumerate(lines):
            is_table = is_table_row(line)
            is_header_or_other = bool(combined.match(line.strip()))
            
            # 1. Before Logic
            # Add gutter before if it is a header/rule, or if it is the start of a table block
            if (is_header_or_other or (is_table and not in_table)) and processed:
                if processed[-1].strip() != '':
                    processed.append('')
            
            processed.append(line)
            
            # Update active table state
            in_table = is_table
            
            # 2. After Logic
            # Add gutter after if it is a header/rule, or if it is the end of a table block
            if i + 1 < len(lines):
                next_is_table = is_table_row(lines[i+1])
                if (is_header_or_other or (is_table and not next_is_table)):
                    if lines[i+1].strip() != '':
                        processed.append('')
        
        # Final pass: Collapse multiple blank lines into single ones
        final = []
        for i, line in enumerate(processed):
            if i > 0 and line.strip() == '' and processed[i-1].strip() == '':
                continue
            final.append(line)
            
        # Ensure no trailing/leading multiple blanks
        final_str = '\n'.join(final).strip() + '\n'
        note_file.write_text(final_str, encoding="utf-8")
        print(f"[GutterLaw] Sanitized: {note_file.name}")


def deduplicate_plan(notes: List[dict], threshold: float = 0.92) -> List[dict]:
    kept = []
    removed = 0
    for note in notes:
        is_dup = False
        for existing in kept:
            ratio = SequenceMatcher(
                None,
                note["title"].lower().replace("_", " "),
                existing["title"].lower().replace("_", " ")
            ).ratio()
            if ratio >= threshold:
                # Keep the one with more source_context
                if len(note.get("source_context", "")) > len(existing.get("source_context", "")):
                    kept.remove(existing)
                    kept.append(note)
                else:
                    pass
                is_dup = True
                break
        if not is_dup:
            kept.append(note)
    
    removed = len(notes) - len(kept)
    if removed:
        print(f"[Dedup] Removed {removed} duplicate concepts from plan")
    return kept

def audit_walkthroughs(unit_dir: Path) -> List[str]:
    needs_retry = []
    for note_file in unit_dir.glob("*.md"):
        body = note_file.read_text(encoding="utf-8")
        match = re.search(r'## 5\. Walkthrough(.*?)(?=## 6\.|```interactive-quiz|$)', body, re.DOTALL)
        if match:
            steps = re.findall(r'^\d+\.', match.group(1), re.MULTILINE)
            if len(steps) < 5:
                needs_retry.append(note_file.stem)
                print(f"[WalkthroughAudit] {note_file.stem}: {len(steps)} steps (need 5+)")
    return needs_retry

def audit_intra_links(unit_dir: Path) -> List[str]:
    all_stems = {f.stem for f in unit_dir.glob("*.md")}
    weak_notes = []
    
    for note_file in unit_dir.glob("*.md"):
        body = note_file.read_text(encoding="utf-8").split("---", 2)[-1]
        links = re.findall(r'\[\[([^\]]+)\]\]', body)
        real_intra = [l for l in links if l in all_stems and l != note_file.stem]
        
        if len(real_intra) < 2:
            weak_notes.append(note_file.stem)
            print(f"[IntraLink] {note_file.stem}: only {len(real_intra)} intra-unit links")
    
    return weak_notes

def sync_hub_connections(hub_file: Path, unit_dir: Path, plan_order: List[str] = None):
    """
    Rebuild the hub's ## Connections section from the actual deployed atomic notes.
    Scans unit_dir for all .md files and writes them as checklist items into the hub.
    This is the ground-truth rebuild approach — no ghost-link detection needed.
    """
    if not unit_dir.exists():
        print(f"[HubSync] Unit directory not found: {unit_dir}")
        return

    # Collect all deployed atomic note stems (exclude hub/PQ files)
    deployed_stems = sorted(
        f.stem for f in unit_dir.glob("*.md")
        if "Hub" not in f.stem and "PQ" not in f.stem and not f.stem.startswith(".")
    )

    if not deployed_stems:
        print(f"[HubSync] No atomic notes found in {unit_dir}")
        return

    # Extract prerequisites and page numbers to build a tree
    note_data = {}
    note_min_pages = {}
    for stem in deployed_stems:
        note_file = unit_dir / f"{stem}.md"
        try:
            content = note_file.read_text(encoding="utf-8")
            parts = content.split("---", 2)
            prereq_stems = []
            min_page = 9999
            if len(parts) >= 3:
                fm = yaml.safe_load(parts[1]) or {}
                raw_prereqs = fm.get("prerequisites", [])
                if isinstance(raw_prereqs, list):
                    for p in raw_prereqs:
                        p_str = str(p).strip()
                        # Extract from [[Link]] or "Link" or 'Link' or Link
                        m = re.search(r'\[\[(.*?)\]\]', p_str)
                        if m:
                            p_stem = m.group(1).split('|')[0].strip().replace(" ", "_")
                        else:
                            p_stem = p_str.strip("'\"").replace(" ", "_")
                        
                        # Case-insensitive match against deployed stems
                        for s in deployed_stems:
                            if s.lower() == p_stem.lower():
                                prereq_stems.append(s)
                                break
                
                # Parse source pages
                source_pages = fm.get("source_pages", [])
                if isinstance(source_pages, list):
                    pages = [int(p) for p in source_pages if str(p).isdigit()]
                    if pages:
                        min_page = min(pages)
                elif isinstance(source_pages, (int, str)) and str(source_pages).isdigit():
                    min_page = int(source_pages)
            note_data[stem] = prereq_stems
            note_min_pages[stem] = min_page
        except Exception:
            note_data[stem] = []
            note_min_pages[stem] = 9999

    # ── HIERARCHICAL TREE BUILDER (Plan-Driven Topological) ──
    # 1. Map full relationships
    parents_to_children = {s: [] for s in deployed_stems}
    child_to_parents = {s: [] for s in deployed_stems}
    
    for child in deployed_stems:
        prereqs = note_data.get(child, [])
        valid_parents = [p for p in prereqs if p in deployed_stems and p != child]
        child_to_parents[child] = valid_parents
        for p in valid_parents:
            parents_to_children[p].append(child)

    def normalize_title_for_comparison(t: str) -> str:
        return t.strip().lower().replace(" ", "_").replace("-", "_")

    def get_plan_index(s: str) -> int:
        if not plan_order:
            return 9999
        s_norm = normalize_title_for_comparison(s)
        for idx, p in enumerate(plan_order):
            if normalize_title_for_comparison(p) == s_norm:
                return idx
        return 9999

    # 2. Topological Sort for foundational progression
    def topological_sort(stems: List[str], dependency_graph: dict) -> List[str]:
        visited = {} # 0 = unvisited, 1 = visiting, 2 = visited
        order = []
        
        # Sort by plan_order, then PDF progression (page number), then alphabetically
        sorted_stems = sorted(stems, key=lambda s: (get_plan_index(s), note_min_pages.get(s, 9999), s.lower()))
        
        def dfs(node):
            if visited.get(node, 0) == 1:
                return True # Cycle detected
            if visited.get(node, 0) == 2:
                return False
                
            visited[node] = 1 # Visiting
            parents = dependency_graph.get(node, [])
            for p in sorted(parents, key=lambda s: (get_plan_index(s), note_min_pages.get(s, 9999), s.lower())):
                if p in visited:
                    dfs(p)
            visited[node] = 2 # Visited
            order.append(node)
            return False

        for stem in sorted_stems:
            visited[stem] = 0
            
        for stem in sorted_stems:
            if visited[stem] == 0:
                dfs(stem)
        return order

    topo_order = topological_sort(deployed_stems, child_to_parents)

    order_map = {normalize_title_for_comparison(s): i for i, s in enumerate(topo_order)}
    
    all_stems_sorted = sorted(
        list(deployed_stems),
        key=lambda s: (
            get_plan_index(s),
            note_min_pages.get(s, 9999),
            order_map.get(normalize_title_for_comparison(s), 999),
            s.lower()
        )
    )

    processed = set()
    tree_lines = []

    def build_tree(stem, depth=0):
        if stem in processed: return
        processed.add(stem)
        
        indent = "    " * depth
        tree_lines.append(f"{indent}- [ ] [[{stem}]]")
        
        # Children are notes that have this stem as their "Best" parent.
        potential_children = parents_to_children.get(stem, [])
        potential_children.sort(
            key=lambda s: (
                get_plan_index(s),
                note_min_pages.get(s, 9999),
                order_map.get(normalize_title_for_comparison(s), 999),
                s.lower()
            )
        )
            
        for child in potential_children:
            if child not in processed:
                p_list = child_to_parents.get(child, [])
                if not p_list: continue
                
                # Robust selection: pick the parent that appears EARLIEST in the plan
                best_parent = min(p_list, key=lambda p: (get_plan_index(p), order_map.get(normalize_title_for_comparison(p), 999)))
                if best_parent == stem:
                    build_tree(child, depth + 1)

    # 3. Main Loop: Follow the Plan Order
    for stem in all_stems_sorted:
        if stem in processed: continue
        
        # Check if we should be a child of someone else who isn't processed yet
        p_list = child_to_parents.get(stem, [])
        is_truly_root = True
        for p in p_list:
            if p in deployed_stems and p not in processed:
                # We have a parent in this unit that hasn't been placed yet.
                if order_map.get(normalize_title_for_comparison(p), 999) > order_map.get(normalize_title_for_comparison(stem), 999):
                    continue 
                else:
                    is_truly_root = False
                    break
        
        if is_truly_root:
            build_tree(stem, 0)

    # 4. Final Safety Pass
    for stem in all_stems_sorted:
        if stem not in processed:
            build_tree(stem, 0)

    hub_text = hub_file.read_text(encoding="utf-8")
    connection_lines = "\n".join(tree_lines)
    
    # The user requested NO redundant bullet point for the Hub title itself.
    # Connections section should start directly with the first-level topics.
    new_connections_block = f"## Connections\n\n{connection_lines}\n"

    # Replace or append the Connections section
    if "## Connections" in hub_text:
        # Replace everything from ## Connections to end of file or next header
        hub_text = re.sub(
            r"## Connections.*?(?=##|$)",
            new_connections_block,
            hub_text,
            flags=re.DOTALL
        )
    else:
        hub_text = hub_text.rstrip() + f"\n\n{new_connections_block}"

    hub_file.write_text(hub_text, encoding="utf-8")
    print(f"[HubSync] Rebuilt hierarchical connections for {hub_file.name}: {len(deployed_stems)} nodes.")

def reconcile_broken_links(unit_dir: Path):
    """
    Scans all notes in unit_dir and removes wikilinks that don't point to 
    an existing file in the same unit. Prevents 'Ghost Links' in Obsidian.
    Only applies to note bodies, keeping frontmatter intact.
    """
    all_stems = {f.stem for f in unit_dir.glob("*.md")}
    
    for note_file in unit_dir.glob("*.md"):
        content = note_file.read_text(encoding="utf-8")
        
        parts = content.split("---", 2)
        if len(parts) == 3:
            fm, body = parts[1], parts[2]
            
            def link_fixer(match):
                link = match.group(1).strip()
                if link in all_stems or "/" in link or "Hub" in link:
                    return f"[[{link}]]"
                return link.replace("_", " ")

            fixed_body = re.sub(r'\[\[([^\]]+)\]\]', link_fixer, body)
            if fixed_body != body:
                note_file.write_text(f"---\n{fm}---\n{fixed_body}", encoding="utf-8")
                print(f"[LinkReconcile] Cleaned ghost links in body of: {note_file.name}")
        else:
            def link_fixer(match):
                link = match.group(1).strip()
                if link in all_stems or "/" in link or "Hub" in link:
                    return f"[[{link}]]"
                return link.replace("_", " ")

            fixed = re.sub(r'\[\[([^\]]+)\]\]', link_fixer, content)
            if fixed != content:
                note_file.write_text(fixed, encoding="utf-8")
                print(f"[LinkReconcile] Cleaned ghost links in: {note_file.name}")

def purge_pedagogical_artifacts(unit_dir: Path):
    """
    Deterministic cleanup of TikZ artifacts, walkthrough normalization,
    and conversion of bold-text concepts to proper wikilinks.
    """
    all_stems = {f.stem for f in unit_dir.glob("*.md")}
    
    for note_file in unit_dir.glob("*.md"):
        text = note_file.read_text(encoding="utf-8")
        changed = False
        
        # 1. Strip TikZ/PGFPlots
        tikz_pattern = re.compile(r'\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}', re.DOTALL)
        if tikz_pattern.search(text):
            text = tikz_pattern.sub('[Diagram omitted - Technical TikZ structure not renderable]', text)
            changed = True

        # 2. Convert **Bold_Concepts** to [[Wikilinks]] if they exist in the unit
        def bold_to_wiki(match):
            term = match.group(1).strip().replace(" ", "_")
            if term in all_stems:
                return f"[[{term}]]"
            # Try title case
            parts = term.split("_")
            tc_term = "_".join([p.capitalize() for p in parts])
            if tc_term in all_stems:
                return f"[[{tc_term}]]"
            return match.group(0)
            
        new_text = re.sub(r'\*\*([^*]+)\*\*', bold_to_wiki, text)
        if new_text != text:
            text = new_text
            changed = True

        # 3. Normalize Walkthrough Headers
        normalized_walk = re.sub(r'## 5\.\s*(Technical\s*)?Walkthrough.*', '## 5. Walkthrough', text)
        if normalized_walk != text:
            text = normalized_walk
            changed = True
            
            if changed:
                note_file.write_text(text, encoding="utf-8")
                print(f"[PedagogyPurge] Cleaned: {note_file.name}")

def auto_weave_wikilinks(unit_dir: Path):
    """
    Go through all notes' body text, find occurrences of deployed concept titles,
    and wrap them in [[wikilinks]]. This replaces the LLM's role in link generation.
    """
    all_stems = {f.stem for f in unit_dir.glob("*.md") if "Hub" not in f.stem and "PQ" not in f.stem}
    
    # Sort stems by length descending so we match longer titles first (e.g., "Demand Curve" before "Demand")
    sorted_stems = sorted(list(all_stems), key=len, reverse=True)
    
    def weave(text: str, stem: str, display: str) -> str:
        # We only replace if it's outside of [[...]]
        links = []
        def save_link(m):
            links.append(m.group(0))
            return f"__WIKILINK_{len(links)-1}__"
        
        temp_text = re.sub(r'\[\[.*?\]\]', save_link, text)
        
        # also protect code blocks, math blocks, etc
        blocks = []
        def save_block(m):
            blocks.append(m.group(0))
            return f"__BLOCK_{len(blocks)-1}__"
        
        temp_text = re.sub(r'```.*?```', save_block, temp_text, flags=re.DOTALL)
        temp_text = re.sub(r'\$\$.*?\$\$', save_block, temp_text, flags=re.DOTALL)
        temp_text = re.sub(r'`[^`]*`', save_block, temp_text)
        
        # now replace the display text
        pattern = re.compile(rf'\b({re.escape(display)})\b', re.IGNORECASE)
        new_text = pattern.sub(rf'[[{stem}|\1]]', temp_text)
        
        # restore blocks
        for i in range(len(blocks)):
            new_text = new_text.replace(f"__BLOCK_{i}__", blocks[i])
        
        # restore links
        for i in range(len(links)):
            new_text = new_text.replace(f"__WIKILINK_{i}__", links[i])
            
        return new_text

    for note_file in unit_dir.glob("*.md"):
        content = note_file.read_text(encoding="utf-8")
        parts = content.split("---", 2)
        if len(parts) < 3:
            continue
            
        frontmatter = parts[1]
        body = parts[2]
        changed = False
        
        for stem in sorted_stems:
            if stem == note_file.stem:
                continue # don't link to self
                
            display_text = stem.replace("_", " ")
            new_body = weave(body, stem, display_text)
            if new_body != body:
                body = new_body
                changed = True
                
        if changed:
            note_file.write_text(f"---{frontmatter}---{body}", encoding="utf-8")
            print(f"[AutoWeaver] Wove links into: {note_file.stem}")

# ── NEW DETERMINISTIC HEALER SUITE ──────────────────────────────────────────

def clean_ocr_noise(text: str) -> str:
    if not text:
        return ""
    # Clean OCR scanner footers and inline stubs
    text = re.sub(r'(?i)\(?%?\d*?\s*CamScanner\)?', '', text)
    text = re.sub(r'(?i)ccs\s*CamScanner', '', text)
    text = re.sub(r'(?i)\(%3', '', text)
    text = re.sub(r'(?i)\bCcs\b', '', text)
    text = re.sub(r'(?i)\bCamScanner\b', '', text)
    # Clean trailing digit stubs with scan markings
    text = re.sub(r'\s+\d+\s*(?:Ccs|%3|\(|CamScanner)+.*$', '', text, flags=re.MULTILINE)
    return text.strip()

def heal_sentence_truncation(prose: str) -> str:
    prose = clean_ocr_noise(prose)
    if not prose:
        return prose
        
    lines = prose.split('\n')
    healed_lines = []
    for line in lines:
        stripped_line = line.rstrip()
        if not stripped_line:
            healed_lines.append(line)
            continue
            
        # Check for trailing isolated single character (e.g. ' visions of the country e')
        match = re.search(r'\s+([a-zA-Z])\s*$', stripped_line)
        if match and match.group(1).lower() not in ('a', 'i', 'o'):
            stripped_line = stripped_line[:-len(match.group(0))].rstrip()
            
        # Check for trailing incomplete conjunctions/prepositions at the end of the line
        conjunction_match = re.search(r'\b(and|or|of|to|in|on|at|by|for|with|from|but|not|primary\s+among)\s*$', stripped_line, re.IGNORECASE)
        if conjunction_match:
            stripped_line = stripped_line[:-len(conjunction_match.group(0))].rstrip()
            
        healed_lines.append(stripped_line)
        
    prose = '\n'.join(healed_lines)
    
    # Strip markdown horizontal lines and spacing
    prose = re.sub(r'[\s\n\-\*_|]+$', '', prose).strip()
    if not prose:
        return prose
        
    # Ensure valid terminal punctuation
    valid_terminals = ('.', '!', '?', '`', '"', "'", ')', ']', '}', '$', '|', '*', ':')
    if prose[-1] not in valid_terminals:
        if prose[-1] in (',', '-', '—'):
            prose = prose[:-1].strip() + "."
        else:
            prose = prose + "."
            
    return prose

def merge_extra_sections_to_four(body: str) -> Tuple[str, bool]:
    # Enforce strict 4-section H2 limit by merging extra H2 headings under Section 3 (Formal Model)
    sections = re.split(r'(?m)^##\s+', body)
    if len(sections) <= 4:
        # Already <= 4 sections or no H2 headings
        return body, False
        
    # Find heading named Proving Grounds or equivalent
    quiz_idx = -1
    for idx, sec in enumerate(sections):
        if idx > 0 and any(k in sec.split('\n', 1)[0].lower() for k in ["proving", "grounds", "quiz"]):
            quiz_idx = idx
            break
            
    if quiz_idx == -1:
        quiz_idx = len(sections) - 1
        
    if quiz_idx <= 3:
        # Cannot merge if Proving Grounds is too early
        return body, False
        
    new_parts = [sections[0]] # Preamble before H2
    mental_model_part = sections[1]
    core_logic_part = sections[2]
    formal_model_part = sections[3]
    
    # Merge any parts in between formal_model (Part 3) and quiz into formal_model
    merged_content = [formal_model_part.strip()]
    for i in range(4, quiz_idx):
        extra_part = sections[i]
        lines = extra_part.split("\n", 1)
        heading = lines[0].strip()
        extra_body = lines[1].strip() if len(lines) > 1 else ""
        
        # Append as a bold subheader/blockquote
        merged_content.append(f"> **{heading}**\n\n{extra_body}".strip())
        
    new_formal_model = "\n\n".join(merged_content)
    
    # Reassemble body with H2 headers
    quiz_part = sections[quiz_idx]
    
    # Make sure we preserve headings
    h1_line = mental_model_part.split('\n', 1)[0].strip()
    h2_line = core_logic_part.split('\n', 1)[0].strip()
    h3_line = formal_model_part.split('\n', 1)[0].strip()
    h4_line = quiz_part.split('\n', 1)[0].strip()
    
    m_body = mental_model_part.split('\n', 1)[1].strip() if '\n' in mental_model_part else ""
    c_body = core_logic_part.split('\n', 1)[1].strip() if '\n' in core_logic_part else ""
    f_body = new_formal_model.split('\n', 1)[1].strip() if '\n' in new_formal_model else new_formal_model
    q_body = quiz_part.split('\n', 1)[1].strip() if '\n' in quiz_part else ""
    
    reassembled = (
        f"## {h1_line}\n\n{m_body}\n\n"
        f"## {h2_line}\n\n{c_body}\n\n"
        f"## {h3_line}\n\n{f_body}\n\n"
        f"## {h4_line}\n\n{q_body}\n"
    )
    return reassembled, True

def heal_quiz_scaffolding(quiz_block: str) -> str:
    from src.domains.ater.validator import AterValidator
    is_valid, quiz_data, err = AterValidator.validate_json_robust(quiz_block)
    if not is_valid or not isinstance(quiz_data, list):
        return quiz_block
        
    for idx, q in enumerate(quiz_data):
        if not isinstance(q, dict):
            continue
            
        # 1. Scaffolding IDs & Difficulty
        q["id"] = f"q{idx + 1}"
        q["difficulty"] = f"L{idx + 1}"
        
        # 2. Strict type mapping based on difficulty
        current_type = str(q.get("type", "")).lower()
        if idx == 0:
            if current_type not in ["mcq", "true_false"]:
                q["type"] = "mcq"
        elif idx == 1:
            if current_type not in ["scenario", "calculation"]:
                q["type"] = "scenario"
        else:
            if current_type not in ["writing", "trace", "debug"]:
                q["type"] = "writing"
                
        # 3. Clean OCR noise in keys
        for key in ["question", "answer", "explanation"]:
            if key in q and isinstance(q[key], str):
                q[key] = clean_ocr_noise(q[key])
                
        if "options" in q and isinstance(q["options"], dict):
            for opt_key, opt_val in q["options"].items():
                if isinstance(opt_val, str):
                    q["options"][opt_key] = clean_ocr_noise(opt_val)
                    
    return "```interactive-quiz\n" + json.dumps(quiz_data, indent=2) + "\n```"

def enforce_graph_density(body: str, current_title: str, all_stems: List[str], prerequisites: List[str]) -> Tuple[str, bool]:
    sections = re.split(r'(?m)^##\s+', body)
    if len(sections) < 3:
        return body, False
        
    core_logic_part = sections[2]
    lines = core_logic_part.split("\n", 1)
    heading = lines[0].strip()
    core_body = lines[1] if len(lines) > 1 else ""
    
    # 1. Count links
    links = re.findall(r'\[\[([^\]|]+)(?:\|[^\]]*)?\]\]', core_body)
    non_self_links = [l for l in links if l.replace(" ", "_").strip().lower() != current_title.lower()]
    
    changed = False
    # 2. If < 3 links, try to weave
    if len(non_self_links) < 3:
        sorted_stems = sorted([s for s in all_stems if s.lower() != current_title.lower()], key=len, reverse=True)
        for stem in sorted_stems:
            display = stem.replace("_", " ")
            
            # Simple check to avoid linking if already linked
            existing_stems = {re.sub(r'\|.*', '', l).strip().replace(" ", "_").lower() for l in links}
            if stem.lower() not in existing_stems:
                def weave_single_link(text, target_stem, target_display):
                    blocks = []
                    def save_block(m):
                        blocks.append(m.group(0))
                        return f"__BLOCK_{len(blocks)-1}__"
                    temp = re.sub(r'\[\[.*?\]\]|```.*?```|`[^`]*`|\$\$.*?\$\$', save_block, text, flags=re.DOTALL)
                    pattern_w = re.compile(rf'\b({re.escape(target_display)})\b', re.IGNORECASE)
                    temp, count = pattern_w.subn(f"[[{target_stem}]]", temp, count=1)
                    if count > 0:
                        for i in range(len(blocks)):
                            temp = temp.replace(f"__BLOCK_{i}__", blocks[i])
                        return temp
                    return text
                
                new_core_body = weave_single_link(core_body, stem, display)
                if new_core_body != core_body:
                    core_body = new_core_body
                    links.append(stem)
                    non_self_links.append(stem)
                    changed = True
                    if len(non_self_links) >= 3:
                        break
                        
    # 3. If still < 3 links, append connection sentence
    if len(non_self_links) < 3:
        prereq_links = []
        if prerequisites:
            for p in prerequisites:
                p_clean = re.sub(r'[\[\]]+', '', str(p)).strip().replace(" ", "_")
                if p_clean in all_stems and p_clean.lower() != current_title.lower():
                    prereq_links.append(f"[[{p_clean}]]")
                    
        if len(prereq_links) < 2:
            for s in all_stems:
                if s.lower() != current_title.lower() and f"[[{s}]]" not in prereq_links:
                    prereq_links.append(f"[[{s}]]")
                if len(prereq_links) >= 2:
                    break
                    
        if len(prereq_links) >= 2:
            connection_sentence = f"\n\nThis concept is fundamentally connected to {prereq_links[0]} and operates within the {prereq_links[1]} framework."
            core_body = core_body.strip() + connection_sentence
            changed = True
            
    # 4. If count > 5, convert excess to plain text
    links_all = re.findall(r'\[\[([^\]]+)\]\]', core_body)
    if len(links_all) > 5:
        count = 0
        def link_reducer(match):
            nonlocal count
            count += 1
            inner = match.group(1)
            if count > 5:
                parts = inner.split('|')
                return parts[1] if len(parts) > 1 else parts[0].replace("_", " ")
            return match.group(0)
        core_body = re.sub(r'\[\[([^\]]+)\]\]', link_reducer, core_body)
        changed = True
        
    if changed:
        sections[2] = f"{heading}\n\n{core_body.strip()}"
        body = reassemble_sections(sections)
        
    return body, changed


def reassemble_sections(sections: List[str]) -> str:
    # Safely reassemble H2 sections with correct gutter newlines
    cleaned = []
    for s in sections:
        s_strip = s.strip()
        if s_strip:
            cleaned.append(s_strip)
    assembled = "\n\n## ".join(cleaned)
    if not assembled.startswith("##"):
        assembled = "## " + assembled
    return assembled + "\n"

