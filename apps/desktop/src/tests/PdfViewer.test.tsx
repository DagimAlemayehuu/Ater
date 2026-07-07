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
  beforeEach(() => {
    // Setup mocks
    vi.mocked(invoke).mockImplementation(async (cmd: string) => {
      if (cmd === 'get_sidecar_port') return 8000;
      if (cmd === 'get_sidecar_token') return 'test-token-123';
      return null;
    });

  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders iframe with correct src including sidecar_token query param', async () => {
    render(<PdfViewer path="test.pdf" title="Test PDF" />);

    // Wait for the sidecar port and token to be fetched
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('get_sidecar_port');
      expect(invoke).toHaveBeenCalledWith('get_sidecar_token');
    });

    // Wait for iframe to be rendered with the correct backend URL
    await waitFor(() => {
      const iframe = screen.getByTitle('Test PDF') as HTMLIFrameElement;
      expect(iframe.src).toMatch(/http:\/\/127\.0\.0\.1:8000\/api\/obsidian\/viewer\/test\.pdf\?vault_path=%2Ftest%2Fvault&page=1&theme=dark&sidecar_token=test-token-123/);
    });
  });

});
