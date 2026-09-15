'use client';

import React from 'react';
import { GitCommit, CheckCircle2, Clock } from 'lucide-react';

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
}

/**
 * Parses markdown step blocks:
 * 1. Step Title: Description
 */
function parseStepsFromContent(content: string): TimelineStep[] {
  const lines = content.trim().split('\n').filter(Boolean);
  const steps: TimelineStep[] = [];

  lines.forEach((line, idx) => {
    // Strip leading number like "1. ", "1 - ", etc.
    const numMatch = line.match(/^(\d+)[.\s:-]+\s*(.*)$/);
    const stepNum = numMatch ? parseInt(numMatch[1], 10) : idx + 1;
    const rest = numMatch ? numMatch[2] : line;

    // Check for dash separator " - " or " — "
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
}) => {
  const steps = propSteps || (content ? parseStepsFromContent(content) : []);

  if (steps.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="timeline-viewer"
      className={`my-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 shadow-sm ${className}`}
    >
      {/* Title */}
      <div className="flex items-center gap-1.5 mb-3 text-zinc-500 font-mono text-[10px] uppercase tracking-wider font-semibold border-b border-zinc-200/60 dark:border-zinc-800/60 pb-2">
        <GitCommit className="w-3.5 h-3.5" />
        <span>{title || 'Execution Trace & Timeline'}</span>
      </div>

      {/* Steps List */}
      <div className="relative pl-6 space-y-4">
        {/* Vertical line connector */}
        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-x-1/2" />

        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const status = step.status || (isLast ? 'active' : 'completed');

          return (
            <div key={idx} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-transform ${
                  status === 'completed'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 ring-2 ring-zinc-200 dark:ring-zinc-800'
                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ring-2 ring-zinc-300 dark:ring-zinc-700'
                }`}
              >
                {step.stepNumber || idx + 1}
              </div>

              {/* Step Card */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </h4>
                  {step.tag && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {step.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
