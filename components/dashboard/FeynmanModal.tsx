'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Loader2, Volume2, ShieldAlert, ArrowRight, Mic, MicOff } from 'lucide-react';
import { playNeuralAudio, stopNeuralAudio } from '@/lib/voice/ttsClient';
import type { FeynmanEvaluation, GateQuestionTurn, RoadmapLesson } from '@/types';
import { generateFallbackGateQuestions, detectTabooWordViolations } from '@/lib/ai/gate';
import { translations, type AppLanguage } from '@/lib/i18n/translations';
import { saveGateSessionToStore } from '@/lib/sync/store';

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

  const [explanation, setExplanation] = useState<string>('');
  const [isLoadingBattery, setIsLoadingBattery] = useState<boolean>(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState<boolean>(false);
  const [lastTurnFeedback, setLastTurnFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [violatedWords, setViolatedWords] = useState<string[]>([]);

  // Live evaluation of taboo buzzwords inside explanation
  const liveViolated = detectTabooWordViolations(explanation, tabooWords);
  const activeViolations = Array.from(new Set([...liveViolated, ...violatedWords]));

  // Audio recording & live RMS waveform state
  const [isListeningSpeech, setIsListeningSpeech] = useState<boolean>(false);
  const [isTranscribingSpeech, setIsTranscribingSpeech] = useState<boolean>(false);
  const [audioRms, setAudioRms] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [finalResult, setFinalResult] = useState<{
    passed: boolean;
    overallScore: number;
    summaryFeedback: string;
    misconceptions: string[];
    remediationTopic?: string;
  } | null>(null);

  // Modal screen view: 'question' (answering/speaking) or 'mini_lesson' (studying remediation + Q&A)
  const [modalStage, setModalStage] = useState<'question' | 'mini_lesson'>('question');
  const [activeMiniLessonText, setActiveMiniLessonText] = useState<string>('');
  const [miniLessonAskInput, setMiniLessonAskInput] = useState<string>('');
  const [miniLessonMessages, setMiniLessonMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isAskingMiniLesson, setIsAskingMiniLesson] = useState<boolean>(false);

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
    setIsLoadingBattery(true);
    stopNeuralAudio();

    const fallbackQuestions = generateFallbackGateQuestions(concept, language);

    const initialStatus = isAmharic
      ? `ጥያቄ 1 / 3`
      : `Question 1 of 3`;
    setStatusMessage(initialStatus);

    fetch('/api/ai/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', lessonTitle: concept, language }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        const initialQuestions: GateQuestionTurn[] = Array.isArray(data?.questions) && data.questions.length >= 3
          ? data.questions
          : fallbackQuestions;

        setBaseQuestions(initialQuestions);
        setActiveTurn(initialQuestions[0]);
        setIsLoadingBattery(false);

        // Vocalize authoritative question only after questions are locked in
        if (initialQuestions[0]?.spokenPrompt) {
          playNeuralAudio(initialQuestions[0].spokenPrompt, {
            voice: defaultVoice,
            readerId: 'defense-question-0',
          });
        }
      })
      .catch((_err) => {
        if (!isMounted) return;
        setBaseQuestions(fallbackQuestions);
        setActiveTurn(fallbackQuestions[0]);
        setIsLoadingBattery(false);

        if (fallbackQuestions[0]?.spokenPrompt) {
          playNeuralAudio(fallbackQuestions[0].spokenPrompt, {
            voice: defaultVoice,
            readerId: 'defense-question-0',
          });
        }
      });

    return () => {
      isMounted = false;
      stopNeuralAudio();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen, concept, language, defaultVoice, isAmharic]);

  // Clean up audio streams when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsListeningSpeech(false);
      setIsTranscribingSpeech(false);
      setAudioRms(0);
    }
  }, [isOpen]);

  // Hands-free speech input toggle with real-time RMS meter
  const toggleSpeechInput = async () => {
    if (isListeningSpeech) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsListeningSpeech(false);
      setAudioRms(0);
      return;
    }

    stopNeuralAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // AudioContext + AnalyserNode for live RMS calculation
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateRms = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / bufferLength);
          setAudioRms(Math.min(1, rms * 3.5)); // Boost sensitivity for visual pulse
          animationFrameRef.current = requestAnimationFrame(updateRms);
        };
        updateRms();
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsListeningSpeech(false);
        setAudioRms(0);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size < 100) return;

        setIsTranscribingSpeech(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64 = (reader.result as string)?.split(',')[1];
            if (!base64) {
              setIsTranscribingSpeech(false);
              return;
            }

            const res = await fetch('/api/voice/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64, mimeType: audioBlob.type || 'audio/webm', language }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.transcript) {
                setExplanation((prev) => (prev ? `${prev} ${data.transcript.trim()}` : data.transcript.trim()));
              }
            }
            setIsTranscribingSpeech(false);
          };
        } catch {
          setIsTranscribingSpeech(false);
        }
      };

      recorder.start(100);
      setIsListeningSpeech(true);
    } catch {
      setIsListeningSpeech(false);
      setAudioRms(0);
    }
  };

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
      playNeuralAudio(answer, { voice: defaultVoice, readerId: 'defense-minilesson-answer' });
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

    if (activeTurn?.spokenPrompt) {
      playNeuralAudio(activeTurn.spokenPrompt, { voice: defaultVoice, readerId: 'defense-followup' });
    }
  };

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

          // Vocalize feedback and mini-lesson cleanly without delay
          playNeuralAudio(`${feedback} ${lessonContent}`, { voice: defaultVoice, readerId: 'defense-minilesson' });
        } else {
          setModalStage('question');
          const probeStatus = isAmharic
            ? `ጥያቄ ${currentBaseIndex + 1} / 3 · ተከታይ ጥያቄ`
            : `Question ${currentBaseIndex + 1} of 3 · Follow-Up Question`;
          setStatusMessage(probeStatus);

          // Vocalize feedback and question cleanly without delay
          const fullSpeech = followUp.spokenPrompt ? `${feedback} ${followUp.spokenPrompt}` : feedback;
          playNeuralAudio(fullSpeech, { voice: defaultVoice, readerId: 'defense-followup' });
        }
      } else {
        // Mastered or max attempts reached: speak turn feedback
        playNeuralAudio(feedback, { voice: defaultVoice, readerId: 'defense-feedback' });

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

          if (nextQ?.spokenPrompt) {
            playNeuralAudio(nextQ.spokenPrompt, { voice: defaultVoice, readerId: `gate-question-${nextIdx}` });
          }
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

          if (finalData.summaryFeedback) {
            playNeuralAudio(finalData.summaryFeedback, { voice: defaultVoice, readerId: 'gate-final' });
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fbf7f0] dark:bg-zinc-950 font-sans overflow-hidden">
      {/* Top Navigation Bar with Defense Title and Exit Button */}
      <header className="border-b border-parchment-300/80 dark:border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0 bg-[#fbf7f0] dark:bg-zinc-950 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isAmharic ? 'የቃል መከላከያ' : 'Defense'}
          </h2>
          {/* 3 Progress Bars without 'Question X of 3' text */}
          {!finalResult && (
            <div className="flex items-center gap-2 pl-2">
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
              <button
                type="button"
                onClick={() => playNeuralAudio(activeMiniLessonText, { voice: defaultVoice, readerId: 'defense-minilesson-replay' })}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
                title="Replay lesson"
              >
                <Volume2 size={12} />
                <span>{isAmharic ? 'አዳምጥ' : 'Listen'}</span>
              </button>
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

            {/* Interactive Question-Asking Thread on the Mini-Lesson */}
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
                {currentTurn.spokenPrompt && (
                  <button
                    type="button"
                    onClick={() => playNeuralAudio(currentTurn.spokenPrompt, { voice: defaultVoice, readerId: 'defense-replay' })}
                    className="shrink-0 flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-parchment-300 dark:border-zinc-700 transition-colors cursor-pointer shadow-xs"
                    title="Replay spoken question"
                  >
                    <Volume2 size={12} />
                    <span>{isAmharic ? 'አዳምጥ' : 'Listen'}</span>
                  </button>
                )}
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
                          ? 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 font-semibold line-through'
                          : 'bg-parchment-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-parchment-300 dark:border-zinc-700'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Violated Taboo Words Warning */}
            {activeViolations.length > 0 && (
              <div className="p-3 rounded-xl bg-red-500/10 dark:bg-red-500/15 border border-red-300 dark:border-red-800 text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">
                  {isAmharic
                    ? `የተከለከለውን ቃል ተጠቅመዋል፡ ${activeViolations.join(', ')}። ፅንሰ-ሀሳቡን ያለ ቴክኒካዊ ቃላት በግልጽ ቋንቋ ያስረዱ።`
                    : `You used the forbidden word: ${activeViolations.join(', ')}. Explain the concept in plain English without relying on buzzwords.`}
                </span>
              </div>
            )}

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
                  className="w-full p-3 text-sm bg-parchment-50 dark:bg-zinc-900/60 border border-parchment-300 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-parchment-400 dark:focus:ring-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {/* Voice Input Button with Dark Mode & Clean Embedded Transcription Status */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={toggleSpeechInput}
                    disabled={isTranscribingSpeech || isSubmittingTurn}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isListeningSpeech
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-sm'
                        : isTranscribingSpeech
                          ? 'bg-parchment-200 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-parchment-300 dark:border-zinc-800 cursor-not-allowed'
                          : 'bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-parchment-300 dark:border-zinc-800'
                    }`}
                    title={
                      isListeningSpeech
                        ? (isAmharic ? 'የንግግር ግብዓት አቁም' : 'Stop recording')
                        : isTranscribingSpeech
                          ? (isAmharic ? 'እየተገለበጠ ነው...' : 'Transcribing audio...')
                          : (isAmharic ? 'በድምፅ መልሱ' : 'Speak answer (Hands-Free)')
                    }
                  >
                    {isTranscribingSpeech ? (
                      <Loader2 size={13} className="animate-spin text-zinc-400 dark:text-zinc-500" />
                    ) : isListeningSpeech ? (
                      <MicOff size={13} />
                    ) : (
                      <Mic size={13} />
                    )}
                    <span className="font-mono text-[11px]">
                      {isListeningSpeech
                        ? (isAmharic ? 'እየቀረጸ ነው...' : 'Recording...')
                        : isTranscribingSpeech
                          ? (isAmharic ? 'እየገለበጠ ነው...' : 'Transcribing...')
                          : (isAmharic ? 'በድምፅ ተናገር' : 'Voice Input')}
                    </span>
                  </button>

                  {/* Live RMS Waveform Pulse Visualizer */}
                  {isListeningSpeech && (
                    <div
                      data-testid="feynman-rms-waveform"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    >
                      {[0.3, 0.7, 1.0, 0.6, 0.4].map((scaleFactor, barIdx) => {
                        const heightPx = Math.max(4, Math.round((audioRms * scaleFactor + 0.15) * 20));
                        return (
                          <span
                            key={barIdx}
                            style={{ height: `${heightPx}px` }}
                            className="w-1 rounded-full bg-zinc-700 dark:bg-zinc-200 transition-all duration-75 ease-out"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Turn Submission CTA */}
                <button
                  type="submit"
                  disabled={!explanation.trim() || isSubmittingTurn || isListeningSpeech || isTranscribingSpeech}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-parchment-400 dark:border-zinc-700 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
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
      </main>
    </div>
  );
};
