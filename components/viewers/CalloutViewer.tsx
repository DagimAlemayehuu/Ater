'use client';

import React, { useState } from 'react';
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { ArtifactModal } from './ArtifactModal';

export type CalloutType = 'note' | 'tip' | 'warning' | 'important' | 'caution' | 'details';

export interface CalloutViewerProps {
  type?: CalloutType;
  title?: string;
  children?: React.ReactNode;
  content?: string;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  disableExpand?: boolean;
}

export const CalloutViewer: React.FC<CalloutViewerProps> = ({
  type = 'note',
  title,
  children,
  content,
  isCollapsible = false,
  defaultOpen = false,
  className = '',
  disableExpand = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);

  const getStyle = (calloutType: CalloutType) => {
    switch (calloutType) {
      case 'tip':
        return {
          icon: <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
          defaultTitle: 'Tip',
          borderClass: 'border-l-2 border-emerald-500/70 dark:border-emerald-500/60',
          bgClass: 'bg-emerald-500/5 dark:bg-emerald-500/10',
          titleClass: 'text-emerald-800 dark:text-emerald-300 font-semibold',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
          defaultTitle: 'Warning',
          borderClass: 'border-l-2 border-amber-500/70 dark:border-amber-500/60',
          bgClass: 'bg-amber-500/5 dark:bg-amber-500/10',
          titleClass: 'text-amber-800 dark:text-amber-300 font-semibold',
        };
      case 'important':
        return {
          icon: <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />,
          defaultTitle: 'Important',
          borderClass: 'border-l-2 border-indigo-500/70 dark:border-indigo-500/60',
          bgClass: 'bg-indigo-500/5 dark:bg-indigo-500/10',
          titleClass: 'text-indigo-800 dark:text-indigo-300 font-semibold',
        };
      case 'caution':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
          defaultTitle: 'Caution',
          borderClass: 'border-l-2 border-rose-500/70 dark:border-rose-500/60',
          bgClass: 'bg-rose-500/5 dark:bg-rose-500/10',
          titleClass: 'text-rose-800 dark:text-rose-300 font-semibold',
        };
      case 'details':
        return {
          icon: <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />,
          defaultTitle: 'Details',
          borderClass: 'border-l-2 border-zinc-400/80 dark:border-zinc-600',
          bgClass: 'bg-zinc-100/50 dark:bg-zinc-900/40',
          titleClass: 'text-zinc-800 dark:text-zinc-200 font-medium',
        };
      case 'note':
      default:
        return {
          icon: <Info className="w-4 h-4 text-zinc-600 dark:text-zinc-300 shrink-0" />,
          defaultTitle: 'Note',
          borderClass: 'border-l-2 border-zinc-400 dark:border-zinc-600',
          bgClass: 'bg-zinc-50 dark:bg-zinc-900/40',
          titleClass: 'text-zinc-800 dark:text-zinc-200 font-semibold',
        };
    }
  };

  const style = getStyle(type);
  const displayTitle = title || style.defaultTitle;
  const isExpandable = isCollapsible || type === 'details';

  return (
    <div
      data-testid="callout-viewer"
      className={`my-3 rounded-r-xl border-y border-r border-zinc-200/60 dark:border-zinc-800/60 ${style.borderClass} ${style.bgClass} p-3.5 shadow-sm text-xs leading-relaxed ${className}`}
    >
      {isExpandable ? (
        <div>
          <div className="flex items-center justify-between w-full gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 flex-1 text-left cursor-pointer"
            >
              {style.icon}
              <span className={`text-xs ${style.titleClass}`}>{displayTitle}</span>
              <span className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
            </button>

            {!disableExpand && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label="Expand deep dive"
                title="Expand deep dive"
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {isOpen && (
            <div
              onClick={!disableExpand ? () => setIsExpanded(true) : undefined}
              title={!disableExpand ? 'Click to expand detail' : undefined}
              className={`pt-2 pl-6 text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed animate-in fade-in duration-100 ${
                !disableExpand ? 'cursor-pointer hover:opacity-90' : ''
              }`}
            >
              {children || content}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2.5">
          <div
            onClick={!disableExpand ? () => setIsExpanded(true) : undefined}
            title={!disableExpand ? 'Click to expand note' : undefined}
            className={`flex items-start gap-2.5 flex-1 ${
              !disableExpand ? 'cursor-pointer hover:opacity-90' : ''
            }`}
          >
            {style.icon}
            <div className="space-y-1 flex-1">
              <div className={`text-xs ${style.titleClass}`}>{displayTitle}</div>
              <div className="text-zinc-700 dark:text-zinc-300 font-sans">
                {children || content}
              </div>
            </div>
          </div>

          {!disableExpand && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              aria-label="Expand callout"
              title="Expand callout"
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors shrink-0"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Expanded Modal View */}
      {!disableExpand && isExpanded && (
        <ArtifactModal
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          badgeText={displayTitle}
          title={title || `${displayTitle} Deep-Dive`}
        >
          <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-4 text-sm sm:text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              {style.icon}
              <span className={`font-semibold ${style.titleClass}`}>
                {displayTitle}
              </span>
            </div>
            <div className="whitespace-pre-line font-sans">
              {children || content}
            </div>
          </div>
        </ArtifactModal>
      )}
    </div>
  );
};
