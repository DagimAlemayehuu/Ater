'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InputVoiceIndicator } from '@/components/voice/InputVoiceIndicator';
import { AskTeacherBar } from '@/components/dashboard/AskTeacherBar';
import { SideQuestionModal, QaThread, QaTurn } from '@/components/dashboard/SideQuestionModal';
import {
  playNeuralAudio,
  stopNeuralAudio,
  pauseNeuralAudio,
  resumeNeuralAudio,
  restartNeuralAudio,
  onAudioStateChange,
  getAudioPlaybackState,
  getActiveReaderId,
  AudioPlaybackState,
} from '@/lib/voice/ttsClient';
import { translations } from '@/lib/i18n/translations';
import {
  RichContentRenderer,
  MermaidViewer,
  CodeViewer,
  MathViewer,
  TableViewer,
  TimelineViewer,
  InteractiveCanvasViewer,
} from '@/components/viewers';
import { InlineMCQCard } from '@/components/dashboard/InlineMCQCard';
import type {
  DynamicLessonNote,
  AterAtomicNote,
  FeynmanEvaluation,
  LessonCheckpoint,
  CourseCurriculum,
  RoadmapLesson,
  LessonInlineQuestion,
} from '@/types';
import { saveNoteToStore, saveLessonProgress, getLessonProgress } from '@/lib/sync/store';

export interface NoteCanvasProps {
  note: DynamicLessonNote | AterAtomicNote | null;
  curriculum?: CourseCurriculum | null;
  activeLessonId?: string;
  onSelectLesson?: (lesson: RoadmapLesson) => void;
  savedCourses?: CourseCurriculum[];
  onSelectCourse?: (course: CourseCurriculum) => void;
  isLoading?: boolean;
  isCompiling?: boolean;
  onFeynmanSubmit?: (explanation: string) => Promise<any>;
  feynmanEvaluation?: FeynmanEvaluation | null;
  isEvaluatingFeynman?: boolean;
  onOpenFeynman?: () => void;
  onCheckpointStep?: (checkpointId: string, answer: string) => Promise<any>;
  onOpenIntakeModal?: () => void;
  initialViewMode?: 'interactive' | 'full';
  language?: 'en' | 'am';
  isFeynmanOpen?: boolean;
  isIntakeOpen?: boolean;
  onResetDemo?: () => void;
  userId?: string;
  onNoteUpdate?: (updatedNote: DynamicLessonNote) => void;
}

