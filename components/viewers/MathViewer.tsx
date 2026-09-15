'use client';

import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Copy, Check, FunctionSquare } from 'lucide-react';

export interface MathViewerProps {
  math: string;
  displayMode?: boolean;
  caption?: string;
  className?: string;
}

export const MathViewer: React.FC<MathViewerProps> = ({
  math,
  displayMode = true,
  caption,
  className = '',
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const cleanMath = (math || '').trim();

  const renderedHtml = useMemo(() => {
    if (!cleanMath) return '';
    try {
      const k = (katex as any)?.default || katex;
      if (k && typeof k.renderToString === 'function') {
        return k.renderToString(cleanMath, {
          displayMode,
          throwOnError: false,
          strict: false,
        });
      }
      return `<span class="font-mono text-xs">${cleanMath}</span>`;
    } catch (err) {
      console.warn('KaTeX rendering error:', err);
      return `<span class="text-rose-500 font-mono text-xs">${cleanMath}</span>`;
    }
  }, [cleanMath, displayMode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanMath);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_e) {}
  };

  if (!displayMode) {
    return (
      <span
        data-testid="math-inline-viewer"
        className={`inline-block px-1 font-serif text-zinc-900 dark:text-zinc-100 ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <div
      data-testid="math-block-viewer"
      className={`my-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 overflow-hidden shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/60 dark:bg-zinc-900/60 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] uppercase tracking-wider font-semibold">
          <FunctionSquare className="w-3.5 h-3.5" />
          <span>Formula</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy LaTeX formula"
          title="Copy LaTeX formula"
          className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span className="text-[10px] font-mono hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Rendered Math Formula */}
      <div className="p-4 overflow-x-auto text-center flex items-center justify-center text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
        <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      </div>

      {caption && (
        <div className="px-3 py-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100/30 dark:bg-zinc-900/20">
          {caption}
        </div>
      )}
    </div>
  );
};
