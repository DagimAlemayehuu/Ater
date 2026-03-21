import { useState, useEffect } from 'react'
import { 
    ShieldCheck, RefreshCw, 
    FileText, Play, Activity, 
    CheckCircle2, Zap, AlertCircle, Inbox, FileSearch, X,
    Brain, ArrowLeft, Bot, Sparkles, ChevronRight, ListChecks,
    CheckCheck, Archive, PauseCircle, PlayCircle,
    Database, Calendar, GraduationCap, Coins, Dumbbell, Lock, Eye, Terminal
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface OkaResult {
    title: string
    path: string
    status: 'created' | 'updated' | 'moved'
    uid: string
}

interface InboxFile {
    name: string
    path: string
    size: number
    suffix: string
}

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
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <h2 className="text-2xl font-bold tracking-tight uppercase">Orchestrator Console</h2>
                        </div>
                        <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">Master Workforce Control</p>
                    </div>
                </div>
                <button 
                  onClick={() => navigate('/chat')}
                  className="px-6 py-2 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center gap-2 shadow-lg"
                >
                    <Zap size={14} /> Open Console
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden flex-1">
                <div className="md:col-span-2 flex flex-col gap-6 overflow-hidden">
                    {/* Active Prompt & Target */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles size={16} /> Current Objective
                        </h3>
                        <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                            <p className="text-sm font-bold text-foreground italic">
                                {loading ? "Fetching active objective..." : (status?.current_prompt || "No active prompt. Standby for instruction.")}
                            </p>
                        </div>
                    </div>

                    {/* Master Strategic Plan */}
                    <div className="flex-1 rounded-xl border bg-card p-6 shadow-sm overflow-hidden flex flex-col">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ListChecks size={16} /> Strategic Plan Execution
                        </h3>
                        <div className="flex-1 bg-muted/10 rounded-xl p-6 overflow-y-auto custom-scrollbar border prose prose-sm dark:prose-invert max-w-none">
                            {status?.current_plan ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{status.current_plan}</ReactMarkdown>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <Archive size={48} className="mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting plan generation</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 overflow-hidden">
                    {/* Execution State */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-4">Execution State</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl border bg-foreground text-background">
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-70">Stage</p>
                                    <p className="text-sm font-bold uppercase tracking-tight">{status?.stage || 'IDLE'}</p>
                                </div>
                                <Activity className="animate-pulse" size={20} />
                            </div>
                            
                             <div className="p-4 rounded-xl border bg-muted/10">
                                 <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Active Specialist</p>
                                 <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                                     <span className="text-sm font-bold uppercase">{status?.active_agents?.[0] || 'NONE'}</span>
                                 </div>
                             </div>

                            <div className="p-4 rounded-xl border bg-muted/10 opacity-50">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Next in Queue</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold uppercase">{status?.next_agent || 'NONE'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* System Trace */}
                     <div className="flex-1 rounded-xl border bg-card flex flex-col overflow-hidden shadow-sm">
                         <div className="p-4 border-b bg-muted/5 flex items-center justify-between">
                             <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ListChecks size={12} /> Executive Logs
                             </h3>
                             <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                         </div>
                         <div className="flex-1 bg-black p-4 font-mono text-[10px] text-white/50 overflow-y-auto custom-scrollbar leading-relaxed">
                             {(status?.logs || []).map((log: string, i: number) => (
                                 <div key={i} className="flex gap-2 mb-1.5 border-b border-white/[0.03] pb-1.5 last:border-0 uppercase italic">
                                     <span className="text-white/10 shrink-0">[{i.toString().padStart(2, '0')}]</span>
                                     <span className="break-all">{log}</span>
                                 </div>
                             ))}
                             <div className="flex items-center gap-2 mt-2">
                                 <span className="text-foreground animate-pulse font-black text-xs">&gt;</span>
                                 <div className="h-1.5 w-8 bg-foreground/20 rounded animate-pulse" />
                             </div>
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
             setResponse(`Error executing query: ${err.message}`)
        } finally {
             setLoading(false)
        }
    }

    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm mt-6 mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Terminal size={16} /> {title} Interface
            </h3>
            <div className="flex gap-4">
               <input 
                   type="text" 
                   value={query}
                   onChange={e => setQuery(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleExecute()}
                   placeholder={`Instruct ${title}...`}
                   className="flex-1 bg-background border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
               />
               <button 
                   onClick={handleExecute} 
                   disabled={loading || !query}
                   className="px-6 py-2 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest hover:bg-foreground/90 transition-all disabled:opacity-50"
               >
                   {loading ? 'Executing...' : 'Execute'}
               </button>
            </div>
            {response && (
                <div className="mt-4 p-4 border rounded-xl bg-muted/20 text-sm overflow-auto max-h-[300px] prose prose-sm dark:prose-invert max-w-none">
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
                setDbs(res.databases || [])
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
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            <h2 className="text-2xl font-bold tracking-tight uppercase">Librarian Hub</h2>
                        </div>
                        <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">Notion Registry Management</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.syncNotionMirror() } catch(e) {}
                  }}
                  className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Manual Mirror Sync
                </button>
            </div>

            <AgentConsole agentName="librarian" title="Librarian" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                {[
                    { label: 'Databases', val: dbs.length.toString(), icon: ListChecks },
                    { label: 'Records Indexed', val: '---', icon: Database },
                    { label: 'Property Errors', val: '0', icon: ShieldCheck },
                    { label: 'Uptime', val: '99.9%', icon: Activity }
                ].map((stat, i) => (
                    <div key={i} className="rounded-xl border p-4 bg-card shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mb-1">{stat.label}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-bold tracking-tighter">{stat.val}</p>
                            <stat.icon size={16} className="text-muted-foreground/30" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-muted/5 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest">Active Databases</h3>
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", loading ? "bg-muted" : "bg-foreground animate-pulse")} />
                        <span className="text-[10px] font-black uppercase text-muted-foreground">{loading ? "Fetching..." : "Connected"}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-16 rounded-xl border bg-muted/10 animate-pulse" />
                        ))
                    ) : dbs.length > 0 ? (
                        dbs.map(db => (
                            <div key={db.id} className="p-4 rounded-xl border bg-background hover:bg-muted/30 transition-all flex items-center justify-between cursor-pointer group">
                               <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-black text-xs uppercase">
                                       {db.title?.[0]?.plain_text?.[0] || '?' }
                                   </div>
                                   <div>
                                       <p className="text-sm font-bold">{db.title?.[0]?.plain_text || 'Untitled'}</p>
                                       <p className="text-[10px] text-muted-foreground uppercase font-black truncate max-w-[200px]">ID: {db.id}</p>
                                   </div>
                               </div>
                               <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                        ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 font-black uppercase text-[10px]">
                        No databases found or insufficient permissions
                      </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ─── Scribe Dashboard ─── */
function ScribeDashboard({ onBack }: { onBack: () => void }) {
    const [files, setFiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await sidecarApi.listObsidianFiles()
                setFiles(res.files || [])
            } catch (err) {
                console.error("Scribe fetch failed", err)
            } finally {
                setLoading(false)
            }
        }
        fetchFiles()
    }, [])

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <h2 className="text-2xl font-bold tracking-tight uppercase">Scribe Console</h2>
                        </div>
                        <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">Vault Architecture & Indexing</p>
                    </div>
                </div>
            </div>

            <AgentConsole agentName="scribe" title="Scribe" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border p-4 bg-card">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Vault Inventory</p>
                    <p className="text-xl font-bold tracking-tighter">{files.length} Assets</p>
                </div>
                <div className="rounded-xl border p-4 bg-card">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Mirror Status</p>
                    <p className="text-xl font-bold tracking-tighter">Synced</p>
                </div>
                <div className="rounded-xl border p-4 bg-card">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Last Update</p>
                    <p className="text-xl font-bold tracking-tighter">Real-time</p>
                </div>
            </div>

            <div className="shrink-0 flex items-center justify-between p-6 border rounded-xl bg-card">
                <div>
                   <h3 className="text-xs font-black uppercase tracking-widest mb-1">Manual Asset Sync</h3>
                   <p className="text-[10px] text-muted-foreground uppercase">Force re-indexing of the knowledge vault</p>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.ragSyncVault() } catch(e) {}
                      setTimeout(() => setLoading(false), 2000)
                  }}
                  className="px-6 py-2 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/80 transition-all flex items-center gap-2"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Trigger Vault Scan
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col rounded-xl border bg-card">
                <div className="p-4 border-b bg-muted/5 font-black text-[10px] uppercase tracking-widest">Recent Modifications</div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-12 bg-muted/10 rounded-lg animate-pulse" />
                        ))
                    ) : files.slice(0, 10).map((f, i) => (
                        <div key={i} className="p-3 border rounded-lg bg-background flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold truncate max-w-[300px]">{f.name}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">{f.path}</span>
                            </div>
                            <span className="text-[9px] font-black uppercase bg-muted px-2 py-0.5 rounded">Indexed</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ─── Chronos Dashboard ─── */
function ChronosDashboard({ onBack }: { onBack: () => void }) {
    const [status, setStatus] = useState<any>(null)

    useEffect(() => {
        sidecarApi.getChronosStatus().then(setStatus)
    }, [])

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden text-foreground">
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-foreground">
                            <Calendar className="w-5 h-5" />
                            <h2 className="text-2xl font-bold tracking-tight uppercase">Chronos Registry</h2>
                        </div>
                        <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">Unified Timeline Management</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      try { await sidecarApi.syncNotionMirror() } catch(e) {}
                  }}
                  className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <RefreshCw size={12} /> Sync Primary Timeline
                </button>
            </div>

            <AgentConsole agentName="chronos" title="Chronos" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="rounded-xl border bg-card p-6 flex flex-col gap-6">
                    <h3 className="text-sm font-black uppercase tracking-widest border-b pb-4">Connection Status</h3>
                    <div className="space-y-4">
                        {status?.channels?.map((c: any) => (
                            <div key={c.name} className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                                <div>
                                    <p className="text-xs font-black uppercase">{c.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{c.last_sync}</p>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-foreground text-background text-[9px] font-black uppercase">{c.status}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border bg-black text-white p-6 flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest border-b border-white/10 pb-4">Daily Velocity</h3>
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <div className="text-6xl font-black tracking-tighter mb-2">84%</div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Efficiency Index</p>
                    </div>
                    <div className="mt-auto grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                        <div className="text-center">
                            <p className="text-[8px] font-black uppercase opacity-40 mb-1">Focus</p>
                            <p className="text-sm font-bold tracking-tight">6.2h</p>
                        </div>
                        <div className="text-center border-x border-white/10">
                            <p className="text-[8px] font-black uppercase opacity-40 mb-1">Rest</p>
                            <p className="text-sm font-bold tracking-tight">7.4h</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black uppercase opacity-40 mb-1">Admin</p>
                            <p className="text-sm font-bold tracking-tight">1.5h</p>
                        </div>
                    </div>
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
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            <h2 className="text-2xl font-bold tracking-tight uppercase">Scholar Research</h2>
                        </div>
                        <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">Academic Synthesis Engine</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.ragSyncVault() } catch(e) {}
                      setTimeout(() => setLoading(false), 2000)
                  }}
                  className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <Zap size={12} className={loading ? "animate-pulse" : ""} /> Force Indexer
                </button>
            </div>

            <AgentConsole agentName="scholar" title="Scholar" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-1 border rounded-xl bg-card p-6 flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4">Research Feed</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="h-10 bg-muted/10 rounded animate-pulse" />
                            ))
                        ) : data?.research_feed?.map((doc: any, i: number) => (
                            <div key={i} className="p-3 border rounded-lg bg-background flex items-center justify-between">
                                <span className="text-xs font-bold truncate max-w-[150px]">{doc.name}</span>
                                <span className="text-[8px] font-black uppercase bg-muted px-2 py-0.5 rounded">{doc.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 rounded-xl border bg-black text-white p-8 flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-12 h-12 mb-6 opacity-20" />
                    <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Synthesis Pulse</h3>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest max-w-xs">
                        High-density extraction active for academic vault sectors
                    </p>
                    <div className="mt-8 grid grid-cols-2 gap-8 w-full max-w-sm">
                        <div>
                            <p className="text-3xl font-black">{data?.synthesis_metrics?.synthesized || 0}</p>
                            <p className="text-[8px] font-black uppercase opacity-40">Notes Generated</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black">{data?.synthesis_metrics?.total_papers || 0}</p>
                            <p className="text-[8px] font-black uppercase opacity-40">Papers Indexed</p>
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
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5" />
                            <h2 className="text-2xl font-bold tracking-tight uppercase">Wealth Console</h2>
                        </div>
                        <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">Financial Audit & Alignment</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.syncNotionMirror() } catch(e) {}
                      setTimeout(() => setLoading(false), 2000)
                  }}
                  className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Audit Mirror
                </button>
            </div>

            <AgentConsole agentName="wealth" title="Wealth Strategist" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Net Position', val: data?.net_position || '---' },
                    { label: 'Growth Delta', val: data?.monthly_delta || '---' },
                    { label: 'Savings Rate', val: data?.savings_rate || '---' },
                    { label: 'Burn Rate', val: data?.burn_rate || '---' }
                ].map((s, i) => (
                    <div key={i} className="rounded-xl border p-4 bg-card">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{s.label}</p>
                        <p className="text-xl font-bold tracking-tighter">{loading ? '...' : s.val}</p>
                    </div>
                ))}
            </div>

            <div className="flex-1 rounded-xl border bg-card overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-muted/5 font-black text-[10px] uppercase tracking-widest">Recent Transactions</div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {(data?.recent_transactions || []).map((t: any, i: number) => (
                        <div key={i} className="p-4 border-b last:border-0 flex items-center justify-between hover:bg-muted/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-mono text-muted-foreground">{t.date}</span>
                                <span className="text-sm font-bold uppercase">{t.desc}</span>
                            </div>
                            <span className="text-sm font-black">{t.amount}</span>
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
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Dumbbell className="w-5 h-5" />
                            <h2 className="text-2xl font-bold tracking-tight uppercase">Coach Dashboard</h2>
                        </div>
                        <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">Biometric Performance Tracking</p>
                    </div>
                </div>
                <button 
                  onClick={async () => {
                      setLoading(true)
                      try { await sidecarApi.syncNotionMirror() } catch(e) {}
                      setTimeout(() => setLoading(false), 2000)
                  }}
                  className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Activity Sync
                </button>
            </div>

            <AgentConsole agentName="gym" title="Gym Coach" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 rounded-xl border bg-card p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6">Physique Delta</h3>
                    <div className="space-y-6 flex-1">
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Training Consistency</p>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-foreground" style={{ width: data?.training_intensity || '0%' }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Weekly Volume</p>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-foreground" style={{ width: data?.volume_accumulation || '0%' }} />
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border bg-black text-white text-center">
                            <p className="text-[10px] font-black uppercase opacity-60 mb-1">Status</p>
                            <p className="text-lg font-bold uppercase tracking-tight">{data?.recovery_status || 'RECOVERING'}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 rounded-xl border bg-card overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-muted/5 font-black text-[10px] uppercase tracking-widest">Exercise History</div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {(data?.recent_sessions || []).map((s: any, i: number) => (
                            <div key={i} className="p-4 border-b last:border-0 flex items-center justify-between hover:bg-muted/5 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold uppercase">{s.name}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground">{s.date}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase bg-muted px-2 py-1 rounded">{s.volume}</span>
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
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            <h2 className="text-2xl font-bold tracking-tight uppercase">DevOps Monitor</h2>
                        </div>
                        <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">System Health & Security</p>
                    </div>
                </div>
            </div>

            <AgentConsole agentName="devops" title="DevOps Guardian" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'System Uptime', val: '99.99%', icon: Activity },
                    { label: 'RAG Latency', val: '24ms', icon: RefreshCw },
                    { label: 'Agent Health', val: 'Stable', icon: ShieldCheck },
                    { label: 'Index Coverage', val: (sync?.total || 0).toString(), icon: Database }
                ].map((s, i) => (
                    <div key={i} className="rounded-xl border p-4 bg-card shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground mb-1">{s.label}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-bold tracking-tighter">{s.val}</p>
                            <s.icon size={16} className="text-muted-foreground/30" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 rounded-xl border bg-card p-8 flex flex-col gap-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b pb-4">RAG Indexing Pipeline</h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase mb-1">
                          <span>{sync?.message || 'Standby'}</span>
                          <span>{sync?.progress || 0} / {sync?.total || 0} Assets</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden border">
                          <div 
                              className="h-full bg-foreground transition-all duration-1000 ease-in-out" 
                              style={{ width: `${sync?.total > 0 ? (sync.progress / sync.total) * 100 : 0}%` }}
                          />
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border bg-muted/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Background Services</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-tight">Oka Watcher</span>
                                <span className="text-[9px] font-black uppercase text-foreground">Live</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-tight">RAG Indexer</span>
                                <span className="text-[9px] font-black uppercase text-foreground">Live</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border bg-muted/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50">Vault Integrity</h4>
                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-tight">Permissions</span>
                                <span className="text-[9px] font-black uppercase">Verified</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-tight">Disk Space</span>
                                <span className="text-[9px] font-black uppercase">42GB Free</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── OKA Agent Dashboard (Unified) ─── */
function OkaAgent({ onBack }: { onBack: () => void }) {
    const { config, saveConfig } = useConfig()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('status')
    const [queueStatus, setQueueStatus] = useState<any>(null)
    const [inboxFiles, setInboxFiles] = useState<InboxFile[]>([])
    const [loadingInbox, setLoadingInbox] = useState(false)
    const [selectedInboxFile, setSelectedInboxFile] = useState<InboxFile | null>(null)
    const [processing, setProcessing] = useState(false)
    const [previewResults, setPreviewResults] = useState<OkaResult[]>([])
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
    const [currentBatch, setCurrentBatch] = useState<number>(0)
    const [totalBatches, setTotalBatches] = useState<number>(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [batchFeed, setBatchFeed] = useState<any[]>([])
    const [generatedFiles, setGeneratedFiles] = useState<any[]>([])
    const [loadingGenerated, setLoadingGenerated] = useState(false)
    const [okaError, setOkaError] = useState<string | null>(null)

    useEffect(() => {
        let interval: any
        fetchStatus()
        interval = setInterval(fetchStatus, 3000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (activeTab === 'not_generated') fetchInbox()
        if (activeTab === 'generated') fetchGenerated()
    }, [activeTab])

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

    const fetchGenerated = async () => {
        setLoadingGenerated(true)
        try {
            const res = await sidecarApi.okaListGenerated()
            setGeneratedFiles(res.files || [])
        } finally { setLoadingGenerated(false) }
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
        setBatchFeed([])
        setPreviewResults([])
        setSelectedInboxFile(null)
        setOkaError(null)
        fetchInbox()
    }

    const processSelectedFile = async () => {
        if (!selectedInboxFile) return
        setProcessing(true)
        setOkaError(null)
        try {
            const res = await sidecarApi.okaProcess({ file_path: selectedInboxFile.path })
            setActivePlan(res.plan_raw)
            setSessionId(res.session_id)
            setIsAwaitingConfirmation(true)
            setTotalBatches(res.plan_structured?.batches?.length || 1)
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

    const handleOpenGenerated = (file: any) => {
        const name = file.name?.replace('.md', '')
        navigate(`/obsidian?search=${encodeURIComponent(name || '')}`)
    }

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between border-b pb-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5" />
                                <h2 className="text-2xl font-bold tracking-tight uppercase">OKA Sentinel</h2>
                            </div>
                            <p className="text-muted-foreground text-xs font-black tracking-widest mt-0.5">Obsidian Knowledge Architect</p>
                        </div>
                    </div>
                    <TabsList className="grid w-[400px] grid-cols-3">
                        <TabsTrigger value="status" className="text-[10px] font-black uppercase tracking-widest">Status</TabsTrigger>
                        <TabsTrigger value="not_generated" className="text-[10px] font-black uppercase tracking-widest">Inbox</TabsTrigger>
                        <TabsTrigger value="generated" className="text-[10px] font-black uppercase tracking-widest">Vault</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0 mt-6 overflow-hidden">
                    <TabsContent value="status" className="h-full m-0 overflow-y-auto custom-scrollbar space-y-6">
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-muted rounded-xl">
                                        {config?.autoDeploy ? <Activity className="animate-pulse" /> : <PauseCircle />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold uppercase tracking-tight">Automation Engine</h3>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">{config?.autoDeploy ? "RUNNING" : "STOPPED"}</p>
                                    </div>
                                </div>
                                <button onClick={toggleAutoDeploy} className="px-6 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl">
                                    {config?.autoDeploy ? "Disable" : "Enable"} Auto-Ingest
                                </button>
                            </div>
                            {queueStatus?.status !== 'idle' ? (
                                <div className="p-6 border rounded-xl bg-muted/5">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Active File</p>
                                    <p className="text-sm font-bold truncate mb-4">{queueStatus?.current_file || 'Processing...'}</p>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-foreground" style={{ width: `${(queueStatus?.current_batch / queueStatus?.total_batches) * 100}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 border-2 border-dashed rounded-xl text-center opacity-30">
                                    <Bot className="mx-auto mb-2" size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting local events</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="not_generated" className="h-full m-0 flex gap-6 overflow-hidden">
                        <div className="w-1/3 flex flex-col gap-4 overflow-hidden">
                            <div className="flex-1 border rounded-xl bg-card overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {inboxFiles.map(f => (
                                    <div 
                                        key={f.path} 
                                        onClick={() => setSelectedInboxFile(f)}
                                        className={cn("p-4 border rounded-xl cursor-pointer transition-all", selectedInboxFile?.path === f.path ? "bg-foreground text-background" : "bg-background hover:bg-muted/50")}
                                    >
                                        <p className="text-xs font-bold truncate">{f.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                            <div className="p-6 border rounded-xl bg-card shadow-sm flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest">
                                    {selectedInboxFile?.name || 'Manual Processor'}
                                </h3>
                                {selectedInboxFile && !isAwaitingConfirmation && !isCompleted && (
                                    <button onClick={processSelectedFile} disabled={processing} className="px-6 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl">
                                        {processing ? 'Architecting...' : 'Start Ingest'}
                                    </button>
                                )}
                                {isAwaitingConfirmation && (
                                    <button onClick={confirmDeployment} disabled={processing} className="px-6 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2">
                                        <ShieldCheck size={14} /> Confirm Plan
                                    </button>
                                )}
                                {isCompleted && (
                                    <button onClick={resetOkaSession} className="px-6 py-2 bg-muted text-foreground text-[10px] font-black uppercase tracking-widest rounded-xl">
                                        Reset
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 border rounded-xl bg-card overflow-y-auto custom-scrollbar p-6">
                                {activePlan && !batchFeed.length && (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{activePlan}</ReactMarkdown>
                                    </div>
                                )}
                                {batchFeed.map(b => (
                                    <div key={b.batch} className="mb-4 p-4 border rounded-xl bg-muted/5">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Batch {b.batch}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {b.results.map((r: any, i: number) => (
                                                <div key={i} className="p-2 border rounded bg-background text-[10px] font-bold truncate">{r.title}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {okaError && <div className="text-red-500 font-mono text-xs">{okaError}</div>}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="generated" className="h-full m-0 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            {generatedFiles.map(f => (
                                <div key={f.path} onClick={() => handleOpenGenerated(f)} className="p-4 border rounded-xl bg-card hover:bg-muted/30 cursor-pointer flex items-center justify-between">
                                    <span className="text-xs font-bold truncate">{f.name}</span>
                                    <ChevronRight size={14} />
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function FileCheck(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="m9 15 2 2 4-4" />
        </svg>
    )
}

/* ─── Main Agents Hub ─── */
export default function Agents() {
    const { config, saveConfig } = useConfig()
    const [activeAgent, setActiveAgent] = useState<string | null>(null)
    const navigate = useNavigate()

    const workforce = [
        {
            id: 'orchestrator',
            title: 'Orchestrator',
            icon: Zap,
            color: 'text-background',
            bg: 'bg-foreground',
            description: 'The master planner and executive workforce manager. Coordinates all specialized agents to execute complex life workflows.',
            action: () => setActiveAgent('orchestrator'),
            actionText: 'View Dashboard'
        },
        {
            id: 'oka',
            title: 'OKA Sentinel',
            icon: Brain,
            color: 'text-foreground border',
            bg: 'bg-muted/50',
            description: 'Obsidian Knowledge Architect. Automates the ingestion of academic documents into atomic knowledge clusters.',
            action: () => setActiveAgent('oka'),
            actionText: 'Open Dashboard'
        },
        {
            id: 'librarian',
            title: 'Librarian',
            icon: Database,
            color: 'text-foreground border',
            bg: 'bg-muted/50',
            description: 'Registry and metadata manager. Synchronizes with Notion, handles database operations, and maintains relational integrity.',
            action: () => setActiveAgent('librarian'),
            actionText: 'Open Hub'
        },
        {
            id: 'scribe',
            title: 'Scribe',
            icon: FileText,
            color: 'text-foreground border',
            bg: 'bg-muted/50',
            description: 'The master of notation. Navigates your vault, creates atomic notes, and manages structural organization of knowledge.',
            action: () => setActiveAgent('scribe'),
            actionText: 'View Vault'
        },
        {
            id: 'chronos',
            title: 'Chronos',
            icon: Calendar,
            color: 'text-foreground border',
            bg: 'bg-muted/50',
            description: 'Unified time management. Synchronizes Google Calendar, Notion databases, and vault dates into a single timeline.',
            action: () => setActiveAgent('chronos'),
            actionText: 'Active'
        },
        {
            id: 'scholar',
            title: 'Scholar',
            icon: GraduationCap,
            color: 'text-foreground border',
            bg: 'bg-muted/50',
            description: 'Research and synthesis engine. Summarizes complex PDFs, technical documents, and academic papers into your research bank.',
            action: () => setActiveAgent('scholar'),
            actionText: 'Ready'
        },
        {
            id: 'wealth',
            title: 'Wealth Strategist',
            icon: Coins,
            color: 'text-foreground border',
            bg: 'bg-muted/50',
            description: 'Financial auditor. Tracks income, expenses, and budgets across Notion databases to ensure economic alignment.',
            action: () => setActiveAgent('wealth'),
            actionText: 'Auditing'
        },
        {
            id: 'gym',
            title: 'Gym Coach',
            icon: Dumbbell,
            color: 'text-foreground border',
            bg: 'bg-muted/50',
            description: 'Performance and health optimization. Monitors workout logs, nutrition, and physical metrics from fitness trackers.',
            action: () => setActiveAgent('gym'),
            actionText: 'Tracking'
        },
        {
            id: 'devops',
            title: 'DevOps',
            icon: Lock,
            color: 'text-foreground border',
            bg: 'bg-muted/50',
            description: 'System integrity and security. Monitors RAG index health, manages background processes, and protects the monorepo.',
            action: () => setActiveAgent('devops'),
            actionText: 'Healthy'
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
                return <OkaAgent onBack={() => setActiveAgent(null)} />
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
                    <h2 className="text-2xl font-black tracking-tight uppercase">Agent Workforce Registry</h2>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-0.5">Deployment Control for Specialized Autonomous Units</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-10">
                {workforce.map((agent) => (
                    <div 
                        key={agent.id}
                        onClick={agent.action}
                        className="group relative flex flex-col p-6 rounded-2xl border bg-card hover:bg-muted/30 hover:border-foreground/20 transition-all cursor-pointer shadow-sm hover:shadow-md overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn("p-3 rounded-xl transition-all duration-300", agent.bg, agent.color, `group-hover:scale-110`)}>
                                <agent.icon className="w-6 h-6" />
                            </div>
                            {agent.id === 'oka' && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-background border px-2 py-1 rounded-full z-10" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">Auto</span>
                                        <button 
                                            onClick={toggleAutoDeploy}
                                            className={cn("relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none", config?.autoDeploy ? 'bg-foreground' : 'bg-muted')}
                                        >
                                            <span className={cn("pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-3' : 'translate-x-0')} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <h3 className="text-lg font-black tracking-tight mb-2 uppercase flex items-center gap-2">
                            {agent.title}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-medium">
                            {agent.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                <Activity className="w-3.5 h-3.5" />
                                {agent.actionText}
                            </div>
                            <div className={cn("text-[10px] font-black uppercase tracking-widest group-hover:underline text-foreground")}>
                                Inspect Unit
                            </div>
                        </div>

                        <agent.icon className="absolute -right-4 -top-4 w-24 h-24 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform" />
                    </div>
                ))}
            </div>
        </div>
    )
}
