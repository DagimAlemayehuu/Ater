const fs = require('fs');

const studentSpecFile = 'apps/desktop/e2e/student.spec.ts';
let specContent = fs.readFileSync(studentSpecFile, 'utf8');

// The UI actually replaces underscores with spaces in file names using `formatPathTitle`
specContent = specContent.replace("await page.waitForTimeout(1000); const folderNode = page.getByText(/Computer_Science/i);", "await page.waitForTimeout(1000); const folderNode = page.getByText(/Computer Science/i);");
specContent = specContent.replace("const noteNode = page.getByText(/Data_Structures_And_Algorithms/i);", "const noteNode = page.getByText(/Data Structures And Algorithms/i);");


fs.writeFileSync(studentSpecFile, specContent, 'utf8');
