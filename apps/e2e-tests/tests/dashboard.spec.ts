import { test, expect } from '@playwright/test';

test('Dashboard renders configured state', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args: any) => {
        if (cmd === 'plugin:store|load') return {};
        if (cmd === 'plugin:store|get') {
          // In Tauri v2, invoke returns the raw result, not necessarily wrapped in an array
          // The previous array return might have evaluated to something falsy or invalid format in the JS side
          const key = args?.key;
          if (key === 'notionApiKey' || key === 'geminiApiKey' || key === 'obsidianVaultPath') {
            return 'mock-value'; // the value itself
          }
          if (key === 'customPersonas') return [];
          return 'mock';
        }
        return null;
      }
    };
  });

  await page.goto('/');

  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });

  await expect(page.locator('text=Upcoming Deadlines').first()).toBeVisible();
  await expect(page.locator('text=Active Goals').first()).toBeVisible();
});
