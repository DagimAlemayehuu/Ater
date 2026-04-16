import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, Copy, Check, Maximize2, Minimize2, Filter } from 'lucide-react';
import { useConfig } from '@/lib/ConfigContext';
import { sidecarApi } from '@/lib/sidecarApi';
import { MarkdownViewer } from './MarkdownViewer';

interface PdfViewerProps {
    path: string;
    title: string;
    initialPage?: number;
    filterPages?: number[];
}

export function PdfViewer({ path, initialPage = 1, filterPages }: PdfViewerProps) {
    const { config } = useConfig();
    const [page, setPage] = useState(initialPage);
    const [isFiltered, setIsFiltered] = useState(false);
    const [filteredList, setFilteredList] = useState<number[]>([]);

    useEffect(() => {
        setPage(initialPage);
    }, [initialPage]);

    const [pageCount, setPageCount] = useState<number | null>(null);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Selection state
    const [selection, setSelection] = useState("");
    const [showPopover, setShowPopover] = useState(false);
    const selectionTimeoutRef = useRef<any>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Sidebar / explanation state
    const [showSidebar, setShowSidebar] = useState(false);
    const [explanation, setExplanation] = useState("");
    const [explanationSelection, setExplanationSelection] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [copied, setCopied] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Fullscreen Logic ──────────────────────────────────────
    const toggleFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        
        if (!document.fullscreenElement) {
            const requestMethod = el.requestFullscreen || (el as any).webkitRequestFullscreen || (el as any).mozRequestFullScreen || (el as any).msRequestFullscreen;
            if (requestMethod) {
                requestMethod.call(el).catch((err: any) => {
                    console.error(`Fullscreen failed: ${err.message}`);
                });
            }
        } else {
            const exitMethod = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
            if (exitMethod) exitMethod.call(document);
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
        };
    }, []);

    // ── Reset on file switch ──────────────────────────────────
    useEffect(() => {
        setSelection("");
        setShowPopover(false);
        setExplanation("");
        setShowSidebar(false);
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
                    if (data.width && data.height) {
                        setAspectRatio(data.width / data.height);
                    }
                }
            } catch (e) { console.error("PDF metadata fetch failed", e); }
        };
        fetchMetadata();
    }, [path, config?.obsidianVaultPath]);

    // ── Iframe Message Bridge ─────────────────────────────────
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!event.data?.type) return;

            if (event.data.type === 'selection') {
                const text = event.data.text?.trim() || '';
                if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
                if (text.length > 0) {
                    setSelection(text);
                    setShowPopover(true);
                } else {
                    selectionTimeoutRef.current = setTimeout(() => {
                        setShowPopover(false);
                    }, 300);
                }
            } else if (event.data.type === 'keydown') {
                // If isControlled is true, the iframe already handled the navigation
                if (!event.data.isControlled) {
                    const key = event.data.key;
                    if (key === 'ArrowRight') handleNext();
                    if (key === 'ArrowLeft') handlePrev();
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
    }, [pageCount, isFiltered]);

    // ── Global Arrow Key Navigation ───────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageCount, isFiltered]);

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

    // ── AI Explanation Call ───────────────────────────────────
    const handleExplain = async () => {
        if (!selection) return;
        setExplanationSelection(selection);
        setExplanation("");
        setShowPopover(false);
        setShowSidebar(true);
        setIsThinking(true);

        try {
            const data = await sidecarApi.explainPdfSelection({ 
                path, selection, page 
            });
            setExplanation(data.answer || "No response.");
        } catch (e: any) {
            setExplanation(`Error: ${e.message}`);
        } finally {
            setIsThinking(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(explanation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── PDF URL ───────────────────────────────────────────────
    const vaultPath = config?.obsidianVaultPath || '';
    const urlObj = new URL(`http://127.0.0.1:8765/api/obsidian/viewer/${encodeURI(path)}`);
    if (vaultPath) urlObj.searchParams.append('vault_path', vaultPath);
    urlObj.searchParams.append('page', initialPage.toString());
    if (filterPages && filterPages.length > 0) {
        urlObj.searchParams.append('filter_pages', filterPages.join(','));
    }
    const pdfUrl = urlObj.toString();

    return (
        <div ref={containerRef} className="flex flex-row h-full bg-white relative overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
                <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
                    {showPopover && selection && (
                        <div className="flex items-center gap-1 bg-white text-black rounded-xl shadow-2xl px-2 py-1.5 border border-gray-200">
                            <button onClick={handleExplain} className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-gray-100 rounded-lg transition-all active:scale-95 group">
                                <Sparkles size={12} className="group-hover:scale-110 transition-transform" />
                                <span>Explain with AI</span>
                            </button>
                            <div className="w-px h-5 bg-gray-200 mx-1" />
                            <button onClick={() => { navigator.clipboard.writeText(selection); setShowPopover(false); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                                <Copy size={13} className="opacity-60 group-hover:opacity-100" />
                            </button>
                        </div>
                    )}

                                    {isFiltered && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-black text-white rounded-lg border border-black shadow-lg shadow-black/10 animate-in fade-in zoom-in duration-300">
                            <Filter size={10} className="text-white" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] pt-0.5">Surgical View</span>
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-lg border border-gray-100 px-2 py-1 shadow-sm">
                        <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black">
                            <ChevronLeft size={13} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-600 min-w-[64px] text-center uppercase tracking-widest">
                            {isFiltered ? `F: ${filteredList.indexOf(page) + 1} / ${pageCount}` : `${page} / ${pageCount || '?'}`}
                        </span>
                        <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black">
                            <ChevronRight size={13} />
                        </button>
                    </div>

                    <button onClick={toggleFullscreen} className="w-7 h-7 rounded-lg border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-black">
                        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    </button>

                    <button onClick={() => setShowSidebar(!showSidebar)} className={`h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all ${showSidebar ? 'border-black text-black' : 'border-gray-100 text-gray-400'}`}>
                        <Sparkles size={11} /> AI
                    </button>
                </div>

                <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center">
                    <iframe
                        ref={iframeRef}
                        src={pdfUrl}
                        className="w-full h-full border-none overflow-hidden"
                        title="PDF Viewer"
                    />
                </div>
            </div>

            {showSidebar && (
                <div className="w-[420px] border-l border-gray-200 bg-white flex flex-col h-full shadow-xl">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-black">AI Assistant</h3>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">Page {page}</p>
                        </div>
                        <button onClick={() => setShowSidebar(false)} className="text-gray-300 hover:text-black p-1"><X size={16} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {explanationSelection && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Selected Passage</span>
                                <p className="text-[12px] text-gray-800 leading-relaxed italic border-l-2 border-black pl-3">{explanationSelection}</p>
                            </div>
                        )}
                        {isThinking && (
                            <div className="flex items-center gap-3 py-6">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Analyzing...</span>
                            </div>
                        )}
                        {explanation && !isThinking && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Response</span>
                                    <button onClick={handleCopy} className="text-[9px] text-gray-400 hover:text-black uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</button>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                    <MarkdownViewer content={explanation} onNavigate={() => {}} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
