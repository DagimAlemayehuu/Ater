import os
import re
from datetime import datetime

SOURCE_DIR = "/Users/dabodestroyer/code/Antigravity/LifeOs/2-Academic"
OUTPUT_DIR = "/Users/dabodestroyer/code/Antigravity/LifeOs/scratch/transformed_academic"

def sanitize_link(text):
    if not text:
        return ""
    text = str(text).replace("[[", "").replace("]]", "")
    text = text.replace("_", " ")
    return f"[[{text}]]"

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Simple frontmatter parser
        fm = {}
        content = text
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                fm_text = parts[1]
                content = parts[2]
                for line in fm_text.split("\n"):
                    if ":" in line:
                        k, v = line.split(":", 1)
                        fm[k.strip()] = v.strip().strip("'").strip('"')

        # Transform metadata
        new_fm = {
            "title": fm.get("title", os.path.basename(file_path).replace(".md", "")),
            "type": fm.get("type", "Note"),
            "course": sanitize_link(fm.get("course", "General")),
            "semester": sanitize_link(fm.get("semester", "Semester I")),
            "unit": str(fm.get("unit", "")).replace("_", " "),
            "status": "Not Started",
            "confidence": "",
            "study_date": "",
            "generated": "true",
            "last_synced": datetime.now().isoformat(),
            "last_edited_time": datetime.now().isoformat(),
            "last_edited_by": "LifeOs AI Agent"
        }

        # Determine new path
        year = str(fm.get("year", "Year II")).replace("_", " ")
        semester = str(fm.get("semester", "Semester I")).replace("_", " ")
        course = str(fm.get("course", "General")).replace("_", " ")
        unit = str(fm.get("unit", "General")).replace("_", " ")
        
        if "Combined_notes" in file_path:
             target_dir = os.path.join(OUTPUT_DIR, year, semester, course, "_Combined")
        else:
             target_dir = os.path.join(OUTPUT_DIR, year, semester, course, unit)

        os.makedirs(target_dir, exist_ok=True)
        target_path = os.path.join(target_dir, os.path.basename(file_path))

        with open(target_path, 'w', encoding='utf-8') as f:
            f.write("---\n")
            for k, v in new_fm.items():
                f.write(f"{k}: \"{v}\"\n")
            f.write("---\n\n")
            f.write(content.strip())
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    # Process Year_II
    year_ii_dir = os.path.join(SOURCE_DIR, "Year_II")
    if os.path.exists(year_ii_dir):
        for root, dirs, files in os.walk(year_ii_dir):
            for file in files:
                if file.endswith(".md"):
                    process_file(os.path.join(root, file))

    # Process Combined_notes
    combined_dir = os.path.join(SOURCE_DIR, "Combined_notes")
    if os.path.exists(combined_dir):
        for file in os.listdir(combined_dir):
            if file.endswith(".md"):
                process_file(os.path.join(combined_dir, file))
    
    print("Transformation complete.")

if __name__ == "__main__":
    main()
