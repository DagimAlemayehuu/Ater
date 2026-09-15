'use client';

import React from 'react';

export interface InputVoiceIndicatorProps {
  isFocused?: boolean;
  className?: string;
  isProcessingOverride?: boolean;
  language?: 'en' | 'am';
}

export const InputVoiceIndicator: React.FC<InputVoiceIndicatorProps> = ({
  isFocused = false,
  className = 'top-2 right-2',
  isProcessingOverride = false,
  language = 'en',
}) => {
  const isListening = false;
  const isProcessing = isProcessingOverride;
  const isSpeaking = false;

  const activeProcessing = isProcessing || isProcessingOverride;
  const isAmharic = language === 'am';

  // If input is neither focused nor active, don't render anything
  if (!isFocused && !activeProcessing && !isListening && !isSpeaking) return null;

  // 1. Thinking / Transcribing / Submitting State: ONLY dynamic rotating spinner icon
  if (activeProcessing) {
    return (
      <div
        data-testid="input-voice-indicator-processing"
        className={`absolute z-10 pointer-events-none flex items-center justify-center p-1 rounded-md bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/60 dark:border-zinc-700/60 backdrop-blur-sm shadow-sm ${className}`}
        title={isAmharic ? 'እያሰበ ነው...' : 'Thinking / Processing...'}
      >
        <span className="w-3 h-3 rounded-full border-2 border-zinc-400 dark:border-zinc-500 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
      </div>
    );
  }

  // 2. Listening / Recording State: ONLY dynamic pulsing/blinking dot icon
  if (isListening) {
    return (
      <div
        data-testid="input-voice-indicator-listening"
        className={`absolute z-10 pointer-events-none flex items-center justify-center p-1 rounded-md bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/60 dark:border-zinc-700/60 backdrop-blur-sm shadow-sm ${className}`}
        title={isAmharic ? 'እያዳመጠ ነው...' : 'Listening...'}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-600 dark:bg-zinc-300" />
        </span>
      </div>
    );
  }

  // 3. Speaking / TTS Playback State: ONLY dynamic audio wave pulse icon
  if (isSpeaking && isFocused) {
    return (
      <div
        data-testid="input-voice-indicator-speaking"
        className={`absolute z-10 pointer-events-none flex items-center justify-center p-1 rounded-md bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/60 dark:border-zinc-700/60 backdrop-blur-sm shadow-sm ${className}`}
        title={isAmharic ? 'በመናገር ላይ...' : 'Speaking...'}
      >
        <svg className="w-3 h-3 text-zinc-700 dark:text-zinc-200 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </div>
    );
  }

  // 4. Focused Idle Shortcut State: ONLY clean mic/shortcut icon, zero text
  if (isFocused) {
    return (
      <div
        data-testid="input-voice-indicator-idle"
        className={`absolute z-10 pointer-events-none flex items-center justify-center p-1 rounded-md bg-zinc-100/60 dark:bg-zinc-800/60 text-zinc-400 transition-opacity ${className}`}
        title="Hold Ctrl+K to speak"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>
    );
  }

  return null;
};
