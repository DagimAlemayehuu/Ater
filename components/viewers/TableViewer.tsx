'use client';

import React, { useMemo, useState } from 'react';
import { Table, Copy, Check } from 'lucide-react';

export interface TableViewerProps {
  content?: string;
  headers?: string[];
  rows?: string[][];
  caption?: string;
  className?: string;
}

/**
 * Parses markdown table syntax:
 * | Col 1 | Col 2 |
 * |-------|-------|
 * | A     | B     |
 */
function parseMarkdownTable(markdown: string): { headers: string[]; rows: string[][] } {
  const lines = markdown
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') || l.includes('|'));

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const parseRow = (line: string) => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  };

  const headers = parseRow(lines[0]);
  const dataLines = lines.slice(1).filter((line) => !line.match(/^\|?[-:\s|]+\|?$/));
  const rows = dataLines.map(parseRow);

  return { headers, rows };
}

export const TableViewer: React.FC<TableViewerProps> = ({
  content,
  headers: propHeaders,
  rows: propRows,
  caption,
  className = '',
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const { headers, rows } = useMemo(() => {
    if (propHeaders && propRows) {
      return { headers: propHeaders, rows: propRows };
    }
    if (content) {
      return parseMarkdownTable(content);
    }
    return { headers: [], rows: [] };
  }, [content, propHeaders, propRows]);

  const handleCopy = async () => {
    try {
      const tableText = content || [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
      await navigator.clipboard.writeText(tableText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_e) {}
  };

  if (headers.length === 0 && rows.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="table-viewer"
      className={`my-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-sm ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/60 dark:bg-zinc-900/60 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] uppercase tracking-wider font-semibold">
          <Table className="w-3.5 h-3.5" />
          <span>Matrix Table</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy table data"
          title="Copy table data"
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

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-200 border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/80">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3.5 py-2 font-semibold font-mono text-[11px] text-zinc-900 dark:text-zinc-100 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2.5 leading-relaxed font-sans">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {caption && (
        <div className="px-3 py-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100/30 dark:bg-zinc-900/20">
          {caption}
        </div>
      )}
    </div>
  );
};
