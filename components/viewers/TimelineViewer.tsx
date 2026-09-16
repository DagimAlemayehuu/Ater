'use client';

import React, { useState } from 'react';
import { GitCommit, Maximize2 } from 'lucide-react';
import { ArtifactModal } from './ArtifactModal';

export interface TimelineStep {
  stepNumber: number;
  title: string;
  description: string;
  tag?: string;
  status?: 'completed' | 'active' | 'pending';
}

export interface TimelineViewerProps {
  steps?: TimelineStep[];
  content?: string;
  title?: string;
  className?: string;
  disableExpand?: boolean;
}

/**
 * Parses markdown step blocks:
 * 1. Step Title: Description
 */
function parseStepsFromContent(content: string): TimelineStep[] {
  const lines = content.trim().split('\n').filter(Boolean);
  const steps: TimelineStep[] = [];

  lines.forEach((line, idx) => {
    const numMatch = line.match(/^(\d+)[.\s:-]+\s*(.*)$/);
    const stepNum = numMatch ? parseInt(numMatch[1], 10) : idx + 1;
    const rest = numMatch ? numMatch[2] : line;

    if (rest.includes(' - ') || rest.includes(' — ')) {
      const parts = rest.split(/\s+[-—]\s+/);
      steps.push({
        stepNumber: stepNum,
        title: parts[0].trim(),
        description: parts.slice(1).join(' - ').trim(),
      });
    } else if (rest.includes(':')) {
      const firstColon = rest.indexOf(':');
      steps.push({
        stepNumber: stepNum,
        title: rest.substring(0, firstColon).trim(),
        description: rest.substring(firstColon + 1).trim(),
      });
    } else {
      steps.push({
        stepNumber: stepNum,
        title: `Phase ${stepNum}`,
        description: rest.trim(),
      });
    }
  });

  return steps;
}

export const TimelineViewer: React.FC<TimelineViewerProps> = ({
  steps: propSteps,
  content,
  title,
  className = '',
  disableExpand = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const steps = propSteps || (content ? parseStepsFromContent(content) : []);

  if (steps.length === 0) {
    return null;
  }

  // Pure neutral grey palette steps (never solid black or bright pure white)
  const renderStepsList = (isModal = false) => (
    <div className={`relative ${isModal ? 'pl-8 space-y-6 max-w-3xl mx-auto' : 'pl-6 space-y-4'}`}>
      {/* Vertical line connector in subtle grey */}
      <div
        className={`absolute ${
          isModal ? 'left-3.5' : 'left-2.5'
        } top-2 bottom-2 w-0.5 bg-zinc-300 dark:bg-zinc-700 -translate-x-1/2`}
      />

      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const status = step.status || (isLast ? 'active' : 'completed');

        // Grey fills calibrated for both light and dark mode (never pure black or white)
        const dotStyle =
          status === 'completed'
            ? 'bg-zinc-600 text-zinc-100 dark:bg-zinc-400 dark:text-zinc-900 ring-2 ring-zinc-300 dark:ring-zinc-600'
            : 'bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300 ring-2 ring-zinc-200 dark:ring-zinc-800';

        return (
          <div key={idx} className="relative group">
            {/* Step Number Dot with grey shade */}
            <div
              className={`absolute ${
                isModal ? '-left-8 w-7 h-7 text-xs' : '-left-6 w-5 h-5 text-[10px]'
              } top-0.5 rounded-full flex items-center justify-center font-mono font-medium transition-transform shadow-xs ${dotStyle}`}
            >
              {step.stepNumber || idx + 1}
            </div>

            {/* Step Card with subtle grey background */}
            <div
              className={`space-y-1 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/60 ${
                isModal ? 'p-4 sm:p-5' : 'p-3'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className={`font-semibold text-zinc-800 dark:text-zinc-200 ${isModal ? 'text-sm' : 'text-xs'}`}>
                  {step.title}
                </h4>
                {step.tag && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {step.tag}
                  </span>
                )}
              </div>
              <p className={`text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans ${isModal ? 'text-xs sm:text-sm' : 'text-xs'}`}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      data-testid="timeline-viewer"
      className={`my-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 shadow-xs ${className}`}
    >
      {/* Title & Toolbar */}
      <div className="flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] uppercase tracking-wider font-semibold">
          <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
          <span>{title || 'Execution Trace & Timeline'}</span>
        </div>

        {!disableExpand && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            aria-label="Expand timeline"
            title="Expand timeline"
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono hidden sm:inline">Expand</span>
          </button>
        )}
      </div>

      {/* Steps List */}
      <div
        onClick={!disableExpand ? () => setIsExpanded(true) : undefined}
        title={!disableExpand ? 'Click to expand timeline' : undefined}
        className={!disableExpand ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''}
      >
        {renderStepsList(false)}
      </div>

      {/* Expanded Modal View */}
      {!disableExpand && isExpanded && (
        <ArtifactModal
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          badgeText="Timeline"
          title={title || 'Execution Trace & Timeline'}
        >
          <div className="p-4 sm:p-8 min-h-[50vh]">
            {renderStepsList(true)}
          </div>
        </ArtifactModal>
      )}
    </div>
  );
};
