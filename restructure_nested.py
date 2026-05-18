import os
import shutil
from pathlib import Path

def main():
    vault_root = Path("/Users/dabodestroyer/code/Antigravity/Ater/Obsidian_Vault")
    db_root = vault_root / "database"
    
    if not vault_root.exists():
        print(f"Error: Vault root not found at {vault_root}")
        return

    print("Cleaning up old flat directories...")
    flat_folders = [
        db_root / "statuses",
        db_root / "difficulties",
        db_root / "confidences",
        db_root / "types",
        db_root / "priorities",
        db_root / "seasons",
        db_root / "levels",
        db_root / "programs"
    ]
    for folder in flat_folders:
        if folder.exists() and folder.is_dir():
            shutil.rmtree(folder)
            print(f"Deleted flat relation folder: {folder.relative_to(vault_root)}")

    # Clean existing nested folders to ensure fresh seed
    nested_roots = [
        db_root / "courses",
        db_root / "semesters",
        db_root / "years",
        db_root / "assignments",
        db_root / "exams",
        db_root / "study planner"
    ]
    for root in nested_roots:
        if root.exists():
            shutil.rmtree(root)

    # Re-create all base directories and select subfolders
    select_folders = [
        db_root / "courses" / "status",
        db_root / "courses" / "difficulty",
        db_root / "courses" / "grade",
        db_root / "courses" / "professor",
        db_root / "semesters" / "status",
        db_root / "years" / "status",
        db_root / "years" / "academic level",
        db_root / "assignments" / "status",
        db_root / "assignments" / "priority",
        db_root / "assignments" / "type",
        db_root / "exams" / "type",
        db_root / "study planner" / "status",
        db_root / "study planner" / "confidence",
        db_root / "study planner" / "type",
        db_root / "inbox"
    ]

    print("Creating nested select property subfolders...")
    for folder in select_folders:
        folder.mkdir(parents=True, exist_ok=True)

    # Seed local select markdown files
    seeds = {
        db_root / "courses" / "status": ["Planned", "In Progress", "Completed"],
        db_root / "courses" / "difficulty": ["Easy", "Medium", "Hard", "Expert"],
        db_root / "courses" / "grade": ["A", "B", "C", "D", "F", "P"],
        db_root / "courses" / "professor": ["Dr. Alan Turing", "Dr. Ada Lovelace", "Prof. Richard Feynman"],
        db_root / "semesters" / "status": ["Planned", "Active", "Completed"],
        db_root / "years" / "status": ["Active", "Completed", "Future"],
        db_root / "years" / "academic level": ["Undergraduate", "Graduate", "PhD"],
        db_root / "assignments" / "status": ["Planned", "In Progress", "Completed"],
        db_root / "assignments" / "priority": ["Low", "Medium", "High", "Critical"],
        db_root / "assignments" / "type": ["Homework", "Project", "Reading", "Lab"],
        db_root / "exams" / "type": ["Midterm", "Final", "Quiz", "Assignment"],
        db_root / "study planner" / "status": ["Not Started", "Planned", "In Progress", "Reviewing", "Completed"],
        db_root / "study planner" / "confidence": ["High", "Medium", "Low"],
        db_root / "study planner" / "type": ["Hub", "Atomic", "Possible Questions"]
    }

    print("Seeding select option md files...")
    for folder, items in seeds.items():
        for item in items:
            file_path = folder / f"{item}.md"
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"---\ntitle: {item}\n---\n# {item}")

    # Seed Mock Entity Records
    print("Seeding academic entity records...")
    
    # Year
    with open(db_root / "years" / "Year_I.md", "w", encoding="utf-8") as f:
        f.write('''---
title: Year I
Status: "[[Active]]"
Academic Level: "[[Undergraduate]]"
Current Year: true
---
# Year I
Primary Undergraduate Year.
''')

    # Semester
    with open(db_root / "semesters" / "2026_Spring.md", "w", encoding="utf-8") as f:
        f.write('''---
title: 2026 Spring
Status: "[[Active]]"
Year: "[[Year_I]]"
---
# 2026 Spring Semester
Current Academic Semester.
''')

    # Courses
    with open(db_root / "courses" / "CS_101.md", "w", encoding="utf-8") as f:
        f.write('''---
title: CS 101
Status: "[[Active]]"
Semester: "[[2026_Spring]]"
Grade: "[[A]]"
Credits: 4
Professor: "[[Dr. Alan Turing]]"
Difficulty: "[[Medium]]"
Location: Hall 4A
Schedule: Mon/Wed 10:00 AM
---
# CS 101: Introduction to Computer Science
Overview of foundational computation, binary operations, and algorithms.
''')

    with open(db_root / "courses" / "Calculus_II.md", "w", encoding="utf-8") as f:
        f.write('''---
title: Calculus II
Status: "[[Active]]"
Semester: "[[2026_Spring]]"
Grade: "[[B]]"
Credits: 4
Professor: "[[Dr. Ada Lovelace]]"
Difficulty: "[[Hard]]"
Location: Hall 2B
Schedule: Tue/Thu 1:00 PM
---
# Calculus II: Integration & Advanced Series
Overview of integration methods, Taylor series, and parametric equations.
''')

    # Assignments
    with open(db_root / "assignments" / "Lab_1_Recursion.md", "w", encoding="utf-8") as f:
        f.write('''---
title: Lab 1 Recursion
Status: "[[Planned]]"
Priority: "[[High]]"
Course: "[[CS_101]]"
Type: "[[Homework]]"
due_date: "2026-05-25"
Estimated Hours: 4
---
# Lab 1 Recursion
Implement basic recursive traversals in tree data structures.
''')

    # Exams
    with open(db_root / "exams" / "Midterm_1.md", "w", encoding="utf-8") as f:
        f.write('''---
title: Midterm 1
Status: "[[Upcoming]]"
Course: "[[CS_101]]"
Type: "[[Midterm]]"
date: "2026-05-28"
Time: "10:00 AM"
Location: Hall 4A
Confidence Level: "[[High]]"
---
# Midterm 1 Exam
Covers complexity analysis and recursion.
''')

    # Study Sessions
    with open(db_root / "study planner" / "Session_1.md", "w", encoding="utf-8") as f:
        f.write('''---
title: Study Session 1
Status: "[[In Progress]]"
Course: "[[CS_101]]"
Type: "[[Hub]]"
due_date: "2026-05-20"
Target Hours: 2
Actual Hours: 1
Confidence Level: "[[High]]"
---
# Recursion Stack walkthrough
Walkthrough of system recursion call stack and local frame variables.
''')

    print("Success! Obsidian Vault fully restructured to nested select directories and seeded successfully.")

if __name__ == "__main__":
    main()
