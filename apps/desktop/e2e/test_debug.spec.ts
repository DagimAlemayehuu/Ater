import { test, expect } from '@playwright/test';

test('loads the desktop shell without uncaught page errors', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', err => {
    pageErrors.push(err.stack || err.message);
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('body')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
