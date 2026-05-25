import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AterDashboard from '../routes/agents';
import { ConfigProvider } from '../lib/ConfigContext';
import { HeaderProvider } from '../context/header-context';
import { MemoryRouter } from 'react-router-dom';
import { sidecarApi } from '../lib/sidecarApi';
import { useTelemetryStore } from '../lib/telemetryStore';

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
    sidecarApi: {
        aterQueueStatus: vi.fn(),
        aterListInbox: vi.fn(),
        aterWatcherToggle: vi.fn(),
        getMachineId: vi.fn().mockResolvedValue('test-machine-id'),
        findVaultPage: vi.fn(),
        search_similar: vi.fn(),
        oracleChatStream: vi.fn(),
    }
}));

// Mock Tauri Store
vi.mock('@tauri-apps/plugin-store', () => ({
    load: vi.fn().mockResolvedValue({
        get: vi.fn().mockImplementation((key) => {
            if (key === 'isProgramConfigured') return true;
            if (key === 'obsidianVaultPath') return '/test/vault';
            return null;
        }),
        set: vi.fn(),
        save: vi.fn(),
        load: vi.fn(),
        entries: vi.fn(),
    }),
}));

const renderDashboard = () => {
    return render(
        <MemoryRouter initialEntries={['/agents?tab=pipeline']}>
            <ConfigProvider>
                <HeaderProvider>
                    <AterDashboard onBack={() => {}} />
                </HeaderProvider>
            </ConfigProvider>
        </MemoryRouter>
    );
};

describe('AterDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTelemetryStore.setState({ inboxFiles: [], queueStatus: null });
        (sidecarApi.aterListInbox as any).mockResolvedValue({ files: [] });
    });

    it('should show idle state when queue is empty', async () => {
        (sidecarApi.aterQueueStatus as any).mockResolvedValue({
            status: 'idle',
            queue_size: 0,
            pending_files: [],
        });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Everything done/i)).toBeInTheDocument();
            expect(screen.getByText(/Inbox empty/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('should show processing state when queue has files', async () => {
        (sidecarApi.aterQueueStatus as any).mockResolvedValue({
            status: 'processing',
            current_file: 'test_note.pdf',
            current_batch: 1,
            total_batches: 5,
            queue_size: 2,
            last_action: 'Generating Chapter 1',
        });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Processing File/i)).toBeInTheDocument();
            expect(screen.getByText(/test_note.pdf/i)).toBeInTheDocument();
            expect(screen.getByText(/1 \/ 5/i)).toBeInTheDocument();
            expect(screen.getByText(/Generating Chapter 1/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('should list files in the inbox', async () => {
        (sidecarApi.aterQueueStatus as any).mockResolvedValue({
            status: 'idle',
            queue_size: 0,
            pending_files: [],
        });
        (sidecarApi.aterListInbox as any).mockResolvedValue({
            files: [
                { name: 'lecture1.pdf', path: '/vault/Inbox/lecture1.pdf' },
                { name: 'lecture2.pdf', path: '/vault/Inbox/lecture2.pdf' },
            ]
        });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('lecture1.pdf')).toBeInTheDocument();
            expect(screen.getByText('lecture2.pdf')).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});
