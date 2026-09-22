import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { CourseCurriculum, DynamicLessonNote, SocraticGateSession, RoadmapLesson, LabArtifact } from '@/types';

function getClient() {
  if (typeof window !== 'undefined') {
    return getSupabaseBrowserClient();
  }
  return getSupabaseServerClient();
}

/**
 * Gets the current authenticated user's ID if available.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getClient();
  if (!supabase) return null;
  try {
    const { data: authData } = await supabase.auth.getSession();
    return authData?.session?.user?.id || null;
  } catch (_e) {
    return null;
  }
}

/**
 * Clears all user session and cached courses/notes from localStorage on sign-out.
 */
export function clearUserSessionCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove = [
      'ater_courses',
      'ater_curricula',
      'ater_notes',
      'ater_bilingual_notes',
      'ater_bilingual_curricula',
      'ater_active_course_id',
      'ater_current_user_id',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    // Also remove any note-specific or user-scoped keys
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) allKeys.push(k);
    }
    // Also check Object.keys for mocked environments
    Object.keys(localStorage).forEach((k) => {
      if (!allKeys.includes(k)) allKeys.push(k);
    });

    allKeys.forEach((key) => {
      if (
        key.startsWith('ater_note_') ||
        key.startsWith('ater_courses_') ||
        key.startsWith('ater_curricula_') ||
        key.startsWith('sb-') // Purge Supabase auth tokens
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('Failed to clear user session cache:', e);
  }
}

/**
 * Saves a course and its roadmap lessons to Supabase with local fallback.
 */
export async function saveCourseToStore(course: CourseCurriculum): Promise<void> {
  const userId = await getCurrentUserId();

  // 1. Local Storage Fallback (scoped per user if logged in)
  if (typeof window !== 'undefined') {
    try {
      const storageKey = userId ? `ater_courses_${userId}` : 'ater_courses';
      const stored = localStorage.getItem(storageKey);
      const courses: CourseCurriculum[] = stored ? JSON.parse(stored) : [];
      const idx = courses.findIndex((c) => c.id === course.id);
      if (idx >= 0) {
        courses[idx] = course;
      } else {
        courses.push(course);
      }
      localStorage.setItem(storageKey, JSON.stringify(courses));
      localStorage.setItem('ater_courses', JSON.stringify(courses));
    } catch (e) {
      console.warn('Local storage save course failed:', e);
    }
  }

  // 2. Supabase Persistence
  const supabase = getClient();
  if (!supabase) return;

  try {
    const totalLessons = course.lessons?.length || 0;
    const completedLessons = course.lessons?.filter((l) => l.status === 'mastered').length || 0;

    const coursePayload: Record<string, any> = {
      id: course.id,
      topic: course.topic,
      title: course.title || course.topic,
      description: course.targetGoal || '',
      language: 'en',
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    if (userId) {
      coursePayload.user_id = userId;
    }

    const { error: courseErr } = await supabase.from('ater_courses').upsert(coursePayload);

    if (courseErr) {
      console.warn('Supabase course upsert error:', courseErr);
      return;
    }

    if (course.lessons && course.lessons.length > 0) {
      const lessonRows = course.lessons.map((lesson, idx) => {
        const row: Record<string, any> = {
          id: lesson.id,
          course_id: course.id,
          order_index: lesson.order ?? idx,
          slug: lesson.slug || `lesson-${idx + 1}`,
          title: lesson.title,
          description: lesson.summary || lesson.description || '',
          estimated_minutes: lesson.estimatedMinutes || 15,
          status: lesson.status || 'locked',
          is_remediation: !!lesson.isRemediation,
          parent_lesson_id: lesson.parentLessonId || null,
          updated_at: new Date().toISOString(),
        };
        if (userId) {
          row.user_id = userId;
        }
        return row;
      });

      const { error: lessonErr } = await supabase.from('ater_lessons').upsert(lessonRows);
      if (lessonErr) {
        console.warn('Supabase lessons upsert error:', lessonErr);
      }
    }
  } catch (err) {
    console.warn('Failed to persist course to Supabase:', err);
  }
}

/**
 * Deletes a course, its lessons, and notes from Supabase and local storage.
 */
export async function deleteCourseFromStore(courseId: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (typeof window !== 'undefined') {
    try {
      const storageKey = userId ? `ater_courses_${userId}` : 'ater_courses';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const courses: CourseCurriculum[] = JSON.parse(stored);
        localStorage.setItem(
          storageKey,
          JSON.stringify(courses.filter((c) => c.id !== courseId))
        );
      }
      const genericStored = localStorage.getItem('ater_courses');
      if (genericStored) {
        const courses: CourseCurriculum[] = JSON.parse(genericStored);
        localStorage.setItem(
          'ater_courses',
          JSON.stringify(courses.filter((c) => c.id !== courseId))
        );
      }
      const curriculaStored = localStorage.getItem('ater_curricula');
      if (curriculaStored) {
        const list: CourseCurriculum[] = JSON.parse(curriculaStored);
        localStorage.setItem(
          'ater_curricula',
          JSON.stringify(list.filter((c) => c.id !== courseId))
        );
      }
    } catch (e) {
      console.warn('Local storage delete course failed:', e);
    }
  }

  const supabase = getClient();
  if (!supabase) return;

  try {
    let query = supabase.from('ater_notes').delete().eq('course_id', courseId);
    if (userId) query = query.eq('user_id', userId);
    await query;

    let lQuery = supabase.from('ater_lessons').delete().eq('course_id', courseId);
    if (userId) lQuery = lQuery.eq('user_id', userId);
    await lQuery;

    let cQuery = supabase.from('ater_courses').delete().eq('id', courseId);
    if (userId) cQuery = cQuery.eq('user_id', userId);
    await cQuery;
  } catch (err) {
    console.warn('Failed to delete course from Supabase:', err);
  }
}

/**
 * Retrieves all courses for the active user, merging Supabase and localStorage.
 */
export async function getCoursesFromStore(): Promise<CourseCurriculum[]> {
  const userId = await getCurrentUserId();
  const localCourses: CourseCurriculum[] = [];

  if (typeof window !== 'undefined') {
    try {
      const storageKey = userId ? `ater_courses_${userId}` : 'ater_courses';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        localCourses.push(...JSON.parse(stored));
      } else if (!userId) {
        const fallback = localStorage.getItem('ater_courses');
        if (fallback) localCourses.push(...JSON.parse(fallback));
      }
    } catch (e) {
      console.warn('Local storage get courses error:', e);
    }
  }

  const supabase = getClient();
  if (!supabase) return localCourses;

  try {
    let courseQuery = supabase.from('ater_courses').select('*');
    if (userId) {
      courseQuery = courseQuery.eq('user_id', userId);
    } else {
      // If unauthenticated, do not return private user courses
      return localCourses;
    }

    const { data: dbCourses, error: cErr } = await courseQuery.order('updated_at', { ascending: false });

    if (cErr || !dbCourses || dbCourses.length === 0) {
      return localCourses;
    }

    const courseIds = dbCourses.map((c) => c.id);
    const { data: dbLessons, error: lErr } = await supabase
      .from('ater_lessons')
      .select('*')
      .in('course_id', courseIds)
      .order('order_index', { ascending: true });

    if (lErr) {
      return localCourses;
    }

    const merged: CourseCurriculum[] = dbCourses.map((c) => {
      const lessons: RoadmapLesson[] = (dbLessons || [])
        .filter((l) => l.course_id === c.id)
        .map((l) => ({
          id: l.id,
          order: l.order_index,
          title: l.title,
          slug: l.slug,
          summary: l.description,
          description: l.description,
          status: l.status as any,
          estimatedMinutes: l.estimated_minutes,
          prerequisites: [],
          isRemediation: l.is_remediation,
          parentLessonId: l.parent_lesson_id || undefined,
        }));

      return {
        id: c.id,
        topic: c.topic,
        title: c.title,
        targetGoal: c.description,
        lessons,
        activeLessonId: lessons[0]?.id || '',
        createdAt: c.created_at,
      };
    });

    return merged.length > 0 ? merged : localCourses;
  } catch (err) {
    console.warn('Failed to fetch courses from Supabase, returning local:', err);
    return localCourses;
  }
}

