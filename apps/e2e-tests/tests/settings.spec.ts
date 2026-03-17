import { test, expect } from '@playwright/test';

test('Settings renders configured state', async ({ page }) => {
  await page.addInitScript(() => {
    window.__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args: any) => {
        if (cmd === 'plugin:store|load') return {};
        if (cmd === 'plugin:store|get') {
          const key = args?.key;
          if (key === 'notionApiKey' || key === 'geminiApiKey' || key === 'obsidianVaultPath') {
            return 'mock-value';
          }
          if (key === 'customPersonas') return [];
          return 'mock';
        }
        return null;
      }
    };
  });

  await page.goto('/settings');

  await expect(page).toHaveURL(/.*\/settings/, { timeout: 10000 });

  await expect(page.locator('text=General Settings').first()).toBeVisible();
});
