import re
from pathlib import Path

file_path = Path('/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/Notes/Winter 2026/Economics/1_Basics_Of_Economics/Scarcity.md')
text = file_path.read_text()

# Regex from post_processing.py
def fix_quiz_blanks(m):
    quiz_json = m.group(1)
    # Using a literal string for testing
    fixed_json = re.sub(r'(?i)\bBlank\b', '[[blank]]', quiz_json)
    return f"```interactive-quiz\n{fixed_json}\n```"

new_text = re.compile(r'```interactive-quiz\s*\n(.*?)\n```', re.DOTALL).sub(fix_quiz_blanks, text)

if new_text != text:
    print("FIXED!")
    # Check if Blank is still there
    if "Blank" in new_text:
        print("Blank STILL there despite replacement!")
        # Find where it is
        m = re.search(r'Blank', new_text)
        print(f"Context: {new_text[m.start()-20:m.end()+20]}")
    file_path.write_text(new_text)
else:
    print("NOT FIXED")
