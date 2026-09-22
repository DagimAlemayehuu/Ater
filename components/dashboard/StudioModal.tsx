'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Headphones,
  Video,
  Presentation,
  FileText,
  Layers,
  Network,
  Play,
  Pause,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { StudioArtifactType, StudioStatusResponse } from '@/lib/notebooklm/client';
import { stripEmojis } from '@/lib/curriculum/intake';

export interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  sourceContext?: string;
  notebookId?: string;
  language?: 'en' | 'am';
}

interface ArtifactOption {
  type: StudioArtifactType;
  titleEn: string;
  titleAm: string;
  descEn: string;
  descAm: string;
  icon: React.ElementType;
}

const ARTIFACT_OPTIONS: ArtifactOption[] = [
  {
    type: 'audio',
    titleEn: 'Audio Overview',
    titleAm: 'የድምጽ አጠቃላይ እይታ (ፖድካስት)',
    descEn: 'Deep-dive analytical discussion breaking down core principles.',
    descAm: 'የመጀመሪያ መርሆችን እና አሰራርን የሚያብራራ የድምጽ ትንታኔ።',
    icon: Headphones,
  },
  {
    type: 'video',
    titleEn: 'Video Explainer',
    titleAm: 'የቪዲዮ ማብራሪያ',
    descEn: 'Narrated visual walk-through highlighting mechanisms.',
    descAm: 'የስርዓቱን አሰራር በስዕላዊ መግለጫዎች የሚያሳይ ቪዲዮ።',
    icon: Video,
  },
  {
    type: 'slide_deck',
    titleEn: 'Presentation Slides',
    titleAm: 'የስላይድ ማቅረቢያ',
    descEn: 'Structured slide presentation covering invariants and trade-offs.',
    descAm: 'መርሆችን እና ተግዳሮቶችን የሚያቀርቡ የተዋቀሩ ስላይዶች።',
    icon: Presentation,
  },
  {
    type: 'report',
    titleEn: 'Study Guide & Brief',
    titleAm: 'የጥናት መመሪያ እና ማጠቃለያ',
    descEn: 'Comprehensive briefing document with key takeaways and definitions.',
    descAm: 'ቁልፍ ፅንሰ-ሀሳቦችን እና ፍቺዎችን የያዘ አጠቃላይ የጥናት ሰነድ።',
    icon: FileText,
  },
  {
    type: 'flashcards',
    titleEn: 'Flashcards',
    titleAm: 'የፍላሽ ካርዶች',
    descEn: 'Targeted prompt-and-answer pairs for spaced active recall.',
    descAm: 'ትውስታን ለማጠናከር የሚያግዙ አጫጭር የጥያቄና መልስ ካርዶች።',
    icon: Layers,
  },
  {
    type: 'mind_map',
    titleEn: 'Mind Map',
    titleAm: 'የአስተሳሰብ ካርታ',
    descEn: 'Hierarchical concept graph connecting mental models and invariants.',
    descAm: 'ፅንሰ-ሀሳቦችን እና መርሆችን የሚያገናኝ ተዋረድ ያለው ካርታ።',
    icon: Network,
  },
];