/**
 * Saves dynamic note to Supabase with local fallback.
 */
export async function saveNoteToStore(
  courseId: string,
  lessonId: string,
  note: DynamicLessonNote
): Promise<void> {
  const userId = await getCurrentUserId();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`ater_note_${lessonId}`, JSON.stringify(note));
    } catch (e) {
      console.warn('Local note save failed:', e);
    }
  }

  const supabase = getClient();
  if (!supabase) return;

  try {
    const notePayload: Record<string, any> = {
      id: lessonId,
      lesson_id: lessonId,
      course_id: courseId,
      title: note.title || 'Lesson Note',
      mental_model: note.mentalModel || note.section1CoreIntuition || 'Mental model conceptual framework.',
      operational_mechanism: note.operationalMechanism || note.section3ConcreteCaseStudy || 'Operational mechanism and analytical breakdown.',
      boundary_conditions: note.boundaryConditions || 'Boundary constraints and failure modes.',
      sections: (note as any).sections || [],
      inline_mcqs: note.inlineMCQs || [],
      interactive_checkpoints: (note as any).interactiveCheckpoints || (note as any).checkpoints || [],
      mutations: note.mutations || [],
      raw_markdown: (note as any).rawMarkdown || '',
      updated_at: new Date().toISOString(),
    };
    if (userId) {
      notePayload.user_id = userId;
    }

    const { error: noteErr } = await supabase.from('ater_notes').upsert(notePayload);
    if (noteErr) {
      console.warn('Supabase note upsert error:', noteErr);
    }
  } catch (err) {
    console.warn('Failed to save note to Supabase:', err);
  }
}

