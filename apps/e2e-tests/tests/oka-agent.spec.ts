import { test, expect } from '@playwright/test';

test.describe('OKA Agent Interactions', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Tauri IPC store calls
        await page.addInitScript(() => {
            Object.defineProperty(window, '__TAURI_INTERNALS__', {
                value: {
                    invoke: async (cmd: string, args: any) => {
                        console.log(`Mocked Tauri command: ${cmd}`, args);
                        if (cmd === 'plugin:store|load' || cmd === 'plugin:store|get') {
                            // Mocking config settings so the UI doesn't redirect to onboarding
                            return {
                                "vaultPath": "/mock/vault",
                                "geminiKey": "mock-key",
                                "notionKey": "mock-key",
                                "obsidianVaultPath": "/mock/vault",
                                "geminiApiKey": "mock-key",
                                "notionApiKey": "mock-key",
                            };
                        }
                        if (cmd === 'plugin:store|set') {
                            return null;
                        }
                        return { status: "success", data: "mocked" };
                    }
                }
            });
            // Override the load method for store in window object to fix the "not iterable" error
            // the plugin-store uses rust commands internally that return promises
            window.__TAURI_INTERNALS__.invoke = window.__TAURI_INTERNALS__.invoke || async function() {};
        });

        // Mock the Sidecar API calls
        await page.route('**/api/system/health', async route => {
            await route.fulfill({ json: { status: 'ok', version: '0.1.0' } });
        });

        await page.route('**/api/config', async route => {
            await route.fulfill({ json: { status: 'success', config: { vault_path: '/mock/vault' } } });
        });

        await page.route('**/api/oka/queue/status', async route => {
            await route.fulfill({
                json: { status: 'idle', auto_process: false, current_file: null, current_batch: 0, total_batches: 0, pending_count: 0, pending_files: [] }
            });
        });

        await page.route('**/api/oka/inbox', async route => {
            await route.fulfill({
                json: { files: [{ name: 'test_doc.md', path: '/mock/vault/0_Inbox/test_doc.md' }] }
            });
        });

        await page.route('**/api/oka/generated', async route => {
            await route.fulfill({ json: { files: [] } });
        });

        await page.route('**/api/stats', async route => {
            await route.fulfill({ json: { total_notes: 10, recent_activity: [] } });
        });

        // Log console errors to debug
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`PAGE ERROR: ${msg.text()}`);
            }
        });
        page.on('pageerror', error => {
            console.log(`PAGE EXCEPTION: ${error.message}`);
        });
    });

    test.skip('should load OKA agent view and display inbox files', async ({ page }) => {
        await page.goto('/');

        // Wait for main dashboard to load, then click Agents
        await page.waitForSelector('a[href="/agents"]', { state: 'attached', timeout: 10000 });
        await page.click('a[href="/agents"]');

        // Select OKA from the sidebar/list
        // await page.click('text=OKA (Architect)');

        // Wait for inbox files to be rendered based on the mocked API response
        await expect(page.locator('text=test_doc.md')).toBeVisible();
    });

    test.skip('should process a file in the OKA agent', async ({ page }) => {
        await page.route('**/api/oka/process', async route => {
            await route.fulfill({
                json: {
                    session_id: 'mock-session-123',
                    status: 'plan_generated',
                    plan_raw: 'Mock Plan',
                    plan_structured: { batches: 1, type: 'academic' }
                }
            });
        });

        await page.goto('/agents');

        // Select OKA
        await page.click('text=OKA (Architect)');

        // Click the first file in the inbox to select it
        await page.click('text=test_doc.md');

        // Click process button
        await page.click('text=Analyze & Plan');

        // Ensure the plan overview is shown
        await expect(page.locator('text=Generation Plan')).toBeVisible();
        await expect(page.locator('text=Mock Plan')).toBeVisible();
    });
});
