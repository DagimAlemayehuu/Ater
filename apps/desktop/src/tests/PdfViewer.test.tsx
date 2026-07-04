import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PdfViewer } from '../components/obsidian/PdfViewer';
import { ThemeProvider } from '@/context/theme-provider';

// Mock ConfigContext
vi.mock('@/lib/ConfigContext', () => ({
    useConfig: () => ({
        config: { obsidianVaultPath: '/mock/vault' }
    })
}));

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn((cmd) => {
        if (cmd === 'get_sidecar_port') return Promise.resolve(8765);
        if (cmd === 'get_sidecar_token') return Promise.resolve('mock-token-123');
        return Promise.resolve();
    })
}));

// Mock PanelLoader to verify loading state
vi.mock('@/components/ui/loading-state', () => ({
    PanelLoader: ({ label }: { label: string }) => <div data-testid="panel-loader">{label}</div>
}));

// Mock ExplainSidebar
vi.mock('../components/obsidian/ExplainSidebar', () => ({
    ExplainSidebar: () => <div data-testid="explain-sidebar"></div>
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

describe('PdfViewer', () => {
    let originalFetch: typeof global.fetch;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;
    
    let mockFetch: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let mockCreateObjectURL: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    let mockRevokeObjectURL: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    beforeEach(() => {
        originalFetch = global.fetch;
        originalCreateObjectURL = URL.createObjectURL;
        originalRevokeObjectURL = URL.revokeObjectURL;

        mockFetch = vi.fn();
        global.fetch = mockFetch;

        mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
        URL.createObjectURL = mockCreateObjectURL;

        mockRevokeObjectURL = vi.fn();
        URL.revokeObjectURL = mockRevokeObjectURL;

        // Reset scroll methods since we use them
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        vi.clearAllMocks();
    });

    const renderViewer = () => render(
        <ThemeProvider>
            <PdfViewer path="test.pdf" title="Test PDF" />
        </ThemeProvider>
    );

    it('fetches PDF with X-Ater-Token and sets Blob URL to iframe src', async () => {
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes('pdf-metadata')) {
                return {
                    ok: true,
                    json: async () => ({ page_count: 5 })
                };
            }
            return {
                ok: true,
                blob: async () => new Blob(['pdf content'])
            };
        });

        renderViewer();

        // Check if loading state appears
        expect(screen.getByTestId('panel-loader')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('http://127.0.0.1:8765/api/obsidian/viewer/test.pdf'),
                expect.objectContaining({
                    headers: { 'X-Ater-Token': 'mock-token-123' }
                })
            );
        });

        await waitFor(() => {
            expect(mockCreateObjectURL).toHaveBeenCalled();
        });

        // The iframe src should be updated with the blob URL
        const iframe = document.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
        expect(iframe?.src).toBe('blob:mock-url');
        // Once loaded, opacity might be 0 until iframe load completes, but it should be rendered
    });

    it('shows error state and does not crash on 401 response', async () => {
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes('pdf-metadata')) {
                return {
                    ok: true,
                    json: async () => ({ page_count: 5 })
                };
            }
            return {
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            };
        });

        renderViewer();

        await waitFor(() => {
            expect(screen.getByText('Failed to load PDF (401)')).toBeInTheDocument();
            expect(screen.getByText('Could not load the document')).toBeInTheDocument();
        });

        // iframe should not be rendered or rendered without src if error
        const iframe = document.querySelector('iframe');
        expect(iframe).not.toBeInTheDocument();
    });

    it('calls URL.revokeObjectURL on unmount', async () => {
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes('pdf-metadata')) {
                return {
                    ok: true,
                    json: async () => ({ page_count: 5 })
                };
            }
            return {
                ok: true,
                blob: async () => new Blob(['pdf content'])
            };
        });

        const { unmount } = renderViewer();

        await waitFor(() => {
            expect(mockCreateObjectURL).toHaveBeenCalled();
        });

        unmount();

        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
});

// Mock window.matchMedia for ThemeProvider
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
