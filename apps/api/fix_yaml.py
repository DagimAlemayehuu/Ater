import os
import re
import yaml
from pathlib import Path

vault_dir = Path("/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/3-Database")
discovery_file = Path("/Users/dabodestroyer/code/Antigravity/LifeOs/apps/api/discovery_output.txt")

# 1. Parse discovery_output.txt to get schemas
schemas = {}
current_db = None

if discovery_file.exists():
    with open(discovery_file, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATABASE: "):
                current_db = line.replace("DATABASE: ", "").strip()
                schemas[current_db] = {}
            elif line.startswith("- ") and current_db:
                # Example: "- Tasks (relation)"
                match = re.match(r"- (.*) \((.*)\)", line)
                if match:
                    prop_name = match.group(1).strip()
                    prop_type = match.group(2).strip()
                    schemas[current_db][prop_name] = prop_type

# Map directory name to schema name
dir_to_db = {
    "01 - Tasks": "Tasks",
    "02 - Projects": "Projects",
    "03 - Assignments": "Assignments",
    "04 - Exams": "Exams",
    "05 - Goals": "Goals",
    "06 - Study Planner": "Study Planner",
    "07 - Courses": "Courses",
    "08 - Semesters": "Semesters",
    "09 - Years": "Years" # Fallback
}

def format_wiki_link(val):
    if not val:
        return []
    if isinstance(val, list):
        res = []
        for v in val:
            v_str = str(v).strip()
            if not v_str: continue
            if v_str.startswith("[[") and v_str.endswith("]]"):
                res.append(v_str)
            else:
                # Remove quotes if any
                v_str = v_str.strip('"').strip("'")
                res.append(f"[[{v_str}]]")
        return res
    else:
        v_str = str(val).strip()
        if not v_str: return []
        if v_str.startswith("[[") and v_str.endswith("]]"):
            return [v_str]
        else:
            v_str = v_str.strip('"').strip("'")
            return [f"[[{v_str}]]"]

for root, dirs, files in os.walk(vault_dir):
    for file in files:
        if not file.endswith(".md"): continue
        
        filepath = Path(root) / file
        dir_name = filepath.parent.name
        
        # We only process the known 9 DB directories
        db_name = dir_to_db.get(dir_name)
        if not db_name:
            # Check if parent directory is one of the 9 (e.g. for subfolders)
            parent_dir_name = filepath.parent.parent.name
            db_name = dir_to_db.get(parent_dir_name)
            if not db_name:
                continue

        schema = schemas.get(db_name, {})
        
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Parse YAML frontmatter
        match = re.match(r"^---\n(.*?)\n---\n(.*)", content, re.DOTALL)
        if not match:
            continue
            
        yaml_text = match.group(1)
        body_text = match.group(2)
        
        try:
            data = yaml.safe_load(yaml_text) or {}
        except Exception as e:
            print(f"Error parsing YAML in {filepath}: {e}")
            continue
            
        new_data = {}
        for k, v in data.items():
            # If the property is in our schema, check its type
            prop_type = schema.get(k)
            
            # Remove formulas and buttons
            if prop_type in ["formula", "button"]:
                continue
                
            # If it's a relation or rollup, format as wiki link
            if prop_type in ["relation", "rollup"]:
                new_data[k] = format_wiki_link(v)
            else:
                # Handle cases where property might not be in schema but looks like relation/rollup in original yaml
                # e.g. lists of links
                if isinstance(v, list):
                    is_link_list = all(isinstance(i, str) and i.startswith("[[") for i in v)
                    if is_link_list:
                        new_data[k] = format_wiki_link(v)
                    else:
                        new_data[k] = v
                elif isinstance(v, str) and v.startswith("[[") and v.endswith("]]"):
                    new_data[k] = format_wiki_link(v)
                else:
                    # Remove "Edited", "Created" if they are internal
                    if k in ["Edited", "Created", "Archive"]:
                        # User wants perfect alignment, so keep unless formula
                        # Actually wait, earlier I noted: "Automatically drops Edited, Created..."
                        # User says: "perfectly align the yaml properties in my obsidian and note the relations and rollups are supposed to be wiki links [[]] and remove all formula properties from both."
                        pass
                    new_data[k] = v

        # Write back
        class Dumper(yaml.Dumper):
            def increase_indent(self, flow=False, *args, **kwargs):
                return super().increase_indent(flow=flow, indentless=False)

        new_yaml_text = yaml.dump(new_data, Dumper=Dumper, default_flow_style=False, sort_keys=True, allow_unicode=True)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"---\n{new_yaml_text}---\n{body_text}")
            
print("YAML alignment complete.")
