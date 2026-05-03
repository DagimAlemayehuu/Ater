import os
from pathlib import Path
import re

vault_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault"
db_path = Path(vault_path) / "3-Database"

def process_file(f, renames):
    try:
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
        
        if not content.startswith("---"):
            return
            
        end_idx = content.find("---", 3)
        if end_idx == -1:
            return
            
        header = content[3:end_idx]
        body = content[end_idx+3:]
        
        lines = header.split("\n")
        new_lines = []
        changed = False
        
        for line in lines:
            found_rename = False
            for old, new in renames.items():
                if line.startswith(f"{old}:"):
                    new_line = line.replace(f"{old}:", f"{new}:", 1)
                    new_lines.append(new_line)
                    changed = True
                    found_rename = True
                    break
            if not found_rename:
                new_lines.append(line)
        
        if changed:
            new_header = "\n".join(new_lines)
            with open(f, "w", encoding="utf-8") as file:
                file.write(f"---{new_header}---{body}")
            print(f"Fixed: {f.name}")
    except Exception as e:
        print(f"Error fixing {f}: {e}")

def fix_exams():
    folder = db_path / "04 - Exams"
    if not folder.exists(): return
    for f in folder.glob("*.md"):
        process_file(f, {"Exam Date": "date", "exam_date": "date"})

def fix_study_planner():
    folder = db_path / "06 - Study Planner"
    if not folder.exists(): return
    for f in folder.glob("*.md"):
        process_file(f, {"study_date": "study date"})

def fix_assignments():
    folder = db_path / "03 - Assignments"
    if not folder.exists(): return
    for f in folder.glob("*.md"):
        # Fix property renames first
        process_file(f, {"due_date": "due date"})
        
        # Then ensure Course exists
        try:
            with open(f, "r", encoding="utf-8") as file:
                content = file.read()
            if "Course:" not in content[:500]:
                if content.startswith("---"):
                    end_idx = content.find("---", 3)
                    if end_idx != -1:
                        new_content = f"---Course: \"\"\n{content[3:]}"
                        with open(f, "w", encoding="utf-8") as file:
                            file.write(new_content)
                        print(f"Added Course to Assignment: {f.name}")
        except Exception: pass

if __name__ == "__main__":
    fix_exams()
    fix_study_planner()
    fix_assignments()
