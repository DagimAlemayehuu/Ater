'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  playNeuralAudio,
  stopNeuralAudio,
  onAudioStateChange,
  getAudioPlaybackState,
  AudioPlaybackState,
} from '@/lib/voice/ttsClient';
import type {
  CourseCurriculum,
  SocraticDiscoveryQuestion,
  DynamicLessonNote,
  FeynmanEvaluation,
  RoadmapLesson,
} from '@/types';
import { NoteCanvas } from '@/components/dashboard/NoteCanvas';
import { FeynmanModal } from '@/components/dashboard/FeynmanModal';
import { useLanguage } from '@/context/LanguageContext';

type DemoStep = 'topic' | 'questions' | 'roadmap' | 'lesson';

export function InteractiveFlowDemo() {
  const { language, isAmharic } = useLanguage();
  const [step, setStep] = useState<DemoStep>('topic');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Socratic Questions State
  const [questions, setQuestions] = useState<SocraticDiscoveryQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customAnswer, setCustomAnswer] = useState<string>('');

  // Roadmap State & Real-Time Modification
  const [curriculum, setCurriculum] = useState<CourseCurriculum | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [roadmapFeedback, setRoadmapFeedback] = useState<string>('');
  const [isModifyingRoadmap, setIsModifyingRoadmap] = useState<boolean>(false);

  // Note & Socratic Defense Gate State
  const [lessonNote, setLessonNote] = useState<DynamicLessonNote | null>(null);
  const [isCompilingNote, setIsCompilingNote] = useState(false);
  const [isFeynmanOpen, setIsFeynmanOpen] = useState(false);
  const [feynmanEvaluation, setFeynmanEvaluation] = useState<FeynmanEvaluation | null>(null);
  const [isEvaluatingFeynman, setIsEvaluatingFeynman] = useState(false);

  // Global Audio State
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(getAudioPlaybackState());

  useEffect(() => {
    const unsub = onAudioStateChange((state) => {
      setPlaybackState(state);
    });
    return () => {
      unsub();
      stopNeuralAudio();
    };
  }, []);

  const playQuestionVoice = useCallback((q: SocraticDiscoveryQuestion, lang: 'en' | 'am') => {
    const textToSpeak = q.spokenPrompt || q.question;
    playNeuralAudio(textToSpeak, {
      voice: lang === 'am' ? 'am-ET-MekdesNeural' : 'en-US-JennyNeural',
      readerId: 'demo-question',
    });
  }, []);

  const handleTopicSubmit = async (e?: React.FormEvent, explicitTopic?: string) => {
    if (e) e.preventDefault();
    const cleanTopic = (explicitTopic ?? topic).trim();
    if (!cleanTopic) return;

    if (explicitTopic) {
      setTopic(explicitTopic);
    }

    setLoading(true);
    setError(null);
    stopNeuralAudio();

    try {
      const res = await fetch('/api/ingest/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'prompt',
          prompt: cleanTopic,
          useMock: false,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isAmharic ? 'ጥያቄዎችን ማመንጨት አልተቻለም።' : 'Failed to start calibration.'));

      setQuestions(data.questions || []);
      setCurrentQIndex(0);
      setStep('questions');

      if (data.questions?.[0]) {
        playQuestionVoice(data.questions[0], language);
      }
    } catch (err: any) {
      setError(err.message || (isAmharic ? 'ርዕሱን ማስኬድ ላይ ስህተት ተፈጥሯል።' : 'Error processing topic.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    const activeQ = questions[currentQIndex];
    if (!activeQ) return;

    const chosen = selectedOption || customAnswer.trim();
    if (!chosen) {
      setError(isAmharic ? 'እባክዎ አማራጭ ይምረጡ ወይም ምላሽዎን ይጻፉ።' : 'Please select an option or type a brief answer.');
      return;
    }

    setError(null);
    stopNeuralAudio();

    const newAnswers = { ...answers, [activeQ.id]: chosen };
    setAnswers(newAnswers);
    setSelectedOption('');
    setCustomAnswer('');

    if (currentQIndex + 1 < questions.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      playQuestionVoice(questions[nextIdx], language);
    } else {
      await handleGenerateRoadmap(newAnswers);
    }
  };

  const handleGenerateRoadmap = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/curriculum/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          answers: finalAnswers,
          useMock: false,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isAmharic ? 'የትምህርት ካርታ ማመንጨት አልተቻለም።' : 'Failed to generate roadmap.'));

      setCurriculum(data);
      if (data.lessons?.[0]) {
        setActiveLessonId(data.lessons[0].id);
      }
      setStep('roadmap');

      // Vocalize the teacher walkthrough explaining the curriculum roadmap
      if (data.teacherWalkthrough) {
        stopNeuralAudio();
        playNeuralAudio(data.teacherWalkthrough, {
          voice: language === 'am' ? 'am-ET-MekdesNeural' : 'en-US-JennyNeural',
          readerId: 'roadmap-walkthrough',
        });
      }
    } catch (err: any) {
      setError(err.message || (isAmharic ? 'የትምህርት ካርታ ስህተት።' : 'Error generating roadmap.'));
    } finally {
      setLoading(false);
    }
  };

  const handleModifyRoadmap = async () => {
    if (!curriculum || !roadmapFeedback.trim()) return;

    setIsModifyingRoadmap(true);
    setError(null);
    stopNeuralAudio();

    try {
      const res = await fetch('/api/curriculum/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculum,
          feedback: roadmapFeedback.trim(),
          language,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || (isAmharic ? 'የትምህርት ካርታውን ማስተካከል አልተቻለም።' : 'Failed to modify roadmap.'));

      setCurriculum(updated);
      if (updated.lessons?.[0]) {
        setActiveLessonId(updated.lessons[0].id);
      }
      setRoadmapFeedback('');

      // Play updated teacher explanation of changes
      if (updated.teacherWalkthrough) {
        playNeuralAudio(updated.teacherWalkthrough, {
          voice: language === 'am' ? 'am-ET-MekdesNeural' : 'en-US-JennyNeural',
          readerId: 'roadmap-walkthrough',
        });
      }
    } catch (err: any) {
      setError(err.message || (isAmharic ? 'የትምህርት ካርታ ማስተካከል ላይ ስህተት ተፈጥሯል።' : 'Error modifying roadmap.'));
    } finally {
      setIsModifyingRoadmap(false);
    }
  };

  const handleLoadLesson = async (lesson: RoadmapLesson) => {
    setActiveLessonId(lesson.id);
    setIsCompilingNote(true);
    setError(null);
    stopNeuralAudio();

    try {
      const res = await fetch('/api/ai/compile-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          title: lesson.title,
          summary: lesson.summary,
          courseId: curriculum?.id,
          useMock: false,
          language,
        }),
      });

      const noteData = await res.json();
      if (!res.ok) throw new Error(noteData.error || (isAmharic ? 'ትምህርቱን ማዘጋጀት አልተቻለም።' : 'Failed to load lesson note.'));

      setLessonNote(noteData);
      setStep('lesson');
    } catch (err: any) {
      setError(err.message || (isAmharic ? 'ትምህርት በማዘጋጀት ላይ ስህተት ተፈጥሯል።' : 'Error compiling note.'));
    } finally {
      setIsCompilingNote(false);
    }
  };

  const handleApproveRoadmap = async () => {
    if (!curriculum?.lessons?.[0]) return;
    await handleLoadLesson(curriculum.lessons[0]);
  };

  const handleFeynmanEvaluate = async (concept: string, explanation: string): Promise<FeynmanEvaluation> => {
    setIsEvaluatingFeynman(true);
    stopNeuralAudio();
    try {
      const res = await fetch('/api/ai/feynman-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          explanation,
          useMock: false,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to evaluate response');
      setFeynmanEvaluation(data);
      return data;
    } finally {
      setIsEvaluatingFeynman(false);
    }
  };

  const handleReset = () => {
    stopNeuralAudio();
    setStep('topic');
    setTopic('');
    setQuestions([]);
    setCurrentQIndex(0);
    setAnswers({});
    setSelectedOption('');
    setCustomAnswer('');
    setCurriculum(null);
    setActiveLessonId(null);
    setLessonNote(null);
    setIsFeynmanOpen(false);
    setFeynmanEvaluation(null);
    setError(null);
  };

  return (
    <section id="demo" className="snap-section w-full min-h-[85vh] md:min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 py-10 md:py-12 scroll-mt-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-4xl mx-auto flex flex-col justify-center"
      >
        <div className="text-center mb-5 sm:mb-6 space-y-1.5 shrink-0">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {isAmharic ? 'ይሞክሩት' : 'Try it out'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          {isAmharic
            ? 'ተለዋዋጭ የትምህርት ሂደቱን እና የሶቅራጥስ የቃል ምዘናን በቀጥታ ይፈትሹ።'
            : 'Test the interactive curriculum and active recall verification in real time.'}
        </p>
      </div>

      <div className="relative rounded-2xl border border-parchment-300/90 dark:border-zinc-800 bg-parchment-50 dark:bg-zinc-950 shadow-lg overflow-hidden flex flex-col min-h-[480px] h-[580px] max-h-[85vh] md:max-h-[75vh]">
        {/* Floating Reset / Mute controls anchored top-right (only when not in lesson view to prevent any header overlap) */}
        {step !== 'lesson' && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            {playbackState === 'playing' && (
              <button
                type="button"
                onClick={() => stopNeuralAudio()}
                className="px-2 py-1 rounded-md border border-parchment-300 dark:border-zinc-750 bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                title={isAmharic ? 'አቁም' : 'Mute voice'}
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span className="text-[10px]">{isAmharic ? 'አቁም' : 'Mute'}</span>
              </button>
            )}

            {step !== 'topic' && (
              <button
                type="button"
                onClick={handleReset}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-parchment-200 dark:hover:bg-zinc-850 transition-colors cursor-pointer border border-parchment-300 dark:border-zinc-800 bg-parchment-100/90 dark:bg-zinc-900/90"
                title={isAmharic ? 'ከመጀመሪያ ጀምር' : 'Restart demo'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="mx-6 mt-3 rounded-xl p-2.5 text-xs bg-parchment-200 dark:bg-zinc-900 border border-parchment-300 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shrink-0">
              {error}
            </div>
          )}

          {/* STEP 1: What do you want to learn? */}
          {step === 'topic' && (
            <div className="p-6 sm:p-10 flex-1 flex flex-col justify-center space-y-5 max-w-xl mx-auto w-full overflow-y-auto">
              <div className="space-y-1 text-center">
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {isAmharic ? 'ምን መማር ይፈልጋሉ?' : 'What do you want to learn?'}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {isAmharic
                    ? 'የሚፈልጉትን ማንኛውንም ፅንሰ-ሀሳብ ወይም ርዕስ ያስገቡ።'
                    : 'Enter any concept or topic you want to understand.'}
                </p>
              </div>

              <form onSubmit={(e) => handleTopicSubmit(e)} className="space-y-3.5">
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={
                      isAmharic
                        ? 'ለምሳሌ፡ የዳታቤዝ ኢንዴክሲንግ፣ ኳንተም ኮምፒውቲንግ...'
                        : 'e.g. How Memory Works, Quantum Computing, Microeconomics...'
                    }
                    disabled={loading}
                    required
                    className="w-full rounded-xl border border-parchment-300 dark:border-zinc-700 bg-parchment-100/70 dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-parchment-500 dark:focus:ring-zinc-500 transition-all leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={loading || !topic.trim()}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-medium rounded-xl border border-parchment-400 dark:border-zinc-700 bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isAmharic ? 'ቀጥል' : 'Continue'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Socratic Calibration Questions */}
          {step === 'questions' && questions[currentQIndex] && (
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center space-y-4 max-w-xl mx-auto w-full overflow-y-auto">
              <div className="flex items-center gap-1.5">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx === currentQIndex
                        ? 'bg-zinc-800 dark:bg-zinc-300'
                        : idx < currentQIndex
                          ? 'bg-parchment-400 dark:bg-zinc-600'
                          : 'bg-parchment-300 dark:bg-zinc-800'
                    }`}
                  />
                ))}
              </div>

              <div className="rounded-xl border border-parchment-300 dark:border-zinc-800 bg-parchment-100/60 dark:bg-zinc-900/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                    {questions[currentQIndex].question}
                  </p>

                  <button
                    onClick={() => playQuestionVoice(questions[currentQIndex], language)}
                    className="p-1.5 rounded-lg border border-parchment-300 dark:border-zinc-800 hover:bg-parchment-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 transition-colors cursor-pointer bg-parchment-50 dark:bg-zinc-900"
                    title={isAmharic ? 'ጥያቄውን ያድምጡ' : 'Hear question'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  {questions[currentQIndex].options?.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSelectedOption(opt);
                        setCustomAnswer('');
                      }}
                      className={`w-full px-3.5 py-2 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                        selectedOption === opt
                          ? 'border-parchment-500 dark:border-zinc-600 bg-parchment-300/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium'
                          : 'border-parchment-300 dark:border-zinc-800/80 bg-parchment-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-parchment-200/80 dark:hover:bg-zinc-800/50 hover:border-parchment-400 dark:hover:border-zinc-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}

                  <div className="rounded-lg border border-parchment-300 dark:border-zinc-800 bg-parchment-50 dark:bg-zinc-900/60 px-3.5 py-2">
                    <input
                      type="text"
                      value={customAnswer}
                      onChange={(e) => {
                        setCustomAnswer(e.target.value);
                        setSelectedOption('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAnswerSubmit();
                      }}
                      placeholder={isAmharic ? 'ሌላ... (የእርስዎን ግብ ወይም ግንዛቤ ይጻፉ)' : 'Other... (type your custom goal or background)'}
                      className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleAnswerSubmit}
                  disabled={loading || (!selectedOption && !customAnswer.trim())}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-parchment-400 dark:border-zinc-700 bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {currentQIndex + 1 < questions.length
                          ? (isAmharic ? 'ቀጣይ ጥያቄ' : 'Next Question')
                          : (isAmharic ? 'የትምህርት ካርታ አዘጋጅ' : 'Generate Roadmap')}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Generated Roadmap Review */}
          {step === 'roadmap' && curriculum && (
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center space-y-4 max-w-xl mx-auto w-full overflow-y-auto">
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {curriculum.title || curriculum.topic}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isAmharic ? 'የታለመ ግብ፡ ' : 'Target goal: '}{curriculum.targetGoal}
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {curriculum.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="p-3 rounded-lg border border-parchment-300 dark:border-zinc-800 bg-parchment-100/60 dark:bg-zinc-900/40 flex items-start gap-3 hover:border-parchment-400 dark:hover:border-zinc-700 transition-colors"
                  >
                    <span className="font-mono text-xs text-zinc-400 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {lesson.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {lesson.summary}
                      </p>
                    </div>
                    <span className="text-[11px] text-zinc-400 shrink-0 font-mono">
                      {lesson.estimatedMinutes} {isAmharic ? 'ደቂቃ' : 'min'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Real-Time Roadmap Modification Input */}
              <div className="pt-1">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleModifyRoadmap();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={roadmapFeedback}
                      onChange={(e) => setRoadmapFeedback(e.target.value)}
                      placeholder={
                        isAmharic
                          ? 'ካርታውን ያሻሽሉ (ለምሳሌ፡ "የላቀ የደህንነት ትምህርት ጨምር")...'
                          : 'Modify roadmap (e.g. "Add advanced security module", "Make it more practical")...'
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-parchment-300 dark:border-zinc-800 bg-parchment-50 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-parchment-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isModifyingRoadmap || !roadmapFeedback.trim()}
                    className="px-3 py-2 text-xs font-medium rounded-xl border border-parchment-400 dark:border-zinc-700 bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    {isModifyingRoadmap ? (
                      <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                    ) : (
                      <span>{isAmharic ? 'አሻሽል' : 'Refine'}</span>
                    )}
                  </button>
                </form>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-parchment-300 dark:border-zinc-800">
                <span className="text-xs text-zinc-400">
                  {curriculum.lessons.length} {isAmharic ? 'ትምህርቶች ተዘጋጅተዋል' : 'lessons calibrated'}
                </span>
                <button
                  onClick={handleApproveRoadmap}
                  disabled={loading || isModifyingRoadmap}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-parchment-400 dark:border-zinc-700 bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isAmharic ? 'አጽድቅ እና ትምህርት 01 ጀምር' : 'Approve & Start Lesson 01'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Full MVP-Grade Structured NoteCanvas with Gate & Ask Teacher */}
          {step === 'lesson' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <NoteCanvas
                note={lessonNote}
                curriculum={curriculum}
                activeLessonId={activeLessonId || undefined}
                onSelectLesson={(l) => handleLoadLesson(l)}
                isLoading={isCompilingNote}
                language={language}
                onOpenFeynman={() => setIsFeynmanOpen(true)}
                feynmanEvaluation={feynmanEvaluation}
                isEvaluatingFeynman={isEvaluatingFeynman}
                initialViewMode="interactive"
                onResetDemo={handleReset}
              />

              {/* Socratic Defense Gate Modal */}
              <FeynmanModal
                isOpen={isFeynmanOpen}
                concept={lessonNote?.title || topic}
                onClose={() => setIsFeynmanOpen(false)}
                onEvaluate={handleFeynmanEvaluate}
                language={language}
              />
            </div>
          )}
        </div>
      </div>
      </motion.div>
    </section>
  );
}
