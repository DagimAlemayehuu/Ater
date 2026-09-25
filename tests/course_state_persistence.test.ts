import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveLessonProgress,
  getLessonProgress,
  saveActiveCourse,
  getActiveCourse,
  saveLastView,
  getLastView,
  saveActiveLesson,
  getActiveLesson,
  saveNoteToStore,
  getNoteFromStore,
  clearUserSessionCache,
} from '@/lib/sync/store';
import { generateFallbackNote } from '@/lib/curriculum/notes';
import type { DynamicLessonNote, LessonCheckpoint, LessonInlineMCQ } from '@/types';

describe('Course State Persistence & Pedagogical Separation Suite', () => {
  const testUid = 'user-test-uuid-1234';
  const testCourseId = 'course-raft-consensus';
  const testLessonId = 'lesson-leader-election';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Active Course & View Persistence', () => {
    it('persists and restores activeCourseId under ater_active_course_${uid}', () => {
      saveActiveCourse(testUid, testCourseId);
      expect(localStorage.getItem(`ater_active_course_${testUid}`)).toBe(testCourseId);
      expect(getActiveCourse(testUid)).toBe(testCourseId);
    });

    it('persists and restores active view state under ater_last_view_${uid}', () => {
      saveLastView(testUid, 'study');
      expect(localStorage.getItem(`ater_last_view_${testUid}`)).toBe('study');
      expect(getLastView(testUid)).toBe('study');

      saveLastView(testUid, 'library');
      expect(localStorage.getItem(`ater_last_view_${testUid}`)).toBe('library');
      expect(getLastView(testUid)).toBe('library');
    });
  });

  describe('2. Active Lesson Persistence Per Course', () => {
    it('persists and restores activeLessonId per course under ater_active_lesson_${uid}_${courseId}', () => {
      saveActiveLesson(testUid, testCourseId, testLessonId);
      expect(localStorage.getItem(`ater_active_lesson_${testUid}_${testCourseId}`)).toBe(testLessonId);
      expect(getActiveLesson(testUid, testCourseId)).toBe(testLessonId);
    });

    it('isolates active lesson between different courses for the same user', () => {
      saveActiveLesson(testUid, 'course-a', 'lesson-a1');
      saveActiveLesson(testUid, 'course-b', 'lesson-b3');

      expect(getActiveLesson(testUid, 'course-a')).toBe('lesson-a1');
      expect(getActiveLesson(testUid, 'course-b')).toBe('lesson-b3');
    });
  });

  describe('3. Lesson Section Progress Persistence', () => {
    it('persists and restores unlockedSection and activeSectionTab under ater_lesson_progress_${uid}_${courseId}_${lessonId}', () => {
      saveLessonProgress(testUid, testCourseId, testLessonId, {
        unlockedSection: 4,
        activeSectionTab: 3,
      });

      const raw = localStorage.getItem(`ater_lesson_progress_${testUid}_${testCourseId}_${testLessonId}`);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.unlockedSection).toBe(4);
      expect(parsed.activeSectionTab).toBe(3);

      const restored = getLessonProgress(testUid, testCourseId, testLessonId);
      expect(restored).not.toBeNull();
      expect(restored?.unlockedSection).toBe(4);
      expect(restored?.activeSectionTab).toBe(3);
    });

    it('returns null when no saved progress exists for a new lesson', () => {
      const progress = getLessonProgress(testUid, testCourseId, 'non-existent-lesson');
      expect(progress).toBeNull();
    });
  });

  describe('4. User Answer & Checkpoint Persistence in Dynamic Note', () => {
    it('persists inline MCQ userSelectedIndex and checkpoint responses in ater_note_${uid}_${courseId}_${lessonId}', async () => {
      const sampleNote: DynamicLessonNote = generateFallbackNote(testLessonId, 'Leader Election Protocol', testCourseId, 'en');

      // 1. Simulate learner selecting MCQ answer
      const mcq = sampleNote.sections?.[0]?.inlineMCQs?.[0] || sampleNote.inlineMCQs?.[0];
      expect(mcq).toBeDefined();
      mcq!.userSelectedIndex = 1;
      mcq!.isCorrect = mcq!.correctOptionIndex === 1;

      // 2. Simulate learner submitting checkpoint answer
      const cp = sampleNote.sections?.find((s) => s.checkpoint)?.checkpoint || sampleNote.checkpoints?.[0];
      expect(cp).toBeDefined();
      cp!.studentAnswer = 'Majority quorums prevent split-brain by ensuring non-empty intersection between successive terms.';
      cp!.isAnswered = true;

      // Save note to store
      await saveNoteToStore(testCourseId, testLessonId, sampleNote, testUid);

      // Verify stored under required key
      const expectedKey = `ater_note_${testUid}_${testCourseId}_${testLessonId}`;
      const storedRaw = localStorage.getItem(expectedKey);
      expect(storedRaw).toBeTruthy();

      const storedNote: DynamicLessonNote = JSON.parse(storedRaw!);
      expect(storedNote.title).toBe('Leader Election Protocol');

      // Verify MCQ selection persisted
      const storedMcq = storedNote.sections?.[0]?.inlineMCQs?.[0] || storedNote.inlineMCQs?.[0];
      expect(storedMcq?.userSelectedIndex).toBe(1);

      // Verify Checkpoint response persisted
      const storedCp = storedNote.sections?.find((s) => s.checkpoint)?.checkpoint || storedNote.checkpoints?.[0];
      expect(storedCp?.isAnswered).toBe(true);
      expect(storedCp?.studentAnswer).toContain('Majority quorums prevent split-brain');

      // Verify retrieval through getNoteFromStore
      const retrieved = await getNoteFromStore(testLessonId, testUid, testCourseId);
      expect(retrieved).not.toBeNull();
      const retrievedCp = retrieved?.sections?.find((s: any) => s.checkpoint)?.checkpoint || retrieved?.checkpoints?.[0];
      expect(retrievedCp?.studentAnswer).toBe(cp!.studentAnswer);
      expect(retrievedCp?.isAnswered).toBe(true);
    });

    it('clears session keys on user sign-out cache purge without touching sb tokens', () => {
      saveActiveCourse(testUid, testCourseId);
      saveLastView(testUid, 'study');
      saveActiveLesson(testUid, testCourseId, testLessonId);
      saveLessonProgress(testUid, testCourseId, testLessonId, { unlockedSection: 3, activeSectionTab: 2 });
      localStorage.setItem('sb-test-token', 'auth-session-data');

      clearUserSessionCache(testUid);

      expect(getActiveCourse(testUid)).toBeNull();
      expect(getLastView(testUid)).toBeNull();
      expect(getActiveLesson(testUid, testCourseId)).toBeNull();
      expect(getLessonProgress(testUid, testCourseId, testLessonId)).toBeNull();
      expect(localStorage.getItem('sb-test-token')).toBe('auth-session-data');
    });
  });

  describe('5. Summary vs. Transcript Pedagogical Separation', () => {
    it('generates rich spoken conversational lectures explaining visual artifacts', () => {
      const note = generateFallbackNote(testLessonId, 'Raft Consensus Protocol', testCourseId, 'en');

      expect(note.sections).toBeDefined();
      expect(note.sections!.length).toBeGreaterThanOrEqual(4);

      // Verify Section 3 (code execution) talks through code line by line
      const sec3 = note.sections![2];
      expect(sec3.content).toContain('```python');
      expect(sec3.teacherExplanation).toBeDefined();
      // Verify teacherExplanation explains the code line by line
      expect(sec3.teacherExplanation?.toLowerCase()).toContain('code block');
      expect(sec3.teacherExplanation?.toLowerCase()).toContain('line by line');
      // Count sentences: 6-10 full sentences
      const sec3SentenceCount = sec3.teacherExplanation!.split(/[.!?]+/).filter((s) => s.trim().length > 10).length;
      expect(sec3SentenceCount).toBeGreaterThanOrEqual(5);

      // Verify Section 4 (boundary & sequence diagram) talks through Mermaid diagram steps
      const sec4 = note.sections![3];
      expect(sec4.content).toContain('```mermaid');
      expect(sec4.teacherExplanation).toBeDefined();
      expect(sec4.teacherExplanation?.toLowerCase()).toContain('sequence diagram');
      expect(sec4.teacherExplanation?.toLowerCase()).toContain('step');
      const sec4SentenceCount = sec4.teacherExplanation!.split(/[.!?]+/).filter((s) => s.trim().length > 10).length;
      expect(sec4SentenceCount).toBeGreaterThanOrEqual(5);

      // Verify on-screen content remains structured and clean without wall-of-text fatigue
      expect(sec3.content.split('\n\n').length).toBeGreaterThanOrEqual(2);
      expect(sec4.content.split('\n\n').length).toBeGreaterThanOrEqual(2);
    });

    it('strictly satisfies zero emojis invariant across all generated sections and explanations', () => {
      const note = generateFallbackNote(testLessonId, 'Distributed Invariants', testCourseId, 'en');
      const noteString = JSON.stringify(note);

      // Regex for emoji Unicode ranges
      const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
      expect(emojiRegex.test(noteString)).toBe(false);
    });
  });
});
