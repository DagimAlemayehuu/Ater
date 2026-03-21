import { useState, useEffect } from 'react'
import { 
    ShieldCheck, RefreshCw, 
    FileText, Play, Activity, 
    CheckCircle2, Zap, AlertCircle, Inbox, FileSearch, X,
    Brain, ArrowLeft, Bot, Sparkles, ChevronRight, ListChecks,
    CheckCheck, Archive, PauseCircle, PlayCircle
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

/* ─── OKA Agent Dashboard (The specific worker view) ─── */
function OkaAgent({ onBack }: { onBack: () => void }) {
    const { config, saveConfig } = useConfig()
    const navigate = useNavigate()
    
    // --- Tabs State ---
    const [activeTab, setActiveTab] = useState('status')

    // --- Status Tab State ---
    const [queueStatus, setQueueStatus] = useState<any>({ 
        status: 'idle', 
        pending_files: [], 
        pending_count: 0,
        current_file: null,
        current_batch: 0,
        total_batches: 0
    })

    // --- Not Generated (Inbox) State ---
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
    const [hasMoreBatches, setHasMoreBatches] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)
    const [batchFeed, setBatchFeed] = useState<{ batch: number; results: OkaResult[]; count: number }[]>([])
    const [okaError, setOkaError] = useState<string | null>(null)

    // --- Generated State ---
    const [generatedFiles, setGeneratedFiles] = useState<InboxFile[]>([])
    const [loadingGenerated, setLoadingGenerated] = useState(false)

    useEffect(() => {
        let interval: any
        if (activeTab === 'status') {
            fetchStatus()
            interval = setInterval(fetchStatus, 2000)
        } else if (activeTab === 'not_generated') {
            fetchInbox()
            interval = setInterval(fetchInbox, 5000)
        } else if (activeTab === 'generated') {
            fetchGenerated()
            interval = setInterval(fetchGenerated, 5000)
        }
        return () => clearInterval(interval)
    }, [activeTab])

    const fetchStatus = async () => {
        try {
            const res = await sidecarApi.okaQueueStatus()
            setQueueStatus(res)
        } catch (err) {
            console.error('Failed to fetch queue status:', err)
        }
    }

    const fetchInbox = async () => {
        setLoadingInbox(true)
        try {
            const res = await sidecarApi.okaListInbox()
            setInboxFiles(res.files || [])
        } catch (err) {
            console.error('Failed to fetch inbox:', err)
        } finally {
            setLoadingInbox(false)
        }
    }

    const fetchGenerated = async () => {
        setLoadingGenerated(true)
        try {
            const res = await sidecarApi.okaListGenerated()
            setGeneratedFiles(res.files || [])
        } catch (err) {
            console.error('Failed to fetch generated files:', err)
        } finally {
            setLoadingGenerated(false)
        }
    }

    const toggleAutoDeploy = async () => {
        const newVal = !config?.autoDeploy
        await saveConfig({ autoDeploy: newVal })
        try {
            await sidecarApi.okaWatcherToggle()
            fetchStatus()
        } catch(e) { console.error(e) }
    }

    const resetOkaSession = () => {
        setSessionId(null)
        setIsAwaitingConfirmation(false)
        setHasMoreBatches(false)
        setIsCompleted(false)
        setActivePlan(null)
        setCurrentBatch(0)
        setTotalBatches(0)
        setBatchFeed([])
        setPreviewResults([])
        setSelectedInboxFile(null)
        setOkaError(null)
        fetchInbox()
    }

    const processSelectedFile = async () => {
        if (!selectedInboxFile) return

        setProcessing(true)
        setPreviewResults([])
        setActivePlan(null)
        setSessionId(null)
        setIsAwaitingConfirmation(false)
        setIsCompleted(false)
        setBatchFeed([])
        setCurrentBatch(0)
        setOkaError(null)
        try {
            const res = await sidecarApi.okaProcess({ file_path: selectedInboxFile.path })
            setActivePlan(res.plan_raw)
            setSessionId(res.session_id)
            setIsAwaitingConfirmation(true)
            setHasMoreBatches(false)
            const batchCount = res.plan_structured?.batches?.length || 1
            setTotalBatches(batchCount)
        } catch (err: any) {
            console.error('OKA planning failed:', err)
            setOkaError(err.message || 'Failed to generate plan. Check backend logs.')
        } finally {
            setProcessing(false)
        }
    }

    const confirmDeployment = async () => {
        if (!sessionId) return

        setProcessing(true)
        setOkaError(null)
        
        let currentHasMore = true
        let tempBatchCount = currentBatch
        let tempPreviewResults = [...previewResults]
        
        try {
            while (currentHasMore) {
                const command = tempBatchCount === 0 
                    ? "Confirm Final Plan & Proceed Batch 1"
                    : `Proceed Batch ${tempBatchCount + 1}`

                const res = await sidecarApi.okaConfirm({ session_id: sessionId, command })
                const batchNum = res.current_batch ?? (tempBatchCount + 1)
                
                tempBatchCount = batchNum
                setCurrentBatch(batchNum)
                tempPreviewResults = [...tempPreviewResults, ...res.results]
                setPreviewResults(tempPreviewResults)
                setBatchFeed(prev => [...prev, { batch: batchNum, results: res.results, count: res.count }])
                
                currentHasMore = !!res.has_more
                
                if (currentHasMore) {
                    setHasMoreBatches(true)
                    setIsAwaitingConfirmation(false)
                    await new Promise(resolve => setTimeout(resolve, 5000))
                } else {
                    setHasMoreBatches(false)
                    setIsCompleted(true)
                    setIsAwaitingConfirmation(false)
                    setSessionId(null)
                    setTimeout(() => fetchInbox(), 1500)
                }
            }
        } catch (err: any) {
            console.error('OKA confirmation failed:', err)
            setOkaError(err.message || 'Failed to confirm and deploy. Check backend logs.')
        } finally {
            setProcessing(false)
        }
    }

    const handleOpenGenerated = (file: any) => {
        if (file.hub_path) {
            navigate(`/obsidian?path=${encodeURIComponent(file.hub_path)}`)
        } else {
            const name = file.name?.replace('.pdf', '').replace('.md', '')
            navigate(`/obsidian?search=${encodeURIComponent(name || '')}`)
        }
    }

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between space-y-2 border-b border-border pb-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-primary" />
                                <h2 className="text-2xl font-bold tracking-tight">OKA Dashboard</h2>
                            </div>
                            <p className="text-muted-foreground text-sm mt-0.5">Obsidian Knowledge Architect</p>
                        </div>
                    </div>
                    
                    <TabsList className="grid w-[450px] grid-cols-3">
                        <TabsTrigger value="status" className="gap-2 text-xs">
                            <Activity size={14} /> Status
                        </TabsTrigger>
                        <TabsTrigger value="not_generated" className="gap-2 text-xs">
                            <Inbox size={14} /> Not Generated
                        </TabsTrigger>
                        <TabsTrigger value="generated" className="gap-2 text-xs">
                            <CheckCheck size={14} /> Generated
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 flex flex-col min-h-0 mt-6 overflow-hidden">
                    {/* --- Status Tab --- */}
                    <TabsContent value="status" className="m-0 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="flex flex-col gap-6 pb-6 animate-in fade-in zoom-in-95 duration-200">
                            {/* Controller Card */}
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", config?.autoDeploy ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                            {config?.autoDeploy ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">Automation Engine</h3>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                                {config?.autoDeploy ? "Running" : "Paused"}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={toggleAutoDeploy}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm flex items-center gap-2",
                                            config?.autoDeploy ? "bg-background text-foreground hover:bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent"
                                        )}
                                    >
                                        {config?.autoDeploy ? <><PauseCircle size={16} /> Stop Automation</> : <><PlayCircle size={16} /> Start Automation</>}
                                    </button>
                                </div>

                                {/* Active Task */}
                                {queueStatus?.status !== 'idle' && queueStatus?.status !== 'offline' && queueStatus?.status !== undefined ? (
                                    <div className="p-5 border rounded-xl bg-primary/5 border-primary/10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-primary text-primary-foreground rounded-lg shrink-0">
                                                {queueStatus?.status === 'planning' ? <Brain size={24} /> : <Zap size={24} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-base font-bold truncate text-foreground">{queueStatus?.current_file}</h4>
                                                <p className="text-sm text-primary uppercase tracking-wider font-black mt-1">
                                                    {queueStatus?.status === 'planning' ? 'Architecting Plan...' : `Deploying Batch ${queueStatus?.current_batch} of ${queueStatus?.total_batches}`}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                                <span>Work Progress</span>
                                                <span>{queueStatus?.status === 'planning' ? '0%' : Math.round(((queueStatus?.current_batch - 1 || 0) / (queueStatus?.total_batches || 1)) * 100) + '%'}</span>
                                            </div>
                                            <div className="h-3 w-full bg-border rounded-full overflow-hidden border">
                                                <div 
                                                    className={cn("h-full transition-all duration-700 ease-in-out", queueStatus?.status === 'planning' ? "w-0 bg-primary/30 animate-pulse" : "bg-primary")} 
                                                    style={queueStatus?.status === 'deploying' ? { width: `${((queueStatus?.current_batch - 1 || 0) / (queueStatus?.total_batches || 1)) * 100}%` } : {}}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed rounded-xl bg-muted/5">
                                        <Activity size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm font-semibold">Worker is Idle</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest mt-1">Standing by for files</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Upcoming Queue */}
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ListChecks size={16} /> Upcoming Queue ({queueStatus?.pending_count || 0})
                                </h3>
                                {queueStatus?.pending_files?.length > 0 ? (
                                    <div className="space-y-2">
                                        {queueStatus.pending_files.map((file: string, i: number) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-background text-sm group hover:border-primary/30 transition-colors">
                                                <span className="font-mono text-xs text-muted-foreground w-4">{i + 1}.</span>
                                                <FileText size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                <span className="font-medium truncate">{file}</span>
                                                <div className="ml-auto text-[10px] font-bold text-muted-foreground uppercase">Pending</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed rounded-xl bg-muted/5">
                                        <Inbox size={32} className="mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No pending files</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- Not Generated Tab --- */}
                    <TabsContent value="not_generated" className="m-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex h-full gap-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-1/3 flex flex-col gap-4">
                                <div className="flex items-center justify-between px-1 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Inbox className="w-4 h-4 text-primary" />
                                        <h3 className="text-sm font-semibold tracking-tight text-foreground">Inbox</h3>
                                    </div>
                                    <button onClick={fetchInbox} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                                        <RefreshCw size={14} className={cn(loadingInbox && "animate-spin")} />
                                    </button>
                                </div>
                                
                                <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-muted/5">
                                        {!config?.inboxPath && !loadingInbox && (
                                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 text-center p-6">
                                                <AlertCircle size={48} strokeWidth={1} />
                                                <p className="text-sm font-medium">Inbox Path Not Set</p>
                                            </div>
                                        )}
                                        {config?.inboxPath && inboxFiles.length === 0 && !loadingInbox && (
                                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 text-center p-6">
                                                <Inbox size={48} strokeWidth={1} />
                                                <p className="text-sm font-medium">Inbox is empty</p>
                                            </div>
                                        )}
                                        {inboxFiles.map((file) => (
                                            <div 
                                                key={file.path} 
                                                onClick={() => { if (!isAwaitingConfirmation && !hasMoreBatches && !isCompleted) setSelectedInboxFile(file) }}
                                                className={cn(
                                                    "p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3",
                                                    selectedInboxFile?.path === file.path 
                                                        ? "bg-primary border-primary text-primary-foreground" 
                                                        : "bg-background hover:bg-muted/50 text-foreground",
                                                    (isAwaitingConfirmation || hasMoreBatches || isCompleted) && "opacity-40 cursor-not-allowed"
                                                )}
                                            >
                                                <div className={cn("p-2 rounded-md shrink-0", selectedInboxFile?.path === file.path ? "bg-primary-foreground/10" : "bg-muted")}>
                                                    {file.suffix === '.pdf' ? <FileSearch size={16} /> : <FileText size={16} />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold truncate">{file.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-4 min-w-0">
                                <div className="rounded-xl border bg-card shadow-sm p-5 shrink-0">
                                    {!selectedInboxFile && !isCompleted ? (
                                        <div className="h-[72px] flex flex-col items-center justify-center text-muted-foreground/40 gap-2 border-2 border-dashed rounded-lg">
                                            <Play size={20} strokeWidth={1} />
                                            <p className="text-sm font-medium">Select a file to generate manually</p>
                                        </div>
                                    ) : isCompleted ? (
                                        <div className="flex items-center justify-between animate-in fade-in duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shrink-0">
                                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold tracking-tight text-green-500">All Batches Completed</h3>
                                                    <p className="text-xs text-muted-foreground">{previewResults.length} notes deployed across {totalBatches} batch{totalBatches !== 1 ? 'es' : ''}</p>
                                                </div>
                                            </div>
                                            <button onClick={resetOkaSession} className="px-5 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                                                <RefreshCw size={14} /> New Session
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between animate-in fade-in duration-200">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                    {selectedInboxFile!.suffix === '.pdf' ? <FileSearch className="w-6 h-6 text-primary" /> : <FileText className="w-6 h-6 text-primary" />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <h3 className="text-base font-bold tracking-tight truncate">{selectedInboxFile!.name}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {totalBatches > 0 && (
                                                            <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Batch {currentBatch}/{totalBatches}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {!isAwaitingConfirmation && !hasMoreBatches && !activePlan && (
                                                    <button onClick={processSelectedFile} disabled={processing} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50">
                                                        {processing ? <><RefreshCw size={15} className="animate-spin" /> Planning...</> : <><Play size={15} /> Generate Plan</>}
                                                    </button>
                                                )}
                                                {isAwaitingConfirmation && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={confirmDeployment} disabled={processing} className="px-5 py-2 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50">
                                                            {processing ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                                                            Confirm & Auto-Deploy
                                                        </button>
                                                        <button onClick={resetOkaSession} className="p-2 hover:bg-muted text-muted-foreground rounded-xl transition-colors"><X size={18} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden min-h-0">
                                    {okaError ? (
                                        <div className="flex flex-col h-full p-6 bg-destructive/5 text-destructive font-mono text-sm whitespace-pre-wrap overflow-auto custom-scrollbar">
                                            {okaError}
                                        </div>
                                    ) : activePlan && isAwaitingConfirmation && batchFeed.length === 0 ? (
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                            <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{activePlan}</ReactMarkdown></div>
                                        </div>
                                    ) : batchFeed.length > 0 ? (
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                                            {batchFeed.map((feed) => (
                                                <div key={feed.batch} className="animate-in fade-in slide-in-from-bottom-2 duration-300 border rounded-lg p-3">
                                                    <div className="text-[10px] font-bold text-blue-500 uppercase mb-2">Batch {feed.batch}</div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {feed.results.map((r, i) => (
                                                            <div key={i} className="bg-background border rounded-md p-2 flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-[8px] font-black uppercase bg-primary/10 text-primary">N</div>
                                                                <span className="text-xs font-semibold truncate">{r.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 shrink-0"><Activity size={48} strokeWidth={1} /><p className="text-sm font-medium">Ready for Deployment</p></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- Generated Tab --- */}
                    <TabsContent value="generated" className="m-0 flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b bg-muted/5 flex items-center justify-between shrink-0">
                                <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                                    <CheckCheck className="w-4 h-4 text-green-500" />
                                    Successfully Generated Files
                                </h3>
                                <button onClick={fetchGenerated} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                                    <RefreshCw size={14} className={cn(loadingGenerated && "animate-spin")} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-muted/5">
                                {generatedFiles.length === 0 && !loadingGenerated ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground">No generated files yet.</div>
                                ) : (
                                    generatedFiles.map((file: any) => (
                                        <div 
                                            key={file.path}
                                            onClick={() => handleOpenGenerated(file)}
                                            className="p-4 rounded-lg border bg-background hover:bg-muted/50 transition-all cursor-pointer flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="p-2 rounded-md bg-green-500/10 text-green-500 shrink-0">
                                                    <FileCheck size={20} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-semibold truncate text-foreground">{file.name}</span>
                                                    <span className="text-xs text-muted-foreground mt-0.5">Processed from Inbox</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs font-bold">Open Hub Note</span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
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

/* ─── Agents Landing Page (The overview view) ─── */
export default function Agents() {
    const { config, saveConfig } = useConfig()
    const [activeAgent, setActiveAgent] = useState<string | null>(null)
    const navigate = useNavigate()

    const toggleAutoDeploy = async (e: React.MouseEvent) => {
        e.stopPropagation()
        const newVal = !config?.autoDeploy
        await saveConfig({ autoDeploy: newVal })
        try {
            await sidecarApi.okaWatcherToggle()
        } catch(e) { console.error(e) }
    }

    if (activeAgent === 'oka') {
        return <OkaAgent onBack={() => setActiveAgent(null)} />
    }

    return (
        <div className="h-full flex-1 flex flex-col space-y-6 md:flex w-full mx-auto animate-in fade-in duration-300">
            <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Your autonomous AI workforce.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {/* OKA Agent Card */}
                <div 
                    onClick={() => setActiveAgent('oka')}
                    className="group relative flex flex-col p-6 rounded-2xl border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md overflow-hidden"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-background border px-2 py-1 rounded-full z-10" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Auto</span>
                                <button 
                                    onClick={toggleAutoDeploy}
                                    className={cn("relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2", config?.autoDeploy ? 'bg-primary' : 'bg-muted')}
                                >
                                    <span className={cn("pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-3' : 'translate-x-0')} />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-bold tracking-tight mb-2 flex items-center gap-2">
                        OKA
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        Obsidian Knowledge Architect. Automates the ingestion of academic documents into atomic, inter-linked knowledge clusters.
                    </p>

                    <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <Activity className="w-3.5 h-3.5" />
                            Ready
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:underline">
                            Open Dashboard
                        </div>
                    </div>

                    <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-primary/5 rotate-12 group-hover:scale-110 transition-transform" />
                </div>

                {/* Strategist Agent Card */}
                <div 
                    onClick={() => navigate('/strategist')}
                    className="group relative flex flex-col p-6 rounded-2xl border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md overflow-hidden"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <Zap className="w-6 h-6" />
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-bold tracking-tight mb-2 flex items-center gap-2">
                        Strategist
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        Your personal life strategist. Calibrate your identity, simulate life pivots, and receive tactical advice based on your Master Plan.
                    </p>

                    <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <Activity className="w-3.5 h-3.5" />
                            Ready
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-500 group-hover:underline">
                            Open Console
                        </div>
                    </div>

                    <Zap className="absolute -right-4 -top-4 w-24 h-24 text-purple-500/5 rotate-12 group-hover:scale-110 transition-transform" />
                </div>

                {/* Placeholder Cards */}
                <div className="relative flex flex-col p-6 rounded-2xl border bg-muted/10 opacity-60 grayscale cursor-not-allowed">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-muted text-muted-foreground">
                            <FileSearch className="w-6 h-6" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                            Coming Soon
                        </div>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight mb-2">Web Researcher</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Autonomous research agent that scrapes the web, synthesizes findings, and populates your vault with source-backed reports.
                    </p>
                </div>

                <div className="relative flex flex-col p-6 rounded-2xl border bg-muted/10 opacity-60 grayscale cursor-not-allowed">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-muted text-muted-foreground">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                            Coming Soon
                        </div>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight mb-2">Dev Architect</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Scans your codebase to suggest architectural refactors, identifies tech debt, and automatically generates documentation.
                    </p>
                </div>
            </div>
        </div>
    )
}