export const StudioModal: React.FC<StudioModalProps> = ({
  isOpen,
  onClose,
  topicTitle,
  sourceContext = '',
  notebookId,
  language = 'en',
}) => {
  const isAm = language === 'am';
  const [selectedType, setSelectedType] = useState<StudioArtifactType>('audio');
  const [format, setFormat] = useState<string>('deep_dive');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [focusPrompt, setFocusPrompt] = useState<string>('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(null);
  const [statusResponse, setStatusResponse] = useState<StudioStatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setStatusResponse(null);

    try {
      const res = await fetch('/api/studio/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebookId,
          artifactType: selectedType,
          format,
          difficulty,
          focusPrompt: focusPrompt ? stripEmojis(focusPrompt) : undefined,
          sourceContext,
          title: topicTitle,
          language,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Creation failed with status ${res.status}`);
      }

      const createData = await res.json();
      setCurrentArtifactId(createData.artifactId);

      // Start non-blocking polling
      pollArtifactStatus(createData.artifactId);
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || 'Failed to dispatch artifact creation.');
    }
  };

  const pollArtifactStatus = (artifactId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/studio/status?artifactId=${encodeURIComponent(artifactId)}&t=${Date.now()}`);
        if (!res.ok) return;

        const statusData: StudioStatusResponse = await res.json();
        setStatusResponse(statusData);

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          setIsGenerating(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          if (statusData.status === 'failed') {
            setErrorMessage(statusData.error || 'Generation failed.');
          }
        }
      } catch (_err) {
        // Continue polling silently
      }
    };

    // Immediate initial check
    poll();
    // Poll every 1500ms
    pollIntervalRef.current = setInterval(poll, 1500);
  };

  const handleReset = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsGenerating(false);
    setCurrentArtifactId(null);
    setStatusResponse(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
              {isAm ? 'ማስታወሻ ስቱዲዮ' : 'Studio'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAm ? 'ዝጋ' : 'Close'}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-700 dark:text-zinc-300">
          {/* Active topic banner */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                {isAm ? 'የትምህርት ርዕስ' : 'Target Concept'}
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block mt-0.5">
                {stripEmojis(topicTitle)}
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Async Studio
            </span>
          </div>

          {/* If an artifact is generating or completed */}
          {(isGenerating || statusResponse) && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {statusResponse?.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  ) : statusResponse?.status === 'failed' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-400" />
                  )}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {statusResponse?.status === 'completed'
                      ? isAm
                        ? 'ዝግጅቱ ተጠናቋል!'
                        : 'Artifact Ready'
                      : statusResponse?.status === 'failed'
                        ? isAm
                          ? 'ዝግጅቱ አልተሳካም'
                          : 'Generation Failed'
                        : isAm
                          ? 'በማዘጋጀት ላይ...'
                          : 'Synthesizing Studio Artifact...'}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-zinc-500">
                  {statusResponse?.progress || 0}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, statusResponse?.progress || 0)}%` }}
                />
              </div>

              {/* Completed Media Player / Viewer */}
              {statusResponse?.status === 'completed' && (
                <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
                  {statusResponse.artifactType === 'audio' && (
                    <div className="space-y-2">
                      <audio
                        controls
                        src={statusResponse.mediaUrl}
                        className="w-full h-10 rounded-lg outline-none"
                      />
                    </div>
                  )}

                  {statusResponse.artifactType === 'video' && (
                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black aspect-video flex items-center justify-center">
                      {statusResponse.mediaUrl?.endsWith('.mp4') ? (
                        <video
                          controls
                          src={statusResponse.mediaUrl}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <iframe
                          src={statusResponse.mediaUrl}
                          title="Studio Video"
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      )}
                    </div>
                  )}

                  {(statusResponse.artifactType === 'slide_deck' ||
                    statusResponse.artifactType === 'report' ||
                    statusResponse.artifactType === 'flashcards' ||
                    statusResponse.artifactType === 'mind_map') && (
                    <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {statusResponse.title || 'Studio Document'}
                        </span>
                        {statusResponse.downloadUrl && (
                          <a
                            href={statusResponse.downloadUrl}
                            download
                            className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 text-[11px]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isAm ? 'አውርድ' : 'Download'}</span>
                          </a>
                        )}
                      </div>
                      {statusResponse.content && (
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-md">
                          {stripEmojis(statusResponse.content)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isAm ? 'አዲስ አዘጋጅ' : 'Create Another'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Option Selector (Only visible if not currently generating/completed) */}
          {!isGenerating && !statusResponse && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-wider block mb-2">
                  {isAm ? 'የሚፈለገውን ይዘት ይምረጡ' : 'Select Artifact Type'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ARTIFACT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setSelectedType(opt.type)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            className={`w-4 h-4 ${
                              isSelected
                                ? 'text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-500'
                            }`}
                          />
                          <span
                            className={`font-semibold text-xs ${
                              isSelected
                                ? 'text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {isAm ? opt.titleAm : opt.titleEn}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                          {isAm ? opt.descAm : opt.descEn}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 block mb-1">
                    {isAm ? 'ቅርጸት / ስልት' : 'Format / Style'}
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    <option value="deep_dive">{isAm ? 'ጥልቅ ትንታኔ (Deep Dive)' : 'Deep Dive Analytical'}</option>
                    <option value="concise">{isAm ? 'አጭር ማጠቃለያ (Concise Brief)' : 'Concise Brief'}</option>
                    <option value="socratic">{isAm ? 'የሶቅራጥስ ክርክር (Socratic Dialogue)' : 'Socratic Dialogue'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 block mb-1">
                    {isAm ? 'የክብደት ደረጃ' : 'Cognitive Depth'}
                  </label>
                  <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs">
                    {(['easy', 'medium', 'hard'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1 text-center rounded-lg capitalize transition-colors ${
                          difficulty === d
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Focus Prompt */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 block mb-1">
                  {isAm ? 'ልዩ ትኩረት (አማራጭ)' : 'Custom Focus Prompt (Optional)'}
                </label>
                <input
                  type="text"
                  value={focusPrompt}
                  onChange={(e) => setFocusPrompt(e.target.value)}
                  placeholder={
                    isAm
                      ? 'ለምሳሌ፡ የክፍለ-ግዛት መዛባትን እና የኮረም አሰራርን ብቻ አድምቅ...'
                      : 'e.g. Focus specifically on network partitions and split-brain recovery...'
                  }
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-mono">
            {isAm ? 'የማይቋረጥ የበስተጀርባ ሂደት' : 'Non-blocking background generation'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {isAm ? 'ዝጋ' : 'Close'}
            </button>

            {!isGenerating && !statusResponse && (
              <button
                type="button"
                onClick={handleStartGeneration}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xs"
              >
                {isAm ? 'ይዘቱን አዘጋጅ' : 'Generate Artifact'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
