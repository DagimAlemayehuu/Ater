import re
import yaml
from pathlib import Path
from typing import List
from difflib import SequenceMatcher

def canonicalize_unit(unit_dir: Path):
    for note in unit_dir.glob("*.md"):
        text = note.read_text(encoding="utf-8")
        
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
            note.write_text(fixed, encoding="utf-8")
            print(f"[CanonWikilinks] Fixed: {note.name}")

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
            # For simplicity, safe_dump is used here, but in OKA they use dump_obsidian_yaml, but for quick script safe_dump is okay
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

def sync_hub_connections(hub_file: Path, unit_dir: Path):
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
                        m = re.search(r'\[\[(.*?)\]\]', str(p))
                        if m:
                            prereq_stems.append(m.group(1).split('|')[0].strip())
            note_data[stem] = prereq_stems
        except Exception:
            note_data[stem] = []

    children_map = {stem: [] for stem in deployed_stems}
    roots = []
    
    for stem in deployed_stems:
        prereqs = note_data[stem]
        local_prereqs = [p for p in prereqs if p in note_data]
        if local_prereqs:
            parent = local_prereqs[0]
            children_map[parent].append(stem)
        else:
            roots.append(stem)

    lines = []
    visited = set()
    
    def build_tree(node, current_depth):
        if node in visited:
            return
        visited.add(node)
        indent = min(current_depth, 3) * 2
        prefix = " " * indent
        lines.append(f"{prefix}- [ ] [[{node}]]")
        
        for child in sorted(children_map[node]):
            if child not in visited:
                build_tree(child, current_depth + 1)
                
    for root in sorted(roots):
        build_tree(root, 1)
        
    # Catch any disconnected cycles
    for stem in deployed_stems:
        if stem not in visited:
            build_tree(stem, 1)

    hub_text = hub_file.read_text(encoding="utf-8")

    hub_title = hub_file.stem.replace("_Hub", "").replace("_", " ")
    hub_title = re.sub(r"^\d+[\s\-_]*", "", hub_title)

    connection_lines = "\n".join(lines)
    new_connections_block = f"## Connections\n\n- {hub_title}\n{connection_lines}\n"

    # Replace or append the Connections section
    if "## Connections" in hub_text:
        # Replace everything from ## Connections to end of file
        hub_text = re.sub(
            r"## Connections.*$",
            new_connections_block,
            hub_text,
            flags=re.DOTALL
        )
    else:
        hub_text = hub_text.rstrip() + f"\n\n{new_connections_block}"

    hub_file.write_text(hub_text, encoding="utf-8")
    print(f"[HubSync] Rebuilt connections for {hub_file.name}: {len(deployed_stems)} notes linked in tree format.")