/**
 * Retrieves note from Supabase or localStorage.
 */
export async function getNoteFromStore(lessonId: string): Promise<DynamicLessonNote | null> {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`ater_note_${lessonId}`);
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {}
  }

  const supabase = getClient();
  if (!supabase) return null;

  try {
    const userId = await getCurrentUserId();
    let query = supabase.from('ater_notes').select('*').eq('lesson_id', lessonId);
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) return null;

    return {
      id: `note-${lessonId}`,
      lessonId,
      courseId: data.course_id,
      title: data.title,
      mentalModel: data.mental_model,
      operationalMechanism: data.operational_mechanism,
      boundaryConditions: data.boundary_conditions,
      sections: data.sections || [],
      inlineMCQs: data.inline_mcqs || [],
      checkpoints: data.interactive_checkpoints || [],
      interactiveCheckpoints: data.interactive_checkpoints || [],
      mutations: data.mutations || [],
      rawMarkdown: data.raw_markdown,
    } as unknown as DynamicLessonNote;
  } catch (err) {
    console.warn('Failed to get note from Supabase:', err);
    return null;
  }
}

/**
 * Dispatches a realtime event to command connected browser clients.
 */
export async function dispatchAgentEvent(event: {
  course_id?: string;
  lesson_id?: string;
  command: string;
  payload?: any;
  sender?: string;
}): Promise<void> {
  const supabase = getClient();
  if (!supabase) {
    console.warn('Supabase not available for realtime event dispatch');
    return;
  }

  try {
    const userId = await getCurrentUserId();
    const eventRow: Record<string, any> = {
      course_id: event.course_id || null,
      lesson_id: event.lesson_id || null,
      command: event.command,
      payload: event.payload || {},
      sender: event.sender || 'antigravity',
    };
    if (userId) eventRow.user_id = userId;

    await supabase.from('ater_agent_events').insert(eventRow);
  } catch (err) {
    console.warn('Failed to dispatch realtime agent event:', err);
  }
}

/**
 * Saves oral defense gate session results to Supabase.
 */
export async function saveGateSessionToStore(session: SocraticGateSession | Record<string, any>): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;

  try {
    const userId = await getCurrentUserId();
    const sessId = (session as any).sessionId || `gate-${session.lessonId}-${Date.now()}`;
    const score = (session as any).overallScore ?? (session as any).finalScore ?? 0;
    const passed = session.status === 'passed' || (session as any).passed || false;
    const feedback = session.summaryFeedback || (session as any).feedback || null;

    const row: Record<string, any> = {
      id: sessId,
      lesson_id: session.lessonId,
      lesson_title: session.lessonTitle,
      turns: session.turns,
      final_score: score,
      passed: passed,
      feedback: feedback,
    };
    if (userId) row.user_id = userId;

    await supabase.from('ater_gate_sessions').upsert(row);
  } catch (err) {
    console.warn('Failed to save gate session to Supabase:', err);
  }
}

/**
 * Saves a lab artifact to localStorage and optionally Supabase events.
 */
export async function saveLabArtifactToStore(artifact: LabArtifact): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ater_lab_artifact', JSON.stringify(artifact));
    } catch (e) {
      console.warn('Failed to save lab artifact to local storage:', e);
    }
  }
}

/**
 * Retrieves the latest lab artifact from Supabase first, falling back to localStorage.
 */
export async function getLatestLabArtifact(): Promise<LabArtifact | null> {
  const supabase = getClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ater_agent_events')
        .select('*')
        .eq('command', 'RENDER_LAB_ARTIFACT')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.payload) {
        const artifact = data.payload as LabArtifact;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('ater_lab_artifact', JSON.stringify(artifact));
          } catch (e) {}
        }
        return artifact;
      }
    } catch (err) {
      console.warn('Failed to fetch latest lab artifact from Supabase, falling back to localStorage:', err);
    }
  }

  // Fallback to localStorage if Supabase is unavailable, errors, or has no record
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('ater_lab_artifact');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
  }

  return null;
}
