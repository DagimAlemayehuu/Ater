'use client';

import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { translations, AppLanguage } from '@/lib/i18n/translations';

export interface AskTeacherBarProps {
  onAsk: (question: string) => Promise<void>;
  isLoading?: boolean;
  language?: AppLanguage;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  mode?: 'voice' | 'library';
  isListening?: boolean;
  isProcessing?: boolean;
  liveSpeech?: string;
  onHoldToTalkStart?: () => void;
  onHoldToTalkEnd?: () => void;
}

export const AskTeacherBar: React.FC<AskTeacherBarProps> = ({
  onAsk,
  isLoading = false,
  language = 'en',
  disabled = false,
  placeholder,
  className = '',
  mode = 'library',
  isListening = false,
  isProcessing = false,
  liveSpeech = '',
  onHoldToTalkStart,
  onHoldToTalkEnd,
}) => {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const t = translations[language] || translations.en;
  const isAmharic = language === 'am';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading || disabled) return;
    setQuestion('');
    await onAsk(trimmed);
  };

  const activePlaceholder =
    placeholder || (isLoading ? (isAmharic ? 'በማሰብ ላይ...' : 'Thinking...') : t.askTeacherBottomPlaceholder);

  // VOICE MODE INTERACTION: Minimalist, Calm Mic Control
  if (mode === 'voice') {
    return (
      <div className={`p-3 bg-[#fbf7f0]/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-parchment-300/60 dark:border-zinc-900 pointer-events-auto shrink-0 select-none ${className}`}>
        <div className="max-w-md w-full mx-auto">
          <button
            type="button"
            onMouseDown={onHoldToTalkStart}
            onMouseUp={onHoldToTalkEnd}
            onTouchStart={onHoldToTalkStart}
            onTouchEnd={onHoldToTalkEnd}
            disabled={disabled}
            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-full border transition-all cursor-pointer shadow-xs ${
              isListening
                ? 'border-rose-500/80 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/40'
                : isProcessing || isLoading
                  ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-100/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`p-1.5 rounded-full transition-colors shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white'
                    : isProcessing || isLoading
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Mic size={14} />
              </div>

              <div className="min-w-0 flex-1 text-left">
                {isListening ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400 truncate">
                      {isAmharic ? 'እያዳመጠ ነው... ለመላክ ይልቀቁ' : 'Listening... Release to send'}
                    </span>
                    {liveSpeech ? (
                      <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 truncate">
                        "{liveSpeech}"
                      </span>
                    ) : null}
                  </div>
                ) : isProcessing || isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-zinc-400 dark:border-zinc-600 border-t-zinc-900 dark:border-t-zinc-100 animate-spin shrink-0" />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate">
                      {isAmharic ? 'በማሰብ ላይ...' : 'Thinking...'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {isAmharic ? 'ጥያቄ ለመጠየቅ Space ይያዙ' : 'Hold Space to ask'}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <kbd className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                Space
              </kbd>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // LIBRARY MODE INTERACTION (Pure Silent Minimal Typing)
  return (
    <div className={`p-3 bg-[#fbf7f0]/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-parchment-300/60 dark:border-zinc-900 pointer-events-auto shrink-0 ${className}`}>
      <div className="max-w-2xl w-full mx-auto">
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-center gap-2 rounded-xl border bg-white dark:bg-zinc-900/90 px-3.5 py-2 shadow-xs transition-all ${
            isFocused
              ? 'border-zinc-400 dark:border-zinc-600 ring-1 ring-zinc-300 dark:ring-zinc-700'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <input
            type="text"
            value={question}
            disabled={disabled || isLoading}
            onChange={(e) => setQuestion(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={activePlaceholder}
            className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none pr-2 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!question.trim() || isLoading || disabled}
            aria-label={t.askBtn}
            className="shrink-0 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 disabled:opacity-30 transition-colors cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <span className="flex items-center justify-center w-3 h-3">
                <span className="w-2.5 h-2.5 rounded-full border border-zinc-400 border-t-white dark:border-t-zinc-900 animate-spin" />
              </span>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
