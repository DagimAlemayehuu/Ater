'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Loader2, Volume2, VolumeX, ShieldAlert, ArrowRight, Mic, BookOpen, Radio, Sparkles } from 'lucide-react';
import { stopNeuralAudio } from '@/lib/voice/ttsClient';
import type { FeynmanEvaluation, GateQuestionTurn, RoadmapLesson } from '@/types';
import { generateFallbackGateQuestions, detectTabooWordViolations } from '@/lib/ai/gate';
import { translations, type AppLanguage } from '@/lib/i18n/translations';
import { saveGateSessionToStore, updateLessonMasteryInStore } from '@/lib/sync/store';
import { useVoiceBridge } from '@/components/voice/VoxideProvider';

interface FeynmanModalProps {
  isOpen: boolean;
  concept: string;
  onClose: () => void;
  onEvaluate: (concept: string, explanation: string) => Promise<FeynmanEvaluation>;
  onOpenRemediation?: () => void;
  onContinueNextLesson?: () => void;
  onRemediationCreated?: (remediationLesson: RoadmapLesson, updatedLessons: RoadmapLesson[]) => void;
  language?: AppLanguage;
  lessonId?: string;
  courseId?: string;
  lessons?: RoadmapLesson[];
  tabooWords?: string[];
}

export const FeynmanModal: React.FC<FeynmanModalProps> = ({
  isOpen,
  concept,
  onClose,
  onEvaluate,
  onOpenRemediation,
  onContinueNextLesson,
  onRemediationCreated,
  language = 'en',
  lessonId,
  courseId,
  lessons,
  tabooWords = [],
}) => {
  const t = translations[language] || translations.en;
  const isAmharic = language === 'am';
  const defaultVoice = isAmharic ? 'am-ET-MekdesNeural' : 'en-US-JennyNeural';

  const [baseQuestions, setBaseQuestions] = useState<GateQuestionTurn[]>([]);
  const [currentBaseIndex, setCurrentBaseIndex] = useState<number>(0);
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [activeTurn, setActiveTurn] = useState<GateQuestionTurn | null>(null);
  const [completedTurns, setCompletedTurns] = useState<GateQuestionTurn[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const voxide = useVoiceBridge();
  const [voiceTextInput, setVoiceTextInput] = useState<string>('');

  const [explanation, setExplanation] = useState<string>('');
  const [isLoadingBattery, setIsLoadingBattery] = useState<boolean>(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState<boolean>(false);
  const [lastTurnFeedback, setLastTurnFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [violatedWords, setViolatedWords] = useState<string[]>([]);

  const [modalStage, setModalStage] = useState<'question' | 'mini_lesson'>('question');
  const [activeMiniLessonText, setActiveMiniLessonText] = useState<string>('');
  const [miniLessonAskInput, setMiniLessonAskInput] = useState<string>('');
  const [miniLessonMessages, setMiniLessonMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isAskingMiniLesson, setIsAskingMiniLesson] = useState<boolean>(false);
  const [lastExchange, setLastExchange] = useState<{ user?: string; assistant?: string }>({});

  const currentTurn = activeTurn || baseQuestions[currentBaseIndex];

  // Track single exchange pair: latest user speech and latest assistant response
  useEffect(() => {
    if (voxide.turns.length === 0) return;
    const lastTurn = voxide.turns[voxide.turns.length - 1];
    if (lastTurn.role === 'user') {
      setLastExchange((prev) => ({ ...prev, user: lastTurn.text }));
    } else if (lastTurn.role === 'assistant') {
      setLastExchange((prev) => ({ ...prev, assistant: lastTurn.text }));
    }
  }, [voxide.turns]);

  useEffect(() => {
    if (voxide.liveSpeech) {
      setLastExchange((prev) => ({ ...prev, user: voxide.liveSpeech }));
    }
  }, [voxide.liveSpeech]);

  // Kill Edge TTS immediately when entering Voice Mode or opening Defense in Voice Mode
  useEffect(() => {
    if (isOpen && voxide.mode === 'voice') {
      stopNeuralAudio();
    }
  }, [isOpen, voxide.mode]);

  // Socratic Gemini Live connection lifecycle with active question context
  const tabooKey = (tabooWords || []).join(',');
  useEffect(() => {
    if (!isOpen || !concept || voxide.mode !== 'voice' || !currentTurn?.question) return;

    voxide.connect({
      topic: concept,
      tabooWords,
      language: language as 'en' | 'am',
      courseId,
      lessonId,
      question: currentTurn.question,
      questionNum: currentBaseIndex + 1,
      totalQuestions: baseQuestions.length || 3,
      stage: modalStage,
      miniLesson: activeMiniLessonText,
    });
  }, [isOpen, concept, language, courseId, lessonId, tabooKey, voxide.mode, currentTurn?.question]);

  useEffect(() => {
    if (voxide.mode !== 'voice') {
      voxide.disconnect();
    }
  }, [voxide.mode]);

  // Dynamically push question & stage changes to active live Gemini session
  useEffect(() => {
    if (!isOpen || !voxide.isConnected) return;
    voxide.updateContext({
      topic: concept,
      tabooWords,
      language: language as 'en' | 'am',
      question: currentTurn?.question,
      questionNum: currentBaseIndex + 1,
      totalQuestions: baseQuestions.length || 3,
      stage: modalStage,
      miniLesson: activeMiniLessonText,
    });
  }, [isOpen, voxide.isConnected, currentTurn?.question, currentBaseIndex, modalStage, activeMiniLessonText, tabooKey]);

  // Register Gemini Live tools (gradeExplanation, triggerMiniLesson, advanceQuestion)
  useEffect(() => {
    voxide.registerTool('gradeExplanation', async (args: { score: number; feedback: string }) => {
      const score = Number(args.score) || 0;
      const feedback = args.feedback || '';
      const passed = score >= 80;

      if (courseId && lessonId) {
        try {
          await updateLessonMasteryInStore(courseId, lessonId, score, feedback);
        } catch (err) {
          console.warn('Failed to update store mastery in gradeExplanation:', err);
        }
      }

      setFinalResult({
        passed,
        overallScore: Math.round(score > 10 ? score / 10 : score),
        summaryFeedback: feedback,
        misconceptions: passed ? [] : ['Review taboo constraints and causal boundary conditions'],
      });

      const doneStatus = passed
        ? (isAmharic ? 'የቃል ምዘና ተጠናቋል · አልፈዋል' : 'Defense Mastered · Passed')
        : (isAmharic ? 'የማካካሻ ትምህርት ያስፈልጋል' : 'Remediation Loop Activated');
      setStatusMessage(doneStatus);

      return { success: true, recordedScore: score, passed };
    });

    voxide.registerTool('triggerMiniLesson', async (args: { reason?: string; miniLessonContent?: string }) => {
      const lessonText = args.miniLessonContent || currentTurn?.miniLesson || (
        isAmharic
          ? `ስለ ${concept} ዋናውን መርህ እንመልከት፡ እያንዳንዱን የአሰራር ሂደት በቅደም ተከተል ያስረዱ።`
          : `Let us examine the foundational mechanism of ${concept}. Step through the causality in plain terms.`
      );
      setActiveMiniLessonText(lessonText);
      setModalStage('mini_lesson');
      setMiniLessonMessages([]);
      setMiniLessonAskInput('');
      const miniStatus = isAmharic
        ? `ጥያቄ ${currentBaseIndex + 1} · አጭር ትምህርት`
        : `Question ${currentBaseIndex + 1} of 3 · Mini-Lesson`;
      setStatusMessage(miniStatus);
      voxide.updateContext({ stage: 'mini_lesson', miniLesson: lessonText });
      return { success: true, activated: true, stage: 'mini_lesson' };
    });

    voxide.registerTool('advanceQuestion', async (args: { nextQuestionIndex?: number }) => {
      if (currentBaseIndex + 1 < baseQuestions.length) {
        const nextIdx = currentBaseIndex + 1;
        const nextQ = baseQuestions[nextIdx];
        setCurrentBaseIndex(nextIdx);
        setAttemptNumber(1);
        setActiveTurn(nextQ);
        setExplanation('');
        setViolatedWords([]);
        setModalStage('question');
        setActiveMiniLessonText('');
        const nextStatus = isAmharic ? `ጥያቄ ${nextIdx + 1} / 3` : `Question ${nextIdx + 1} of 3`;
        setStatusMessage(nextStatus);
        voxide.updateContext({
          question: nextQ?.question,
          questionNum: nextIdx + 1,
          totalQuestions: baseQuestions.length,
          stage: 'question',
          miniLesson: '',
        });
        return { success: true, nextQuestionIndex: nextIdx, question: nextQ?.question };
      }
      return { success: true, message: 'All questions completed' };
    });
  }, [courseId, lessonId, isAmharic, concept, currentTurn, currentBaseIndex, baseQuestions]);

  // Oral detection of student uncertainty ("I don't know", "can you explain", etc.)
  useEffect(() => {
    if (voxide.turns.length === 0) return;
    const latest = voxide.turns[voxide.turns.length - 1];
    if (latest.role === 'user') {
      const text = latest.text.toLowerCase().trim();
      const isUncertain = /\b(i\s+don'?t\s+know|no\s+idea|not\s+sure|can\s+you\s+explain|explain\s+it|help\s+me|teach\s+me|what\s+is\s+it|what\s+does\s+that\s+mean|i\s+need\s+you\s+to\s+explain)\b/i.test(text);
      if (isUncertain && modalStage !== 'mini_lesson') {
        const lessonText = currentTurn?.miniLesson || (
          isAmharic
            ? `ስለ ${concept} ዋናውን መርህ እንመልከት፡ እያንዳንዱን የአሰራር ሂደት በቅደም ተከተል ያስረዱ።`
            : `Let us examine the foundational mechanism of ${concept}. Step through the causality in plain terms.`
        );
        setActiveMiniLessonText(lessonText);
        setModalStage('mini_lesson');
        setMiniLessonMessages([]);
        setMiniLessonAskInput('');
        setStatusMessage(isAmharic ? `ጥያቄ ${currentBaseIndex + 1} · አጭር ትምህርት` : `Question ${currentBaseIndex + 1} of 3 · Mini-Lesson`);
        voxide.updateContext({
          stage: 'mini_lesson',
          miniLesson: lessonText,
        });
      }
    }
  }, [voxide.turns, modalStage, currentTurn, concept, currentBaseIndex, isAmharic]);

  // Live evaluation of taboo buzzwords inside explanation or live speech
  const liveViolated = detectTabooWordViolations(`${explanation} ${voxide.liveSpeech || ''}`, tabooWords);
  const activeViolations = Array.from(new Set([...liveViolated, ...violatedWords]));



  const [finalResult, setFinalResult] = useState<{
    passed: boolean;
    overallScore: number;
    summaryFeedback: string;
    misconceptions: string[];
    remediationTopic?: string;
  } | null>(null);


  // Initialize battery of 3 open-ended questions upon opening
  useEffect(() => {
    if (!isOpen || !concept) return;
    let isMounted = true;

    // Reset view state cleanly
    setModalStage('question');
    setActiveMiniLessonText('');
    setMiniLessonAskInput('');
    setMiniLessonMessages([]);
    setIsAskingMiniLesson(false);
    setCurrentBaseIndex(0);
    setAttemptNumber(1);
    setCompletedTurns([]);
    setExplanation('');
    setLastTurnFeedback(null);
    setViolatedWords([]);
    setFinalResult(null);
    const fallbackQuestions = generateFallbackGateQuestions(concept, language);

    const initialStatus = isAmharic
      ? `ጥያቄ 1 / 3`
      : `Question 1 of 3`;
    setStatusMessage(initialStatus);

    // Instant optimistic render: zero delay, zero blocking spinner
    setBaseQuestions(fallbackQuestions);
    setActiveTurn(fallbackQuestions[0]);
    setIsLoadingBattery(false);
    stopNeuralAudio();

    // Background fetch for AI-tuned bespoke questions without blocking UI
    fetch('/api/ai/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', lessonTitle: concept, language }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data?.questions) && data.questions.length >= 3) {
          // Only update if user hasn't typed an answer yet
          setExplanation((prev) => {
            if (!prev) {
              setBaseQuestions(data.questions);
              setActiveTurn((curr) => (curr?.id === 'turn-1' ? data.questions[0] : curr));
            }
            return prev;
          });
        }
      })
      .catch((_err) => {
        // Fallback already active
      });

    return () => {
      isMounted = false;
      stopNeuralAudio();
    };
  }, [isOpen, concept, language, defaultVoice, isAmharic]);

  useEffect(() => {
    if (!isOpen) {
      stopNeuralAudio();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMiniLessonQuestionAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = miniLessonAskInput.trim();
    if (!query || isAskingMiniLesson) return;

    setIsAskingMiniLesson(true);
    setMiniLessonAskInput('');
    setMiniLessonMessages((prev) => [...prev, { role: 'user', text: query }]);
    stopNeuralAudio();

    try {
      const history = miniLessonMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await fetch('/api/voice/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Question about mini-lesson on "${concept}": ${query}\nMini-lesson context: ${activeMiniLessonText}`,
          activeNoteTitle: concept,
          language,
          history,
        }),
      });

      let answer = isAmharic
        ? 'ዋናውን የአሰራር ሂደት በጥንቃቄ እንመልከት።'
        : 'Here is the key causal principle behind this concept.';

      if (res.ok) {
        const data = await res.json();
        if (data.spokenResponse) {
          answer = data.spokenResponse;
        }
      }

      setMiniLessonMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch {
      const fallbackAns = isAmharic
        ? 'ዋናውን መርህ አስታውሱ፡ ስርአቱ እንዳይዛባ አብላጫ ድምፅ ያስፈልጋል።'
        : 'Remember the core invariant: a strict majority is required to prevent state conflict.';
      setMiniLessonMessages((prev) => [...prev, { role: 'assistant', text: fallbackAns }]);
    } finally {
      setIsAskingMiniLesson(false);
    }
  };

  const advanceToFollowUp = () => {
    stopNeuralAudio();
    setModalStage('question');
    const probeStatus = isAmharic
      ? `ጥያቄ ${currentBaseIndex + 1} / 3 · ተከታይ ጥያቄ`
      : `Question ${currentBaseIndex + 1} of 3 · Follow-Up Question`;
    setStatusMessage(probeStatus);
    voxide.updateContext({
      stage: 'question',
      miniLesson: '',
      question: activeTurn?.question || currentTurn?.question,
    });
  };

  const handleTurnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const answerText = explanation.trim();
    if (!answerText || isSubmittingTurn || !currentTurn) return;

    setIsSubmittingTurn(true);
    setLastTurnFeedback(null);
    stopNeuralAudio();

    try {
      if (onEvaluate) {
        try {
          const evalPromise = onEvaluate(concept, answerText);
          if (evalPromise && typeof evalPromise.catch === 'function') {
            evalPromise.catch(() => {});
          }
        } catch {
          // Safe
        }
      }

      const res = await fetch('/api/ai/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_turn',
          lessonTitle: concept,
          currentTurn,
          studentAnswer: answerText,
          attemptNumber,
          language,
          tabooWords,
        }),
      });

      const evalData = await res.json();
      const score = Number(evalData.score) || 5;
      const tier = evalData.tier;
      const feedback = evalData.feedback || (isAmharic ? 'ግንዛቤ ተመዝግቧል።' : 'Answer evaluated.');

      if (evalData.violatedTabooWords && evalData.violatedTabooWords.length > 0) {
        setViolatedWords(evalData.violatedTabooWords);
      } else {
        setViolatedWords([]);
      }

      setLastTurnFeedback({ score, feedback });

      // Socratic Loop: If needs follow-up, update turn and stay on this base question
      if (evalData.needsFollowUp && evalData.followUpTurn) {
        const followUp = evalData.followUpTurn;
        setActiveTurn(followUp);
        setAttemptNumber((prev) => prev + 1);
        setExplanation('');

        const isMiniLessonTier = tier === 'mini_lesson' || (followUp.miniLesson && evalData.score < 5);

        if (isMiniLessonTier && (followUp.miniLesson || evalData.miniLesson)) {
          const lessonContent = followUp.miniLesson || evalData.miniLesson || '';
          setActiveMiniLessonText(lessonContent);
          setModalStage('mini_lesson');
          setMiniLessonMessages([]);
          setMiniLessonAskInput('');

          const miniLessonStatus = isAmharic
            ? `ጥያቄ ${currentBaseIndex + 1} / 3 · አጭር ትምህርት`
            : `Question ${currentBaseIndex + 1} of 3 · Mini-Lesson`;
          setStatusMessage(miniLessonStatus);
        } else {
          setModalStage('question');
          const probeStatus = isAmharic
            ? `ጥያቄ ${currentBaseIndex + 1} / 3 · ተከታይ ጥያቄ`
            : `Question ${currentBaseIndex + 1} of 3 · Follow-Up Question`;
          setStatusMessage(probeStatus);
        }
      } else {
        // Mastered or max attempts reached

        // If after 3 attempts the score is still < 8, dynamically trigger micro-remediation
        if (attemptNumber >= 3 && score < 8) {
          try {
            const remRes = await fetch('/api/curriculum/remediate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                courseId: courseId || 'course-default',
                failedLessonId: lessonId || `lesson-${concept.toLowerCase().replace(/\s+/g, '-')}`,
                misconceptions: evalData.misconceptions?.length
                  ? evalData.misconceptions
                  : [feedback],
                learnerExplanation: answerText,
                failedLesson: {
                  id: lessonId || `lesson-${concept.toLowerCase().replace(/\s+/g, '-')}`,
                  order: 1,
                  title: concept,
                  slug: concept.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  summary: `Targeted remediation for ${concept}`,
                  status: 'remediation',
                  estimatedMinutes: 5,
                  prerequisites: [],
                  isRemediation: false,
                },
                lessons,
              }),
            });

            if (remRes.ok) {
              const remData = await remRes.json();
              if (onRemediationCreated && remData.remediationLesson) {
                onRemediationCreated(remData.remediationLesson, remData.updatedLessons);
              }
            }
          } catch (remErr) {
            console.error('Failed to trigger micro-remediation:', remErr);
          }
        }

        // Record turn and advance to next question
        const updatedTurn: GateQuestionTurn = {
          ...currentTurn,
          studentAnswer: answerText,
          score,
          tier,
          miniLesson: evalData.miniLesson,
          feedback,
          misconceptions: evalData.misconceptions || [],
        };

        const nextCompleted = [...completedTurns, updatedTurn];
        setCompletedTurns(nextCompleted);

        if (currentBaseIndex + 1 < baseQuestions.length) {
          const nextIdx = currentBaseIndex + 1;
          const nextQ = baseQuestions[nextIdx];
          setCurrentBaseIndex(nextIdx);
          setAttemptNumber(1);
          setActiveTurn(nextQ);
          setExplanation('');
          setViolatedWords([]);

          const nextStatus = isAmharic
            ? `ጥያቄ ${nextIdx + 1} / 3`
            : `Question ${nextIdx + 1} of 3`;
          setStatusMessage(nextStatus);
        } else {
          // All 3 base questions complete: finalize session
          const finalRes = await fetch('/api/ai/gate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'finalize',
              turns: nextCompleted,
              lessonTitle: concept,
              language,
            }),
          });

          const finalData = await finalRes.json();
          setFinalResult(finalData);

          // If defense failed, dynamically call remediation to splice into roadmap DAG
          if (!finalData.passed) {
            try {
              const remRes = await fetch('/api/curriculum/remediate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  courseId: courseId || 'course-default',
                  failedLessonId: lessonId || `lesson-${concept.toLowerCase().replace(/\s+/g, '-')}`,
                  misconceptions: finalData.misconceptions?.length
                    ? finalData.misconceptions
                    : ['Operational mechanics and boundary failure modes'],
                  learnerExplanation: answerText,
                  failedLesson: {
                    id: lessonId || `lesson-${concept.toLowerCase().replace(/\s+/g, '-')}`,
                    order: 1,
                    title: concept,
                    slug: concept.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    summary: `Targeted remediation for ${concept}`,
                    status: 'remediation',
                    estimatedMinutes: 5,
                    prerequisites: [],
                    isRemediation: false,
                  },
                  lessons,
                }),
              });

              if (remRes.ok) {
                const remData = await remRes.json();
                if (remData.remediationLesson?.title) {
                  setFinalResult((prev) =>
                    prev ? { ...prev, remediationTopic: remData.remediationLesson.title } : prev
                  );
                }
                if (onRemediationCreated && remData.remediationLesson) {
                  onRemediationCreated(remData.remediationLesson, remData.updatedLessons);
                }
              }
            } catch (remErr) {
              console.error('Failed to trigger micro-remediation on finalize:', remErr);
            }
          }

          // Persist Socratic Gate session transcript to store / Supabase
          if (lessonId || concept) {
            saveGateSessionToStore({
              lessonId: lessonId || `lesson-${concept.toLowerCase().replace(/\s+/g, '-')}`,
              lessonTitle: concept,
              turns: nextCompleted,
              finalScore: finalData.overallScore,
              passed: finalData.passed,
              summaryFeedback: finalData.summaryFeedback,
              status: finalData.passed ? 'passed' : 'failed',
            }).catch(() => {});
          }

          const doneStatus = isAmharic ? 'የቃል ምዘና ተጠናቋል' : 'Defense Session Concluded';
          setStatusMessage(doneStatus);

          // Trigger page-level evaluation with aggregated defense text
          const aggregatedText = nextCompleted.map((t) => `Q: ${t.question}\nA: ${t.studentAnswer}`).join('\n\n');
          await onEvaluate(concept, aggregatedText);
        }
      }
    } catch {
      // Graceful error fallback
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const renderVoiceDock = () => {
    const hasUserContent = voxide.isListening || voxide.isProcessing || voxide.liveSpeech || lastExchange.user;
    const hasExaminerContent = voxide.currentAssistantText || lastExchange.assistant;
    const isIdle = !hasUserContent && !hasExaminerContent;

    return (
      <div className="space-y-4">
        {/* Voice Status & Single Exchange Card (Strictly Monochrome) */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 shadow-xs space-y-4">
          {/* Single Exchange Display (Strictly ONE user utterance and ONE examiner utterance) */}
          <div className="min-h-[80px] flex flex-col justify-center space-y-3">
            {/* User Card: Active Speech or Last User Utterance */}
            {hasUserContent ? (
              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 inline-block" />
                    {voxide.isListening
                      ? (isAmharic ? 'የእርስዎ ድምፅ (በመናገር ላይ)' : 'YOU (SPEAKING)')
                      : (isAmharic ? 'እርስዎ' : 'YOU')}
                  </span>
                  {voxide.isProcessing && (
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" />
                      {isAmharic ? 'በመተንተን ላይ...' : 'Evaluating...'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed">
                  "{voxide.liveSpeech || lastExchange.user || (voxide.isListening ? (isAmharic ? 'እያዳመጠ ነው...' : 'Listening...') : '')}"
                </p>
              </div>
            ) : null}

            {/* Examiner Card: Streaming Response or Last Examiner Response */}
            {hasExaminerContent ? (
              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 inline-block" />
                  {voxide.isSpeaking
                    ? (isAmharic ? 'የሶቅራጥስ ፈታኝ (በመመለስ ላይ)' : 'SOCRATIC EXAMINER (RESPONDING)')
                    : (isAmharic ? 'የሶቅራጥስ ፈታኝ' : 'SOCRATIC EXAMINER')}
                </span>
                <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed">
                  {voxide.currentAssistantText || lastExchange.assistant}
                </p>
              </div>
            ) : null}

            {isIdle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center font-mono py-4">
                {isAmharic
                  ? 'የስፔስ ቁልፍን ተጭነው ይናገሩ ወይም ከታች ያለውን ኦርብ ይጫኑ'
                  : 'Hold Spacebar or press the orb below to defend your understanding'}
              </p>
            )}
          </div>

          {/* Socratic Voice Orb with Live RMS Pulse (Strictly Monochrome) */}
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <button
              type="button"
              onMouseDown={() => voxide.startTalking()}
              onMouseUp={() => voxide.stopTalking()}
              onMouseLeave={() => voxide.isListening && voxide.stopTalking()}
              onTouchStart={() => voxide.startTalking()}
              onTouchEnd={() => voxide.stopTalking()}
              className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none shadow-md ${
                voxide.isListening
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 ring-4 ring-zinc-400 scale-105'
                  : voxide.isSpeaking
                  ? 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 ring-4 ring-zinc-600'
                  : voxide.isProcessing
                  ? 'bg-zinc-800 text-zinc-300 ring-4 ring-zinc-700'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 ring-4 ring-zinc-300 dark:ring-zinc-800'
              }`}
              title="Hold to speak to Socratic Examiner"
            >
              {voxide.isProcessing ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Mic size={24} className={voxide.isListening ? 'animate-bounce' : ''} />
              )}
              <span className="font-mono text-[9px] uppercase tracking-wider mt-1 font-semibold">
                {voxide.isListening ? 'Rec' : voxide.isSpeaking ? 'Live' : 'Hold'}
              </span>
            </button>

            {/* RMS Waveform Meter (Strictly Monochrome) */}
            <div className="flex items-center gap-1 h-5 pt-1">
              {[0.25, 0.6, 1.0, 0.7, 0.35].map((factor, i) => {
                const h = voxide.isListening
                  ? Math.max(4, Math.round((voxide.audioRms * factor + 0.15) * 20))
                  : voxide.isSpeaking
                  ? Math.max(4, Math.round((Math.sin(Date.now() / 200 + i) * 0.4 + 0.5) * 14))
                  : 3;
                return (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      voxide.isListening || voxide.isSpeaking
                        ? 'bg-zinc-900 dark:bg-zinc-100'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  />
                );
              })}
            </div>

            <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              {voxide.isListening
                ? (isAmharic ? 'እያዳመጠ ነው... (ለማጠናቀቅ ይልቀቁ)' : 'Listening... (Release to evaluate)')
                : voxide.isSpeaking
                ? (isAmharic ? 'የሶቅራጥስ ፈታኝ እየተናገረ ነው...' : 'Examiner is speaking...')
                : voxide.isProcessing
                ? (isAmharic ? 'በመተንተን ላይ...' : 'Processing explanation...')
                : (isAmharic ? 'የስፔስ ቁልፍን ተጭነው ያውሩ' : 'Hold Spacebar to Speak')}
            </span>
          </div>
        </div>

        {/* Quick-text fallback input in Voice Mode (Strictly Monochrome) */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!voiceTextInput.trim()) return;
            const text = voiceTextInput.trim();
            setVoiceTextInput('');
            setLastExchange((prev) => ({ ...prev, user: text }));
            const isUncertain = /\b(i\s+don'?t\s+know|no\s+idea|not\s+sure|can\s+you\s+explain|explain\s+it|help\s+me|teach\s+me|what\s+is\s+it|what\s+does\s+that\s+mean|i\s+need\s+you\s+to\s+explain)\b/i.test(text);
            if (isUncertain && modalStage !== 'mini_lesson') {
              const lessonText = currentTurn?.miniLesson || (
                isAmharic
                  ? `ስለ ${concept} ዋናውን መርህ እንመልከት፡ እያንዳንዱን የአሰራር ሂደት በቅደም ተከተል ያስረዱ።`
                  : `Let us examine the foundational mechanism of ${concept}. Step through the causality in plain terms.`
              );
              setActiveMiniLessonText(lessonText);
              setModalStage('mini_lesson');
              setStatusMessage(isAmharic ? `ጥያቄ ${currentBaseIndex + 1} · አጭር ትምህርት` : `Question ${currentBaseIndex + 1} of 3 · Mini-Lesson`);
              voxide.updateContext({ stage: 'mini_lesson', miniLesson: lessonText });
            }
            await voxide.sendText(text);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={voiceTextInput}
            onChange={(e) => setVoiceTextInput(e.target.value)}
            placeholder={
              isAmharic
                ? 'ወይም እዚህ ጽፈው ይላኩ...'
                : 'Or type your argument directly in voice mode...'
            }
            className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={!voiceTextInput.trim()}
            className="px-3.5 py-2 text-xs font-medium rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 disabled:opacity-40 transition-colors"
          >
            {isAmharic ? 'ላክ' : 'Send'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fbf7f0] dark:bg-zinc-950 font-sans overflow-hidden">
      {/* Top Navigation Bar with Defense Title, Mode Switcher, Mute Toggle, Progress, and Exit */}
      <header className="border-b border-parchment-300/80 dark:border-zinc-800 px-6 py-3.5 flex items-center justify-between shrink-0 bg-[#fbf7f0] dark:bg-zinc-950 z-10">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isAmharic ? 'የቃል መከላከያ' : 'Defense'}
          </h2>

          {/* Mode Switcher: Library Mode vs Voice Mode */}
          <div className="flex items-center rounded-lg border border-parchment-300 dark:border-zinc-800 p-0.5 bg-parchment-200/70 dark:bg-zinc-900 text-xs">
            <button
              type="button"
              onClick={() => voxide.setMode('library')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                voxide.mode === 'library'
                  ? 'bg-parchment-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              title="Library Mode: Silent text input"
            >
              <BookOpen size={13} />
              <span>{isAmharic ? 'ቤተ-መጽሐፍት' : 'Library Mode'}</span>
            </button>
            <button
              type="button"
              onClick={() => voxide.setMode('voice')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                voxide.mode === 'voice'
                  ? 'bg-parchment-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              title="Voice Mode: Hands-free hold-to-talk speech"
            >
              <Mic size={13} />
              <span>{isAmharic ? 'ድምፅ' : 'Voice Mode'}</span>
              {voxide.isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              )}
            </button>
          </div>

          {/* Speaker Audio Mute Toggle (Voice Mode Only) */}
          {voxide.mode === 'voice' && (
            <button
              type="button"
              onClick={voxide.toggleMute}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-parchment-300 dark:border-zinc-800 bg-parchment-200/50 hover:bg-parchment-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer shadow-xs transition-colors"
              title={voxide.isMuted ? 'Unmute AI Audio' : 'Mute AI Audio'}
            >
              {voxide.isMuted ? (
                <VolumeX size={13} className="text-zinc-400" />
              ) : (
                <Volume2 size={13} className="text-zinc-800 dark:text-zinc-200" />
              )}
              <span className="font-mono text-[11px] hidden sm:inline">
                {voxide.isMuted ? (isAmharic ? 'ዝም' : 'Speaker: Muted') : (isAmharic ? 'ድምፅ' : 'Speaker: On')}
              </span>
            </button>
          )}

          {/* 3 Progress Bars without 'Question X of 3' text */}
          {!finalResult && (
            <div className="hidden sm:flex items-center gap-2 pl-2">
              {[0, 1, 2].map((idx) => {
                const isDone = idx < currentBaseIndex;
                const isCurrent = idx === currentBaseIndex;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 w-8 rounded-full transition-all ${
                      isDone
                        ? 'bg-zinc-900 dark:bg-zinc-100'
                        : isCurrent
                        ? 'bg-parchment-500 dark:bg-zinc-400'
                        : 'bg-parchment-300 dark:bg-zinc-800'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            stopNeuralAudio();
            onClose();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-parchment-300 dark:border-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          aria-label="Exit Defense"
        >
          <X size={14} />
          <span>{isAmharic ? 'ውጣ' : 'Exit'}</span>
        </button>
      </header>

      {/* Main Centered Content Canvas */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-6">

        {/* Loading State */}
        {isLoadingBattery && (
          <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {isAmharic ? 'የቃል ጥያቄዎችን በማዘጋጀት ላይ...' : 'Preparing defense questions...'}
            </span>
          </div>
        )}

        {/* Final Verdict Screen */}
        {!isLoadingBattery && finalResult && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-5 rounded-xl border border-parchment-300 dark:border-zinc-800 bg-parchment-100/80 dark:bg-zinc-900/60">
              <div className="flex items-start gap-3">
                {finalResult.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-zinc-800 dark:text-zinc-200 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-zinc-800 dark:text-zinc-200 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {finalResult.passed
                        ? (isAmharic ? 'ማስተሪ ተረጋግጧል' : 'Mastery Confirmed · Defense Passed')
                        : (isAmharic ? 'የማካካሻ ትምህርት ያስፈልጋል' : 'Remediation Loop Activated')}
                    </h3>
                    <span className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                      {finalResult.overallScore} / 10
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1">
                    {finalResult.summaryFeedback}
                  </p>
                </div>
              </div>

              {!finalResult.passed && finalResult.remediationTopic && (
                <div className="mt-3 pt-3 border-t border-parchment-300 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-sans">
                  <span className="font-semibold">{isAmharic ? 'የተጨመረ የማካካሻ ትምህርት፡' : 'Added Mini-Lesson:'}</span>{' '}
                  {finalResult.remediationTopic}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  stopNeuralAudio();
                  if (finalResult.passed) {
                    if (onContinueNextLesson) onContinueNextLesson();
                    else onClose();
                  } else {
                    if (onOpenRemediation) onOpenRemediation();
                    else onClose();
                  }
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-parchment-400 dark:border-zinc-700 transition-colors cursor-pointer shadow-xs"
              >
                {finalResult.passed
                  ? (isAmharic ? 'ቀጣዩን ትምህርት ክፈት' : 'Continue to Next Lesson')
                  : (isAmharic ? 'የማካካሻ ትምህርቱን ጀምር' : 'Open Mini-Lesson')}
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Mini-Lesson View (Stage: 'mini_lesson') */}
        {!isLoadingBattery && !finalResult && modalStage === 'mini_lesson' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold">
                {isAmharic ? `ጥያቄ ${currentBaseIndex + 1} · አጭር ትምህርት` : `Question ${currentBaseIndex + 1} · Mini-Lesson`}
              </span>
            </div>

            {/* Detailed Mini-Lesson Content Card */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/60 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
                {isAmharic ? 'ፅንሰ-ሀሳብ እና ማብራሪያ' : 'Core Concept & Mechanism'}
              </h3>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                {activeMiniLessonText}
              </p>
            </div>

            {/* Voice Mode Dock or Library Mode Question-Asking Thread */}
            {voxide.mode === 'voice' ? (
              renderVoiceDock()
            ) : (
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
                  {isAmharic ? 'ጥያቄ አለዎት? አስተማሪውን ይጠይቁ፡' : 'Have questions? Ask the teacher:'}
                </div>

                {miniLessonMessages.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-2 p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                    {miniLessonMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ml-4 border border-zinc-200 dark:border-zinc-700'
                            : 'bg-zinc-200/60 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 mr-4'
                        }`}
                      >
                        <div className="text-[10px] font-mono opacity-60 mb-0.5">
                          {msg.role === 'user' ? (isAmharic ? 'እርስዎ' : 'You') : (isAmharic ? 'አስተማሪ' : 'Teacher')}
                        </div>
                        <p className="leading-snug">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleMiniLessonQuestionAsk} className="flex gap-2">
                  <input
                    type="text"
                    value={miniLessonAskInput}
                    onChange={(e) => setMiniLessonAskInput(e.target.value)}
                    disabled={isAskingMiniLesson}
                    placeholder={
                      isAmharic
                        ? 'ስለዚህ አጭር ትምህርት ጥያቄ ይጠይቁ...'
                        : 'Ask a question about this mini-lesson...'
                    }
                    className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={!miniLessonAskInput.trim() || isAskingMiniLesson}
                    className="px-3 py-2 text-xs font-medium rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    {isAskingMiniLesson ? <Loader2 size={12} className="animate-spin" /> : (isAmharic ? 'ጠይቅ' : 'Ask')}
                  </button>
                </form>
              </div>
            )}

            {/* Prominent CTA to continue to follow-up question */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isAmharic ? 'ፅንሰ-ሀሳቡን ከተረዱ በኋላ ተከታዩን ጥያቄ ይመልሱ።' : 'Ready? Answer the follow-up question to proceed.'}
              </span>
              <button
                type="button"
                onClick={advanceToFollowUp}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors cursor-pointer shadow-xs"
              >
                <span>{isAmharic ? 'ወደ ተከታይ ጥያቄ እለፍ' : 'Continue to Follow-Up Question'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Active Question & Input Screen (Stage: 'question') */}
        {!isLoadingBattery && !finalResult && modalStage === 'question' && currentTurn && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Clear Indicator when answering a follow-up probe */}
            {currentTurn.isFollowUp && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                <span className="text-[11px] font-mono font-medium text-zinc-800 dark:text-zinc-200">
                  {isAmharic
                    ? `ጥያቄ ${currentBaseIndex + 1} · ተከታይ ጥያቄ`
                    : `Follow-Up for Question ${currentBaseIndex + 1}`}
                </span>
                {activeMiniLessonText && (
                  <button
                    type="button"
                    onClick={() => {
                      stopNeuralAudio();
                      setModalStage('mini_lesson');
                    }}
                    className="text-[11px] font-mono underline text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {isAmharic ? 'አጭር ትምህርቱን እንደገና አንብብ' : 'Review Mini-Lesson'}
                  </button>
                )}
              </div>
            )}

            {/* Last Feedback Banner if transitioning */}
            {lastTurnFeedback && !currentTurn.isFollowUp && (
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-between gap-2 font-mono">
                <span className="leading-snug">{lastTurnFeedback.feedback}</span>
                <span className="font-mono text-[11px] font-medium shrink-0">
                  {lastTurnFeedback.score}/10
                </span>
              </div>
            )}

            {/* Question Card */}
            <div className="p-4 bg-parchment-100/90 dark:bg-zinc-900/80 border border-parchment-300 dark:border-zinc-800/80 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  {currentTurn.question}
                </p>
              </div>
            </div>

            {/* Forbidden Taboo Words Badges */}
            {tabooWords && tabooWords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-parchment-100/80 dark:bg-zinc-900/60 border border-parchment-300 dark:border-zinc-800">
                <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {isAmharic ? 'የተከለከሉ ቃላት:' : 'Forbidden Taboo Words:'}
                </span>
                {tabooWords.map((word, idx) => {
                  const isViolated = activeViolations.includes(word);
                  return (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-md font-mono text-[11px] border transition-colors ${
                        isViolated
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-400 dark:border-zinc-600 font-semibold line-through'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Violated Taboo Words Warning (Strictly Monochrome) */}
            {activeViolations.length > 0 && (
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 flex items-start gap-2">
                <ShieldAlert size={14} className="shrink-0 mt-0.5 text-zinc-900 dark:text-zinc-100" />
                <span className="font-medium leading-relaxed">
                  {isAmharic
                    ? `የተከለከለውን ቃል ተጠቅመዋል፡ ${activeViolations.join(', ')}። ፅንሰ-ሀሳቡን ያለ ቴክኒካዊ ቃላት በግልጽ ቋንቋ ያስረዱ።`
                    : `You used the forbidden word: ${activeViolations.join(', ')}. Explain the concept in plain English without relying on buzzwords.`}
                </span>
              </div>
            )}

            {voxide.mode === 'voice' ? (
              /* Voice Mode Interactive Dock (Strictly Monochrome & Single Exchange) */
              renderVoiceDock()
            ) : (
              /* Library Mode (Clean, distraction-free silent text defense) */
              <form onSubmit={handleTurnSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder={
                      isAmharic
                        ? 'ማብራሪያዎን በዝርዝር ያብራሩ... (የአሰራር ሂደቱን እና ምክንያቱን ያስረዱ)'
                        : t.feynman.placeholder
                    }
                    rows={4}
                    className="w-full p-3 text-sm bg-parchment-50 dark:bg-zinc-900/60 border border-parchment-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-parchment-400 dark:focus:ring-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end pt-1">
                  {/* Turn Submission CTA */}
                  <button
                    type="submit"
                    disabled={!explanation.trim() || isSubmittingTurn}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 border border-zinc-900 dark:border-zinc-100 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                  >
                    {isSubmittingTurn ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>{isAmharic ? 'በመገምገም ላይ...' : t.feynman.evaluating}</span>
                      </>
                    ) : (
                      <>
                        <span>{isAmharic ? 'ምላሹን አስገባ' : t.feynman.submitEvaluation}</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};
