with open('apps/desktop/e2e/student.spec.ts', 'r') as f:
    content = f.read()

# Fix the first failure
content = content.replace("await expect(folderNode).toBeVisible();", "await expect(folderNode.first()).toBeVisible({ timeout: 10000 });")
content = content.replace("await folderNode.click();", "await folderNode.first().click();")

content = content.replace("const noteNode = page.getByText(/Data_Structures_And_Algorithms/i);", "const noteNode = page.getByText(/Data_Structures_And_Algorithms/i).first();")

# Fix the second failure
content = content.replace("await page.getByRole('tab', { name: /AI & Keys/i }).click();", "await page.locator('[data-tour=\"tab-ai-config\"]').click();")


with open('apps/desktop/e2e/student.spec.ts', 'w') as f:
    f.write(content)
