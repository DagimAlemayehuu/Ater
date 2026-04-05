import { useState, useEffect } from 'react'
import { 
    ShieldCheck, RefreshCw, 
    FileText, Activity, 
    Zap, Archive, PauseCircle,
    Brain, ArrowLeft, Bot, Sparkles, ChevronRight, ListChecks,
    Database, Calendar, GraduationCap, Coins, Dumbbell, Lock, Terminal,
    UserCheck, Search, X, Info, Shield, Check, Save, MessageSquare, Layout, Clock, Plus, ExternalLink, Battery, BrainCircuit
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

/* ─── Orchestrator Dashboard (The Planner) ─── */
function OrchestratorDashboard({ onBack }: { onBack: () => void }) {
    const navigate = useNavigate()
    const [status, setStatus] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await sidecarApi.getOrchestratorStatus()
                setStatus(res)
            } catch (err) {
                console.error("Orchestrator status failed", err)
            } finally {
                setLoading(false)
            }
        }
        fetchStatus()
        const itv = setInterval(fetchStatus, 3000)
        return () => clearInterval(itv)
    }, [])

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <h2 className="text-xl font-bold tracking-tight">Orchestrator Console</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Master Agent Control</p>
                    </div>
                </div>
                <button 
                  onClick={() => navigate('/chat')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                >
                    <Zap size={14} /> Open Console
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden flex-1">
                <div className="md:col-span-2 flex flex-col gap-6 overflow-hidden">
                    {/* Active Prompt & Target */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-muted-foreground">
                            <Sparkles size={14} /> Current Objective
                        </h3>
                        <div className="p-4 bg-muted/30 rounded-md border border-dashed">
                            <p className="text-sm font-medium text-foreground">
                                {loading ? "Fetching active objective..." : (status?.current_prompt || "No active prompt. Standby for instruction.")}
                            </p>
                        </div>
                    </div>

                    {/* Master Strategic Plan */}
                    <div className="flex-1 rounded-lg border bg-card p-6 shadow-sm overflow-hidden flex flex-col">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-muted-foreground">
                            <ListChecks size={14} /> Strategic Plan Execution
                        </h3>
                        <div className="flex-1 bg-muted/10 rounded-md p-6 overflow-y-auto custom-scrollbar border prose prose-sm dark:prose-invert max-w-none">
                            {status?.current_plan ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{status.current_plan}</ReactMarkdown>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <Archive size={40} className="mb-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Awaiting plan generation</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 overflow-hidden">
                    {/* Execution State */}
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-muted-foreground">Execution State</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-md border bg-primary text-primary-foreground">
                                <div>
                                    <p className="text-[10px] font-bold uppercase opacity-70">Stage</p>
                                    <p className="text-sm font-bold">{status?.stage || 'IDLE'}</p>
                                </div>
                                <Activity className="animate-pulse" size={18} />
                            </div>
                            
                             <div className="p-4 rounded-md border bg-muted/30">
                                 <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Active Specialist</p>
                                 <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                     <span className="text-sm font-bold">{status?.active_agents?.[0] || 'NONE'}</span>
                                 </div>
                             </div>

                            <div className="p-4 rounded-md border bg-muted/10 opacity-50">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Next in Queue</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">{status?.next_agent || 'NONE'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* System Trace */}
                     <div className="flex-1 rounded-lg border bg-card flex flex-col overflow-hidden shadow-sm">
                         <div className="p-3 border-b bg-muted/5 flex items-center justify-between">
                             <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <ListChecks size={12} /> Executive Logs
                             </h3>
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         </div>
                         <div className="flex-1 bg-black/95 p-4 font-mono text-[10px] text-white/50 overflow-y-auto custom-scrollbar leading-relaxed">
                             {(status?.logs || []).map((log: string, i: number) => (
                                 <div key={i} className="flex gap-2 mb-1.5 border-b border-white/[0.03] pb-1.5 last:border-0">
                                     <span className="text-white/10 shrink-0">{i.toString().padStart(2, '0')}</span>
                                     <span className="break-all">{log.replace(/\[.*\]\s*/, '')}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    )
}

/* ─── Generic Agent Console ─── */
function AgentConsole({ agentName, title }: { agentName: string, title: string }) {
    const [query, setQuery] = useState('')
    const [response, setResponse] = useState('')
    const [loading, setLoading] = useState(false)

    const handleExecute = async () => {
        if (!query) return
        setLoading(true)
        setResponse('')
        try {
            const res = await sidecarApi.executeAgent(agentName, query)
            setResponse(res.response)
        } catch (err: any) {
             setResponse(`Error: ${err.message}`)
        } finally {
             setLoading(false)
        }
    }

    return (
        <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-muted-foreground">
                <Terminal size={14} /> {title} Interface
            </h3>
            <div className="flex gap-3">
               <input 
                   type="text" 
                   value={query}
                   onChange={e => setQuery(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleExecute()}
                   placeholder={`Instruct ${title}...`}
                   className="flex-1 bg-background border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
               />
               <button 
                   onClick={handleExecute} 
                   disabled={loading || !query}
                   className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
               >
                   {loading ? 'Executing...' : 'Execute'}
               </button>
            </div>
            {response && (
                <div className="mt-4 p-4 border rounded-md bg-muted/20 text-sm overflow-auto max-h-[300px] prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
                </div>
            )}
        </div>
    )
}

/* ─── Librarian Dashboard ─── */
function LibrarianDashboard({ onBack }: { onBack: () => void }) {
    const [loading, setLoading] = useState(true)
    const [dbs, setDbs] = useState<any[]>([])

    useEffect(() => {
        const fetchDbs = async () => {
            try {
                const res = await sidecarApi.listNotionDatabases()
                setDbs(res || [])
            } catch (err) {
                console.error("Failed to fetch databases", err)
            } finally {
                setLoading(false)
            }
        }
        fetchDbs()
    }, [])

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            <h2 className="text-xl font-bold tracking-tight">Librarian Hub</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Notion Registry Management</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.syncNotionMirror() } catch(e) {}
                  }}
                  className="px-4 py-2 border rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync Mirror
                </button>
            </div>

            <AgentConsole agentName="librarian" title="Librarian" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                {[
                    { label: 'Databases', val: dbs.length.toString(), icon: Database },
                    { label: 'Records', val: '---', icon: Database },
                    { label: 'Health', val: 'Optimal', icon: ShieldCheck },
                    { label: 'Uptime', val: '99.9%', icon: Activity }
                ].map((stat, i) => (
                    <div key={i} className="rounded-lg border p-4 bg-card shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold">{stat.val}</p>
                            <stat.icon size={14} className="text-muted-foreground/30" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-lg overflow-hidden shadow-sm">
                <div className="p-3 border-b bg-muted/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Databases</h3>
                    <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", loading ? "bg-muted" : "bg-primary animate-pulse")} />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">{loading ? "Syncing..." : "Connected"}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-14 rounded-md border bg-muted/10 animate-pulse" />
                        ))
                    ) : dbs.length > 0 ? (
                        dbs.map(db => (
                            <div key={db.id} className="p-3 rounded-md border bg-background hover:bg-muted/30 transition-all flex items-center justify-between cursor-pointer group">
                               <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-bold text-xs">
                                       {db.title?.[0]?.plain_text?.[0] || '?' }
                                   </div>
                                   <div>
                                       <p className="text-sm font-bold">{db.title?.[0]?.plain_text || 'Untitled'}</p>
                                       <p className="text-[9px] text-muted-foreground truncate max-w-[180px]">ID: {db.id}</p>
                                   </div>
                               </div>
                               <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                        ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 font-bold uppercase text-[10px]">
                        No databases found
                      </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function NoteProperties({ metadata }: { metadata: Record<string, any> }) {
    if (!metadata || Object.keys(metadata).length === 0) return null
    
    return (
        <div className="mb-6 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Database size={10} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Properties</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-1 border-b border-border/10 last:border-0">
                        <span className="text-[9px] font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] font-semibold truncate max-w-[120px]">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ─── Scribe Dashboard ─── */
function ScribeDashboard({ onBack }: { onBack: () => void }) {
    const { config } = useConfig()
    const [files, setFiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFile, setSelectedFile] = useState<any>(null)
    const [noteMetadata, setNoteMetadata] = useState<Record<string, any>>({})
    const [noteContent, setNoteContent] = useState('')
    const [loadingNote, setLoadingNote] = useState(false)

    const fetchFiles = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.listObsidianFiles()
            setFiles(res.files || [])
        } catch (err) {
            console.error("Scribe fetch failed", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFiles()
    }, [config?.obsidianVaultPath])

    const handleSelectFile = async (file: any) => {
        setSelectedFile(file)
        setLoadingNote(true)
        try {
            const res = await sidecarApi.readObsidianNote(file.path)
            setNoteMetadata(res.metadata || {})
            setNoteContent(res.content || '')
        } catch (err) {
            setNoteMetadata({})
            setNoteContent("Error loading content.")
        } finally {
            setLoadingNote(false)
        }
    }

    const filteredFiles = files.filter(f => 
        !f.is_dir && (
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.path.toLowerCase().includes(searchQuery.toLowerCase())
        )
    )

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <h2 className="text-xl font-bold tracking-tight">Scribe Terminal</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Vault Navigator & Content Strategist</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter vault..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-4 py-1.5 text-xs bg-muted/20 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                    </div>
                    <button 
                        onClick={fetchFiles}
                        className="p-2 border rounded-md hover:bg-muted transition-all"
                        title="Sync Vault"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <AgentConsole agentName="scribe" title="Scribe" />

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {/* File List */}
                <div className="md:col-span-1 flex flex-col border rounded-lg bg-card overflow-hidden shadow-sm">
                    <div className="p-3 border-b bg-muted/5 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vault Index</h3>
                        <span className="text-[10px] font-bold opacity-30">{files.length} Assets</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {loading && files.length === 0 ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-10 rounded-md bg-muted/10 animate-pulse" />
                            ))
                        ) : filteredFiles.slice(0, 100).map((f, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleSelectFile(f)}
                                className={cn(
                                    "p-3 border rounded-md flex flex-col cursor-pointer transition-all",
                                    selectedFile?.path === f.path ? "bg-primary/5 border-primary/30" : "bg-background hover:bg-muted/30 border-transparent"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn("text-xs font-bold truncate max-w-[200px]", selectedFile?.path === f.path ? "text-primary" : "text-foreground")}>
                                        {f.name}
                                    </span>
                                    <ChevronRight size={12} className="text-muted-foreground/30" />
                                </div>
                                <span className="text-[9px] text-muted-foreground uppercase truncate opacity-60">{f.path}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="md:col-span-2 border rounded-lg bg-card overflow-hidden flex flex-col shadow-sm">
                    {!selectedFile ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-3">
                            <FileText size={48} strokeWidth={1} />
                            <p className="text-xs font-bold uppercase tracking-wider">Select an asset to preview</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-in fade-in duration-300">
                            <div className="p-4 border-b bg-muted/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">{selectedFile.name}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase">{selectedFile.path}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedFile(null)}
                                    className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                                {loadingNote ? (
                                    <div className="h-32 flex items-center justify-center">
                                        <RefreshCw size={24} className="animate-spin text-primary opacity-50" />
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in duration-500">
                                        <NoteProperties metadata={noteMetadata} />
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{noteContent}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ─── Obsidian Knowledge Architect (OKA) Dashboard ─── */
function OkaDashboard({ onBack }: { onBack: () => void }) {
    const { config, saveConfig } = useConfig()
    const navigate = useNavigate()
    const [queueStatus, setQueueStatus] = useState<any>(null)
    const [inboxFiles, setInboxFiles] = useState<any[]>([])
    const [loadingInbox, setLoadingInbox] = useState(false)
    const [selectedInboxFile, setSelectedInboxFile] = useState<any>(null)
    const [processing, setProcessing] = useState(false)
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
    const [currentBatch, setCurrentBatch] = useState<number>(0)
    const [totalBatches, setTotalBatches] = useState<number>(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [batchFeed, setBatchFeed] = useState<any[]>([])
    const [okaError, setOkaError] = useState<string | null>(null)

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

    useEffect(() => {
        fetchStatus()
        fetchInbox()
        const itv = setInterval(fetchStatus, 3000)
        return () => clearInterval(itv)
    }, [])

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
        } catch (err: any) { setOkaError(err.message) }
        finally { setProcessing(false) }
    }

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold tracking-tight">Obsidian Knowledge Architect</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Autonomous Ingestion Engine</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-md border">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Auto-Ingest</span>
                        <button 
                            onClick={toggleAutoDeploy}
                            className={cn("relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none", config?.autoDeploy ? 'bg-primary' : 'bg-muted')}
                        >
                            <span className={cn("pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-4' : 'translate-x-0')} />
                        </button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { fetchInbox(); fetchStatus(); }} className="h-8 text-[10px] font-bold uppercase">
                        <RefreshCw size={14} className="mr-2" /> Sync
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="w-[320px] flex flex-col gap-6 shrink-0 overflow-hidden">
                    <div className="rounded-lg border bg-card p-5 shadow-sm shrink-0">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Pipeline Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", queueStatus?.status !== 'idle' ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                                    <span className="text-xs font-bold uppercase">{queueStatus?.status || 'Idle'}</span>
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground">{queueStatus?.pending_count || 0} Pending</span>
                            </div>
                            {queueStatus?.status !== 'idle' && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground truncate">{queueStatus?.current_file}</p>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(queueStatus?.current_batch / (queueStatus?.total_batches || 1)) * 100}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 border rounded-lg bg-card overflow-hidden flex flex-col shadow-sm">
                        <div className="p-3 border-b bg-muted/5 flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inbox</h3>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded">{inboxFiles.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {loadingInbox ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-12 rounded-md bg-muted/10 animate-pulse" />
                                ))
                            ) : inboxFiles.length > 0 ? (
                                inboxFiles.map(f => (
                                    <div 
                                        key={f.path} 
                                        onClick={() => { setSelectedInboxFile(f); setOkaError(null); setActivePlan(null); setIsAwaitingConfirmation(false); }}
                                        className={cn(
                                            "p-3 rounded-md border text-[11px] cursor-pointer transition-all", 
                                            selectedInboxFile?.path === f.path ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background hover:bg-muted/50 border-transparent"
                                        )}
                                    >
                                        <p className="font-bold truncate">{f.name}</p>
                                        <p className="opacity-60 text-[9px] truncate">{f.path}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center opacity-20">
                                    <Archive size={32} className="mx-auto mb-2" />
                                    <p className="text-[10px] font-bold uppercase">Empty Inbox</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col rounded-lg border bg-card shadow-sm overflow-hidden bg-background">
                    <div className="p-4 border-b bg-muted/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-bold truncate">
                                {selectedInboxFile?.name || 'Architect Workspace'}
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {selectedInboxFile && !isAwaitingConfirmation && !isCompleted && (
                                <Button onClick={processSelectedFile} disabled={processing} size="sm" className="h-8 font-bold text-[10px] uppercase">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                    Analyze File
                                </Button>
                            )}
                            {isAwaitingConfirmation && (
                                <Button onClick={confirmDeployment} disabled={processing} size="sm" className="h-8 font-bold text-[10px] uppercase bg-primary hover:opacity-90 shadow-lg shadow-primary/20">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <ShieldCheck className="mr-2" size={12} />}
                                    Confirm Deployment
                                </Button>
                            )}
                            {isCompleted && (
                                <Button onClick={resetOkaSession} variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase">
                                    Reset Workspace
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-8 max-w-4xl mx-auto">
                            {!selectedInboxFile && !processing && (
                                <div className="py-32 flex flex-col items-center justify-center text-center opacity-30">
                                    <BrainCircuit size={64} strokeWidth={1} className="mb-6" />
                                    <h4 className="text-lg font-bold mb-2">Architect Standby</h4>
                                    <p className="text-sm max-w-xs">Select a file from the inbox to begin autonomous knowledge architecture.</p>
                                    <div className="mt-8 flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground bg-muted/20 px-4 py-2 rounded-full border border-dashed">
                                        <Info size={12} />
                                        Deployment Base: {config?.academicFolderPath || '1-Academic'}
                                    </div>
                                </div>
                            )}

                            {processing && !batchFeed.length && !activePlan && (
                                <div className="py-32 flex flex-col items-center justify-center text-center">
                                    <RefreshCw size={48} className="animate-spin text-primary mb-6" />
                                    <h4 className="text-lg font-bold mb-2">Architecting Knowledge...</h4>
                                    <p className="text-sm text-muted-foreground">The AI is analyzing the document structure and creating an atomic integration plan.</p>
                                </div>
                            )}

                            {activePlan && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
                                        <Sparkles size={20} className="text-primary" />
                                        <p className="text-xs font-medium">Plan generated. Review the integration strategy below and confirm deployment.</p>
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{activePlan}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {batchFeed.length > 0 && (
                                <div className="space-y-6 mt-8 pt-8 border-t">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Deployment Progress</h4>
                                        <span className="text-xs font-bold">{currentBatch} / {totalBatches} Batches</span>
                                    </div>
                                    {batchFeed.map(b => (
                                        <div key={b.batch} className="p-6 rounded-lg border bg-muted/5 animate-in fade-in duration-300">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-5 h-5 rounded bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                                    {b.batch}
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Batch Execution Successful</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {b.results.map((r: any, i: number) => (
                                                    <div key={i} className="p-3 border rounded bg-background flex items-center gap-3 shadow-sm">
                                                        <div className="p-1.5 bg-muted rounded">
                                                            <FileText size={12} className="text-muted-foreground" />
                                                        </div>
                                                        <span className="text-[11px] font-medium truncate">{r.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {isCompleted && (
                                        <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                                            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-6">
                                                <ShieldCheck size={32} />
                                            </div>
                                            <h4 className="text-xl font-bold mb-2">Architecture Complete</h4>
                                            <p className="text-sm text-muted-foreground mb-8">All knowledge fragments have been successfully deployed to your vault.</p>
                                            <Button onClick={() => navigate('/obsidian')} variant="secondary" size="sm">
                                                Go to Vault
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {okaError && (
                                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
                                    <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-tighter">
                                        <X size={14} />
                                        Error during architecture
                                    </div>
                                    {okaError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── Chronos Dashboard ─── */
function ChronosDashboard({ onBack }: { onBack: () => void }) {
    const [status, setStatus] = useState<any>(null)
    const [timeline, setTimeline] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [s, t] = await Promise.all([
                sidecarApi.getChronosStatus(),
                sidecarApi.getChronosTimeline()
            ])
            setStatus(s)
            setTimeline(t)
        } catch (err) {
            console.error("Chronos fetch failed", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (e) { return dateStr }
    }

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold tracking-tight">Chronos Registry</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Unified Timeline Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={fetchData}
                      disabled={loading}
                      className="px-4 py-2 border rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-muted transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync Timeline
                    </button>
                    <button 
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 shadow-sm"
                    >
                        <Plus size={12} /> New Event
                    </button>
                </div>
            </div>

            <AgentConsole agentName="chronos" title="Chronos" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                {status?.channels?.map((c: any, i: number) => (
                    <div key={i} className="rounded-lg border p-4 bg-card shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{c.name}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold">{c.status}</p>
                            <div className={cn("w-1.5 h-1.5 rounded-full", c.status === 'Active' || c.status === 'Connected' ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-lg overflow-hidden shadow-sm">
                <div className="p-3 border-b bg-muted/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unified Life-Wide Timeline</h3>
                    <div className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase">{timeline.length} Total Events</div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {loading && timeline.length === 0 ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-16 border-b bg-muted/5 animate-pulse" />
                        ))
                    ) : timeline.length > 0 ? (
                        <div className="divide-y">
                            {timeline.map((event, i) => (
                                <div key={i} className="group p-4 flex items-center justify-between hover:bg-muted/30 transition-all cursor-pointer">
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className={cn(
                                            "w-2 h-10 rounded-full shrink-0",
                                            event.type === 'google' ? "bg-blue-500/50" : "bg-primary/50"
                                        )} />
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{event.title}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                                    <Clock size={10} />
                                                    {formatDate(event.start)}
                                                </div>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground font-bold uppercase tracking-tighter border">
                                                    {event.source}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => event.source_url && window.open(event.source_url, '_blank')}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-muted rounded-md transition-all"
                                    >
                                        <ExternalLink size={14} className="text-muted-foreground" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 py-20">
                            <Calendar size={64} strokeWidth={1} className="mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest">Standby: No Timeline Data Detected</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ─── Scholar Dashboard ─── */
function ScholarDashboard({ onBack }: { onBack: () => void }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await sidecarApi.getScholarStatus()
                setData(res)
            } catch (err) {
                console.error("Failed to fetch scholar status", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            <h2 className="text-xl font-bold tracking-tight">Scholar Research</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Academic Synthesis Engine</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.ragSyncVault() } catch(e) {}
                      setTimeout(() => setLoading(false), 2000)
                  }}
                  className="px-4 py-2 border rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <Zap size={12} className={loading ? "animate-spin" : ""} /> Re-Index
                </button>
            </div>

            <AgentConsole agentName="scholar" title="Scholar" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-1 border rounded-lg bg-card p-6 flex flex-col shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-muted-foreground">Research Feed</h3>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="h-9 bg-muted/10 rounded animate-pulse" />
                            ))
                        ) : data?.research_feed?.map((doc: any, i: number) => (
                            <div key={i} className="p-2.5 border rounded-md bg-background flex items-center justify-between text-xs font-medium">
                                <span className="truncate max-w-[140px]">{doc.name}</span>
                                <span className="text-[8px] font-bold uppercase bg-muted px-2 py-0.5 rounded opacity-70">{doc.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 rounded-lg border bg-foreground text-background p-8 flex flex-col items-center justify-center text-center shadow-lg">
                    <Sparkles className="w-10 h-10 mb-6 opacity-20" />
                    <h3 className="text-xl font-bold mb-2">Synthesis Pulse</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 max-w-xs">
                        High-density extraction active for academic sectors
                    </p>
                    <div className="mt-10 grid grid-cols-2 gap-10 w-full max-w-sm">
                        <div>
                            <p className="text-4xl font-black">{data?.synthesis_metrics?.synthesized || 0}</p>
                            <p className="text-[9px] font-bold uppercase opacity-40">Notes</p>
                        </div>
                        <div>
                            <p className="text-4xl font-black">{data?.synthesis_metrics?.total_papers || 0}</p>
                            <p className="text-[9px] font-bold uppercase opacity-40">Papers</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── Wealth Strategist Dashboard ─── */
function WealthDashboard({ onBack }: { onBack: () => void }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        sidecarApi.getWealthStatus().then(res => {
            setData(res)
            setLoading(false)
        })
    }, [])

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5" />
                            <h2 className="text-xl font-bold tracking-tight">Wealth Console</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Financial Audit & Alignment</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.syncNotionMirror() } catch(e) {}
                      setLoading(false)
                  }}
                  className="px-4 py-2 border rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Audit Mirror
                </button>
            </div>

            <AgentConsole agentName="wealth" title="Wealth Strategist" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Position', val: data?.net_position || '---' },
                    { label: 'Delta', val: data?.monthly_delta || '---' },
                    { label: 'Savings', val: data?.savings_rate || '---' },
                    { label: 'Burn', val: data?.burn_rate || '---' }
                ].map((s, i) => (
                    <div key={i} className="rounded-lg border p-4 bg-card shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{s.label}</p>
                        <p className="text-lg font-bold">{loading ? '...' : s.val}</p>
                    </div>
                ))}
            </div>

            <div className="flex-1 rounded-lg border bg-card overflow-hidden flex flex-col shadow-sm">
                <div className="p-3 border-b bg-muted/5 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Recent Transactions</div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {(data?.recent_transactions || []).map((t: any, i: number) => (
                        <div key={i} className="p-4 border-b last:border-0 flex items-center justify-between hover:bg-muted/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-mono text-muted-foreground">{t.date}</span>
                                <span className="text-sm font-semibold">{t.desc}</span>
                            </div>
                            <span className="text-sm font-bold">{t.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ─── Gym Coach Dashboard ─── */
function GymDashboard({ onBack }: { onBack: () => void }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        sidecarApi.getGymStatus().then(res => {
            setData(res)
            setLoading(false)
        })
    }, [])

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5" />
                            <h2 className="text-xl font-bold tracking-tight">Coach Dashboard</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Performance Tracking</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.syncNotionMirror() } catch(e) {}
                      setLoading(false)
                  }}
                  className="px-4 py-2 border rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync Data
                </button>
            </div>

            <AgentConsole agentName="gym" title="Gym Coach" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
                <div className="md:col-span-1 rounded-lg border bg-card p-6 shadow-sm flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-6 text-muted-foreground">Performance</h3>
                    <div className="space-y-6 flex-1">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Consistency</p>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: data?.training_intensity || '0%' }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Volume</p>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: data?.volume_accumulation || '0%' }} />
                            </div>
                        </div>
                        <div className="p-4 rounded-md border bg-foreground text-background text-center shadow-md">
                            <p className="text-[9px] font-bold uppercase opacity-60 mb-1">Current State</p>
                            <p className="text-md font-bold uppercase">{data?.recovery_status || 'RECOVERING'}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 rounded-lg border bg-card overflow-hidden flex flex-col shadow-sm">
                    <div className="p-3 border-b bg-muted/5 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Activity History</div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {(data?.recent_sessions || []).map((s: any, i: number) => (
                            <div key={i} className="p-4 border-b last:border-0 flex items-center justify-between hover:bg-muted/5 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold">{s.name}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground">{s.date}</span>
                                </div>
                                <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded opacity-70">{s.volume}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── DevOps Dashboard ─── */
function DevOpsDashboard({ onBack }: { onBack: () => void }) {
    const [status, setStatus] = useState<any>(null)
    const [sync, setSync] = useState<any>(null)

    useEffect(() => {
        const fetchStatus = async () => {
            const s = await sidecarApi.getOrchestratorStatus()
            const r = await sidecarApi.ragSyncStatus()
            setStatus(s)
            setSync(r)
        }
        fetchStatus()
        const itv = setInterval(fetchStatus, 5000)
        return () => clearInterval(itv)
    }, [])

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            <h2 className="text-xl font-bold tracking-tight">DevOps Monitor</h2>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">System Health & Security</p>
                    </div>
                </div>
            </div>

            <AgentConsole agentName="devops" title="DevOps Guardian" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Uptime', val: '99.99%', icon: Activity },
                    { label: 'Latency', val: '24ms', icon: RefreshCw },
                    { label: 'Health', val: 'Stable', icon: ShieldCheck },
                    { label: 'Index', val: (sync?.total || 0).toString(), icon: Database }
                ].map((s, i) => (
                    <div key={i} className="rounded-lg border p-4 bg-card shadow-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold">{s.val}</p>
                            <s.icon size={14} className="text-muted-foreground/30" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 rounded-lg border bg-card p-6 flex flex-col gap-8 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4 border-b pb-3 text-muted-foreground">Indexing Pipeline</h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-1">
                          <span>{sync?.message || 'Standby'}</span>
                          <span>{sync?.progress || 0} / {sync?.total || 0}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden border">
                          <div 
                              className="h-full bg-primary transition-all duration-1000" 
                              style={{ width: `${sync?.total > 0 ? (sync.progress / sync.total) * 100 : 0}%` }}
                          />
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 rounded-md border bg-muted/5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-4 opacity-50">Background Services</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">Oka Watcher</span>
                                <span className="text-[10px] font-bold text-primary">Live</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">RAG Indexer</span>
                                <span className="text-[10px] font-bold text-primary">Live</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-md border bg-muted/5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-4 opacity-50">System Integrity</h4>
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">Permissions</span>
                                <span className="text-[10px] font-bold">Verified</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">Disk Space</span>
                                <span className="text-[10px] font-bold">42GB Free</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── Main Agents Hub ─── */
export default function Agents() {
    const { config, saveConfig } = useConfig()
    const [activeAgent, setActiveAgent] = useState<string | null>(null)
    const navigate = useNavigate()

    const agents = [
        {
            id: 'orchestrator',
            title: 'Orchestrator',
            icon: Zap,
            color: 'text-primary-foreground',
            bg: 'bg-primary',
            description: 'The master planner and executive agent manager. Coordinates specialized units to execute complex workflows.',
            action: () => setActiveAgent('orchestrator'),
            actionText: 'Dashboard'
        },
        {
            id: 'oka',
            title: 'Obsidian Knowledge Architect',
            icon: Brain,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'Autonomous ingestion engine. Automates the architectural mapping of documents into atomic knowledge clusters.',
            action: () => setActiveAgent('oka'),
            actionText: 'Architect'
        },
        {
            id: 'librarian',
            title: 'Librarian',
            icon: Database,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'Registry and metadata manager. Synchronizes with Notion and maintains structural relational integrity.',
            action: () => setActiveAgent('librarian'),
            actionText: 'Registry'
        },
        {
            id: 'scribe',
            title: 'Scribe',
            icon: FileText,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'The master of notation. Navigates your vault, creates atomic notes, and manages structural organization.',
            action: () => setActiveAgent('scribe'),
            actionText: 'Vault'
        },
        {
            id: 'chronos',
            title: 'Chronos',
            icon: Calendar,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'Unified time management. Synchronizes calendars and databases into a single life-wide timeline.',
            action: () => setActiveAgent('chronos'),
            actionText: 'Timeline'
        },
        {
            id: 'scholar',
            title: 'Scholar',
            icon: GraduationCap,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'Research engine. Summarizes complex PDFs and academic papers into your central research bank.',
            action: () => setActiveAgent('scholar'),
            actionText: 'Research'
        },
        {
            id: 'wealth',
            title: 'Wealth',
            icon: Coins,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'Financial auditor. Tracks income, expenses, and budgets to ensure long-term economic alignment.',
            action: () => setActiveAgent('wealth'),
            actionText: 'Finance'
        },
        {
            id: 'gym',
            title: 'Gym Coach',
            icon: Dumbbell,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'Performance optimization. Monitors workout logs and physical metrics from fitness trackers.',
            action: () => setActiveAgent('gym'),
            actionText: 'Training'
        },
        {
            id: 'devops',
            title: 'DevOps',
            icon: Lock,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'System integrity and security. Monitors RAG health and protects the internal monorepo.',
            action: () => setActiveAgent('devops'),
            actionText: 'System'
        }
    ]

    const toggleAutoDeploy = async (e: React.MouseEvent) => {
        e.stopPropagation()
        const newVal = !config?.autoDeploy
        await saveConfig({ autoDeploy: newVal })
        try {
            await sidecarApi.okaWatcherToggle()
        } catch(e) { console.error(e) }
    }

    const renderDashboard = () => {
        switch (activeAgent) {
            case 'orchestrator':
                return <OrchestratorDashboard onBack={() => setActiveAgent(null)} />
            case 'oka':
                return <OkaDashboard onBack={() => setActiveAgent(null)} />
            case 'librarian':
                return <LibrarianDashboard onBack={() => setActiveAgent(null)} />
            case 'scribe':
                return <ScribeDashboard onBack={() => setActiveAgent(null)} />
            case 'chronos':
                return <ChronosDashboard onBack={() => setActiveAgent(null)} />
            case 'scholar':
                return <ScholarDashboard onBack={() => setActiveAgent(null)} />
            case 'wealth':
                return <WealthDashboard onBack={() => setActiveAgent(null)} />
            case 'gym':
                return <GymDashboard onBack={() => setActiveAgent(null)} />
            case 'devops':
                return <DevOpsDashboard onBack={() => setActiveAgent(null)} />
            default:
                return null
        }
    }

    if (activeAgent) {
        return renderDashboard()
    }

    return (
        <div className="h-full flex-1 flex flex-col space-y-6 md:flex w-full mx-auto animate-in fade-in duration-300">
            <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Agent Registry</h2>
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-0.5">Control Layer for Specialized Autonomous Units</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2 pb-10">
                {agents.map((agent) => (
                    <div 
                        key={agent.id}
                        onClick={agent.action}
                        className="group relative flex flex-col p-5 rounded-lg border bg-card hover:bg-muted/30 hover:border-primary/20 transition-all cursor-pointer shadow-sm overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn("p-2 rounded-md transition-all duration-300 border", agent.bg, agent.color)}>
                                <agent.icon className="w-5 h-5" />
                            </div>
                            {agent.id === 'oka' && (
                                <div className="flex items-center gap-2 bg-background border px-2 py-1 rounded-md z-10" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground">Auto</span>
                                    <button 
                                        onClick={toggleAutoDeploy}
                                        className={cn("relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none", config?.autoDeploy ? 'bg-primary' : 'bg-muted')}
                                    >
                                        <span className={cn("pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-3.5' : 'translate-x-0')} />
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <h3 className="text-sm font-bold tracking-tight mb-1 flex items-center justify-between">
                            {agent.title}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4 font-medium line-clamp-2">
                            {agent.description}
                        </p>

                        <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-muted-foreground tracking-wider">
                                <Activity className="w-3 h-3" />
                                {agent.actionText}
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-wider group-hover:text-primary transition-colors">
                                Inspect
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
