/* eslint-disable */
/**
 * Tauri IPC Mock for Playwright E2E tests.
 *
 * Playwright runs the app in a real browser (Chromium) without Tauri's native layer.
 * We inject a global `window.__TAURI__` mock so all `invoke()` calls resolve with
 * realistic responses instead of crashing with "Tauri not available".
 *
 * Usage: Add `await page.addInitScript({ path: 'e2e/mocks/tauri.js' })` at the top
 * of tests that need it, or in the global setup fixture.
 */

console.log('[TauriMock] tauri.js mock script is starting...');

// Minimal mock — extend with specific responses as tests require
const mockResponses = {
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

// Keep track of loaded stores and store data in memory
const storeData = new Map();
const loadedStores = new Map();
let nextRid = 1;

// Mock tauri-plugin-store
window.__TAURI_STORE__ = {
  load: async (path, _opts) => {
    if (!storeData.has(path)) {
      storeData.set(path, {
        isProgramConfigured: false,
        isActivated: false,
        obsidianVaultPath: '',
        aiProvider: 'google',
        aiModel: 'gemini-2.0-flash',
        aiApiKey: '',
        displayName: '',
        inboxPath: '',
        academicFolderPath: 'Notes',
      });
    }

    return {
      get: async (key) => {
        const data = storeData.get(path);
        return data[key] ?? null;
      },
      set: async (key, value) => {
        const data = storeData.get(path);
        data[key] = value;
      },
      delete: async (key) => {
        const data = storeData.get(path);
        delete data[key];
      },
      save: async () => {},
      entries: async () => {
        const data = storeData.get(path);
        return Object.entries(data);
      },
    };
  },
};

// Inject into window before any app script runs
window.__PLAYWRIGHT_E2E__ = true;
window.__TAURI__ = {
  core: {
    invoke: async (cmd, args) => {
      // Direct plugin:store command delegation
      if (cmd === 'plugin:store|load') {
        const path = args?.path || 'default.json';
        const storeInstance = await window.__TAURI_STORE__.load(path, args?.options);
        const rid = nextRid++;
        loadedStores.set(rid, { path, store: storeInstance });
        return rid;
      }
      if (cmd === 'plugin:store|get') {
        const rid = args?.rid;
        const key = args?.key;
        const entry = loadedStores.get(rid);
        if (entry) {
          const val = await entry.store.get(key);
          return [val, val !== undefined && val !== null];
        }
        return [null, false];
      }
      if (cmd === 'plugin:store|set') {
        const rid = args?.rid;
        const key = args?.key;
        const value = args?.value;
        const entry = loadedStores.get(rid);
        if (entry) {
          await entry.store.set(key, value);
        }
        return null;
      }
      if (cmd === 'plugin:store|delete') {
        const rid = args?.rid;
        const key = args?.key;
        const entry = loadedStores.get(rid);
        if (entry) {
          await entry.store.delete(key);
        }
        return null;
      }
      if (cmd === 'plugin:store|save') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          await entry.store.save();
        }
        return null;
      }
      if (cmd === 'plugin:store|entries') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          return await entry.store.entries();
        }
        return [];
      }
      if (cmd === 'plugin:store|has') {
        const rid = args?.rid;
        const key = args?.key;
        const entry = loadedStores.get(rid);
        if (entry) {
          const val = await entry.store.get(key);
          return val !== undefined && val !== null;
        }
        return false;
      }
      if (cmd === 'plugin:store|clear') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          storeData.set(entry.path, {});
        }
        return null;
      }
      if (cmd === 'plugin:store|reset') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          storeData.delete(entry.path);
          const newStore = await window.__TAURI_STORE__.load(entry.path);
          loadedStores.set(rid, { path: entry.path, store: newStore });
        }
        return null;
      }
      if (cmd === 'plugin:store|keys') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          const entries = await entry.store.entries();
          return entries.map(([k]) => k);
        }
        return [];
      }
      if (cmd === 'plugin:store|values') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          const entries = await entry.store.entries();
          return entries.map(([, v]) => v);
        }
        return [];
      }
      if (cmd === 'plugin:store|length') {
        const rid = args?.rid;
        const entry = loadedStores.get(rid);
        if (entry) {
          const entries = await entry.store.entries();
          return entries.length;
        }
        return 0;
      }

      if (cmd in mockResponses) {
        return mockResponses[cmd];
      }
      console.warn(`[TauriMock] Unhandled invoke: ${cmd}`, args);
      return null;
    },
  },
  event: {
    listen: async () => () => {},
    once: async () => () => {},
    emit: async () => {},
  },
};

// ── Tauri v2 Internal Bridge Mocking ──
window.__TAURI_INTERNALS__ = {
  invoke: async (cmd, args, options) => {
    return window.__TAURI__.core.invoke(cmd, args);
  },
  transformCallback: (callback, once = false) => {
    const id = nextRid++;
    return id;
  },
  unregisterCallback: () => {},
  convertFileSrc: (filePath) => filePath,
};

window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
  registerListener: () => {},
  unregisterListener: () => {},
};

console.log('[TauriMock] tauri.js mock script completed execution! __TAURI_INTERNALS__ is:', window.__TAURI_INTERNALS__);
