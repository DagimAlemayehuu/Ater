const fs = require('fs');
const path = require('path');

const specPath = path.join(__dirname, 'apps/e2e-tests/tests/coach.spec.ts');
let code = fs.readFileSync(specPath, 'utf8');

code = code.replace(
    /window\.__TAURI_INTERNALS__ = \{/,
    `window.__TAURI_INTERNALS__ = {
                // Tauri load method needs to return the actual object with keys because that is how load resolves
                // Actually the config uses \`store.get\` which calls \`plugin:store|get\` or we can mock defaults.
                `
);

// Actually, ConfigContext calls load() and expects it to return a store object that has a .get method... wait no, tauri-apps/plugin-store load() returns a Store instance.
// Let's just bypass the UI gating by mocking the hook or filling the form. Filling the form is safer e2e.

code = code.replace(
    /test\('Coach page loads and sends message', async \(\{ page \}\) => \{/,
    `test('Coach page loads and sends message', async ({ page }) => {
        // Complete Onboarding to bypass lock
        await page.goto('/onboarding');
        await page.fill('input[type="password"]', 'mock-notion-key');
        await page.fill('input[placeholder="AIza..."]', 'mock-gemini-key');
        await page.fill('input[placeholder="/Users/name/Vault"]', '/mock/vault');
        await page.click('button:has-text("Initialize Workspace")');
        await page.waitForURL('**/dashboard');
`
);

fs.writeFileSync(specPath, code);
