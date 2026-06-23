import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AterDashboard from '../routes/agents';
import { ConfigProvider } from '../lib/ConfigContext';
import { HeaderProvider } from '../context/header-context';
import { MemoryRouter } from 'react-router-dom';
import { sidecarApi } from '../lib/sidecarApi';
import MiniPracticeUI from '../components/MiniPracticeUI';

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
    sidecarApi: {
        aterQueueStatus: vi.fn(),
        aterListInbox: vi.fn(),
        aterWatcherToggle: vi.fn(),
        getMachineId: vi.fn().mockResolvedValue('test-machine-id'),
        findVaultPage: vi.fn(),
        search_similar: vi.fn().mockResolvedValue([]),
        oracleChatStream: vi.fn(),
        explainQuestion: vi.fn().mockResolvedValue({ explanation: 'Test Diagnostic Feedback' }),
        readObsidianNote: vi.fn().mockResolvedValue({ content: 'Note content' }),
        recordPerformance: vi.fn().mockResolvedValue({}),
    }
}));

// Mock Tauri Store
vi.mock('@tauri-apps/plugin-store', () => ({
    load: vi.fn().mockResolvedValue({
        get: vi.fn().mockImplementation((key) => {
            if (key === 'isProgramConfigured') return true;
            return null;
        }),
        set: vi.fn(),
        save: vi.fn(),
    }),
}));

// Mock Tauri event listener
vi.mock('@tauri-apps/api/event', () => ({
    listen: vi.fn().mockResolvedValue(() => {}),
}));

describe('Study Workspace Persistent Split-Pane', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should render the split pane and controls correctly', () => {
        render(
            <MemoryRouter initialEntries={['/agents?tab=ater']}>
                <ConfigProvider>
                    <HeaderProvider>
                        <AterDashboard onBack={() => {}} />
                    </HeaderProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        // Verify that control buttons exist
        expect(screen.getByTitle('Collapse Left (Chat)')).toBeInTheDocument();
        expect(screen.getByTitle('Reset to 50/50')).toBeInTheDocument();
        expect(screen.getByTitle('Collapse Right (Note Canvas)')).toBeInTheDocument();
    });

    it('should snap right and show notes margin tab on right collapse click', async () => {
        render(
            <MemoryRouter initialEntries={['/agents?tab=ater']}>
                <ConfigProvider>
                    <HeaderProvider>
                        <AterDashboard onBack={() => {}} />
                    </HeaderProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        const collapseRightBtn = screen.getByTitle('Collapse Right (Note Canvas)');
        fireEvent.click(collapseRightBtn);

        // Verify right tab exists
        const restoreNotesBtn = screen.getByTitle('Restore Note Panel');
        expect(restoreNotesBtn).toBeInTheDocument();
        expect(localStorage.getItem('ater_study_split_right_collapsed')).toBe('true');

        // Click to restore note panel
        fireEvent.click(restoreNotesBtn);
        expect(screen.getByTitle('Collapse Right (Note Canvas)')).toBeInTheDocument();
        expect(localStorage.getItem('ater_study_split_right_collapsed')).toBe('false');
    });

    it('should snap left and show chat margin tab on left collapse click', async () => {
        render(
            <MemoryRouter initialEntries={['/agents?tab=ater']}>
                <ConfigProvider>
                    <HeaderProvider>
                        <AterDashboard onBack={() => {}} />
                    </HeaderProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        const collapseLeftBtn = screen.getByTitle('Collapse Left (Chat)');
        fireEvent.click(collapseLeftBtn);

        // Verify left tab exists
        const restoreChatBtn = screen.getByTitle('Restore Chat Panel');
        expect(restoreChatBtn).toBeInTheDocument();
        expect(localStorage.getItem('ater_study_split_left_collapsed')).toBe('true');

        // Click to restore chat panel
        fireEvent.click(restoreChatBtn);
        expect(screen.getByTitle('Collapse Left (Chat)')).toBeInTheDocument();
        expect(localStorage.getItem('ater_study_split_left_collapsed')).toBe('false');
    });

    it('should restore last unsnapped width when restored', async () => {
        localStorage.setItem('ater_study_split_last_width', '35');

        render(
            <MemoryRouter initialEntries={['/agents?tab=ater']}>
                <ConfigProvider>
                    <HeaderProvider>
                        <AterDashboard onBack={() => {}} />
                    </HeaderProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        // Set to collapsed first
        const collapseRightBtn = screen.getByTitle('Collapse Right (Note Canvas)');
        fireEvent.click(collapseRightBtn);

        // Restore
        const restoreNotesBtn = screen.getByTitle('Restore Note Panel');
        fireEvent.click(restoreNotesBtn);

        // Verify split width restored to 35%
        expect(localStorage.getItem('ater_study_split_width')).toBe('35');
    });
});

describe('Mistake Diagnostics Trigger', () => {
    const mockQuestion = {
        id: 'q1',
        type: 'mcq',
        question: 'What is ColBERT?',
        answer: 'A',
        explanation: 'ColBERT is a late interaction retriever.',
        difficulty: 'Medium',
        options: { A: 'Late Interaction model', B: 'Cross encoder' }
    };

    it('should fetch diagnostics and render inline card when mcq question is graded wrong', async () => {
        render(
            <MiniPracticeUI question={mockQuestion} notePath="/test.md" />
        );

        // Verify option buttons are displayed
        const optionB = screen.getByText('Cross encoder');
        fireEvent.click(optionB);

        // Click confidence wager (e.g. 3) to allow verification
        const wager3 = screen.getByText('3');
        fireEvent.click(wager3);

        const verifyBtn = screen.getByText('Verify Understanding');
        fireEvent.click(verifyBtn);

        // Wait for diagnostic API to be called and render diagnostic feedback
        await waitFor(() => {
            expect(sidecarApi.explainQuestion).toHaveBeenCalled();
            expect(screen.getByText('Active Mistake Diagnostic')).toBeInTheDocument();
            expect(screen.getByText('Test Diagnostic Feedback')).toBeInTheDocument();
        });
    });
});
