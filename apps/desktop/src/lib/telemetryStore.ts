import { create } from 'zustand';
import { sidecarApi } from './sidecarApi';

interface TelemetryState {
  queueStatus: any | null;
  inboxFiles: any[];
  isLoadingInbox: boolean;
  isPolling: boolean;
  
  // Actions
  fetchStatus: () => Promise<void>;
  fetchInbox: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  setQueueStatus: (status: any) => void;
}

let pollTimer: NodeJS.Timeout | null = null;

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  queueStatus: null,
  inboxFiles: [],
  isLoadingInbox: false,
  isPolling: false,

  setQueueStatus: (status) => set({ queueStatus: status }),

  fetchStatus: async () => {
    try {
      const res = await sidecarApi.aterQueueStatus();
      set({ queueStatus: res });
    } catch (err) {
      console.error('[Telemetry] Failed to fetch status:', err);
    }
  },

  fetchInbox: async () => {
    set({ isLoadingInbox: true });
    try {
      const res = await sidecarApi.aterListInbox();
      set({ inboxFiles: res.files || [] });
    } catch (err) {
      console.error('[Telemetry] Failed to fetch inbox:', err);
    } finally {
      set({ isLoadingInbox: false });
    }
  },

  startPolling: (intervalMs = 2000) => {
    if (get().isPolling) return;
    
    set({ isPolling: true });
    
    const poll = async () => {
      if (!get().isPolling) return;
      await get().fetchStatus();
      pollTimer = setTimeout(poll, intervalMs);
    };
    
    poll();
  },

  stopPolling: () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    set({ isPolling: false });
  }
}));
