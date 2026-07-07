import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function injectTauriMocks(page: Page) {
  await page.addInitScript({
    path: path.join(__dirname, 'mocks/tauri.js'),
  });
}

/**
 * Deterministic bypass for activation and onboarding.
 * Sets the mock store state in localStorage before the app initializes.
 */
async function bypassOnboarding(page: Page) {
  await page.addInitScript(() => {
    const mockData = {
      isActivated: true,
      isProgramConfigured: true,
      appMode: 'beta',
      obsidianVaultPath: '/Users/test/vault',
      displayName: 'E2E Tester',
      aiProvider: 'google',
      aiModel: 'gemini-2.0-flash',
      academicFolderPath: 'Notes',
    };
    window.localStorage.setItem('ater_mock_store', JSON.stringify(mockData));
    // Also mock the store in window if it's already there
    if ((window as any).__TAURI_STORE__) {
        // This is handled by tauri.js mock
    }
  });
}

test.describe('Route Smoke Coverage', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept sidecar API calls to prevent real network requests
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/api/chat/conversations')) {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'mock-conv-id' }) });
        }
      } else if (url.includes('/api/chat/memories')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (url.includes('/api/chat/attachments')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (url.includes('/api/ater/tutor/session_by_hub')) {
        await route.fulfill({ status: 404 });
      } else if (url.includes('/api/ater/source/jobs')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
      }
    });

    await injectTauriMocks(page);
    await bypassOnboarding(page);
    await page.goto('/?bypass=true');
  });

  test('Shell (Root) renders successfully', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveTitle(/ater/i);
    // Check for a common layout element like sidebar or main content
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ater Chat (Agents) route smoke test', async ({ page }) => {
    await page.goto('/#/agents?bypass=true');
    await page.waitForLoadState('domcontentloaded');
    // Look for chat-specific elements
    await expect(page.locator('textarea[placeholder*="Ask Ater"]')).toBeVisible({ timeout: 10000 });
  });

  test('Academic Dashboard route smoke test', async ({ page }) => {
    await page.goto('/#/academic?bypass=true');
    await page.waitForLoadState('domcontentloaded');
    // Look for academic-specific elements
    await expect(page.locator('body')).toContainText(/Computer Science/i, { timeout: 10000 });
  });

  test('Practice route smoke test', async ({ page }) => {
    await page.goto('/#/practice?bypass=true');
    await page.waitForLoadState('domcontentloaded');
    // Look for practice-specific elements
    await expect(page.locator('body')).toContainText(/Practice/i, { timeout: 10000 });
  });

  test('Settings route smoke test', async ({ page }) => {
    await page.goto('/#/settings?bypass=true');
    await page.waitForLoadState('domcontentloaded');
    // Look for settings tabs
    await expect(page.locator('button', { hasText: /General/i })).toBeVisible({ timeout: 10000 });
  });

  test('Vault Viewer (Obsidian) route smoke test', async ({ page }) => {
    await page.goto('/#/obsidian?bypass=true');
    await page.waitForLoadState('domcontentloaded');
    // Look for file explorer elements or mock content
    // In beta/simulation mode with bypass, it might show mockDemoData
    await expect(page.locator('body')).toContainText(/Notes|Computer_Science/i, { timeout: 10000 });
  });
});
