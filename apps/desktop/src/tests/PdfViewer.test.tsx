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

// Mock fetchSidecarJson
vi.mock('../lib/sidecarHttp', () => ({
  fetchSidecarJson: vi.fn()
}));

import { fetchSidecarJson } from '../lib/sidecarHttp';

describe('PdfViewer', () => {
  beforeEach(() => {
    // Force the component to render the real iframe by mocking Tauri internals
    (window as any).__TAURI_INTERNALS__ = {};

    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === 'get_sidecar_port') return 8000;
      if (cmd === 'get_sidecar_token') return 'test-token-123';
      return null;
    });

    vi.mocked(fetchSidecarJson).mockResolvedValue({
      page_count: 12
    });
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    vi.clearAllMocks();
  });

  it('renders iframe with correct backend URL', async () => {
    render(<PdfViewer path="test.pdf" title="Test PDF" />);

    // Wait for the sidecar port and token to be fetched
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('get_sidecar_port');
      expect(invoke).toHaveBeenCalledWith('get_sidecar_token');
    });

    // Wait for iframe to be rendered with the correct src
    await waitFor(() => {
      const iframe = screen.getByTitle('Test PDF') as HTMLIFrameElement;
      // Component uses sidecarPort, path, vault_path, etc. in URL
      expect(iframe.src).toContain('http://127.0.0.1:8000/api/obsidian/viewer/test.pdf');
      expect(iframe.src).toContain('vault_path=%2Ftest%2Fvault');
      expect(iframe.src).toContain('sidecar_token=test-token-123');
    });
  });

  it('fetches PDF metadata on mount', async () => {
    render(<PdfViewer path="test.pdf" title="Test PDF" />);

    await waitFor(() => {
      expect(fetchSidecarJson).toHaveBeenCalledWith(
        expect.stringContaining('/api/obsidian/pdf-metadata/test.pdf'),
        expect.objectContaining({
          headers: {
            'X-Ater-Token': 'test-token-123'
          }
        })
      );
    });
  });
});
