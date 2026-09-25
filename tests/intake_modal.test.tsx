import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntakeModal } from '@/components/intake/IntakeModal';

// Mock speech/voice clients to prevent DOM audio exceptions in jsdom
vi.mock('@/lib/voice/ttsClient', () => ({
  playNeuralAudio: vi.fn(),
  stopNeuralAudio: vi.fn(),
  onAudioStateChange: vi.fn(() => () => {}),
}));

describe('IntakeModal - Socratic Discovery & Follow-Up UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders intake stage with ghost Cancel button and primary Continue button', () => {
    const onClose = vi.fn();
    const onCurriculumCreated = vi.fn();

    render(
      <IntakeModal
        isOpen={true}
        onClose={onClose}
        onCurriculumCreated={onCurriculumCreated}
      />
    );

    // Header title
    expect(screen.getByText('New Course')).toBeInTheDocument();

    // Cancel ghost button
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelBtn).toBeInTheDocument();
    expect(cancelBtn.className).toContain('text-zinc-500');

    // Continue button
    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    expect(continueBtn).toBeInTheDocument();
    expect(continueBtn.className).toContain('bg-zinc-900');
  });

  it('transitions to discovery stage, displays single unified progress bar, and navigates follow-ups', async () => {
    const onClose = vi.fn();
    const onCurriculumCreated = vi.fn();

    // Mock initial intake questions (3 initial questions)
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/ingest/intake') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            topic: 'Distributed Systems',
            questions: [
              {
                id: 'q1',
                question: 'What is your primary goal for studying Distributed Systems?',
                category: 'goal',
                options: ['Build a real-world system', 'Understand core principles'],
              },
              {
                id: 'q2',
                question: 'What is your current background in concurrency?',
                category: 'baseline',
                options: ['Beginner', 'Intermediate'],
              },
            ],
          }),
        });
      }

      if (url === '/api/ingest/grill') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            done: false,
            question: {
              id: 'q_followup_1',
              question: 'Specifically, how familiar are you with Raft consensus algorithms?',
              category: 'depth',
              options: ['Read the paper', 'Built an implementation', 'Never heard of it'],
            },
          }),
        });
      }

      if (url === '/api/curriculum/generate') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'curr_1',
            title: 'Mastering Distributed Systems',
            topic: 'Distributed Systems',
            sources: [
              {
                id: 's1',
                title: 'Designing Data-Intensive Applications',
                url: 'https://dataintensive.net',
                type: 'web',
                snippet: 'Definitive guide on consensus',
              },
            ],
            lessons: [
              {
                id: 'l1',
                order: 1,
                title: 'Foundations of Consensus',
                summary: 'CAP theorem and safety',
                description: 'Explore core consensus primitives',
                conceptsCovered: ['CAP Theorem', 'Fault Tolerance'],
                estimatedMinutes: 15,
                status: 'active',
                prerequisites: [],
                sections: [
                  {
                    id: 'l1-s1',
                    order: 1,
                    title: 'Analogy and Intuition',
                    summary: 'Everyday intuitive mental model',
                    artifactTypes: ['callout'],
                  },
                  {
                    id: 'l1-s2',
                    order: 2,
                    title: 'Core Consensus Primitives',
                    summary: 'Formal properties and state',
                    artifactTypes: ['code', 'table'],
                  },
                ],
              },
            ],
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    }) as any;

    render(
      <IntakeModal
        isOpen={true}
        onClose={onClose}
        onCurriculumCreated={onCurriculumCreated}
      />
    );

    // Type prompt
    const textarea = screen.getByPlaceholderText(/What do you want to learn/i);
    fireEvent.change(textarea, { target: { value: 'Distributed Systems' } });

    // Click Continue
    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    // Wait for Socratic Discovery stage
    await waitFor(() => {
      expect(screen.getByText('What is your primary goal for studying Distributed Systems?')).toBeInTheDocument();
    });

    // Verify progress text: single unified counter "1 / 2"
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    // Verify NO "Follow-up" pill yet on initial question
    expect(screen.queryByText('Follow-up')).not.toBeInTheDocument();

    // Select first option
    const optionBtn = screen.getByRole('button', { name: /Build a real-world system/i });
    fireEvent.click(optionBtn);
    expect(optionBtn.className).toContain('border-zinc-900');

    // Click Next Question
    const nextBtn = screen.getByRole('button', { name: /Next Question/i });
    fireEvent.click(nextBtn);

    // Question 2 should now be visible
    await waitFor(() => {
      expect(screen.getByText('What is your current background in concurrency?')).toBeInTheDocument();
    });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    // Select second question option
    const q2Option = screen.getByRole('button', { name: /Intermediate/i });
    fireEvent.click(q2Option);

    // Click Next Question -> should trigger /api/ingest/grill and yield follow-up
    fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));

    // Follow-up question should load
    await waitFor(() => {
      expect(screen.getByText('Specifically, how familiar are you with Raft consensus algorithms?')).toBeInTheDocument();
    });

    // Verify subtle "Follow-up" pill badge is displayed
    const followUpBadge = screen.getByText('Follow-up');
    expect(followUpBadge).toBeInTheDocument();
    expect(followUpBadge.className).toContain('rounded-full');

    // Verify single unified counter updated to "3 / 3"
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    // Verify secondary action "Ready to Plan" is cleanly visible beside primary "Next Question"
    const readyToPlanBtn = screen.getByRole('button', { name: /Ready to Plan/i });
    expect(readyToPlanBtn).toBeInTheDocument();
    expect(readyToPlanBtn.className).toContain('border-zinc-200');

    // Click "Ready to Plan"
    fireEvent.click(readyToPlanBtn);

    // Should transition to synthesizing/roadmap stage
    await waitFor(() => {
      expect(screen.getAllByText('Mastering Distributed Systems').length).toBeGreaterThan(0);
    });

    // Verify Sources of Truth section is displayed
    expect(screen.getByText('Sources of Truth')).toBeInTheDocument();
    expect(screen.getByText('Designing Data-Intensive Applications')).toBeInTheDocument();

    // Verify sequenced lesson details and concepts covered
    expect(screen.getByText('Foundations of Consensus')).toBeInTheDocument();
    expect(screen.getByText('Explore core consensus primitives')).toBeInTheDocument();
    expect(screen.getByText('CAP Theorem')).toBeInTheDocument();
    expect(screen.getByText('Fault Tolerance')).toBeInTheDocument();

    // Verify planned sections and artifact badges
    expect(screen.getByText('Planned Sections')).toBeInTheDocument();
    expect(screen.getByText('Analogy and Intuition')).toBeInTheDocument();
    expect(screen.getByText('Everyday intuitive mental model')).toBeInTheDocument();
    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(screen.getByText('Core Consensus Primitives')).toBeInTheDocument();
    expect(screen.getByText('Formal properties and state')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();

    // Verify natural language tweak input and Update Plan button
    const tweakInput = screen.getByPlaceholderText(/Want to adjust this plan/i);
    expect(tweakInput).toBeInTheDocument();
    const updatePlanBtn = screen.getByRole('button', { name: /Update Plan/i });
    expect(updatePlanBtn).toBeInTheDocument();

    // Verify roadmap approve button
    const approveBtn = screen.getByRole('button', { name: /Approve & Start Course/i });
    expect(approveBtn).toBeInTheDocument();
    expect(approveBtn.className).toContain('bg-zinc-900');

    // Clicking approve calls onCurriculumCreated and onClose
    fireEvent.click(approveBtn);
    await waitFor(() => {
      expect(onCurriculumCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('triggers onClose when ghost cancel button is clicked', () => {
    const onClose = vi.fn();
    const onCurriculumCreated = vi.fn();

    render(
      <IntakeModal
        isOpen={true}
        onClose={onClose}
        onCurriculumCreated={onCurriculumCreated}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
