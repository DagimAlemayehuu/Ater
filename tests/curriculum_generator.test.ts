import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gatherGroundedSources } from '@/lib/curriculum/sources';
import { generateFallbackCurriculum, generateCourseCurriculum } from '@/lib/curriculum/generator';
import type { UploadedDoc, GroundedSource } from '@/types';

describe('Phase 2 & Phase 3: Grounded Sources & Dynamic Living Curriculum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Grounded Sources Engine (gatherGroundedSources)', () => {
    it('Path A: uses uploaded document names and text content as strict source of truth', async () => {
      const mockFiles: UploadedDoc[] = [
        {
          fileName: 'raft_algorithm_paper.pdf',
          fileType: 'application/pdf',
          sizeBytes: 409600,
          textContent: 'In Search of an Understandable Consensus Algorithm. Raft is a consensus algorithm for managing a replicated log.',
        },
        {
          fileName: 'spanner_google_osdi.txt',
          fileType: 'text/plain',
          sizeBytes: 102400,
          textContent: 'Spanner: Google globally-distributed database. TrueTime API provides synchronized real-world clock bounds.',
        },
      ];

      const sources = await gatherGroundedSources('Distributed Databases', mockFiles);

      expect(sources).toHaveLength(2);
      expect(sources[0].id).toBe('doc-1');
      expect(sources[0].title).toBe('raft_algorithm_paper.pdf');
      expect(sources[0].type).toBe('document');
      expect(sources[0].snippet).toContain('In Search of an Understandable Consensus Algorithm');

      expect(sources[1].id).toBe('doc-2');
      expect(sources[1].title).toBe('spanner_google_osdi.txt');
      expect(sources[1].type).toBe('document');
      expect(sources[1].snippet).toContain('TrueTime API provides synchronized real-world clock bounds');
    });

    it('Path B: prompt-based extracts 2-3 authoritative documentation/textbook reference sources', async () => {
      const sources = await gatherGroundedSources('React Hooks Lifecycle');

      expect(sources.length).toBeGreaterThanOrEqual(2);
      expect(sources.length).toBeLessThanOrEqual(3);

      for (const source of sources) {
        expect(source.type).toBe('web');
        expect(source.id).toMatch(/^web-\d+$/);
        expect(source.title.length).toBeGreaterThan(0);
        expect(source.url).toMatch(/^https?:\/\//);
        expect(source.snippet?.length).toBeGreaterThan(0);
      }
    });

    it('Path B: dynamically synthesizes domain-grounded sources for novel arbitrary topics', async () => {
      const sources = await gatherGroundedSources('Quantum Error Correction');

      expect(sources.length).toBeGreaterThanOrEqual(2);
      for (const source of sources) {
        expect(source.type).toBe('web');
        expect(source.title).toContain('Quantum Error Correction');
        expect(source.snippet).toBeDefined();
      }
    });

    it('handles Amharic language parameter cleanly', async () => {
      const sources = await gatherGroundedSources('የኮምፒውተር ፕሮግራሚንግ', undefined, undefined, 'am');
      expect(sources.length).toBeGreaterThanOrEqual(2);
      expect(sources[0].type).toBe('web');
    });
  });

  describe('Dynamic Fallback Curriculum (eradication of hardcoded distributed systems text)', () => {
    it('generates dynamic topic-specific titles and summaries for Quantum Computing', () => {
      const curriculum = generateFallbackCurriculum('Quantum Computing');

      expect(curriculum.topic).toBe('Quantum Computing');
      expect(curriculum.title).toContain('Quantum Computing');

      // Assert complete eradication of hardcoded 'distributed systems', 'network partitions', or 'consensus'
      const combinedText = JSON.stringify(curriculum.lessons).toLowerCase();
      expect(combinedText).not.toContain('network partitions');
      expect(combinedText).not.toContain('split-brain');
      expect(combinedText).not.toContain('state replication');
      expect(combinedText).not.toContain('quorum consensus');
      expect(combinedText).not.toContain('distributed systems and consensus');

      // Assert dynamic topic-specific titles
      expect(curriculum.lessons[0].title).toBe('Quantum Computing: Foundational Principles & Core Intuition');
      expect(curriculum.lessons[1].title).toBe('Quantum Computing: Operational Mechanism & Execution Dynamics');
      expect(curriculum.lessons[2].title).toBe('Quantum Computing: Boundary Traps & Failure Modes');
      expect(curriculum.lessons[3].title).toBe('Quantum Computing: Real-World Synthesis & Trade-offs');

      // Assert pacing invariant (15-20 min)
      for (const lesson of curriculum.lessons) {
        expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(15);
        expect(lesson.estimatedMinutes).toBeLessThanOrEqual(20);
      }
    });

    it('generates dynamic topic-specific titles for React Hooks', () => {
      const curriculum = generateFallbackCurriculum('React Hooks');

      expect(curriculum.title).toContain('React Hooks');
      expect(curriculum.lessons[0].title).toBe('React Hooks: Foundational Principles & Core Intuition');

      const combinedText = JSON.stringify(curriculum.lessons).toLowerCase();
      expect(combinedText).not.toContain('network partitions');
      expect(combinedText).not.toContain('split-brain');
    });

    it('attaches sources array to returned fallback curriculum', () => {
      const mockSources: GroundedSource[] = [
        { id: 's1', title: 'React Documentation', url: 'https://react.dev', type: 'web' },
      ];
      const curriculum = generateFallbackCurriculum('React', undefined, undefined, 'en', mockSources);

      expect(curriculum.sources).toBeDefined();
      expect(curriculum.sources).toHaveLength(1);
      expect(curriculum.sources?.[0].title).toBe('React Documentation');
    });
  });

  describe('generateCourseCurriculum Engine', () => {
    it('gathers grounded sources and attaches them to curriculum in mock mode', async () => {
      const curriculum = await generateCourseCurriculum({
        topic: 'Compiler Design',
        useMock: true,
      });

      expect(curriculum.topic).toBe('Compiler Design');
      expect(curriculum.sources).toBeDefined();
      expect(curriculum.sources!.length).toBeGreaterThanOrEqual(2);
      expect(curriculum.lessons.length).toBeGreaterThanOrEqual(3);

      // Verify topological ordering and statuses
      expect(curriculum.lessons[0].status).toBe('active');
      expect(curriculum.lessons[0].prerequisites).toEqual([]);

      for (let i = 1; i < curriculum.lessons.length; i++) {
        expect(curriculum.lessons[i].status).toBe('locked');
        expect(curriculum.lessons[i].prerequisites).toContain(curriculum.lessons[i - 1].id);
      }
    });

    it('preserves uploaded document sources when provided', async () => {
      const files: UploadedDoc[] = [
        {
          fileName: 'operating_systems_notes.pdf',
          fileType: 'application/pdf',
          sizeBytes: 50000,
          textContent: 'Virtual memory page tables and TLB miss handling routines.',
        },
      ];

      const curriculum = await generateCourseCurriculum({
        topic: 'Operating Systems',
        files,
        useMock: true,
      });

      expect(curriculum.sources).toBeDefined();
      expect(curriculum.sources![0].title).toBe('operating_systems_notes.pdf');
      expect(curriculum.sources![0].type).toBe('document');
      expect(curriculum.sources![0].snippet).toContain('Virtual memory page tables');
    });

    it('generates unique course-based lesson IDs and 3 to 4 planned sections with artifact types', async () => {
      const curriculum = await generateCourseCurriculum({
        topic: 'Python Concurrency',
        useMock: true,
      });

      const expectedCourseId = 'course-python-concurrency';
      expect(curriculum.id).toBe(expectedCourseId);

      curriculum.lessons.forEach((lesson, idx) => {
        const expectedLessonId = `${expectedCourseId}-l${idx + 1}`;
        expect(lesson.id).toBe(expectedLessonId);

        // Verify planned sections
        expect(lesson.sections).toBeDefined();
        expect(lesson.sections!.length).toBeGreaterThanOrEqual(3);
        expect(lesson.sections!.length).toBeLessThanOrEqual(4);

        lesson.sections!.forEach((section, sIdx) => {
          expect(section.order).toBe(sIdx + 1);
          expect(section.title.length).toBeGreaterThan(0);
          expect(section.summary.length).toBeGreaterThan(0);
          expect(section.artifactTypes).toBeDefined();
          expect(section.artifactTypes!.length).toBeGreaterThan(0);

          const validArtifacts = ['code', 'mermaid', 'math', 'table', 'timeline', 'callout'];
          section.artifactTypes!.forEach((art) => {
            expect(validArtifacts).toContain(art);
          });
        });
      });
    });
  });
});
