'use client';

import React, { useMemo, useState } from 'react';
import { Table, Copy, Check, Maximize2 } from 'lucide-react';
import { MathViewer } from './MathViewer';
import { ArtifactModal } from './ArtifactModal';

export interface TableViewerProps {
  content?: string;
  headers?: string[];
  rows?: string[][];
  caption?: string;
  className?: string;
  disableExpand?: boolean;
}

/**
 * Strips raw markdown artifacts like **bold**, *italic*, `code` and parses formulas.
 */
function cleanTableCell(rawCell: string): React.ReactNode {
  const cell = rawCell.trim();
  if (!cell) return '';

  // Check for inline math $...$
  if (cell.includes('$')) {
    const parts = cell.split(/(\$[^$]+\$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        return <MathViewer key={idx} math={part.slice(1, -1)} displayMode={false} />;
      }
      return cleanMarkdownFormatting(part);
    });
  }

  return cleanMarkdownFormatting(cell);
}

function cleanMarkdownFormatting(text: string): React.ReactNode {
  // Replace **bold** with <strong>
  if (text.includes('**')) {
    const segments = text.split(/(\*\*[^*]+\*\*)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return seg;
    });
  }
  return text;
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
  disableExpand = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      let textToCopy = '';
      if (headers.length > 0) {
        textToCopy += `| ${headers.join(' | ')} |\n`;
        textToCopy += `| ${headers.map(() => '---').join(' | ')} |\n`;
      }
      rows.forEach((row) => {
        textToCopy += `| ${row.join(' | ')} |\n`;
      });

      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_e) {}
  };

  if (headers.length === 0 && rows.length === 0) {
    return null;
  }

  const renderTable = (isModal = false) => (
    <table className="w-full table-fixed text-left text-xs text-zinc-800 dark:text-zinc-200 border-collapse">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
          {headers.map((h, i) => (
            <th
              key={i}
              className={`p-2.5 sm:p-3 font-semibold font-mono uppercase tracking-wider text-zinc-900 dark:text-zinc-100 break-words ${
                isModal ? 'text-xs sm:text-sm' : 'text-[11px]'
              }`}
            >
              {cleanTableCell(h)}
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
              <td
                key={cIdx}
                className={`leading-relaxed font-sans break-words p-2.5 sm:p-3 ${
                  isModal ? 'text-xs sm:text-sm' : 'text-xs'
                }`}
              >
                {cleanTableCell(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div
      data-testid="table-viewer"
      className={`my-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-xs w-full ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] uppercase tracking-wider font-semibold">
          <Table className="w-3.5 h-3.5" />
          <span>Matrix Table</span>
        </div>

        <div className="flex items-center gap-1">
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
          {!disableExpand && (
            <>
              <div className="w-[1px] h-3 bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label="Expand table"
                title="Expand table"
                className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono hidden sm:inline">Expand</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table Content without horizontal scroll */}
      <div
        onClick={!disableExpand ? () => setIsExpanded(true) : undefined}
        title={!disableExpand ? 'Click to expand table' : undefined}
        className={`w-full overflow-hidden ${
          !disableExpand ? 'cursor-pointer hover:bg-zinc-50/40 dark:hover:bg-zinc-900/60 transition-colors' : ''
        }`}
      >
        {renderTable(false)}
      </div>

      {caption && (
        <div className="px-3 py-1.5 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30">
          {caption}
        </div>
      )}

      {/* Expanded Modal View */}
      {!disableExpand && isExpanded && (
        <ArtifactModal
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          badgeText="Matrix Table"
          title={caption || 'Matrix Table Comparison'}
        >
          <div className="p-2 sm:p-6 w-full min-h-[50vh]">
            {renderTable(true)}
          </div>
        </ArtifactModal>
      )}
    </div>
  );
};
