import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteCanvas } from '@/components/dashboard/NoteCanvas';
import type { DynamicLessonNote, CourseCurriculum } from '@/types';

// Mock speech synthesis and neural TTS audio
vi.mock('@/lib/voice/ttsClient', () => ({
  playNeuralAudio: vi.fn(),
  stopNeuralAudio: vi.fn(),
  pauseNeuralAudio: vi.fn(),
  resumeNeuralAudio: vi.fn(),
  restartNeuralAudio: vi.fn(),
  onAudioStateChange: vi.fn(() => () => {}),
  getAudioPlaybackState: vi.fn(() => 'idle'),
}));

describe('NoteCanvas - Transcription Mode & Persistence UI', () => {
  const mockUid = 'user-test-777';
  const mockCourse: CourseCurriculum = {
    id: 'course-sys-101',
    activeLessonId: 'lesson-lsm-1',
    topic: 'Distributed Storage',
    title: 'Distributed Storage Fundamentals',
    targetGoal: 'Master replication invariants',
    lessons: [
      {
        id: 'lesson-lsm-1',
        order: 1,
        slug: 'lsm-architecture',
        title: 'LSM Architecture',
        summary: 'Log structured merge trees and write buffers',
        status: 'active',
        estimatedMinutes: 20,
        prerequisites: [],
      },
    ],
  };

  const mockNote: DynamicLessonNote = {
    id: 'note-lesson-lsm-1',
    lessonId: 'lesson-lsm-1',
    courseId: 'course-sys-101',
    title: 'LSM Architecture Invariants',
    mentalModel: 'Memtables buffer writes sequentially in DRAM.',
    intuitivePurpose: 'Eliminate random write overhead.',
    operationalMechanism: 'Flushing Memtables into SSTables on disk.',
    boundaryConditions: 'Compaction debt stalls high write throughput.',
    sections: [
      {
        id: 'sec-1',
        order: 1,
        title: 'Physical Intuition of Sequential Writes',
        shortTitle: 'Intuition',
        type: 'analogy',
        content: 'Sequential append writes on SSDs and magnetic spindles avoid head seeking.',
        teacherExplanation: 'Welcome to LSM Architecture. Think of a physical spiral notebook where you rapidly scribble down notes page by page. Notice the code block on screen demonstrating sequential append operations.',
      },
      {
        id: 'sec-2',
        order: 2,
        title: 'SSTables and Level Compaction',
        shortTitle: 'Compaction',
        type: 'mechanism',
        content: '```mermaid\nflowchart TD\n  Memtable-->SSTable\n```',
        teacherExplanation: 'Examine the Mermaid diagram on your screen. The in-memory Memtable constantly flushes immutable blocks down to level zero SSTables on disk.',
        checkpoint: {
          id: 'cp-lsm-1',
          sectionIndex: 2,
          question: 'Why does write amplification increase during aggressive compaction?',
          promptHint: 'Think about multiple rewrite passes across levels.',
          spokenPrompt: 'Why does write amplification increase during aggressive compaction?',
          expectedInsight: 'Data blocks are read and rewritten multiple times across levels.',
          isAnswered: true,
          studentAnswer: 'Data is rewritten repeatedly across higher numbered levels.',
        },
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders only the active section transcript in transcription mode without showing other sections or duplicate summaries', () => {
    render(
      <NoteCanvas
        note={mockNote}
        curriculum={mockCourse}
        activeLessonId="lesson-lsm-1"
        initialViewMode="full"
        language="en"
        userId={mockUid}
      />
    );

    // Verify transcript header exists
    expect(screen.getByText('Spoken Lecture Transcript')).toBeInTheDocument();

    // Verify ONLY active section 1 spoken lecture text is rendered
    expect(
      screen.getByText(/Welcome to LSM Architecture. Think of a physical spiral notebook/)
    ).toBeInTheDocument();

    // Section 2 transcript must NOT be rendered yet (one section at a time)
    expect(
      screen.queryByText(/Examine the Mermaid diagram on your screen./)
    ).not.toBeInTheDocument();

    // Visual Artifacts & Summary header must NOT be rendered in transcription view
    expect(screen.queryByText('Visual Artifacts & Summary')).not.toBeInTheDocument();
  });

  it('restores unlockedSection and activeSectionTab from localStorage and renders active section transcript', () => {
    // Pre-populate saved progress in localStorage with Section 2 active
    localStorage.setItem(
      `ater_lesson_progress_${mockUid}_course-sys-101_lesson-lsm-1`,
      JSON.stringify({ unlockedSection: 2, activeSectionTab: 2 })
    );

    render(
      <NoteCanvas
        note={mockNote}
        curriculum={mockCourse}
        activeLessonId="lesson-lsm-1"
        initialViewMode="full"
        language="en"
        userId={mockUid}
      />
    );

    // Section 2 transcript should be active
    expect(
      screen.getByText(/Examine the Mermaid diagram on your screen./)
    ).toBeInTheDocument();

    // Section 1 transcript should NOT be visible
    expect(
      screen.queryByText(/Welcome to LSM Architecture. Think of a physical spiral notebook/)
    ).not.toBeInTheDocument();
  });

  it('navigates to next section transcript when clicking Continue', async () => {
    const { fireEvent } = await import('@testing-library/react');

    render(
      <NoteCanvas
        note={mockNote}
        curriculum={mockCourse}
        activeLessonId="lesson-lsm-1"
        initialViewMode="full"
        language="en"
        userId={mockUid}
      />
    );

    expect(
      screen.getByText(/Welcome to LSM Architecture. Think of a physical spiral notebook/)
    ).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    // After clicking Continue, Section 2 transcript should now be visible
    expect(
      screen.getByText(/Examine the Mermaid diagram on your screen./)
    ).toBeInTheDocument();
  });

  it('plays active section audio when restarting audio on section 2', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const { playNeuralAudio } = await import('@/lib/voice/ttsClient');

    // Pre-populate saved progress in localStorage with Section 2 active
    localStorage.setItem(
      `ater_lesson_progress_${mockUid}_course-sys-101_lesson-lsm-1`,
      JSON.stringify({ unlockedSection: 2, activeSectionTab: 2 })
    );

    render(
      <NoteCanvas
        note={mockNote}
        curriculum={mockCourse}
        activeLessonId="lesson-lsm-1"
        initialViewMode="interactive"
        language="en"
        userId={mockUid}
      />
    );

    vi.clearAllMocks();

    const restartBtn = screen.getByRole('button', { name: /^Restart$/i });
    fireEvent.click(restartBtn);

    // Verify it plays section 2 explanation, not section 1
    expect(playNeuralAudio).toHaveBeenCalledWith(
      expect.stringContaining('Examine the Mermaid diagram on your screen'),
      expect.objectContaining({ readerId: 'note-section-2' })
    );
  });
});

