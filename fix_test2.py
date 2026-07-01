with open('apps/desktop/src/tests/Obsidian.test.tsx', 'r') as f:
    content = f.read()

content = content.replace("hubPath: '',", "hubPath: 'database/learning paths/Computer_Science_Hub.md',")

with open('apps/desktop/src/tests/Obsidian.test.tsx', 'w') as f:
    f.write(content)
