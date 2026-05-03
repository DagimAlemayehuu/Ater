import os

path = '/Users/dabodestroyer/code/Antigravity/LifeOs/apps/desktop/src/routes/academic.tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix the broken import block.
# It currently looks like:
# ...
#     Zap,
#     Calendar,
#
# import {
# ...

content = content.replace("Zap,\n    Calendar,\n\nimport {", "Zap,\n    Calendar,\n    ChevronDown,\n    ChevronUp,\n    Info\n} from 'lucide-react';\n\nimport {")

with open(path, 'w') as f:
    f.write(content)
