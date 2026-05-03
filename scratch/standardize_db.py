import os
import frontmatter
from pathlib import Path

vault_path = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault"
db_path = Path(vault_path) / "3-Database"

def fix_exams():
    folder = db_path / "04 - Exams"
    if not folder.exists(): return
    for f in folder.glob("*.md"):
        try:
            post = frontmatter.load(f)
            # Rename "Exam Date" to "date"
            if "Exam Date" in post.metadata:
                post.metadata["date"] = post.metadata.pop("Exam Date")
                with open(f, "w", encoding="utf-8") as out:
                    out.write(frontmatter.dumps(post))
                print(f"Fixed Exams: {f.name}")
        except Exception as e:
            print(f"Error fixing {f}: {e}")

def fix_study_planner():
    folder = db_path / "06 - Study Planner"
    if not folder.exists(): return
    for f in folder.glob("*.md"):
        try:
            post = frontmatter.load(f)
            # Rename "study_date" to "study date"
            if "study_date" in post.metadata:
                post.metadata["study date"] = post.metadata.pop("study_date")
                with open(f, "w", encoding="utf-8") as out:
                    out.write(frontmatter.dumps(post))
                print(f"Fixed Study Planner: {f.name}")
        except Exception as e:
            print(f"Error fixing {f}: {e}")

def fix_assignments():
    folder = db_path / "03 - Assignments"
    if not folder.exists(): return
    for f in folder.glob("*.md"):
        try:
            post = frontmatter.load(f)
            changed = False
            if "Course" not in post.metadata:
                post.metadata["Course"] = ""
                changed = True
            if changed:
                with open(f, "w", encoding="utf-8") as out:
                    out.write(frontmatter.dumps(post))
                print(f"Fixed Assignments: {f.name}")
        except Exception as e:
            print(f"Error fixing {f}: {e}")

if __name__ == "__main__":
    fix_exams()
    fix_study_planner()
    fix_assignments()
