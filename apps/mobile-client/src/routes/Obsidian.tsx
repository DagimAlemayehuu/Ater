import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Menu, Search, FileText, ChevronRight, Folder, 
    Save, Edit3, X, Network, Archive, RefreshCw, FolderOpen, Database,
    Send, Bot, User, Trash2, ShieldCheck, 
    Sparkles, Paperclip, ChevronDown, ChevronUp, Maximize2, Minimize2, Info, PanelLeft, Layout,
    Plus, ChevronLeft, GraduationCap, Calendar, Building, Circle, Users, Settings, BrainCircuit, Zap, Activity, PauseCircle, ListChecks, Terminal,
    MoreVertical, ArrowRight
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

    // --- Mobile Drawers ---
    const [isExplorerOpen, setIsExplorerOpen] = useState(false)
    const [isConnectionsOpen, setIsConnectionsOpen] = useState(false)
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
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

    const handleNewFile = async () => {
        const name = prompt("Enter file name (without extension):")
        if (!name) return
        
        let parentDir = ""
        if (selectedPath && selectedPath.includes('/')) {
            parentDir = selectedPath.substring(0, selectedPath.lastIndexOf('/'))
        }
        
        const path = parentDir ? `${parentDir}/${name}.md` : `${name}.md`
        const content = `---\ntitle: ${name}\ncreated: ${new Date().toISOString()}\n---\n\n# ${name}\n`
        
        try {
            await sidecarApi.updateObsidianNote(path, content)
            await fetchFiles()
            selectFile(path)
            window.dispatchEvent(new CustomEvent('vault-updated'))
        } catch (e) {
            alert("Failed to create file")
        }
    }

    const handleDeleteFile = async () => {
        if (!selectedPath) return
        if (!confirm(`Are you sure you want to delete ${selectedPath.split('/').pop()}?`)) return
        
        try {
            await sidecarApi.deleteObsidianItem(selectedPath)
            await fetchFiles()
            
            // Remove from history
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

    const handlePickFolder = async () => {
        console.log("[Obsidian] Folder picker initiated");
        try {
            const res = await (sidecarApi as any).pickVaultFolder()
            if (res.success) {
                fetchFiles()
            }
        } catch (err) {
            console.error('Failed to pick folder:', err)
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
                                    "flex items-center gap-3 py-3 px-4 border-b border-border/10 transition-all",
                                    selectedPath === file.path ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/30"
                                )}
                            >
                                <div className="text-muted-foreground">
                                    {file.is_dir ? <Folder size={18} className={cn(isExpanded && "fill-current text-primary/20")} /> : <FileText size={18} />}
                                </div>
                                <span className={cn("truncate text-sm flex-1", selectedPath === file.path ? "font-bold text-primary" : "text-primary/80")}>
                                    {name}
                                </span>
                                {file.is_dir && <ChevronRight size={14} className={cn("text-muted-foreground transition-transform", isExpanded && "rotate-90")} />}
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

    const [activeTab, setActiveTab] = useState<'manuscripts' | 'databases'>('manuscripts')
    const [databases, setDatabases] = useState<any[]>([])
    const [selectedDb, setSelectedDb] = useState<any | null>(null)
    const [dbUnits, setDbUnits] = useState<any[]>([])
    const [dbStats, setDbStats] = useState<any>(null)
    const [loadingDb, setLoadingDb] = useState(false)

    useEffect(() => {
        if (activeTab === 'databases') loadDatabases()
    }, [activeTab])

    const loadDatabases = async () => {
        setLoadingDb(true)
        try {
            const res = await sidecarApi.listVaultDatabases()
            setDatabases(res.databases)
        } catch (err) {
            console.error("DB Load Fail", err)
        } finally {
            setLoadingDb(false)
        }
    }

    const selectDatabase = (db: any) => {
        navigate(`/databases/${db.id}`)
    }

    // --- Context Toolbar - Only show if note or DB detail is active ---
    const showToolbar = selectedPath || selectedDb;

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-hidden">
            {showToolbar && (
                <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedPath(null); setSelectedDb(null); }}>
                            <ChevronLeft size={20} />
                        </Button>
                        <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" onClick={handleBack} disabled={historyIndex <= 0} className="w-8 h-8 opacity-50 disabled:opacity-10">
                                <ChevronLeft size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleForward} disabled={historyIndex >= history.length - 1} className="w-8 h-8 opacity-50 disabled:opacity-10">
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                        <div className="h-4 w-px bg-border mx-1" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-primary truncate max-w-[100px]">
                            {selectedPath ? selectedPath.split('/').pop() : selectedDb?.title}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {selectedPath && (
                            <>
                                <Button variant="ghost" size="icon" onClick={() => setIsConnectionsOpen(true)}>
                                    <Network size={18} />
                                </Button>
                                {!selectedPath.toLowerCase().endsWith('.pdf') && (
                                    <>
                                        <Button variant="ghost" size="icon" onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}>
                                            <Info size={18} className={cn(isPropertiesOpen && "text-primary")} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                                            {isEditing ? <X size={18} /> : <Edit3 size={18} />}
                                        </Button>
                                    </>
                                )}
                                {isEditing ? (
                                    <Button variant="ghost" size="icon" onClick={handleSaveNote} className="text-primary">
                                        <Save size={18} />
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={handleDeleteFile} className="text-destructive/60 hover:text-destructive">
                                        <Trash2 size={18} />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            <main className="flex-1 relative overflow-hidden flex flex-col pt-safe">
                {!selectedPath && !selectedDb ? (
                    config?.obsidianVaultPath ? (
                        <div className="flex-1 flex flex-col h-full bg-background animate-in fade-in duration-700">
                            {/* Compact Registry Header */}
                            <div className="p-6 pb-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h1 className="text-2xl font-black uppercase tracking-tighter">Registry</h1>
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">Knowledge_Index</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={handleNewFile} className="bg-primary/5 hover:bg-primary/10 text-primary rounded-xl">
                                            <Plus size={20} />
                                        </Button>
                                        <Database size={16} className="text-primary/20" />
                                    </div>
                                </div>

                                <VaultStatsBar />

                                {/* Tab Switcher */}
                                <div className="flex p-1 bg-muted/20 rounded-xl border border-border/40">
                                    <button 
                                        onClick={() => setActiveTab('manuscripts')}
                                        className={cn(
                                            "flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                            activeTab === 'manuscripts' ? "bg-background text-primary shadow-sm" : "text-muted-foreground/60"
                                        )}
                                    >
                                        Manuscripts
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('databases')}
                                        className={cn(
                                            "flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                            activeTab === 'databases' ? "bg-background text-primary shadow-sm" : "text-muted-foreground/60"
                                        )}
                                    >
                                        Databases
                                    </button>
                                </div>

                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={12} />
                                    <input 
                                        placeholder={activeTab === 'manuscripts' ? "Filter manuscripts..." : "Search databases..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-muted/10 border border-border/40 p-3 pl-9 text-[11px] font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/20 uppercase tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden relative">
                                <ScrollArea className="h-full px-4 pt-2 pb-40">
                                    {activeTab === 'manuscripts' ? (
                                        loadingFiles && files.length === 0 ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                                                <RefreshCw className="animate-spin mb-4" size={32} />
                                                <span className="text-[8px] font-black uppercase tracking-[0.4em]">Mapping_Index</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-1 pb-40">
                                                {renderFileTree()}
                                            </div>
                                        )
                                    ) : (
                                        <div className="space-y-3 pb-40">
                                            {databases.map(db => (
                                                <button 
                                                    key={db.id}
                                                    onClick={() => selectDatabase(db)}
                                                    className="w-full p-6 bg-muted/5 border border-border/40 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                                                >
                                                    <div className="flex flex-col text-left gap-1">
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Database</span>
                                                        <span className="text-xs font-black uppercase tracking-tight text-primary">{db.title}</span>
                                                    </div>
                                                    <ChevronRight size={16} className="text-muted-foreground/20 group-hover:text-primary transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-muted/20 rounded-[2.5rem] flex items-center justify-center text-muted-foreground/40 shadow-inner">
                                <Archive size={48} strokeWidth={1} />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Nexus Disconnected</h2>
                                <p className="text-[11px] font-bold text-muted-foreground/60 px-10 leading-relaxed uppercase tracking-wider">Initialize knowledge bridge via System_Infrastructure.</p>
                            </div>
                            <div className="flex flex-col w-full gap-4 px-6 pt-6">
                                <Button onClick={() => navigate('/settings')} className="w-full font-black uppercase tracking-widest text-[10px] py-8 rounded-2xl shadow-xl">
                                    Configure_Protocol
                                </Button>
                            </div>
                        </div>
                    )
                ) : loadingNote ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <RefreshCw className="animate-spin text-primary/20" size={40} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Syncing Knowledge...</span>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {isEditing ? (
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="flex-1 w-full bg-muted/5 p-6 font-mono text-sm leading-relaxed focus:outline-none resize-none"
                                spellCheck={false}
                            />
                        ) : (
                            <div className="flex-1 h-full overflow-hidden flex flex-col">
                                {selectedPath && selectedPath.toLowerCase().endsWith('.pdf') ? (
                                    <PdfViewer path={selectedPath} isDarkMode={config?.theme === 'dark'} />
                                ) : (
                                    <div className="flex-1 h-full overflow-hidden">
                                        <MarkdownViewer content={noteContent} onNavigate={selectFile} path={selectedPath || undefined} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Explorer Drawer */}
            <Sheet open={isExplorerOpen} onOpenChange={setIsExplorerOpen}>
                <SheetContent side="left" className="p-0">
                    <SheetHeader className="p-6 border-b border-border/50">
                        <SheetTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <Archive size={16} /> Registry
                        </SheetTitle>
                    </SheetHeader>
                    <div className="p-4 border-b border-border/50">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input 
                                placeholder="Filter Knowledge..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-muted/40 border border-border p-3 pl-10 text-xs font-bold rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>
                    <ScrollArea className="h-full">
                        {loadingFiles ? (
                             <div className="p-10 text-center animate-pulse text-[10px] font-bold uppercase tracking-widest opacity-50">Syncing Registry...</div>
                        ) : renderFileTree()}
                        <div className="h-40" />
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Properties Drawer */}
            <Sheet open={isPropertiesOpen} onOpenChange={setIsPropertiesOpen}>
                <SheetContent side="bottom" className="h-[75vh] rounded-t-[2.5rem] p-0 border-t-4 border-primary/20">
                    <SheetHeader className="p-6 border-b border-border/50">
                        <SheetTitle className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
                            <Info size={16} /> Manuscript_Properties
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-full p-8">
                        <NoteProperties metadata={noteMetadata} onNavigate={(path) => {
                            setIsPropertiesOpen(false)
                            selectFile(path)
                        }} />
                        <Backlinks backlinks={backlinks} onNavigate={(path) => {
                            setIsPropertiesOpen(false)
                            selectFile(path)
                        }} />
                        <div className="h-40" />
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Connections/Hub Drawer */}
            <Sheet open={isConnectionsOpen} onOpenChange={setIsConnectionsOpen}>
                <SheetContent side="right" className="w-[85%] p-0">
                    <SheetHeader className="p-6 border-b border-border/50">
                        <SheetTitle className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
                            <Network size={16} /> Topology_Index
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-full">
                        {hubConnections ? (
                            <HubConnectionsNav content={hubConnections} activePath={selectedPath} onNavigate={(path) => {
                                setIsConnectionsOpen(false)
                                selectFile(path)
                            }} />
                        ) : (
                            <div className="py-40 text-center px-10 opacity-20">
                                <Network size={48} className="mx-auto mb-6" />
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
