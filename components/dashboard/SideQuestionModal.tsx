'use client';

import React, { useState, useEffect } from 'react';
import { AppLanguage } from '@/lib/i18n/translations';
import {
  playNeuralAudio,
  pauseNeuralAudio,
  resumeNeuralAudio,
  restartNeuralAudio,
  stopNeuralAudio,
  onAudioStateChange,
  getAudioPlaybackState,
  getActiveSpokenText,
  AudioPlaybackState,
} from '@/lib/voice/ttsClient';

export interface QaTurn {
  id: string;
  question: string;
  thought?: string;
  thoughtDuration?: number;
  summary?: string;
  answer: string;
  timestamp: number;
}

export interface QaThread {
  id: string;
  noteKey: string;
  title: string;
  turns: QaTurn[];
  createdAt: number;
}

export interface SideQuestionModalProps {
  isOpen: boolean;
  activeThread: QaThread | null;
  allThreads: QaThread[];
  isLoading?: boolean;
  pendingQuestion?: string;
  onClose: () => void;
  onSelectThread: (threadId: string) => void;
  language?: AppLanguage;
  defaultVoice?: string;
}

export const SideQuestionModal: React.FC<SideQuestionModalProps> = ({
  isOpen,
  activeThread,
  allThreads,
  isLoading = false,
  pendingQuestion = '',
  onClose,
  onSelectThread,
  language = 'en',
  defaultVoice = 'en-US-JennyNeural',
}) => {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(getAudioPlaybackState());
  const [copied, setCopied] = useState(false);
  const isAmharic = language === 'am';

  const currentIndex = activeThread
    ? allThreads.findIndex((t) => t.id === activeThread.id)
    : -1;

  // Active answer is the latest turn's answer
  const latestTurn = activeThread && activeThread.turns.length > 0
    ? activeThread.turns[activeThread.turns.length - 1]
    : null;

  const currentAnswer = latestTurn?.answer || '';
  const currentTitle =
    activeThread?.title || pendingQuestion || (isAmharic ? 'ጥያቄ' : 'Question');

  // Track audio state changes
  useEffect(() => {
    const unsub = onAudioStateChange((state) => {
      setPlaybackState(state);
    });
    return unsub;
  }, []);

  const isCurrentAudioPlaying =
    playbackState === 'playing' && getActiveSpokenText() === currentAnswer;

  const handleToggleAudio = () => {
    if (!currentAnswer) return;
    if (playbackState === 'playing') {
      pauseNeuralAudio();
    } else if (playbackState === 'paused' && getActiveSpokenText() === currentAnswer) {
      resumeNeuralAudio();
    } else {
      stopNeuralAudio();
      playNeuralAudio(currentAnswer, {
        voice: defaultVoice,
        readerId: 'side-question-reader',
        onEnd: () => {},
        onError: () => {},
      });
    }
  };

  const handleRestart = () => {
    if (!currentAnswer) return;
    if (getActiveSpokenText() === currentAnswer) {
      restartNeuralAudio();
    } else {
      stopNeuralAudio();
      playNeuralAudio(currentAnswer, {
        voice: defaultVoice,
        readerId: 'side-question-reader',
        onEnd: () => {},
        onError: () => {},
      });
    }
  };

  const handleCopy = () => {
    if (!currentAnswer) return;
    navigator.clipboard.writeText(currentAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrevThread = () => {
    if (currentIndex > 0) {
      onSelectThread(allThreads[currentIndex - 1].id);
    }
  };

  const handleNextThread = () => {
    if (currentIndex >= 0 && currentIndex < allThreads.length - 1) {
      onSelectThread(allThreads[currentIndex + 1].id);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        data-testid="side-question-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/20 dark:bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Floating Card Container extending directly from above the bottom input bar */}
      <div className="fixed inset-x-0 bottom-20 z-40 flex flex-col items-center pointer-events-none px-3 sm:px-4">
        <div
          role="dialog"
          aria-labelledby="question-card-title"
          className="w-full max-w-3xl pointer-events-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 select-none">
            {/* Left: Question title without "Side Question:" text */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3
                id="question-card-title"
                className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                title={currentTitle}
              >
                {currentTitle}
              </h3>
              {/* Very minimal indicator when loading */}
              {isLoading && (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-ping shrink-0" />
              )}
            </div>

            {/* Middle: History Navigation Chevrons */}
            {allThreads.length > 1 && (
              <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                <button
                  type="button"
                  onClick={handlePrevThread}
                  disabled={currentIndex <= 0}
                  aria-label={isAmharic ? 'ቀዳሚ ጥያቄ' : 'Previous question'}
                  className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-zinc-700 dark:text-zinc-300 transition-colors"
                  title={isAmharic ? 'ቀዳሚ ጥያቄ' : 'Previous question'}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[10px] font-mono text-zinc-500 px-1">
                  {currentIndex + 1} / {allThreads.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextThread}
                  disabled={currentIndex >= allThreads.length - 1}
                  aria-label={isAmharic ? 'ቀጣይ ጥያቄ' : 'Next question'}
                  className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-zinc-700 dark:text-zinc-300 transition-colors"
                  title={isAmharic ? 'ቀጣይ ጥያቄ' : 'Next question'}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Right: Audio Play, Restart, Copy, Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Play / Pause Button */}
              {currentAnswer && (
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  aria-label={isCurrentAudioPlaying ? (isAmharic ? 'አቁም' : 'Pause audio') : (isAmharic ? 'አጫውት' : 'Play audio')}
                  className="px-2 py-1 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors flex items-center gap-1 text-[11px] font-medium"
                  title={isCurrentAudioPlaying ? (isAmharic ? 'አቁም' : 'Pause') : (isAmharic ? 'አጫውት' : 'Play')}
                >
                  {isCurrentAudioPlaying ? (
                    <>
                      <svg className="w-3 h-3 text-zinc-900 dark:text-zinc-100 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                      </svg>
                      <span className="hidden sm:inline">{isAmharic ? 'አቁም' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      <span className="hidden sm:inline">{isAmharic ? 'አጫውት' : 'Play'}</span>
                    </>
                  )}
                </button>
              )}

              {/* Audio Restart Button */}
              {currentAnswer && (
                <button
                  type="button"
                  onClick={handleRestart}
                  aria-label={isAmharic ? 'እንደገና ጀምር' : 'Restart audio'}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title={isAmharic ? 'እንደገና ጀምር' : 'Restart'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}

              {/* Copy Button */}
              {currentAnswer && (
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={isAmharic ? 'መልስ ቅዳ' : 'Copy answer'}
                  className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title={isAmharic ? 'ቅዳ' : 'Copy'}
                >
                  {copied ? (
                    <svg className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label={isAmharic ? 'ዝጋ' : 'Close'}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={isAmharic ? 'ዝጋ' : 'Close'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Clean Explanation Body - No Chat Window, No Fluff, No Thinking Accordions */}
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[48vh] text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
            {currentAnswer ? (
              <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                {currentAnswer}
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-zinc-400 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping" />
                <span className="text-[11px] font-sans">{isAmharic ? 'በመጫን ላይ...' : 'Loading...'}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};
