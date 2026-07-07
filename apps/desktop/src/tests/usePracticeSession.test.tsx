import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { sidecarApi } from '../lib/sidecarApi';
import { Question } from '../types/practice';

// Mock sidecarApi
vi.mock('../lib/sidecarApi', () => ({
  sidecarApi: {
    srsCards: vi.fn(),
    explainQuestion: vi.fn(),
    recordPerformance: vi.fn().mockResolvedValue({ success: true }),
    submitTutorAnswer: vi.fn().mockResolvedValue({
      score: 5,
      score_change: 5,
      diagnosis: { is_misconception: false, misconception_text: '', hint: '', remediation_question: null },
      session: null,
    }),
    practiceRemediate: vi.fn().mockResolvedValue({
      detailed_lesson: 'Remediation lesson',
      remediation_question: null,
    }),
    logPracticeAttempt: vi.fn().mockResolvedValue({ success: true }),
    updatePracticeScore: vi.fn().mockResolvedValue({ success: true }),
    srsFeynmanValidate: vi.fn(),
  }
}));

// Mock Pomodoro Store
const mockAddPracticeResult = vi.fn();
vi.mock('../lib/pomodoroStore', () => ({
  usePomodoroStore: () => ({
    addPracticeResult: mockAddPracticeResult,
    currentHub: 'test-hub'
  })
}));

const mockQuestions: Question[] = [
  {
    id: 1,
    note_id: 'note_1.md',
    note_title: 'Note 1',
    type: 'mcq',
    difficulty: 'L1',
    question: 'What is 1 + 1?',
    explanation: 'Basic math',
    options: { A: '1', B: '2', C: '3' },
    answer: 'B'
  },
  {
    id: 2,
    note_id: 'note_2.md',
    note_title: 'Note 2',
    type: 'true_false',
    difficulty: 'L2',
    question: 'Is HTML a programming language?',
    explanation: 'No, markup',
    options: { True: 'True', False: 'False' },
    answer: 'False'
  },
  {
    id: 3,
    type: 'matching',
    difficulty: 'L2',
    question: 'Match terms',
    pairs: [
      { left: 'Frontend', right: 'React' },
      { left: 'Backend', right: 'FastAPI' }
    ],
    answer: { Frontend: 'React', Backend: 'FastAPI' }
  },
  {
    id: 4,
    type: 'order',
    difficulty: 'L3',
    question: 'Order steps',
    steps: ['Plan', 'Code', 'Test'],
    answer: ['Plan', 'Code', 'Test']
  }
];

