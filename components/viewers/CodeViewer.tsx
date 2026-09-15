'use client';

import React, { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

export interface CodeViewerProps {
  code: string;
  language?: string;
  fileName?: string;
  isDiff?: boolean;
  className?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'text',
  fileName,
  isDiff = false,
  className = '',
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const cleanLang = (language || 'text').toLowerCase();
  const isDiffMode = isDiff || cleanLang === 'diff';
  const lines = code.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_e) {}
  };

  return (
    <div
      data-testid="code-viewer"
      className={`my-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-900 text-zinc-100 overflow-hidden shadow-sm font-mono text-xs ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/70 text-[11px]">
        <div className="flex items-center gap-2 text-zinc-400">
          <FileCode className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-semibold text-zinc-300">
            {fileName || (isDiffMode ? 'diff' : cleanLang)}
          </span>
          {isDiffMode && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Patch
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          title="Copy code"
          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex items-center gap-1"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span className="text-[10px] hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Body with Line Numbers and Diff Highlighting */}
      <div className="p-3 overflow-x-auto leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isAddition = isDiffMode && (line.startsWith('+') && !line.startsWith('+++'));
              const isDeletion = isDiffMode && (line.startsWith('-') && !line.startsWith('---'));
              const isHeader = isDiffMode && (line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++'));

              let rowClass = 'hover:bg-zinc-800/40';
              let textClass = 'text-zinc-300';

              if (isAddition) {
                rowClass = 'bg-emerald-950/40 hover:bg-emerald-950/60';
                textClass = 'text-emerald-300 font-medium';
              } else if (isDeletion) {
                rowClass = 'bg-rose-950/40 hover:bg-rose-950/60';
                textClass = 'text-rose-300 line-through opacity-80';
              } else if (isHeader) {
                rowClass = 'bg-zinc-800/30';
                textClass = 'text-sky-400 italic';
              }

              return (
                <tr key={idx} className={rowClass}>
                  <td className="select-none pr-3 text-right text-zinc-600 w-8 text-[11px] align-top">
                    {lineNum}
                  </td>
                  <td className={`pl-2 pr-2 whitespace-pre font-mono ${textClass}`}>
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
