import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePomodoroStore } from '@/lib/pomodoroStore';

// Mock sidecarApi
vi.mock('@/lib/sidecarApi', () => ({
  sidecarApi: {
    logStudySession: vi.fn().mockResolvedValue({}),
    logNoteVisit: vi.fn().mockResolvedValue({}),
    logPracticeResult: vi.fn().mockResolvedValue({}),
  },
}));

describe('PomodoroStore', () => {
  const settings = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    sessionsBeforeLong: 4
  };

  beforeEach(() => {
    act(() => {
      usePomodoroStore.getState().clearHistory();
      usePomodoroStore.getState().reset(settings);
      usePomodoroStore.getState().setSessionCount(1);
      usePomodoroStore.getState().setMode('focus');
    });
  });

  it('initializes with default values', () => {
    const state = usePomodoroStore.getState();
    expect(state.timeLeft).toBe(25 * 60);
    expect(state.isActive).toBe(false);
    expect(state.mode).toBe('focus');
    expect(state.sessionCount).toBe(1);
  });

  it('handles start and pause', () => {
    act(() => {
      usePomodoroStore.getState().setIsActive(true);
    });
    expect(usePomodoroStore.getState().isActive).toBe(true);
    expect(usePomodoroStore.getState().lastTickTimestamp).not.toBeNull();

    act(() => {
      usePomodoroStore.getState().setIsActive(false);
    });
    expect(usePomodoroStore.getState().isActive).toBe(false);
    expect(usePomodoroStore.getState().lastTickTimestamp).toBeNull();
  });

  it('handles tick correctly', () => {
    const initialTime = usePomodoroStore.getState().timeLeft;
    act(() => {
      usePomodoroStore.getState().tick();
    });
    expect(usePomodoroStore.getState().timeLeft).toBe(initialTime - 1);
    expect(usePomodoroStore.getState().lastTickTimestamp).not.toBeNull();
  });

  it('handles manual tick with remaining time', () => {
    act(() => {
      usePomodoroStore.getState().tick(100);
    });
    expect(usePomodoroStore.getState().timeLeft).toBe(100);
  });

  it('completes focus session and moves to short break', () => {
    act(() => {
      usePomodoroStore.getState().completeSession(settings);
    });

    const state = usePomodoroStore.getState();
    expect(state.mode).toBe('short_break');
    expect(state.timeLeft).toBe(settings.shortBreak);
    expect(state.sessionCount).toBe(2);
    expect(state.history.length).toBe(1);
    expect(state.history[0].type).toBe('session');
  });

  it('completes 4 sessions and moves to long break', () => {
    act(() => {
      usePomodoroStore.getState().setSessionCount(4);
      usePomodoroStore.getState().completeSession(settings);
    });

    const state = usePomodoroStore.getState();
    expect(state.mode).toBe('long_break');
    expect(state.timeLeft).toBe(settings.longBreak);
    expect(state.sessionCount).toBe(5);
  });

  it('moves from break back to focus', () => {
    act(() => {
      usePomodoroStore.getState().setMode('short_break');
      usePomodoroStore.getState().completeSession(settings);
    });

    const state = usePomodoroStore.getState();
    expect(state.mode).toBe('focus');
    expect(state.timeLeft).toBe(settings.focus);
    expect(state.isActive).toBe(false);
  });

  it('handles reset', () => {
    act(() => {
      usePomodoroStore.getState().setTimeLeft(10);
      usePomodoroStore.getState().setIsActive(true);
      usePomodoroStore.getState().reset(settings);
    });

    const state = usePomodoroStore.getState();
    expect(state.timeLeft).toBe(settings.focus);
    expect(state.isActive).toBe(false);
    expect(state.lastTickTimestamp).toBeNull();
  });
});
