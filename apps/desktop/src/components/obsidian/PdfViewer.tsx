import React, { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useConfig } from '@/lib/ConfigContext';
import { useTheme } from '@/context/theme-provider';
import { ExplainSidebar } from './ExplainSidebar';
import { invoke } from '@tauri-apps/api/core';
import { PanelLoader } from '@/components/ui/loading-state';

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
    const [sidecarPort, setSidecarPort] = useState<number>(8765);

    useEffect(() => {
        const fetchPort = async () => {
            try {
                const activePort = await invoke<number>('get_sidecar_port');
                setSidecarPort(activePort);
                console.info(`[PdfViewer] Dynamically resolved sidecar port: ${activePort}`);
            } catch (e) {
                console.error("[PdfViewer] Failed to get dynamic sidecar port from Tauri, falling back to 8765:", e);
            }
        };
        fetchPort();
    }, []);
    
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const prevPathRef = useRef(path);
    const firstPageRef = useRef(initialPage);

    if (prevPathRef.current !== path) {
        prevPathRef.current = path;
        firstPageRef.current = initialPage;
    }

    useEffect(() => {
        setIframeLoaded(false);
        setPage(firstPageRef.current);
        setPageCount(null);
        setFloatPos(null);
    }, [path]);

    useEffect(() => {
        setPage(initialPage);
    }, [initialPage]);

    const handleIframeLoad = () => {
        setIframeLoaded(true);
        setTimeout(() => {
            handleJump(initialPage);
        }, 60);
    };

    useEffect(() => {
        if (iframeLoaded) {
            handleJump(initialPage);
        }
    }, [initialPage, iframeLoaded]);

    useEffect(() => {
        return () => {
            const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
            if (isFs) {
                const exitMethod = document.exitFullscreen || (document as any).exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
                exitMethod?.call(document);
            }
        };
    }, []);

    const [isFiltered, setIsFiltered] = useState(false);
    const [filteredList, setFilteredList] = useState<number[]>([]);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Explain sidebar state
    const [explainOpen, setExplainOpen] = useState(false);
    const [explainSelection, setExplainSelection] = useState('');
    const [explainScope, setExplainScope] = useState<'selection' | 'page'>('selection');
    const [floatPos, setFloatPos] = useState<{ x: number, y: number } | null>(null);

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
        setPage(page);
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

        let active = true;
        const fetchMetadata = async () => {
            try {
                const vaultPath = config?.obsidianVaultPath || '';
                const normalizedPath = path.replace(/\\/g, '/');
                const url = `http://127.0.0.1:${sidecarPort}/api/obsidian/pdf-metadata/${encodeURI(normalizedPath)}?vault_path=${encodeURIComponent(vaultPath)}`;
                const sidecarToken = await invoke<string>('get_sidecar_token');
                const res = await fetch(url, {
                    headers: {
                        'X-Ater-Token': sidecarToken
                    }
                });
                const data = await res.json();
                if (active && data.page_count) {
                    setPageCount(data.page_count);
                }
            } catch (e) { console.error("PDF metadata fetch failed", e); }
        };
        fetchMetadata();
        return () => { active = false };
    }, [path, config?.obsidianVaultPath, sidecarPort]);

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
            } else if (event.data.type === 'selection') {
                if (event.data.text?.trim()) {
                    setExplainSelection(event.data.text.trim())
                    setExplainScope('selection')
                    // Position button slightly above selection
                    setFloatPos({ x: event.data.mouseX, y: event.data.mouseY - 40 })
                } else {
                    setFloatPos(null)
                }
            }
        };

        const handleGlobalClick = () => setFloatPos(null);

        window.addEventListener('message', handleMessage);
        window.addEventListener('mousedown', handleGlobalClick);

        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('mousedown', handleGlobalClick);
        };
    }, []);


    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const resolvedTheme = isDarkMode ? 'dark' : 'light';

    // Memoize URL to prevent reloads when jumping between waypoints in the same file
    const pdfUrl = useMemo(() => {
        const vaultPath = config?.obsidianVaultPath || '';
        const filterStr = filterPages && filterPages.length > 0 ? `&filter_pages=${filterPages.join(',')}` : '';
        const normalizedPath = path.replace(/\\/g, '/');
        return `http://127.0.0.1:${sidecarPort}/api/obsidian/viewer/${encodeURI(normalizedPath)}?vault_path=${encodeURIComponent(vaultPath)}&page=${firstPageRef.current}${filterStr}&theme=${resolvedTheme}`;
    }, [path, resolvedTheme, filterPages, config?.obsidianVaultPath, sidecarPort]);

    const handleAskAI = () => {
        const pageContext = `Full page ${page}${pageCount ? ` of ${pageCount}` : ''} from "${title}"`;
        setExplainSelection(pageContext);
        setExplainScope('page');
        setExplainOpen(true);
    };

    return (
        <>
            <div ref={containerRef} className="flex flex-row h-full bg-card relative overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 relative bg-card">
                    {/* Explain page button overlay */}
                    <div className="absolute top-3 right-3 z-20">
                        <button
                            onClick={handleAskAI}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border/50 shadow-md rounded-none text-[9px] font-black uppercase tracking-widest text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-none"
                            title="Explain the current PDF page"
                        >
                            Explain Page
                        </button>
                    </div>

                    {/* Floating Explain Button */}
                    {floatPos && (
                        <div 
                            className="absolute z-50 pointer-events-auto"
                            style={{ 
                                left: `${floatPos.x}px`, 
                                top: `${floatPos.y}px`,
                                transform: 'translateX(-50%)'
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => {
                                    setExplainScope('selection');
                                    setExplainOpen(true);
                                    setFloatPos(null);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background border border-foreground shadow-xl rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-foreground/90 transition-none animate-in fade-in zoom-in duration-100"
                            >
                                Explain More
                            </button>
                        </div>
                    )}

                    <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center">
                        {!iframeLoaded && <PanelLoader label="Opening PDF" />}
                        <iframe 
                            ref={iframeRef} 
                            src={pdfUrl} 
                            onLoad={handleIframeLoad}
                            className="w-full h-full border-none overflow-hidden bg-card" 
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
                scope={explainScope}
                sourceKind="pdf"
            />
        </>
    );
});
