import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkIsAdmin, getAdminEmails, DEFAULT_ADMINS } from '@/lib/auth/admins';
import { clearUserSessionCache, getCoursesFromStore } from '@/lib/sync/store';

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

  it('clears cross-user cache and stale courses upon calling clearUserSessionCache', () => {
    localStorage.setItem('ater_courses', JSON.stringify([{ id: 'private-course-123' }]));
    localStorage.setItem('ater_notes', JSON.stringify([{ id: 'private-note-123' }]));
    localStorage.setItem('ater_note_lesson-01', JSON.stringify({ title: 'Secret Note' }));

    expect(localStorage.getItem('ater_courses')).not.toBeNull();
    expect(localStorage.getItem('ater_notes')).not.toBeNull();

    clearUserSessionCache();

    expect(localStorage.getItem('ater_courses')).toBeNull();
    expect(localStorage.getItem('ater_notes')).toBeNull();
    expect(localStorage.getItem('ater_note_lesson-01')).toBeNull();
  });

  it('prevents unauthenticated clients from fetching private user courses', async () => {
    const courses = await getCoursesFromStore();
    // When unauthenticated, no private courses belonging to other users should leak
    const privateCourse = courses.find((c) => c.id === 'course-git-and-github');
    expect(privateCourse).toBeUndefined();
  });
});
