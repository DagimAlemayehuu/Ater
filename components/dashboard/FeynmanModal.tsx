'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, Volume2, ShieldAlert, ArrowRight } from 'lucide-react';
import { playNeuralAudio, stopNeuralAudio } from '@/lib/voice/ttsClient';
import type { FeynmanEvaluation, GateQuestionTurn } from '@/types';
import { generateFallbackGateQuestions } from '@/lib/ai/gate';
import { translations, type AppLanguage } from '@/lib/i18n/translations';

interface FeynmanModalProps {
  isOpen: boolean;
  concept: string;
  onClose: () => void;
  onEvaluate: (concept: string, explanation: string) => Promise<FeynmanEvaluation>;
  onOpenRemediation?: () => void;
  onContinueNextLesson?: () => void;
  language?: AppLanguage;
}

export const FeynmanModal: React.FC<FeynmanModalProps> = ({
  isOpen,
  concept,
  onClose,
  onEvaluate,
  onOpenRemediation,
  onContinueNextLesson,
  language = 'en',
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

  const [explanation, setExplanation] = useState<string>('');
  const [isLoadingBattery, setIsLoadingBattery] = useState<boolean>(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState<boolean>(false);
  const [lastTurnFeedback, setLastTurnFeedback] = useState<{ score: number; feedback: string } | null>(null);

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

    const fallbackQuestions = generateFallbackGateQuestions(concept, language);
    setBaseQuestions(fallbackQuestions);
    setCurrentBaseIndex(0);
    setAttemptNumber(1);
    setActiveTurn(fallbackQuestions[0] || null);
    setCompletedTurns([]);
    setExplanation('');
    setLastTurnFeedback(null);
    setFinalResult(null);
    setIsLoadingBattery(false);

    const initialStatus = isAmharic
      ? `ጥያቄ 1 / 3`
      : `Question 1 of 3`;
    setStatusMessage(initialStatus);

    if (fallbackQuestions[0]?.spokenPrompt) {
      playNeuralAudio(fallbackQuestions[0].spokenPrompt, {
        voice: defaultVoice,
        readerId: 'gate-question-0',
      });
    }

    fetch('/api/ai/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', lessonTitle: concept, language }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.questions) return;
        const initialQuestions: GateQuestionTurn[] = Array.isArray(data.questions) ? data.questions : [];
        if (initialQuestions.length >= 3) {
          setBaseQuestions(initialQuestions);
          setActiveTurn(initialQuestions[0]);
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

  if (!isOpen) return null;

  const currentTurn = activeTurn || baseQuestions[currentBaseIndex];

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
        }),
      });

      const evalData = await res.json();
      const score = Number(evalData.score) || 5;
      const tier = evalData.tier;
      const feedback = evalData.feedback || (isAmharic ? 'ግንዛቤ ተመዝግቧል።' : 'Answer evaluated.');

      setLastTurnFeedback({ score, feedback });

      // Vocalize short turn feedback
      playNeuralAudio(feedback, { voice: defaultVoice, readerId: 'gate-feedback' });

      // Socratic Loop: If needs follow-up, update turn and stay on this base question
      if (evalData.needsFollowUp && evalData.followUpTurn) {
        const followUp = evalData.followUpTurn;
        setActiveTurn(followUp);
        setAttemptNumber((prev) => prev + 1);
        setExplanation('');

        const probeStatus = isAmharic
          ? `ጥያቄ ${currentBaseIndex + 1} / 3${
              tier === 'mini_lesson'
                ? ' · አጭር ትምህርት'
                : tier === 'harder_probe'
                ? ' · ከበድ ያለ ጥያቄ'
                : tier === 'refinement'
                ? ' · ማጣሪያ'
                : ` · ተከታይ #${attemptNumber + 1}`
            }`
          : `Question ${currentBaseIndex + 1} of 3${
              tier === 'mini_lesson'
                ? ' · Mini-Lesson'
                : tier === 'harder_probe'
                ? ' · Deeper Challenge'
                : tier === 'refinement'
                ? ' · Refinement'
                : ` · Follow-Up #${attemptNumber + 1}`
            }`;
        setStatusMessage(probeStatus);

        setTimeout(() => {
          if (followUp.spokenPrompt) {
            playNeuralAudio(followUp.spokenPrompt, { voice: defaultVoice, readerId: 'gate-followup' });
          }
        }, 1200);
      } else {
        // Mastered (or max attempts reached): record turn and advance to next question
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

          const nextStatus = isAmharic
            ? `ጥያቄ ${nextIdx + 1} / 3`
            : `Question ${nextIdx + 1} of 3`;
          setStatusMessage(nextStatus);

          setTimeout(() => {
            if (nextQ?.spokenPrompt) {
              playNeuralAudio(nextQ.spokenPrompt, { voice: defaultVoice, readerId: `gate-question-${nextIdx}` });
            }
          }, 1200);
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

          const doneStatus = isAmharic ? 'የቃል ምዘና ተጠናቋል' : 'Defense Session Concluded';
          setStatusMessage(doneStatus);

          if (finalData.summaryFeedback) {
            setTimeout(() => {
              playNeuralAudio(finalData.summaryFeedback, { voice: defaultVoice, readerId: 'gate-final' });
            }, 1000);
          }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header with Close and Real-time Status */}
        <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {isAmharic ? 'የሶቅራጥስ የቃል ምዘና መከላከያ' : t.feynman.challengeTitle}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {concept}
              </p>
            </div>
            <button
              onClick={() => {
                stopNeuralAudio();
                onClose();
              }}
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 cursor-pointer"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Minimal Status Header */}
          {!finalResult && (
            <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-200">
                {statusMessage || (isAmharic ? `ጥያቄ ${currentBaseIndex + 1} / 3` : `Question ${currentBaseIndex + 1} of 3`)}
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((idx) => {
                  const isDone = idx < currentBaseIndex;
                  const isCurrent = idx === currentBaseIndex;
                  return (
                    <div
                      key={idx}
                      className={`h-1 w-6 rounded-full transition-all ${
                        isDone
                          ? 'bg-zinc-900 dark:bg-zinc-100'
                          : isCurrent
                          ? 'bg-zinc-500 dark:bg-zinc-400'
                          : 'bg-zinc-200 dark:bg-zinc-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoadingBattery && (
          <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {isAmharic ? 'የሶቅራጥስ የቃል ጥያቄዎችን በማዘጋጀት ላይ...' : 'Preparing oral defense battery...'}
            </span>
          </div>
        )}

        {/* Final Verdict Screen */}
        {!isLoadingBattery && finalResult && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
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
                        ? (isAmharic ? 'የተረጋገጠ ማስተሪ (Passed)' : 'Mastery Confirmed · Defense Passed')
                        : (isAmharic ? 'የማካካሻ ትምህርት ያስፈልጋል (Remediation Required)' : 'Remediation Loop Activated')}
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
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-sans">
                  <span className="font-semibold">{isAmharic ? 'የተጨመረ የማካካሻ ትምህርት፡' : 'Injected Micro-Remediation:'}</span>{' '}
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
                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                {finalResult.passed
                  ? (isAmharic ? 'ቀጣዩን ትምህርት ክፈት' : 'Continue to Next Lesson')
                  : (isAmharic ? 'የማካካሻ ትምህርቱን ጀምር' : 'Open Remediation Lesson')}
              </button>
            </div>
          </div>
        )}

        {/* Active Interrogation Question & Input */}
        {!isLoadingBattery && !finalResult && currentTurn && (
          <div className="space-y-4">
            {/* Mini-Lesson Card if provided by tier < 5 */}
            {currentTurn.miniLesson && (
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 space-y-1.5 font-sans">
                <div className="text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  {isAmharic ? 'አጭር ትምህርት' : 'Mini-Lesson'}
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {currentTurn.miniLesson}
                </p>
              </div>
            )}

            {/* Last Feedback Banner if transitioning */}
            {lastTurnFeedback && (
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-between gap-2 font-mono">
                <span className="leading-snug">{lastTurnFeedback.feedback}</span>
                <span className="font-mono text-[11px] font-medium shrink-0">
                  {lastTurnFeedback.score}/10
                </span>
              </div>
            )}

            {/* Question Card */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  {currentTurn.question}
                </p>
                {currentTurn.spokenPrompt && (
                  <button
                    type="button"
                    onClick={() => playNeuralAudio(currentTurn.spokenPrompt, { voice: defaultVoice, readerId: 'gate-replay' })}
                    className="shrink-0 flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
                    title="Replay spoken question"
                  >
                    <Volume2 size={12} />
                    <span>{isAmharic ? 'አዳምጥ' : 'Listen'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Answer Form */}
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
                  className="w-full p-3 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={!explanation.trim() || isSubmittingTurn}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
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
          </div>
        )}
      </div>
    </div>
  );
};
