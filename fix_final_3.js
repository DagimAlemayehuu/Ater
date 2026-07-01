const fs = require('fs');

const tauriMockFile = 'apps/desktop/e2e/mocks/tauri.js';
let tauriContent = fs.readFileSync(tauriMockFile, 'utf8');
// Fix the issue where I replaced `return state.files;` with `return { files: state.files };`
if (tauriContent.includes("if (cmd === 'list_obsidian_files') {\n        return { files: state.files };\n      }")) {
  tauriContent = tauriContent.replace("if (cmd === 'list_obsidian_files') {\n        return { files: state.files };\n      }", "if (cmd === 'list_obsidian_files') {\n        return state.files;\n      }");
  fs.writeFileSync(tauriMockFile, tauriContent, 'utf8');
}

const studentSpecFile = 'apps/desktop/e2e/student.spec.ts';
let specContent = fs.readFileSync(studentSpecFile, 'utf8');

// The UI actually replaces underscores with spaces in file names using `formatPathTitle`
specContent = specContent.replace("await page.waitForTimeout(1000); const folderNode = page.getByText(/Computer Science/i);", "const folderNode = page.getByText(/Computer_Science/i);");
specContent = specContent.replace("const noteNode = page.getByText(/Data Structures And Algorithms/i);", "const noteNode = page.getByText(/Data_Structures_And_Algorithms/i);");
// and revert
specContent = specContent.replace("await page.waitForTimeout(1000); await page.getByText('AI & Keys').click();", "await page.getByRole('tab', { name: /AI & Keys/i }).click();");

fs.writeFileSync(studentSpecFile, specContent, 'utf8');
