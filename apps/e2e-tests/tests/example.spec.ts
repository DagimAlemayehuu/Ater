import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      value: {
        invoke: async (cmd: string, args: any) => {
          console.log(`Mocked Tauri command: ${cmd}`, args);
          if (cmd === 'plugin:store|load' || cmd === 'plugin:store|get') {
              return null;
          }
          return { status: "success", data: "mocked response from " + cmd };
        }
      }
    });
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/Life OS|Vite \+ React/i);
});
