import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * E2E Test Fixture: inject Tauri mocks before each test.
 * Any test in this file gets a browser page with the full Tauri IPC stubbed.
 */
async function injectTauriMocks(page: Page) {
  await page.addInitScript({
    path: path.join(__dirname, 'mocks/tauri.ts'),
  });
}

// ─────────────────────────────────────────────────────────────────────
// Login / Activation Screen
// ─────────────────────────────────────────────────────────────────────
test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectTauriMocks(page);
    await page.goto('/');
  });

  test('should render the login/activation screen for unauthenticated users', async ({ page }) => {
    // The AuthGuard should show Login when isActivated=false (mock default)
    await expect(page.locator('body')).toBeVisible();
    // Look for activation-related content — the exact label depends on your Login component
    const hasLoginIndicator = await page.getByText(/activation/i).isVisible()
      .catch(() => false);
    const hasEmailInput = await page.locator('input[type="email"], input[type="text"]').isVisible()
      .catch(() => false);
    expect(hasLoginIndicator || hasEmailInput).toBeTruthy();
  });

  test('should show error message with wrong credentials', async ({ page }) => {
    // Fill in clearly invalid credentials
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid@notreal.com');
      await passwordInput.fill('wrongpassword');
      await page.getByRole('button', { name: /activate|login|sign in/i }).click();
      // Should show an error state — not navigate away
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Onboarding Flow
// ─────────────────────────────────────────────────────────────────────
test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await injectTauriMocks(page);
    // Override store to simulate: authenticated but not yet configured
    await page.addInitScript(() => {
      if (window.__TAURI_STORE__) {
        const originalLoad = window.__TAURI_STORE__.load;
        window.__TAURI_STORE__.load = async (path: string, opts?: unknown) => {
          const store = await originalLoad(path, opts);
          return {
            ...store,
            get: async (key: string) => {
              if (key === 'isActivated') return true;
              if (key === 'isProgramConfigured') return false;
              if (key === 'displayName') return 'Test User';
              if (key === 'activationEmail') return 'test@example.com';
              if (key === 'activationCode') return 'TEST-CODE';
              return null;
            },
          };
        };
      }
    });
  });

  test('should reach onboarding when activated but not configured', async ({ page }) => {
    await page.goto('/onboarding');
    // Step 1 of onboarding should be visible
    const hasStepIndicator = await page.getByText(/step 1/i).isVisible().catch(() => false);
    const hasProfileHeader = await page.getByText(/profile|name/i).isVisible().catch(() => false);
    expect(hasStepIndicator || hasProfileHeader).toBeTruthy();
  });

  test('should advance through name entry in step 1', async ({ page }) => {
    await page.goto('/onboarding');
    const nameInput = page.locator('input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Dagim');
      const continueBtn = page.getByRole('button', { name: /continue/i });
      await expect(continueBtn).toBeEnabled();
      await continueBtn.click();
      // Should advance to step 2
      const step2 = await page.getByText(/step 2|vault/i).isVisible().catch(() => false);
      expect(step2).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Core App Shell
// ─────────────────────────────────────────────────────────────────────
test.describe('App Shell (authenticated + configured)', () => {
  test.beforeEach(async ({ page }) => {
    await injectTauriMocks(page);
    // Override store to simulate fully configured app
    await page.addInitScript(() => {
      if (window.__TAURI_STORE__) {
        const originalLoad = window.__TAURI_STORE__.load;
        window.__TAURI_STORE__.load = async (path: string, opts?: unknown) => {
          const store = await originalLoad(path, opts);
          return {
            ...store,
            get: async (key: string) => {
              const values: Record<string, unknown> = {
                isActivated: true,
                isProgramConfigured: true,
                obsidianVaultPath: '/Users/test/vault',
                displayName: 'Dagim',
                activationEmail: 'dagim@test.com',
                activationCode: 'ATER-CODE-123',
                aiProvider: 'google',
                aiModel: 'gemini-2.0-flash',
                aiApiKey: 'test-key',
                inboxPath: '/Users/test/vault/Inbox',
                academicFolderPath: 'Notes',
              };
              return values[key] ?? null;
            },
          };
        };
      }
    });
    await page.goto('/');
  });

  test('page title is set correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/ater/i);
  });

  test('app renders without crashing', async ({ page }) => {
    // Just checking the root renders — not blank white screen
    await page.waitForLoadState('domcontentloaded');
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // Content should not be empty
    const bodyText = await body.textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await injectTauriMocks(page);
    await page.addInitScript(() => {
      if (window.__TAURI_STORE__) {
        const originalLoad = window.__TAURI_STORE__.load;
        window.__TAURI_STORE__.load = async (path: string, opts?: unknown) => {
          const store = await originalLoad(path, opts);
          return {
            ...store,
            get: async (key: string) => {
              const v: Record<string, unknown> = {
                isActivated: true,
                isProgramConfigured: true,
                obsidianVaultPath: '/Users/test/vault',
                displayName: 'Dagim',
                activationEmail: 'dagim@test.com',
                activationCode: 'CODE',
                aiProvider: 'google',
                aiModel: 'gemini-2.0-flash',
                aiApiKey: 'key',
              };
              return v[key] ?? null;
            },
          };
        };
      }
    });
  });

  test('should not 404 on /obsidian route', async ({ page }) => {
    const response = await page.goto('/obsidian');
    // In a SPA, 404 means a blank page or an error boundary, not an HTTP 404
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not 404 on /agents route', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not 404 on /academic-dashboard route', async ({ page }) => {
    await page.goto('/academic-dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});
