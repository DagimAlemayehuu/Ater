import React, { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useConfig } from '@/lib/ConfigContext';
import { useTheme } from '@/context/theme-provider';
import { ExplainSidebar } from './ExplainSidebar';
import { invoke } from '@tauri-apps/api/core';
import { PanelLoader } from '@/components/ui/loading-state';
import { fetchSidecarJson } from '@/lib/sidecarHttp';

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
    const { resolvedTheme } = useTheme();
    const [page, setPage] = useState(initialPage);
    const [sidecarPort, setSidecarPort] = useState<number>(8765);
    const [sidecarToken, setSidecarToken] = useState<string>('');

    useEffect(() => {
        const fetchPort = async () => {
            try {
                const activePort = await invoke<number>('get_sidecar_port');
                setSidecarPort(activePort);
                const token = await invoke<string>('get_sidecar_token');
                setSidecarToken(token);
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
                const data = await fetchSidecarJson(url, {
                    headers: {
                        'X-Ater-Token': sidecarToken
                    }
                });
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


    // resolvedTheme is fetched dynamically from useTheme context

    // Memoize URL to prevent reloads when jumping between waypoints in the same file
    const backendUrl = useMemo(() => {
        const vaultPath = config?.obsidianVaultPath || '';
        const filterStr = filterPages && filterPages.length > 0 ? `&filter_pages=${filterPages.join(',')}` : '';
        const normalizedPath = path.replace(/\\/g, '/');
        const tokenQuery = sidecarToken ? `&sidecar_token=${encodeURIComponent(sidecarToken)}` : '';
        return `http://127.0.0.1:${sidecarPort}/api/obsidian/viewer/${encodeURI(normalizedPath)}?vault_path=${encodeURIComponent(vaultPath)}&page=${firstPageRef.current}${filterStr}&theme=${resolvedTheme}${tokenQuery}`;
    }, [path, resolvedTheme, filterPages, config?.obsidianVaultPath, sidecarPort, sidecarToken]);

    const [pdfError, setPdfError] = useState<string | null>(null);

    useEffect(() => {
        setIframeLoaded(false);
    }, [backendUrl]);

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
                            data-tour="explain-btn"
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
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-bento-panel text-foreground border border-border shadow-2xl rounded-[6px] text-[9px] font-black uppercase tracking-widest hover:bg-muted transition-all duration-150 animate-in fade-in zoom-in duration-100"
                            >
                                Explain More
                            </button>
                        </div>
                    )}

                    <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-bento-bg">
                        {!(window as any).__TAURI_INTERNALS__ ? (
                            <div className="flex-1 w-full h-full flex flex-col p-6 overflow-y-auto">
                                {/* Slide Header */}
                                <div className="flex justify-between items-center border-b border-border pb-4 mb-6 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Document Preview: {title}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground">PAGE {page} OF 12</span>
                                </div>
                                
                                {/* Slide Body */}
                                <div className="flex-1 flex flex-col justify-center max-w-[800px] mx-auto w-full border border-border bg-bento-panel p-10 rounded-[8px] shadow-lg relative min-h-[420px] my-auto">
                                    <div className="absolute top-4 left-4 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">CS 201: Algorithms & Data Structures</div>
                                    <div className="absolute top-4 right-4 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">Syllabus Pack</div>
                                    
                                    <div className="my-auto space-y-6">
                                        {page === 1 ? (
                                            <>
                                                <h2 className="text-[20px] font-bold text-foreground tracking-tight border-b border-border pb-3">Lecture 1: Logarithmic Complexity & Halving Structures</h2>
                                                
                                                <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
                                                    <p className="font-semibold text-foreground">Core Objective:</p>
                                                    <p>This course analyzes logarithmic runtime complexities <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">O(log n)</code> through Halving Structures, demonstrating how partitioning search spaces leads to extreme computational bounds.</p>
                                                    
                                                    <div className="p-4 bg-bento-card border border-border rounded-[6px] space-y-2 mt-4">
                                                        <p className="font-bold text-foreground uppercase tracking-wider text-[9px]">Course Modules:</p>
                                                        <ul className="list-disc list-inside space-y-1.5 text-[11px]">
                                                            <li><span className="font-bold text-foreground">Unit 1:</span> Searching Complexity & Binary Search proofs</li>
                                                            <li><span className="font-bold text-foreground">Unit 2:</span> Balanced Search Trees & AVL rotations</li>
                                                            <li><span className="font-bold text-foreground">Unit 3:</span> Hash mapping & linear probing</li>
                                                            <li><span className="font-bold text-foreground">Unit 4:</span> Graph representations, BFS/DFS traversal bounds</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </>
                                        ) : page === 2 ? (
                                            <>
                                                <h2 className="text-[20px] font-bold text-foreground tracking-tight border-b border-border pb-3">Section 1.2: Divide & Conquer Master Theorem</h2>
                                                
                                                <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
                                                    <p className="font-semibold text-foreground">Mathematical Modeling:</p>
                                                    <p>We model the reduction process using recurrence relations. For algorithms that bisect problems:</p>
                                                    <div className="p-4 bg-bento-card border border-border rounded-[6px] font-mono text-[11px] text-foreground text-center my-2">
                                                        T(n) = T(n/2) + O(1)
                                                     </div>
                                                    <p>By case 2 of the Master Theorem, this solves directly to <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">Θ(log n)</code>. The height of the decision recursion tree is exactly bounded by the log base 2 of the problem size.</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="text-[20px] font-bold text-foreground tracking-tight border-b border-border pb-3">Section {1 + page / 10}: Optimal Searching Partitions</h2>
                                                
                                                <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
                                                    <p className="font-semibold text-foreground">Minimax Decision Tree Bounds:</p>
                                                    <p>For any comparison-based search algorithm over an array of size <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">n</code>, the worst-case complexity is lower-bounded by the minimum height of a binary decision tree containing <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">n</code> leaves.</p>
                                                    <p className="p-3 bg-bento-card border border-dashed border-border rounded-[6px] text-[11px]">
                                                        Height ≥ ⌈log₂ n⌉. Thus, bisection is mathematically optimal for comparison-based searching under uniform distributions.
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {(!iframeLoaded) ? (
                                    <PanelLoader label="Loading engine..." />
                                ) : null}
                                {backendUrl && (
                                    <iframe 
                                        ref={iframeRef} 
                                        src={backendUrl} 
                                        onLoad={handleIframeLoad}
                                        className={`w-full h-full border-none overflow-hidden bg-card ${(!iframeLoaded) ? 'invisible absolute' : ''}`}
                                        title={title} 
                                        allowFullScreen 
                                    />
                                )}
                            </>
                        )}
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
