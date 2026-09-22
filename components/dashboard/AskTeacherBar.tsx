'use client';

import React, { useState } from 'react';
import { InputVoiceIndicator } from '@/components/voice/InputVoiceIndicator';
import { translations, AppLanguage } from '@/lib/i18n/translations';

export interface AskTeacherBarProps {
  onAsk: (question: string) => Promise<void>;
  isLoading?: boolean;
  language?: AppLanguage;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const AskTeacherBar: React.FC<AskTeacherBarProps> = ({
  onAsk,
  isLoading = false,
  language = 'en',
  disabled = false,
  placeholder,
  className = '',
}) => {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const t = translations[language] || translations.en;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading || disabled) return;
    setQuestion('');
    await onAsk(trimmed);
  };

  const activePlaceholder =
    placeholder || (isLoading ? (language === 'am' ? 'እያሰበ ነው...' : 'Thinking...') : t.askTeacherBottomPlaceholder);

  return (
    <div className={`p-4 bg-[#fbf7f0] dark:bg-zinc-950 border-t border-parchment-300/80 dark:border-zinc-900/60 pointer-events-auto shrink-0 ${className}`}>
      <div className="max-w-3xl w-full mx-auto">
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-center gap-2 rounded-2xl border bg-parchment-50 dark:bg-zinc-900/90 px-4 py-2.5 shadow-xs transition-all ${
            isFocused
              ? 'border-parchment-500 dark:border-zinc-600 ring-2 ring-parchment-300 dark:ring-zinc-800'
              : 'border-parchment-300 dark:border-zinc-800 hover:border-parchment-400 dark:hover:border-zinc-700'
          }`}
        >
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={question}
              disabled={disabled || isLoading}
              onChange={(e) => setQuestion(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={activePlaceholder}
              className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none pr-8 disabled:opacity-50"
            />
            <InputVoiceIndicator
              isFocused={isFocused}
              isProcessingOverride={false}
              language={language}
              className="right-0 top-1/2 -translate-y-1/2"
            />
          </div>

          <button
            type="submit"
            disabled={!question.trim() || isLoading || disabled}
            aria-label={t.askBtn}
            className="shrink-0 p-1.5 rounded-xl bg-parchment-200 hover:bg-parchment-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-parchment-400 dark:border-zinc-700/80 disabled:opacity-30 transition-colors cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <span className="flex items-center justify-center w-3.5 h-3.5">
                <span className="w-3 h-3 rounded-full border border-zinc-400 dark:border-zinc-500 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
              </span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
