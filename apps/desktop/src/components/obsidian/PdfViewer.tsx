import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, Zap, Copy, Check, Maximize2, Minimize2, Filter, RefreshCw, Quote } from 'lucide-react';
import { AiSidecar } from './AiSidecar';
import { useConfig } from '@/lib/ConfigContext';
import { useTheme } from '@/context/theme-provider';
import { sidecarApi } from '@/lib/sidecarApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
    path: string;
    title: string;
    initialPage?: number;
    filterPages?: number[];
    onStateChange?: (state: PdfViewerState) => void;
}

export interface PdfViewerState {
    page: number;
    pageCount: number | null;
    isFiltered: boolean;
    filteredList: number[];
    sidebarOpen: boolean;
    isFullscreen: boolean;
}

export interface PdfViewerRef {
    handleNext: () => void;
    handlePrev: () => void;
    toggleFullscreen: () => void;
    toggleSidebar: () => void;
}

export const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(({ path, title, initialPage = 1, filterPages, onStateChange }, ref) => {
    const { config } = useConfig();
    const { theme } = useTheme();
    const [page, setPage] = useState(initialPage);
    const [isFiltered, setIsFiltered] = useState(false);
    const [filteredList, setFilteredList] = useState<number[]>([]);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Selection state
    const [selection, setSelection] = useState("");
    const [showPopover, setShowPopover] = useState(false);
    const [popoverPosition, setPopoverPosition] = useState<{ top: number, left: number }>({ top: 0, left: 0 });
    const selectionTimeoutRef = useRef<any>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Sidebar / explanation state
    const [explanation, setExplanation] = useState("");
    const [explanationSelection, setExplanationSelection] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isQuizMode, setIsQuizMode] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Notify parent of state changes
    useEffect(() => {
        onStateChange?.({
            page,
            pageCount,
            isFiltered,
            filteredList,
            sidebarOpen,
            isFullscreen
        });
    }, [page, pageCount, isFiltered, filteredList, sidebarOpen, isFullscreen, onStateChange]);

    // Sync fullscreen state
    useEffect(() => {
        const handleFsChange = () => {
            const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
            setIsFullscreen(isFs);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
        };
    }, []);

    const handleNext = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'navigate', direction: 'next' }, '*');
        }
    };

    const handlePrev = () => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'navigate', direction: 'prev' }, '*');
        }
    };

    const toggleFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        
        const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);

        if (!isFs) {
            const requestMethod = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).mozRequestFullScreen || (el as any).msRequestFullscreen;
            requestMethod?.call(el);
        } else {
            const exitMethod = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
            exitMethod?.call(document);
        }
    };

    useImperativeHandle(ref, () => ({
        handleNext,
        handlePrev,
        toggleFullscreen,
        toggleSidebar: () => setSidebarOpen(prev => !prev)
    }));

    useEffect(() => {
        setSelection("");
        setShowPopover(false);
        setExplanation("");
        setSidebarOpen(false);
        setIsThinking(false);
        setIsFiltered(false);
        setFilteredList([]);

        const fetchMetadata = async () => {
            try {
                const vaultPath = config?.obsidianVaultPath || '';
                const url = `http://127.0.0.1:8765/api/obsidian/pdf-metadata/${encodeURI(path)}?vault_path=${encodeURIComponent(vaultPath)}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.page_count) {
                    setPageCount(data.page_count);
                }
            } catch (e) { console.error("PDF metadata fetch failed", e); }
        };
        fetchMetadata();
    }, [path, config?.obsidianVaultPath]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!event.data?.type) return;
            if (event.data.type === 'selection') {
                const text = event.data.text?.trim() || '';
                if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
                if (text.length > 0) {
                    setSelection(text);
                    setShowPopover(true);
                    if (event.data.mouseX !== undefined && event.data.mouseY !== undefined && iframeRef.current) {
                        const rect = iframeRef.current.getBoundingClientRect();
                        setPopoverPosition({
                            left: rect.left + event.data.mouseX,
                            top: rect.top + event.data.mouseY - 40
                        });
                    }
                } else {
                    selectionTimeoutRef.current = setTimeout(() => setShowPopover(false), 300);
                }
            } else if (event.data.type === 'page_change') {
                setPage(event.data.page);
            } else if (event.data.type === 'metadata') {
                if (event.data.isFiltered) {
                    setIsFiltered(true);
                    setPageCount(event.data.pageCount);
                    setFilteredList(event.data.filterList);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleExplain = async () => {
        if (!selection) return;
        setExplanationSelection(selection);
        setIsQuizMode(false);
        setShowPopover(false);
        setSidebarOpen(true);
    };

    const handleQuickQuestions = async () => {
        if (!selection) return;
        setExplanationSelection(selection);
        setIsQuizMode(true);
        setShowPopover(false);
        setSidebarOpen(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(explanation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const resolvedTheme = isDarkMode ? 'dark' : 'light';

    const pdfUrl = `http://127.0.0.1:8765/api/obsidian/viewer/${encodeURI(path)}?vault_path=${encodeURIComponent(config?.obsidianVaultPath || '')}&page=${initialPage}${filterPages && filterPages.length > 0 ? `&filter_pages=${filterPages.join(',')}` : ''}&theme=${resolvedTheme}`;

    return (
        <div ref={containerRef} className="flex flex-row h-full bg-background relative overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 relative bg-muted/30">

                {/* Fixed AI Popover (Synced with MarkdownViewer style) */}
                {showPopover && selection && (
                    <div 
                        className="fixed z-50 bg-popover/95 backdrop-blur-md border border-border rounded-full h-10 flex items-center px-2 shadow-2xl animate-in fade-in zoom-in duration-200 stop-selection-clear"
                        style={{ 
                            left: `${popoverPosition.left}px`,
                            top: `${popoverPosition.top}px`,
                            transform: 'translateX(-50%)'
                        }}
                        onMouseUp={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleExplain} 
                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-accent rounded-full transition-all active:scale-95 group text-foreground"
                        >
                            <Sparkles size={11} className="group-hover:scale-110 transition-transform text-indigo-500" />
                            <span>Explain</span>
                        </button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <button 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleQuickQuestions} 
                            className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-accent rounded-full transition-all active:scale-95 group text-foreground"
                        >
                            <Zap size={11} className="group-hover:scale-110 transition-transform text-amber-500" />
                            <span>Questions</span>
                        </button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <button 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { navigator.clipboard.writeText(selection); setShowPopover(false); }} 
                            title="Copy Selection" 
                            className="p-2 hover:bg-accent rounded-full transition-colors group"
                        >
                            <Copy size={12} className="text-muted-foreground group-hover:text-foreground" />
                        </button>
                    </div>
                )}
                <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center">
                    <iframe 
                        ref={iframeRef} 
                        src={pdfUrl} 
                        className="w-full h-full border-none overflow-hidden" 
                        title={title} 
                        allowFullScreen 
                    />
                </div>
            </div>

            {sidebarOpen && (
                <AiSidecar 
                    selection={explanationSelection || selection}
                    path={path}
                    page={page}
                    onClose={() => setSidebarOpen(false)}
                    initialMode={isQuizMode ? 'quiz' : 'explain'}
                />
            )}
        </div>
    );
});
