import os
import re
import ruamel.yaml
from pathlib import Path

vault_root = Path("Obsidian_Vault")
db_root = vault_root / "3-Database"
yaml = ruamel.yaml.YAML()
yaml.preserve_quotes = True

def normalize_link(value):
    if not value or value == "None" or value == "":
        return None
    if isinstance(value, list):
        return [normalize_link(v) for v in value]
    if isinstance(value, str):
        value = value.strip()
        if value.startswith("[[") and value.endswith("]]"):
            return value
        return f"[[{value}]]"
    return value

def process_file(file_path):
    print(f"Processing: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    frontmatter = {}
    body = content
    if content.startswith("---"):
        match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
        if match:
            try:
                frontmatter = yaml.load(match.group(1)) or {}
                body = content[match.end():]
            except:
                print(f"Failed to parse YAML in {file_path}")

    # Standardize common fields
    if "Status" in frontmatter:
        frontmatter["Status"] = normalize_link(frontmatter["Status"])
    if "Priority" in frontmatter:
        frontmatter["Priority"] = normalize_link(frontmatter["Priority"])
    if "Area" in frontmatter:
        frontmatter["Area"] = normalize_link(frontmatter["Area"])
    if "Goal Relation" in frontmatter:
        frontmatter["Goal Relation"] = normalize_link(frontmatter["Goal Relation"])
    if "Course" in frontmatter:
        frontmatter["Course"] = normalize_link(frontmatter["Course"])
    if "Semester" in frontmatter:
        frontmatter["Semester"] = normalize_link(frontmatter["Semester"])
    if "Year" in frontmatter:
        frontmatter["Year"] = normalize_link(frontmatter["Year"])

    # Specific database logic
    folder_name = file_path.parent.name
    if "Goals" in folder_name:
        if "Type of Goal" in frontmatter:
            frontmatter["Goal Type"] = normalize_link(frontmatter["Type of Goal"])
            del frontmatter["Type of Goal"]
    
    if "Courses" in folder_name:
        if "Professor" in frontmatter:
            frontmatter["Professor"] = normalize_link(frontmatter["Professor"])

    # Write back
    import io
    buf = io.StringIO()
    yaml.dump(frontmatter, buf)
    new_content = f"---\n{buf.getvalue()}---\n{body}"
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)

# Scan and process
for root, dirs, files in os.walk(db_root):
    for name in files:
        if name.endswith(".md") and "_Types" not in root:
            process_file(Path(root) / name)
