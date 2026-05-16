import os
import re
from pathlib import Path

replacements = {
    "09 - Years": "years",
    "08 - Semesters": "semesters",
    "07 - Courses": "courses",
    "06 - Study Planner": "study planer",
    "04 - Exams": "exams",
    "03 - Assignments": "assignments",
    "00 - Bases": "bases",
    "01 - Areas": "areas"
}

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

for root_dir in ['apps/desktop/src', 'apps/api/src']:
    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.py')):
                process_file(os.path.join(root, file))
