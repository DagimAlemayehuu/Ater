with open('apps/desktop/e2e/student.spec.ts', 'r') as f:
    content = f.read()

content = content.replace("await page.locator('button', { hasText: /AI & Keys/i }).first().click();", "await page.locator('[data-tour=\"tab-ai-config\"]').first().click();")

with open('apps/desktop/e2e/student.spec.ts', 'w') as f:
    f.write(content)
