import re

with open('apps/desktop/e2e/student.spec.ts', 'r') as f:
    content = f.read()

content = content.replace("await expect(folderNode).toBeVisible();", "await folderNode.waitFor({ state: 'visible', timeout: 10000 });")

content = content.replace("await page.getByRole('tab', { name: /AI & Keys/i }).click();", "await page.locator('button', { hasText: /AI & Keys/i }).click();")


with open('apps/desktop/e2e/student.spec.ts', 'w') as f:
    f.write(content)
