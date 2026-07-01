const fs = require('fs');

const studentSpecFile = 'apps/desktop/e2e/student.spec.ts';
let specContent = fs.readFileSync(studentSpecFile, 'utf8');

// For settings test, the tab might have slightly different text, so let's try to click by id or just clicking 'Keys'
specContent = specContent.replace("await page.getByRole('tab', { name: /AI & Keys/i }).click();", "await page.locator('[data-tour=\"tab-ai-config\"]').click();");

// For the explorer test, it seems it's waiting for "Computer" text but it's not appearing.
// Let's modify the tauri mock to ensure it returns the list properly when `list_obsidian_files` is called.
const tauriMockFile = 'apps/desktop/e2e/mocks/tauri.js';
let tauriContent = fs.readFileSync(tauriMockFile, 'utf8');
if (!tauriContent.includes("return { files: state.files }")) {
   tauriContent = tauriContent.replace("return state.files;", "return { files: state.files };");
   fs.writeFileSync(tauriMockFile, tauriContent, 'utf8');
}

fs.writeFileSync(studentSpecFile, specContent, 'utf8');
