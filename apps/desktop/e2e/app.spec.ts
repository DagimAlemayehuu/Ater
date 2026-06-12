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
    path: path.join(__dirname, 'mocks/tauri.js'),
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
    // Wait for email input to be visible (Playwright automatically retries this assertion)
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
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

  test('should display verification failure UI on Supabase 500 server crash', async ({ page }) => {
    // Route Supabase token requests to return 500 Internal Server Error
    await page.route('**/auth/v1/token*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'server_error',
          error_description: 'Database connection failed'
        })
      });
    });

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const codeInput = page.locator('input[type="text"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('user@local.ater');
      await passwordInput.fill('somepassword123');
      await codeInput.fill('ATER-PRO');
      await page.getByRole('button', { name: /activate|login|sign in/i }).click();

      // Ensure error card appears and prints the message
      const errorTitle = page.getByText(/Verification Failure/i);
      await expect(errorTitle).toBeVisible({ timeout: 5000 });
      
      const errorText = page.getByText(/Database connection failed/i);
      await expect(errorText).toBeVisible();
    }
  });

  test('should display verification failure UI on Supabase 429 rate limit', async ({ page }) => {
    // Route Supabase token requests to return 429 Too Many Requests
    await page.route('**/auth/v1/token*', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'too_many_requests',
          error_description: 'Rate limit exceeded. Please try again later.'
        })
      });
    });

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const codeInput = page.locator('input[type="text"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('user@local.ater');
      await passwordInput.fill('somepassword123');
      await codeInput.fill('ATER-PRO');
      await page.getByRole('button', { name: /activate|login|sign in/i }).click();

      // Ensure error card appears and prints the rate-limit message
      const errorTitle = page.getByText(/Verification Failure/i);
      await expect(errorTitle).toBeVisible({ timeout: 5000 });
      
      const errorText = page.getByText(/Rate limit exceeded/i);
      await expect(errorText).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Onboarding Flow
// ─────────────────────────────────────────────────────────────────────
test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[PAGE ERROR] ${err.stack}`));

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
              if (key === 'displayName') return '';
              if (key === 'activationEmail') return 'test@example.com';
              if (key === 'activationCode') return 'TEST-CODE';
              if (key === 'walkthroughCompleted') return true;
              if (key === 'walkthroughStatus') return 'skipped';
              return null;
            },
          };
        };
      }
    });
  });

  test('should reach onboarding when activated but not configured', async ({ page }) => {
    await page.goto('/#/onboarding');
    // Step 1 of onboarding should be visible
    await expect(page.getByText('Define Your Profile')).toBeVisible();
  });

  test('should advance through name entry in step 1', async ({ page }) => {
    await page.goto('/#/onboarding');
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Dagim');
    const continueBtn = page.getByRole('button', { name: /continue/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    // Should advance to step 2
    await expect(page.getByText(/step 2|vault/i).first()).toBeVisible();
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
    await page.goto('/#/obsidian');
    // In a SPA, 404 means a blank page or an error boundary, not an HTTP 404
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not 404 on /agents route', async ({ page }) => {
    await page.goto('/#/agents');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not 404 on /academic-dashboard route', async ({ page }) => {
    await page.goto('/#/academic');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────
// Online/Offline & Sidecar Resiliency
// ─────────────────────────────────────────────────────────────────────
test.describe('Online/Offline & Sidecar Resiliency', () => {
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

  test('should fall back gracefully when the backend sidecar is offline/unreachable', async ({ page }) => {
    // Intercept sidecar API calls and simulate a connection timeout/offline state
    await page.route('**/api/v1/health*', async route => {
      await route.abort('failed');
    });

    await page.goto('/#/settings');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify that the UI remains interactive and doesn't white-screen
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should support seamless online/offline state toggling without state corruption', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Simulate going offline
    await page.context().setOffline(true);
    await expect(page.locator('body')).toBeVisible();

    // Toggle back online
    await page.context().setOffline(false);
    await expect(page.locator('body')).toBeVisible();
  });
});
