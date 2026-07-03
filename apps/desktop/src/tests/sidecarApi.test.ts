import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sidecarApi } from '../lib/sidecarApi';
import { invoke } from '@tauri-apps/api/core';
import { getAppStore } from '../lib/store';

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

    it('normalizes absolute vault paths before reading notes over IPC', async () => {
        const store = await getAppStore();
        vi.mocked(store.get).mockImplementation(async (key: string) => {
            if (key === 'obsidianVaultPath') return 'C:/Users/Ada/Vault';
            if (key === 'isDemoMode') return false;
            return undefined;
        });
        (invoke as any).mockResolvedValueOnce({ metadata: {}, content: 'body' });

        await sidecarApi.readObsidianNote('C:\\Users\\Ada\\Vault\\Notes\\Topic.md');

        expect(invoke).toHaveBeenCalledWith('read_obsidian_note', { path: 'Notes/Topic.md' });
    });

    it('normalizes absolute vault paths before updating notes over IPC', async () => {
        const store = await getAppStore();
        vi.mocked(store.get).mockImplementation(async (key: string) => {
            if (key === 'obsidianVaultPath') return '/Users/ada/Vault';
            if (key === 'isDemoMode') return false;
            return undefined;
        });
        (invoke as any).mockResolvedValueOnce({ success: true });

        await sidecarApi.updateObsidianNote('/Users/ada/Vault/Notes/Topic.md', 'body');

        expect(invoke).toHaveBeenCalledWith('update_obsidian_note', { path: 'Notes/Topic.md', content: 'body' });
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

    it('regenerateMessage returns the raw SSE Response for stream readers', async () => {
        const response = new Response('data: {"type":"run_start"}\n\n', {
            headers: { 'Content-Type': 'text/event-stream' },
        });
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response);

        try {
            await expect(sidecarApi.regenerateMessage('conv-1', 'msg-1')).resolves.toBe(response);

            expect(fetchMock).toHaveBeenCalledWith(
                'http://127.0.0.1:8765/api/chat/conversations/conv-1/regenerate',
                expect.objectContaining({ method: 'POST' }),
            );
        } finally {
            fetchMock.mockRestore();
        }
    });

    it('branchMessage returns the raw SSE Response for stream readers', async () => {
        const response = new Response('data: {"type":"branch_created"}\n\n', {
            headers: { 'Content-Type': 'text/event-stream' },
        });
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response);

        try {
            await expect(sidecarApi.branchMessage('conv-1', 'msg-1', 'edited')).resolves.toBe(response);

            expect(fetchMock).toHaveBeenCalledWith(
                'http://127.0.0.1:8765/api/chat/conversations/conv-1/branch',
                expect.objectContaining({ method: 'POST' }),
            );
        } finally {
            fetchMock.mockRestore();
        }
    });

    it('uses unified source job endpoints for source learning', async () => {
        const createResponse = { job_id: 'srcjob_1', status: 'roadmap_ready' };
        const statusResponse = { job_id: 'srcjob_1', audit: { page_count: 48 } };
        const startResponse = { tutor_session: { session_id: 'source_tutor_srcjob_1' } };
        const deployResponse = { job_id: 'srcjob_1', status: 'deployed' };
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response(JSON.stringify(createResponse), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(statusResponse), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(startResponse), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(deployResponse), { status: 200 }));

        try {
            await expect(sidecarApi.createSourceLearningJob({ file_path: '/Inbox/Chapter 3 2024-1.pdf', conversation_id: 'conv_1' })).resolves.toEqual(createResponse);
            await expect(sidecarApi.getSourceLearningJob('srcjob_1')).resolves.toEqual(statusResponse);
            await expect(sidecarApi.startSourceLearningJob('srcjob_1')).resolves.toEqual(startResponse);
            await expect(sidecarApi.deploySourceLearningJob('srcjob_1')).resolves.toEqual(deployResponse);

            expect(fetchMock).toHaveBeenNthCalledWith(
                1,
                'http://127.0.0.1:8765/api/ater/source/jobs',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ file_path: '/Inbox/Chapter 3 2024-1.pdf', conversation_id: 'conv_1' }),
                }),
            );
            expect(fetchMock).toHaveBeenNthCalledWith(
                2,
                'http://127.0.0.1:8765/api/ater/source/jobs/srcjob_1',
                expect.objectContaining({ method: 'GET' }),
            );
            expect(fetchMock).toHaveBeenNthCalledWith(
                3,
                'http://127.0.0.1:8765/api/ater/source/jobs/srcjob_1/start',
                expect.objectContaining({ method: 'POST' }),
            );
            expect(fetchMock).toHaveBeenNthCalledWith(
                4,
                'http://127.0.0.1:8765/api/ater/source/jobs/srcjob_1/deploy',
                expect.objectContaining({ method: 'POST' }),
            );
        } finally {
            fetchMock.mockRestore();
        }
    });

    it('uses durable prompt teacher job endpoints for prompt learning', async () => {
        const createResponse = { job_id: 'promptjob_1', status: 'roadmap_ready' };
        const statusResponse = { job_id: 'promptjob_1', prompt_teacher: { assumptions: [] } };
        const startResponse = { tutor_session: { session_id: 'source_tutor_promptjob_1' } };
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response(JSON.stringify(createResponse), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(statusResponse), { status: 200 }))
            .mockResolvedValueOnce(new Response(JSON.stringify(startResponse), { status: 200 }));

        try {
            await expect(sidecarApi.createPromptTeacherJob({ prompt: 'Teach me consumer behavior', conversation_id: 'conv_1' })).resolves.toEqual(createResponse);
            await expect(sidecarApi.getPromptTeacherJob('promptjob_1')).resolves.toEqual(statusResponse);
            await expect(sidecarApi.startPromptTeacherJob('promptjob_1')).resolves.toEqual(startResponse);

            expect(fetchMock).toHaveBeenNthCalledWith(
                1,
                'http://127.0.0.1:8765/api/ater/prompt/jobs',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ prompt: 'Teach me consumer behavior', conversation_id: 'conv_1' }),
                }),
            );
            expect(fetchMock).toHaveBeenNthCalledWith(
                2,
                'http://127.0.0.1:8765/api/ater/prompt/jobs/promptjob_1',
                expect.objectContaining({ method: 'GET' }),
            );
            expect(fetchMock).toHaveBeenNthCalledWith(
                3,
                'http://127.0.0.1:8765/api/ater/prompt/jobs/promptjob_1/start',
                expect.objectContaining({ method: 'POST' }),
            );
        } finally {
            fetchMock.mockRestore();
        }
    });

    it('persists chat message metadata for source teacher actions', async () => {
        const response = { id: 'msg_1', metadata: { sourceTeacherAction: { sourceJobId: 'srcjob_1' } } };
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }));

        try {
            await expect(
                sidecarApi.appendMessage(
                    'conv_1',
                    'assistant',
                    'Click **Start Lesson**',
                    undefined,
                    { sourceTeacherAction: { sourceJobId: 'srcjob_1' } },
                ),
            ).resolves.toEqual(response);

            expect(fetchMock).toHaveBeenCalledWith(
                'http://127.0.0.1:8765/api/chat/conversations/conv_1/messages',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        role: 'assistant',
                        content: 'Click **Start Lesson**',
                        parent_message_id: undefined,
                        metadata: { sourceTeacherAction: { sourceJobId: 'srcjob_1' } },
                    }),
                }),
            );
        } finally {
            fetchMock.mockRestore();
        }
    });
});
