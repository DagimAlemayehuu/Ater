with open('apps/desktop/e2e/student.spec.ts', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "// Click on the AI & Keys tab trigger" in line:
        lines[i+1] = "    await page.getByText(/AI & Keys/i).click();\n"
        break

with open('apps/desktop/e2e/student.spec.ts', 'w') as f:
    f.writelines(lines)
