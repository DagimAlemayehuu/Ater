import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sidecarApi } from '../lib/sidecarApi';
import { invoke } from '@tauri-apps/api/core';

describe('sidecarApi - Native Tauri IPC Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return instant health status without fetch', async () => {
        const result = await sidecarApi.health();
        expect(result).toEqual({ status: 'ok', version: '0.1.2' });
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
});
