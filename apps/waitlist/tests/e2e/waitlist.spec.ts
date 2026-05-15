import { test, expect } from '@playwright/test';

test.describe('Ater Waitlist Funnel', () => {
  test('should load the landing page and show the waitlist button', async ({ page }) => {
    await page.goto('/');
    
    // Check for the high-fidelity monochrome aesthetic (black background, white text)
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    
    // Check for the main headline
    const headline = page.locator('h1');
    await expect(headline).toContainText('ATER');
    
    // Check for the waitlist button
    const waitlistBtn = page.locator('button:has-text("Join")');
    await expect(waitlistBtn).toBeVisible();
  });

  test('should open the signup modal when join is clicked', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Join")');
    
    // Check for the email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Fill with a test email
    await emailInput.fill('test@ater.ai');
    
    // Check for sharp edges (rounded-none)
    await expect(emailInput).toHaveClass(/rounded-none/);
  });
});
