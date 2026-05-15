import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri IPC
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((cmd) => {
    if (cmd === 'get_sidecar_port') return Promise.resolve(8765);
    return Promise.resolve();
  }),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  Command: vi.fn(),
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
