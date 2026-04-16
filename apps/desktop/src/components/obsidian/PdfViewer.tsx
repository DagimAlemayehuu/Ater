import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, Copy, Check } from 'lucide-react';
import { useConfig } from '@/lib/ConfigContext';
import { sidecarApi } from '@/lib/sidecarApi';

interface PdfViewerProps {
    path: string;
    title: string;
}

export function PdfViewer({ path }: PdfViewerProps) {
    const { config } = useConfig();
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);

    // Selection state
    const [selection, setSelection] = useState("");
    const [showPopover, setShowPopover] = useState(false);

    // Sidebar / explanation state
    const [showSidebar, setShowSidebar] = useState(false);
    const [explanation, setExplanation] = useState("");
    const [explanationSelection, setExplanationSelection] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [copied, setCopied] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ── Reset on file switch ──────────────────────────────────
    useEffect(() => {
        setPage(1);
        setSelection("");
        setShowPopover(false);
        setExplanation("");
        setShowSidebar(false);
        setIsThinking(false);

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
                setSelection(text);
                setShowPopover(text.length > 0);
            } else if (event.data.type === 'keydown') {
                const key = event.data.key;
                if (key === 'ArrowRight') setPage(prev => (pageCount ? Math.min(pageCount, prev + 1) : prev + 1));
                if (key === 'ArrowLeft') setPage(prev => Math.max(1, prev - 1));
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [pageCount]);

    // ── Global Arrow Key Navigation ───────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight') setPage(prev => (pageCount ? Math.min(pageCount, prev + 1) : prev + 1));
            if (e.key === 'ArrowLeft') setPage(prev => Math.max(1, prev - 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pageCount]);

    // ── AI Explanation Call ───────────────────────────────────
    const handleExplain = async () => {
        if (!selection) {
            console.warn("[PdfViewer] No text selected for AI explanation.");
            return;
        }
        
        console.log(`[PdfViewer] Requesting AI explanation for: "${selection.substring(0, 30)}..."`);
        setExplanationSelection(selection);
        setExplanation("");
        setShowPopover(false);
        setShowSidebar(true);
        setIsThinking(true);

        try {
            const data = await sidecarApi.explainPdfSelection({ 
                path, 
                selection, 
                page 
            });
            
            if (data.answer) {
                setExplanation(data.answer);
            } else {
                setExplanation(`**Brain Error:** ${data.detail || "The AI model returned an empty response."}`);
            }
        } catch (e: any) {
            console.error("[PdfViewer] AI call failed:", e);
            setExplanation(`**Bridge Error:** ${e.message}. \n\n*Check the Sidecar logs for details.*`);
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
    urlObj.searchParams.append('page', page.toString());
    const pdfUrl = urlObj.toString();

    return (
        <div className="flex flex-row h-full bg-[#f7f7f7] relative overflow-hidden">

            {/* ── Main Viewer ───────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">

                {/* Toolbar */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-30">

                    {/* Selection Popover — appear when text is selected */}
                    {showPopover && selection && (
                        <div className="flex items-center gap-1 bg-black text-white rounded-xl shadow-2xl px-2 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 border border-white/10">
                            <button
                                onClick={handleExplain}
                                className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-white/10 rounded-lg transition-all active:scale-95 group"
                            >
                                <Sparkles size={12} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                                <span>Explain with AI</span>
                            </button>
                            <div className="w-px h-5 bg-white/20 mx-1" />
                            <button
                                onClick={() => { navigator.clipboard.writeText(selection); setShowPopover(false); }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                                title="Copy Selection"
                            >
                                <Copy size={13} className="opacity-60 group-hover:opacity-100" />
                            </button>
                            <button
                                onClick={() => { setSelection(""); setShowPopover(false); }}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                                title="Dismiss"
                            >
                                <X size={13} className="opacity-40 group-hover:opacity-100" />
                            </button>
                        </div>
                    )}

                    {/* Page Navigator */}
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-lg border border-gray-100 px-2 py-1 shadow-sm">
                        <button
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors"
                        >
                            <ChevronLeft size={13} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-600 min-w-[56px] text-center uppercase tracking-widest">
                            {page} / {pageCount || '?'}
                        </span>
                        <button
                            onClick={() => setPage(prev => (pageCount ? Math.min(pageCount, prev + 1) : prev + 1))}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors"
                        >
                            <ChevronRight size={13} />
                        </button>
                    </div>

                    {/* AI Assistant Toggle */}
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`flex items-center gap-1.5 h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all shadow-sm bg-white/90 backdrop-blur-md ${showSidebar ? 'border-black text-black' : 'border-gray-100 text-gray-400 hover:text-black hover:border-gray-300'}`}
                    >
                        <Sparkles size={11} />
                        AI
                    </button>
                </div>

                {/* PDF Iframe - Scroll-locked */}
                <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center p-8">
                    <div
                        className="relative bg-white shadow-2xl rounded-sm overflow-hidden"
                        style={{
                            width: aspectRatio ? `min(100%, calc((100vh - 160px) * ${aspectRatio}))` : '100%',
                            height: aspectRatio ? 'min(100%, calc(100vh - 160px))' : '100%',
                            maxHeight: '100%',
                            maxWidth: '100%',
                        }}
                    >
                        <iframe
                            key={`${path}-${page}`}
                            src={pdfUrl}
                            style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
                            title="PDF Viewer"
                        />
                    </div>
                </div>

                {/* Footer nav hint */}
                {!showPopover && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-300">
                            ← Arrow Keys →
                        </p>
                    </div>
                )}
            </div>

            {/* ── AI Explanation Sidebar ────────────────────── */}
            {showSidebar && (
                <div className="w-[420px] border-l border-gray-200 bg-white flex flex-col h-full animate-in slide-in-from-right duration-250 shadow-xl">

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-black">AI Explanation</h3>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">
                                {path.split('/').pop()} — Page {page}
                            </p>
                        </div>
                        <button onClick={() => setShowSidebar(false)} className="text-gray-300 hover:text-black transition-colors p-1">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">

                        {/* Empty state */}
                        {!isThinking && !explanation && !explanationSelection && (
                            <div className="flex flex-col items-center justify-center h-full opacity-40 py-16">
                                <Sparkles size={28} className="text-gray-300 mb-3" />
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center leading-relaxed">
                                    Select text in the PDF<br />then tap "Explain with AI"
                                </p>
                            </div>
                        )}

                        {/* Selected Passage */}
                        {explanationSelection && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Selected Passage</span>
                                <p className="text-[12px] text-gray-800 leading-relaxed italic border-l-2 border-black pl-3">
                                    {explanationSelection}
                                </p>
                            </div>
                        )}

                        {/* Thinking */}
                        {isThinking && (
                            <div className="flex items-center gap-3 py-6">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Analyzing...</span>
                            </div>
                        )}

                        {/* Explanation — rendered as plain markdown-like text */}
                        {explanation && !isThinking && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Explanation</span>
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
                                    >
                                        {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-xl p-4 text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap font-sans shadow-sm">
                                    {explanation}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer status */}
                    <div className="px-5 py-3 border-t border-gray-100 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-mono truncate">
                                {config?.aiProvider || 'google'} / {config?.aiModel || 'gemini-2.0-flash'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
