import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Wait for the app to load
  await expect(page).toHaveTitle(/Life OS/);
});

test('onboarding works', async ({ page }) => {
  await page.goto('/');

  // Assuming it redirects to onboarding if not configured
  // This is just a basic check to see if the app renders something
  const body = page.locator('body');
  await expect(body).toBeVisible();
});
