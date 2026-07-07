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
  lastTickTimestamp: number | null;
  
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
  tick: (remaining?: number) => void;
  reset: (settings: { focus: number, shortBreak: number, longBreak: number }) => void;
  completeSession: (settings: { focus: number, shortBreak: number, longBreak: number, sessionsBeforeLong: number }) => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      timeLeft: 25 * 60,
      isActive: false,
      mode: 'focus',
      sessionCount: 1,
      currentHub: '',
      history: [],
      isMuted: false,
      showOverlay: false,
      showStats: false,
      lastTickTimestamp: null,

      setTimeLeft: (time) => set({ timeLeft: time }),
      setIsActive: (active) => set({
        isActive: active,
        lastTickTimestamp: active ? Date.now() : null
      }),
      setMode: (mode) => set({ mode }),
      setSessionCount: (count) => set((state) => ({ 
        sessionCount: typeof count === 'function' ? count(state.sessionCount) : count 
      })),
      setCurrentHub: (hub) => set({ currentHub: hub }),
      setIsMuted: (muted) => set({ isMuted: muted }),
      setShowOverlay: (show) => set({ showOverlay: show }),
      setShowStats: (show) => set({ showStats: show }),
      
      addHistory: (session) => set((state) => {
        const id = crypto.randomUUID();
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
        const id = crypto.randomUUID();
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
        const id = crypto.randomUUID();
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
      
      tick: (remaining) => set((state) => ({
        timeLeft: remaining !== undefined ? Math.max(0, remaining) : Math.max(0, state.timeLeft - 1),
        lastTickTimestamp: Date.now()
      })),
      
      reset: (settings) => set((state) => ({
        isActive: false,
        lastTickTimestamp: null,
        timeLeft: state.mode === 'focus' ? settings.focus : (state.mode === 'short_break' ? settings.shortBreak : settings.longBreak)
      })),

      completeSession: (settings) => {
        const state = get();
        const mode = state.mode;
        const currentHub = state.currentHub || 'Flow';

        if (mode === 'focus') {
          const isLongBreak = state.sessionCount % settings.sessionsBeforeLong === 0;
          const nextMode = isLongBreak ? 'long_break' : 'short_break';
          const nextTime = isLongBreak ? settings.longBreak : settings.shortBreak;

          state.addHistory({ hub: currentHub, duration: settings.focus / 60 });

          set({
            mode: nextMode,
            timeLeft: nextTime,
            sessionCount: state.sessionCount + 1,
            isActive: false,
            lastTickTimestamp: null
          });
        } else {
          set({
            mode: 'focus',
            timeLeft: settings.focus,
            isActive: false,
            lastTickTimestamp: null
          });
        }
      }
    }),
    {
      name: 'ater-pomodoro-state',
      onRehydrateStorage: (state) => {
        return (rehydratedState) => {
          if (rehydratedState?.isActive && rehydratedState.lastTickTimestamp) {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - rehydratedState.lastTickTimestamp) / 1000);
            if (elapsedSeconds > 0) {
              const newTime = Math.max(0, rehydratedState.timeLeft - elapsedSeconds);
              rehydratedState.setTimeLeft(newTime);
              // We don't automatically trigger completion here to avoid side effects during rehydration,
              // the controller will handle the tick/completion if timeLeft is 0.
            }
          }
        };
      },
    }
  )
);

