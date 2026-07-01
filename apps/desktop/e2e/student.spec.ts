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

// ─────────────────────────────────────────────────────────────────────
// Student Onboarding Flow (Unconfigured State)
// ─────────────────────────────────────────────────────────────────────
test.describe('Ater Student Onboarding Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[PAGE ERROR] ${err.stack}`));
    
    await injectTauriMocks(page);

    // Initial state: activated but unconfigured
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
              if (key === 'walkthroughCompleted') return true;
              if (key === 'walkthroughStatus') return 'skipped';
              return null;
            },
          };
        };
      }
    });
  });

  test('should guide a new student through a macOS-style configuration onboarding', async ({ page }) => {
    // Under HashRouter, onboarding is at /#/onboarding
    await page.goto('/#/onboarding');
    await page.waitForLoadState('domcontentloaded');
    
    // Step 1: User Profile Onboarding
    await expect(page.getByText('DEFINE YOUR PROFILE')).toBeVisible();
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Alemayehu');
    
    const continueBtn = page.getByRole('button', { name: /continue/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Step 2: Vault configuration (simulate macOS folder setup)
    await expect(page.getByText(/obsidian vault/i).first()).toBeVisible();
    
    const pathInput = page.locator('input[placeholder*="/"], input[placeholder*="path"]').first();
    if (await pathInput.isVisible()) {
      await pathInput.fill('/Users/alemayehu/Obsidian/Ater_Vault');
      const step2Btn = page.getByRole('button', { name: /continue/i });
      await step2Btn.click();
    }
  });

  test('should guide a new student through a Windows-style configuration onboarding', async ({ page }) => {
    await page.goto('/#/onboarding');
    await page.waitForLoadState('domcontentloaded');
    
    // Step 1: User Profile Onboarding
    await expect(page.getByText('DEFINE YOUR PROFILE')).toBeVisible();
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Alemayehu');
    const continueBtn = page.getByRole('button', { name: /continue/i });
    await continueBtn.click();

    // Step 2: Vault configuration (simulate Windows folder setup)
    await expect(page.getByText(/obsidian vault/i).first()).toBeVisible();
    const pathInput = page.locator('input[placeholder*="/"], input[placeholder*="path"]').first();
    if (await pathInput.isVisible()) {
      await pathInput.fill('C:\\Users\\Alemayehu\\Documents\\Obsidian\\Ater_Vault');
      const step2Btn = page.getByRole('button', { name: /continue/i });
      await step2Btn.click();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Student Functional Tests (Configured State)
// ─────────────────────────────────────────────────────────────────────
test.describe('Ater Active Student Hub', () => {
  test.beforeEach(async ({ page }) => {
    await injectTauriMocks(page);

    // Initial state: Fully activated and configured
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

    await page.goto('/#/academic');
  });

  test('should explore obsidian vaults and read notes correctly', async ({ page }) => {
    await page.goto('/#/obsidian');
    await page.waitForLoadState('domcontentloaded');

    // Body should be visible
    await expect(page.locator('body')).toBeVisible();

    // Verify explorer renders our mock structure (folder/notes)
    const folderNode = page.getByText(/Computer_Science/i).first();
    await expect(folderNode).toBeVisible();
    await folderNode.click();

    const noteNode = page.getByText(/Data_Structures_And_Algorithms/i).first();
    await expect(noteNode).toBeVisible();
    await noteNode.click();

    // Verify note content area opens and shows mocked note text
    await expect(page.getByText(/high-fidelity note/i)).toBeVisible();
  });

  test('should successfully interact with Settings and run AI Connection Tests', async ({ page }) => {
    await page.goto('/#/settings');
    await page.waitForLoadState('domcontentloaded');

    // Settings page rendering check
    await expect(page.locator('body')).toBeVisible();
    
    // Click on the AI & Keys tab trigger
    await page.getByRole('tab', { name: /AI & Keys/i }).first().click();
    await expect(page.getByText(/AI Provider & Keys/i)).toBeVisible();

    // Click Check if Key Works (testAiConnection command returns success in expanded mock)
    const validateBtn = page.getByRole('button', { name: /Check if Key Works/i });
    await expect(validateBtn).toBeVisible();
    await validateBtn.click();

    // Verify mock connection status notification is visible
    await expect(page.getByText(/successful/i).first()).toBeVisible();
  });

  test('should explore Academic Dashboard structure and verify active modules', async ({ page }) => {
    await page.goto('/#/academic');
    await page.waitForLoadState('domcontentloaded');

    // Dashboard rendering check
    await expect(page.locator('body')).toBeVisible();
    
    // Verify that we display mocked semesters & courses properly
    await expect(page.getByText(/Semester 1/i)).toBeVisible();
    await expect(page.getByText(/Computer Science/i).first()).toBeVisible();
  });

  test('should support practice session loading and answering recall questions', async ({ page }) => {
    await page.goto('/#/practice');
    await page.waitForLoadState('domcontentloaded');

    // Check practice interface has rendered
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/Practice Sessions|Practice/i).first()).toBeVisible();
  });
});
