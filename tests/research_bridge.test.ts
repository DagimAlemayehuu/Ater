import { describe, it, expect } from 'vitest';
import { convertResearchToCurriculum } from '../lib/research/bridge';
import type { ResearchFinding } from '../lib/notebooklm/client';
import type { ScholarxivPaper } from '../types/scholarxiv';

describe('Research Bridge: Autonomous Research -> CourseCurriculum', () => {
  const mockPaper1: ScholarxivPaper = {
    id: 'paper-raft-01',
    extractedID: '1405.2735',
    title: 'In Search of an Understandable Consensus Algorithm',
    summary: 'Raft is a consensus algorithm for managing a replicated log.',
    authors: ['Diego Ongaro', 'John Ousterhout'],
    year: 2014,
    url: 'https://arxiv.org/abs/1405.2735',
    doi: '10.48550/arXiv.1405.2735',
    keyInsight: 'Raft decomposes consensus into leader election, log replication, and safety.',
  };

  const mockPaper2: ScholarxivPaper = {
    id: 'paper-paxos-02',
    extractedID: '0702.0123',
    title: 'Paxos Made Simple',
    summary: 'The Paxos algorithm for implementing a fault-tolerant distributed system.',
    authors: ['Leslie Lamport'],
    year: 2001,
    url: 'https://arxiv.org/abs/0702.0123',
    doi: '10.48550/arXiv.0702.0123',
    keyInsight: 'Consensus is guaranteed as long as a majority of acceptors agree on proposals.',
  };

  const mockFinding: ResearchFinding = {
    title: 'Distributed Consensus & Raft Invariants',
    summary: 'Autonomous research synthesis exploring leader election, quorum consensus, and network partitions.',
    takeaways: [
      'Split-brain states are prevented by strict majority quorum requirements.',
      'Log entries are committed only when replicated on a majority of cluster nodes.',
      'Heartbeats suppress election timeouts in follower nodes during normal operation.',
      'Network partitions can isolate former leaders without compromising safety.',
      'Log compaction via snapshotting bounds state machine memory consumption.',
    ],
    papers: [mockPaper1, mockPaper2],
    webCitations: [
      { title: 'The Raft Paper', url: 'https://raft.github.io/raft.pdf' },
    ],
  };

  it('converts research finding into a fully structured CourseCurriculum', () => {
    const curriculum = convertResearchToCurriculum({
      finding: mockFinding,
      language: 'en',
    });

    expect(curriculum).toBeDefined();
    expect(curriculum.id).toMatch(/^course-research-/);
    expect(curriculum.topic).toContain('Distributed Consensus & Raft Invariants');
    expect(curriculum.activeLessonId).toBe('lesson-01');
    expect(curriculum.lessons).toHaveLength(5);
    expect(curriculum.sourceName).toBe(mockPaper1.title);
  });

  it('enforces Single-Concept Invariant pacing for all 5 lessons (15-20 min)', () => {
    const curriculum = convertResearchToCurriculum({
      finding: mockFinding,
      language: 'en',
    });

    for (const lesson of curriculum.lessons) {
      expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(15);
      expect(lesson.estimatedMinutes).toBeLessThanOrEqual(20);
      expect(lesson.isRemediation).toBe(false);
    }
  });

  it('enforces strict topological ordering and DAG dependency chain', () => {
    const curriculum = convertResearchToCurriculum({
      finding: mockFinding,
      language: 'en',
    });

    // Lesson 01
    expect(curriculum.lessons[0].order).toBe(1);
    expect(curriculum.lessons[0].status).toBe('active');
    expect(curriculum.lessons[0].prerequisites).toEqual([]);

    // Lessons 02 to 05
    for (let i = 1; i < curriculum.lessons.length; i++) {
      const current = curriculum.lessons[i];
      const prev = curriculum.lessons[i - 1];

      expect(current.order).toBe(i + 1);
      expect(current.status).toBe('locked');
      expect(current.prerequisites).toContain(prev.id);
    }
  });

  it('silently incorporates paper insights without trivia questions', () => {
    const curriculum = convertResearchToCurriculum({
      finding: mockFinding,
      language: 'en',
    });

    const lesson1 = curriculum.lessons[0];
    const lesson2 = curriculum.lessons[1];

    // Rich grounding included in lesson descriptions
    expect(lesson1.description).toContain(mockPaper1.title);
    expect(lesson1.description).toContain('2014');
    expect(lesson2.description).toContain(mockPaper2.title);

    // No author quiz questions in conceptsCovered
    for (const lesson of curriculum.lessons) {
      for (const concept of lesson.conceptsCovered || []) {
        expect(concept.toLowerCase()).not.toContain('published date');
        expect(concept.toLowerCase()).not.toContain('author trivia');
      }
    }
  });

  it('strictly enforces Zero Emojis across all fields', () => {
    const findingWithEmojis: ResearchFinding = {
      title: '🚀 Fast Transformers & Attention 🔥',
      summary: '✨ A deep study of attention mechanisms 📚.',
      takeaways: [
        '💡 Key takeaway 1: Self-attention scales quadratically.',
        '⚡ Key takeaway 2: FlashAttention uses tiled SRAM memory.',
      ],
      papers: [
        {
          ...mockPaper1,
          title: '🧠 Deep Transformer Architecture 🎯',
          keyInsight: '🌟 Key insight on linear attention.',
        },
      ],
    };

    const curriculum = convertResearchToCurriculum({
      finding: findingWithEmojis,
      language: 'en',
    });

    const hasEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    expect(hasEmoji.test(curriculum.topic)).toBe(false);
    expect(hasEmoji.test(curriculum.title || '')).toBe(false);
    expect(hasEmoji.test(curriculum.targetGoal || '')).toBe(false);

    for (const lesson of curriculum.lessons) {
      expect(hasEmoji.test(lesson.title)).toBe(false);
      expect(hasEmoji.test(lesson.summary)).toBe(false);
      expect(hasEmoji.test(lesson.description || '')).toBe(false);
      for (const c of lesson.conceptsCovered || []) {
        expect(hasEmoji.test(c)).toBe(false);
      }
    }
  });

  it('supports Amharic language localization correctly', () => {
    const curriculum = convertResearchToCurriculum({
      finding: mockFinding,
      language: 'am',
    });

    expect(curriculum.targetGoal).toContain('የ');
    expect(curriculum.lessons[0].title).toContain('መሰረታዊ መርሆች');
    expect(curriculum.lessons[1].title).toContain('የአሰራር ሂደት');
    expect(curriculum.teacherWalkthrough).toContain('ፍኖተ-ካርታ');
  });

  it('handles empty takeaways and missing papers gracefully with resilient fallbacks', () => {
    const emptyFinding: ResearchFinding = {
      title: 'Quantum Teleportation Protocols',
      summary: '',
      takeaways: [],
      papers: [],
    };

    const curriculum = convertResearchToCurriculum({
      finding: emptyFinding,
      language: 'en',
    });

    expect(curriculum.lessons).toHaveLength(5);
    expect(curriculum.lessons[0].summary).toBeTruthy();
    expect(curriculum.lessons[0].status).toBe('active');
    expect(curriculum.lessons[4].status).toBe('locked');
  });
});
