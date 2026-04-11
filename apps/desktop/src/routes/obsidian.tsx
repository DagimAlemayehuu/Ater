import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Send, Bot, User, Trash2, ShieldCheck, RefreshCw, 
    Sparkles, Paperclip, FileText, Folder, ChevronRight, 
    Search, LayoutGrid, BrainCircuit, X, Zap, Activity, 
    PauseCircle, ListChecks, Archive, Terminal, Database,
    ChevronDown, Info, PanelLeft, Layout, FolderOpen
} from 'lucide-react'
import { sidecarApi, ObsidianFile } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { useLocation, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface InboxFile {
    name: string
    path: string
}

interface FileNode {
    name: string
    path: string
    isFolder: boolean
    children?: FileNode[]
}

function NoteProperties({ metadata }: { metadata: Record<string, any> }) {
    if (!metadata || Object.keys(metadata).length === 0) return null
    
    return (
        <div className="mb-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <Database size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Properties</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-1 border-b border-border/20 last:border-0">
                        <span className="text-[10px] font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-[11px] font-semibold truncate max-w-[150px]">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ObsidianVaultPage() {
    const { config, saveConfig } = useConfig()
    const location = useLocation()
    const navigate = useNavigate()
    
    // --- Layout State ---
    const [showArchitect, setShowArchitect] = useState(false)

    // --- Vault Explorer State ---
    const [files, setFiles] = useState<ObsidianFile[]>([])
    const [loadingFiles, setLoadingFiles] = useState(false)
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [noteMetadata, setNoteMetadata] = useState<Record<string, any>>({})
    const [noteContent, setNoteContent] = useState('')
    const [loadingNote, setLoadingNote] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

    // --- OKA Agent State ---
    const [queueStatus, setQueueStatus] = useState<any>(null)
    const [inboxFiles, setInboxFiles] = useState<InboxFile[]>([])
    const [loadingInbox, setLoadingInbox] = useState(false)
    const [selectedInboxFile, setSelectedInboxFile] = useState<InboxFile | null>(null)
    const [processing, setProcessing] = useState(false)
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [planData, setPlanData] = useState<any | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
    const [currentBatch, setCurrentBatch] = useState<number>(0)
    const [totalBatches, setTotalBatches] = useState<number>(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [batchFeed, setBatchFeed] = useState<any[]>([])
    const [okaError, setOkaError] = useState<string | null>(null)

    // --- Sync & Polling ---
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const initSearch = searchParams.get('search')
        const initPath = searchParams.get('path')
        
        if (initPath) {
            selectFile(initPath)
            
            // Expand parent folders
            const parts = initPath.split('/')
            const newExpanded = new Set(expandedFolders)
            let current = ''
            parts.slice(0, -1).forEach(part => {
                current = current ? `${current}/${part}` : part
                newExpanded.add(current)
            })
            setExpandedFolders(newExpanded)
        } else if (initSearch) {
            setSearchQuery(initSearch)
        }
    }, [location.search])

    useEffect(() => {
        fetchFiles()
        fetchStatus()
        fetchInbox()
        
        // Polling for realtime sync
        const interval = setInterval(() => {
            fetchFiles()
            fetchStatus()
        }, 5000)
        
        return () => clearInterval(interval)
    }, [config?.obsidianVaultPath])

    // --- Actions ---
    const fetchFiles = async () => {
        setLoadingFiles(true)
        try {
            const res = await sidecarApi.listObsidianFiles()
            setFiles(res.files || [])
        } catch (err) {
            console.error('Failed to fetch obsidian files:', err)
        } finally {
            setLoadingFiles(false)
        }
    }

    const fetchStatus = async () => {
        try {
            const res = await sidecarApi.okaQueueStatus()
            setQueueStatus(res)
        } catch (err) { console.error(err) }
    }

    const fetchInbox = async () => {
        setLoadingInbox(true)
        try {
            const res = await sidecarApi.okaListInbox()
            setInboxFiles(res.files || [])
        } finally { setLoadingInbox(false) }
    }

    const selectFile = async (path: string) => {
        setSelectedPath(path)
        setLoadingNote(true)
        try {
            const res = await sidecarApi.readObsidianNote(path)
            setNoteMetadata(res.metadata || {})
            setNoteContent(res.content || '')
        } catch (err) {
            console.error('Failed to read note:', err)
            setNoteMetadata({})
            setNoteContent('# Error\nFailed to load content.')
        } finally { setLoadingNote(false) }
    }

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(path)) newExpanded.delete(path)
        else newExpanded.add(path)
        setExpandedFolders(newExpanded)
    }

    const toggleAutoDeploy = async () => {
        await saveConfig({ autoDeploy: !config?.autoDeploy })
        await sidecarApi.okaWatcherToggle()
        fetchStatus()
    }

    const resetOkaSession = () => {
        setSessionId(null)
        setIsAwaitingConfirmation(false)
        setIsCompleted(false)
        setActivePlan(null)
        setPlanData(null)
        setBatchFeed([])
        setSelectedInboxFile(null)
        setOkaError(null)
        fetchInbox()
    }

    const processSelectedFile = async () => {
        if (!selectedInboxFile) return
        setProcessing(true)
        setOkaError(null)
        setActivePlan(null)
        setBatchFeed([])
        setIsCompleted(false)
        setIsAwaitingConfirmation(false)
        
        try {
            const res = await sidecarApi.okaProcess({ file_path: selectedInboxFile.path })
            setActivePlan(res.plan_raw)
            setPlanData(res.plan_structured)
            setSessionId(res.session_id)
            setIsAwaitingConfirmation(true)
            setTotalBatches(res.plan_structured?.batches?.length || 1)
            setCurrentBatch(0)
        } catch (err: any) {
            setOkaError(err.message || 'Workflow failed')
        } finally { setProcessing(false) }
    }

    const confirmDeployment = async () => {
        if (!sessionId) return
        setProcessing(true)
        try {
            let currentHasMore = true
            let tempBatch = 0
            while (currentHasMore) {
                const res = await sidecarApi.okaConfirm({ session_id: sessionId })
                tempBatch = res.current_batch || (tempBatch + 1)
                setCurrentBatch(tempBatch)
                setBatchFeed(prev => [...prev, { batch: tempBatch, results: res.results }])
                currentHasMore = res.has_more
                if (currentHasMore) await new Promise(r => setTimeout(r, 2000))
            }
            setIsCompleted(true)
            setIsAwaitingConfirmation(false)
            fetchFiles() // Refresh explorer
        } catch (err: any) { setOkaError(err.message) }
        finally { setProcessing(false) }
    }

    // --- Tree Construction ---
    const fileTree = useMemo(() => {
        const root: FileNode[] = []
        
        files.forEach(file => {
            const parts = file.path.split('/')
            let currentLevel = root
            
            parts.forEach((part: string, index: number) => {
                const isLast = index === parts.length - 1
                const currentPath = parts.slice(0, index + 1).join('/')
                
                let existing = currentLevel.find(node => node.name === part)
                
                if (!existing) {
                    const isFolder = !isLast || file.is_dir
                    existing = {
                        name: part,
                        path: currentPath,
                        isFolder: isFolder,
                        children: isFolder ? [] : undefined
                    }
                    currentLevel.push(existing)
                }
                
                if (!isLast && existing.children) {
                    currentLevel = existing.children
                }
            })
        })

        const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1
                if (!a.isFolder && b.isFolder) return 1
                return a.name.localeCompare(b.name)
            })
            nodes.forEach(node => {
                if (node.children) sortNodes(node.children)
            })
        }
        
        sortNodes(root)
        return root
    }, [files])

    const matchesSearch = (node: FileNode, query: string): boolean => {
        if (!query) return true
        if (node.path.toLowerCase().includes(query.toLowerCase())) return true
        if (node.children) {
            return node.children.some(child => matchesSearch(child, query))
        }
        return false
    }

    const renderTree = (nodes: FileNode[], level = 0) => {
        return nodes
            .filter(node => matchesSearch(node, searchQuery))
            .map(node => {
                const isExpanded = expandedFolders.has(node.path) || (searchQuery !== '' && matchesSearch(node, searchQuery))
                const isSelected = selectedPath === node.path
                
                return (
                    <div key={node.path} className="flex flex-col">
                        <div 
                            onClick={() => node.isFolder ? toggleFolder(node.path) : selectFile(node.path)}
                            className={cn(
                                "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer text-xs transition-colors",
                                isSelected ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                                level > 0 && "ml-4"
                            )}
                        >
                            {node.isFolder ? (
                                <>
                                    <ChevronRight size={14} className={cn("transition-transform shrink-0", isExpanded && "rotate-90")} />
                                    <Folder size={14} className={cn("shrink-0", isSelected ? "text-primary-foreground" : "text-primary/70")} />
                                </>
                            ) : (
                                <FileText size={14} className="shrink-0 ml-5" />
                            )}
                            <span className="truncate">{node.name}</span>
                        </div>
                        {node.isFolder && isExpanded && node.children && (
                            <div className="border-l border-border/50 ml-3 mt-0.5">
                                {renderTree(node.children, level + 1)}
                            </div>
                        )}
                    </div>
                )
            })
    }

    return (
        <div className="h-full flex flex-col w-full mx-auto animate-in fade-in duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Obsidian</h2>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Local Knowledge Vault</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowArchitect(!showArchitect)}
                        className={cn("h-8 text-[10px] font-bold uppercase", showArchitect ? "bg-primary/10 text-primary" : "text-muted-foreground")}
                    >
                        <BrainCircuit size={14} className="mr-2" />
                        {showArchitect ? "Hide Architect" : "Open Architect"}
                    </Button>
                    <div className="h-4 w-[1px] bg-border mx-1" />
                    <Button variant="outline" size="sm" onClick={fetchFiles} className="h-8 text-[10px] font-bold uppercase">
                        <RefreshCw size={14} className={cn("mr-2", loadingFiles && "animate-spin")} /> Sync
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Vault Explorer */}
                <div className="w-[280px] flex flex-col border-r bg-muted/5 shrink-0 overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filter vault..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 rounded-md border bg-background pl-8 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-3 space-y-0.5">
                            {files.length > 0 ? renderTree(fileTree) : (
                                <div className="py-10 text-center opacity-20">
                                    <Database size={24} className="mx-auto mb-2" />
                                    <p className="text-[10px] font-bold uppercase">Vault Empty</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Center: Viewer / Editor */}
                <div className="flex-1 flex flex-col overflow-hidden bg-background">
                    {!selectedPath ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 gap-4">
                            <Layout size={64} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-widest">Select an asset to visualize</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in fade-in duration-300">
                            <div className="px-6 py-3 border-b bg-muted/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="w-4 h-4 text-primary opacity-70" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold truncate text-foreground">{selectedPath.split('/').pop()}</span>
                                        <span className="text-[9px] text-muted-foreground truncate uppercase">{selectedPath}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedPath(null)}
                                    className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            
                            <ScrollArea className="flex-1">
                                <div className="max-w-3xl mx-auto px-8 py-12">
                                    {loadingNote ? (
                                        <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
                                            <RefreshCw size={24} className="animate-spin text-primary" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Deciphering...</p>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in duration-500">
                                            <NoteProperties metadata={noteMetadata} />
                                            <div className="prose prose-sm dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:leading-relaxed max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {noteContent}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                {/* Right: OKA Architect (Collapsible Panel) */}
                {showArchitect && (
                    <div className="w-[400px] border-l bg-card flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-300">
                        <div className="p-4 border-b bg-muted/10 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <BrainCircuit size={16} className="text-primary" />
                                <h3 className="text-xs font-bold uppercase tracking-wider">Knowledge Architect</h3>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded border">
                                <span className="text-[8px] font-bold uppercase text-muted-foreground">Auto</span>
                                <button 
                                    onClick={toggleAutoDeploy}
                                    className={cn("relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out", config?.autoDeploy ? 'bg-primary' : 'bg-muted')}
                                >
                                    <span className={cn("pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-3.5' : 'translate-x-0')} />
                                </button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-6">
                                {/* Pipeline Status */}
                                <div className="rounded-lg border bg-background p-4 shadow-sm">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Pipeline</h4>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", queueStatus?.status !== 'idle' ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                                            <span className="text-[10px] font-bold uppercase">{queueStatus?.status || 'Idle'}</span>
                                        </div>
                                        <span className="text-[9px] font-medium text-muted-foreground">{queueStatus?.pending_count || 0} Pending</span>
                                    </div>
                                    {queueStatus?.status !== 'idle' && (
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] text-muted-foreground truncate">{queueStatus?.current_file}</p>
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(queueStatus?.current_batch / (queueStatus?.total_batches || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Inbox Section */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inbox</h4>
                                    <div className="grid gap-1.5">
                                        {inboxFiles.length > 0 ? inboxFiles.map(f => (
                                            <div 
                                                key={f.path} 
                                                onClick={() => { setSelectedInboxFile(f); setOkaError(null); setActivePlan(null); setIsAwaitingConfirmation(false); }}
                                                className={cn(
                                                    "p-2.5 rounded-md border text-[10px] cursor-pointer transition-all", 
                                                    selectedInboxFile?.path === f.path ? "bg-primary/5 border-primary/30" : "bg-background hover:bg-muted/50 border-transparent"
                                                )}
                                            >
                                                <p className="font-bold truncate">{f.name}</p>
                                                <p className="opacity-50 truncate">{f.path}</p>
                                            </div>
                                        )) : (
                                            <div className="py-8 text-center border border-dashed rounded-lg opacity-20">
                                                <Archive size={20} className="mx-auto mb-1" />
                                                <p className="text-[9px] font-bold uppercase">Inbox Empty</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Workspace Area */}
                                {selectedInboxFile && (
                                    <div className="pt-4 border-t space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary">Active Analysis</h4>
                                            <button onClick={resetOkaSession} className="text-[9px] font-bold text-muted-foreground hover:text-foreground">Reset</button>
                                        </div>
                                        
                                        {!activePlan && !processing && (
                                            <Button onClick={processSelectedFile} className="w-full h-8 text-[10px] font-bold uppercase">
                                                <Zap size={12} className="mr-2" /> Analyze Document
                                            </Button>
                                        )}

                                        {processing && (
                                            <div className="py-10 text-center space-y-3">
                                                <RefreshCw size={24} className="animate-spin mx-auto text-primary opacity-50" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Architecting...</p>
                                            </div>
                                        )}

                                        {activePlan && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                                                    <Sparkles size={12} className="text-primary animate-pulse" />
                                                    <p className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">Architectural Plan</p>
                                                </div>
                                                
                                                {/* Clean Text-based Plan Output */}
                                                <div className="p-4 rounded-xl bg-card border shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar">
                                                    <div className="prose prose-xs dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {activePlan}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>

                                                {isAwaitingConfirmation && (
                                                    <Button onClick={confirmDeployment} className="w-full h-10 text-[10px] font-bold uppercase bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 tracking-widest">
                                                        <ShieldCheck size={14} className="mr-2" /> Start Deployment
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {batchFeed.length > 0 && (
                                            <div className="space-y-3 pt-4 border-t">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-bold uppercase">Deploy Progress</span>
                                                    <span className="text-[9px] font-bold">{currentBatch} / {totalBatches} Batches</span>
                                                </div>
                                                <div className="space-y-3">
                                                    {batchFeed.map(b => (
                                                        <div key={b.batch} className="space-y-1.5">
                                                            <div className="flex items-center gap-2 py-1">
                                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                                                    <span className="text-[8px] font-bold text-primary">{b.batch}</span>
                                                                </div>
                                                                <span className="text-[9px] font-bold uppercase text-primary">Batch {b.batch} Deployed</span>
                                                            </div>
                                                            {b.results.map((r: any, idx: number) => (
                                                                <div key={`${b.batch}-${idx}`} className="p-2.5 border rounded-md bg-background space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText size={10} className="text-primary opacity-50 shrink-0" />
                                                                        <span className="text-[10px] font-semibold truncate">{r.title}</span>
                                                                        <span className="ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r.status || 'created'}</span>
                                                                    </div>
                                                                    {r.path && (
                                                                        <p className="text-[8px] text-muted-foreground font-mono truncate pl-5">{r.path}</p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {okaError && (
                                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-[10px] font-mono text-destructive">
                                                {okaError}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    )
}
