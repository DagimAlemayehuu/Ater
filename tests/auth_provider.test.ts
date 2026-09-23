import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearUserSessionCache,
  saveCourseToStore,
  getCoursesFromStore,
  saveNoteToStore,
  getNoteFromStore,
  deleteCourseFromStore,
} from '@/lib/sync/store';
import type { CourseCurriculum, DynamicLessonNote } from '@/types';

describe('Auth & Multi-Tenant Isolation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('preserves Supabase auth tokens (sb-*) while clearing user-scoped caches', () => {
    localStorage.setItem('sb-ckqjwsmdbspmquxbdrgb-auth-token', JSON.stringify({ access_token: 'fake-jwt' }));
    localStorage.setItem('ater_courses_user-123', JSON.stringify([{ id: 'c1' }]));
    localStorage.setItem('ater_curricula_user-123', JSON.stringify([{ id: 'c1' }]));
    localStorage.setItem('ater_notes_user-123', JSON.stringify([{ id: 'n1' }]));
    localStorage.setItem('ater_courses_guest', JSON.stringify([{ id: 'guest-c' }]));

    clearUserSessionCache('user-123');

    // Supabase auth token must NOT be purged
    expect(localStorage.getItem('sb-ckqjwsmdbspmquxbdrgb-auth-token')).toBeTruthy();

    // User-123 cache must be purged
    expect(localStorage.getItem('ater_courses_user-123')).toBeNull();
    expect(localStorage.getItem('ater_curricula_user-123')).toBeNull();
    expect(localStorage.getItem('ater_notes_user-123')).toBeNull();
    expect(localStorage.getItem('ater_courses_guest')).toBeNull();
  });

  it('strictly isolates courses between two distinct users', async () => {
    const userA = '00000000-0000-0000-0000-000000000001';
    const userB = '00000000-0000-0000-0000-000000000002';

    const userACourse: CourseCurriculum = {
      id: 'course-user-a',
      topic: 'Distributed Systems',
      title: 'Raft Consensus',
      lessons: [],
      activeLessonId: '',
    };

    const userBCourse: CourseCurriculum = {
      id: 'course-user-b',
      topic: 'Quantum Physics',
      title: 'Quantum Teleportation',
      lessons: [],
      activeLessonId: '',
    };

    await saveCourseToStore(userACourse, userA);
    await saveCourseToStore(userBCourse, userB);

    const coursesA = await getCoursesFromStore(userA);
    const coursesB = await getCoursesFromStore(userB);

    expect(coursesA.some((c) => c.id === 'course-user-a')).toBe(true);
    expect(coursesA.some((c) => c.id === 'course-user-b')).toBe(false);

    expect(coursesB.some((c) => c.id === 'course-user-b')).toBe(true);
    expect(coursesB.some((c) => c.id === 'course-user-a')).toBe(false);
  });

  it('returns empty courses for unauthenticated callers to prevent data leaks', async () => {
    localStorage.setItem('ater_courses_guest', JSON.stringify([{ id: 'stale-guest' }]));
    localStorage.setItem('ater_courses_user-a', JSON.stringify([{ id: 'private-course' }]));

    // Without a user ID, no private courses should be returned
    const unauthCourses = await getCoursesFromStore(undefined);
    expect(unauthCourses).toEqual([]);
  });

  it('strictly isolates notes between users', async () => {
    const userA = '00000000-0000-0000-0000-000000000001';
    const userB = '00000000-0000-0000-0000-000000000002';

    const noteA: DynamicLessonNote = {
      lessonId: 'lesson-101',
      title: 'User A Secret Note',
      mentalModel: 'Model A',
    };

    const noteB: DynamicLessonNote = {
      lessonId: 'lesson-101',
      title: 'User B Public Note',
      mentalModel: 'Model B',
    };

    await saveNoteToStore('course-1', 'lesson-101', noteA, userA);
    await saveNoteToStore('course-1', 'lesson-101', noteB, userB);

    const retrievedA = await getNoteFromStore('lesson-101', userA);
    const retrievedB = await getNoteFromStore('lesson-101', userB);

    expect(retrievedA?.title).toBe('User A Secret Note');
    expect(retrievedB?.title).toBe('User B Public Note');

    const unauthNote = await getNoteFromStore('lesson-101', undefined);
    expect(unauthNote).toBeNull();
  });

  it('deletes course strictly from the specified user workspace', async () => {
    const userA = '00000000-0000-0000-0000-000000000001';
    const userB = '00000000-0000-0000-0000-000000000002';

    const course: CourseCurriculum = {
      id: 'shared-id',
      topic: 'Topic A',
      title: 'Title A',
      lessons: [],
      activeLessonId: '',
    };

    await saveCourseToStore(course, userA);
    await saveCourseToStore(course, userB);

    await deleteCourseFromStore('shared-id', userA);

    const coursesA = await getCoursesFromStore(userA);
    const coursesB = await getCoursesFromStore(userB);

    expect(coursesA.some((c) => c.id === 'shared-id')).toBe(false);
    expect(coursesB.some((c) => c.id === 'shared-id')).toBe(true);
  });
});
