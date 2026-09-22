'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Search, Sliders, User, Settings, Sun, Moon, LogOut, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { LeftDrawer } from '@/components/LeftDrawer';
import { NoteCanvas } from '@/components/dashboard/NoteCanvas';
import { IntakeModal } from '@/components/intake/IntakeModal';
import { FeynmanModal } from '@/components/dashboard/FeynmanModal';
import { ErrorBanner } from '@/components/ErrorBanner';
import { useVoiceBridge } from '@/components/voice/VoxideProvider';
import { playNeuralAudio, stopNeuralAudio } from '@/lib/voice/ttsClient';
import { translations, type AppLanguage } from '@/lib/i18n/translations';
import { generateFallbackCurriculum } from '@/lib/curriculum/generator';
import {
  getArtifactsShowcaseCurriculum,
  getQuestionsShowcaseCurriculum,
  getShowcaseLessonNote,
} from '@/lib/curriculum/showcaseCourses';
import { saveCourseToStore, saveNoteToStore, getCoursesFromStore, deleteCourseFromStore, clearUserSessionCache } from '@/lib/sync/store';
import { checkIsAdmin, checkUserAppAccess } from '@/lib/auth/admins';
import type {
  CourseCurriculum,
  RoadmapLesson,
  DynamicLessonNote,
  FeynmanEvaluation,
} from '@/types';

