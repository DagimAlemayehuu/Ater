import asyncio
from pathlib import Path
import ruamel.yaml

vault_path = Path("/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault")
db_path = vault_path / "3-Database"

if not db_path.exists():
    print("Database path does not exist:", db_path)
else:
    print("Database path exists:", db_path)
    
databases = []
yaml = ruamel.yaml.YAML(typ='safe', pure=True)

for entry in db_path.iterdir():
    if entry.is_dir() and not entry.name.startswith("."):
        schema = {}
        for md_file in entry.glob("*.md"):
            try:
                with open(md_file, "r", encoding="utf-8") as f:
                    content = f.read()
                    if content.startswith("---"):
                        end_idx = content.find("---", 3)
                        if end_idx != -1:
                            frontmatter = yaml.load(content[3:end_idx])
                            if isinstance(frontmatter, dict):
                                schema = {k: type(v).__name__ for k, v in frontmatter.items() if k not in ["last_synced", "links"]}
                                break
            except Exception as e:
                print(f"Error reading {md_file}: {e}")
        databases.append({
            "id": entry.name,
            "name": entry.name.split(" - ")[-1] if " - " in entry.name else entry.name,
            "schema": schema,
            "type": "obsidian"
        })

print(f"Found {len(databases)} databases: {[db['name'] for db in databases]}")
print(databases[0] if databases else "None")
