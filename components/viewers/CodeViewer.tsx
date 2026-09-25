'use client';

import React, { useState } from 'react';
import { Copy, Check, FileCode, Maximize2 } from 'lucide-react';
import { ArtifactModal } from './ArtifactModal';

export interface CodeViewerProps {
  code: string;
  language?: string;
  fileName?: string;
  isDiff?: boolean;
  className?: string;
  disableExpand?: boolean;
}

/**
 * Minimal syntax token highlighter for keywords, strings, comments, and numbers.
 */
function highlightCodeLine(line: string): React.ReactNode {
  // Check for full line comments
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
    return <span className="text-zinc-500 italic">{line}</span>;
  }

  // Tokenize keywords, strings, and numbers minimally
  const tokenRegex = /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|import|export|from|class|extends|interface|type|public|private|readonly|new|this|async|await|try|catch|finally|true|false|null|undefined)\b|\b\d+\b)/g;

  const parts = line.split(tokenRegex);
  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('//')) {
      return (
        <span key={index} className="text-zinc-500 italic">
          {part}
        </span>
      );
    }
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'")) || (part.startsWith('`') && part.endsWith('`'))) {
      return (
        <span key={index} className="text-emerald-700 dark:text-emerald-300">
          {part}
        </span>
      );
    }
    if (/^\b(?:const|let|var|function|return|if|else|for|while|import|export|from|class|extends|interface|type|public|private|readonly|new|this|async|await|try|catch|finally|true|false|null|undefined)\b$/.test(part)) {
      return (
        <span key={index} className="text-violet-700 dark:text-violet-300 font-medium">
          {part}
        </span>
      );
    }
    if (/^\b\d+\b$/.test(part)) {
      return (
        <span key={index} className="text-amber-700 dark:text-amber-300">
          {part}
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'text',
  fileName,
  isDiff = false,
  className = '',
  disableExpand = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const renderCodeTable = (isModal = false) => (
    <table className="w-full border-collapse font-mono text-xs">
      <tbody>
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isAddition = isDiffMode && (line.startsWith('+') && !line.startsWith('+++'));
          const isDeletion = isDiffMode && (line.startsWith('-') && !line.startsWith('---'));
          const isHeader = isDiffMode && (line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++'));

          let rowClass = 'hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40';
          let textClass = 'text-zinc-800 dark:text-zinc-200';

          if (isAddition) {
            rowClass = 'bg-emerald-500/10 dark:bg-emerald-950/40 hover:bg-emerald-500/15 dark:hover:bg-emerald-950/60';
            textClass = 'text-emerald-700 dark:text-emerald-300 font-medium';
          } else if (isDeletion) {
            rowClass = 'bg-rose-500/10 dark:bg-rose-950/40 hover:bg-rose-500/15 dark:hover:bg-rose-950/60';
            textClass = 'text-rose-700 dark:text-rose-300 line-through opacity-85';
          } else if (isHeader) {
            rowClass = 'bg-zinc-100 dark:bg-zinc-800/40';
            textClass = 'text-zinc-500 dark:text-zinc-400 italic';
          }

          return (
            <tr key={idx} className={rowClass}>
              <td className="select-none pr-3 text-right text-zinc-400 dark:text-zinc-600 w-8 text-[11px] align-top py-0.5">
                {lineNum}
              </td>
              <td className={`pl-2 pr-2 whitespace-pre py-0.5 ${textClass} ${isModal ? 'text-xs sm:text-sm' : ''}`}>
                {isDiffMode ? line || ' ' : highlightCodeLine(line || ' ')}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div
      data-testid="code-viewer"
      className={`my-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden shadow-xs font-mono text-xs ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/70 text-[11px]">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <FileCode className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
            {cleanLang}
          </span>
          {fileName && (
            <span className="text-zinc-500 dark:text-zinc-400 font-sans text-xs">
              {fileName}
            </span>
          )}
          {isDiffMode && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Patch
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy code"
            title="Copy code"
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
          {!disableExpand && (
            <>
              <div className="w-[1px] h-3 bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label="Expand code"
                title="Expand code"
                className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Expand</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Code Body with Line Numbers and Syntax Highlighting */}
      <div
        onClick={!disableExpand ? () => setIsExpanded(true) : undefined}
        title={!disableExpand ? 'Click to expand code' : undefined}
        className={`p-3 overflow-x-auto leading-relaxed ${
          !disableExpand ? 'cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-900/30 transition-colors' : ''
        }`}
      >
        {renderCodeTable(false)}
      </div>

      {/* Expanded Modal View */}
      {!disableExpand && isExpanded && (
        <ArtifactModal
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          badgeText={cleanLang.toUpperCase()}
          title={fileName || (isDiffMode ? 'Unified Patch Diff' : 'Source Code')}
        >
          <div className="p-4 sm:p-6 bg-zinc-50/70 dark:bg-zinc-950 rounded-xl font-mono text-xs overflow-x-auto min-h-[50vh] border border-zinc-200 dark:border-zinc-800">
            {renderCodeTable(true)}
          </div>
        </ArtifactModal>
      )}
    </div>
  );
};
