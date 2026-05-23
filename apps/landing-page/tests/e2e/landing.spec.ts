import { test, expect } from '@playwright/test';

test('landing page loads successfully', async ({ page }) => {
  await page.goto('/');
  // Basic smoke test to ensure the page renders
  await expect(page.locator('body')).toBeVisible();
  
  // Optionally check if the title or a primary heading is present
  // Assuming the landing page has some text like "Ater" or similar
  const hasAterText = await page.getByText(/ater/i).isVisible().catch(() => false);
  const hasHeading = await page.locator('h1').isVisible().catch(() => false);
  
  expect(hasAterText || hasHeading).toBeTruthy();
});
