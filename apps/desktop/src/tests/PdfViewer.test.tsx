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

  beforeEach(() => {
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};

    // Setup mocks
    globalFetch = vi.fn();
    global.fetch = globalFetch as unknown as typeof fetch;

    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === 'get_sidecar_port') return 8000;
      if (cmd === 'get_sidecar_token') return 'test-token-123';
      return null;
    });

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ page_count: 7 }),
      text: async () => JSON.stringify({}),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it('loads metadata with X-Ater-Token header and renders tokenized iframe URL', async () => {
    render(<PdfViewer path="test.pdf" title="Test PDF" />);

    // Wait for the sidecar port and token to be fetched
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('get_sidecar_port');
      expect(invoke).toHaveBeenCalledWith('get_sidecar_token');
    });

    // Metadata is fetched with an auth header; the viewer itself is loaded by
    // the iframe with a tokenized URL so browser PDF plugins can stream it.
    await waitFor(() => {
      const fetchCalls = globalFetch.mock.calls;
      const metadataFetch = fetchCalls.find((call: any[]) => call[0].includes('pdf-metadata/test.pdf'));
      expect(metadataFetch?.[1]?.headers?.['X-Ater-Token']).toBe('test-token-123');
    });

    await waitFor(() => {
      const iframe = screen.getByTitle('Test PDF') as HTMLIFrameElement;
      expect(iframe.src).toMatch(/http:\/\/127\.0\.0\.1:8000\/api\/obsidian\/viewer\/test\.pdf/);
      expect(iframe.src).toContain('sidecar_token=test-token-123');
      expect(iframe.src).toContain('vault_path=%2Ftest%2Fvault');
    });
  });

  it('keeps the iframe mounted when metadata returns 401', async () => {
    globalFetch.mockImplementation(async (url: string) => {
      if (url.includes('pdf-metadata')) {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({}),
          text: async () => ''
        };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    render(<PdfViewer path="test.pdf" title="Test PDF" />);

    await waitFor(() => {
      expect(screen.getByTitle('Test PDF')).toBeInTheDocument();
    });
  });

  it('updates the iframe URL when path changes', async () => {
    const { rerender } = render(<PdfViewer path="test.pdf" title="Test PDF" />);

    await waitFor(() => {
      const iframe = screen.getByTitle('Test PDF') as HTMLIFrameElement;
      expect(iframe.src).toContain('/viewer/test.pdf');
    });

    rerender(<PdfViewer path="other.pdf" title="Other PDF" />);

    await waitFor(() => {
      const iframe = screen.getByTitle('Other PDF') as HTMLIFrameElement;
      expect(iframe.src).toContain('/viewer/other.pdf');
      expect(iframe.src).toContain('sidecar_token=test-token-123');
    });
  });
});
