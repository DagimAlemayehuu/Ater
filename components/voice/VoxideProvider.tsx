'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { SocraticVoiceSession, createSocraticVoiceSession, SocraticVoiceSessionConfig } from '@/lib/voice/socraticSession';
import { setVoiceModeActive } from '@/lib/voice/ttsClient';

export interface PageHandlers {
  onSearch?: (query: string, limit?: number) => Promise<any[]>;
  onCompile?: (title: string, sourceText?: string, domain?: string) => Promise<any | null>;
  onEvaluate?: (concept: string, explanation: string) => Promise<any | null>;
  onOpenFeynman?: (concept?: string) => void;
  getActiveState?: () => { activeNoteTitle?: string; papers?: Array<{ id: string; title: string }> };
}

export interface VoxideTurn {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface VoxideContextType {
  mode: 'voice' | 'library';
  setMode: (mode: 'voice' | 'library') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
  status: string;
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  liveSpeech: string;
  currentAssistantText: string;
  turns: VoxideTurn[];
  lastScore: number | null;
  lastFeedback: string | null;
  audioRms: number;
  isConnected: boolean;
  language: 'en' | 'am';
  setLanguage: (lang: 'en' | 'am') => void;
  startTalking: () => Promise<void>;
  stopTalking: () => void;
  toggleMic: () => void;
  sendText: (text: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  stopAudio: () => void;
  restartSession: () => void;
  connect: (config?: Partial<SocraticVoiceSessionConfig>) => Promise<boolean>;
  updateContext: (config: Partial<SocraticVoiceSessionConfig>) => void;
  disconnect: () => void;
  registerPageHandlers: (handlers: PageHandlers) => void;
  registerTool: (name: string, handler: (args: any) => Promise<any>) => void;
  clearTranscript: () => void;
}

const VoxideContext = createContext<VoxideContextType | null>(null);

export const useVoxide = (): VoxideContextType => {
  const context = useContext(VoxideContext);
  if (!context) {
    throw new Error('useVoxide must be used within a VoxideProvider');
  }
  return context;
};

export const useSocraticVoice = useVoxide;
export const useVoiceBridge = (): VoxideContextType => {
  const context = useContext(VoxideContext);
  if (!context) {
    // Return graceful fallback stub for unmounted / test environments
    return {
      mode: 'library',
      setMode: () => {},
      isMuted: true,
      setIsMuted: () => {},
      toggleMute: () => {},
      status: 'Hold Space to talk',
      isListening: false,
      isSpeaking: false,
      isPaused: false,
      isProcessing: false,
      liveSpeech: '',
      currentAssistantText: '',
      turns: [],
      lastScore: null,
      lastFeedback: null,
      audioRms: 0,
      isConnected: false,
      language: 'en',
      setLanguage: () => {},
      startTalking: async () => {},
      stopTalking: () => {},
      toggleMic: () => {},
      sendText: async () => {},
      pauseAudio: async () => {},
      resumeAudio: async () => {},
      stopAudio: () => {},
      restartSession: () => {},
      connect: async () => false,
      updateContext: () => {},
      disconnect: () => {},
      registerPageHandlers: () => {},
      registerTool: () => {},
      clearTranscript: () => {},
    };
  }
  return context;
};

export const VoxideProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: 'voice' | 'library';
}> = ({ children, initialMode = 'library' }) => {
  const [mode, setModeState] = useState<'voice' | 'library'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ater_voxide_mode');
      if (stored === 'voice' || stored === 'library') return stored;
    }
    return initialMode;
  });
  const [isMuted, setIsMutedState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('ater_voxide_mode');
      if (storedMode === 'voice') return false;
      if (storedMode === 'library') return true;
      const storedMuted = localStorage.getItem('ater_voxide_muted');
      if (storedMuted !== null) return storedMuted === 'true';
    }
    return initialMode === 'library';
  });

  const [status, setStatus] = useState<string>('Ready');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [language, setLanguageState] = useState<'en' | 'am'>('en');

  const [liveSpeech, setLiveSpeech] = useState<string>('');
  const [currentAssistantText, setCurrentAssistantText] = useState<string>('');
  const [turns, setTurns] = useState<VoxideTurn[]>([]);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [audioRms, setAudioRms] = useState<number>(0);

  const customToolsRef = useRef<Map<string, (args: any) => Promise<any>>>(new Map());
  const sessionRef = useRef<SocraticVoiceSession | null>(null);
  const pageHandlersRef = useRef<PageHandlers>({});
  const isSpaceDownRef = useRef<boolean>(false);

  // Initialize SocraticVoiceSession singleton
  if (!sessionRef.current) {
    sessionRef.current = createSocraticVoiceSession({
      initialMode,
      isMuted,
      language,
      onGrade: (res) => {
        setLastScore(res.score);
        setLastFeedback(res.feedback);
        const customHandler = customToolsRef.current.get('gradeExplanation');
        if (customHandler) {
          customHandler(res).catch(() => {});
        }
      },
      onToolCall: (call) => {
        const handler = customToolsRef.current.get(call.name);
        if (handler) {
          handler(call.args).catch((err) => console.warn(`Tool handler error for ${call.name}:`, err));
        }
      },
      onTranscript: (turn) => {
        setTurns((prev) => [...prev, turn]);
        if (turn.role === 'assistant') {
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentAssistantText('');
        } else if (turn.role === 'user') {
          setLiveSpeech('');
        }
      },
      onAssistantChunk: (chunk) => {
        setCurrentAssistantText(chunk.fullText);
        setIsSpeaking(true);
        setIsPaused(false);
      },
      onLiveSpeech: (speech) => {
        setLiveSpeech(speech.text);
      },
      onAudioLevel: (lvl) => {
        setAudioRms(lvl.level);
      },
      onRecordingStatus: (st) => {
        setIsListening(st.recording);
        setIsProcessing(st.processing);
        if (st.recording) {
          setStatus('Listening...');
        } else if (st.processing) {
          setStatus('Processing...');
        } else {
          setStatus('Ready');
        }
      },
      onConnected: () => {
        setIsConnected(true);
        setStatus('Connected to Gemini Live');
      },
      onDisconnected: () => {
        setIsConnected(false);
        setStatus('Disconnected');
      },
    });
  }

  const setMode = useCallback((newMode: 'voice' | 'library') => {
    setModeState(newMode);
    sessionRef.current?.setMode(newMode);
    try {
      localStorage.setItem('ater_voxide_mode', newMode);
    } catch (_e) {}
    if (newMode === 'library') {
      setVoiceModeActive(false);
      setIsMutedState(true);
      sessionRef.current?.setMuted(true);
      try {
        localStorage.setItem('ater_voxide_muted', 'true');
      } catch (_e) {}
    } else {
      setVoiceModeActive(true);
      setIsMutedState(false);
      sessionRef.current?.setMuted(false);
      try {
        localStorage.setItem('ater_voxide_muted', 'false');
      } catch (_e) {}
    }
  }, []);

  useEffect(() => {
    setVoiceModeActive(mode === 'voice');
  }, [mode]);

  const setIsMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    sessionRef.current?.setMuted(muted);
    try {
      localStorage.setItem('ater_voxide_muted', String(muted));
    } catch (_e) {}
  }, []);

  const toggleMute = useCallback(() => {
    setIsMutedState((prev) => {
      const next = !prev;
      sessionRef.current?.setMuted(next);
      try {
        localStorage.setItem('ater_voxide_muted', String(next));
      } catch (_e) {}
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang: 'en' | 'am') => {
    setLanguageState(lang);
    sessionRef.current?.updateSessionContext({ language: lang });
  }, []);

  const startTalking = useCallback(async () => {
    if (sessionRef.current) {
      await sessionRef.current.startVoiceCapture();
    }
  }, []);

  const stopTalking = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.stopVoiceCapture();
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopTalking();
    } else {
      startTalking();
    }
  }, [isListening, startTalking, stopTalking]);

  const sendText = useCallback(async (text: string) => {
    if (sessionRef.current) {
      await sessionRef.current.sendText(text);
    }
  }, []);

  const connect = useCallback(async (config?: Partial<SocraticVoiceSessionConfig>) => {
    if (sessionRef.current) {
      if (config) {
        sessionRef.current.updateSessionContext(config);
      }
      return await sessionRef.current.connect();
    }
    return false;
  }, []);

  const updateContext = useCallback((config: Partial<SocraticVoiceSessionConfig>) => {
    sessionRef.current?.updateSessionContext(config);
  }, []);

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect();
  }, []);

  const registerPageHandlers = useCallback((handlers: PageHandlers) => {
    pageHandlersRef.current = handlers;
  }, []);

  const registerTool = useCallback((name: string, handler: (args: any) => Promise<any>) => {
    customToolsRef.current.set(name, handler);
  }, []);

  const pauseAudio = useCallback(async () => {
    setIsPaused(true);
    await sessionRef.current?.pauseAudio();
  }, []);

  const resumeAudio = useCallback(async () => {
    setIsPaused(false);
    await sessionRef.current?.resumeAudio();
  }, []);

  const stopAudio = useCallback(() => {
    setIsPaused(false);
    sessionRef.current?.stopAudio();
  }, []);

  const restartSession = useCallback(() => {
    setIsPaused(false);
    sessionRef.current?.restartSession();
  }, []);

  const clearTranscript = useCallback(() => {
    setTurns([]);
    setLiveSpeech('');
    setCurrentAssistantText('');
    setLastScore(null);
    setLastFeedback(null);
  }, []);

  // Global Hold-to-Talk Spacebar Listener:
  // In Voice Mode: Press & hold Spacebar to record, release to send.
  // In Library Mode: Normal space typing (completely unintercepted).
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'voice') return;

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
      if (activeTag === 'input' || activeTag === 'textarea' || isEditable) {
        return; // Allow standard typing inside inputs
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return;
        if (!isSpaceDownRef.current) {
          isSpaceDownRef.current = true;
          startTalking();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (mode !== 'voice') return;

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
      if (activeTag === 'input' || activeTag === 'textarea' || isEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        isSpaceDownRef.current = false;
        stopTalking();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, startTalking, stopTalking]);

  return (
    <VoxideContext.Provider
      value={{
        mode,
        setMode,
        isMuted,
        setIsMuted,
        toggleMute,
        status,
        isListening,
        isSpeaking,
        isPaused,
        isProcessing,
        liveSpeech,
        currentAssistantText,
        turns,
        lastScore,
        lastFeedback,
        audioRms,
        isConnected,
        language,
        setLanguage,
        startTalking,
        stopTalking,
        toggleMic,
        sendText,
        pauseAudio,
        resumeAudio,
        stopAudio,
        restartSession,
        connect,
        updateContext,
        disconnect,
        registerPageHandlers,
        registerTool,
        clearTranscript,
      }}
    >
      {children}
    </VoxideContext.Provider>
  );
};
