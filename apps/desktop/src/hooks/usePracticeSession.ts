import { useState, useEffect, useRef, useCallback } from 'react';
import { Question } from '@/types/practice';
import { sidecarApi } from '@/lib/sidecarApi';
import { usePomodoroStore } from '@/lib/pomodoroStore';
import { toast } from 'sonner';

export interface PracticeSessionConfig {
  globalTimeLimitMinutes?: number | null;
  perQuestionTimeLimitSeconds?: number | null;
  requireConfidenceWager?: boolean;
}

function normalizeAnswerValue(value: any): string {
  if (Array.isArray(value)) {
    return value.map(normalizeAnswerValue).join('|');
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value ?? '').trim().toLowerCase();
}

function resolveSelectedAnswer(question: Question, selected: any): any {
  const options = (question as any).options;
  if (options && selected !== undefined && selected !== null && !Array.isArray(selected) && typeof selected !== 'object') {
    if (Object.prototype.hasOwnProperty.call(options, selected)) {
      return options[selected];
    }
  }
  return selected;
}

function gradeLocally(question: Question, selected: any): boolean {
  const expected = (question as any).answer;
  const resolved = resolveSelectedAnswer(question, selected);

  if ((question as any).type === 'matching' && Array.isArray((question as any).pairs)) {
    const selectedMap = selected || {};
    return (question as any).pairs.every((pair: any) => selectedMap[pair.left] === pair.right);
  }

  if ((question as any).type === 'order' && Array.isArray(expected) && Array.isArray(selected)) {
    return expected.length === selected.length && expected.every((item: any, idx: number) => normalizeAnswerValue(item) === normalizeAnswerValue(selected[idx]));
  }

  if (Array.isArray(expected) && Array.isArray(resolved)) {
    return expected.length === resolved.length && expected.every((item: any, idx: number) => normalizeAnswerValue(item) === normalizeAnswerValue(resolved[idx]));
  }

  if (Array.isArray(expected)) {
    return expected.some(item => normalizeAnswerValue(item) === normalizeAnswerValue(resolved));
  }

  return normalizeAnswerValue(expected) === normalizeAnswerValue(selected) || normalizeAnswerValue(expected) === normalizeAnswerValue(resolved);
}

function isObjectiveQuestion(question: Question): boolean {
  return ['mcq', 'true_false', 'fill_in', 'matching', 'order'].includes((question as any).type);
}

function formatAnswerValue(value: any): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '');
}

function gradeOpenEndedLocally(question: Question, selected: any): boolean {
  const answerText = normalizeAnswerValue(selected);
  const requiredKeywords = (question as any).required_keywords;
  if (Array.isArray(requiredKeywords) && requiredKeywords.length > 0) {
    const hits = requiredKeywords.filter((kw: string) => answerText.includes(normalizeAnswerValue(kw))).length;
    return hits >= Math.max(1, Math.ceil(requiredKeywords.length * 0.6));
  }

  const expected = formatAnswerValue((question as any).answer);
  const expectedTerms = expected
    .toLowerCase()
    .match(/[a-z0-9]{4,}/g)
    ?.filter((term, idx, arr) => arr.indexOf(term) === idx) || [];

  if (expectedTerms.length === 0) return answerText.trim().length >= 24;
  const hits = expectedTerms.filter(term => answerText.includes(term)).length;
  return hits >= Math.max(1, Math.min(3, Math.ceil(expectedTerms.length * 0.4)));
}

function buildLocalExplanation(question: Question, selected: any, isCorrect: boolean): string {
  const answerText = formatAnswerValue((question as any).answer);
  const baseExplanation = (question as any).explanation || `The correct answer is ${answerText}.`;

  if (isCorrect) {
    return [
      `### Core Concept Summary`,
      ``,
      baseExplanation,
    ].join('\n');
  }

  return [
    `### Concept Breakdown & Explanation`,
    ``,
    baseExplanation,
    ``,
    `To Master This Concept:`,
    `Focus on the core mechanics, system dependencies, or rules that make this explanation correct. Ensure you can explain the flow from inputs to outcomes without relying on option labels.`,
  ].join('\n');
}

