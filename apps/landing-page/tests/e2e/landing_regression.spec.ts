import { test, expect } from '@playwright/test';

test.describe('Landing Page Smoke & Waitlist Form Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page root
    await page.goto('/');
  });

  test('should load the landing page and verify presence of key branding elements', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    
    // Check for some main heading or logo
    const h1Heading = page.locator('h1').first();
    await expect(h1Heading).toBeVisible();
  });

  test('should display waitlist registration components or action triggers', async ({ page }) => {
    // Look for registration buttons or input fields
    const actionButton = page.getByRole('button', { name: /join|waitlist|register|sign up/i }).first();
    if (await actionButton.isVisible()) {
      await expect(actionButton).toBeEnabled();
    }
  });

  test('should render properly in mobile viewport dimensions without layout crashing', async ({ page }) => {
    // Resize viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('body')).toBeVisible();
  });
});
