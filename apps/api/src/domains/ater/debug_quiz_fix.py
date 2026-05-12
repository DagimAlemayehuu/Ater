import re
from pathlib import Path

file_path = Path('/Users/dabodestroyer/code/Antigravity/Ater/Obsidian_Vault/Notes/Winter 2026/Economics/1_Basics_Of_Economics/Economic_Systems.md')
text = file_path.read_text()

# Regex from post_processing.py
def fix_quiz_blanks(m):
    quiz_json = m.group(1)
    fixed_json = re.sub(r'(?i)\bBlank\b|___+|\.{3,}', '[[blank]]', quiz_json)
    return f"```interactive-quiz\n{fixed_json}\n```"

new_text = re.compile(r'```interactive-quiz\s*\n(.*?)\n```', re.DOTALL).sub(fix_quiz_blanks, text)

if new_text != text:
    print("FIXED!")
    file_path.write_text(new_text)
else:
    print("NOT FIXED")
    # Debug: show the quiz block
    m = re.search(r'```interactive-quiz\s*\n(.*?)\n```', text, re.DOTALL)
    if m:
        print(f"Quiz content found: {m.group(1)[:100]}...")
        # Check if Blank is in there
        if "Blank" in m.group(1):
            print("Blank FOUND in content")
            # Try the sub manually
            test_sub = re.sub(r'(?i)\bBlank\b|___+|\.{3,}', '[[blank]]', m.group(1))
            if test_sub != m.group(1):
                print("Manual sub WORKED")
            else:
                print("Manual sub FAILED")
        else:
            print("Blank NOT found in content")
    else:
        print("Quiz block NOT found")
