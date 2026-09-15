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
    <div className={`sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-zinc-950 dark:via-zinc-950/95 dark:to-transparent pt-4 pointer-events-auto ${className}`}>
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className={`relative flex items-center gap-2 rounded-2xl border bg-white dark:bg-zinc-900/90 px-4 py-2.5 shadow-sm transition-all ${
            isFocused
              ? 'border-zinc-400 dark:border-zinc-600 ring-2 ring-zinc-200 dark:ring-zinc-800'
              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
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
            className="shrink-0 p-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300/80 dark:border-zinc-700/80 disabled:opacity-30 transition-colors"
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
