import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { useConfig } from '@/lib/ConfigContext';
import { useTheme } from '@/context/theme-provider';
import { ExplainSidebar } from './ExplainSidebar';

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
    handleJump: (page: number) => void;
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
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Explain sidebar state
    const [explainOpen, setExplainOpen] = useState(false);
    const [explainSelection, setExplainSelection] = useState('');

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Notify parent of state changes
    useEffect(() => {
        onStateChange?.({
            page,
            pageCount,
            isFiltered,
            filteredList,
            sidebarOpen: false,
            isFullscreen
        });
    }, [page, pageCount, isFiltered, filteredList, isFullscreen, onStateChange]);

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

    const handleJump = (page: number) => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'jump', page }, '*');
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
            const exitMethod = document.exitFullscreen || (document as any).exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
            exitMethod?.call(document);
        }
    };

    useImperativeHandle(ref, () => ({
        handleNext,
        handlePrev,
        handleJump,
        toggleFullscreen,
        toggleSidebar: () => {}
    }));

    useEffect(() => {
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
            if (event.data.type === 'page_change') {
                setPage(event.data.page);
            } else if (event.data.type === 'metadata') {
                if (event.data.isFiltered) {
                    setIsFiltered(true);
                    setPageCount(event.data.pageCount);
                    setFilteredList(event.data.filterList);
                }
            } else if (event.data.type === 'selection' && event.data.text?.trim()) {
                // iframe sends selected text via postMessage
                setExplainSelection(event.data.text.trim())
                setExplainOpen(true)
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);


    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const resolvedTheme = isDarkMode ? 'dark' : 'light';

    const pdfUrl = `http://127.0.0.1:8765/api/obsidian/viewer/${encodeURI(path)}?vault_path=${encodeURIComponent(config?.obsidianVaultPath || '')}&page=${initialPage}${filterPages && filterPages.length > 0 ? `&filter_pages=${filterPages.join(',')}` : ''}&theme=${resolvedTheme}`;

    const handleAskAI = () => {
        // Use the page title and page number as context since we can't get iframe selection
        const pageContext = `Page ${page}${pageCount ? ` of ${pageCount}` : ''} from "${title}"`;
        setExplainSelection(pageContext);
        setExplainOpen(true);
    };

    return (
        <>
            <div ref={containerRef} className="flex flex-row h-full bg-background relative overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 relative bg-background">
                    {/* Ask AI button overlay */}
                    <div className="absolute top-3 right-3 z-20">
                        <button
                            onClick={handleAskAI}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-background/80 backdrop-blur border border-border/50 shadow-md rounded-full text-[9px] font-black uppercase tracking-widest text-foreground/50 hover:text-foreground hover:border-foreground/30 hover:bg-background transition-all"
                            title="Ask AI about this page"
                        >
                            <Sparkles size={10} className="text-primary/60" />
                            Ask AI
                        </button>
                    </div>

                    <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center">
                        <iframe 
                            ref={iframeRef} 
                            src={pdfUrl} 
                            className="w-full h-full border-none overflow-hidden bg-background" 
                            title={title} 
                            allowFullScreen 
                        />
                    </div>
                </div>
            </div>

            <ExplainSidebar
                isOpen={explainOpen}
                onClose={() => setExplainOpen(false)}
                selection={explainSelection}
                path={path}
                page={page}
            />
        </>
    );
});
