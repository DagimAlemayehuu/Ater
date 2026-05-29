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

export function usePracticeSession() {
  const { addPracticeResult, currentHub } = usePomodoroStore();

  // Active session parameters
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [notePath, setNotePath] = useState<string | undefined>(undefined);
  const [sessionPath, setSessionPath] = useState<string | null>(null);

  // Answering & grading state
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [revealedStates, setRevealedStates] = useState<Record<number, boolean>>({});
  const [scores, setScores] = useState<Record<number, boolean>>({});
  const [showScore, setShowScore] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [confidenceWagers, setConfidenceWagers] = useState<Record<number, number>>({});
  const [keywordChecks, setKeywordChecks] = useState<Record<string, boolean>>({});

  // Feynman cognitive lock state
  const [srsCardsCache, setSrsCardsCache] = useState<Record<string, any>>({});
  const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(new Set());
  const [feynmanExplanation, setFeynmanExplanation] = useState('');
  const [feynmanError, setFeynmanError] = useState<string | null>(null);
  const [isFeynmanValidating, setIsFeynmanValidating] = useState(false);

  // Timer states
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);
  
  // Timing references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Initialize and load session context
  const startSession = useCallback(async (
    questionsList: Question[],
    config: PracticeSessionConfig,
    notePathValue?: string,
    quizPathValue?: string | null
  ) => {
    setQuestions(questionsList);
    setCurrentQuestionIdx(0);
    setNotePath(notePathValue);
    setSessionPath(quizPathValue || null);
    
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
  const checkAnswer = useCallback(() => {
    if (!currentQuestion || isRevealed) return;
    const ans = userAnswers[currentQuestion.id];
    if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) return;

    let isCorrect = false;
    const userVal = String(ans).trim().toLowerCase();
    const correctVal = String(currentQuestion.answer).trim().toLowerCase();

    if (currentQuestion.type === 'true_false') {
      const userBool = userVal === 'true';
      const correctBool = typeof currentQuestion.answer === 'boolean' 
        ? currentQuestion.answer 
        : String(currentQuestion.answer).toLowerCase() === 'true';
      isCorrect = userBool === correctBool;
    } else if (currentQuestion.type === 'mcq') {
      isCorrect = userVal.toUpperCase() === String(currentQuestion.answer || '').trim().toUpperCase();
      if (currentQuestion.options && !isCorrect) {
        const correctText = String(currentQuestion.options[currentQuestion.answer as string] || '').trim().toLowerCase();
        isCorrect = userVal === correctText;
      }
    } else if (currentQuestion.type === 'fill_in') {
      const userAnswersArr = userAnswers[currentQuestion.id] || [];
      const rawAnswer = currentQuestion.answer || [];
      const correctAnswersArr = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer];
      isCorrect = correctAnswersArr.every((ansVal: string, idx: number) =>
        String(userAnswersArr[idx] || '').trim().toLowerCase() === String(ansVal || '').trim().toLowerCase()
      );
    } else if (currentQuestion.type === 'matching') {
      const userPairs = userAnswers[currentQuestion.id] || {};
      const correctPairs = currentQuestion.pairs || [];
      isCorrect = Array.isArray(correctPairs) && correctPairs.every((p: any) =>
        String(userPairs[p.left] || '').trim().toLowerCase() === String(p.right || '').trim().toLowerCase()
      );
    } else if (currentQuestion.type === 'order') {
      const userOrder = userAnswers[currentQuestion.id] || currentQuestion.steps || [];
      const correctOrder = currentQuestion.answer || [];
      isCorrect = Array.isArray(correctOrder) && correctOrder.every((step: string, idx: number) =>
        String(userOrder[idx] || '').trim().toLowerCase() === String(step).trim().toLowerCase()
      );
    }

    setScores(prev => ({ ...prev, [currentQuestion.id]: isCorrect }));
    setRevealedStates(prev => ({ ...prev, [currentQuestionIdx]: true }));
    setStreak(prev => isCorrect ? prev + 1 : 0);

    // Call logging endpoints
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
    }
  }, [currentQuestion, isRevealed, userAnswers, currentQuestionIdx, notePath, confidenceWagers]);

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
  }, [currentQuestion, currentQuestionIdx, questions.length, notePath, scores, addPracticeResult, currentHub, confidenceWagers]);

  const nextQuestion = useCallback(async (latestGrade?: boolean) => {
    if (!currentQuestion) return;
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
            setTimeout(() => {
              nextQuestion(false);
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
    setShowScore
  };
}
