import { test, expect } from '@playwright/test';

test('capture console logs and page errors', async ({ page }) => {
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`[BROWSER UNCAUGHT ERROR] ${err.stack}`);
  });

  console.log('Navigating to http://localhost:1420...');
  await page.goto('http://localhost:1420');
  
  // Wait for 10 seconds to let all initial useEffects and mounts run
  console.log('Waiting 10 seconds for initializations...');
  await page.waitForTimeout(10000);
  console.log('Done waiting.');
});