const SUPPORTED_PROVING_GROUND_TYPES = [
  'mcq',
  'true_false',
  'writing',
  'fill_in',
  'matching',
  'order',
  'debug',
  'synthesis',
  'trace',
  'scenario',
  'code',
  'calculation',
  'data_analysis',
  'find_error',
] as const;

function normalizeQuestionType(type: any): Question['type'] {
  const raw = String(type || 'writing').trim().toLowerCase();
  const aliases: Record<string, Question['type']> = {
    'multiple-choice': 'mcq',
    multiple_choice: 'mcq',
    'multiple choice': 'mcq',
    'true-false': 'true_false',
    'true false': 'true_false',
    'true/false': 'true_false',
    'fill-in': 'fill_in',
    'fill in': 'fill_in',
    'find-error': 'find_error',
    'find error': 'find_error',
  };
  const normalized = aliases[raw] || raw;
  return (SUPPORTED_PROVING_GROUND_TYPES as readonly string[]).includes(normalized) ? normalized as Question['type'] : 'writing';
}

function chooseFallbackQuestionType(question: Question, attempt: number, seenTypes: string[] = []): Question['type'] {
  const original = question as any;
  const context = [
    original.type,
    original.question,
    original.content,
    original.codeSnippet,
    original.buggyCode,
    original.explanation,
  ].join(' ').toLowerCase();
  const seen = new Set(seenTypes.map(normalizeQuestionType));
  const ranked: Question['type'][] = [];

  if (/```|def |class |function|bug|debug|exception|runtime|compile/.test(context)) {
    ranked.push('debug', 'trace', 'code', 'find_error', 'scenario');
  }
  if (/calculate|equation|formula|solve|number|ratio|probability|derivative|integral/.test(context)) {
    ranked.push('calculation', 'trace', 'data_analysis', 'fill_in');
  }
  if (/table|dataset|chart|graph|trend|correlation|row|column/.test(context)) {
    ranked.push('data_analysis', 'calculation', 'scenario');
  }
  if (/sequence|order|step|workflow|pipeline|process|first|then/.test(context)) {
    ranked.push('order', 'trace', 'scenario');
  }
  if (/compare|contrast|mapping|pair|relationship|matches|term/.test(context)) {
    ranked.push('matching', 'synthesis', 'mcq');
  }

  ranked.push(normalizeQuestionType(original.type), 'scenario', 'synthesis', 'fill_in', 'matching', 'mcq', 'writing', 'true_false');
  const offset = attempt > 0 ? ['scenario', 'trace', 'synthesis'] as Question['type'][] : [];
  for (const type of [...offset, ...ranked]) {
    if (!seen.has(type)) return type;
  }
  return ranked[attempt % ranked.length] || 'scenario';
}

function buildFallbackRemediationQuestion(question: Question, selected: any, attempt: number, notePathValue?: string, seenTypes: string[] = []): Question {
  const original = question as any;
  const answerText = Array.isArray(original.answer)
    ? original.answer.join(', ')
    : typeof original.answer === 'object' && original.answer !== null
      ? JSON.stringify(original.answer)
      : String(original.answer ?? '');
  const qType = chooseFallbackQuestionType(question, attempt, seenTypes);
  const base: any = {
    ...original,
    id: `${original.id}_remediation_${attempt + 1}`,
    type: qType,
    difficulty: `L${Math.min(4, attempt + 2)}`,
    question: `Apply this concept in a new case: ${original.question || 'Explain the core concept.'}`,
    answer: answerText || 'A correct answer applies the concept mechanism directly.',
    explanation: original.explanation || `Explain the mechanism from first principles.`,
    options: undefined,
    note_id: original.note_id || notePathValue,
    is_remediation: true,
  };

  if (qType === 'mcq') {
    base.question = `Which option best applies this concept: ${original.question || 'the lesson concept'}?`;
    base.options = {
      A: answerText || 'The explanation that preserves the concept mechanism.',
      B: 'A surface-level answer that only repeats a keyword.',
      C: 'A related fact that does not answer the question.',
      D: 'The inverse of the concept relationship.',
    };
    base.answer = 'A';
  } else if (qType === 'true_false') {
    base.question = `True or False: ${answerText || original.explanation || 'The concept must be applied through its mechanism, not by keyword matching.'}`;
    base.options = { True: 'True', False: 'False' };
    base.answer = 'True';
  } else if (qType === 'fill_in') {
    const blank = answerText.slice(0, 80) || 'the correct relationship';
    base.question = `Complete the key claim about this concept.`;
    base.textWithBlanks = `The concept works because [[${blank}]].`;
    base.text_with_blanks = base.textWithBlanks;
    base.answer = [blank];
  } else if (qType === 'matching') {
    base.question = 'Match each concept role to its function.';
    base.pairs = [
      { left: 'Core mechanism', right: 'Transforms inputs into the expected result' },
      { left: 'Misleading cue', right: 'Looks relevant but does not explain causality' },
      { left: 'Application check', right: 'Uses the concept in a new case' },
    ];
    base.answer = 'See pairs for correct matching.';
  } else if (qType === 'order') {
    const steps = ['Identify the relevant condition', 'Apply the concept mechanism', 'State the resulting implication'];
    base.question = 'Put the reasoning steps in the correct order.';
    base.steps = [...steps].reverse();
    base.answer = steps;
  } else if (qType === 'debug' || qType === 'find_error') {
    base.question = 'Find the conceptual flaw in this reasoning and correct it.';
    base.content = 'Claim: the answer is valid because a related keyword appears, even if the mechanism is not applied.';
    base.buggyCode = base.content;
    base.answer = 'The flaw is substituting keyword recognition for applying the concept mechanism.';
  } else if (qType === 'code') {
    base.question = 'Write pseudocode or a small function that applies this concept.';
    base.codeSnippet = '# input -> mechanism -> output';
    base.language = 'text';
  } else if (qType === 'calculation' || qType === 'data_analysis' || qType === 'trace') {
    base.content = original.content || original.question || '';
    if (qType === 'trace') {
      base.steps = ['Start from the condition', 'Apply the mechanism', 'State the consequence'];
    }
  }

  return base as Question;
}

export function usePracticeSession() {
  const { addPracticeResult, currentHub } = usePomodoroStore();

  // Active session parameters
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [notePath, setNotePath] = useState<string | undefined>(undefined);
  const [sessionPath, setSessionPath] = useState<string | null>(null);

  // Answering & grading state
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [revealedStates, setRevealedStates] = useState<Record<string | number, boolean>>({});
  const [scores, setScores] = useState<Record<string | number, boolean>>({});
  const [showScore, setShowScore] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bookmarked, setBookmarked] = useState<Set<string | number>>(new Set());
  const [confidenceWagers, setConfidenceWagers] = useState<Record<string | number, number>>({});
  const [keywordChecks, setKeywordChecks] = useState<Record<string, boolean>>({});

  // Feynman cognitive lock state
  const [srsCardsCache, setSrsCardsCache] = useState<Record<string, any>>({});
  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(new Set());
  const [feynmanExplanation, setFeynmanExplanation] = useState('');
  const [feynmanError, setFeynmanError] = useState<string | null>(null);
  const [isFeynmanValidating, setIsFeynmanValidating] = useState(false);

  // Paced retry & misconception states
  const [questionHint, setQuestionHint] = useState<Record<string, string>>({});
  const [misconceptionText, setMisconceptionText] = useState<Record<string, string>>({});
  const [remediationQuestion, setRemediationQuestion] = useState<Record<string, Question | null>>({});
  const [retryActive, setRetryActive] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failureAttempts, setFailureAttempts] = useState<Record<string, number>>({});
  // Per-question history: tracks seen question types and lesson summaries to avoid repetition
  const [remediationHistory, setRemediationHistory] = useState<Record<string, { seenTypes: string[]; lessonSummaries: string[] }>>({});

  // Timer states
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);

  // Timing references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const questionStartTimeRef = useRef<number>(Date.now());
  const practiceStartTimeRef = useRef<number>(Date.now());
  const configRef = useRef<PracticeSessionConfig>({});

  // Active question shortcut
  const currentQuestion = questions[currentQuestionIdx];
  const isRevealed = revealedStates[currentQuestionIdx] || false;

  // Resolve FSRS locking constraints
  const checkIsFeynmanLocked = useCallback((q: Question | undefined): boolean => {
    if (!q || !q.note_id) return false;
    const card = srsCardsCache[q.note_id];
    if (!card) return false;

    // Retrievability = (1 + t / (9 * s))^-1
    const getRetrievability = (c: any): number => {
      const stability = Math.max(0.01, c.stability || 0);
      if (!c.last_review) return 1.0;
      const lastReviewTime = new Date(c.last_review).getTime();
      const elapsedDays = Math.max(0, Date.now() - lastReviewTime) / (1000 * 60 * 60 * 24);
      return Math.pow(1 + elapsedDays / (9 * stability), -1);
    };

    const r = getRetrievability(card);
    const lapses = card.lapses || 0;
    return (lapses >= 3 || r < 0.70) && !unlockedNotes.has(q.note_id);
  }, [srsCardsCache, unlockedNotes]);

  const isFeynmanLocked = checkIsFeynmanLocked(currentQuestion);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, []);

  // Initialize and load session context
  const startSession = useCallback(async (
    questionsList: Question[],
    config: PracticeSessionConfig,
    notePathValue?: string,
    quizPathValue?: string | null,
    initialQuestionIndex: number = 0
  ) => {
    const stem = notePathValue ? notePathValue.split('/').pop()?.replace(/\.[^/.]+$/, "") || 'q' : 'q';
    const normalizedQuestions = questionsList.map((q, idx) => ({
      ...q,
      id: q.id !== undefined && q.id !== null ? q.id : `${stem}_q${idx + 1}`
    }));
    setQuestions(normalizedQuestions);
    const safeInitialIndex = Math.max(0, Math.min(initialQuestionIndex, Math.max(questionsList.length - 1, 0)));
    setCurrentQuestionIdx(safeInitialIndex);
    setNotePath(notePathValue);
    setSessionPath(quizPathValue || null);

    setUserAnswers({});
    setRevealedStates({});
    setScores({});
    setShowScore(questionsList.length > 0 && initialQuestionIndex >= questionsList.length);
    setStreak(0);
    setBookmarked(new Set());
    setConfidenceWagers({});
    setKeywordChecks({});
    setUnlockedNotes(new Set());
    setFeynmanExplanation('');
    setFeynmanError(null);
    setQuestionHint({});
    setMisconceptionText({});
    setRemediationQuestion({});
    setRetryActive({});
    setFailureAttempts({});

    configRef.current = config;
    practiceStartTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();

    if (config.globalTimeLimitMinutes) {
      setGlobalTimeLeft(config.globalTimeLimitMinutes * 60);
    } else {
      setGlobalTimeLeft(null);
    }

    if (config.perQuestionTimeLimitSeconds) {
      setQuestionTimeLeft(config.perQuestionTimeLimitSeconds);
    } else {
      setQuestionTimeLeft(null);
    }

    // Load FSRS caching
    try {
      const cacheRes = await sidecarApi.srsCards();
      const cacheMap: Record<string, any> = {};
      if (cacheRes && Array.isArray(cacheRes.cards)) {
        cacheRes.cards.forEach((c: any) => {
          cacheMap[c.note_path] = c;
        });
      }
      setSrsCardsCache(cacheMap);
    } catch (err) {
      console.error("[usePracticeSession] FSRS card loading failed:", err);
    }
  }, []);

  // Answer selection handler
  const selectAnswer = useCallback((value: any) => {
    if (!currentQuestion || isRevealed) return;
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  }, [currentQuestion, isRevealed]);

  // Answer validation check
  const checkAnswer = useCallback(async () => {
    if (!currentQuestion || isRevealed || isSubmitting) return;
    const ans = userAnswers[currentQuestion.id];
    if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) return;

    const objective = isObjectiveQuestion(currentQuestion);
    const resolvedUserAnswer = formatAnswerValue(resolveSelectedAnswer(currentQuestion, ans));

    setIsSubmitting(true);
    try {
      let isCorrect = false;
      let explanation = "";

      if (objective) {
        isCorrect = gradeLocally(currentQuestion, ans);
        explanation = buildLocalExplanation(currentQuestion, ans, isCorrect);
      } else {
        try {
          const aiRes = await sidecarApi.explainQuestion({
            question: currentQuestion.question,
            type: currentQuestion.type,
            answer: formatAnswerValue(currentQuestion.answer),
            explanation: currentQuestion.explanation || "",
            context: (currentQuestion as any).content || (currentQuestion as any).codeSnippet || "",
            userAnswer: resolvedUserAnswer,
            note_path: currentQuestion.note_id || notePath,
          });
          isCorrect = aiRes.is_correct;
          explanation = aiRes.lesson || aiRes.explanation || "";
        } catch (err) {
          console.error("AI grading failed, using local fallback:", err);
          isCorrect = gradeOpenEndedLocally(currentQuestion, ans);
          explanation = buildLocalExplanation(currentQuestion, ans, isCorrect);
        }
      }

      // Store explanation in question hints so the UI can render it
      setQuestionHint(prev => ({ ...prev, [currentQuestion.id]: explanation }));

      const isTutorSession = sessionPath && !sessionPath.endsWith('.md') && !sessionPath.includes('Practice_');
      const isPracticeSession = sessionPath && (sessionPath.endsWith('.md') || sessionPath.includes('Practice_'));

      if (isTutorSession) {
        const subRes = await sidecarApi.submitTutorAnswer({
          session_id: sessionPath!,
          question_id: String(currentQuestion.id),
          is_correct: isCorrect,
          wager: 'low',
          user_answer: resolvedUserAnswer
        });

        if (isCorrect) {
          setScores(prev => ({ ...prev, [currentQuestion.id]: true }));
          setRevealedStates(prev => ({ ...prev, [currentQuestionIdx]: true }));
          setStreak(prev => prev + 1);
        } else {
          const diag = subRes.diagnosis;
          if (diag.remediation_question) {
            setMisconceptionText(prev => ({ ...prev, [currentQuestion.id]: diag.misconception_text || explanation }));
            setRemediationQuestion(prev => ({ ...prev, [currentQuestion.id]: diag.remediation_question }));
            setScores(prev => ({ ...prev, [currentQuestion.id]: false }));
            setRevealedStates(prev => ({ ...prev, [currentQuestionIdx]: true }));
            setStreak(0);
          } else {
            setQuestionHint(prev => ({ ...prev, [currentQuestion.id]: explanation }));
            setRetryActive(prev => ({ ...prev, [currentQuestion.id]: true }));
          }
        }
      } else {
        // Practice Session or Local Mini Recall
        setScores(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));
        setRevealedStates(prev => ({ ...prev, [currentQuestionIdx]: true }));
        setStreak(prev => isCorrect ? prev + 1 : 0);

        if (!isPracticeSession) {
          // Local Mini Recall triggers Active Tutor session sync & remediation
          const activeTutorSessionId = localStorage.getItem('ater_active_session_id');
          const isRemediationNote = typeof notePath === 'string' && notePath.includes('remediation_temp');
          if (activeTutorSessionId && !isRemediationNote) {
            await sidecarApi.submitTutorAnswer({
              session_id: activeTutorSessionId,
              question_id: String(currentQuestion.id),
              is_correct: isCorrect,
              wager: 'low',
              user_answer: resolvedUserAnswer,
            }).catch((err) => {
              console.error('[usePracticeSession] Tutor recall persistence failed:', err);
            });
          }

          if (!isCorrect) {
            const attempt = failureAttempts[String(currentQuestion.id)] || 0;
            const history = remediationHistory[String(currentQuestion.id)] || { seenTypes: [], lessonSummaries: [] };
            try {
              const remRes = await sidecarApi.practiceRemediate({
                note_path: notePath || '',
                question: currentQuestion,
                user_answer: resolvedUserAnswer,
                attempt_number: attempt,
                seen_question_types: history.seenTypes,
                seen_lesson_summaries: history.lessonSummaries,
              });
              setMisconceptionText(prev => ({ ...prev, [currentQuestion.id]: remRes.detailed_lesson }));
              setRemediationQuestion(prev => ({ ...prev, [currentQuestion.id]: remRes.remediation_question }));
              const newType = remRes.remediation_question?.type || 'writing';
              const lessonSummary = (remRes.detailed_lesson || '').slice(0, 120);
              setRemediationHistory(prev => ({
                ...prev,
                [String(currentQuestion.id)]: {
                  seenTypes: [...history.seenTypes, newType],
                  lessonSummaries: [...history.lessonSummaries, lessonSummary],
                }
              }));
            } catch (e) {
              console.error("Failed to generate AI remediation, using local fallback:", e);
              const remediation = buildFallbackRemediationQuestion(currentQuestion, ans, attempt, notePath, history.seenTypes);
              setMisconceptionText(prev => ({ ...prev, [currentQuestion.id]: explanation }));
              setRemediationQuestion(prev => ({ ...prev, [currentQuestion.id]: remediation }));
            }
            setFailureAttempts(prev => ({ ...prev, [currentQuestion.id]: attempt + 1 }));
          }
        }

        // Record performance for study telemetry & spaced-repetition card updates
        const timeTakenMs = Date.now() - questionStartTimeRef.current;
        const targetNotePath = currentQuestion.note_id || notePath;
        if (targetNotePath) {
          await sidecarApi.recordPerformance({
            note_path: targetNotePath,
            was_correct: isCorrect,
            time_ms: timeTakenMs,
            question_type: currentQuestion.type,
            confidence: 3,
            question_id: String(currentQuestion.id)
          }).catch(console.error);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQuestion, isRevealed, userAnswers, currentQuestionIdx, notePath, sessionPath, isSubmitting, failureAttempts, remediationHistory]);

  const handleRetry = useCallback(() => {
    if (!currentQuestion) return;
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: undefined }));
    setRetryActive(prev => ({ ...prev, [currentQuestion.id]: false }));
    setQuestionHint(prev => ({ ...prev, [currentQuestion.id]: "" }));
  }, [currentQuestion]);

  const handleTakeRemediation = useCallback(() => {
    if (!currentQuestion) return;
    const rq = remediationQuestion[currentQuestion.id];
    if (rq) {
      const nextQuestions = [...questions];
      nextQuestions.splice(currentQuestionIdx + 1, 0, rq);
      setQuestions(nextQuestions);
      setCurrentQuestionIdx(prev => prev + 1);
      setRevealedStates(prev => ({ ...prev, [currentQuestionIdx + 1]: false }));
      setKeywordChecks({});
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestion, currentQuestionIdx, questions, remediationQuestion]);

  const selfGrade = useCallback((isCorrect: boolean) => {
    if (!currentQuestion) return;
    setScores(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));
    setRevealedStates(prev => ({ ...prev, [currentQuestionIdx]: true }));

    const timeTakenMs = Date.now() - questionStartTimeRef.current;
    if (notePath) {
      sidecarApi.recordPerformance({
        note_path: notePath,
        was_correct: isCorrect,
        time_ms: timeTakenMs,
        question_type: currentQuestion.type,
        difficulty: String(currentQuestion.difficulty || '1'),
        confidence: confidenceWagers[currentQuestion.id] || undefined,
        question_id: String(currentQuestion.id)
      }).catch(console.error);

      const activeTutorSessionId = localStorage.getItem('ater_active_session_id');
      const isRemediationNote = typeof notePath === 'string' && notePath.includes('remediation_temp');
      if (activeTutorSessionId && !isRemediationNote) {
        const ans = userAnswers[currentQuestion.id];
        const resolvedUserAnswer = ans !== undefined ? formatAnswerValue(resolveSelectedAnswer(currentQuestion, ans)) : '';
        sidecarApi.submitTutorAnswer({
          session_id: activeTutorSessionId,
          question_id: String(currentQuestion.id),
          is_correct: isCorrect,
          wager: 'low',
          user_answer: resolvedUserAnswer,
        }).catch((err) => {
          console.error('[usePracticeSession] Tutor self-grade recall persistence failed:', err);
        });
      }
    }

    // Direct progression for self-graded questions in MiniPracticeUI
    if (notePath) {
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setKeywordChecks({});
        questionStartTimeRef.current = Date.now();
      } else {
        const finalScore = Object.values({ ...scores, [currentQuestion.id]: isCorrect }).filter(Boolean).length;
        addPracticeResult(currentHub, finalScore, questions.length, notePath);
        setShowScore(true);
      }
    }
  }, [currentQuestion, currentQuestionIdx, questions.length, notePath, scores, addPracticeResult, currentHub, confidenceWagers, userAnswers]);

  const nextQuestion = useCallback(async (latestGrade?: boolean) => {
    if (!currentQuestion) return;
    if (!isMountedRef.current) return;
    const isCorrect = latestGrade !== undefined ? latestGrade : scores[currentQuestion.id] === true;

    // Log telemetry attempt
    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    sidecarApi.logPracticeAttempt(
      currentQuestion.note_id || currentHub || 'unknown',
      currentQuestion.type || 'unknown',
      isCorrect,
      timeTakenSeconds
    ).catch(err => {
      console.error("[usePracticeSession] Attempt logging failed:", err);
    });

    if (latestGrade !== undefined) {
      setScores(prev => ({ ...prev, [currentQuestion.id]: latestGrade }));
      setStreak(prev => latestGrade ? prev + 1 : 0);
    }

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setKeywordChecks({});
      if (configRef.current.perQuestionTimeLimitSeconds) {
        setQuestionTimeLeft(configRef.current.perQuestionTimeLimitSeconds);
      } else {
        setQuestionTimeLeft(null);
      }
      questionStartTimeRef.current = Date.now();
    } else {
      // Complete practice session
      const finalScores = latestGrade !== undefined
        ? { ...scores, [currentQuestion.id]: latestGrade }
        : scores;
      const correctCount = Object.values(finalScores).filter(Boolean).length;
      const total = questions.length;
      const finalScorePct = Math.round((correctCount / (total || 1)) * 100);

      if (sessionPath) {
        try {
          await sidecarApi.updatePracticeScore(sessionPath, finalScorePct);
        } catch (err) {
          console.error("[usePracticeSession] Score update failed:", err);
        }
      }
      if (notePath) {
        addPracticeResult(currentHub, correctCount, total, notePath);
      }
      setShowScore(true);
    }
  }, [currentQuestion, currentQuestionIdx, questions.length, scores, currentHub, sessionPath, notePath, addPracticeResult]);

  const toggleBookmark = useCallback((idx: number) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const setConfidenceWager = useCallback((qId: string, val: number) => {
    setConfidenceWagers(prev => ({ ...prev, [qId]: val }));
  }, []);

  const setKeywordCheck = useCallback((kw: string, checked: boolean) => {
    setKeywordChecks(prev => ({ ...prev, [kw]: checked }));
  }, []);

  // Feynman Lock Unlock handler
  const submitFeynmanChallenge = useCallback(async () => {
    if (!currentQuestion || !currentQuestion.note_id || !feynmanExplanation.trim()) return;

    setIsFeynmanValidating(true);
    setFeynmanError(null);

    try {
      const res = await sidecarApi.srsFeynmanValidate(currentQuestion.note_id, feynmanExplanation);
      if (res.success) {
        toast.success("Cognitive Lock Unlocked! Memory weights updated.");
        const noteId = currentQuestion.note_id;

        setUnlockedNotes(prev => {
          const next = new Set(prev);
          next.add(noteId);
          return next;
        });

        // Update local FSRS card cache
        setSrsCardsCache(prev => {
          const c = prev[noteId];
          return {
            ...prev,
            [noteId]: {
              ...c,
              lapses: 0,
              stability: c ? c.stability * 1.5 : 1.5,
              last_review: new Date().toISOString()
            }
          };
        });

        setFeynmanExplanation('');
      } else {
        if (res.missing_keywords && res.missing_keywords.length > 0) {
          setFeynmanError(`Missing mandatory concepts: ${res.missing_keywords.join(', ')}`);
        } else if (res.error) {
          setFeynmanError(res.error);
        } else {
          setFeynmanError("Validation failed. Review your explanation structure.");
        }
      }
    } catch (e: any) {
      setFeynmanError(e.message || "FSRS validation request failed.");
    } finally {
      setIsFeynmanValidating(false);
    }
  }, [currentQuestion, feynmanExplanation]);

  const reset = useCallback(() => {
    setQuestions([]);
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setRevealedStates({});
    setScores({});
    setShowScore(false);
    setStreak(0);
    setBookmarked(new Set());
    setConfidenceWagers({});
    setKeywordChecks({});
    setUnlockedNotes(new Set());
    setFeynmanExplanation('');
    setFeynmanError(null);
    setGlobalTimeLeft(null);
    setQuestionTimeLeft(null);
    setRemediationHistory({});
    setFailureAttempts({});
    setMisconceptionText({});
    setRemediationQuestion({});
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }, []);

  // Timer runner Effect
  useEffect(() => {
    if (questions.length === 0 || showScore || isFeynmanLocked) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      // 1. Global Time limit check
      setGlobalTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          toast.error("Total session time expired!");
          setShowScore(true);
          return 0;
        }
        return prev - 1;
      });

      // 2. Per-Question Time limit check
      setQuestionTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          toast.warning("Question time expired! Marked as incorrect.");

          // Submit empty/incorrect answer if not revealed
          if (!isRevealed) {
            setScores(s => ({ ...s, [currentQuestion.id]: false }));
            setRevealedStates(r => ({ ...r, [currentQuestionIdx]: true }));
            setStreak(0);

            // Log telemetry performance
            const timeTakenMs = Date.now() - questionStartTimeRef.current;
            if (notePath) {
              sidecarApi.recordPerformance({
                note_path: notePath,
                was_correct: false,
                time_ms: timeTakenMs,
                question_type: currentQuestion.type,
                difficulty: String(currentQuestion.difficulty || '1'),
                question_id: String(currentQuestion.id)
              }).catch(console.error);
            }

            // Move to next question after display buffer
            if (autoAdvanceTimeoutRef.current) {
              clearTimeout(autoAdvanceTimeoutRef.current);
            }
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                nextQuestion(false);
              }
              autoAdvanceTimeoutRef.current = null;
            }, 1500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [questions.length, showScore, isFeynmanLocked, isRevealed, currentQuestion, currentQuestionIdx, notePath, nextQuestion]);

  return {
    questions,
    currentQuestionIdx,
    currentQuestion,
    userAnswers,
    revealedStates,
    scores,
    showScore,
    streak,
    bookmarked,
    confidenceWagers,
    keywordChecks,
    srsCardsCache,
    unlockedNotes,
    feynmanExplanation,
    feynmanError,
    isFeynmanValidating,
    isFeynmanLocked,
    isRevealed,
    globalTimeLeft,
    questionTimeLeft,
    questionHint,
    misconceptionText,
    remediationQuestion,
    retryActive,
    isSubmitting,
    sessionPath,

    startSession,
    selectAnswer,
    checkAnswer,
    selfGrade,
    nextQuestion,
    toggleBookmark,
    setConfidenceWager,
    setKeywordCheck,
    setFeynmanExplanation,
    submitFeynmanChallenge,
    reset,
    setShowScore,
    handleRetry,
    handleTakeRemediation
  };
}
