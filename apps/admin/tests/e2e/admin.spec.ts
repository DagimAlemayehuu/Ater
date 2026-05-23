import { test, expect } from '@playwright/test';

test('admin dashboard login screen loads successfully', async ({ page }) => {
  await page.goto('/');
  // Next.js will redirect / to /login since we are not authenticated.
  // Wait for the login form to mount instead of generic domcontentloaded.
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 });
});
