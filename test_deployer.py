import re

block = """--- START_NOTE ---
---
title: "Note_Title"
---
# Content here...
--- END_NOTE ---
"""

inner_match = re.search(r"---?\s*START_NOTE\s*---?\s*\n(.*?)\n\s*---?\s*END_NOTE\s*---?", block, re.DOTALL | re.IGNORECASE)
print("Match is:", inner_match.group(1) if inner_match else None)
