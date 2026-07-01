import re

with open('apps/desktop/src/tests/Obsidian.test.tsx', 'r') as f:
    content = f.read()

# Replace hubPath: 'database/learning paths/Computer_Science_Hub.md' with hubPath: ''
content = content.replace("hubPath: 'database/learning paths/Computer_Science_Hub.md',", "hubPath: '',")

with open('apps/desktop/src/tests/Obsidian.test.tsx', 'w') as f:
    f.write(content)
