const fs = require('fs');

const tauriMockFile = 'apps/desktop/e2e/mocks/tauri.js';
let content = fs.readFileSync(tauriMockFile, 'utf8');

// Patch sidecar requests natively in window.fetch instead
const fetchPatch = `
// Intercept fetch calls for sidecar HTTP requests during E2E
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = args[0];
  if (typeof url === 'string' && url.includes('/api/notebooklm/auth/status')) {
    return new Response(JSON.stringify({ auth_status: 'configured', email: 'test@example.com' }), { status: 200 });
  }
  return originalFetch(...args);
};
`;

if (!content.includes('originalFetch = window.fetch')) {
  content = content.replace('window.__TAURI_INTERNALS__ = {', fetchPatch + '\nwindow.__TAURI_INTERNALS__ = {');
  fs.writeFileSync(tauriMockFile, content, 'utf8');
}

const studentSpecFile = 'apps/desktop/e2e/student.spec.ts';
let specContent = fs.readFileSync(studentSpecFile, 'utf8');
specContent = specContent.replace("await page.getByRole('tab', { name: /AI & Keys/i }).click();", "await page.getByRole('tab', { name: /AI \\& Keys/i }).click();");
fs.writeFileSync(studentSpecFile, specContent, 'utf8');
