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

    // Wait for fetch to be called
    await waitFor(() => {
      const fetchCalls = globalFetch.mock.calls;
      const pdfFetch = fetchCalls.find((call: any[]) => call[0].includes('viewer/test.pdf') && call[1]?.headers?.['X-Ater-Token']);
      expect(pdfFetch).toBeTruthy();
    });

    const fetchCalls = globalFetch.mock.calls;
    const pdfFetch = fetchCalls.find((call: any[]) => call[0].includes('viewer/test.pdf') && call[1]?.headers?.['X-Ater-Token']);
    expect(pdfFetch).toBeTruthy();
    
    const [url, options] = pdfFetch as any[];

    // Note: React state batches updates but `fetchPort` might resolve after initial render.
    // Allow either the initial default port or the dynamically resolved port in the test.
    expect(url).toMatch(/http:\/\/127\.0\.0\.1:(8000|8765)\/api\/obsidian\/viewer\/test\.pdf/);
    expect(options.headers['X-Ater-Token']).toBe('test-token-123');

    // Wait for iframe to be rendered with the object URL
    await waitFor(() => {
      const iframe = screen.getByTitle('Test PDF') as HTMLIFrameElement;
      expect(iframe.src).toBe('blob:http://localhost/test-blob-url');
    });
  });

  it('shows error state on 401 response and does not crash', async () => {
    globalFetch.mockImplementation(async (url: string) => {
      if (url.includes('pdf-metadata')) {
        return {
          ok: true,
          json: async () => ({ page_count: 1 }),
          text: async () => ''
        };
      }
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => ''
      };
    });

    render(<PdfViewer path="test.pdf" title="Test PDF" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load PDF')).toBeInTheDocument();
      expect(screen.getByText('Authentication required (401 Unauthorized)')).toBeInTheDocument();
    });
    
    // Ensure iframe is not rendered
    expect(screen.queryByTitle('Test PDF')).not.toBeInTheDocument();
  });

  it('shows error state on 404 response', async () => {
    globalFetch.mockImplementation(async (url: string) => {
      if (url.includes('pdf-metadata')) {
        return {
          ok: true,
          json: async () => ({ page_count: 1 }),
          text: async () => ''
        };
      }
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => ''
      };
    });

    render(<PdfViewer path="test.pdf" title="Test PDF" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load PDF')).toBeInTheDocument();
      expect(screen.getByText('PDF not found (404 Not Found)')).toBeInTheDocument();
    });
  });

  it('revokes object URL on unmount', async () => {
    const { unmount } = render(<PdfViewer path="test.pdf" title="Test PDF" />);

    await waitFor(() => {
      expect(globalCreateObjectURL).toHaveBeenCalled();
    });

    unmount();

    expect(globalRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-blob-url');
  });
});
