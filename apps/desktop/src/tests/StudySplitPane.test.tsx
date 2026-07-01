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
        aterListInbox: vi.fn().mockResolvedValue({ files: [] }),
        aterWatcherToggle: vi.fn(),
        getMachineId: vi.fn().mockResolvedValue('test-machine-id'),
        findVaultPage: vi.fn(),
        search_similar: vi.fn().mockResolvedValue([]),
        oracleChatStream: vi.fn(),
        explainQuestion: vi.fn().mockResolvedValue({ explanation: 'Test Diagnostic Feedback' }),
        readObsidianNote: vi.fn().mockResolvedValue({ content: 'Note content' }),
        listObsidianFiles: vi.fn().mockResolvedValue({ files: [] }),
        recordPerformance: vi.fn().mockResolvedValue({}),
        submitTutorAnswer: vi.fn().mockResolvedValue({
            score: 5,
            score_change: 5,
            diagnosis: { is_misconception: false, misconception_text: '', hint: '', remediation_question: null },
            session: null,
        }),
        srsCards: vi.fn().mockResolvedValue({ cards: [] }),
        practiceRemediate: vi.fn().mockResolvedValue({
            detailed_lesson: 'A concept lesson.',
            remediation_question: {
                id: 'rq1',
                type: 'scenario',
                question: 'Apply the idea in a new case.',
                answer: 'Apply the mechanism.',
                explanation: 'Apply the mechanism directly.',
            },
        }),
        deleteObsidianItem: vi.fn().mockResolvedValue({}),
        createObsidianFile: vi.fn().mockResolvedValue({}),
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
        localStorage.setItem('ater_study_active_note_path', 'database/General/Git/01_Foundations/Git_Commit_Graph.md');
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

    it('should continue the active lesson directly from the chat surface', async () => {
        render(
            <MemoryRouter initialEntries={['/agents?tab=ater']}>
                <ConfigProvider>
                    <HeaderProvider>
                        <AterDashboard onBack={() => {}} />
                    </HeaderProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        const continueBtn = await screen.findByRole('button', { name: /continue lesson/i });
        fireEvent.click(continueBtn);

        await waitFor(() => {
            expect(screen.getByText('Current Lesson')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: /Git Commit Graph/i })).toBeInTheDocument();
        });
    });

    it('should ignore stale remediation notes when continuing a lesson from chat', async () => {
        localStorage.setItem('ater_study_active_note_path', 'database/learning paths/remediation_temp.md');
        localStorage.setItem('ater_lesson_preview', JSON.stringify({
            title: 'Remediation Lesson',
            lessonPath: 'database/learning paths/remediation_temp.md',
            notePath: 'database/learning paths/remediation_temp.md',
            hubPath: '',
            previewUrl: '',
        }));
        localStorage.setItem('ater_canonical_lesson_path', 'database/General/Git/01_Foundations/Git_Commit_Graph.md');

        render(
            <MemoryRouter initialEntries={['/agents?tab=ater']}>
                <ConfigProvider>
                    <HeaderProvider>
                        <AterDashboard onBack={() => {}} />
                    </HeaderProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        expect(await screen.findByText('Git Commit Graph')).toBeInTheDocument();
        fireEvent.click(await screen.findByRole('button', { name: /continue lesson/i }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Git Commit Graph/i })).toBeInTheDocument();
        });
        expect(localStorage.getItem('ater_study_active_note_path')).toBe('database/General/Git/01_Foundations/Git_Commit_Graph.md');
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
            <MiniPracticeUI question={mockQuestion as any} notePath="/test.md" />
        );

        // Verify option buttons are displayed
        const optionB = screen.getByText('Cross encoder');
        fireEvent.click(optionB);

        expect(screen.queryByText(/Confidence Wager/i)).not.toBeInTheDocument();
        const checkBtn = screen.getByText('Check');
        fireEvent.click(checkBtn);

        // Wait for diagnostic API to be called and render diagnostic feedback
        await waitFor(() => {
            expect(sidecarApi.explainQuestion).toHaveBeenCalled();
            expect(screen.getByText('Active Mistake Diagnostic')).toBeInTheDocument();
            expect(screen.getByText('Test Diagnostic Feedback')).toBeInTheDocument();
        });
    });
});

