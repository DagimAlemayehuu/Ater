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
} from 'lucide-react';

export type CalloutType = 'note' | 'tip' | 'warning' | 'important' | 'caution' | 'details';

export interface CalloutViewerProps {
  type?: CalloutType;
  title?: string;
  children?: React.ReactNode;
  content?: string;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const CalloutViewer: React.FC<CalloutViewerProps> = ({
  type = 'note',
  title,
  children,
  content,
  isCollapsible = false,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
          defaultTitle: 'Deep Dive Proof',
          borderClass: 'border-l-2 border-zinc-400 dark:border-zinc-600',
          bgClass: 'bg-zinc-50 dark:bg-zinc-900/40',
          titleClass: 'text-zinc-800 dark:text-zinc-200 font-semibold',
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
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full text-left gap-2"
          >
            <div className="flex items-center gap-2">
              {style.icon}
              <span className={`text-xs ${style.titleClass}`}>{displayTitle}</span>
            </div>
            <span className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          </button>
          {isOpen && (
            <div className="pt-2 pl-6 text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed animate-in fade-in duration-100">
              {children || content}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2.5">
          {style.icon}
          <div className="space-y-1 flex-1">
            <div className={`text-xs ${style.titleClass}`}>{displayTitle}</div>
            <div className="text-zinc-700 dark:text-zinc-300 font-sans">
              {children || content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
