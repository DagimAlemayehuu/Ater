import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sidecarApi } from '../lib/sidecarApi';
import { load } from '@tauri-apps/plugin-store';

// Mock fetch
global.fetch = vi.fn();

describe('sidecarApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call health check endpoint', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'ok', version: '0.1.0' }),
        });

        const result = await sidecarApi.health();
        // Base URL is discovered via get_sidecar_port mock in setup.ts (8765)
        expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8765/api/health');
        expect(result).toEqual({ status: 'ok', version: '0.1.0' });
    });

    it('should include auth headers from store', async () => {
        const mockStore = {
            get: vi.fn().mockImplementation((key) => {
                if (key === 'aiApiKey') return 'test-key';
                if (key === 'obsidianVaultPath') return '/test/vault';
                return null;
            }),
            set: vi.fn(),
            save: vi.fn(),
            load: vi.fn(),
            entries: vi.fn(),
        };
        (load as any).mockResolvedValue(mockStore);

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'watcher_active' }),
        });

        await sidecarApi.aterWatcherToggle();

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/ater/watcher/toggle'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-AI-Key': 'test-key',
                    'X-Vault-Path': '/test/vault',
                }),
            })
        );
    });

    it('should throw error if AI key is missing for protected routes', async () => {
        const mockStore = {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn(),
            save: vi.fn(),
            load: vi.fn(),
            entries: vi.fn(),
        };
        (load as any).mockResolvedValue(mockStore);

        await expect(sidecarApi.aterProcess({ text: 'test' }))
            .rejects.toThrow('AI API Key is not configured');
    });

    it('should handle sidecar errors correctly', async () => {
        const mockStore = {
            get: vi.fn().mockImplementation((key) => {
                if (key === 'aiApiKey') return 'test-key';
                return 'something';
            }),
            set: vi.fn(),
            save: vi.fn(),
            load: vi.fn(),
            entries: vi.fn(),
        };
        (load as any).mockResolvedValue(mockStore);

        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ detail: 'Internal Server Error' }),
        });

        await expect(sidecarApi.aterQueueStatus())
            .rejects.toThrow('Internal Server Error');
    });
});
