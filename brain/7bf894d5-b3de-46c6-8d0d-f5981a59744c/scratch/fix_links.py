import os
import re
from pathlib import Path

vault_root = Path("/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault")
academic_dir = vault_root / "2-Academic"

wikilink_re = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")

def find_target_case_insensitive(link_name):
    # Try .md first
    target_md = link_name if link_name.lower().endswith(".md") else f"{link_name}.md"
    for p in vault_root.rglob("*"):
        if p.is_file() and p.name.lower() == target_md.lower():
            return p.name.replace(".md", "")
            
    # Try .pdf
    target_pdf = link_name if link_name.lower().endswith(".pdf") else f"{link_name}.pdf"
    for p in vault_root.rglob("*"):
        if p.is_file() and p.name.lower() == target_pdf.lower():
            return p.name
            
    # Try as-is
    for p in vault_root.rglob("*"):
        if p.is_file() and p.name.lower() == link_name.lower():
            return p.name
            
    return None

def fix_links():
    fixed_count = 0
    for root, dirs, files in os.walk(academic_dir):
        for file in files:
            if file.endswith(".md"):
                file_path = Path(root) / file
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                new_content = content
                links = wikilink_re.findall(content)
                for link_name, alias in links:
                    full_match = f"[[{link_name}{'|'+alias if alias else ''}]]"
                    
                    # Check if exists
                    exists = False
                    # Simple check
                    if (vault_root / f"{link_name}.md").exists() or (vault_root / link_name).exists():
                        exists = True
                    
                    if not exists:
                        # Search case-insensitive
                        correct_name = find_target_case_insensitive(link_name)
                        if correct_name and correct_name != link_name:
                            print(f"FIXING: {file_path.name} | '{link_name}' -> '{correct_name}'")
                            replacement = f"[[{correct_name}{'|'+alias if alias else ''}]]"
                            new_content = new_content.replace(full_match, replacement)
                            fixed_count += 1
                
                if new_content != content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
    
    print(f"Total links fixed: {fixed_count}")

if __name__ == "__main__":
    fix_links()
