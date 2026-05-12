import re
import yaml
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
    for note in unit_dir.glob("*.md"):
        text = note.read_text(encoding="utf-8")
        changed = False

        # ── Phase 0: Body sanitizer (agent artifact cleanup) ──────────────────
        # Separate frontmatter from body so we don't corrupt YAML
        parts = text.split("---", 2)
        if len(parts) == 3:
            fm_block = f"---{parts[1]}---"
            body_block = parts[2]
            sanitized_body, body_fixes = sanitize_body(body_block)
            if body_fixes:
                text = fm_block + sanitized_body
                changed = True
                print(f"[Sanitize] {note.name}: {body_fixes}")
        
        # ── Phase 1: Wikilink canonicalization ────────────────────────────────
        # Fix spaces inside brackets: [[ Title ]] → [[Title]]
        # Fix spaces in title: [[some title]] → [[Some_Title]]
        # CRITICAL: Skip path-based links (containing slashes) to avoid destroying PDF store paths
        def fix(m):
            inner = m.group(1).strip()
            if "/" in inner:
                return f"[[{inner}]]"
                
            # Replace spaces with underscores and split by underscore
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
            print(f"[CanonWikilinks] Fixed: {note.name}")

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
            # Use ruamel.yaml-like output or safe_dump
            # For simplicity, safe_dump is used here, but in Ater they use dump_obsidian_yaml, but for quick script safe_dump is atery
            new_yaml = yaml.safe_dump(frontmatter, default_flow_style=False, sort_keys=False)
            note_file.write_text(f"---\n{new_yaml}---\n{body}", encoding="utf-8")
            print(f"[PrereqInfer] {note_file.stem}: {prereqs}")

def enforce_gutter(unit_dir: Path):
    PATTERNS = [
        r'(^#{1,3} .+)',           # headings
        r'(^```)',                  # code fence
        r'(^---$)',                 # horizontal rule
    ]
    combined = re.compile('|'.join(PATTERNS))
    
    def is_table_row(l):
        s = l.strip()
        return s.startswith('|') and s.endswith('|') and len(s) > 1

    for note_file in unit_dir.glob("*.md"):
        lines = note_file.read_text(encoding="utf-8").split('\n')
        result = []
        for i, line in enumerate(lines):
            match = combined.match(line.strip())
            is_tr = is_table_row(line)
            is_prev_tr = i > 0 and is_table_row(lines[i-1])
            
            needs_blank_before = False
            if match and result and result[-1].strip() != '':
                needs_blank_before = True
            if is_tr and not is_prev_tr and result and result[-1].strip() != '':
                needs_blank_before = True
                
            if needs_blank_before:
                result.append('')
                
            result.append(line)
            
        final_lines = result
        final_result = []
        
        for i, line in enumerate(final_lines):
            final_result.append(line)
            match = combined.match(line.strip())
            is_tr = is_table_row(line)
            is_next_tr = i + 1 < len(final_lines) and is_table_row(final_lines[i+1])
            
            needs_blank_after = False
            if match and i + 1 < len(final_lines) and final_lines[i+1].strip() != '':
                needs_blank_after = True
            if is_tr and not is_next_tr and i + 1 < len(final_lines) and final_lines[i+1].strip() != '':
                needs_blank_after = True
                
            if needs_blank_after:
                final_result.append('')

        final_text = '\n'.join(final_result)
        if final_text != '\n'.join(lines):
            note_file.write_text(final_text, encoding="utf-8")
            print(f"[GutterEnforce] Fixed spacing in: {note_file.name}")

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

    # Extract prerequisites to build a tree
    note_data = {}
    for stem in deployed_stems:
        note_file = unit_dir / f"{stem}.md"
        try:
            content = note_file.read_text(encoding="utf-8")
            parts = content.split("---", 2)
            prereq_stems = []
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
            note_data[stem] = prereq_stems
        except Exception:
            note_data[stem] = []

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

    # 2. Sorting weights based on plan_order
    if plan_order:
        order_map = {title: i for i, title in enumerate(plan_order)}
    else:
        order_map = {s: i for i, s in enumerate(sorted(list(deployed_stems)))}
    
    all_stems_sorted = sorted(list(deployed_stems), key=lambda s: order_map.get(s, 999))

    processed = set()
    tree_lines = []

    def build_tree(stem, depth=0):
        if stem in processed: return
        processed.add(stem)
        
        indent = "    " * depth
        tree_lines.append(f"{indent}- [ ] [[{stem}]]")
        
        # Children are notes that have this stem as their "Best" parent.
        # "Best" = the parent with the lowest index in plan_order.
        potential_children = parents_to_children.get(stem, [])
        potential_children.sort(key=lambda s: order_map.get(s, 999))
            
        for child in potential_children:
            if child not in processed:
                p_list = child_to_parents.get(child, [])
                if not p_list: continue
                
                # Robust selection: pick the parent that appears EARLIEST in the plan
                best_parent = min(p_list, key=lambda p: order_map.get(p, 999))
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
                # However, if there's a cycle, we might be the "entry point".
                # If our parent comes AFTER us in the plan, we are the leader.
                if order_map.get(p, 999) > order_map.get(stem, 999):
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
    """
    all_stems = {f.stem for f in unit_dir.glob("*.md")}
    
    for note_file in unit_dir.glob("*.md"):
        content = note_file.read_text(encoding="utf-8")
        
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

