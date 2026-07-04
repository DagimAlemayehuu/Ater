import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock Tauri internals so store.ts loads the mocked plugin-store
(window as any).__TAURI_INTERNALS__ = {};

// Mock Tauri IPC
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((cmd) => {
    if (cmd === 'get_sidecar_port') return Promise.resolve(8765);
    return Promise.resolve();
  }),
}));

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn().mockResolvedValue('0.8.4'),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  Command: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock('@tauri-apps/plugin-store', () => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
    save: vi.fn(),
    load: vi.fn(),
    entries: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  };
  return {
    load: vi.fn().mockResolvedValue(mockStore),
  };
});

// Mock Recharts ResponsiveContainer to prevent width/height 0 warnings in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<any>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => children,
  };
});

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

