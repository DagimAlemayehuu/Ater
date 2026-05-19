#!/usr/bin/env python3
import os
from pathlib import Path

def main():
    workspace_root = Path("/Users/dabodestroyer/code/Antigravity/Ater")
    template_root = workspace_root / "vault_template"
    
    # 1. Core folders to build
    folders = [
        "Inbox",
        "Inbox/Generated",
        "Notes",
        ".obsidian",
        "database",
        "database/years",
        "database/years/status",
        "database/years/academic level",
        "database/semesters",
        "database/semesters/status",
        "database/courses",
        "database/courses/status",
        "database/courses/difficulty",
        "database/courses/grade",
        "database/courses/professor",
        "database/study planner",
        "database/study planner/status",
        "database/study planner/confidence",
        "database/study planner/type",
        "database/exams",
        "database/exams/type",
        "database/assignments",
        "database/assignments/status",
        "database/assignments/priority",
        "database/assignments/type"
    ]
    
    # 2. Seed files and their content
    seeds = {
        "database/years/status": ["Active", "Completed", "Future"],
        "database/years/academic level": ["Undergraduate", "Graduate", "PhD"],
        "database/semesters/status": ["Planned", "Active", "Completed"],
        "database/courses/status": ["Planned", "In Progress", "Completed"],
        "database/courses/difficulty": ["Easy", "Medium", "Hard", "Expert"],
        "database/courses/grade": ["A", "B", "C", "D", "F", "P"],
        "database/study planner/status": ["Not Started", "Planned", "In Progress", "Reviewing", "Completed"],
        "database/study planner/confidence": ["High", "Medium", "Low"],
        "database/study planner/type": ["Hub", "Atomic", "Possible Questions"],
        "database/exams/type": ["Midterm", "Final", "Quiz", "Assignment"],
        "database/assignments/status": ["Planned", "In Progress", "Completed"],
        "database/assignments/priority": ["Low", "Medium", "High"],
        "database/assignments/type": ["Homework", "Project", "Reading", "Lab"]
    }
    
    print(f"Creating vault template at: {template_root}")
    
    # Create all folders
    for folder in folders:
        path = template_root / folder
        path.mkdir(parents=True, exist_ok=True)
        print(f"Created folder: {folder}")
        
    # Write option seeds
    for folder, files in seeds.items():
        for filename in files:
            file_path = template_root / folder / f"{filename}.md"
            content = f"---\ntitle: {filename}\n---\n"
            file_path.write_text(content, encoding="utf-8")
            print(f"Created option seed: {folder}/{filename}.md")
            
    print("\nVault template generation complete!")

if __name__ == "__main__":
    main()
