import re
import yaml
import sqlite3
from pathlib import Path
from typing import List
from difflib import SequenceMatcher

def canonicalize_unit(unit_dir: Path):
    for note in unit_dir.glob("*.md"):
        text = note.read_text(encoding="utf-8")
        
        # Fix spaces inside brackets: [[ Title ]] → [[Title]]
        # Fix spaces in title: [[some title]] → [[Some_Title]]
        def fix(m):
            inner = m.group(1).strip()
            # Replace spaces with underscores and split by underscore
            parts = inner.replace(" ", "_").split("_")
            # For each part, we want to maintain C++ or capitalize normally
            # Specifically, we want Title Case for every word part
            capitalized_parts = []
            for w in parts:
                if not w: continue
                # We need to capitalize the first letter, but keep things like C++ intact
                # if we just do w.capitalize(), C++ becomes C++ which is fine, but it lowercases the rest
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
        r'(^\|.+\|$)',             # table rows (first one)
    ]
    combined = re.compile('|'.join(PATTERNS))
    
    for note_file in unit_dir.glob("*.md"):
        lines = note_file.read_text(encoding="utf-8").split('\n')
        result = []
        for i, line in enumerate(lines):
            # If current line is a pattern match AND previous line is not blank
            if combined.match(line.strip()) and result and result[-1].strip() != '':
                result.append('')  # insert blank line before
            result.append(line)
            # If current line is a pattern match AND next line is not blank
            if combined.match(line.strip()) and i + 1 < len(lines) and lines[i+1].strip() != '':
                # Note: this logic modifies next line during current step if we aren't careful, 
                # actually it's easier to just insert after, but we handle it passively
                pass
        
        fixed = '\n'.join(result)
        # One pass for after-gutter
        final_lines = fixed.split('\n')
        final_result = []
        for i, line in enumerate(final_lines):
            final_result.append(line)
            if combined.match(line.strip()) and i + 1 < len(final_lines) and final_lines[i+1].strip() != '':
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

    hub_text = hub_file.read_text(encoding="utf-8")

    # Build a fresh connections block
    connection_lines = "\n".join(f"- [ ] [[{stem}]]" for stem in deployed_stems)
    new_connections_block = f"## Connections\n\n{connection_lines}\n"

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
    print(f"[HubSync] Rebuilt connections for {hub_file.name}: {len(deployed_stems)} notes linked.")
