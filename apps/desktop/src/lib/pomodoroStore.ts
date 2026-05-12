import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sidecarApi } from './sidecarApi';

export type TimerMode = 'focus' | 'short_break' | 'long_break';
export type HistoryType = 'session' | 'note_focus' | 'practice';

export interface HistoryItem {
  id: string;
  type: HistoryType;
  hub?: string;
  notePath?: string;
  timestamp: number;
  duration?: number; // in seconds
  score?: number;
  totalQuestions?: number;
  metadata?: any;
}

interface PomodoroState {
  timeLeft: number;
  isActive: boolean;
  mode: TimerMode;
  sessionCount: number;
  currentHub: string;
  history: HistoryItem[];
  isMuted: boolean;
  showOverlay: boolean;
  showStats: boolean;
  
  // Actions
  setTimeLeft: (time: number) => void;
  setIsActive: (active: boolean) => void;
  setMode: (mode: TimerMode) => void;
  setSessionCount: (count: number | ((prev: number) => number)) => void;
  setCurrentHub: (hub: string) => void;
  setIsMuted: (muted: boolean) => void;
  setShowOverlay: (show: boolean) => void;
  setShowStats: (show: boolean) => void;
  addHistory: (session: { hub: string; duration: number }) => void;
  addNoteFocus: (notePath: string, duration: number, hub?: string) => void;
  addPracticeResult: (hub: string, score: number, total: number, notePath?: string) => void;
  clearHistory: () => void;
  tick: () => void;
  reset: (settings: { focus: number, shortBreak: number, longBreak: number }) => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      timeLeft: 25 * 60,
      isActive: false,
      mode: 'focus',
      sessionCount: 1,
      currentHub: '',
      history: [],
      isMuted: false,
      showOverlay: false,
      showStats: false,

      setTimeLeft: (time) => set({ timeLeft: time }),
      setIsActive: (active) => set({ isActive: active }),
      setMode: (mode) => set({ mode }),
      setSessionCount: (count) => set((state) => ({ 
        sessionCount: typeof count === 'function' ? count(state.sessionCount) : count 
      })),
      setCurrentHub: (hub) => set({ currentHub: hub }),
      setIsMuted: (muted) => set({ isMuted: muted }),
      setShowOverlay: (show) => set({ showOverlay: show }),
      setShowStats: (show) => set({ showStats: show }),
      
      addHistory: (session) => set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        // Async API call
        sidecarApi.logStudySession(session.hub, session.duration * 60, state.mode).catch(console.error);
        
        return {
          history: [
            ...state.history,
            {
              id,
              type: 'session',
              hub: session.hub,
              timestamp: Date.now(),
              duration: session.duration
            }
          ]
        };
      }),

      addNoteFocus: (notePath, duration, hub) => set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        // Async API call
        sidecarApi.logNoteVisit(notePath, duration).catch(console.error);

        return {
          history: [
            ...state.history,
            {
              id,
              type: 'note_focus',
              notePath,
              hub: hub || state.currentHub,
              timestamp: Date.now(),
              duration
            }
          ]
        };
      }),

      addPracticeResult: (hub, score, total, notePath) => set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        // Async API call
        sidecarApi.logPracticeResult(hub, score, total, notePath).catch(console.error);

        return {
          history: [
            ...state.history,
            {
              id,
              type: 'practice',
              hub,
              score,
              totalQuestions: total,
              notePath,
              timestamp: Date.now()
            }
          ]
        };
      }),
      
      clearHistory: () => set({ history: [] }),
      
      tick: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
      
      reset: (settings) => set((state) => ({
        isActive: false,
        timeLeft: state.mode === 'focus' ? settings.focus : (state.mode === 'short_break' ? settings.shortBreak : settings.longBreak)
      }))
    }),
    {
      name: 'ater-pomodoro-state',
    }
  )
);

