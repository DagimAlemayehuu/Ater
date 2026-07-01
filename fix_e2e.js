const fs = require('fs');

const studentSpecFile = 'apps/desktop/e2e/student.spec.ts';
let specContent = fs.readFileSync(studentSpecFile, 'utf8');

// The folder in UI displays "Computer Science" because the app strips underscores to spaces.
// Let's replace `/Computer/i` with `/Computer Science/i` which is more accurate.
// Wait, the previous run failed on `/Computer/i`. It must be that the API call failed to load the tree!
specContent = specContent.replace("const folderNode = page.getByText(/Computer/i);", "await page.waitForTimeout(1000); const folderNode = page.getByText(/Computer/i);");
specContent = specContent.replace("await page.getByRole('tab', { name: /AI & Keys/i }).click();", "await page.waitForTimeout(1000); await page.getByRole('tab', { name: /AI & Keys/i }).click();");

fs.writeFileSync(studentSpecFile, specContent, 'utf8');