export const NoteCanvas: React.FC<NoteCanvasProps> = ({
  note,
  curriculum,
  activeLessonId,
  onSelectLesson,
  savedCourses,
  onSelectCourse,
  isLoading = false,
  isCompiling = false,
  onFeynmanSubmit,
  feynmanEvaluation,
  isEvaluatingFeynman = false,
  onOpenFeynman,
  onCheckpointStep,
  onOpenIntakeModal,
  initialViewMode = 'interactive',
  language = 'en',
  isFeynmanOpen = false,
  isIntakeOpen = false,
  onResetDemo,
  userId,
  onNoteUpdate,
}) => {
  const t = translations[language] || translations.en;
  const isAmharic = language === 'am';
  const defaultVoice = isAmharic ? 'am-ET-MekdesNeural' : 'en-US-JennyNeural';

  const uid = userId || 'guest';
  const effectiveCourseId = curriculum?.id || (note as any)?.courseId || 'default_course';
  const effectiveLessonId = activeLessonId || (note as any)?.lessonId || (note as any)?.id || 'default_lesson';

  const [viewMode, setViewMode] = useState<'interactive' | 'full'>(initialViewMode);
  const [unlockedSection, setUnlockedSection] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = getLessonProgress(uid, effectiveCourseId, effectiveLessonId);
      if (saved && typeof saved.unlockedSection === 'number' && saved.unlockedSection >= 1) {
        return saved.unlockedSection;
      }
    }
    return 1;
  });
  const [activeSectionTab, setActiveSectionTab] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = getLessonProgress(uid, effectiveCourseId, effectiveLessonId);
      if (saved && typeof saved.activeSectionTab === 'number' && saved.activeSectionTab >= 1) {
        return saved.activeSectionTab;
      }
    }
    return 1;
  });
  const [checkpointInput, setCheckpointInput] = useState('');
  const [isSubmittingCheckpoint, setIsSubmittingCheckpoint] = useState(false);
  const [revealedQuiz, setRevealedQuiz] = useState<Record<string, boolean>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Audio state
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(getAudioPlaybackState());
  const [activeSpokenText, setActiveSpokenText] = useState<string>('');
  const [readingSection, setReadingSection] = useState<string | null>(null);

  // Antigravity-style Side Question modal state & note persistence
  const [isAskingTeacher, setIsAskingTeacher] = useState<boolean>(false);
  const [isSideQuestionOpen, setIsSideQuestionOpen] = useState<boolean>(false);
  const [sideQuestionThreads, setSideQuestionThreads] = useState<QaThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');


  const activeLoading = isLoading || isCompiling;

  const dynamicNote = note as DynamicLessonNote;
  const section1Text = dynamicNote?.mentalModel || dynamicNote?.section1CoreIntuition || '';
  const section2Text = dynamicNote?.intuitivePurpose || dynamicNote?.section2FormalFramework || '';
  const section3Text = dynamicNote?.operationalMechanism || dynamicNote?.section3ConcreteCaseStudy || '';
  const section4Boundary = dynamicNote?.boundaryConditions || '';
  const artifactCode = dynamicNote?.artifactCode || '';
  const checkpoint: LessonCheckpoint | undefined =
    dynamicNote?.checkpoints?.[0] || dynamicNote?.section4MidwayCheckpoint;
  const mutations = dynamicNote?.mutations || [];
  const section5Text = dynamicNote?.section5SocraticSynthesis || '';
  const provingGrounds = dynamicNote?.provingGrounds || [];
  const teacherExplanations = dynamicNote?.teacherExplanations;
  const inlineMCQs = dynamicNote?.inlineMCQs || [];
  const sectionQuestions = (secIdx: number) => inlineMCQs.filter((m) => m.sectionIndex === secIdx);

  const isCurrentMiniLesson = Boolean(
    (note as any)?.isRemediation ||
    (note as any)?.parentLessonId ||
    curriculum?.lessons?.some((l) => l.id === ((note as any)?.lessonId || (note as any)?.id) && (l.isRemediation || l.parentLessonId))
  );

  const hasDynamicSections = Boolean(dynamicNote?.sections && dynamicNote.sections.length > 0);

  const sectionsConfig = hasDynamicSections
    ? dynamicNote.sections!.map((sec, idx) => ({
        num: sec.order || idx + 1,
        title: sec.title,
        short: sec.shortTitle || sec.title,
        content: sec.content,
        inlineMCQs: sec.inlineMCQs,
        checkpoint: sec.checkpoint,
        teacherExplanation: sec.teacherExplanation,
      }))
    : isCurrentMiniLesson
      ? [
          {
            num: 1,
            title: isAmharic ? 'የማካካሻ ትምህርት' : 'Core Remediation',
            short: isAmharic ? 'ክለሳ' : 'Mini-Lesson',
            content: section1Text,
            inlineMCQs: sectionQuestions(1),
            checkpoint: undefined,
            teacherExplanation: undefined,
          },
        ]
      : [
          { num: 1, title: t.sections.sec1Full, short: t.sections.intuition, content: section1Text, inlineMCQs: sectionQuestions(1), checkpoint: undefined, teacherExplanation: undefined },
          { num: 2, title: t.sections.sec2Full, short: t.sections.framework, content: section2Text, inlineMCQs: sectionQuestions(2), checkpoint: undefined, teacherExplanation: undefined },
          { num: 3, title: t.sections.sec3Full, short: t.sections.mechanism, content: section3Text, inlineMCQs: sectionQuestions(3), checkpoint: undefined, teacherExplanation: undefined },
          { num: 4, title: t.sections.sec4Full, short: t.sections.checkpoint, content: section4Boundary, inlineMCQs: sectionQuestions(4), checkpoint: checkpoint, teacherExplanation: undefined },
          { num: 5, title: t.sections.sec5Full, short: t.sections.synthesis, content: section5Text, inlineMCQs: sectionQuestions(5), checkpoint: undefined, teacherExplanation: undefined },
        ];

  // Subscribe to audio state changes
  useEffect(() => {
    const unsubscribe = onAudioStateChange((newState, meta) => {
      setPlaybackState(newState);
      if (newState === 'idle') {
        setReadingSection(null);
      } else if (meta?.readerId && !meta.readerId.startsWith('note-section-')) {
        // Another voice reader took over; reset reading indicator
        setReadingSection(null);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Compute explanation text for a given section
  const getSectionExplanation = useCallback(
    (sectionIndex: number) => {
      const dynamicSec = dynamicNote?.sections?.find((s, idx) => (s.order || idx + 1) === sectionIndex);
      if (dynamicSec?.teacherExplanation && dynamicSec.teacherExplanation.trim()) {
        return dynamicSec.teacherExplanation;
      }

      const enFallback =
        sectionIndex === 1
          ? `Let's deeply explore the intuition behind ${note?.title}. Think of this as the core mental model to anchor every single mechanism we will cover. When you grasp this intuition from first principles, everything else flows naturally.`
          : sectionIndex === 2
            ? `Now let's examine why this structure exists in real engineering practice. We need a way to formalize and guarantee correctness under production conditions without relying on lucky timing.`
            : sectionIndex === 3
              ? `Watch the operational cycles unfold step by step. Notice how every node verifies each state transition before confirming, creating an unbreakable chain of trust.`
              : sectionIndex === 4
                ? `Notice where systems break down at the boundaries. Edge cases are where real engineering happens. Let's tackle the causal checkpoint below together.`
                : `Outstanding work. You have synthesized the core invariants of ${note?.title}. Review your key takeaways and test your mastery on the Feynman Gate.`;

      const amFallback =
        sectionIndex === 1
          ? `ስለ ${note?.title} መሰረታዊ ፅንሰ-ሀሳብ በጥልቀት እንወያይ። ይህንን እንደ ዋና መነሻ ማዕቀፍ አድርገው ይውሰዱት። ይህንን የመጀመሪያ መርህ ከተረዱት ሌላው አሰራር በሙሉ ግልጽ ይሆንልዎታል።`
          : sectionIndex === 2
            ? `አሁን ይህ መዋቅር በተግባር ለምን እንዳስፈለገ እንመልከት። በእውነተኛ የስራ አለም ውስጥ አስተማማኝ ዋስትናዎችን ለመስጠት ይህ መደበኛ ማዕቀፍ እጅግ አስፈላጊ ነው።`
            : sectionIndex === 3
              ? `የአሰራር ሂደቱን ደረጃ በደረጃ ተመልከቱ። እያንዳንዱ ክፍል መልእክቱን ከማረጋገጡ በፊት እንዴት እንደሚመረምር እና ስህተትን እንደሚከላከል ያስተውሉ።`
              : sectionIndex === 4
                ? `ስርዓቱ በድንበር እና በገደቦች ላይ እንዴት እንደሚሰራ እና የት እንደሚፈተን እንመርምር። አሁን ከታች ያለውን የሶቅራጥስ መመዘኛ ጥያቄ አብረን እንመልስ።`
                : `በጣም ጥሩ እድገት። የ ${note?.title} ዋና ዋና መርሆችን በሚገባ አጠቃለዋል። አሁን ግንዛቤዎን በፋይንማን የቃል ፈተና ይፈትሹ።`;

      const rawExplanation =
        sectionIndex === 1
          ? teacherExplanations?.section1
          : sectionIndex === 2
            ? teacherExplanations?.section2
          : sectionIndex === 3
            ? teacherExplanations?.section3
          : sectionIndex === 4
            ? teacherExplanations?.section4
          : teacherExplanations?.section5;

      if (isAmharic) {
        if (rawExplanation && /[\u1200-\u137F]/.test(rawExplanation)) {
          return rawExplanation;
        }
        return amFallback;
      }
      return rawExplanation || enFallback;
    },
    [
      note?.title,
      teacherExplanations?.section1,
      teacherExplanations?.section2,
      teacherExplanations?.section3,
      teacherExplanations?.section4,
      teacherExplanations?.section5,
      isAmharic,
    ]
  );

  // Play conversational teacher explanation for a section
  const playTeacherExplanation = useCallback(
    (sectionIndex: number, _title?: string) => {
      stopNeuralAudio();
      const explanation = getSectionExplanation(sectionIndex);
      setActiveSpokenText(explanation);
      setReadingSection(isAmharic ? `አስተማሪ፡ ክፍል 0${sectionIndex}` : `Teacher: Section 0${sectionIndex}`);
      playNeuralAudio(explanation, {
        voice: defaultVoice,
        readerId: `note-section-${sectionIndex}`,
        onEnd: () => setReadingSection(null),
        onError: () => setReadingSection(null),
      });
    },
    [getSectionExplanation, isAmharic, defaultVoice]
  );

  const playTeacherExplanationRef = useRef(playTeacherExplanation);
  useEffect(() => {
    playTeacherExplanationRef.current = playTeacherExplanation;
  });

  // Track previous note identifier to reset state ONLY when switching to a different note
  const currentNoteKey = (note as any)?.id || (note as any)?.lessonId || note?.title || null;
  const previousNoteKeyRef = useRef<string | null>(null);
  const lastSpokenNoteTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentNoteKey) {
      previousNoteKeyRef.current = null;
      return;
    }
    if (previousNoteKeyRef.current === null) {
      previousNoteKeyRef.current = currentNoteKey;
      return;
    }
    if (previousNoteKeyRef.current !== currentNoteKey) {
      previousNoteKeyRef.current = currentNoteKey;
      setViewMode(initialViewMode);
      const savedProgress = getLessonProgress(uid, effectiveCourseId, effectiveLessonId);
      setUnlockedSection(savedProgress?.unlockedSection || 1);
      setActiveSectionTab(savedProgress?.activeSectionTab || 1);
      setCheckpointInput('');
      setIsSideQuestionOpen(false);
      stopNeuralAudio();
      setReadingSection(null);
      setActiveSpokenText('');
    }
  }, [currentNoteKey, initialViewMode, uid, effectiveCourseId, effectiveLessonId]);

  // Persist lesson section progress automatically whenever section or tab changes
  useEffect(() => {
    if (typeof window === 'undefined' || !effectiveCourseId || !effectiveLessonId) return;
    saveLessonProgress(uid, effectiveCourseId, effectiveLessonId, {
      unlockedSection,
      activeSectionTab,
    });
  }, [uid, effectiveCourseId, effectiveLessonId, unlockedSection, activeSectionTab]);

  // Load saved side questions for current note from localStorage (scoped per language)
  useEffect(() => {
    if (!currentNoteKey || typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(`ater_side_questions_${currentNoteKey}_${language}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSideQuestionThreads(parsed);
          setActiveThreadId(parsed[parsed.length - 1].id);
        } else {
          setSideQuestionThreads([]);
          setActiveThreadId(null);
        }
      } else {
        setSideQuestionThreads([]);
        setActiveThreadId(null);
      }
    } catch {
      setSideQuestionThreads([]);
      setActiveThreadId(null);
    }
  }, [currentNoteKey, language]);

  const persistThreads = (threads: QaThread[]) => {
    setSideQuestionThreads(threads);
    if (!currentNoteKey || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`ater_side_questions_${currentNoteKey}_${language}`, JSON.stringify(threads));
    } catch (e) {
      console.warn('Failed to save side questions to localStorage:', e);
    }
  };

  // Auto-play teacher explanation when note is loaded and ready, strictly guarding against modal collisions
  useEffect(() => {
    if (note && note.title && !activeLoading && !isFeynmanOpen && !isIntakeOpen) {
      const voiceToken = `${effectiveCourseId || ''}_${effectiveLessonId || note.title}_${language}`;
      if (lastSpokenNoteTitleRef.current !== voiceToken) {
        lastSpokenNoteTitleRef.current = voiceToken;
        // Never auto-play over another actively speaking or paused voice reader
        if (getAudioPlaybackState() !== 'playing' && getAudioPlaybackState() !== 'paused') {
          playTeacherExplanationRef.current(activeSectionTab, sectionsConfig[activeSectionTab - 1]?.title);
        }
      }
    }
  }, [note?.title, activeLoading, isFeynmanOpen, isIntakeOpen, effectiveCourseId, effectiveLessonId, language, activeSectionTab, sectionsConfig]);

  // Audio Play / Pause toggle with Side Question priority
  const handleTogglePause = () => {
    if (playbackState === 'playing') {
      pauseNeuralAudio();
    } else if (playbackState === 'paused') {
      const activeReader = getActiveReaderId();
      if (activeReader === `note-section-${activeSectionTab}`) {
        resumeNeuralAudio();
      } else {
        playTeacherExplanation(activeSectionTab, sectionsConfig[activeSectionTab - 1]?.title);
      }
    } else {
      const activeThread = sideQuestionThreads.find((t) => t.id === activeThreadId);
      if (isSideQuestionOpen && activeThread && activeThread.turns.length > 0) {
        const latestTurn = activeThread.turns[activeThread.turns.length - 1];
        const textToPlay = latestTurn.answer;
        setActiveSpokenText(textToPlay);
        setReadingSection(isAmharic ? 'የአስተማሪ ምላሽ' : 'Teacher: Q&A');
        playNeuralAudio(textToPlay, {
          voice: defaultVoice,
          readerId: 'side-question-reader',
          onEnd: () => setReadingSection(null),
          onError: () => setReadingSection(null),
        });
        return;
      }
      playTeacherExplanation(activeSectionTab, sectionsConfig[activeSectionTab - 1]?.title);
    }
  };

  // Audio Restart / Retry: restarts spoken lecture for the active section
  const handleRestartAudio = () => {
    stopNeuralAudio();
    playTeacherExplanation(activeSectionTab, sectionsConfig[activeSectionTab - 1]?.title);
  };

  const toggleQuiz = (id: string) => {
    setRevealedQuiz((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const persistNoteState = useCallback(
    (updatedNote: DynamicLessonNote) => {
      if (typeof window === 'undefined' || !effectiveCourseId || !effectiveLessonId) return;
      try {
        const noteKey = `ater_note_${uid}_${effectiveCourseId}_${effectiveLessonId}`;
        localStorage.setItem(noteKey, JSON.stringify(updatedNote));
        saveNoteToStore(effectiveCourseId, effectiveLessonId, updatedNote, uid).catch(() => {});
        onNoteUpdate?.(updatedNote);
      } catch (e) {
        console.warn('Failed to persist note state:', e);
      }
    },
    [uid, effectiveCourseId, effectiveLessonId, onNoteUpdate]
  );

  const handleCheckpointSubmit = async (checkpointId: string) => {
    if (!checkpointInput.trim()) return;
    const submittedAnswer = checkpointInput.trim();
    setIsSubmittingCheckpoint(true);
    try {
      const markCp = (c?: LessonCheckpoint) => {
        if (c && (c.id === checkpointId || !c.id)) {
          c.studentAnswer = submittedAnswer;
          c.isAnswered = true;
        }
      };
      if (hasDynamicSections && dynamicNote?.sections) {
        dynamicNote.sections.forEach((s) => markCp(s.checkpoint));
      }
      if (dynamicNote?.checkpoints) {
        dynamicNote.checkpoints.forEach(markCp);
      }
      markCp(checkpoint);
      markCp(dynamicNote?.section4MidwayCheckpoint);

      if (onCheckpointStep) {
        await onCheckpointStep(checkpointId, submittedAnswer);
      } else {
        const res = await fetch('/api/lesson/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: effectiveLessonId,
            checkpointId,
            learnerInput: submittedAnswer,
            activeNoteContent: note,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (note && (note as any).mutations) {
            (note as any).mutations.push(data.synthesizedNoteAddendum);
            (note as any).section5SocraticSynthesis = data.synthesizedNoteAddendum;
          }
          if (data.passed) {
            setUnlockedSection(sectionsConfig.length);
            setActiveSectionTab(sectionsConfig.length);
          }
        }
      }

      if (note) {
        persistNoteState(note as DynamicLessonNote);
      }
      setCheckpointInput('');
    } finally {
      setIsSubmittingCheckpoint(false);
    }
  };

  // Ask teacher a question with Antigravity-style Side Question modal, 2s thinking simulation, and context persistence
  const handleAskQuestion = async (qText: string) => {
    if (!qText.trim() || isAskingTeacher) return;
    setIsAskingTeacher(true);
    setPendingQuestion(qText);
    setIsSideQuestionOpen(true);

    const activeThread = sideQuestionThreads.find((t) => t.id === activeThreadId) || null;
    const isFollowUp = isSideQuestionOpen && !!activeThread;
    const startTime = Date.now();

    try {
      const activeSectionTitle =
        activeSectionTab === 1
          ? 'Intuitive Mental Model'
          : activeSectionTab === 2
            ? 'Formal Purpose'
            : activeSectionTab === 3
              ? 'Operational Cycles'
              : activeSectionTab === 4
                ? 'Boundary Traps & Checkpoint'
                : 'Synthesis';

      // Pass previous turns if follow-up
      const history =
        isFollowUp && activeThread
          ? activeThread.turns.flatMap((turn) => [
              { role: 'user', content: turn.question },
              { role: 'assistant', content: `${turn.summary}\n${turn.answer}` },
            ])
          : [];

      const res = await fetch('/api/voice/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Question about ${note?.title} (${activeSectionTitle}): ${qText}`,
          activeNoteTitle: note?.title,
          language,
          history,
        }),
      });

      let teacherAnswer = isAmharic
        ? 'ተረድቻለሁ። ዋናውን መርህ እንመልከት።'
        : 'Understood. Focus on how the core invariant prevents invalid states.';
      let thought = isAmharic
        ? 'ዋናውን ፅንሰ-ሀሳብ እና የአሰራር ሂደት በመተንተን ላይ።'
        : 'Analyzing the core mental model and clarifying the causal mechanism.';
      let summary = isAmharic
        ? 'ዋናውን መርህ መረዳት ለስርዓቱ ጥንካሬ ቁልፍ ነው።'
        : 'Understanding this invariant anchors system correctness under stress.';

      if (res.ok) {
        const data = await res.json();
        if (data.spokenResponse) teacherAnswer = data.spokenResponse;
        if (data.thought) thought = data.thought;
        if (data.summary) summary = data.summary;
      }

      const finalDuration = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      const newTurn: QaTurn = {
        id: `turn_${Date.now()}`,
        question: qText,
        thought,
        thoughtDuration: finalDuration,
        summary,
        answer: teacherAnswer,
        timestamp: Date.now(),
      };

      let updatedThreads: QaThread[];
      if (isFollowUp && activeThread) {
        updatedThreads = sideQuestionThreads.map((t) => {
          if (t.id === activeThread.id) {
            return {
              ...t,
              turns: [...t.turns, newTurn],
            };
          }
          return t;
        });
      } else {
        const newThread: QaThread = {
          id: `thread_${Date.now()}`,
          noteKey: String(currentNoteKey || 'default'),
          title: qText,
          turns: [newTurn],
          createdAt: Date.now(),
        };
        updatedThreads = [...sideQuestionThreads, newThread];
        setActiveThreadId(newThread.id);
      }

      persistThreads(updatedThreads);

      // Vocalize response: only the transcript/explanation
      const spoken = teacherAnswer;
      stopNeuralAudio();
      setActiveSpokenText(spoken);
      setReadingSection(isAmharic ? 'የአስተማሪ ምላሽ' : 'Teacher: Q&A');
      playNeuralAudio(spoken, {
        voice: defaultVoice,
        readerId: 'side-question-reader',
        onEnd: () => setReadingSection(null),
        onError: () => setReadingSection(null),
      });
    } catch {
      const fallbackDuration = 2;
      const fallbackTurn: QaTurn = {
        id: `turn_${Date.now()}`,
        question: qText,
        thought: isAmharic ? 'መሰረታዊ መርሆችን በመገምገም ላይ።' : 'Reviewing foundational constraints.',
        thoughtDuration: fallbackDuration,
        summary: isAmharic ? 'መሰረታዊ መርሆችን እንመርምር።' : 'Let us focus on foundational invariants.',
        answer: isAmharic
          ? 'ይህንን ግልጽ ለማድረግ መሰረታዊ መርሆችን እንመርምር።'
          : 'Let us focus on the foundational invariants to clear up this doubt.',
        timestamp: Date.now(),
      };

      const newThread: QaThread = {
        id: `thread_${Date.now()}`,
        noteKey: String(currentNoteKey || 'default'),
        title: qText,
        turns: [fallbackTurn],
        createdAt: Date.now(),
      };
      const updatedThreads = [...sideQuestionThreads, newThread];
      setActiveThreadId(newThread.id);
      persistThreads(updatedThreads);
    } finally {
      setIsAskingTeacher(false);
      setPendingQuestion('');
    }
  };

  // Unlock and advance to the next section
  const handleAdvanceSection = (nextSec: number) => {
    stopNeuralAudio();
    setReadingSection(null);
    if (nextSec > unlockedSection) {
      setUnlockedSection(nextSec);
    }
    setActiveSectionTab(nextSec);
    playTeacherExplanation(nextSec, `Section 0${nextSec}`);
  };

  if (activeLoading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#fbf7f0] dark:bg-zinc-950 p-8 text-zinc-400 gap-3">
        <div className="w-5 h-5 border-[1.5px] border-parchment-300 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-sans">
          {isAmharic ? 'ትምህርቱን በማዘጋጀት ላይ...' : 'Compiling lesson note...'}
        </p>
      </main>
    );
  }

  if (!note) {
    const starterTopics = isAmharic
      ? ['የተመልካቾች ማሳያ (Viewer Demo)', 'የተሰራጩ ስርዓቶች እና ኮረም', 'የትራንስፎርመር አሰራር እና አቴንሽን', 'የኦፕሬቲንግ ሲስተም ሜሞሪ']
      : [
          'Viewer Demo',
          'Distributed Systems & Raft Consensus',
          'Transformer Architecture & Self-Attention',
          'Operating System Virtual Memory & Paging',
        ];

    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#fbf7f0] dark:bg-zinc-950 p-8 font-sans overflow-y-auto">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-parchment-300 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-parchment-200/60 dark:bg-zinc-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
            <span>{isAmharic ? 'የሶቅራጥስ እውቀት ሞተር' : 'Socratic Cognitive Engine'}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
              {isAmharic ? 'ዛሬ ምን መማር ይፈልጋሉ?' : 'What would you like to master today?'}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
              {isAmharic
                ? 'ርዕስ ያስገቡ ወይም የፒዲኤፍ ሰነድ በማስገባት የሶቅራጥስ የቃል ምዘና ቃለ-መጠይቅ ይጀምሩ።'
                : 'Enter any topic, prompt, or drop a PDF syllabus to calibrate your baseline through a spoken Socratic interview.'}
            </p>
          </div>

          {onOpenIntakeModal && (
            <div>
              <button
                onClick={onOpenIntakeModal}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-medium rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm"
              >
                {isAmharic ? '+ አዲስ የትምህርት ጉዞ ጀምር' : '+ Start New Learning Journey'}
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-parchment-300 dark:border-zinc-800/80 space-y-2.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
              {isAmharic ? 'ፈጣን መነሻ ርዕሶች' : 'Quick Start Inspiration'}
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {starterTopics.map((topicItem) => (
                <button
                  key={topicItem}
                  onClick={onOpenIntakeModal}
                  className="px-2.5 py-1 text-[11px] rounded-lg border border-parchment-300 dark:border-zinc-800 hover:border-parchment-400 dark:hover:border-zinc-600 bg-parchment-200/50 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {topicItem}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const renderCheckpoint = (cp?: LessonCheckpoint) => {
    if (!cp) return null;
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-sans">
          <span className="uppercase text-[10px] text-zinc-700 dark:text-zinc-300 font-semibold tracking-wider">
            {t.socraticCheckpoint}
          </span>
          <button
            type="button"
            onClick={() => {
              stopNeuralAudio();
              playNeuralAudio(cp.spokenPrompt || cp.question, {
                voice: defaultVoice,
                readerId: 'note-checkpoint-prompt',
              });
            }}
            className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            {t.playAudio}
          </button>
        </div>

        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {cp.question}
        </p>

        {cp.isAnswered ? (
          <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {isAmharic ? 'የእርስዎ ምላሽ' : 'Your Answer'}:
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {isAmharic ? 'ተመልሷል' : 'Completed'}
              </span>
            </div>
            <p className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
              {cp.studentAnswer}
            </p>
            {cp.evaluation && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{cp.evaluation.feedback}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={checkpointInput}
                onChange={(e) => setCheckpointInput(e.target.value)}
                onFocus={() => setFocusedInput('checkpoint')}
                onBlur={() => setFocusedInput(null)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckpointSubmit(cp.id)}
                placeholder={t.typeSynthesis}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 pr-7"
              />
              <InputVoiceIndicator
                isFocused={focusedInput === 'checkpoint'}
                isProcessingOverride={isSubmittingCheckpoint && focusedInput === 'checkpoint'}
                language={language}
                className="top-2.5 right-2"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleCheckpointSubmit(cp.id)}
                disabled={isSubmittingCheckpoint || !checkpointInput.trim()}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-700/80 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmittingCheckpoint ? '...' : t.submitCheckpoint}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Active quote for "What the Agent Just Said"
  const currentDisplayedSpeech = activeSpokenText || getSectionExplanation(activeSectionTab);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fbf7f0] dark:bg-zinc-950 font-sans relative">
      {/* Top Header Bar with Audio Controls & Actions */}
      <header className="border-b border-parchment-300/80 dark:border-zinc-800/80 px-6 py-3 flex items-center justify-between gap-3 shrink-0 bg-[#fbf7f0] dark:bg-zinc-950 z-10">
        <div>
          <h1 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {note.title.replace(/^(\d+\s*[\cdot·\-–—]\s*)+/u, '').trim()}
          </h1>
          {readingSection && (
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
              <span>{readingSection}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Play/Pause Button */}
          <button
            type="button"
            onClick={handleTogglePause}
            aria-label={playbackState === 'playing' ? t.pauseAudio : t.resumeAudio}
            className="p-1.5 rounded-lg border border-parchment-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-parchment-200/80 dark:bg-zinc-900 hover:bg-parchment-300 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
            title={playbackState === 'playing' ? t.pauseAudio : t.resumeAudio}
          >
            {playbackState === 'playing' ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
                <span className="text-[11px] hidden sm:inline">{t.pauseAudio}</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                <span className="text-[11px] hidden sm:inline">{playbackState === 'paused' ? t.resumeAudio : t.playAudio}</span>
              </>
            )}
          </button>

          {/* Audio Restart Button */}
          <button
            type="button"
            onClick={handleRestartAudio}
            aria-label={t.restartAudio}
            className="p-1.5 rounded-lg border border-parchment-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-parchment-200/80 dark:bg-zinc-900 hover:bg-parchment-300 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
            title={t.restartAudio}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-[11px] hidden sm:inline">{t.restartAudio}</span>
          </button>

          {/* View Mode Toggle: Summary | Transcription */}
          <div className="flex items-center rounded-lg border border-parchment-300 dark:border-zinc-800 p-0.5 bg-parchment-200/70 dark:bg-zinc-900 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'interactive'
                  ? 'bg-parchment-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {isAmharic ? 'ማጠቃለያ' : 'Summary'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'full'
                  ? 'bg-parchment-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {isAmharic ? 'ጽሑፍ' : 'Transcription'}
            </button>
          </div>


          {/* Reset Demo / New Journey button (integrated cleanly to prevent overlap) */}
          {onResetDemo && (
            <button
              type="button"
              onClick={onResetDemo}
              aria-label={isAmharic ? 'ከመጀመሪያ ጀምር' : 'Restart demo'}
              title={isAmharic ? 'ከመጀመሪያ ጀምር' : 'Restart demo'}
              className="p-1.5 rounded-lg border border-parchment-300 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-parchment-200 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-xs cursor-pointer ml-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Body: Left Lessons Sidebar + Center Scrollable Note Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Lessons Sidebar */}
        {curriculum && curriculum.lessons && curriculum.lessons.length > 0 && (
          <aside
            aria-label="Course lessons"
            className="w-60 sm:w-72 bg-transparent flex flex-col shrink-0 overflow-hidden select-none"
          >
            <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
              {/* Vertical Card Stack Container mirroring the section stepper style */}
              <div className="flex flex-col gap-1.5 p-1 rounded-2xl bg-parchment-200/60 dark:bg-zinc-900/60 border border-parchment-300/70 dark:border-zinc-800/60">
                {curriculum.lessons.map((lesson) => {
                  const isSelected = lesson.id === activeLessonId || (note as any)?.lessonId === lesson.id;
                  const isLocked = lesson.status === 'locked';
                  const cleanLessonTitle = lesson.title.replace(/^(\d+\s*[\cdot·\-–—]\s*)+/u, '').trim();
                  // Only treat as mini-lesson if explicitly marked as remediation sub-lesson or has parentLessonId
                  // (Crucial: do not treat parent lesson whose status is 'remediation' as a mini-lesson)
                  const isMiniLesson = Boolean(lesson.isRemediation || lesson.parentLessonId || (lesson.id.endsWith('b') && !lesson.id.startsWith('lesson-')));

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => !isLocked && onSelectLesson && onSelectLesson(lesson)}
                      title={cleanLessonTitle}
                      className={`text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                        isMiniLesson ? 'ml-4 pl-2.5 w-[calc(100%-1rem)] bg-parchment-100/70 dark:bg-zinc-900/40 border border-dashed border-parchment-300 dark:border-zinc-800' : 'w-full'
                      } ${
                        isSelected
                          ? 'bg-parchment-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs border border-parchment-300 dark:border-zinc-700/80'
                          : isLocked
                            ? 'text-zinc-400 dark:text-zinc-600 opacity-40 cursor-not-allowed'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-parchment-100 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md mt-0.5 shrink-0 ${
                          isSelected
                            ? 'bg-parchment-200 dark:bg-zinc-700/80 text-zinc-900 dark:text-zinc-100 font-semibold'
                            : isMiniLesson
                              ? 'bg-parchment-300/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold'
                              : 'bg-parchment-200/50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {isMiniLesson ? (isAmharic ? 'ክለሳ' : 'Mini') : lesson.order ? String(Math.floor(lesson.order)).padStart(2, '0') : ''}
                      </span>
                      <span className="text-xs leading-snug line-clamp-2 flex-1">
                        {cleanLessonTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Main Canvas Column: scrollable content + static bottom ask teacher bar */}
        <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
          {/* Scrollable Lesson Area */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
            <div className="max-w-3xl w-full mx-auto space-y-4 pb-8">

            {/* Stepper Progression Navigation Bar (Section tabs: Intuition, Framework, etc.) */}
            <nav aria-label="Lesson sections" className="flex items-center gap-1.5 p-1 rounded-xl bg-parchment-200/70 dark:bg-zinc-900/60 border border-parchment-300/70 dark:border-zinc-800/60">
              {sectionsConfig.map((sec) => {
                const isUnlocked = sec.num <= unlockedSection;
                const isActive = sec.num === activeSectionTab;
                return (
                  <button
                    key={sec.num}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => {
                      setActiveSectionTab(sec.num);
                      playTeacherExplanation(sec.num, sec.title);
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-center transition-colors ${
                      isActive
                        ? 'bg-parchment-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                        : isUnlocked
                          ? 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          : 'text-zinc-400 dark:text-zinc-600 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="block text-[11px] truncate">
                      {sec.short}
                    </span>
                  </button>
                );
              })}
            </nav>

          {/* STEPS VIEW MODE (Focused Stepper with Dynamic Sections & Smooth Navigation) */}
          {viewMode === 'interactive' && (
            <div className="space-y-4">
              {hasDynamicSections ? (
                (() => {
                  const activeSec = sectionsConfig.find((s) => s.num === activeSectionTab) || sectionsConfig[0];
                  if (!activeSec) return null;
                  const isFinalSec = activeSec.num === sectionsConfig.length;

                  return (
                    <article className="space-y-4 rounded-2xl border border-parchment-300 dark:border-zinc-800/70 bg-parchment-50/90 dark:bg-zinc-900/30 p-5 shadow-xs animate-in fade-in duration-150">
                      <div className="border-b border-parchment-200 dark:border-zinc-800/60 pb-2.5 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {activeSec.title}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {String(activeSec.num).padStart(2, '0')} / {String(sectionsConfig.length).padStart(2, '0')}
                        </span>
                      </div>

                      <RichContentRenderer content={activeSec.content} />

                      {activeSec.inlineMCQs && activeSec.inlineMCQs.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {activeSec.inlineMCQs.map((q) => (
                            <InlineMCQCard
                              key={q.id}
                              mcq={q}
                              language={language}
                              onAnswerChange={() => {
                                if (note) persistNoteState(note as DynamicLessonNote);
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {renderCheckpoint(activeSec.checkpoint)}

                      {isFinalSec && (
                        <>
                          {mutations.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                {isAmharic ? 'የተዋሃዱ ማስታወሻዎች' : 'Integrated Notes'}
                              </span>
                              {mutations.map((mut, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800/60"
                                >
                                  <RichContentRenderer content={mut} />
                                </div>
                              ))}
                            </div>
                          )}

                          {provingGrounds.length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                              <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                                {t.provingGrounds}
                              </h4>
                              {provingGrounds.map((q) => (
                                <div
                                  key={q.id}
                                  className="p-4 rounded-xl border border-parchment-300 dark:border-zinc-800/80 bg-parchment-100/60 dark:bg-zinc-900/40 space-y-3"
                                >
                                  <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-parchment-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                                    {q.difficulty}
                                  </span>
                                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                                    {q.question}
                                  </p>
                                  {q.options && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                      {Object.entries(q.options).map(([optKey, optVal]) => (
                                        <div
                                          key={optKey}
                                          className="p-2.5 rounded-lg border border-parchment-300/80 dark:border-zinc-800/60 bg-parchment-50 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300"
                                        >
                                          <span className="font-semibold mr-1.5 text-zinc-900 dark:text-zinc-100">
                                            {optKey}:
                                          </span>
                                          {optVal}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="pt-2 flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => toggleQuiz(q.id)}
                                      className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                    >
                                      {revealedQuiz[q.id] ? t.hideAnswer : t.revealAnswer}
                                    </button>
                                    {revealedQuiz[q.id] && (
                                      <div className="text-xs text-zinc-700 dark:text-zinc-300 font-sans">
                                        <span className="font-semibold">{q.answer}</span> - {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {!curriculum?.disableGate && (
                            <div className="pt-4 border-t border-parchment-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-parchment-100/80 dark:bg-zinc-900/60 border border-parchment-300 dark:border-zinc-800/80">
                              <div>
                                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                  {isAmharic ? 'የቃል መከላከያ · ማስተሪን አረጋግጥ' : 'Defense · Prove Mastery'}
                                </h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                  {isAmharic
                                    ? 'የ3 ጥልቅ ክፍት ጥያቄዎችን የቃል ፈተና በማለፍ ትምህርቱን ማስተር ያድርጉ እና ቀጣዩን ይክፈቱ።'
                                    : 'Answer 3 progressively challenging questions to prove complete mastery and unlock the next lesson.'}
                                </p>
                              </div>
                              {onOpenFeynman && (
                                <button
                                  type="button"
                                  onClick={onOpenFeynman}
                                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-parchment-400 dark:border-zinc-700 transition-all shrink-0 cursor-pointer shadow-xs"
                                >
                                  {isAmharic ? 'የቃል መከላከያ ጀምር' : 'Enter Defense'}
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  );
                })()
              ) : (
                /* Legacy 5-tab structure fallback */
                <>
                  {/* Section 1: Core Intuition */}
                  {activeSectionTab === 1 && (
                    <article className="space-y-3 rounded-2xl border border-parchment-300 dark:border-zinc-800/70 bg-parchment-50/90 dark:bg-zinc-900/30 p-5 shadow-xs animate-in fade-in duration-150">
                      <div className="border-b border-parchment-200 dark:border-zinc-800/60 pb-2.5">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.sections.sec1Full}
                        </h3>
                      </div>
                      <RichContentRenderer content={section1Text} />
                      {sectionQuestions(1).map((q) => (
                        <InlineMCQCard
                          key={q.id}
                          mcq={q}
                          language={language}
                          onAnswerChange={() => {
                            if (note) persistNoteState(note as DynamicLessonNote);
                          }}
                        />
                      ))}
                    </article>
                  )}

                  {/* Section 2: Framework */}
                  {activeSectionTab === 2 && (
                    <article className="space-y-3 rounded-2xl border border-parchment-300 dark:border-zinc-800/70 bg-parchment-50/90 dark:bg-zinc-900/30 p-5 shadow-xs animate-in fade-in duration-150">
                      <div className="border-b border-parchment-200 dark:border-zinc-800/60 pb-2.5">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.sections.sec2Full}
                        </h3>
                      </div>
                      <RichContentRenderer content={section2Text} />
                      {sectionQuestions(2).map((q) => (
                        <InlineMCQCard
                          key={q.id}
                          mcq={q}
                          language={language}
                          onAnswerChange={() => {
                            if (note) persistNoteState(note as DynamicLessonNote);
                          }}
                        />
                      ))}
                    </article>
                  )}

                  {/* Section 3: Mechanism */}
                  {activeSectionTab === 3 && (
                    <article className="space-y-3 rounded-2xl border border-parchment-300 dark:border-zinc-800/70 bg-parchment-50/90 dark:bg-zinc-900/30 p-5 shadow-xs animate-in fade-in duration-150">
                      <div className="border-b border-parchment-200 dark:border-zinc-800/60 pb-2.5">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.sections.sec3Full}
                        </h3>
                      </div>
                      <RichContentRenderer content={section3Text} />
                      {sectionQuestions(3).map((q) => (
                        <InlineMCQCard
                          key={q.id}
                          mcq={q}
                          language={language}
                          onAnswerChange={() => {
                            if (note) persistNoteState(note as DynamicLessonNote);
                          }}
                        />
                      ))}
                    </article>
                  )}

                  {/* Section 4: Boundary Traps & Socratic Midway Checkpoint */}
                  {activeSectionTab === 4 && (
                    <article className="space-y-4 rounded-2xl border border-parchment-300 dark:border-zinc-800/70 bg-parchment-50/90 dark:bg-zinc-900/30 p-5 shadow-xs animate-in fade-in duration-150">
                      <div className="border-b border-parchment-200 dark:border-zinc-800/60 pb-2.5">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.sections.sec4Full}
                        </h3>
                      </div>

                      {section4Boundary && (
                        <RichContentRenderer content={section4Boundary} />
                      )}

                      {artifactCode && (
                        dynamicNote?.artifactLanguage === 'mermaid' ? (
                          <MermaidViewer code={artifactCode} />
                        ) : dynamicNote?.artifactLanguage === 'diff' ? (
                          <CodeViewer code={artifactCode} isDiff={true} language="diff" />
                        ) : dynamicNote?.artifactLanguage === 'math' ? (
                          <MathViewer math={artifactCode} displayMode={true} />
                        ) : dynamicNote?.artifactLanguage === 'table' ? (
                          <TableViewer content={artifactCode} />
                        ) : dynamicNote?.artifactLanguage === 'timeline' ? (
                          <TimelineViewer content={artifactCode} />
                        ) : dynamicNote?.artifactLanguage === 'interactive' ? (
                          <InteractiveCanvasViewer code={artifactCode} title={note.title} />
                        ) : (
                          <CodeViewer code={artifactCode} language={dynamicNote?.artifactLanguage || 'typescript'} />
                        )
                      )}

                      {renderCheckpoint(checkpoint)}
                    </article>
                  )}

                  {/* Section 5: Real-Time Mutations & Socratic Synthesis */}
                  {activeSectionTab === 5 && (
                    <article className="space-y-4 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/30 p-5 shadow-sm animate-in fade-in duration-150">
                      <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.sections.sec5Full}
                        </h3>
                      </div>

                      <RichContentRenderer content={section5Text} />

                      {mutations.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                            {isAmharic ? 'የተዋሃዱ ማስታወሻዎች' : 'Integrated Notes'}
                          </span>
                          {mutations.map((mut, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800/60"
                            >
                              <RichContentRenderer content={mut} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Proving Grounds */}
                      {provingGrounds.length > 0 && (
                        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                          <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                            {t.provingGrounds}
                          </h4>
                          {provingGrounds.map((q) => (
                            <div
                              key={q.id}
                              className="p-4 rounded-xl border border-parchment-300 dark:border-zinc-800/80 bg-parchment-100/60 dark:bg-zinc-900/40 space-y-3"
                            >
                              <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-parchment-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                                {q.difficulty}
                              </span>
                              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                                {q.question}
                              </p>
                              {q.options && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {Object.entries(q.options).map(([optKey, optVal]) => (
                                    <div
                                      key={optKey}
                                      className="p-2.5 rounded-lg border border-parchment-300/80 dark:border-zinc-800/60 bg-parchment-50 dark:bg-zinc-950 text-xs text-zinc-700 dark:text-zinc-300"
                                    >
                                      <span className="font-semibold mr-1.5 text-zinc-900 dark:text-zinc-100">
                                        {optKey}:
                                      </span>
                                      {optVal}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="pt-2 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => toggleQuiz(q.id)}
                                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                >
                                  {revealedQuiz[q.id] ? t.hideAnswer : t.revealAnswer}
                                </button>
                                {revealedQuiz[q.id] && (
                                  <div className="text-xs text-zinc-700 dark:text-zinc-300 font-sans">
                                    <span className="font-semibold">{q.answer}</span> - {q.explanation}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Defense Launch Card (Hidden if disableGate is true on curriculum) */}
                      {!curriculum?.disableGate && (
                        <div className="pt-4 border-t border-parchment-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-parchment-100/80 dark:bg-zinc-900/60 border border-parchment-300 dark:border-zinc-800/80">
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {isAmharic ? 'የቃል መከላከያ · ማስተሪን አረጋግጥ' : 'Defense · Prove Mastery'}
                            </h4>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                              {isAmharic
                                ? 'የ3 ጥልቅ ክፍት ጥያቄዎችን የቃል ፈተና በማለፍ ትምህርቱን ማስተር ያድርጉ እና ቀጣዩን ይክፈቱ።'
                                : 'Answer 3 progressively challenging questions to prove complete mastery and unlock the next lesson.'}
                            </p>
                          </div>
                          {onOpenFeynman && (
                            <button
                              type="button"
                              onClick={onOpenFeynman}
                              className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-parchment-400 dark:border-zinc-700 transition-all shrink-0 cursor-pointer shadow-xs"
                            >
                              {isAmharic ? 'የቃል መከላከያ ጀምር' : 'Enter Defense'}
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  )}
                </>
              )}

              {/* Step Advancement CTA */}
              <div className="flex justify-between items-center pt-2">
                {activeSectionTab > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSectionTab(activeSectionTab - 1);
                      playTeacherExplanation(activeSectionTab - 1, sectionsConfig[activeSectionTab - 2]?.title);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-parchment-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-parchment-100/70 hover:bg-parchment-200 dark:bg-transparent transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>←</span>
                    <span>{isAmharic ? 'ተመለስ' : 'Previous'}</span>
                  </button>
                ) : <div />}

                {activeSectionTab < sectionsConfig.length ? (
                  <button
                    type="button"
                    onClick={() => handleAdvanceSection(activeSectionTab + 1)}
                    className="px-4 py-2 text-xs font-medium rounded-lg bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-parchment-400 dark:border-zinc-750 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>{isAmharic ? 'ቀጥል' : 'Continue'}</span>
                    <span>→</span>
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* TRANSCRIPTION VIEW MODE (Single active section spoken lecture transcript only) */}
          {viewMode === 'full' && (() => {
            const activeSec = sectionsConfig.find((s) => s.num === activeSectionTab) || sectionsConfig[0];
            if (!activeSec) return null;
            const isFinalSec = activeSec.num === sectionsConfig.length;
            const transcript =
              activeSec.teacherExplanation ||
              (dynamicNote?.teacherExplanations &&
                (dynamicNote.teacherExplanations as any)['section' + activeSec.num]) ||
              getSectionExplanation(activeSec.num);

            return (
              <div className="space-y-4">
                <article className="space-y-4 rounded-2xl border border-parchment-300 dark:border-zinc-800/70 bg-parchment-50/90 dark:bg-zinc-900/30 p-5 shadow-xs animate-in fade-in duration-150">
                  <div className="border-b border-parchment-200 dark:border-zinc-800/60 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-parchment-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                        {String(activeSec.num).padStart(2, '0')}
                      </span>
                      <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {activeSec.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playTeacherExplanation(activeSec.num, activeSec.title)}
                        className="text-[11px] font-mono flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-parchment-200/80 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer shadow-2xs"
                        title={isAmharic ? 'የንግግር ትምህርቱን አዳምጥ' : 'Listen to Spoken Lecture'}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        <span>{isAmharic ? 'አዳምጥ' : 'Listen'}</span>
                      </button>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {String(activeSec.num).padStart(2, '0')} / {String(sectionsConfig.length).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Single Column Lecture Transcript (Only what the AI says) */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white/70 dark:bg-zinc-950/70 border border-parchment-300/80 dark:border-zinc-800/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                        {isAmharic ? 'የአስተማሪ ንግግር ጽሑፍ' : 'Spoken Lecture Transcript'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {isAmharic ? 'ክፍል ' + activeSec.num : 'Section ' + activeSec.num}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans whitespace-pre-line">
                      {transcript}
                    </p>
                  </div>

                  {isFinalSec && !curriculum?.disableGate && onOpenFeynman && (
                    <div className="pt-4 border-t border-parchment-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-parchment-100/80 dark:bg-zinc-900/60 border border-parchment-300 dark:border-zinc-800/80">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {isAmharic ? 'የቃል መከላከያ · ማስተሪን አረጋግጥ' : 'Defense · Prove Mastery'}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          {isAmharic
                            ? 'የ3 ጥልቅ ክፍት ጥያቄዎችን የቃል ፈተና በማለፍ ትምህርቱን ማስተር ያድርጉ እና ቀጣዩን ይክፈቱ።'
                            : 'Answer 3 progressively challenging questions to prove complete mastery and unlock the next lesson.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenFeynman}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-parchment-400 dark:border-zinc-700 transition-all shrink-0 cursor-pointer shadow-xs"
                      >
                        {isAmharic ? 'የቃል መከላከያ ጀምር' : 'Enter Defense'}
                      </button>
                    </div>
                  )}
                </article>

                {/* Step Advancement CTA */}
                <div className="flex justify-between items-center pt-2">
                  {activeSectionTab > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSectionTab(activeSectionTab - 1);
                        playTeacherExplanation(activeSectionTab - 1, sectionsConfig[activeSectionTab - 2]?.title);
                      }}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-parchment-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-parchment-100/70 hover:bg-parchment-200 dark:bg-transparent transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>←</span>
                      <span>{isAmharic ? 'ተመለስ' : 'Previous'}</span>
                    </button>
                  ) : <div />}

                  {activeSectionTab < sectionsConfig.length ? (
                    <button
                      type="button"
                      onClick={() => handleAdvanceSection(activeSectionTab + 1)}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-parchment-400 dark:border-zinc-750 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>{isAmharic ? 'ቀጥል' : 'Continue'}</span>
                      <span>→</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })()}
        </div>

          </main>

          {/* Reopen Side Questions pill if past questions exist and modal is closed */}
          {!isSideQuestionOpen && sideQuestionThreads.length > 0 && (
            <div className="flex justify-center -mb-2 z-20">
              <button
                type="button"
                onClick={() => setIsSideQuestionOpen(true)}
                className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80 text-[11px] text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>{isAmharic ? `ጥያቄዎች (${sideQuestionThreads.length})` : `Questions (${sideQuestionThreads.length})`}</span>
              </button>
            </div>
          )}

          {/* Static Bottom "Ask Teacher" Bar */}
          <AskTeacherBar
            onAsk={handleAskQuestion}
            isLoading={isAskingTeacher}
            language={language}
            disabled={activeLoading}
            placeholder={
              isSideQuestionOpen
                ? (isAmharic ? 'ተጨማሪ ጥያቄ ይጠይቁ...' : 'Ask a follow-up question...')
                : undefined
            }
            className={isSideQuestionOpen ? 'relative z-40' : ''}
          />

          {/* Question Pop-up Card inside main canvas column for centered alignment */}
          <SideQuestionModal
            isOpen={isSideQuestionOpen}
            activeThread={sideQuestionThreads.find((t) => t.id === activeThreadId) || null}
            allThreads={sideQuestionThreads}
            isLoading={isAskingTeacher}
            pendingQuestion={pendingQuestion}
            onClose={() => {
              setIsSideQuestionOpen(false);
              stopNeuralAudio();
              setReadingSection(null);
            }}
            onSelectThread={(threadId) => setActiveThreadId(threadId)}
            language={language}
            defaultVoice={defaultVoice}
            containerClassName="inset-x-0 sm:left-60 lg:left-72 sm:right-0"
          />
        </div>

      </div>
    </div>
  );
};
