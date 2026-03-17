with open('apps/api/src/domains/ai/scribe.py', 'r') as f:
    code = f.read()

# ObsidianClient has `write_note`? Let's check ObsidianClient
import re
with open('apps/api/src/domains/obsidian/client.py', 'r') as client_f:
    client_code = client_f.read()

if "write_file" not in client_code and "write_note" in client_code:
    code = code.replace("self.obsidian.write_file", "self.obsidian.write_note")

with open('apps/api/src/domains/ai/scribe.py', 'w') as f:
    f.write(code)
