'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  useMockFallback: boolean;
  onToggleFallback: () => void;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  useMockFallback,
  onToggleFallback,
  onDismiss,
}) => {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-zinc-500 shrink-0" />
        <span>{message}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleFallback}
          className="underline underline-offset-2 font-medium hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {useMockFallback ? 'Disable offline mock mode' : 'Enable offline mock mode'}
        </button>
        <button
          onClick={onDismiss}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
          aria-label="Dismiss message"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
