const fs = require('fs');

const studentSpecFile = 'apps/desktop/e2e/student.spec.ts';
let specContent = fs.readFileSync(studentSpecFile, 'utf8');

// For settings, it seems Playwright doesn't like getByText with the escaped ampersand or exact match, let's use getByRole again
specContent = specContent.replace("await page.getByText(/AI \\& Keys/i).click();", "await page.getByRole('tab', { name: /AI & Keys/i }).click();");

fs.writeFileSync(studentSpecFile, specContent, 'utf8');
