import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Menu, Search, FileText, ChevronRight, Folder, 
    Save, Edit3, X, Network, Archive, RefreshCw, FolderOpen, Database,
    Send, Bot, User, Trash2, ShieldCheck, Layers,
    Sparkles, Paperclip, ChevronDown, ChevronUp, Maximize2, Minimize2, Info, PanelLeft, Layout,
    Plus, ChevronLeft, GraduationCap, Calendar, Building, Circle, Users, Settings, BrainCircuit, Zap, Activity, PauseCircle, ListChecks, Terminal,
    MoreVertical, ArrowRight, ArrowLeft, Share2
} from 'lucide-react'
import { sidecarApi, ObsidianFile } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownViewer } from '@/components/obsidian/MarkdownViewer'
import { NoteProperties, HubConnectionsNav, Backlinks } from '@/components/obsidian/NoteMetadata'
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from '@/components/ui/sheet'
import { MobileDatabaseView } from '@/components/obsidian/MobileDatabaseView'
import { ObsidianGraphView } from '@/components/obsidian/ObsidianGraphView'
import React from 'react'

const PdfViewer = ({ path, isDarkMode }: { path: string, isDarkMode: boolean }) => {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPdf = async () => {
            setLoading(true);
            try {
                const res = await (sidecarApi as any).readBinaryFile(path);
                setDataUrl(`data:application/pdf;base64,${res.data}`);
            } catch (e) {
                console.error("PDF Fail", e);
            } finally {
                setLoading(false);
            }
        };
        fetchPdf();
    }, [path]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="animate-spin text-primary/20" size={40} />
        </div>
    );

    return (
        <div className="flex-1 w-full h-full bg-background overflow-hidden relative">
            <embed 
                src={dataUrl || ""} 
                type="application/pdf" 
                className={cn(
                    "w-full h-full border-none",
                    isDarkMode && "invert brightness-90 contrast-125 hue-rotate-180"
                )} 
            />
            {isDarkMode && (
                <div className="absolute inset-0 pointer-events-none bg-primary/5 mix-blend-multiply" />
            )}
        </div>
    );
};

