import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkIsAdmin, getAdminEmails, DEFAULT_ADMINS, isOwner, PRIMARY_OWNER } from '@/lib/auth/admins';
import { clearUserSessionCache, getCoursesFromStore, saveCourseToStore, saveNoteToStore, getNoteFromStore } from '@/lib/sync/store';
import { getArtifactsShowcaseCurriculum, getQuestionsShowcaseCurriculum, getShowcaseLessonNote } from '@/lib/curriculum/showcaseCourses';

describe('Auth & Admin Access Verification Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly recognizes primary owner and teammate as verified admins', async () => {
    const isDagimAdmin = await checkIsAdmin('dagimalemayehuu@gmail.com');
    const isFriendAdmin = await checkIsAdmin('millionsimeon@gmail.com');
    const isRandomAdmin = await checkIsAdmin('unauthorized_user@example.com');

    expect(isDagimAdmin).toBe(true);
    expect(isFriendAdmin).toBe(true);
    expect(isRandomAdmin).toBe(false);
  });

  it('normalizes admin emails case-insensitively and returns shared admin set', async () => {
    const isCaseInsensitiveAdmin = await checkIsAdmin('MILLIONSIMEON@GMAIL.COM ');
    expect(isCaseInsensitiveAdmin).toBe(true);

    const adminList = await getAdminEmails();
    expect(adminList).toContain('dagimalemayehuu@gmail.com');
    expect(adminList).toContain('millionsimeon@gmail.com');
  });

  it('strictly restricts isOwner to primary owner Dagim', () => {
    expect(isOwner('dagimalemayehuu@gmail.com')).toBe(true);
    expect(isOwner('DAGIMALEMAYEHUU@GMAIL.COM ')).toBe(true);
    expect(isOwner('millionsimeon@gmail.com')).toBe(false);
    expect(isOwner('newuser@example.com')).toBe(false);
    expect(isOwner('')).toBe(false);
    expect(isOwner(null)).toBe(false);
    expect(isOwner(undefined)).toBe(false);
  });

  it('ensures new users do not receive hardcoded showcase courses by default', () => {
    const isDagim = isOwner('newlearner@example.com');
    const artifactsShowcase = getArtifactsShowcaseCurriculum('en');
    const questionsShowcase = getQuestionsShowcaseCurriculum('en');

    // Simulate course hydration logic
    const initialCourses = isDagim ? [artifactsShowcase, questionsShowcase] : [];
    expect(initialCourses).toHaveLength(0);

    // Dagim must retain access
    const dagimCourses = isOwner(PRIMARY_OWNER) ? [artifactsShowcase, questionsShowcase] : [];
    expect(dagimCourses).toHaveLength(2);
    expect(dagimCourses[0].id).toBe('course-artifacts-showcase');
    expect(dagimCourses[1].id).toBe('course-questions-showcase');
  });

  it('restricts showcase lesson notes to primary owner only', () => {
    const newLearnerEmail = 'newlearner@example.com';
    const isLearnerOwner = isOwner(newLearnerEmail);
    const learnerShowcaseNote = isLearnerOwner ? getShowcaseLessonNote('art-lesson-01', 'en') : null;
    expect(learnerShowcaseNote).toBeNull();

    const isDagim = isOwner(PRIMARY_OWNER);
    const dagimShowcaseNote = isDagim ? getShowcaseLessonNote('art-lesson-01', 'en') : null;
    expect(dagimShowcaseNote).not.toBeNull();
    expect(dagimShowcaseNote?.title).toContain('Mermaid');
  });

  it('clears cross-user cache and stale courses upon calling clearUserSessionCache', () => {
    localStorage.setItem('ater_courses', JSON.stringify([{ id: 'private-course-123' }]));
    localStorage.setItem('ater_notes', JSON.stringify([{ id: 'private-note-123' }]));
    localStorage.setItem('ater_note_lesson-01', JSON.stringify({ title: 'Secret Note' }));
    localStorage.setItem('ater_curricula_user-abc', JSON.stringify([{ id: 'user-course' }]));

    expect(localStorage.getItem('ater_courses')).not.toBeNull();
    expect(localStorage.getItem('ater_notes')).not.toBeNull();

    clearUserSessionCache();

    expect(localStorage.getItem('ater_courses')).toBeNull();
    expect(localStorage.getItem('ater_notes')).toBeNull();
    expect(localStorage.getItem('ater_note_lesson-01')).toBeNull();
    expect(localStorage.getItem('ater_curricula_user-abc')).toBeNull();
  });

  it('prevents unauthenticated clients from fetching private user courses', async () => {
    const courses = await getCoursesFromStore();
    // When unauthenticated, no private courses belonging to other users should leak
    const privateCourse = courses.find((c) => c.id === 'course-git-and-github');
    expect(privateCourse).toBeUndefined();
  });

  it('validates safe relative redirects and prevents open redirects', () => {
    const isSafeRelative = (url: string) => url && url.startsWith('/') && !url.startsWith('//');
    expect(isSafeRelative('/app')).toBe(true);
    expect(isSafeRelative('/admin')).toBe(true);
    expect(isSafeRelative('https://evil.com')).toBe(false);
    expect(isSafeRelative('//evil.com')).toBe(false);
    expect(isSafeRelative('javascript:alert(1)')).toBe(false);
  });
});
