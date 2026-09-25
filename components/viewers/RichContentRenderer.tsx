'use client';

import React from 'react';
import { MermaidViewer } from './MermaidViewer';
import { CodeViewer } from './CodeViewer';
import { MathViewer } from './MathViewer';
import { TableViewer } from './TableViewer';
import { CalloutViewer, CalloutType } from './CalloutViewer';
import { TimelineViewer } from './TimelineViewer';
import { InteractiveCanvasViewer } from './InteractiveCanvasViewer';

export interface RichContentRendererProps {
  content: string;
  className?: string;
}

interface ContentBlock {
  type:
    | 'text'
    | 'mermaid'
    | 'code'
    | 'diff'
    | 'math'
    | 'table'
    | 'timeline'
    | 'interactive'
    | 'callout'
    | 'details';
  content: string;
  language?: string;
  calloutType?: CalloutType;
  title?: string;
}

/**
 * Parses markdown and multi-modal syntax into structured content blocks.
 */
function parseContentBlocks(rawText: string): ContentBlock[] {
  if (!rawText || !rawText.trim()) return [];

  const blocks: ContentBlock[] = [];
  const lines = rawText.split('\n');
  let currentTextBuffer: string[] = [];

  const flushTextBuffer = () => {
    if (currentTextBuffer.length > 0) {
      const text = currentTextBuffer.join('\n').trim();
      if (text) {
        // Check if this text block is a pure markdown table
        if (text.includes('|') && text.split('\n').some((l) => l.trim().startsWith('|'))) {
          blocks.push({ type: 'table', content: text });
        } else {
          blocks.push({ type: 'text', content: text });
        }
      }
      currentTextBuffer = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Fenced Code Blocks (```)
    if (trimmed.startsWith('```')) {
      flushTextBuffer();
      const langMatch = trimmed.match(/^```(\w+)?/);
      const language = (langMatch && langMatch[1] ? langMatch[1] : 'text').toLowerCase();
      const codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```

      const codeContent = codeLines.join('\n');

      if (language === 'mermaid') {
        blocks.push({ type: 'mermaid', content: codeContent });
      } else if (language === 'math' || language === 'latex') {
        blocks.push({ type: 'math', content: codeContent });
      } else if (language === 'diff') {
        blocks.push({ type: 'diff', content: codeContent, language: 'diff' });
      } else if (language === 'table') {
        blocks.push({ type: 'table', content: codeContent });
      } else if (language === 'timeline' || language === 'steps') {
        blocks.push({ type: 'timeline', content: codeContent });
      } else if (language === 'interactive' || language === 'widget' || language === 'simulation') {
        blocks.push({ type: 'interactive', content: codeContent });
      } else {
        blocks.push({ type: 'code', content: codeContent, language });
      }
      continue;
    }

    // 2. Block Math Equations ($$ ... $$)
    if (trimmed.startsWith('$$')) {
      flushTextBuffer();
      if (trimmed.endsWith('$$') && trimmed.length > 2) {
        // Single line math $$ ... $$
        const mathContent = trimmed.slice(2, -2).trim();
        blocks.push({ type: 'math', content: mathContent });
        i++;
      } else {
        // Multi-line math
        const mathLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('$$')) {
          mathLines.push(lines[i]);
          i++;
        }
        i++; // Skip closing $$
        blocks.push({ type: 'math', content: mathLines.join('\n') });
      }
      continue;
    }

    // 3. Callouts (> [!NOTE], > [!TIP], > [!WARNING], etc.)
    const calloutMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/i);
    if (calloutMatch) {
      flushTextBuffer();
      const calloutType = calloutMatch[1].toLowerCase() as CalloutType;
      const calloutLines: string[] = [];
      i++;

      while (i < lines.length && lines[i].trim().startsWith('>')) {
        calloutLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }

      blocks.push({
        type: 'callout',
        calloutType,
        content: calloutLines.join('\n').trim(),
      });
      continue;
    }

    // 4. Details / Collapsible Accordions (<details> ... </details>)
    if (trimmed.startsWith('<details>')) {
      flushTextBuffer();
      const detailLines: string[] = [];
      let summary = 'Deep Dive';
      i++;

      while (i < lines.length && !lines[i].trim().includes('</details>')) {
        const cur = lines[i];
        const sumMatch = cur.match(/<summary>(.*?)<\/summary>/i);
        if (sumMatch) {
          summary = sumMatch[1];
        } else {
          detailLines.push(cur);
        }
        i++;
      }
      i++; // Skip </details>

      blocks.push({
        type: 'details',
        title: summary,
        content: detailLines.join('\n').trim(),
      });
      continue;
    }

    // Regular line, add to text buffer
    currentTextBuffer.push(line);
    i++;
  }

  flushTextBuffer();
  return blocks;
}

/**
 * Renders inline text with support for inline math ($...$), inline code (`...`), and bolding (**...**).
 */
function renderInlineElements(text: string): React.ReactNode[] {
  // Regex to match inline math $...$ and inline code `...`
  const parts = text.split(/(\$[^$\n]+\$|`[^`\n]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const math = part.slice(1, -1);
      return <MathViewer key={index} math={math} displayMode={false} />;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      const code = part.slice(1, -1);
      return (
        <code key={index} className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-mono text-[0.85em] border border-zinc-200/60 dark:border-zinc-700/60">
          {code}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content || !content.trim()) {
    return null;
  }

  const blocks = parseContentBlocks(content);

  return (
    <div data-testid="rich-content-renderer" className={`space-y-3 font-sans ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'mermaid':
            return <MermaidViewer key={idx} code={block.content} />;

          case 'code':
            return (
              <CodeViewer
                key={idx}
                code={block.content}
                language={block.language || 'typescript'}
              />
            );

          case 'diff':
            return <CodeViewer key={idx} code={block.content} isDiff={true} language="diff" />;

          case 'math':
            return <MathViewer key={idx} math={block.content} displayMode={true} />;

          case 'table':
            return <TableViewer key={idx} content={block.content} />;

          case 'callout':
            return (
              <CalloutViewer
                key={idx}
                type={block.calloutType || 'note'}
                content={block.content}
              />
            );

          case 'details':
            return (
              <CalloutViewer
                key={idx}
                type="details"
                title={block.title}
                content={block.content}
                isCollapsible={true}
              />
            );

          case 'timeline':
            return <TimelineViewer key={idx} content={block.content} />;

          case 'interactive':
            return (
              <InteractiveCanvasViewer
                key={idx}
                code={block.content}
                title="Interactive Simulation"
              />
            );

          case 'text':
          default:
            return (
              <p
                key={idx}
                className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-sans"
              >
                {renderInlineElements(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
};
