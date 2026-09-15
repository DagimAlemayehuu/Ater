'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import type { LessonInlineMCQ } from '@/types';

export interface InlineMCQCardProps {
  mcq: LessonInlineMCQ;
  language?: 'en' | 'am';
}

export const InlineMCQCard: React.FC<InlineMCQCardProps> = ({ mcq, language = 'en' }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    mcq.userSelectedIndex !== undefined ? mcq.userSelectedIndex : null
  );
  const [revealed, setRevealed] = useState<boolean>(mcq.userSelectedIndex !== undefined);

  const isAmharic = language === 'am';
  const hasAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === mcq.correctOptionIndex;

  const handleSelect = (index: number) => {
    if (hasAnswered) return; // Prevent changing answer once submitted
    setSelectedIndex(index);
    setRevealed(true);
    mcq.userSelectedIndex = index;
    mcq.isCorrect = index === mcq.correctOptionIndex;
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  const sectionLabel =
    mcq.sectionIndex === 1
      ? isAmharic
        ? 'የፈተና ማረጋገጫ 01 · ፅንሰ-ሀሳባዊ ግንዛቤ'
        : 'Active Recall Check 01 · Mental Model Intuition'
      : isAmharic
        ? 'የፈተና ማረጋገጫ 02 · የአሰራር ሂደት'
        : 'Active Recall Check 02 · Operational Mechanism';

  return (
    <div
      data-testid={`inline-mcq-${mcq.id}`}
      className="my-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 transition-all shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <HelpCircle size={13} className="text-zinc-500 dark:text-zinc-400" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
            {sectionLabel}
          </span>
        </div>
        {hasAnswered && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700"
          >
            {isCorrect ? (
              <>
                <CheckCircle2 size={11} className="text-zinc-700 dark:text-zinc-300" />
                <span>{isAmharic ? 'ትክክል' : 'Correct'}</span>
              </>
            ) : (
              <>
                <XCircle size={11} className="text-zinc-500 dark:text-zinc-400" />
                <span>{isAmharic ? 'ስህተት' : 'Incorrect'}</span>
              </>
            )}
          </span>
        )}
      </div>

      <h4 className="text-xs font-medium leading-relaxed mb-3 text-zinc-900 dark:text-zinc-100">
        {mcq.question}
      </h4>

      <div className="space-y-1.5">
        {mcq.options.map((option, idx) => {
          let btnStyle =
            'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200';

          if (hasAnswered) {
            if (idx === mcq.correctOptionIndex) {
              btnStyle =
                'border-zinc-800 dark:border-zinc-200 bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-medium';
            } else if (idx === selectedIndex && !isCorrect) {
              btnStyle =
                'border-zinc-400 dark:border-zinc-600 bg-zinc-100/70 dark:bg-zinc-900/70 text-zinc-500 dark:text-zinc-400 line-through';
            } else {
              btnStyle = 'opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSelect(idx)}
              className={`w-full flex items-center text-left p-2.5 rounded-lg border text-xs transition-all ${btnStyle} ${
                hasAnswered ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span className="w-4 h-4 rounded-md border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-mono mr-2.5 shrink-0 text-zinc-500 dark:text-zinc-400">
                {optionLabels[idx] || idx + 1}
              </span>
              <span className="flex-1 leading-snug">{option}</span>
              {hasAnswered && idx === mcq.correctOptionIndex && (
                <CheckCircle2 size={13} className="text-zinc-700 dark:text-zinc-300 shrink-0 ml-2" />
              )}
              {hasAnswered && idx === selectedIndex && !isCorrect && (
                <XCircle size={13} className="text-zinc-500 dark:text-zinc-400 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {revealed && mcq.explanation && (
        <div className="mt-2.5 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
          <span className="font-medium text-zinc-900 dark:text-zinc-200 mr-1.5">
            {isAmharic ? 'ማብራሪያ፡' : 'Key Insight:'}
          </span>
          {mcq.explanation}
        </div>
      )}
    </div>
  );
};