const VaultStatsBar = () => {
    const [stats, setStats] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStats = async () => {
        setIsRefreshing(true);
        try {
            const res = await sidecarApi.getVaultStats();
            setStats(res);
        } catch (e) {
            console.error("Stats fetch failed", e);
        } finally {
            setTimeout(() => setIsRefreshing(false), 800);
        }
    };

    useEffect(() => {
        fetchStats();
        
        const handleUpdate = () => fetchStats();
        window.addEventListener('vault-updated', handleUpdate);
        return () => window.removeEventListener('vault-updated', handleUpdate);
    }, []);

    if (!stats) return <div className="h-10 bg-muted/5 animate-pulse rounded-xl" />;

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/10 border border-border/20 p-4 rounded-2xl flex flex-col gap-1 transition-all active:scale-[0.98]">
                    <span className="text-[7px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Notes</span>
                    <span className="text-sm font-black text-primary tabular-nums">{stats.totalNotes}</span>
                </div>
                <div className="bg-muted/10 border border-border/20 p-4 rounded-2xl flex flex-col gap-1 transition-all active:scale-[0.98]">
                    <span className="text-[7px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Assets</span>
                    <span className="text-sm font-black text-primary tabular-nums">{stats.totalAssets}</span>
                </div>
                <button 
                    onClick={fetchStats}
                    disabled={isRefreshing}
                    className="bg-muted/10 border border-border/20 p-4 rounded-2xl flex flex-col gap-1 text-left transition-all active:scale-[0.98] relative overflow-hidden"
                >
                    <span className="text-[7px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Sync_Time</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-primary/80 truncate">
                            {new Date(stats.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <RefreshCw size={8} className={cn("text-primary/40", isRefreshing && "animate-spin text-primary")} />
                    </div>
                    {isRefreshing && <div className="absolute bottom-0 left-0 h-0.5 bg-primary animate-progress-fast" style={{ width: '100%' }} />}
                </button>
            </div>
        </div>
    );
};

export default function ObsidianVaultPage() {
    const { config } = useConfig()
    const location = useLocation()
    const navigate = useNavigate()
    const { '*': pathParam } = useParams()
    
    // --- Vault Explorer State ---
    const [files, setFiles] = useState<ObsidianFile[]>([])
    const [loadingFiles, setLoadingFiles] = useState(false)
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [noteMetadata, setNoteMetadata] = useState<Record<string, any>>({})
    const [noteContent, setNoteContent] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [editedContent, setEditedContent] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [loadingNote, setLoadingNote] = useState(false)
    const [hubConnections, setHubConnections] = useState<string | null>(null)

    // --- Navigation History ---
    const [history, setHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)

    // --- Mobile Drawers & Views ---
    const [isExplorerOpen, setIsExplorerOpen] = useState(false)
    const [isConnectionsOpen, setIsConnectionsOpen] = useState(false)
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
    const [isGraphOpen, setIsGraphOpen] = useState(false)
    const [backlinks, setBacklinks] = useState<any[]>([])

    useEffect(() => {
        const fetchBacklinks = async () => {
            if (!selectedPath) return
            const cleanName = selectedPath.split('/').pop()?.replace('.md', '') || ''
            try {
                const res = await sidecarApi.getVaultBacklinks(cleanName)
                setBacklinks(res.backlinks || [])
            } catch (e) { console.error("Backlinks fail", e) }
        }
        fetchBacklinks()
    }, [selectedPath])

    useEffect(() => {
        const fetchHubConnections = async () => {
            const rawHub = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.concept_hub || noteMetadata?.course || noteMetadata?.Course || noteMetadata?.semester;
            if (!rawHub) {
                setHubConnections(null)
                return
            }
            
            try {
                const hubItems = Array.isArray(rawHub) ? rawHub : [rawHub];
                const cleanHubName = String(hubItems[0] || '').replace(/\[\[/g, '').replace(/\]\]/g, '').trim();
                if (!cleanHubName) return;
                
                const res = await sidecarApi.findVaultPage(cleanHubName)
                if (res.found && res.path) {
                    const note = await sidecarApi.readObsidianNote(res.path)
                    const match = note.content.match(/(?:#+\s*Core Topologies.*?|#+\s*Connections)\s*\n([\s\S]*?)(?=\n#+\s|$)/i)
                    if (match && match[1]) {
                        let topologies = match[1].trim()
                        const pageName = selectedPath?.split('/').pop()?.replace('.md', '') || '';
                        if (pageName) {
                            const regex = new RegExp(`(\\[\\[${pageName}\\]\\])`, 'gi');
                            topologies = topologies.replace(regex, `**$1** 📍`);
                        }
                        setHubConnections(topologies)
                        return
                    }
                }
                setHubConnections(null)
            } catch (err) {
                console.error("Failed to fetch hub connections", err)
                setHubConnections(null)
            }
        }
        fetchHubConnections()
    }, [noteMetadata, selectedPath])

    useEffect(() => {
        fetchFiles()
        const interval = setInterval(fetchFiles, 10000)
        return () => clearInterval(interval)
    }, [config?.obsidianVaultPath])

    const fetchFiles = async () => {
        if (loadingFiles) return
        setLoadingFiles(true)
        try {
            const res = await sidecarApi.listObsidianFiles(true)
            setFiles(res.files || [])
        } catch (err) {
            console.error('Failed to fetch obsidian files:', err)
        } finally {
            setLoadingFiles(false)
        }
    }

    const selectFile = async (path: string, fromHistory = false) => {
        if (!path) return
        
        setSelectedPath(path)
        setIsExplorerOpen(false)
        setIsConnectionsOpen(false)
        setIsPropertiesOpen(false)

        // Manage History
        if (!fromHistory) {
            const newHistory = history.slice(0, historyIndex + 1)
            if (newHistory[newHistory.length - 1] !== path) {
                newHistory.push(path)
                setHistory(newHistory)
                setHistoryIndex(newHistory.length - 1)
            }
        }

        if (path.toLowerCase().endsWith('.pdf')) {
            setNoteMetadata({})
            setNoteContent('')
            return
        }

        setLoadingNote(true)
        try {
            const res = await sidecarApi.readObsidianNote(path)
            setNoteMetadata(res.metadata || {})
            setNoteContent(res.content || '')
            setEditedContent(res.content || '')
            setIsEditing(false)
        } catch (err) {
            console.error('Failed to read note:', err)
            setNoteContent('# Error\nFailed to load content.')
        } finally { setLoadingNote(false) }
    }

    const handleBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1
            setHistoryIndex(newIndex)
            selectFile(history[newIndex], true)
        }
    }

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            selectFile(history[newIndex], true)
        }
    }

    const handleWikiLinkClick = async (pageName: string, pageNumber?: number, filterPages: number[] = []) => {
        try {
            const res = await sidecarApi.findVaultPage(pageName);
            if (res.found && res.path) {
                selectFile(res.path);
            } else {
                alert(`Note "${pageName}" not found in vault.`);
            }
        } catch (e) {
            console.error('WikiLink Error:', e);
        }
    };

    const handleDeleteFile = async () => {
        if (!selectedPath) return
        if (!confirm(`Are you sure you want to delete ${selectedPath.split('/').pop()}?`)) return
        
        try {
            await sidecarApi.deleteObsidianItem(selectedPath)
            await fetchFiles()
            
            const newHistory = history.filter(h => h !== selectedPath)
            setHistory(newHistory)
            setHistoryIndex(newHistory.length - 1)
            
            if (newHistory.length > 0) {
                selectFile(newHistory[newHistory.length - 1], true)
            } else {
                setSelectedPath(null)
            }
            window.dispatchEvent(new CustomEvent('vault-updated'))
        } catch (e) {
            alert("Delete failed")
        }
    }

    // Load from URL param if exists
    useEffect(() => {
        if (pathParam && pathParam !== selectedPath) {
            selectFile(pathParam)
        }
    }, [pathParam])

    const handleSaveNote = async () => {
        if (!selectedPath) return
        setLoadingNote(true)
        try {
            await sidecarApi.updateObsidianNote(selectedPath, editedContent)
            setNoteContent(editedContent)
            setIsEditing(false)
            window.dispatchEvent(new CustomEvent('vault-updated'))
        } catch (err: any) {
            alert("Save failed")
        } finally {
            setLoadingNote(false)
        }
    }

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(path)) newExpanded.delete(path)
        else newExpanded.add(path)
        setExpandedFolders(newExpanded)
    }

    const renderFileTree = (pathPrefix = '') => {
        const filtered = files.filter(f => {
            const parent = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : ''
            return parent === pathPrefix && (!searchQuery || f.path.toLowerCase().includes(searchQuery.toLowerCase()))
        })

        filtered.sort((a, b) => {
            if (a.is_dir === b.is_dir) {
                const nameA = a.path.split('/').pop() || '';
                const nameB = b.path.split('/').pop() || '';
                return nameA.localeCompare(nameB);
            }
            return a.is_dir ? -1 : 1;
        });

        return (
            <div className="flex flex-col">
                {filtered.map(file => {
                    const isExpanded = expandedFolders.has(file.path)
                    const name = file.path.split('/').pop() || ''
                    return (
                        <div key={file.path} className="flex flex-col">
                            <div 
                                onClick={() => file.is_dir ? toggleFolder(file.path) : selectFile(file.path)}
                                className={cn(
                                    "flex items-center gap-3 py-4 px-4 border-b border-border/5 transition-all",
                                    selectedPath === file.path ? "bg-primary/5 border-l-4 border-l-primary" : "active:bg-muted/50"
                                )}
                            >
                                <div className="text-muted-foreground/40">
                                    {file.is_dir ? <Folder size={18} className={cn(isExpanded && "fill-primary/20 text-primary")} /> : <FileText size={18} />}
                                </div>
                                <span className={cn("truncate text-[13px] flex-1", selectedPath === file.path ? "font-black text-primary" : "font-bold text-foreground/80")}>
                                    {name}
                                </span>
                                {file.is_dir && <ChevronRight size={14} className={cn("text-muted-foreground/30 transition-transform", isExpanded && "rotate-90 text-primary")} />}
                            </div>
                            {file.is_dir && isExpanded && (
                                <div className="pl-4 border-l border-border/10">
                                    {renderFileTree(file.path)}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    // --- UI Actions ---
    const MetadataAction = () => (
        <button
            onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
            className={cn(
                "flex items-center gap-2 px-4 h-11 rounded-xl border transition-all active:scale-95",
                isPropertiesOpen ? "bg-primary border-primary text-primary-foreground font-black" : "bg-muted/10 border-border/40 text-muted-foreground font-bold"
            )}
        >
            <Info size={16} />
            <span className="text-[10px] uppercase tracking-widest">Properties</span>
        </button>
    )

    const EditAction = () => (
        <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 h-11 bg-muted/10 border border-border/40 text-muted-foreground rounded-xl active:scale-95 transition-all font-bold"
        >
            <Edit3 size={16} />
            <span className="text-[10px] uppercase tracking-widest">Edit</span>
        </button>
    )

    const DeleteAction = () => (
        <button
            onClick={handleDeleteFile}
            className="flex items-center gap-2 px-4 h-11 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl active:scale-95 transition-all font-bold"
        >
            <Trash2 size={16} />
            <span className="text-[10px] uppercase tracking-widest">Delete</span>
        </button>
    )

    const showToolbar = selectedPath || isEditing;

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-hidden">
            {isGraphOpen && (
                <ObsidianGraphView 
                    onNodeClick={(path) => {
                        setIsGraphOpen(false)
                        selectFile(path)
                    }} 
                    onClose={() => setIsGraphOpen(false)}
                />
            )}

            {showToolbar && (
                <div className="h-16 border-b border-border/30 flex items-center justify-between px-4 bg-background/95 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedPath(null); }} className="h-10 w-10 rounded-xl bg-muted/10">
                            <Menu size={20} />
                        </Button>
                        <div className="flex items-center bg-muted/10 rounded-xl px-1">
                            <Button variant="ghost" size="icon" onClick={handleBack} disabled={historyIndex <= 0} className="h-10 w-10 text-muted-foreground disabled:opacity-20">
                                <ArrowLeft size={18} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleForward} disabled={historyIndex >= history.length - 1} className="h-10 w-10 text-muted-foreground disabled:opacity-20">
                                <ArrowRight size={18} />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {selectedPath && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => setIsConnectionsOpen(true)} className="h-10 w-10 rounded-xl bg-primary/5 text-primary">
                                    <Layers size={18} />
                                </Button>
                                {isEditing ? (
                                    <Button variant="ghost" size="icon" onClick={handleSaveNote} className="h-10 w-10 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                        <Save size={18} />
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={() => setIsGraphOpen(true)} className="h-10 w-10 rounded-xl bg-muted/10">
                                        <Network size={18} />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            <main className="flex-1 relative overflow-hidden flex flex-col">
                {!selectedPath ? (
                    config?.obsidianVaultPath ? (
                        <div className="flex-1 flex flex-col h-full bg-background animate-in fade-in duration-700">
                            <div className="px-6 pt-6 pb-4 border-b border-border/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-1">Vault_Registry</span>
                                        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Manuscript<br/><span className="text-primary/20">Blueprint</span></h1>
                                    </div>
                                    <Button onClick={() => setIsGraphOpen(true)} className="h-10 w-10 rounded-xl bg-primary shadow-xl shadow-primary/20 p-0 active:scale-90 transition-transform">
                                        <Network size={20} />
                                    </Button>
                                </div>
                                <VaultStatsBar />
                                <div className="mt-4 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={14} />
                                    <input 
                                        placeholder="Filter Knowledge Index..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-muted/10 border border-border/20 p-3 pl-11 text-[12px] font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1 px-2 pt-2 pb-20">
                                {loadingFiles && files.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center gap-4 opacity-20">
                                        <RefreshCw className="animate-spin" size={32} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Mapping_Index</span>
                                    </div>
                                ) : (
                                    <div className="pb-20">
                                        {renderFileTree()}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-8">
                             <div className="w-24 h-24 bg-muted/20 rounded-[2.5rem] flex items-center justify-center text-muted-foreground/40 shadow-inner">
                                 <Archive size={48} strokeWidth={1} />
                             </div>
                             <div className="space-y-3">
                                 <h2 className="text-2xl font-black uppercase tracking-tighter">Nexus Disconnected</h2>
                                 <p className="text-[11px] font-bold text-muted-foreground/60 px-10 leading-relaxed uppercase tracking-wider">Initialize knowledge bridge via System_Infrastructure.</p>
                             </div>
                             <Button onClick={() => navigate('/settings')} className="font-black uppercase tracking-widest text-[10px] py-8 px-12 rounded-2xl shadow-xl">
                                 Configure_Protocol
                             </Button>
                         </div>
                    )
                ) : loadingNote ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
                        <RefreshCw className="animate-spin text-primary/20" size={48} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse">Synthesizing_Knowledge</span>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {isEditing ? (
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="flex-1 w-full bg-muted/5 p-6 font-mono text-sm leading-relaxed focus:outline-none resize-none"
                                spellCheck={false}
                                placeholder="Knowledge stream..."
                                autoFocus
                            />
                        ) : (
                            <div className="flex-1 h-full overflow-hidden flex flex-col bg-background">
                                {selectedPath && selectedPath.toLowerCase().endsWith('.pdf') ? (
                                    <PdfViewer path={selectedPath} isDarkMode={config?.theme === 'dark'} />
                                ) : (
                                    <ScrollArea className="flex-1 h-full">
                                        <div className="max-w-[800px] mx-auto w-full px-5 pt-4 pb-20">
                                            <div className="flex flex-col gap-4 mb-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] whitespace-nowrap">Manuscript_v1.0</span>
                                                        <div className="h-px flex-1 bg-border/10" />
                                                    </div>
                                                    <h1 className="text-2xl font-black text-foreground tracking-tighter leading-tight uppercase">
                                                        {selectedPath?.split('/').pop()?.replace('.md', '').replace('.pdf', '')}
                                                    </h1>
                                                </div>

                                                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                                                    <MetadataAction />
                                                    <EditAction />
                                                    <DeleteAction />
                                                    
                                                    {(() => {
                                                        const metadata = noteMetadata || {};
                                                        const rawSource = metadata.source || metadata.Source;
                                                        let pages: number[] = [];
                                                        const rawPages = metadata.source_pages || metadata.occurrence || metadata.Occurrence || metadata.source_page || metadata.Source_Page;

                                                        if (Array.isArray(rawPages)) {
                                                            pages = rawPages.map(Number).filter(p => !isNaN(p));
                                                        } else if (typeof rawPages === 'number') {
                                                            pages = [rawPages];
                                                        } else if (typeof rawPages === 'string') {
                                                            pages = rawPages.split(',').map(p => Number(p.trim())).filter(p => !isNaN(p));
                                                        }

                                                        if (rawSource) {
                                                            const sourceStr = Array.isArray(rawSource) ? String(rawSource[0]) : String(rawSource);
                                                            const match = sourceStr.match(/\[\[(.*?)\]\]/);
                                                            const cleanPath = match ? match[1] : sourceStr;

                                                            if (cleanPath) {
                                                                return (
                                                                    <button
                                                                        onClick={() => handleWikiLinkClick(cleanPath, pages[0] || 1, pages)}
                                                                        className="flex items-center justify-center h-11 px-6 bg-primary text-primary-foreground rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                                                                    >
                                                                        <FileText size={16} className="mr-2" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                                            PDF {pages[0] ? `(P.${pages[0]})` : ''}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </div>

                                            {isPropertiesOpen && (
                                                <div className="mb-6 border border-border/40 rounded-2xl overflow-hidden bg-muted/5 animate-in fade-in slide-in-from-top-2">
                                                    <div className="bg-muted/10 px-4 py-2 border-b border-border/40 flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Note_Properties</span>
                                                        <Button variant="ghost" size="icon" onClick={() => setIsPropertiesOpen(false)} className="h-6 w-6 rounded-md opacity-40">
                                                            <X size={12} />
                                                        </Button>
                                                    </div>
                                                    <div className="p-1">
                                                        <NoteProperties metadata={noteMetadata} onNavigate={handleWikiLinkClick} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="prose prose-neutral dark:prose-invert max-w-none prose-sm sm:prose-base">
                                                <MarkdownViewer content={noteContent} onNavigate={handleWikiLinkClick} path={selectedPath || undefined} />
                                            </div>
                                            
                                            <div className="mt-8">
                                                <Backlinks backlinks={backlinks} onNavigate={handleWikiLinkClick} />
                                            </div>
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        )  }
                    </div>
                )}
            </main>

            {/* Connections/Hub Drawer */}
            <Sheet open={isConnectionsOpen} onOpenChange={setIsConnectionsOpen}>
                <SheetContent side="right" className="w-[85%] p-0">
                    <SheetHeader className="p-8 border-b border-border/50">
                        <SheetTitle className="text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
                            <Network size={20} className="text-primary" /> Topology_Index
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-full">
                        {hubConnections ? (
                            <HubConnectionsNav content={hubConnections} activePath={selectedPath} onNavigate={(path) => {
                                setIsConnectionsOpen(false)
                                handleWikiLinkClick(path)
                            }} />
                        ) : (
                            <div className="py-40 text-center px-10 opacity-10">
                                <Network size={64} className="mx-auto mb-8" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No_Anchored_Topologies</p>
                            </div>
                        )}
                        <div className="h-40" />
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    )
}
