import { useEffect, useState, useRef } from "react";
import { useLayout } from "@/context/layout-provider";
import React from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Trash2, RefreshCw, Eye, Edit3, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, Filter, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sidecarApi } from "@/lib/sidecarApi";
import { Input } from "@/components/ui/input";
import { EditableCell } from "./EditableCell";
import { MarkdownViewer } from "./MarkdownViewer";
import { PdfViewer, PdfViewerRef, PdfViewerState } from "./PdfViewer";
import { BacklinksView } from "./BacklinksView";
import { SlashCommandPopover } from "./SlashCommandPopover";

interface ObsidianPagePanelProps {
    isOpen: boolean;
    onClose: () => void;
    databaseId?: string; // Optional for generic notes
    rowId?: string; // Filename, or used for title
    fullPath?: string; // Required for generic notes, or if not in 3-Database
    schema?: Record<string, string>;
    properties?: Record<string, any>;
    onUpdateProperty?: (propertyName: string, newValue: any) => void;
    onNavigate: (pageName: string) => void;
    onDelete?: () => void;
}

export function ObsidianPagePanel({ 
    isOpen, 
    onClose, 
    databaseId, 
    rowId, 
    fullPath,
    schema = {}, 
    properties = {}, 
    onUpdateProperty, 
    onNavigate,
    onDelete 
}: ObsidianPagePanelProps) {
    const [loadingContent, setLoadingContent] = useState(false);
    const [content, setContent] = useState<string>("");
    const [isDirty, setIsDirty] = useState(false);
    const [localTitle, setLocalTitle] = useState("");
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    
    // Internal state for generic note properties/schema
    const [localProps, setLocalProps] = useState<Record<string, any>>(properties);
    const [localSchema, setLocalSchema] = useState<Record<string, string>>(schema);
    
    const { isFullscreen, setIsFullscreen } = useLayout();
    const [pdfState, setPdfState] = useState<PdfViewerState | null>(null);
    const pdfRef = useRef<PdfViewerRef>(null);

    // Slash Command State
    const [slashPopover, setSlashPopover] = useState<{ open: boolean, pos: { top: number, left: number } }>({ open: false, pos: { top: 0, left: 0 } });

    // History for navigation within the sheet
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Resolve the path
    const relativePath = fullPath || (databaseId && rowId ? `3-Database/${databaseId}/${rowId}` : "");
    const isPdf = !!(relativePath?.toLowerCase().split('?')[0].trim().endsWith('.pdf'));

    useEffect(() => {
        if (isOpen && relativePath) {
            // Track history
            if (history[historyIndex] !== relativePath) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(relativePath);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }

            // Extract filename from path for title
            const filename = relativePath.split('/').pop() || "";
            setLocalTitle(filename.replace(/\.(md|pdf|png|jpg|jpeg)$/i, ""));
            fetchContent();
            setMode('view');
        }
    }, [isOpen, relativePath]);

    const handleBack = () => {
        if (historyIndex > 0) {
            const prevPath = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            onNavigate(prevPath.replace('.md', ''));
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            const nextPath = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            onNavigate(nextPath.replace('.md', ''));
        }
    };

    const fetchContent = async () => {
        if (!relativePath || isPdf) return;
        setLoadingContent(true);
        try {
            const res = await sidecarApi.readObsidianNote(relativePath);
            setContent(res.content || "");
            
            // If we're a generic note, we might want to show its metadata
            if (!databaseId) {
                const metadata = res.metadata || {};
                setLocalProps(metadata);
                const derivedSchema: Record<string, string> = {};
                Object.entries(metadata).forEach(([k, v]) => {
                    if (k === 'last_synced' || k === 'links') return;
                    derivedSchema[k] = Array.isArray(v) ? 'list' : 
                                     typeof v === 'boolean' ? 'bool' : 
                                     typeof v === 'number' ? (Number.isInteger(v) ? 'int' : 'float') : 'str';
                });
                setLocalSchema(derivedSchema);
            } else {
                setLocalProps(properties);
                setLocalSchema(schema);
            }
            setIsDirty(false);
        } catch (err) {
            console.error("Failed to fetch obsidian note content", err);
        } finally {
            setLoadingContent(false);
        }
    };

    const handleUpdateLocalProp = async (name: string, val: any) => {
        if (val && typeof val === 'object' && val._bulk) {
            // Handle multiple updates from a button action
            const updates = { ...val };
            delete updates._bulk;
            
            for (const [p, v] of Object.entries(updates)) {
                if (onUpdateProperty) {
                    onUpdateProperty(p, v);
                } else {
                    setLocalProps(prev => ({ ...prev, [p]: v }));
                }
            }
            return;
        }

        if (onUpdateProperty) {
            onUpdateProperty(name, val);
        } else {
            // Generic note update
            setLocalProps(prev => ({ ...prev, [name]: val }));
        }
    };

    useEffect(() => {
        if (!isDirty || !isOpen || !relativePath || isPdf) return;
        const timer = setTimeout(async () => {
            try {
                await sidecarApi.updateObsidianNote(relativePath, content);
                setIsDirty(false);
            } catch (err) {
                console.error("Failed to auto-save obsidian content", err);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [content, isDirty, isOpen, relativePath, isPdf]);

    const handleTitleSave = async (newTitle: string) => {
        if (!newTitle || newTitle === localTitle) return;
        try {
            // Use the same rename logic as in the database view
            await sidecarApi.renameVaultFile(databaseId || 'generic', rowId || relativePath, newTitle);
            setLocalTitle(newTitle);
            // Parent will refresh rows
        } catch (e) {
            console.error("Rename failed", e);
        }
    };

    const displayProps = databaseId ? properties : localProps;
    const displaySchema = databaseId ? schema : localSchema;
    const sortedPropertyKeys = Object.keys(displaySchema).sort();

    const [propertiesExpanded, setPropertiesExpanded] = useState(true);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent 
                className={cn(
                    "h-full flex flex-col p-0 gap-0 border-l border-gray-200 bg-white shadow-xl overflow-hidden transition-all duration-300",
                    isFullscreen 
                        ? "fixed inset-0 w-screen max-w-none h-screen z-[100] rounded-none border-none" 
                        : "sm:max-w-5xl w-full"
                )}
            >
                <SheetTitle className="sr-only">{localTitle}</SheetTitle>
                <SheetDescription className="sr-only">Viewing {relativePath}</SheetDescription>

                {/* Page Chrome: Cover & Icon */}
                {!isFullscreen && (
                    <div className="relative group/chrome shrink-0 h-40">
                        <div className="h-full w-full bg-gray-50 relative overflow-hidden">
                            {displayProps.cover ? (
                                <img src={displayProps.cover} className="w-full h-full object-cover transition-opacity" alt="" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-b from-gray-200/50 to-transparent" />
                            )}
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/chrome:opacity-100 transition-opacity flex items-center justify-center">
                                 <button onClick={() => {
                                     const url = prompt("Cover URL:", displayProps.cover || "");
                                     if (url !== null) handleUpdateLocalProp('cover', url);
                                 }} className="px-3 py-1 bg-white/80 rounded blur-xl group-hover/chrome:blur-none transition-all text-[10px] font-black uppercase tracking-widest shadow-lg">Change Cover</button>
                            </div>
                        </div>

                        <div className="absolute -bottom-8 left-8 flex items-end gap-2 z-10">
                            <div 
                                className="size-16 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xl flex items-center justify-center text-3xl cursor-pointer hover:scale-110 transition-transform active:scale-95"
                                onClick={() => {
                                    const icon = prompt("Emoji Icon:", displayProps.icon || "");
                                    if (icon !== null) handleUpdateLocalProp('icon', icon);
                                }}
                            >
                                {displayProps.icon || "📄"}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col flex-1 min-h-0">
                    <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-8 py-3 flex justify-between items-center gap-4 shrink-0 shadow-sm">
                    <div className="flex items-center gap-4 overflow-hidden">
                        {/* Global Sheet Navigation */}
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={handleBack}
                                disabled={historyIndex <= 0}
                                className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 disabled:opacity-20 hover:text-black transition-all active:scale-90"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={handleForward}
                                disabled={historyIndex >= history.length - 1}
                                className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 disabled:opacity-20 hover:text-black transition-all active:scale-90"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        
                        <div className="w-px h-4 bg-gray-100 mx-1" />

                        <div className="flex items-center gap-2 overflow-hidden">
                            <RefreshCw size={12} className={cn("text-gray-300", loadingContent && "animate-spin")} />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[200px]">{relativePath}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isPdf && (
                            <div className="flex items-center gap-2">
                                {/* PDF Navigation & Status Bundle */}
                                <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg border border-gray-100 p-0.5 pr-2">
                                    <div className="flex items-center">
                                        <button 
                                            onClick={() => pdfRef.current?.handlePrev()} 
                                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-400 hover:text-black transition-all active:scale-90"
                                            title="Previous Page"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button 
                                            onClick={() => pdfRef.current?.handleNext()} 
                                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-400 hover:text-black transition-all active:scale-90"
                                            title="Next Page"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    
                                    <div className="w-px h-3 bg-gray-200 mx-0.5" />
                                    
                                    <span className="text-[10px] font-black text-gray-800 tabular-nums min-w-[50px] text-center tracking-tight px-1">
                                        {pdfState?.page || 1} <span className="text-gray-300 mx-0.5">/</span> {pdfState?.pageCount || '...'}
                                    </span>

                                    {pdfState?.isFiltered && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black text-white rounded-md border border-black shadow-sm">
                                            <Filter size={8} />
                                            <span className="text-[8px] font-black uppercase tracking-widest pt-0.5">Surgical</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-px h-4 bg-gray-100 mx-1" />

                                {/* Controls Bundle */}
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setIsFullscreen(!isFullscreen)} 
                                        className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-black transition-all active:scale-90"
                                        title="Toggle Fullscreen"
                                    >
                                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                    </button>

                                    <button 
                                        onClick={() => pdfRef.current?.toggleSidebar()} 
                                        className={cn(
                                            "flex items-center gap-2 h-8 px-4 rounded-lg border transition-all text-[10px] font-black uppercase tracking-widest active:scale-95",
                                            pdfState?.sidebarOpen 
                                                ? "bg-black text-white border-black shadow-sm" 
                                                : "bg-white text-gray-500 border-gray-100 hover:border-black hover:text-black"
                                        )}
                                        title="Toggle AI Assistant"
                                    >
                                        <Sparkles size={12} className={pdfState?.sidebarOpen ? "text-white" : "text-indigo-500"} />
                                        <span>AI</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isPdf && (
                            <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-100 shrink-0">
                                <button 
                                    onClick={() => setMode('view')}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                                        mode === 'view' ? "bg-white text-black shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <Eye size={12} />
                                    Read
                                </button>
                                <button 
                                    onClick={() => setMode('edit')}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                                        mode === 'edit' ? "bg-white text-black shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <Edit3 size={12} />
                                    Edit
                                </button>
                            </div>
                        )}
                        
                        <button 
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-300 hover:text-black transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className={cn("flex-1", !isPdf && "overflow-y-auto custom-scrollbar")}>
                    {/* Header Controls Area (Above Title) - REMOVED, now in control bar */}

                    {!isPdf && (
                        <div className="px-8 pt-12 pb-4 flex items-start justify-between gap-6">
                            <div className="flex-1 min-w-0">
                                <Input 
                                    value={localTitle} 
                                    onChange={(e) => setLocalTitle(e.target.value)}
                                    onBlur={(e) => handleTitleSave(e.target.value)}
                                    className="text-4xl font-black border-none focus-visible:ring-0 bg-transparent px-0 h-auto w-full tracking-tighter truncate leading-tight shadow-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className={cn("p-8 pt-4", isPdf ? "h-full p-0 overflow-hidden" : "space-y-12")}>
                    {/* Collapsible Properties Area */}
                    {!isPdf && sortedPropertyKeys.length > 0 && (
                        <div className="space-y-4">
                            <button 
                                onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
                            >
                                <ChevronDown size={12} className={cn("transition-transform", !propertiesExpanded && "-rotate-90")} />
                                Properties
                            </button>
                            
                            {propertiesExpanded && (
                                <div className="grid grid-cols-1 gap-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {sortedPropertyKeys.map((name) => {
                                        if (name === 'cover' || name === 'icon') return null;
                                        const val = displayProps[name];
                                        const type = displaySchema[name];
                                        
                                        return (
                                            <div key={name} className="flex items-center gap-4 group min-h-[36px] hover:bg-gray-50/50 rounded-lg px-2 -mx-2 transition-colors">
                                                <div className="w-32 flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter truncate group-hover:text-gray-500 transition-colors" title={name}>{name}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <EditableCell
                                                        initialValue={val}
                                                        type={type}
                                                        onSave={(newValue) => handleUpdateLocalProp(name, newValue)}
                                                        onNavigate={onNavigate}
                                                        row={{ properties: displayProps }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content Area */}
                    <div className={cn(isPdf ? "h-full" : "space-y-10 min-h-[500px]")}>
                        {loadingContent ? (
                            <div className="h-64 flex items-center justify-center opacity-10"><RefreshCw size={24} className="animate-spin" /></div>
                        ) : isPdf ? (
                            <PdfViewer 
                                ref={pdfRef}
                                path={relativePath} 
                                title={localTitle} 
                                onStateChange={setPdfState}
                            />
                        ) : (
                            <div className="space-y-16">
                                {mode === 'edit' ? (
                                    <div className="relative group/editor animate-in fade-in duration-300">
                                        <textarea
                                            value={content}
                                            onChange={(e) => { 
                                                const val = e.target.value;
                                                const pos = e.target.selectionStart;
                                                setContent(val); 
                                                setIsDirty(true); 

                                                if (val[pos - 1] === '/') {
                                                    const rect = e.target.getBoundingClientRect();
                                                    setSlashPopover({ open: true, pos: { top: rect.top + 30, left: rect.left + 50 } });
                                                } else {
                                                    setSlashPopover({ open: false, pos: { top: 0, left: 0 } });
                                                }
                                            }}
                                            className="w-full min-h-[600px] p-0 text-[14px] bg-transparent border-none rounded focus:outline-none font-medium leading-relaxed resize-none custom-scrollbar placeholder:opacity-5 text-gray-800"
                                            placeholder="Start writing..."
                                        />
                                        {slashPopover.open && (
                                            <SlashCommandPopover 
                                                position={slashPopover.pos}
                                                onClose={() => setSlashPopover({ open: false, pos: { top: 0, left: 0 } })}
                                                onSelect={(cmd) => {
                                                    const textarea = document.querySelector('textarea');
                                                    if (textarea) {
                                                        const start = textarea.selectionStart;
                                                        const before = content.substring(0, start - 1);
                                                        const after = content.substring(start);
                                                        const newContent = before + cmd + after;
                                                        setContent(newContent);
                                                        setIsDirty(true);
                                                        setSlashPopover({ open: false, pos: { top: 0, left: 0 } });
                                                        setTimeout(() => textarea.focus(), 10);
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <MarkdownViewer 
                                            content={content} 
                                            onNavigate={onNavigate} 
                                            path={relativePath}
                                        />
                                    </div>
                                )}

                                <div className="pb-20 border-t border-gray-100 pt-10">
                                    <BacklinksView 
                                        pageName={localTitle} 
                                        onNavigate={(path) => onNavigate(path.replace('.md', ''))} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </SheetContent>
    </Sheet>
    );
}

