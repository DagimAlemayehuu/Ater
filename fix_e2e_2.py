with open('apps/desktop/e2e/student.spec.ts', 'r') as f:
    content = f.read()

# Fix the first failure
content = content.replace("await folderNode.waitFor({ state: 'visible', timeout: 10000 });", "await expect(folderNode.first()).toBeVisible({ timeout: 10000 });")
content = content.replace("await folderNode.click();", "await folderNode.first().click();")

content = content.replace("const noteNode = page.getByText(/Data_Structures_And_Algorithms/i);", "const noteNode = page.getByText(/Data_Structures_And_Algorithms/i).first();")

# Fix the second failure
content = content.replace("await page.getByText(/AI & Keys/i).click();", "await page.locator('button', { hasText: /AI & Keys/i }).first().click();")


with open('apps/desktop/e2e/student.spec.ts', 'w') as f:
    f.write(content)