describe('usePracticeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useRealTimers();
    (sidecarApi.srsCards as any).mockResolvedValue({ cards: [] });
    (sidecarApi.explainQuestion as any).mockResolvedValue({ is_correct: true, explanation: 'AI said correct.' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes session correctly', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {
        globalTimeLimitMinutes: 10,
        perQuestionTimeLimitSeconds: 30
      });
    });

    expect(result.current.questions).toHaveLength(4);
    expect(result.current.currentQuestionIdx).toBe(0);
    expect(result.current.currentQuestion?.id).toBe(1);
    expect(result.current.globalTimeLeft).toBe(600);
    expect(result.current.questionTimeLeft).toBe(30);
    expect(result.current.showScore).toBe(false);
  });

  it('selects and verifies correct MCQ answer', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {
        globalTimeLimitMinutes: null,
        perQuestionTimeLimitSeconds: null
      }, 'note_1.md');
    });

    act(() => {
      result.current.selectAnswer('B');
    });

    expect(result.current.userAnswers[1]).toBe('B');

    await act(async () => {
      await result.current.checkAnswer();
    });

    expect(result.current.revealedStates[0]).toBe(true);
    expect(result.current.scores[1]).toBe(true);
    expect(result.current.streak).toBe(1);
    expect(sidecarApi.recordPerformance).toHaveBeenCalledWith(expect.objectContaining({
      note_path: 'note_1.md',
      was_correct: true,
      question_type: 'mcq'
    }));
  });

  it('selects and verifies incorrect True/False answer', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {
        globalTimeLimitMinutes: null,
        perQuestionTimeLimitSeconds: null
      }, 'note_2.md');
    });

    // Answer Q1 correctly
    act(() => {
      result.current.selectAnswer('B');
    });
    await act(async () => {
      await result.current.checkAnswer();
    });

    // Go to Q2 (True/False)
    await act(async () => {
      await result.current.nextQuestion();
    });

    expect(result.current.currentQuestionIdx).toBe(1);
    expect(result.current.currentQuestion?.id).toBe(2);

    // Answer Q2 incorrectly
    act(() => {
      result.current.selectAnswer('True');
    });
    await act(async () => {
      await result.current.checkAnswer();
    });

    expect(result.current.scores[2]).toBe(false);
    expect(result.current.streak).toBe(0);
  });

  it('verifies correct matching answer', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {}, 'note_3.md', null, 2);
    });

    act(() => {
      result.current.selectAnswer({ Frontend: 'React', Backend: 'FastAPI' });
    });

    await act(async () => {
      await result.current.checkAnswer();
    });

    expect(result.current.scores[3]).toBe(true);
  });

  it('verifies correct order answer', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {}, 'note_4.md', null, 3);
    });

    act(() => {
      result.current.selectAnswer(['Plan', 'Code', 'Test']);
    });

    await act(async () => {
      await result.current.checkAnswer();
    });

    expect(result.current.scores[4]).toBe(true);
  });

  it('keeps objective answers locally wrong without waiting for AI explanation grading', async () => {
    const { result } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {}, 'note_1.md');
    });

    act(() => {
      result.current.selectAnswer('A');
    });

    await act(async () => {
      await result.current.checkAnswer();
    });

    expect(result.current.scores[1]).toBe(false);
    expect(result.current.questionHint[1]).toContain('Basic math');
    expect(sidecarApi.explainQuestion).not.toHaveBeenCalled();
  });

  it('triggers Feynman lock if retrievability is low and lapses exist', async () => {
    // Inject low retrievability card in mock
    (sidecarApi.srsCards as any).mockResolvedValue({
      cards: [
        {
          note_path: 'note_1.md',
          stability: 0.1,
          lapses: 4,
          last_review: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
        }
      ]
    });

    const { result } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {});
    });

    expect(result.current.isFeynmanLocked).toBe(true);
  });

  it('unlocks Feynman gate upon successful explanation validation', async () => {
    (sidecarApi.srsCards as any).mockResolvedValue({
      cards: [
        {
          note_path: 'note_1.md',
          stability: 0.1,
          lapses: 4,
          last_review: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    });
    (sidecarApi.srsFeynmanValidate as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {});
    });

    expect(result.current.isFeynmanLocked).toBe(true);

    act(() => {
      result.current.setFeynmanExplanation('This is a validated conceptual explanation.');
    });

    await act(async () => {
      await result.current.submitFeynmanChallenge();
    });

    expect(result.current.isFeynmanLocked).toBe(false);
    expect(sidecarApi.srsFeynmanValidate).toHaveBeenCalledWith('note_1.md', 'This is a validated conceptual explanation.');
  });

  it('cancels delayed auto-advance work when the session unmounts', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => usePracticeSession());

    await act(async () => {
      await result.current.startSession(mockQuestions, {
        perQuestionTimeLimitSeconds: 1
      }, 'note_1.md');
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(sidecarApi.logPracticeAttempt).not.toHaveBeenCalled();
  });

  it('calls submitTutorAnswer during selfGrade if tutor session exists', async () => {
    localStorage.setItem('ater_active_session_id', 'test-session-selfgrade');
    const { result } = renderHook(() => usePracticeSession());

    // start session with a writing/open ended type question
    const openEndedQ: Question[] = [{
      id: 3,
      note_id: 'note_3.md',
      note_title: 'Note 3',
      type: 'writing',
      difficulty: 'L1',
      question: 'Explain what Git tracks.',
      explanation: 'Git tracks history.',
      answer: 'History'
    }];

    await act(async () => {
      await result.current.startSession(openEndedQ, {}, 'note_3.md');
    });

    act(() => {
      result.current.selectAnswer('History and snaps');
    });

    await act(async () => {
      result.current.selfGrade(true);
    });

    expect(sidecarApi.submitTutorAnswer).toHaveBeenCalledWith({
      session_id: 'test-session-selfgrade',
      question_id: '3',
      is_correct: true,
      wager: 'low',
      user_answer: 'History and snaps',
    });
  });
});
