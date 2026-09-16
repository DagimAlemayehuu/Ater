'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { ArtifactModal } from './ArtifactModal';

export interface MermaidViewerProps {
  code: string;
  caption?: string;
  className?: string;
  disableExpand?: boolean;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({
  code,
  caption,
  className = '',
  disableExpand = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const renderIdRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      if (!code.trim()) {
        setSvgContent('');
        return;
      }

      try {
        setError(null);
        const mermaidModule = await import('mermaid');
        const mermaid = (mermaidModule as any)?.default || mermaidModule;

        if (!mermaid || typeof mermaid.initialize !== 'function') {
          throw new Error('Mermaid module initialization failed');
        }

        const isDark =
          typeof window !== 'undefined' &&
          document.documentElement.classList.contains('dark');

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'neutral',
          securityLevel: 'loose',
          suppressErrorRendering: true,
          fontFamily: 'inherit',
          themeVariables: {
            fontFamily: 'inherit',
            fontSize: '12px',
            primaryColor: isDark ? '#27272a' : '#f4f4f5',
            primaryBorderColor: isDark ? '#52525b' : '#d4d4d8',
            primaryTextColor: isDark ? '#f4f4f5' : '#18181b',
            lineColor: isDark ? '#71717a' : '#a1a1aa',
            secondaryColor: isDark ? '#18181b' : '#fafafa',
            tertiaryColor: isDark ? '#27272a' : '#f4f4f5',
          },
        });

        const id = renderIdRef.current;
        const { svg } = await mermaid.render(id, code.trim());
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.warn('Mermaid rendering failed:', err);
        // Clean up any stray error elements injected by mermaid into document.body
        if (typeof document !== 'undefined') {
          document.querySelectorAll('#dmermaid, div[id^="dmermaid"], svg[id^="dmermaid"]').forEach((el) => el.remove());
        }
        if (isMounted) {
          setError(err?.message || 'Failed to render Mermaid diagram');
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_e) {}
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div
      data-testid="mermaid-viewer"
      className={`my-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 overflow-hidden shadow-sm ${className}`}
    >
      {/* Viewer Header Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/60 dark:bg-zinc-900/60 text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          <span>Diagram</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-zinc-400 w-8 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="Reset zoom"
            title="Reset zoom"
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-zinc-300 dark:bg-zinc-700 mx-1" />
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy diagram source"
            title="Copy diagram source"
            className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] font-mono hidden sm:inline">
              {isCopied ? 'Copied' : 'Copy'}
            </span>
          </button>
          {!disableExpand && (
            <>
              <div className="w-[1px] h-3 bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                aria-label="Expand diagram"
                title="Expand diagram"
                className="p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono hidden sm:inline">Expand</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onClick={!disableExpand ? () => setIsExpanded(true) : undefined}
        title={!disableExpand ? 'Click to expand diagram' : undefined}
        className={`p-4 overflow-x-auto flex items-center justify-center min-h-[140px] ${
          !disableExpand ? 'cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-900/60 transition-colors' : ''
        }`}
      >
        {error ? (
          <div className="text-xs font-mono text-zinc-500 space-y-2 w-full">
            <p className="text-zinc-400">Diagram raw source:</p>
            <pre className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-700 dark:text-zinc-300 overflow-x-auto">
              {code}
            </pre>
          </div>
        ) : svgContent ? (
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            className="transition-transform duration-100"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            <span>Rendering diagram...</span>
          </div>
        )}
      </div>

      {caption && (
        <div className="px-3 py-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100/30 dark:bg-zinc-900/20">
          {caption}
        </div>
      )}

      {/* Expanded Modal View */}
      {!disableExpand && isExpanded && (
        <ArtifactModal
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          badgeText="Diagram"
          title={caption || 'Mermaid Vector Diagram'}
        >
          <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-6">
            {error ? (
              <pre className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto max-w-full">
                {code}
              </pre>
            ) : svgContent ? (
              <div
                className="w-full max-w-full flex items-center justify-center overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : null}
          </div>
        </ArtifactModal>
      )}
    </div>
  );
};
