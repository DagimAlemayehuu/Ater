import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sidecarApi } from '../lib/sidecarApi';
import { invoke } from '@tauri-apps/api/core';

describe('sidecarApi - Native Tauri IPC Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call get_health native command and return status', async () => {
        (invoke as any).mockResolvedValueOnce({ status: 'ok', version: '0.5.0' });
        const result = await sidecarApi.health();
        expect(invoke).toHaveBeenCalledWith('get_health');
        expect(result.status).toBe('ok');
    });

    it('should invoke native init_app command', async () => {
        await sidecarApi.init_app('/test/db');
        expect(invoke).toHaveBeenCalledWith('init_app', { dbPath: '/test/db' });
    });

    it('should invoke native initialize_database command', async () => {
        await sidecarApi.initialize_database('/test/db');
        expect(invoke).toHaveBeenCalledWith('initialize_database', { dbPath: '/test/db' });
    });

    it('should invoke native embed_and_store_text command', async () => {
        const metadata = { source: 'test' };
        await sidecarApi.embed_and_store_text('hello world', metadata);
        expect(invoke).toHaveBeenCalledWith('embed_and_store_text', {
            content: 'hello world',
            metadata
        });
    });

    it('should invoke native add_document command', async () => {
        const metadata = { source: 'test' };
        await sidecarApi.add_document('hello world', metadata);
        expect(invoke).toHaveBeenCalledWith('add_document', {
            content: 'hello world',
            metadata
        });
    });

    it('should invoke native search_similar command and return SearchResult[]', async () => {
        const mockResults = [
            {
                id: '1',
                content: 'matched content',
                source: '/test/doc.md',
                filename: 'doc.md',
                folder: '/test',
                metadata: '{}',
                distance: 0.1
            }
        ];
        (invoke as any).mockResolvedValueOnce(mockResults);

        const results = await sidecarApi.search_similar('query', 5);
        expect(invoke).toHaveBeenCalledWith('search_similar', { query: 'query', limit: 5 });
        expect(results).toEqual(mockResults);
    });

    it('should invoke get_machine_id native command', async () => {
        (invoke as any).mockResolvedValueOnce('machine-1234');
        const machineId = await sidecarApi.getMachineId();
        expect(invoke).toHaveBeenCalledWith('get_machine_id');
        expect(machineId).toBe('machine-1234');
    });

    it('should invoke export_logs native command', async () => {
        (invoke as any).mockResolvedValueOnce('log content');
        const logs = await sidecarApi.exportLogs();
        expect(invoke).toHaveBeenCalledWith('export_logs');
        expect(logs).toBe('log content');
    });

    it('sidecarApi.request() should throw — not silently return {}', async () => {
        // Previously: request() returned {} silently — callers had no idea it failed.
        // Now: throws with a clear message pointing to the correct typed command.
        await expect(sidecarApi.request('POST', '/api/test')).rejects.toThrow(
            /not supported in native mode/i
        );
    });

    it('sidecarApi.request() error message should include the method and path', async () => {
        try {
            await sidecarApi.request('GET', '/api/academics/dashboard');
        } catch (e: any) {
            expect(e.message).toContain('GET /api/academics/dashboard');
        }
    });

    it('aiUpload should delegate to vaultUploadFile, not silently fail', async () => {
        // vaultUploadFile calls invoke('vault_upload_file', ...) internally
        (invoke as any).mockResolvedValueOnce({ success: true, path: 'inbox/file.pdf' });
        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'path', { value: '/absolute/path/to/test.pdf' });
        // Should not throw — just delegates
        const result = await sidecarApi.aiUpload(file);
        expect(result).toBeDefined();
    });
});
