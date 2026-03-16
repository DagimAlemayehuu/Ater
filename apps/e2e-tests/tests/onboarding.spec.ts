import { test, expect } from '@playwright/test';

test('Onboarding Flow - Requires Config', async ({ page }) => {
  await page.goto('/');

  // Expect to be redirected to onboarding when not configured
  await expect(page).toHaveURL(/.*\/onboarding/);

  // Check for the initial heading/text
  await expect(page.locator('h1')).toContainText(/Setup Life OS/i);
});

test('App load shows body', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
});
