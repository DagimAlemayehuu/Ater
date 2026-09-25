import { describe, it, expect } from 'vitest';
import {
  generateFallbackGateQuestions,
  generateInitialGateQuestions,
  evaluateGateTurn,
  finalizeGateSession,
} from '@/lib/ai/gate';
import type { GateQuestionTurn } from '@/types';

describe('Socratic Defense Gate Engine', () => {
  it('generates a 3-question battery targeting intuition, mechanism, and boundary', async () => {
    const questions = await generateInitialGateQuestions({
      lessonTitle: 'Raft Consensus Algorithm',
      useMock: true,
      language: 'en',
    });

    expect(questions).toHaveLength(3);
    expect(questions[0].targetDimension).toBe('intuition');
    expect(questions[1].targetDimension).toBe('mechanism');
    expect(questions[2].targetDimension).toBe('boundary');
    expect(questions[0].spokenPrompt.endsWith('?')).toBe(true);
    expect(questions[1].spokenPrompt.endsWith('?')).toBe(true);
    expect(questions[2].spokenPrompt.endsWith('?')).toBe(true);
  });

  it('generates Amharic questions strictly with Ge\'ez characters when requested', async () => {
    const questions = await generateInitialGateQuestions({
      lessonTitle: 'የተሰራጩ ስርዓቶች',
      useMock: true,
      language: 'am',
    });

    expect(questions).toHaveLength(3);
    expect(/[\u1200-\u137F]/.test(questions[0].question)).toBe(true);
    expect(/[\u1200-\u137F]/.test(questions[1].question)).toBe(true);
    expect(/[\u1200-\u137F]/.test(questions[2].question)).toBe(true);
  });

  it('evaluates a score 10 answer as immediate perfect pass with no follow-up needed', async () => {
    const turn: GateQuestionTurn = {
      id: 'turn-1',
      index: 1,
      question: 'Explain the core intuitive mental model without buzzwords.',
      spokenPrompt: 'Explain the mental model without buzzwords?',
      targetDimension: 'intuition',
    };

    const result = await evaluateGateTurn({
      lessonTitle: 'Consensus',
      currentTurn: turn,
      studentAnswer: 'Imagine an ancient town hall where citizens agree to only change official time when a crier rings a bronze bell and more than half the assembly verifies it.',
      useMock: true,
      language: 'en',
    });

    expect(result.score).toBe(10);
    expect(result.tier).toBe('perfect_pass');
    expect(result.mastered).toBe(true);
    expect(result.needsFollowUp).toBe(false);
    expect(result.followUpTurn).toBeUndefined();
  });

  it('evaluates a score 8-9 answer on attempt 1 with refinement tier requesting clarification', async () => {
    const turn: GateQuestionTurn = {
      id: 'turn-1',
      index: 1,
      question: 'Explain the core intuitive mental model without buzzwords.',
      spokenPrompt: 'Explain the mental model without buzzwords?',
      targetDimension: 'intuition',
    };

    const result = await evaluateGateTurn({
      lessonTitle: 'Consensus',
      currentTurn: turn,
      studentAnswer: 'Town hall citizens agree only when more than half verify the vote.',
      attemptNumber: 1,
      useMock: true,
      language: 'en',
    });

    expect(result.score).toBe(9);
    expect(result.tier).toBe('refinement');
    expect(result.mastered).toBe(false);
    expect(result.needsFollowUp).toBe(true);
    expect(result.followUpTurn?.tier).toBe('refinement');
  });

  it('passes a score 8-9 answer on attempt > 1 after refinement', async () => {
    const turn: GateQuestionTurn = {
      id: 'turn-1-probe-1',
      index: 1,
      question: 'Clarify the coordinator monotonicity packet guarantee.',
      spokenPrompt: 'Clarify the coordinator guarantee?',
      targetDimension: 'intuition',
    };

    const result = await evaluateGateTurn({
      lessonTitle: 'Consensus',
      currentTurn: turn,
      studentAnswer: 'The coordinator attaches monotonically increasing term numbers to identify drops.',
      attemptNumber: 2,
      useMock: true,
      language: 'en',
    });

    expect(result.score).toBe(9);
    expect(result.tier).toBe('refinement');
    expect(result.mastered).toBe(true);
    expect(result.needsFollowUp).toBe(false);
  });

  it('evaluates a score 5-7 answer with harder_probe tier', async () => {
    const turn: GateQuestionTurn = {
      id: 'turn-2',
      index: 2,
      question: 'Walk through operational cycle.',
      spokenPrompt: 'Walk through operational cycle?',
      targetDimension: 'mechanism',
    };

    const result = await evaluateGateTurn({
      lessonTitle: 'Consensus',
      currentTurn: turn,
      studentAnswer: 'The leader sends out entries to replicas.',
      useMock: true,
      language: 'en',
    });

    expect(result.score).toBe(6);
    expect(result.tier).toBe('harder_probe');
    expect(result.needsFollowUp).toBe(true);
    expect(result.followUpTurn).toBeDefined();
    expect(result.followUpTurn?.tier).toBe('harder_probe');
    expect(result.followUpTurn?.parentQuestionId).toBe('turn-2');
  });

  it('triggers mini_lesson tier when student says I do not know or scores < 5', async () => {
    const turn: GateQuestionTurn = {
      id: 'turn-1',
      index: 1,
      question: 'Explain the core intuition.',
      spokenPrompt: 'Explain the core intuition?',
      targetDimension: 'intuition',
    };

    const result = await evaluateGateTurn({
      lessonTitle: 'Consensus',
      currentTurn: turn,
      studentAnswer: "i don't know",
      useMock: true,
      language: 'en',
    });

    expect(result.score).toBe(1);
    expect(result.tier).toBe('mini_lesson');
    expect(result.miniLesson).toBeDefined();
    expect(result.needsFollowUp).toBe(true);
    expect(result.followUpTurn).toBeDefined();
    expect(result.followUpTurn?.tier).toBe('mini_lesson');
    expect(result.followUpTurn?.miniLesson).toBeDefined();
  });

  it('caps the follow-up loop when max attempts are reached', async () => {
    const followUpTurn: GateQuestionTurn = {
      id: 'turn-2-probe-4',
      index: 2,
      isFollowUp: true,
      parentQuestionId: 'turn-2',
      question: 'How does the system behave when messages are delayed?',
      spokenPrompt: 'How does it behave when messages are delayed?',
      targetDimension: 'mechanism',
    };

    const result = await evaluateGateTurn({
      lessonTitle: 'Consensus',
      currentTurn: followUpTurn,
      studentAnswer: 'The system buffers messages and drops duplicates.',
      attemptNumber: 4,
      useMock: true,
      language: 'en',
    });

    expect(result.needsFollowUp).toBe(false);
  });

  it('finalizes a passing gate session when overall score >= 8', () => {
    const turns: GateQuestionTurn[] = [
      { id: '1', index: 1, question: 'Q1', spokenPrompt: 'Q1?', targetDimension: 'intuition', score: 9, studentAnswer: 'A1' },
      { id: '2', index: 2, question: 'Q2', spokenPrompt: 'Q2?', targetDimension: 'mechanism', score: 8, studentAnswer: 'A2' },
      { id: '3', index: 3, question: 'Q3', spokenPrompt: 'Q3?', targetDimension: 'boundary', score: 9, studentAnswer: 'A3' },
    ];

    const result = finalizeGateSession(turns, 'Raft Algorithm', 'en');
    expect(result.passed).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(8);
    expect(result.misconceptions).toHaveLength(0);
    expect(result.remediationTopic).toBeUndefined();
  });

  it('finalizes a failing gate session when overall score < 8 and produces remediation topic', () => {
    const turns: GateQuestionTurn[] = [
      { id: '1', index: 1, question: 'Q1', spokenPrompt: 'Q1?', targetDimension: 'intuition', score: 5, misconceptions: ['Unclear on crier analogy'], studentAnswer: 'A1' },
      { id: '2', index: 2, question: 'Q2', spokenPrompt: 'Q2?', targetDimension: 'mechanism', score: 6, misconceptions: ['Missed term monotonicity'], studentAnswer: 'A2' },
      { id: '3', index: 3, question: 'Q3', spokenPrompt: 'Q3?', targetDimension: 'boundary', score: 4, misconceptions: ['Split-brain vulnerability'], studentAnswer: 'A3' },
    ];

    const result = finalizeGateSession(turns, 'Raft Algorithm', 'en');
    expect(result.passed).toBe(false);
    expect(result.overallScore).toBeLessThan(8);
    expect(result.misconceptions.length).toBeGreaterThan(0);
    expect(result.remediationTopic).toBeDefined();
    expect(result.remediationTopic).toContain('Raft Algorithm');
  });

  it('eradicates hardcoded distributed systems text from fallback questions', () => {
    const nonDistributedTitle = 'Photosynthesis and Calvin Cycle';
    const questions = generateFallbackGateQuestions(nonDistributedTitle, 'en');

    expect(questions).toHaveLength(3);
    const combinedText = questions.map((q) => `${q.question} ${q.spokenPrompt}`).join(' ').toLowerCase();

    // Must not contain hardcoded distributed systems jargon
    expect(combinedText).not.toContain('quorum');
    expect(combinedText).not.toContain('split-brain');
    expect(combinedText).not.toContain('network partition');

    // Must dynamically derive from lesson title
    expect(questions[0].question).toBe(
      `Explain the core everyday analogy and intuitive purpose of ${nonDistributedTitle} as if teaching a twelve-year-old, without using technical buzzwords.`
    );
    expect(questions[1].question).toBe(
      `Walk me through the exact step-by-step causal chain of execution in ${nonDistributedTitle}. How does data flow from input to final output?`
    );
    expect(questions[2].question).toBe(
      `What is the primary boundary trap or failure mode in ${nonDistributedTitle}? Where does the logic break down, and how do you prevent or recover from that failure?`
    );
  });

  it('enforces strict taboo words and penalizes buzzword violations', async () => {
    const turn: GateQuestionTurn = {
      id: 'turn-1',
      index: 1,
      question: 'Explain the core intuition of Raft Consensus.',
      spokenPrompt: 'Explain the core intuition of Raft Consensus?',
      targetDimension: 'intuition',
    };

    const tabooWords = ['consensus', 'quorum', 'leader'];

    const result = await evaluateGateTurn({
      lessonTitle: 'Raft Consensus',
      currentTurn: turn,
      studentAnswer: 'The system establishes consensus across nodes by selecting a leader that collects a quorum.',
      tabooWords,
      useMock: true,
      language: 'en',
    });

    expect(result.violatedTabooWords).toBeDefined();
    expect(result.violatedTabooWords).toContain('consensus');
    expect(result.violatedTabooWords).toContain('quorum');
    expect(result.violatedTabooWords).toContain('leader');
    expect(result.score).toBeLessThanOrEqual(4);
    expect(result.mastered).toBe(false);
    expect(result.feedback).toContain('You used the forbidden word');
    expect(result.followUpTurn?.question).toContain('without using the forbidden words');
  });

  it('enforces strict taboo words with Amharic Ge\'ez terms', async () => {
    const turn: GateQuestionTurn = {
      id: 'turn-1',
      index: 1,
      question: 'የስርዓቱን አሰራር ያስረዱ።',
      spokenPrompt: 'የስርዓቱን አሰራር ያስረዱ?',
      targetDimension: 'intuition',
    };

    const tabooWords = ['ስርዓት', 'አልጎሪዝም'];

    const result = await evaluateGateTurn({
      lessonTitle: 'የተሰራጩ ስርዓቶች',
      currentTurn: turn,
      studentAnswer: 'ይህ ስርዓት የተለየ አልጎሪዝም በመጠቀም ይሰራል',
      tabooWords,
      useMock: true,
      language: 'am',
    });

    expect(result.violatedTabooWords).toBeDefined();
    expect(result.violatedTabooWords).toContain('ስርዓት');
    expect(result.violatedTabooWords).toContain('አልጎሪዝም');
    expect(result.score).toBeLessThanOrEqual(4);
    expect(result.feedback).toContain('የተከለከለውን ቃል ተጠቅመዋል');
  });

  it('strictly caps sparring loop after 3 attempts', async () => {
    const turn: GateQuestionTurn = {
      id: 'turn-1-probe-3',
      index: 1,
      isFollowUp: true,
      parentQuestionId: 'turn-1',
      question: 'Probe 3',
      spokenPrompt: 'Probe 3?',
      targetDimension: 'intuition',
    };

    const result = await evaluateGateTurn({
      lessonTitle: 'Binary Search',
      currentTurn: turn,
      studentAnswer: 'Halving the array repeatedly',
      attemptNumber: 3,
      useMock: true,
      language: 'en',
    });

    expect(result.needsFollowUp).toBe(false);
  });
});
