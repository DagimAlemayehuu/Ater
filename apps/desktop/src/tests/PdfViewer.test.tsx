import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PdfViewer } from '../components/obsidian/PdfViewer';
import { invoke } from '@tauri-apps/api/core';

// Mock ConfigContext and ThemeProvider
vi.mock('../lib/ConfigContext', () => ({
  useConfig: () => ({ config: { obsidianVaultPath: '/test/vault' } })
}));

vi.mock('../context/theme-provider', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' })
}));

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

describe('PdfViewer', () => {
  let globalFetch: ReturnType<typeof vi.fn>;
  let globalCreateObjectURL: ReturnType<typeof vi.fn>;
  let globalRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup mocks
    globalFetch = vi.fn();
    global.fetch = globalFetch as unknown as typeof fetch;

    globalCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-blob-url');
    global.URL.createObjectURL = globalCreateObjectURL as unknown as typeof URL.createObjectURL;

    globalRevokeObjectURL = vi.fn();
    global.URL.revokeObjectURL = globalRevokeObjectURL as unknown as typeof URL.revokeObjectURL;

    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === 'get_sidecar_port') return 8000;
      if (cmd === 'get_sidecar_token') return 'test-token-123';
      return null;
    });

    globalFetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['fake pdf data']),
      json: async () => ({}),
      text: async () => JSON.stringify({}),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches PDF with X-Ater-Token header and uses Blob URL for iframe src', async () => {
    render(<PdfViewer path="test.pdf" title="Test PDF" />);

    // Wait for the sidecar port and token to be fetched
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('get_sidecar_port');
      expect(invoke).toHaveBeenCalledWith('get_sidecar_token');
    });

    await waitFor(() => {
      const iframe = screen.getByTitle('Test PDF') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toMatch(/http:\/\/127\.0\.0\.1:(8000|8765)\/api\/obsidian\/viewer\/test\.pdf\?/);
      expect(iframe.src).toContain('sidecar_token=test-token-123');
    });
  });
});
