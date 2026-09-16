'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface PageHandlers {
  onSearch?: (query: string, limit?: number) => Promise<any[]>;
  onCompile?: (title: string, sourceText?: string, domain?: string) => Promise<any | null>;
  onEvaluate?: (concept: string, explanation: string) => Promise<any | null>;
  onOpenFeynman?: (concept?: string) => void;
  getActiveState?: () => { activeNoteTitle?: string; papers?: Array<{ id: string; title: string }> };
}

interface VoiceBridgeContextType {
  status: string;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  language: 'en' | 'am';
  setLanguage: (lang: 'en' | 'am') => void;
  startTalking: () => Promise<void>;
  stopTalking: () => void;
  toggleMic: () => void;
  registerPageHandlers: (handlers: PageHandlers) => void;
}

const VoiceBridgeContext = createContext<VoiceBridgeContextType>({
  status: 'Hold Space to talk',
  isListening: false,
  isSpeaking: false,
  isProcessing: false,
  language: 'en',
  setLanguage: () => {},
  startTalking: async () => {},
  stopTalking: () => {},
  toggleMic: () => {},
  registerPageHandlers: () => {},
});

export const useVoiceBridge = () => useContext(VoiceBridgeContext);

export const VoxideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<string>('Hold Space to talk');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [language, setLanguageState] = useState<'en' | 'am'>('en');

  const setLanguage = useCallback((lang: 'en' | 'am') => {
    setLanguageState(lang);
  }, []);

  const registerPageHandlers = useCallback((_handlers: PageHandlers) => {}, []);

  const startTalking = useCallback(async () => {
    setIsListening(true);
  }, []);

  const stopTalking = useCallback(() => {
    setIsListening(false);
  }, []);

  const toggleMic = useCallback(() => {
    setIsListening((prev) => !prev);
  }, []);

  return (
    <VoiceBridgeContext.Provider
      value={{
        status,
        isListening,
        isSpeaking,
        isProcessing,
        language,
        setLanguage,
        startTalking,
        stopTalking,
        toggleMic,
        registerPageHandlers,
      }}
    >
      {children}
    </VoiceBridgeContext.Provider>
  );
};