describe('Proving Grounds Question Type Rendering', () => {
    const cases = [
        {
            type: 'mcq',
            question: {
                id: 'mcq1',
                type: 'mcq',
                question: 'Which statement is correct?',
                options: { A: 'Correct', B: 'Wrong' },
                answer: 'A',
                explanation: 'A is correct.',
                difficulty: 'L2',
            },
        },
        {
            type: 'true_false',
            question: {
                id: 'tf1',
                type: 'true_false',
                question: 'The concept applies through its mechanism.',
                answer: 'True',
                explanation: 'It does.',
                difficulty: 'L2',
            },
        },
        {
            type: 'fill_in',
            question: {
                id: 'fill1',
                type: 'fill_in',
                question: 'Complete the sentence.',
                textWithBlanks: 'Git stores [[snapshots]].',
                answer: ['snapshots'],
                explanation: 'Git stores snapshots.',
                difficulty: 'L2',
            },
        },
        {
            type: 'matching',
            question: {
                id: 'match1',
                type: 'matching',
                question: 'Match each role.',
                pairs: [{ left: 'Commit', right: 'Snapshot' }, { left: 'Branch', right: 'Pointer' }],
                answer: 'See pairs.',
                explanation: 'Roles match.',
                difficulty: 'L2',
            },
        },
        {
            type: 'order',
            question: {
                id: 'order1',
                type: 'order',
                question: 'Order the steps.',
                steps: ['Commit', 'Stage'],
                answer: ['Stage', 'Commit'],
                explanation: 'Stage then commit.',
                difficulty: 'L2',
            },
        },
        {
            type: 'debug',
            question: {
                id: 'debug1',
                type: 'debug',
                question: 'Find the bug.',
                content: 'commit == diff',
                answer: 'A commit is a snapshot.',
                explanation: 'A commit is more than a diff.',
                difficulty: 'L2',
            },
        },
        {
            type: 'synthesis',
            question: {
                id: 'synthesis1',
                type: 'synthesis',
                question: 'Synthesize the relationship.',
                answer: 'Snapshots support recovery.',
                explanation: 'The relationship matters.',
                difficulty: 'L2',
            },
        },
        {
            type: 'trace',
            question: {
                id: 'trace1',
                type: 'trace',
                question: 'Trace the result.',
                content: 'Stage -> commit -> recover',
                steps: ['Stage change', 'Commit snapshot', 'Recover state'],
                answer: 'Recover state',
                explanation: 'The state can be recovered.',
                difficulty: 'L2',
            },
        },
        {
            type: 'scenario',
            question: {
                id: 'scenario1',
                type: 'scenario',
                question: 'Apply this in a new repository scenario.',
                answer: 'Use commits as recovery points.',
                explanation: 'Commits preserve recoverable states.',
                difficulty: 'L2',
            },
        },
        {
            type: 'code',
            question: {
                id: 'code1',
                type: 'code',
                question: 'Write pseudocode.',
                codeSnippet: '# snapshot flow',
                language: 'text',
                answer: 'input -> snapshot -> recovery',
                explanation: 'The flow is preserved.',
                difficulty: 'L2',
            },
        },
        {
            type: 'calculation',
            question: {
                id: 'calc1',
                type: 'calculation',
                question: 'Calculate the resulting count.',
                content: '2 commits plus 1 commit',
                answer: '3',
                explanation: '2 + 1 = 3.',
                difficulty: 'L2',
            },
        },
        {
            type: 'data_analysis',
            question: {
                id: 'data1',
                type: 'data_analysis',
                question: 'Interpret the table.',
                content: '| state | commits |\n| a | 2 |',
                answer: 'State a has 2 commits.',
                explanation: 'The table reports 2 commits.',
                difficulty: 'L2',
            },
        },
        {
            type: 'find_error',
            question: {
                id: 'error1',
                type: 'find_error',
                question: 'Find the conceptual error.',
                buggyCode: 'branch = full copy',
                answer: 'A branch is a pointer.',
                explanation: 'Branches point to commits.',
                difficulty: 'L2',
            },
        },
        {
            type: 'writing',
            question: {
                id: 'writing1',
                type: 'writing',
                question: 'Explain the concept.',
                answer: 'A commit records a snapshot.',
                explanation: 'The explanation should mention snapshots.',
                difficulty: 'L2',
            },
        },
    ];

    it.each(cases)('renders a usable %s question', async ({ question }) => {
        render(<MiniPracticeUI question={question as any} notePath="/test.md" />);

        expect(await screen.findByText('Check')).toBeInTheDocument();
        expect(screen.getByText(String((question as any).type).replace('_', ' '))).toBeInTheDocument();
    });
});
