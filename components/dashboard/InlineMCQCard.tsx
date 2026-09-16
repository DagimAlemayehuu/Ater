'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Maximize2, RotateCcw, ArrowRight } from 'lucide-react';
import { ArtifactModal } from '@/components/viewers/ArtifactModal';
import type { LessonInlineQuestion } from '@/types';

export interface InlineMCQCardProps {
  mcq: LessonInlineQuestion;
  language?: 'en' | 'am';
  disableExpand?: boolean;
}

export const InlineMCQCard: React.FC<InlineMCQCardProps> = ({
  mcq,
  language = 'en',
  disableExpand = false,
}) => {
  const isAmharic = language === 'am';
  const qType = mcq.type || 'mcq';

  // MCQ state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    mcq.userSelectedIndex !== undefined ? mcq.userSelectedIndex : null
  );

  // True / False state
  const [selectedBool, setSelectedBool] = useState<boolean | null>(
    mcq.userSelectedBoolean !== undefined ? mcq.userSelectedBoolean : null
  );

  // Fill in the Blank state
  const [fillBlankInput, setFillBlankInput] = useState<string>(
    mcq.userTextAnswer || ''
  );
  const [isFillSubmitted, setIsFillSubmitted] = useState<boolean>(
    !!mcq.userTextAnswer
  );

  // Matching state
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [userMatches, setUserMatches] = useState<Record<string, string>>(
    mcq.userMatches || {}
  );
  const [isMatchingSubmitted, setIsMatchingSubmitted] = useState<boolean>(
    !!mcq.userMatches
  );

  // Short Answer state
  const [shortAnswerInput, setShortAnswerInput] = useState<string>(
    mcq.userTextAnswer || ''
  );
  const [isShortAnswerSubmitted, setIsShortAnswerSubmitted] = useState<boolean>(
    !!mcq.userTextAnswer
  );

  const [isExpanded, setIsExpanded] = useState(false);

  // Evaluation status
  let hasAnswered = false;
  let isCorrect = false;

  if (qType === 'mcq') {
    hasAnswered = selectedIndex !== null;
    isCorrect = selectedIndex === mcq.correctOptionIndex;
  } else if (qType === 'true_false') {
    hasAnswered = selectedBool !== null;
    isCorrect = selectedBool === mcq.correctBoolean;
  } else if (qType === 'fill_blank') {
    hasAnswered = isFillSubmitted;
    const cleanAnswer = fillBlankInput.trim().toLowerCase();
    isCorrect = (mcq.acceptedAnswers || []).some(
      (ans) => ans.trim().toLowerCase() === cleanAnswer
    );
  } else if (qType === 'matching') {
    hasAnswered = isMatchingSubmitted;
    const pairs = mcq.matchingPairs || [];
    if (pairs.length > 0) {
      isCorrect = pairs.every((p) => userMatches[p.id] === p.id);
    }
  } else if (qType === 'short_answer') {
    hasAnswered = isShortAnswerSubmitted;
    const cleanAnswer = shortAnswerInput.trim().toLowerCase();
    const keywords = mcq.targetKeywords || [];
    if (keywords.length > 0) {
      const matchCount = keywords.filter((kw) =>
        cleanAnswer.includes(kw.toLowerCase())
      ).length;
      isCorrect = matchCount >= Math.ceil(keywords.length * 0.5);
    } else {
      isCorrect = cleanAnswer.length >= 8;
    }
  }

  // Handlers
  const handleSelect = (index: number) => {
    if (hasAnswered) return;
    setSelectedIndex(index);
    mcq.userSelectedIndex = index;
    mcq.isCorrect = index === mcq.correctOptionIndex;
  };

  const handleBoolSelect = (val: boolean) => {
    if (hasAnswered) return;
    setSelectedBool(val);
    mcq.userSelectedBoolean = val;
    mcq.isCorrect = val === mcq.correctBoolean;
  };

  const handleFillSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fillBlankInput.trim() || hasAnswered) return;
    setIsFillSubmitted(true);
    mcq.userTextAnswer = fillBlankInput.trim();
    const cleanAnswer = fillBlankInput.trim().toLowerCase();
    mcq.isCorrect = (mcq.acceptedAnswers || []).some(
      (ans) => ans.trim().toLowerCase() === cleanAnswer
    );
  };

  const handleMatchingClickLeft = (leftId: string) => {
    if (hasAnswered) return;
    setActiveLeftId(activeLeftId === leftId ? null : leftId);
  };

  const handleMatchingClickRight = (rightId: string) => {
    if (hasAnswered || !activeLeftId) return;
    setUserMatches((prev) => ({
      ...prev,
      [activeLeftId]: rightId,
    }));
    setActiveLeftId(null);
  };

  const handleMatchingVerify = () => {
    if (hasAnswered) return;
    setIsMatchingSubmitted(true);
    mcq.userMatches = userMatches;
    const pairs = mcq.matchingPairs || [];
    mcq.isCorrect = pairs.every((p) => userMatches[p.id] === p.id);
  };

  const handleMatchingReset = () => {
    setUserMatches({});
    setActiveLeftId(null);
    setIsMatchingSubmitted(false);
    mcq.userMatches = undefined;
    mcq.isCorrect = undefined;
  };

  const handleShortAnswerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shortAnswerInput.trim() || hasAnswered) return;
    setIsShortAnswerSubmitted(true);
    mcq.userTextAnswer = shortAnswerInput.trim();
    const cleanAnswer = shortAnswerInput.trim().toLowerCase();
    const keywords = mcq.targetKeywords || [];
    const matchCount = keywords.filter((kw) =>
      cleanAnswer.includes(kw.toLowerCase())
    ).length;
    mcq.isCorrect = keywords.length > 0 ? matchCount >= Math.ceil(keywords.length * 0.5) : true;
  };

  // Section & Type labels
  const typeHeaders: Record<string, { en: string; am: string }> = {
    mcq: { en: 'Multiple Choice Check', am: 'የባለብዙ ምርጫ ማረጋገጫ' },
    true_false: { en: 'True / False Check', am: 'የእውነት / ሐሰት ማረጋገጫ' },
    fill_blank: { en: 'Fill in the Blank', am: 'ክፍት ቦታ ሙላ ማረጋገጫ' },
    matching: { en: 'Relational Matching', am: 'ተዛማጅ ማገናኘት' },
    short_answer: { en: 'Short Answer Check', am: 'የአጭር መልስ ማረጋገጫ' },
  };

  const headerLabel = isAmharic
    ? typeHeaders[qType]?.am || 'የማረጋገጫ ጥያቄ'
    : typeHeaders[qType]?.en || 'Check Question';

  // Sub-renderers
  const renderMCQContent = (isModal: boolean) => {
    const optionLabels = ['A', 'B', 'C', 'D', 'E'];
    const options = mcq.options || [];

    return (
      <div className={`space-y-2 ${isModal ? 'space-y-3' : 'space-y-1.5'}`}>
        {options.map((option, idx) => {
          let btnStyle =
            'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200';

          if (hasAnswered) {
            if (idx === mcq.correctOptionIndex) {
              btnStyle =
                'border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-zinc-900 dark:text-zinc-100 font-medium';
            } else if (idx === selectedIndex && !isCorrect) {
              btnStyle =
                'border-rose-500 dark:border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-zinc-600 dark:text-zinc-400 line-through';
            } else {
              btnStyle = 'opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasAnswered}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(idx);
              }}
              className={`w-full flex items-center text-left rounded-xl border transition-all ${
                isModal ? 'p-4 text-sm' : 'p-2.5 text-xs'
              } ${btnStyle} ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span
                className={`rounded-md border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-mono mr-3 shrink-0 text-zinc-500 dark:text-zinc-400 ${
                  isModal ? 'w-6 h-6 text-xs' : 'w-4 h-4 text-[10px]'
                }`}
              >
                {optionLabels[idx] || idx + 1}
              </span>
              <span className="flex-1 leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTrueFalseContent = (isModal: boolean) => {
    const choices = [
      { val: true, label: isAmharic ? 'እውነት' : 'True' },
      { val: false, label: isAmharic ? 'ሐሰት' : 'False' },
    ];

    return (
      <div className={`grid grid-cols-2 gap-2.5 ${isModal ? 'gap-4 py-2' : ''}`}>
        {choices.map((c) => {
          const isSelected = selectedBool === c.val;
          let btnStyle =
            'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200';

          if (hasAnswered) {
            if (c.val === mcq.correctBoolean) {
              btnStyle =
                'border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-zinc-900 dark:text-zinc-100 font-semibold';
            } else if (isSelected && !isCorrect) {
              btnStyle =
                'border-rose-500 dark:border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-zinc-600 dark:text-zinc-400 line-through';
            } else {
              btnStyle = 'opacity-40 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900';
            }
          }

          return (
            <button
              key={String(c.val)}
              type="button"
              disabled={hasAnswered}
              onClick={(e) => {
                e.stopPropagation();
                handleBoolSelect(c.val);
              }}
              className={`flex items-center justify-center rounded-xl border font-medium transition-all ${
                isModal ? 'p-5 text-sm' : 'p-3 text-xs'
              } ${btnStyle} ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderFillBlankContent = (isModal: boolean) => {
    return (
      <form onSubmit={handleFillSubmit} className="space-y-3">
        <div
          className={`flex flex-wrap items-center gap-1.5 leading-relaxed font-sans ${
            isModal ? 'text-base' : 'text-xs text-zinc-800 dark:text-zinc-200'
          }`}
        >
          {mcq.sentencePrefix && <span>{mcq.sentencePrefix}</span>}
          <div className="inline-flex items-center relative">
            <input
              type="text"
              disabled={hasAnswered}
              value={fillBlankInput}
              onChange={(e) => setFillBlankInput(e.target.value)}
              placeholder={isAmharic ? 'መልስ ያስገቡ...' : 'Type answer...'}
              className={`px-2.5 py-1 rounded-lg border font-mono text-xs focus:outline-none min-w-[140px] max-w-[220px] transition-colors ${
                hasAnswered
                  ? isCorrect
                    ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'border-rose-500 dark:border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-zinc-600 dark:text-zinc-400 line-through'
                  : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-400'
              }`}
            />
          </div>
          {mcq.sentenceSuffix && <span>{mcq.sentenceSuffix}</span>}
        </div>

        {!hasAnswered && (
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!fillBlankInput.trim()}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-900 dark:hover:bg-zinc-100 text-zinc-100 dark:text-zinc-900 disabled:opacity-40 transition-colors shadow-xs"
            >
              {isAmharic ? 'አረጋግጥ' : 'Check'}
            </button>
          </div>
        )}
      </form>
    );
  };

  const renderMatchingContent = (isModal: boolean) => {
    const pairs = mcq.matchingPairs || [];
    const rightItems = pairs.map((p) => ({ id: p.id, text: p.right }));
    const isAllPaired = pairs.every((p) => !!userMatches[p.id]);

    return (
      <div className="space-y-3">
        <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${isModal ? 'py-2' : ''}`}>
          {/* Left Column */}
          <div className="space-y-2">
            {pairs.map((p) => {
              const matchedRightId = userMatches[p.id];
              const isSelected = activeLeftId === p.id;
              const rightItem = pairs.find((r) => r.id === matchedRightId);

              let cardStyle =
                'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600';

              if (isSelected) {
                cardStyle =
                  'border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ring-1 ring-zinc-500';
              } else if (hasAnswered) {
                if (matchedRightId === p.id) {
                  cardStyle =
                    'border-emerald-500 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-zinc-900 dark:text-zinc-100 font-medium';
                } else {
                  cardStyle =
                    'border-rose-500 dark:border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-zinc-600 dark:text-zinc-400';
                }
              } else if (matchedRightId) {
                cardStyle =
                  'border-zinc-400 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200';
              }

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={hasAnswered}
                  onClick={() => handleMatchingClickLeft(p.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1 ${cardStyle} ${
                    hasAnswered ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="font-medium leading-snug">{p.left}</span>
                  {matchedRightId && rightItem && (
                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <ArrowRight size={10} />
                      <span className="truncate">{rightItem.right}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            {rightItems.map((r) => {
              const isAssigned = Object.values(userMatches).includes(r.id);

              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={hasAnswered || !activeLeftId}
                  onClick={() => handleMatchingClickRight(r.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2 ${
                    activeLeftId
                      ? 'border-zinc-400 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-zinc-100 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-xs'
                      : isAssigned
                        ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 opacity-80'
                  }`}
                >
                  <span className="flex-1 leading-snug">{r.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!hasAnswered && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleMatchingReset}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={11} />
              <span>{isAmharic ? 'እንደገና ጀምር' : 'Reset'}</span>
            </button>

            <button
              type="button"
              disabled={!isAllPaired}
              onClick={handleMatchingVerify}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-900 dark:hover:bg-zinc-100 text-zinc-100 dark:text-zinc-900 disabled:opacity-40 transition-colors shadow-xs"
            >
              {isAmharic ? 'አረጋግጥ' : 'Check'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderShortAnswerContent = (isModal: boolean) => {
    return (
      <form onSubmit={handleShortAnswerSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <textarea
            rows={isModal ? 4 : 3}
            disabled={hasAnswered}
            value={shortAnswerInput}
            onChange={(e) => setShortAnswerInput(e.target.value)}
            placeholder={
              isAmharic
                ? 'በራስዎ አባባል በአጭሩ ያብራሩ...'
                : 'Explain in your own words...'
            }
            className={`w-full rounded-xl border bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none font-sans resize-none transition-colors ${
              hasAnswered
                ? isCorrect
                  ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-rose-500 dark:border-rose-500 bg-rose-50/20 dark:bg-rose-950/10'
                : 'border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400'
            }`}
          />
        </div>

        {!hasAnswered && (
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={shortAnswerInput.trim().length < 5}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-900 dark:hover:bg-zinc-100 text-zinc-100 dark:text-zinc-900 disabled:opacity-40 transition-colors shadow-xs"
            >
              {isAmharic ? 'አቅርብ' : 'Submit'}
            </button>
          </div>
        )}
      </form>
    );
  };

  const renderCardContent = (isModal = false) => (
    <div className={isModal ? 'max-w-3xl mx-auto space-y-4 py-4' : 'space-y-3'}>
      <h4
        className={`font-medium leading-relaxed text-zinc-900 dark:text-zinc-100 ${
          isModal ? 'text-base sm:text-lg' : 'text-xs'
        }`}
      >
        {mcq.question}
      </h4>

      {qType === 'mcq' && renderMCQContent(isModal)}
      {qType === 'true_false' && renderTrueFalseContent(isModal)}
      {qType === 'fill_blank' && renderFillBlankContent(isModal)}
      {qType === 'matching' && renderMatchingContent(isModal)}
      {qType === 'short_answer' && renderShortAnswerContent(isModal)}

      {hasAnswered && mcq.explanation && (
        <div
          className={`pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 leading-relaxed font-sans ${
            isModal ? 'text-sm p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl' : 'text-xs text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1 text-zinc-900 dark:text-zinc-100 font-semibold">
            <span>{isAmharic ? 'ማብራሪያ' : 'Explanation'}</span>
            {qType === 'short_answer' && mcq.sampleAnswer && (
              <span className="font-normal text-[11px] text-zinc-500 font-mono">
                · {isAmharic ? 'ምሳሌ' : 'Example'}: {mcq.sampleAnswer}
              </span>
            )}
            {qType === 'fill_blank' && mcq.acceptedAnswers && (
              <span className="font-normal text-[11px] text-zinc-500 font-mono">
                · {isAmharic ? 'ትክክለኛ ቃል' : 'Answer'}: {mcq.acceptedAnswers[0]}
              </span>
            )}
          </div>
          <p>{mcq.explanation}</p>
        </div>
      )}
    </div>
  );

  const cardBorderClass = hasAnswered
    ? isCorrect
      ? 'border-emerald-500/70 dark:border-emerald-500/70'
      : 'border-rose-500/70 dark:border-rose-500/70'
    : 'border-zinc-200 dark:border-zinc-800';

  return (
    <div
      data-testid={`inline-mcq-${mcq.id}`}
      className={`my-4 p-4 rounded-xl border ${cardBorderClass} bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 transition-colors shadow-xs relative`}
    >
      {/* Optional expand button in corner without clutter */}
      {!disableExpand && (
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-label="Expand question"
            title="Expand question"
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {renderCardContent(false)}

      {/* Expanded Modal View */}
      {!disableExpand && isExpanded && (
        <ArtifactModal
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          badgeText={isAmharic ? 'ጥያቄ' : 'Question'}
          title={mcq.question}
        >
          {renderCardContent(true)}
        </ArtifactModal>
      )}
    </div>
  );
};

