import { test, expect } from '@playwright/test';

test('admin portal screens load successfully', async ({ page }) => {
  // Check the Dashboard (root)
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();

  // Explicitly check the Login route
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });
});
