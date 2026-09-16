'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badgeText?: string;
  children: React.ReactNode;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  isOpen,
  onClose,
  title,
  badgeText,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-200">
      {/* Blurred Backdrop */}
      <div
        data-testid="artifact-modal-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md cursor-pointer transition-opacity"
      />

      {/* Modal Dialog Card covering most of the screen */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Artifact expanded view'}
        className="relative z-10 w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {badgeText && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold shrink-0">
                {badgeText}
              </span>
            )}
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {title || 'Artifact Detail View'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline mr-2">
              Esc to close
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close expanded artifact"
              title="Close expanded artifact (Esc)"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-white dark:bg-zinc-950">
          {children}
        </div>
      </div>
    </div>
  );
};
