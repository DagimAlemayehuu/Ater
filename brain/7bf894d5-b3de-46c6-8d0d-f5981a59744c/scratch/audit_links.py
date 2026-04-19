import os
import re
from pathlib import Path

vault_root = Path("/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault")
academic_dir = vault_root / "2-Academic"

wikilink_re = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")

def check_links():
    results = []
    for root, dirs, files in os.walk(academic_dir):
        for file in files:
            if file.endswith(".md"):
                file_path = Path(root) / file
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                links = wikilink_re.findall(content)
                for link in links:
                    link = link.strip()
                    # Check if link exists as .md or .pdf
                    found = False
                    
                    # Try relative to current file
                    rel_path = (Path(root) / link)
                    if rel_path.exists() or (rel_path.with_suffix(".md")).exists():
                        found = True
                    
                    if not found:
                        # Try absolute in vault
                        for ext in ["", ".md", ".pdf"]:
                            if (vault_root / (link + ext)).exists():
                                found = True
                                break
                    
                    if not found:
                        # Try global search (RG style)
                        # We just want to know if it exists ANYWHERE in the vault
                        stem = Path(link).stem
                        # This is expensive, maybe just look for exact name match in all files
                        
                    if not found:
                        results.append({
                            "source": str(file_path.relative_to(vault_root)),
                            "target": link
                        })
    return results

if __name__ == "__main__":
    broken = check_links()
    for item in broken:
        print(f"BROKEN: {item['source']} -> {item['target']}")
