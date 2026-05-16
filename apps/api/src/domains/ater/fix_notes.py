#!/usr/bin/env python3
import os
import re
import yaml
from pathlib import Path

# Mock/Import necessary parts of VaultManager logic
ALWAYS_UPPERCASE = ["ER", "DBMS", "SQL", "IS", "DDLC", "DSDLC", "IS", "IT", "AI", "UI", "UX", "CRUD", "API", "OS"]

def get_canonical_title(text: str) -> str:
    if not text: return "Untitled"
    text = text.replace("[[", "").replace("]]", "").strip().strip("\"'").strip()
    temp = re.sub(r"C\+\+", "__CPP__", text, flags=re.IGNORECASE)
    intermediate = re.sub(r"['\.\s\-#\(\)]+", "_", temp)
    intermediate = re.sub(r"[^\w+]+", "_", intermediate)
    intermediate = intermediate.replace("__CPP__", "C++")
    intermediate = re.sub(r"_+", "_", intermediate).strip("_")
    words = []
    for segment in intermediate.split('_'):
        if not segment: continue
        if segment == "C++": words.append("C++")
        elif segment.upper() in ALWAYS_UPPERCASE: words.append(segment.upper())
        else: words.append(segment.title())
    return '_'.join(words)

def fix_notes(vault_path: str):
    vault = Path(vault_path)
    academic_root = vault / "Notes"
    planner_root = vault / "Database" / "study planer"
    
    # 1. Map Hubs: (Course, Unit) -> Hub_Info
    hub_map = {}
    if planner_root.exists():
        for hub_file in planner_root.glob("*.md"):
            try:
                content = hub_file.read_text(encoding="utf-8")
                frontmatter_match = re.search(r"^---(.*?)---", content, re.DOTALL)
                if frontmatter_match:
                    meta = yaml.safe_load(frontmatter_match.group(1))
                    if meta.get("type") == "Hub":
                        course = str(meta.get("course", "")).replace("[[", "").replace("]]", "").strip()
                        unit = str(meta.get("unit", "")).strip()
                        source = meta.get("source")
                        if course and unit:
                            hub_map[(course, unit)] = {
                                "title": hub_file.stem,
                                "source": source
                            }
            except Exception as e:
                print(f"Error reading hub {hub_file}: {e}")

    print(f"Mapped {len(hub_map)} hubs.")

    # 2. Fix Atomic Notes and PQ notes
    files_fixed = 0
    for root, dirs, files in os.walk(academic_root):
        for file in files:
            if not file.endswith(".md"):
                continue
            
            file_path = Path(root) / file
            try:
                content = file_path.read_text(encoding="utf-8")
                frontmatter_match = re.search(r"^---(.*?)---", content, re.DOTALL)
                if not frontmatter_match:
                    continue
                
                raw_meta_str = frontmatter_match.group(1)
                meta = yaml.safe_load(raw_meta_str)
                
                note_type = meta.get("type")
                if note_type not in ["atomic_note", "Possible Questions"]:
                    continue
                
                changed = False
                
                # Extract clean course/unit
                course = str(meta.get("course", "")).replace("[[", "").replace("]]", "").strip()
                unit = str(meta.get("unit", "")).strip()
                
                hub_info = hub_map.get((course, unit))
                if hub_info:
                    # Fix Hub Link
                    expected_hub = f"[[{hub_info['title']}]]"
                    if meta.get("hub") != expected_hub:
                        meta["hub"] = expected_hub
                        changed = True
                    
                    # Fix Source Link (Jump to PDF)
                    expected_source = hub_info['source']
                    if expected_source and meta.get("source") != expected_source:
                        meta["source"] = expected_source
                        changed = True
                
                # Fix Course/Semester Wikilinks
                for field in ["course", "semester"]:
                    val = meta.get(field)
                    if val and isinstance(val, str) and not val.startswith("[["):
                        meta[field] = f"[[{val}]]"
                        changed = True
                
                # Fix prerequisites and source_pages (ensure they are lists, not strings containing brackets)
                for field in ["prerequisites", "source_pages"]:
                    val = meta.get(field)
                    if isinstance(val, str) and val.startswith("[") and val.endswith("]"):
                        # Attempt to parse it if it was accidentally stringified
                        try:
                            # Simple cleanup for common stringified lists
                            cleaned_val = val.strip("[]").replace("'", "").replace("\"", "")
                            if cleaned_val:
                                meta[field] = [item.strip() for item in cleaned_val.split(",")]
                            else:
                                meta[field] = []
                            changed = True
                        except:
                            pass

                if changed:
                    # Custom YAML Dumper to match Obsidian style
                    class ObsidianDumper(yaml.SafeDumper):
                        pass
                    
                    def represent_str(dumper, data):
                        if data.startswith('[[') and data.endswith(']]'):
                            return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')
                        return dumper.represent_scalar('tag:yaml.org,2002:str', data)
                    
                    ObsidianDumper.add_representer(str, represent_str)
                    
                    new_yaml = yaml.dump(meta, Dumper=ObsidianDumper, sort_keys=False, allow_unicode=True, default_flow_style=False)
                    new_content = f"---\n{new_yaml}---" + content[frontmatter_match.end():]
                    
                    file_path.write_text(new_content, encoding="utf-8")
                    files_fixed += 1
                    print(f"Fixed: {file}")
                    
            except Exception as e:
                print(f"Error processing {file}: {e}")

    print(f"Total files fixed: {files_fixed}")

if __name__ == "__main__":
    import sys
    vault_path = sys.argv[1] if len(sys.argv) > 1 else "Obsidian_Vault"
    fix_notes(vault_path)
