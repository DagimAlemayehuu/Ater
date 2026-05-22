/**
 * Tauri IPC Mock for Playwright E2E tests.
 *
 * Playwright runs the app in a real browser (Chromium) without Tauri's native layer.
 * We inject a global `window.__TAURI__` mock so all `invoke()` calls resolve with
 * realistic responses instead of crashing with "Tauri not available".
 *
 * Usage: Add `await page.addInitScript({ path: 'e2e/mocks/tauri.ts' })` at the top
 * of tests that need it, or in the global setup fixture.
 */

// Minimal mock — extend with specific responses as tests require
const mockResponses: Record<string, unknown> = {
  get_machine_id: 'test-machine-id-e2e',
  get_health: { status: 'ok', version: '0.5.0' },
  list_obsidian_files: [],
  ater_queue_status: {
    status: 'idle',
    auto_process: false,
    current_file: null,
    current_batch: 0,
    total_batches: 0,
    last_action: '',
    processed_notes: [],
    planned_batches: [],
    pending_count: 0,
    pending_files: [],
  },
  ater_list_inbox: { files: [] },
  list_hubs: { hubs: [] },
  list_practices: { practices: [] },
  academics_dashboard: {
    semesters: [],
    courses: [],
    units: [],
    exams: [],
    assignments: [],
  },
};

// Inject into window before any app script runs
window.__PLAYWRIGHT_E2E__ = true;
window.__TAURI__ = {
  core: {
    invoke: async (cmd: string, _args?: unknown) => {
      if (cmd in mockResponses) {
        return mockResponses[cmd];
      }
      console.warn(`[TauriMock] Unhandled invoke: ${cmd}`, _args);
      return null;
    },
  },
  event: {
    listen: async () => () => {},
    once: async () => () => {},
    emit: async () => {},
  },
};

// Mock tauri-plugin-store
window.__TAURI_STORE__ = {
  load: async (_path: string, _opts?: unknown) => ({
    get: async (key: string) => {
      const storeDefaults: Record<string, unknown> = {
        isProgramConfigured: false,
        isActivated: false,
        obsidianVaultPath: '',
        aiProvider: 'google',
        aiModel: 'gemini-2.0-flash',
        aiApiKey: '',
        displayName: '',
        inboxPath: '',
        academicFolderPath: 'Notes',
      };
      return storeDefaults[key] ?? null;
    },
    set: async () => {},
    save: async () => {},
    delete: async () => {},
    entries: async () => [],
  }),
};
