import re
with open('apps/e2e-tests/tests/coach.spec.ts', 'r') as f:
    code = f.read()

# Mocking the initialization logic from Onboarding
# For App to bypass Onboarding, config needs to pass `isConfigured` check
# This involves making `notionApiKey`, `geminiApiKey`, and `obsidianVaultPath` exist and truthy

code = code.replace(
'''        // Mock Tauri internals
        await page.addInitScript(() => {
            window.__TAURI_INTERNALS__ = {
                invoke: async (cmd: string, args: any) => {
                    if (cmd === 'plugin:store|load') return {};
                    if (cmd === 'plugin:store|get') {
                        if (args.key === 'notionApiKey') return 'mock-notion-key';
                        if (args.key === 'geminiApiKey') return 'mock-gemini-key';
                        if (args.key === 'geminiModel') return 'gemini-2.5-flash';
                        if (args.key === 'obsidianVaultPath') return '/mock/vault';
                        if (args.key === 'notionGoalsDbId') return 'mock-goals-id';
                        if (args.key === 'notionHabitsDbId') return 'mock-habits-id';
                        return null;
                    }
                    return null;
                }
            };
        });''',
'''        // Mock Tauri internals
        await page.addInitScript(() => {
            window.__TAURI_INTERNALS__ = {
                invoke: async (cmd: string, args: any) => {
                    if (cmd === 'plugin:store|load') return {};
                    if (cmd === 'plugin:store|get') {
                        if (args.key === 'notionApiKey') return 'mock-notion-key';
                        if (args.key === 'geminiApiKey') return 'mock-gemini-key';
                        if (args.key === 'geminiModel') return 'gemini-2.5-flash';
                        if (args.key === 'obsidianVaultPath') return '/mock/vault';
                        if (args.key === 'notionGoalsDbId') return 'mock-goals-id';
                        if (args.key === 'notionHabitsDbId') return 'mock-habits-id';
                        return null;
                    }
                    return null;
                }
            };

            // Wait for Tauri to be ready
            window.__TAURI_IPC__ = window.__TAURI_INTERNALS__.invoke;
        });'''
)

with open('apps/e2e-tests/tests/coach.spec.ts', 'w') as f:
    f.write(code)
