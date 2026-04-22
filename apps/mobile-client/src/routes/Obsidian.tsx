import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Send, Bot, User, Trash2, ShieldCheck, RefreshCw, 
    Sparkles, Paperclip, FileText, Folder, ChevronRight, 
    Search, LayoutGrid, BrainCircuit, X, Zap, Activity, 
    PauseCircle, ListChecks, Archive, Terminal, Database,
    ChevronDown, ChevronUp, Maximize2, Minimize2, Info, PanelLeft, Layout, FolderOpen,
    Plus, ChevronLeft, GraduationCap, Calendar, Building, Circle, Users, Settings, Network,
    Edit3, Save, MoreVertical, Menu
} from 'lucide-react'
import { sidecarApi, ObsidianFile } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownViewer } from '@/components/obsidian/MarkdownViewer'
import { NoteProperties, HubConnectionsNav } from '@/components/obsidian/NoteMetadata'
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from '@/components/ui/sheet'
import React from 'react'

export default function ObsidianVaultPage() {
    const { config } = useConfig()
    const location = useLocation()
    const navigate = useNavigate()
    
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

    // --- Mobile Drawers ---
    const [isExplorerOpen, setIsExplorerOpen] = useState(false)
    const [isConnectionsOpen, setIsConnectionsOpen] = useState(false)

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

    const selectFile = async (path: string) => {
        setSelectedPath(path)
        setLoadingNote(true)
        setIsExplorerOpen(false)
        setIsConnectionsOpen(false)

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

    const handleSaveNote = async () => {
        if (!selectedPath) return
        setLoadingNote(true)
        try {
            await sidecarApi.updateObsidianNote(selectedPath, editedContent)
            setNoteContent(editedContent)
            setIsEditing(false)
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

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-hidden">
            {/* Context Toolbar */}
            <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsExplorerOpen(true)}>
                        <Menu size={20} />
                    </Button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary truncate max-w-[120px]">
                        {selectedPath ? selectedPath.split('/').pop() : 'VAULT_EXPLORER'}
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setIsConnectionsOpen(true)}>
                        <Network size={18} />
                    </Button>
                    {selectedPath && (
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? <X size={18} /> : <Edit3 size={18} />}
                        </Button>
                    )}
                    {isEditing && (
                        <Button variant="ghost" size="icon" onClick={handleSaveNote} className="text-primary">
                            <Save size={18} />
                        </Button>
                    )}
                </div>
            </div>

            <main className="flex-1 relative overflow-hidden flex flex-col">
                {!selectedPath ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-muted/20 rounded-3xl flex items-center justify-center text-muted-foreground animate-pulse">
                            <Archive size={40} strokeWidth={1} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-tighter">No Manuscript Selected</h2>
                            <p className="text-xs text-muted-foreground px-10">Initialize selection via the system registry.</p>
                        </div>
                        <Button onClick={() => setIsExplorerOpen(true)} className="px-10 font-bold uppercase tracking-widest text-xs py-6 shadow-xl">
                            Open Explorer
                        </Button>
                    </div>
                ) : loadingNote ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <RefreshCw className="animate-spin text-primary" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Knowledge...</span>
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
                                <ScrollArea className="flex-1">
                                    <div className="max-w-3xl mx-auto px-6 pt-10 pb-40">
                                        <NoteProperties metadata={noteMetadata} onNavigate={selectFile} />
                                        <MarkdownViewer content={noteContent} onNavigate={selectFile} path={selectedPath} />
                                    </div>
                                </ScrollArea>
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

            {/* Connections/Hub Drawer */}
            <Sheet open={isConnectionsOpen} onOpenChange={setIsConnectionsOpen}>
                <SheetContent side="right" className="p-0">
                    <SheetHeader className="p-6 border-b border-border/50">
                        <SheetTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <Network size={16} /> Connections
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-full">
                        <div className="p-4">
                            {hubConnections ? (
                                <HubConnectionsNav content={hubConnections} activePath={selectedPath} onNavigate={selectFile} />
                            ) : (
                                <div className="py-20 text-center px-10">
                                    <Network size={32} className="mx-auto text-muted-foreground/20 mb-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-relaxed">No Relational Hub Anchored to this Manuscript.</p>
                                </div>
                            )}
                        </div>
                        <div className="h-40" />
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    )
}