export default function AterCognitiveStudio() {
  const router = useRouter();
  const voiceBridge = useVoiceBridge();
  const [currentView, setCurrentView] = useState<'library' | 'study'>('library');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [curriculum, setCurriculum] = useState<CourseCurriculum | null>(null);
  const [activeLesson, setActiveLesson] = useState<RoadmapLesson | null>(null);
  const [activeNote, setActiveNote] = useState<DynamicLessonNote | null>(null);
  const [savedCourses, setSavedCourses] = useState<CourseCurriculum[]>([]);
  const [savedNotes, setSavedNotes] = useState<DynamicLessonNote[]>([]);

  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);
  const [isCompilingNote, setIsCompilingNote] = useState(false);
  const [isEvaluatingFeynman, setIsEvaluatingFeynman] = useState(false);
  const [feynmanEvaluation, setFeynmanEvaluation] = useState<FeynmanEvaluation | null>(null);

  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isFeynmanModalOpen, setIsFeynmanModalOpen] = useState(false);
  const [latestRemediationLesson, setLatestRemediationLesson] = useState<RoadmapLesson | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useMockFallback, setUseMockFallback] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [isStudioEnabled, setIsStudioEnabled] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ater_enable_notebooklm_studio');
      if (stored !== null) {
        setIsStudioEnabled(stored === 'true');
      }
    } catch {}
  }, []);

  const handleToggleStudio = () => {
    const nextVal = !isStudioEnabled;
    setIsStudioEnabled(nextVal);
    try {
      localStorage.setItem('ater_enable_notebooklm_studio', String(nextVal));
    } catch {}
    // Broadcast storage event or reload state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session?.user?.email) {
          router.push('/auth?mode=login&redirect=/app');
          return;
        }

        const email = session.user.email;
        setCurrentUserEmail(email);

        // Verify that user is either an admin or has approved waitlist status
        const access = await checkUserAppAccess(email);
        setCurrentUserIsAdmin(access.isAdmin);

        if (!access.allowed) {
          // Block unapproved users and redirect them to auth status page
          router.push('/auth');
          return;
        }
      });
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [router]);

  const [appLanguage, setAppLanguage] = useState<AppLanguage>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const noteCacheRef = useRef<Record<string, { en?: DynamicLessonNote; am?: DynamicLessonNote }>>({});
  const curriculumCacheRef = useRef<Record<string, { en?: CourseCurriculum; am?: CourseCurriculum }>>({});
  const hasHydratedRef = useRef(false);

  // Instant translation toggle handler with bidirectional caching for both note and curriculum
  const handleToggleLanguage = async (newLang: AppLanguage) => {
    if (newLang === appLanguage) return;
    setAppLanguage(newLang);
    voiceBridge.setLanguage(newLang);
    try {
      localStorage.setItem('ater_global_language', newLang);
    } catch {}

    // 1. Translate Curriculum if present
    if (curriculum) {
      const curKey = curriculum.id || 'default_curriculum';
      const existingCurCache = curriculumCacheRef.current[curKey] || {};
      existingCurCache[appLanguage] = curriculum;
      curriculumCacheRef.current[curKey] = existingCurCache;

      if (existingCurCache[newLang]) {
        const transCur = existingCurCache[newLang]!;
        setCurriculum(transCur);
        if (activeLesson) {
          const matchingLesson = transCur.lessons?.find((l) => l.id === activeLesson.id);
          if (matchingLesson) setActiveLesson(matchingLesson);
        }
      } else {
        fetch('/api/ai/translate-curriculum', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ curriculum, targetLanguage: newLang }),
        })
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data?.translatedCurriculum) {
              existingCurCache[newLang] = data.translatedCurriculum;
              curriculumCacheRef.current[curKey] = existingCurCache;
              try {
                localStorage.setItem('ater_bilingual_curricula', JSON.stringify(curriculumCacheRef.current));
              } catch {}
              setCurriculum(data.translatedCurriculum);
              if (activeLesson) {
                const matchingLesson = data.translatedCurriculum.lessons?.find(
                  (l: any) => l.id === activeLesson.id
                );
                if (matchingLesson) setActiveLesson(matchingLesson);
              }
            }
          })
          .catch((e) => console.warn('Curriculum translation error:', e));
      }
    }

    if (!activeNote) return;

    const noteKey = String(activeNote.lessonId || activeNote.id || 'default_note');
    const existingCache = noteCacheRef.current[noteKey] || {};

    // Save current activeNote under the previous language
    existingCache[appLanguage] = activeNote;
    noteCacheRef.current[noteKey] = existingCache;

    // Fast path: if the target language note is already cached, restore immediately
    if (existingCache[newLang]) {
      setActiveNote(existingCache[newLang]!);
      return;
    }

    // Otherwise fetch translation from Gemini
    setIsTranslating(true);
    try {
      const res = await fetch('/api/ai/translate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: activeNote, targetLanguage: newLang }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translatedNote) {
          existingCache[newLang] = data.translatedNote;
          noteCacheRef.current[noteKey] = existingCache;
          try {
            localStorage.setItem('ater_bilingual_notes', JSON.stringify(noteCacheRef.current));
          } catch {}
          setActiveNote(data.translatedNote);
        }
      }
    } catch (e) {
      console.warn('Language translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const persistCourses = useCallback((courses: CourseCurriculum[]) => {
    setSavedCourses(courses);
    try {
      localStorage.setItem('ater_curricula', JSON.stringify(courses));
    } catch (_e) {}
    // Background sync to Supabase
    courses.forEach((c) => {
      saveCourseToStore(c).catch(() => {});
    });
  }, []);

  const persistNotes = useCallback((notes: DynamicLessonNote[]) => {
    setSavedNotes(notes);
    try {
      localStorage.setItem('ater_notes', JSON.stringify(notes));
    } catch (_e) {}
    // Background sync to Supabase
    if (curriculum?.id) {
      notes.forEach((n) => {
        const lessonId = String(n.lessonId || n.id || '');
        if (lessonId) {
          saveNoteToStore(curriculum.id, lessonId, n).catch(() => {});
        }
      });
    }
  }, [curriculum?.id]);

  // Dynamically compile note via Gemini for a selected lesson
  const loadLesson = useCallback(
    async (lesson: RoadmapLesson, courseId?: string, forceRefresh = false) => {
      setActiveLesson(lesson);
      setErrorMessage(null);
      setFeynmanEvaluation(null);

      const noteKey = String(lesson.id || 'default_note');
      const cachedNote = noteCacheRef.current[noteKey]?.[appLanguage];

      // Showcase courses check: always return the authoritative showcase lesson note
      const showcaseNote = getShowcaseLessonNote(lesson.id, appLanguage);
      if (showcaseNote && !forceRefresh) {
        setActiveNote(showcaseNote);
        const currentCache = noteCacheRef.current[noteKey] || {};
        currentCache[appLanguage] = showcaseNote;
        noteCacheRef.current[noteKey] = currentCache;
        setIsCompilingNote(false);
        return;
      }

      // Ultra-fast instant path: if lesson note is already cached, render immediately (< 5ms)
      if (cachedNote && !forceRefresh) {
        setActiveNote(cachedNote);
        setIsCompilingNote(false);
        return;
      }

      // Check savedNotes in local state as secondary cache, validating language match
      const storedNote = savedNotes.find(
        (n) => (n.lessonId === lesson.id || n.id === lesson.id || n.id === `note-${lesson.id}`)
      );
      const isStoredAmharic = !!(storedNote && /[\u1200-\u137F]/.test(storedNote.title || storedNote.mentalModel || ''));
      const storedMatchesLang = storedNote && (appLanguage === 'am' ? isStoredAmharic : !isStoredAmharic);

      if (storedNote && storedMatchesLang && !forceRefresh) {
        setActiveNote(storedNote);
        const currentCache = noteCacheRef.current[noteKey] || {};
        currentCache[appLanguage] = storedNote;
        noteCacheRef.current[noteKey] = currentCache;
        setIsCompilingNote(false);
        return;
      }

      setIsCompilingNote(true);

      try {
        let res = await fetch('/api/ai/compile-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            courseId: courseId || curriculum?.id,
            useMock: useMockFallback,
            language: appLanguage,
          }),
        });

        // Resilient fallback: if network/API fails, retry with mock fallback
        if (!res.ok && !useMockFallback) {
          res = await fetch('/api/ai/compile-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId: lesson.id,
              title: lesson.title,
              summary: lesson.summary,
              courseId: courseId || curriculum?.id,
              useMock: true,
              language: appLanguage,
            }),
          });
        }

        if (!res.ok) {
          throw new Error(`Failed to compile note for "${lesson.title}"`);
        }

        const note: DynamicLessonNote = await res.json();
        setActiveNote(note);

        const currentCache = noteCacheRef.current[noteKey] || {};
        currentCache[appLanguage] = note;
        noteCacheRef.current[noteKey] = currentCache;

        const updated = [note, ...savedNotes.filter((n) => n.id !== note.id)];
        persistNotes(updated);

        try {
          localStorage.setItem('ater_bilingual_notes', JSON.stringify(noteCacheRef.current));
        } catch {}

        // Proactively pre-translate to alternate language on the spot so language toggle is instant
        const altLang: AppLanguage = appLanguage === 'en' ? 'am' : 'en';
        if (!currentCache[altLang]) {
          fetch('/api/ai/translate-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note, targetLanguage: altLang }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data?.translatedNote) {
                currentCache[altLang] = data.translatedNote;
                noteCacheRef.current[noteKey] = currentCache;
                try {
                  localStorage.setItem('ater_bilingual_notes', JSON.stringify(noteCacheRef.current));
                } catch {}
              }
            })
            .catch((_e) => {});
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load lesson note.');
      } finally {
        setIsCompilingNote(false);
      }
    },
    [curriculum?.id, savedNotes, useMockFallback, appLanguage, persistNotes]
  );

  const prefetchingInFlightRef = useRef<Set<string>>(new Set());

  // Background prefetch function to compile next/subsequent lessons silently during idle time
  const prefetchLesson = useCallback(
    async (lesson: RoadmapLesson, courseId?: string) => {
      const noteKey = String(lesson.id || 'default_note');
      if (noteCacheRef.current[noteKey]?.[appLanguage]) return;
      if (prefetchingInFlightRef.current.has(noteKey)) return;

      prefetchingInFlightRef.current.add(noteKey);
      try {
        const res = await fetch('/api/ai/compile-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            courseId: courseId || curriculum?.id,
            useMock: useMockFallback,
            language: appLanguage,
          }),
        });
        if (res.ok) {
          const note: DynamicLessonNote = await res.json();
          const currentCache = noteCacheRef.current[noteKey] || {};
          currentCache[appLanguage] = note;
          noteCacheRef.current[noteKey] = currentCache;

          try {
            localStorage.setItem('ater_bilingual_notes', JSON.stringify(noteCacheRef.current));
          } catch {}

          const altLang: AppLanguage = appLanguage === 'en' ? 'am' : 'en';
          if (!currentCache[altLang]) {
            fetch('/api/ai/translate-note', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ note, targetLanguage: altLang }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => {
                if (data?.translatedNote) {
                  currentCache[altLang] = data.translatedNote;
                  noteCacheRef.current[noteKey] = currentCache;
                  try {
                    localStorage.setItem('ater_bilingual_notes', JSON.stringify(noteCacheRef.current));
                  } catch {}
                }
              })
              .catch((_e) => {});
          }
        }
      } catch (_e) {
      } finally {
        prefetchingInFlightRef.current.delete(noteKey);
      }
    },
    [curriculum?.id, useMockFallback, appLanguage]
  );

  // Idle sequential prefetching of roadmap lessons so navigating lessons is instant
  useEffect(() => {
    if (!curriculum?.lessons || curriculum.lessons.length === 0) return;

    let isMounted = true;
    const uncachedLessons = curriculum.lessons.filter(
      (l) => !noteCacheRef.current[String(l.id)]?.[appLanguage]
    );

    if (uncachedLessons.length === 0) return;

    // Prefetch sequentially in background with idle spacing to avoid bandwidth contention
    const timer = setTimeout(async () => {
      for (const lesson of uncachedLessons.slice(0, 3)) {
        if (!isMounted) break;
        await prefetchLesson(lesson, curriculum.id);
        // Small pause between background fetches
        await new Promise((r) => setTimeout(r, 600));
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [curriculum, appLanguage, prefetchLesson]);

  // Load persistence once when app mounts
  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    try {
      const savedLang = localStorage.getItem('ater_global_language') as AppLanguage | null;
      if (savedLang === 'am' || savedLang === 'en') {
        setAppLanguage(savedLang);
        voiceBridge.setLanguage(savedLang);
      }

      // Check active user to prevent cross-account cache leaks
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          const currentUid = session?.user?.id || 'anon';
          const lastUid = localStorage.getItem('ater_last_session_uid');
          if (lastUid && lastUid !== currentUid) {
            clearUserSessionCache();
          }
          localStorage.setItem('ater_last_session_uid', currentUid);
        });
      }

      const storedBilingualNotes = localStorage.getItem('ater_bilingual_notes');
      if (storedBilingualNotes) {
        try {
          const parsed = JSON.parse(storedBilingualNotes);
          if (parsed && typeof parsed === 'object') {
            noteCacheRef.current = { ...parsed, ...noteCacheRef.current };
          }
        } catch {}
      }

      const storedBilingualCurricula = localStorage.getItem('ater_bilingual_curricula');
      if (storedBilingualCurricula) {
        try {
          const parsed = JSON.parse(storedBilingualCurricula);
          if (parsed && typeof parsed === 'object') {
            curriculumCacheRef.current = { ...parsed, ...curriculumCacheRef.current };
          }
        } catch {}
      }

      const storedNotes = localStorage.getItem('ater_notes');
      if (storedNotes) {
        const parsed = JSON.parse(storedNotes);
        if (Array.isArray(parsed)) {
          setSavedNotes(parsed);
          parsed.forEach((note: DynamicLessonNote) => {
            const key = String(note.lessonId || note.id);
            if (!noteCacheRef.current[key]) {
              noteCacheRef.current[key] = {};
            }
            const isAm = /[\u1200-\u137F]/.test(note.title || note.mentalModel || '');
            const langKey: AppLanguage = isAm ? 'am' : 'en';
            noteCacheRef.current[key][langKey] = note;
          });
        }
      }

      const artifactsShowcase = getArtifactsShowcaseCurriculum(savedLang || 'en');
      const questionsShowcase = getQuestionsShowcaseCurriculum(savedLang || 'en');

      const storedCurricula = localStorage.getItem('ater_curricula');
      let initialCourses: CourseCurriculum[] = [artifactsShowcase, questionsShowcase];
      if (storedCurricula) {
        try {
          const parsed = JSON.parse(storedCurricula);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = parsed.filter(
              (c: any) =>
                c.id !== 'course-viewer-demo' &&
                !c.topic?.toLowerCase().includes('viewer demo') &&
                c.id !== 'course-artifacts-showcase' &&
                c.id !== 'course-questions-showcase'
            );
            initialCourses = [artifactsShowcase, questionsShowcase, ...filtered];
          }
        } catch {}
      }
      // Check if a specific course or view was requested (via query param or localStorage)
      let targetCourseId: string | null = null;
      let targetView: string | null = null;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        targetCourseId = urlParams.get('courseId') || localStorage.getItem('ater_active_course_id');
        targetView = urlParams.get('view');
        // Clean up one-time active course id flag
        localStorage.removeItem('ater_active_course_id');
      }

      setSavedCourses(initialCourses);
      if (initialCourses.length > 0) {
        const selected = (targetCourseId ? initialCourses.find((c) => c.id === targetCourseId) : null) || initialCourses[0];
        setCurriculum(selected);
        if (targetView === 'study' || (targetCourseId && selected.id === targetCourseId)) {
          setCurrentView('study');
        }
        if (selected?.lessons?.[0]) {
          loadLesson(selected.lessons[0], selected.id);
        }
      }

      // Sync courses from Supabase/Store to pick up real persisted courses
      getCoursesFromStore()
        .then((cloudCourses) => {
          if (Array.isArray(cloudCourses)) {
            const cleanCloud = cloudCourses.filter(
              (c) =>
                c.id !== 'course-viewer-demo' &&
                !c.topic?.toLowerCase().includes('viewer demo') &&
                c.id !== 'course-artifacts-showcase' &&
                c.id !== 'course-questions-showcase'
            );
            const merged = [artifactsShowcase, questionsShowcase, ...cleanCloud];
            setSavedCourses(merged);
            try {
              localStorage.setItem('ater_curricula', JSON.stringify(merged));
            } catch {}
            if (merged.length > 0) {
              const target = (targetCourseId ? merged.find((c) => c.id === targetCourseId) : null) || merged[0];
              setCurriculum((prev) => (targetCourseId ? target : prev || target));
              if (target?.lessons?.[0]) {
                loadLesson(target.lessons[0], target.id);
              }
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to hydrate cloud courses:', err);
        });
    } catch (_e) {}
  }, [loadLesson]);

  // Listen for agent commands (via Supabase Realtime or local broadcast)
  useEffect(() => {
    const handleAgentCommand = (e: any) => {
      const { command, payload, lesson_id, course_id } = e?.detail || {};
      if (!command) return;

      if (command === 'NAVIGATE_LESSON' || command === 'SELECT_LESSON') {
        const targetLessonId = payload?.lessonId || lesson_id;
        const targetSlug = payload?.slug;
        const matching = curriculum?.lessons?.find(
          (l) => l.id === targetLessonId || l.slug === targetSlug
        );
        if (matching) {
          setCurrentView('study');
          loadLesson(matching, curriculum?.id);
        }
      } else if (command === 'TRIGGER_GATE' || command === 'OPEN_GATE') {
        setIsFeynmanModalOpen(true);
      } else if (command === 'CLOSE_GATE') {
        setIsFeynmanModalOpen(false);
      } else if (command === 'SET_LANGUAGE') {
        const newLang = payload?.language;
        if (newLang === 'en' || newLang === 'am') {
          handleToggleLanguage(newLang);
        }
      } else if (command === 'LOAD_COURSE' || command === 'SELECT_COURSE') {
        const targetCourseId = payload?.courseId || course_id;
        const matchingCourse = savedCourses.find((c) => c.id === targetCourseId);
        if (matchingCourse) {
          setCurriculum(matchingCourse);
          setCurrentView('study');
          if (matchingCourse.lessons?.[0]) {
            loadLesson(matchingCourse.lessons[0], matchingCourse.id);
          }
        } else if (targetCourseId) {
          getCoursesFromStore().then((cloudCourses) => {
            const freshMatch = cloudCourses.find((c) => c.id === targetCourseId);
            if (freshMatch) {
              setSavedCourses((prev) => {
                const map = new Map<string, CourseCurriculum>();
                prev.forEach((c) => map.set(c.id, c));
                cloudCourses.forEach((c) => map.set(c.id, c));
                return Array.from(map.values());
              });
              setCurriculum(freshMatch);
              setCurrentView('study');
              if (freshMatch.lessons?.[0]) {
                loadLesson(freshMatch.lessons[0], freshMatch.id);
              }
            }
          }).catch(() => {});
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ater:agent_command', handleAgentCommand as EventListener);
      return () => {
        window.removeEventListener('ater:agent_command', handleAgentCommand as EventListener);
      };
    }
  }, [curriculum, savedCourses, loadLesson, handleToggleLanguage]);

  // Delete a course, cleaning active curriculum/lesson/notes if needed
  const handleDeleteCourse = useCallback(
    (courseId: string) => {
      deleteCourseFromStore(courseId).catch((err) => console.warn('Delete course error:', err));
      const updated = savedCourses.filter((c) => c.id !== courseId);
      persistCourses(updated);

      if (curriculum?.id === courseId) {
        if (updated.length > 0) {
          setCurriculum(updated[0]);
          if (updated[0].lessons?.[0]) {
            loadLesson(updated[0].lessons[0], updated[0].id);
          } else {
            setActiveLesson(null);
            setActiveNote(null);
          }
        } else {
          setCurriculum(null);
          setActiveLesson(null);
          setActiveNote(null);
          setCurrentView('library');
        }
      }
    },
    [savedCourses, curriculum?.id, loadLesson, persistCourses]
  );

  // Delete a single lesson from the active curriculum
  const handleDeleteLesson = useCallback(
    (lessonId: string) => {
      if (!curriculum) return;
      const updatedLessons = curriculum.lessons.filter((l) => l.id !== lessonId);
      const updatedCurriculum: CourseCurriculum = {
        ...curriculum,
        lessons: updatedLessons,
      };
      setCurriculum(updatedCurriculum);

      const updatedCourses = savedCourses.map((c) =>
        c.id === curriculum.id ? updatedCurriculum : c
      );
      persistCourses(updatedCourses);

      // If the deleted lesson was active, switch to another or clear
      if (activeLesson?.id === lessonId) {
        if (updatedLessons.length > 0) {
          loadLesson(updatedLessons[0], curriculum.id);
        } else {
          setActiveLesson(null);
          setActiveNote(null);
        }
      }
    },
    [curriculum, savedCourses, activeLesson?.id, loadLesson, persistCourses]
  );

  // Handle dynamic course creation from IntakeModal
  const handleCurriculumCreated = useCallback(
    (newCurriculum: CourseCurriculum) => {
      setCurriculum(newCurriculum);
      const updated = [newCurriculum, ...savedCourses.filter((c) => c.id !== newCurriculum.id)];
      persistCourses(updated);

      const curKey = newCurriculum.id || 'default_curriculum';
      const existingCurCache = curriculumCacheRef.current[curKey] || {};
      existingCurCache[appLanguage] = newCurriculum;
      curriculumCacheRef.current[curKey] = existingCurCache;
      try {
        localStorage.setItem('ater_bilingual_curricula', JSON.stringify(curriculumCacheRef.current));
      } catch {}

      // Proactively pre-translate curriculum to alternate language so roadmap is instant
      const altLang: AppLanguage = appLanguage === 'en' ? 'am' : 'en';
      fetch('/api/ai/translate-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculum: newCurriculum, targetLanguage: altLang }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.translatedCurriculum) {
            existingCurCache[altLang] = data.translatedCurriculum;
            curriculumCacheRef.current[curKey] = existingCurCache;
            try {
              localStorage.setItem('ater_bilingual_curricula', JSON.stringify(curriculumCacheRef.current));
            } catch {}
          }
        })
        .catch((_e) => {});

      if (newCurriculum.lessons && newCurriculum.lessons.length > 0) {
        loadLesson(newCurriculum.lessons[0], newCurriculum.id);
      }
      setCurrentView('study');
    },
    [savedCourses, loadLesson, persistCourses, appLanguage]
  );

  // Oral / Written Feynman sparring evaluation
  const handleFeynmanSubmit = useCallback(
    async (explanation: string): Promise<FeynmanEvaluation | null> => {
      if (!activeNote || !activeLesson || !curriculum) return null;
      setIsEvaluatingFeynman(true);
      setErrorMessage(null);

      try {
        const isAmharic = appLanguage === 'am';
        const res = await fetch('/api/ai/feynman-evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            concept: activeNote.title,
            explanation,
            useMock: useMockFallback,
            language: appLanguage,
          }),
        });

        if (!res.ok) {
          throw new Error(`Evaluation failed with status ${res.status}`);
        }

        const evaluation: FeynmanEvaluation = await res.json();
        setFeynmanEvaluation(evaluation);

        // Vocalize evaluation via Edge Neural TTS
        if (evaluation.spokenFeedback) {
          playNeuralAudio(evaluation.spokenFeedback, {
            voice: isAmharic ? 'am-ET-AmehaNeural' : 'en-US-JennyNeural',
            readerId: 'feynman-feedback',
          });
        }

        // Socratic Adaptive Remediation Check: score < 8 triggers micro-remediation sub-lesson
        if (evaluation.score < 8) {
          try {
            const remRes = await fetch('/api/curriculum/remediate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                courseId: curriculum.id,
                failedLessonId: activeLesson.id,
                misconceptions: evaluation.misconceptions || evaluation.detectedMisconceptions || ['Core causal invariant gap'],
                learnerExplanation: explanation,
                failedLesson: activeLesson,
                lessons: curriculum.lessons,
                useMock: useMockFallback,
              }),
            });

            if (remRes.ok) {
              const remData = await remRes.json();
              if (remData.remediationLesson) {
                setLatestRemediationLesson(remData.remediationLesson);
              }
              const updatedCurriculum: CourseCurriculum = {
                ...curriculum,
                lessons: remData.updatedLessons,
              };
              setCurriculum(updatedCurriculum);
              persistCourses([
                updatedCurriculum,
                ...savedCourses.filter((c) => c.id !== updatedCurriculum.id),
              ]);
            }
          } catch (remErr) {
            console.error('Failed to splice remediation lesson:', remErr);
          }
        } else {
          // Mastered: mark lesson mastered and unlock next lesson
          const updatedLessons = curriculum.lessons.map((l, idx, arr) => {
            if (l.id === activeLesson.id) {
              return { ...l, status: 'mastered' as const };
            }
            if (idx > 0 && arr[idx - 1].id === activeLesson.id && l.status === 'locked') {
              return { ...l, status: 'active' as const };
            }
            return l;
          });

          const updatedCurriculum: CourseCurriculum = {
            ...curriculum,
            lessons: updatedLessons,
          };
          setCurriculum(updatedCurriculum);
          persistCourses([
            updatedCurriculum,
            ...savedCourses.filter((c) => c.id !== updatedCurriculum.id),
          ]);
        }

        return evaluation;
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to evaluate Feynman explanation.');
        return null;
      } finally {
        setIsEvaluatingFeynman(false);
      }
    },
    [activeNote, activeLesson, curriculum, savedCourses, useMockFallback]
  );

  const handleOpenRemediation = useCallback(async () => {
    setIsFeynmanModalOpen(false);
    const target =
      latestRemediationLesson ||
      curriculum?.lessons.find(
        (l) =>
          l.isRemediation ||
          l.parentLessonId === activeLesson?.id ||
          l.status === 'remediation' ||
          l.id.includes('remediation') ||
          l.id.endsWith('b')
      );
    if (target) {
      await loadLesson(target);
    }
  }, [latestRemediationLesson, curriculum, activeLesson?.id, loadLesson]);

  const handleContinueNextLesson = useCallback(async () => {
    setIsFeynmanModalOpen(false);
    if (!curriculum || !activeLesson) return;
    const currentIndex = curriculum.lessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIndex >= 0 && currentIndex + 1 < curriculum.lessons.length) {
      const nextLesson = curriculum.lessons[currentIndex + 1];
      await loadLesson(nextLesson);
    }
  }, [curriculum, activeLesson, loadLesson]);

  useEffect(() => {
    voiceBridge.registerPageHandlers({
      onSearch: async (_q) => [],
      onCompile: async (title) => {
        const dummyLesson: RoadmapLesson = {
          id: `voice-${Date.now()}`,
          order: 1,
          title,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          summary: `Exploration of ${title}`,
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
        };
        await loadLesson(dummyLesson);
        return null;
      },
      onEvaluate: async (_concept, exp) => {
        const ev = await handleFeynmanSubmit(exp);
        return ev;
      },
      onOpenFeynman: () => {
        setIsFeynmanModalOpen(true);
      },
      getActiveState: () => ({
        activeNoteTitle: activeNote?.title,
        papers: [],
      }),
    });
  }, [voiceBridge, handleFeynmanSubmit, loadLesson, activeNote?.title]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fbf7f0] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Top Header */}
      {currentView === 'library' ? (
        <header className="h-14 bg-[#fbf7f0] dark:bg-zinc-950 px-6 flex items-center justify-between shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <Link
            href="/"
            className="text-xl md:text-2xl font-black tracking-tighter uppercase font-sans text-zinc-900 dark:text-zinc-100 flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span>ATER</span>
            <span className="text-xl md:text-2xl font-black opacity-60">አጠር</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Language Toggle: English / Amharic */}
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs">
              <button
                type="button"
                onClick={() => handleToggleLanguage('en')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  appLanguage === 'en'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage('am')}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  appLanguage === 'am'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                አማርኛ
              </button>
            </div>

            {/* Admin Console Header Button for Admins */}
            {currentUserIsAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Open Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </Link>
            )}

            {/* Profile Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Account & Settings"
                aria-label="Account & Settings"
              >
                <User className="w-4 h-4" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl p-2 z-50 space-y-1 text-xs font-sans animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                      {appLanguage === 'am' ? 'መለያ' : 'Account'}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">
                      {currentUserEmail || 'Learner'}
                    </span>
                  </div>

                  <Link
                    href="/research"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{appLanguage === 'am' ? 'የምርምር ጣቢያ' : 'Research Station'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleToggleStudio}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{appLanguage === 'am' ? 'ማስታወሻ ስቱዲዮ' : 'Enable Studio'}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isStudioEnabled ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      {isStudioEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <Link
                    href="/auth"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{appLanguage === 'am' ? 'ቅንብሮች እና ሁኔታ' : 'Settings & Status'}</span>
                  </Link>

                  {currentUserIsAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{appLanguage === 'am' ? 'የአድሚን ዳሽቦርድ' : 'Admin Dashboard'}</span>
                    </Link>
                  )}

                  <Link
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{appLanguage === 'am' ? 'ወደ መነሻ ገጽ' : 'Return to Home'}</span>
                  </Link>

                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                    <button
                      onClick={async () => {
                        const supabase = getSupabaseBrowserClient();
                        if (supabase) {
                          await supabase.auth.signOut();
                        }
                        clearUserSessionCache();
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{appLanguage === 'am' ? 'ውጣ' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      ) : (
        <header className="h-11 bg-[#fbf7f0] dark:bg-zinc-950 px-4 flex items-center justify-between shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentView('library')}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-1 rounded"
              title={appLanguage === 'am' ? 'ወደ ቤተ-መጽሐፍት ተመለስ' : 'Back to Library'}
            >
              <ArrowLeft size={14} />
              <span className="font-medium">{appLanguage === 'am' ? 'ቤተ-መጽሐፍት' : 'Library'}</span>
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-xs text-zinc-500 font-sans truncate max-w-xs sm:max-w-md">
              {curriculum?.topic}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Language Toggle: English / Amharic */}
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs">
              <button
                type="button"
                onClick={() => handleToggleLanguage('en')}
                className={`px-2 py-0.5 rounded text-[11px] transition-all ${
                  appLanguage === 'en'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage('am')}
                className={`px-2 py-0.5 rounded text-[11px] transition-all ${
                  appLanguage === 'am'
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                አማርኛ
              </button>
            </div>

            {/* Admin Console Header Button for Admins */}
            {currentUserIsAdmin && (
              <Link
                href="/admin"
                className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                title="Open Admin Dashboard"
              >
                <ShieldCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                title="Account & Settings"
                aria-label="Account & Settings"
              >
                <User className="w-3.5 h-3.5" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl p-2 z-50 space-y-1 text-xs font-sans animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                      {appLanguage === 'am' ? 'መለያ' : 'Account'}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">
                      {currentUserEmail || 'Learner'}
                    </span>
                  </div>

                  <Link
                    href="/research"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{appLanguage === 'am' ? 'የምርምር ጣቢያ' : 'Research Station'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleToggleStudio}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{appLanguage === 'am' ? 'ማስታወሻ ስቱዲዮ' : 'Enable Studio'}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isStudioEnabled ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                      {isStudioEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <Link
                    href="/auth"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{appLanguage === 'am' ? 'ቅንብሮች እና ሁኔታ' : 'Settings & Status'}</span>
                  </Link>

                  {currentUserIsAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{appLanguage === 'am' ? 'የአድሚን ዳሽቦርድ' : 'Admin Dashboard'}</span>
                    </Link>
                  )}

                  <Link
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{appLanguage === 'am' ? 'ወደ መነሻ ገጽ' : 'Return to Home'}</span>
                  </Link>

                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                    <button
                      onClick={async () => {
                        const supabase = getSupabaseBrowserClient();
                        if (supabase) {
                          await supabase.auth.signOut();
                        }
                        clearUserSessionCache();
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{appLanguage === 'am' ? 'ውጣ' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          useMockFallback={useMockFallback}
          onToggleFallback={() => setUseMockFallback((v) => !v)}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Main Content Area */}
      {currentView === 'library' ? (
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl w-full mx-auto font-sans">
          <div className="mb-8 pt-4">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
              {appLanguage === 'am' ? 'ዛሬ ምን እንማራለን?' : 'What are we learning today?'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              {appLanguage === 'am'
                ? 'አዲስ የትምህርት ርዕስ ይጀምሩ ወይም ካስቀመጧቸው ኮርሶች ይቀጥሉ።'
                : 'Start a new personalized course or resume where you left off.'}
            </p>
          </div>

          {/* Gallery View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Box 1: Create Course */}
            <button
              type="button"
              onClick={() => setIsIntakeModalOpen(true)}
              className="group flex flex-col items-center justify-center min-h-[190px] p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 bg-zinc-50/60 dark:bg-zinc-900/30 transition-all text-center cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full border border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-900 dark:group-hover:border-zinc-100 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 mb-3 transition-colors">
                <Plus size={18} />
              </div>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                {appLanguage === 'am' ? '+ አዲስ ኮርስ ፍጠር' : '+ Create Course'}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                {appLanguage === 'am' ? 'በጥያቄ ወይም በፒዲኤፍ ጀምር' : 'Prompt or PDF upload'}
              </span>
            </button>

            {/* Saved Course Cards */}
            {savedCourses.map((c) => {
              const masteredCount = c.lessons.filter((l) => l.status === 'mastered').length;
              const totalCount = c.lessons.length;
              const progress = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setCurriculum(c);
                    if (c.lessons?.[0]) {
                      loadLesson(c.lessons[0], c.id);
                    }
                    setCurrentView('study');
                  }}
                  className="group relative flex flex-col justify-between min-h-[190px] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                        {totalCount} {appLanguage === 'am' ? 'ትምህርቶች' : 'Lessons'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded transition-opacity"
                        title={appLanguage === 'am' ? 'ኮርሱን ሰርዝ' : 'Delete course'}
                        aria-label="Delete course"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                      {c.title || c.topic}
                    </h2>

                    {c.targetGoal && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                        {c.targetGoal}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    <span>
                      {masteredCount}/{totalCount} {appLanguage === 'am' ? 'የተጠናቀቀ' : 'Completed'}
                    </span>
                    <span>{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      ) : (
        /* Study View: Note Canvas (Right sidebar completely removed) */
        <div className="flex-1 flex overflow-hidden">
          <NoteCanvas
            note={activeNote}
            curriculum={curriculum}
            activeLessonId={activeLesson?.id}
            onSelectLesson={(lesson) => loadLesson(lesson, curriculum?.id)}
            savedCourses={savedCourses}
            onSelectCourse={(c) => {
              setCurriculum(c);
              if (c.lessons?.[0]) {
                loadLesson(c.lessons[0], c.id);
              }
            }}
            isLoading={isCompilingNote || isTranslating}
            onFeynmanSubmit={handleFeynmanSubmit}
            feynmanEvaluation={feynmanEvaluation}
            isEvaluatingFeynman={isEvaluatingFeynman}
            onOpenFeynman={() => setIsFeynmanModalOpen(true)}
            onOpenIntakeModal={() => setIsIntakeModalOpen(true)}
            initialViewMode="interactive"
            language={appLanguage}
            isFeynmanOpen={isFeynmanModalOpen}
            isIntakeOpen={isIntakeModalOpen}
            isStudioEnabled={isStudioEnabled}
          />
        </div>
      )}

      {/* Dual Intake Modal */}
      <IntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onCurriculumCreated={handleCurriculumCreated}
        useMock={useMockFallback}
        language={appLanguage}
      />

      {/* Feynman Sparring Modal Gate */}
      {activeNote && (
        <FeynmanModal
          isOpen={isFeynmanModalOpen}
          concept={activeNote.title}
          lessonId={activeLesson?.id || activeNote.lessonId}
          tabooWords={activeNote.feynmanCriteria?.tabooWords || []}
          onClose={() => setIsFeynmanModalOpen(false)}
          onOpenRemediation={handleOpenRemediation}
          onContinueNextLesson={handleContinueNextLesson}
          language={appLanguage}
          onEvaluate={async (_concept, exp) => {
            const ev = await handleFeynmanSubmit(exp);
            return (
              ev || {
                score: 5,
                passed: false,
                causalAccuracy: 'Evaluation unavailable',
                misconceptions: [],
                spokenFeedback: 'Could not evaluate response.',
              }
            );
          }}
        />
      )}
    </div>
  );
}
