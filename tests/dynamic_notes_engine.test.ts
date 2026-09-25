import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateFallbackNote,
  compileDynamicLessonNote,
} from '@/lib/curriculum/notes';
import {
  saveNoteToStore,
  getNoteFromStore,
} from '@/lib/sync/store';
import type { RoadmapLesson, PlannedSection, GroundedSource, DynamicLessonNote } from '@/types';

describe('Dynamic Note Engine and Scoped Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFallbackNote with plannedSections', () => {
    const mockLesson: RoadmapLesson = {
      id: 'lesson-raft-1',
      order: 1,
      slug: 'leader-election-protocol',
      status: 'active',
      estimatedMinutes: 20,
      prerequisites: [],
      title: 'Leader Election Protocol',
      summary: 'Understanding split votes and randomized election timeouts in Raft.',
      description: 'Understanding split votes and randomized election timeouts in Raft.',
    };

    const mockPlannedSections: PlannedSection[] = [
      {
        order: 1,
        title: 'Heartbeat Timers and Stale Leaders',
        summary: 'How follower nodes detect network partitions.',
      },
      {
        order: 2,
        title: 'Split Votes and Election Randomized Bounds',
        summary: 'How randomized timeouts ensure quorum consensus without ties.',
      },
      {
        order: 3,
        title: 'Partition Recovery and Stale Term Traps',
        summary: 'Handling rejoined partitioned nodes.',
      },
    ];

    it('synthesizes dynamic sections matching the planned sections outline', () => {
      const note = generateFallbackNote(
        mockLesson.id,
        mockLesson.title,
        'course-raft-01',
        'en',
        mockPlannedSections
      );

      expect(note.lessonId).toBe('lesson-raft-1');
      expect(note.title).toBe('Leader Election Protocol');
      expect(note.sections).toBeDefined();
      expect(note.sections?.length).toBe(3);

      const [sec1, sec2, sec3] = note.sections!;
      expect(sec1.title).toBe('Heartbeat Timers and Stale Leaders');
      expect(sec1.type).toBe('analogy');
      expect(sec1.order).toBe(1);
      expect(sec1.content.length).toBeGreaterThan(50);

      expect(sec2.title).toBe('Split Votes and Election Randomized Bounds');
      expect(sec2.type).toBe('mechanism');
      expect(sec2.order).toBe(2);

      expect(sec3.title).toBe('Partition Recovery and Stale Term Traps');
      expect(sec3.type).toBe('boundary');
      expect(sec3.order).toBe(3);
      expect(sec3.checkpoint).toBeDefined();
      expect(sec3.checkpoint?.isAnswered).toBe(false);
      expect(sec3.checkpoint?.question.length).toBeGreaterThan(10);
    });

    it('populates backward-compatible legacy fields from dynamic sections', () => {
      const note = generateFallbackNote(
        mockLesson.id,
        mockLesson.title,
        'course-raft-01',
        'en',
        mockPlannedSections
      );

      expect(note.mentalModel).toBeTruthy();
      expect(note.intuitivePurpose).toBeTruthy();
      expect(note.operationalMechanism).toBeTruthy();
      expect(note.boundaryConditions).toBeTruthy();
      expect(note.artifactCode).toBeTruthy();
      expect(note.sections).toHaveLength(3);
    });

    it('generates full 5-section fallback when plannedSections is not provided', () => {
      const note = generateFallbackNote(
        mockLesson.id,
        mockLesson.title,
        'course-raft-01',
        'en'
      );

      expect(note.sections).toBeDefined();
      expect(note.sections?.length).toBe(5);
      expect(note.sections![0].title).toBe('Physical Analogy & Intuition (ELI12)');
      expect(note.mentalModel).toBeTruthy();
    });
  });

  describe('compileDynamicLessonNote with Grounded Sources', () => {
    const mockLesson: RoadmapLesson = {
      id: 'lesson-crater-2',
      order: 2,
      slug: 'lsm-trees-compaction',
      status: 'active',
      estimatedMinutes: 25,
      prerequisites: [],
      title: 'LSM-Trees and Compaction Strategies',
      summary: 'Understanding write amplification and leveled vs size-tiered compaction.',
      description: 'Understanding write amplification and leveled vs size-tiered compaction.',
    };

    const mockSources: GroundedSource[] = [
      {
        id: 'doc-source-1',
        title: 'LSM-Tree Design Paper.pdf',
        type: 'document',
        snippet: 'The Log-Structured Merge-Tree is designed for high write throughput.',
      },
    ];

    const mockPlannedSections: PlannedSection[] = [
      {
        order: 1,
        title: 'Memtables and Write-Ahead Logs',
        summary: 'In-memory sorted trees paired with sequential disk logs.',
      },
      {
        order: 2,
        title: 'SSTables and Level Compaction',
        summary: 'Flushing immutable runs and tiered merge steps.',
      },
    ];

    it('compiles note with sources and repairs missing sections deterministically', async () => {
      const note = await compileDynamicLessonNote({
        lessonId: mockLesson.id,
        title: mockLesson.title,
        summary: mockLesson.description,
        courseId: 'course-crater-01',
        language: 'en',
        sources: mockSources,
        plannedSections: mockPlannedSections,
        useMock: true,
      });

      expect(note.lessonId).toBe('lesson-crater-2');
      expect(note.sections).toBeDefined();
      expect(note.sections?.length).toBeGreaterThanOrEqual(2);
      expect(note.mentalModel).toBeTruthy();
      expect(note.checkpoints).toBeDefined();
      expect(note.checkpoints?.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Multi-Tenant & Course-Scoped Note Caching', () => {
    const userId = '00000000-0000-0000-0000-000000000042';
    const lessonId = 'shared-lesson-001';

    const noteCourseA: DynamicLessonNote = {
      lessonId,
      title: 'Course A Note',
      mentalModel: 'Mental Model A',
      intuitivePurpose: 'Purpose A',
      operationalMechanism: 'Mechanism A',
      boundaryConditions: 'Boundary A',
      checkpoints: [],
      sections: [
        {
          id: 'sec-a',
          order: 1,
          title: 'Section A',
          content: 'Content for course A',
          type: 'concept',
        },
      ],
    };

    const noteCourseB: DynamicLessonNote = {
      lessonId,
      title: 'Course B Note',
      mentalModel: 'Mental Model B',
      intuitivePurpose: 'Purpose B',
      operationalMechanism: 'Mechanism B',
      boundaryConditions: 'Boundary B',
      checkpoints: [],
      sections: [
        {
          id: 'sec-b',
          order: 1,
          title: 'Section B',
          content: 'Content for course B',
          type: 'mechanism',
        },
      ],
    };

    it('isolates notes by courseId to prevent cache key collisions', async () => {
      await saveNoteToStore('course-distributed-systems', lessonId, noteCourseA, userId);
      await saveNoteToStore('course-compiler-design', lessonId, noteCourseB, userId);

      const retrievedA = await getNoteFromStore(lessonId, userId, 'course-distributed-systems');
      const retrievedB = await getNoteFromStore(lessonId, userId, 'course-compiler-design');

      expect(retrievedA).not.toBeNull();
      expect(retrievedB).not.toBeNull();
      expect(retrievedA?.title).toBe('Course A Note');
      expect(retrievedB?.title).toBe('Course B Note');
      expect(retrievedA?.sections?.[0].title).toBe('Section A');
      expect(retrievedB?.sections?.[0].title).toBe('Section B');
    });

    it('falls back to legacy key when courseId is not specified in getNoteFromStore', async () => {
      const retrievedLegacy = await getNoteFromStore(lessonId, userId);
      expect(retrievedLegacy).not.toBeNull();
      expect(retrievedLegacy?.lessonId).toBe(lessonId);
    });
  });
});
