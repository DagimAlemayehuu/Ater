import { useState, useEffect } from 'react'
import { 
    ShieldCheck, RefreshCw, 
    FileText, Activity, 
    Zap,
    Brain, ArrowLeft, Bot, Sparkles, ChevronRight, ListChecks,
    Database, Calendar,
    UserCheck, Search, X, Info, Shield, Check, Save, MessageSquare, Layout, Clock, Plus, ExternalLink, Battery, BrainCircuit,
    BookOpen, Tag, Layers, ChevronDown, FileEdit, HelpCircle,
    Archive, Terminal
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
import { Card } from '@/components/ui/card'






/* ─── Plan UI Components ─── */
function CurriculumPill({ 
    label, 
    value, 
    onChange, 
    icon: Icon, 
    isEditable = true,
    isDropdown = false,
    onClick,
    options = []
}: { 
    label: string, 
    value: string, 
    onChange?: (v: string) => void, 
    icon: any, 
    isEditable?: boolean,
    isDropdown?: boolean,
    onClick?: () => void,
    options?: string[]
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="relative">
            <div 
                onClick={() => {
                    if (isDropdown) onClick?.();
                    else if (options.length > 0) setIsMenuOpen(!isMenuOpen);
                }}
                className={cn(
                    "px-3 py-1.5 rounded-full bg-muted/50 border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all group hover:bg-muted hover:border-primary/20",
                    (isDropdown || options.length > 0) && "cursor-pointer active:scale-95"
                )}
            >
                <Icon size={12} className="text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-1.5">
                    <span className="opacity-30">{label}:</span>
                    {isEditable && options.length === 0 ? (
                        <input 
                            className="bg-transparent border-none focus:outline-none text-foreground font-black min-w-[20px] placeholder:opacity-20 border-b border-transparent focus:border-primary/30 transition-all"
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            placeholder="Set..."
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-foreground font-black">{value || 'None'}</span>
                    )}
                </div>
                {(isDropdown || options.length > 0) && <ChevronDown size={10} className="opacity-20" />}
            </div>

            {/* Selection Menu for Pills with Options */}
            {isMenuOpen && options.length > 0 && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border shadow-2xl rounded-xl z-[120] p-1.5 animate-in fade-in slide-in-from-top-1">
                        <div className="px-2 py-1 text-[8px] font-black uppercase opacity-20 tracking-widest mb-1">{label} Options</div>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                            {options.map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => {
                                        onChange?.(opt);
                                        setIsMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left p-2 rounded-lg text-[10px] font-bold transition-all hover:bg-muted",
                                        value === opt && "text-primary bg-primary/5"
                                    )}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

/* ─── Plan Card View Component ─── */
function PlanCardView({ planRaw }: { planRaw: string }) {
    const extract = (tag: string) => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's')
        const match = planRaw.match(regex)
        return match ? match[1].trim() : null
    }

    const hubContent = extract('hub_note')
    const pqContent = extract('pq_note')
    const atomicContent = extract('atomic_notes')

    const cleanLink = (text: string) => text.replace(/\[\[(.*?)\]\]/g, '$1').replace(/\*\*/g, '').replace(/\*/g, '')

    const parseAtomicTree = (text: string) => {
        const lines = text.split('\n').filter(l => l.trim().startsWith('-'))
        return lines.map(line => {
            // Count leading spaces to determine depth
            const indentMatch = line.match(/^(\s*)-/)
            const spaces = indentMatch ? indentMatch[1].length : 0
            const level = Math.floor(spaces / 2) // OKA v10.5 uses 2-space increments
            const content = line.replace(/^\s*-/, '').trim()
            return { level, content: cleanLink(content) }
        })
    }

    const atomicTree = atomicContent ? parseAtomicTree(atomicContent) : []

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-4">
                {hubContent && (
                    <div className="rounded-xl border bg-secondary/5 p-5 shadow-sm hover:border-primary/20 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Brain size={18} />
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Master Unit Hub</h4>
                        </div>
                        <div className="text-[13px] font-bold text-primary underline decoration-primary/20 underline-offset-4 tracking-tight cursor-default">
                            {cleanLink(hubContent)}
                        </div>
                    </div>
                )}
                {pqContent && (
                    <div className="rounded-xl border bg-secondary/5 p-5 shadow-sm hover:border-emerald-500/20 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <ShieldCheck size={18} />
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Mastery Assessment</h4>
                        </div>
                        <div className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/20 underline-offset-4 tracking-tight cursor-default">
                            {cleanLink(pqContent)}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Layers size={16} className="text-muted-foreground" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Architectural Fragments</h4>
                </div>
                
                <div className="flex flex-col gap-3">
                    {atomicTree.map((node, i) => (
                        <div 
                            key={i} 
                            style={{ marginLeft: `${node.level * 24}px` }}
                            className={cn(
                                "p-4 rounded-xl border bg-secondary/5 shadow-sm hover:border-primary/40 hover:bg-secondary/10 transition-all relative overflow-hidden group min-w-0 w-full",
                                node.level > 0 ? "border-dashed opacity-90 scale-[0.99]" : "border-solid border-border/60"
                            )}
                        >
                            {node.level > 0 && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/10 group-hover:bg-primary/30 transition-colors" />
                            )}
                            <div className="flex items-center justify-between gap-4 min-w-0">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={cn(
                                        "p-1.5 rounded-md shrink-0",
                                        node.level === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <FileText size={12} />
                                    </div>
                                    <div className="font-bold text-[11px] tracking-tight text-primary underline decoration-primary/10 underline-offset-2 break-words overflow-hidden max-w-full">
                                        {node.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
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
    const [structuredPlan, setStructuredPlan] = useState<any>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [anchoredHub, setAnchoredHub] = useState<any>(null)
    const [availableHubs, setAvailableHubs] = useState<any[]>([])
    const [availableOptions, setAvailableOptions] = useState<{ courses: string[], semesters: string[], units: string[] }>({ courses: [], semesters: [], units: [] })
    const [curriculum, setCurriculum] = useState({ course: '', unit: '', semester: '', hub_title: '' })
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
    const [isCurriculumReady, setIsCurriculumReady] = useState(false)
    const [currentBatch, setCurrentBatch] = useState<number>(0)
    const [totalBatches, setTotalBatches] = useState<number>(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [batchFeed, setBatchFeed] = useState<any[]>([])
    const [okaError, setOkaError] = useState<string | null>(null)

    const [isAwaitingNextBatch, setIsAwaitingNextBatch] = useState(false)

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
        setIsCurriculumReady(false)
        setIsAwaitingNextBatch(false)
        setIsCompleted(false)
        setActivePlan(null)
        setStructuredPlan(null)
        setBatchFeed([])
        setSelectedInboxFile(null)
        setOkaError(null)
        fetchInbox()
    }

    const processSelectedFile = async (manualHubId?: string) => {
        if (!selectedInboxFile) return
        setProcessing(true)
        setOkaError(null)
        setActivePlan(null)
        setStructuredPlan(null)
        setIsCurriculumReady(false)
        setIsAwaitingConfirmation(false)
        
        try {
            // First pass: Just get hub detection and metadata list (NO AI)
            const res = await sidecarApi.okaProcess({ 
                file_path: selectedInboxFile.path,
                target_hub_id: manualHubId ? String(manualHubId) : undefined
            })
            
            setAnchoredHub(res.anchored_hub)
            setAvailableHubs(res.available_hubs || [])
            setAvailableOptions(res.available_options || { courses: [], semesters: [], units: [] })
            
            setCurriculum({
                course: res.anchored_hub?.course || '',
                unit: String(res.anchored_hub?.unit || ''),
                semester: res.anchored_hub?.semester || '',
                hub_title: res.anchored_hub?.title || ''
            })
            setIsCurriculumReady(true)
        } catch (err: any) {
            setOkaError(err.message || 'Detection failed')
        } finally { setProcessing(false) }
    }

    const startPlanning = async () => {
        if (!selectedInboxFile) return
        setProcessing(true)
        setOkaError(null)
        try {
            // Second pass: Now generate the full plan using the (finalized) curriculum
            const res = await sidecarApi.okaGeneratePlan({ 
                file_path: selectedInboxFile.path,
                curriculum: {
                    course: String(curriculum.course || ""),
                    unit: String(curriculum.unit || ""),
                    semester: String(curriculum.semester || ""),
                    hub_title: String(curriculum.hub_title || "")
                },
                target_hub_id: anchoredHub?.id ? String(anchoredHub.id) : undefined
            })
            setActivePlan(res.plan_raw)
            setStructuredPlan(res.plan_structured)
            setSessionId(res.session_id)
            setIsAwaitingConfirmation(true)
            setTotalBatches(res.plan_structured?.batches?.length || 1)
            setCurrentBatch(0)
        } catch (err: any) {
            setOkaError(err.message || 'Planning failed')
        } finally { setProcessing(false) }
    }

    const handleHubSelect = (hub: any) => {
        if (hub === 'new') {
            setAnchoredHub({ id: 'new', title: 'New Hub' })
            setCurriculum({ course: '', unit: '', semester: '', hub_title: 'New Unit Hub' })
            return
        }
        setAnchoredHub(hub)
        setCurriculum({
            course: hub.course || '',
            unit: String(hub.unit || ''),
            semester: hub.semester || '',
            hub_title: hub.title || ''
        })
    }

    const confirmDeployment = async () => {
        if (!sessionId) return
        setProcessing(true)
        setIsAwaitingConfirmation(false)
        setIsAwaitingNextBatch(false)
        try {
            const command = currentBatch === 0 
                ? "Confirm Final Plan & Proceed Batch 1" 
                : `Proceed Batch ${currentBatch + 1}`;
                
            const res = await sidecarApi.okaConfirm({ 
                session_id: sessionId, 
                command,
                curriculum_override: currentBatch === 0 ? {
                    course: String(curriculum.course || ""),
                    unit: String(curriculum.unit || ""),
                    semester: String(curriculum.semester || ""),
                    hub_title: String(curriculum.hub_title || "")
                } : undefined,
                anchored_hub_id: anchoredHub?.id ? String(anchoredHub.id) : undefined
            })
            const tempBatch = res.current_batch || (currentBatch + 1)
            setCurrentBatch(tempBatch)
            setBatchFeed(prev => [...prev, { 
                batch: tempBatch, 
                results: res.results || [],
                ai_output: res.ai_output || ""
            }])
            
            if (res.has_more) {
                setIsAwaitingNextBatch(true)
            } else {
                setIsCompleted(true)
            }
        } catch (err: any) { 
            setOkaError(err.message) 
            setIsAwaitingNextBatch(true) // allow retry
        }
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
                                        onClick={() => { setSelectedInboxFile(f); setOkaError(null); setActivePlan(null); setIsAwaitingConfirmation(false); setIsCurriculumReady(false); }}
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
                            {selectedInboxFile && !isCurriculumReady && !isAwaitingConfirmation && !isAwaitingNextBatch && !isCompleted && (
                                <Button onClick={() => processSelectedFile()} disabled={processing} size="sm" className="h-8 font-bold text-[10px] uppercase">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                    Analyze File
                                </Button>
                            )}
                            {isCurriculumReady && !isAwaitingConfirmation && !isCompleted && (
                                <Button onClick={startPlanning} disabled={processing} size="sm" className="h-8 font-bold text-[10px] uppercase bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <ChevronRight className="mr-2" size={14} />}
                                    Continue to Plan
                                </Button>
                            )}
                            {isAwaitingConfirmation && (
                                <Button onClick={confirmDeployment} disabled={processing} size="sm" className="h-8 font-bold text-[10px] uppercase bg-primary hover:opacity-90 shadow-lg shadow-primary/20">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <ShieldCheck className="mr-2" size={12} />}
                                    Confirm Plan & Run Batch 1
                                </Button>
                            )}
                            {isAwaitingNextBatch && (
                                <Button onClick={confirmDeployment} disabled={processing} size="sm" className="h-8 font-bold text-[10px] uppercase bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                    Proceed Batch {currentBatch + 1} of {totalBatches}
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
                                    <h4 className="text-lg font-bold mb-4">Architecting Knowledge...</h4>
                                    <p className="text-xs text-primary/80 font-mono bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                        {queueStatus?.manual_status?.[selectedInboxFile?.path] || 'The AI is analyzing the document structure...'}
                                    </p>
                                </div>
                            )}

                            {processing && (activePlan || batchFeed.length > 0) && (
                                <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between shadow-sm animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <RefreshCw size={20} className="animate-spin text-primary" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary">System Working</p>
                                    </div>
                                    <p className="text-[10px] font-mono text-primary/80">
                                        {queueStatus?.manual_status?.[selectedInboxFile?.path] || 'Executing Batch...'}
                                    </p>
                                </div>
                            )}

                            {isCurriculumReady && !activePlan && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 p-6 rounded-2xl bg-secondary/5 border border-border/10 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Sparkles size={24} className="text-primary animate-pulse" />
                                            <div>
                                                <h4 className="text-lg font-black tracking-tight">Curriculum Alignment</h4>
                                                <p className="text-xs font-medium opacity-60">OKA has detected a potential curriculum match. Review and edit the metadata below.</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2.5 relative">
                                            {/* Hub Anchor Pill */}
                                            <div className="relative group/popover">
                                                <CurriculumPill 
                                                    label="Anchor" 
                                                    value={anchoredHub?.title || 'Standalone'} 
                                                    icon={Database} 
                                                    isEditable={false} 
                                                    isDropdown={true}
                                                />
                                                <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border shadow-2xl rounded-xl z-[100] p-1.5 hidden group-focus-within/popover:block group-hover/popover:block animate-in fade-in slide-in-from-top-1">
                                                    <div className="px-2 py-1.5 text-[8px] font-black uppercase opacity-30 tracking-widest border-b border-border/10 mb-1 flex items-center justify-between">
                                                        <span>Study Planner Hubs</span>
                                                        <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        <button 
                                                            onClick={() => handleHubSelect('new')}
                                                            className="w-full flex items-center gap-2 p-2 hover:bg-primary/10 text-primary rounded-lg transition-all text-left"
                                                        >
                                                            <Plus size={12} />
                                                            <span className="text-[10px] font-bold uppercase tracking-tight">New Hub (Manual)...</span>
                                                        </button>
                                                        {availableHubs.map(h => (
                                                            <button 
                                                                key={h.id} 
                                                                onClick={() => handleHubSelect(h)}
                                                                className={cn(
                                                                    "w-full flex flex-col p-2 hover:bg-muted rounded-lg transition-all text-left",
                                                                    anchoredHub?.id === h.id && "bg-muted border-l-2 border-primary"
                                                                )}
                                                            >
                                                                <span className="text-[10px] font-bold truncate">{h.title}</span>
                                                                <div className="flex items-center gap-2 opacity-40 text-[8px] font-bold uppercase">
                                                                    <span>{h.course || 'No Course'}</span>
                                                                    <span>•</span>
                                                                    <span>Unit {h.unit || '?'}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {(anchoredHub?.id === 'new' || !anchoredHub) && (
                                                <CurriculumPill 
                                                    label="Hub Title" 
                                                    value={curriculum.hub_title} 
                                                    onChange={v => setCurriculum(p => ({ ...p, hub_title: v }))}
                                                    icon={FileEdit} 
                                                />
                                            )}

                                            <CurriculumPill 
                                                label="Course" 
                                                value={curriculum.course} 
                                                onChange={v => setCurriculum(p => ({ ...p, course: v }))}
                                                icon={BookOpen} 
                                                options={availableOptions.courses}
                                            />
                                            <CurriculumPill 
                                                label="Unit" 
                                                value={curriculum.unit} 
                                                onChange={v => setCurriculum(p => ({ ...p, unit: v }))}
                                                icon={Tag} 
                                                options={availableOptions.units}
                                            />
                                            <CurriculumPill 
                                                label="Semester" 
                                                value={curriculum.semester} 
                                                onChange={v => setCurriculum(p => ({ ...p, semester: v }))}
                                                icon={Calendar} 
                                                options={availableOptions.semesters}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activePlan && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
                                        <Sparkles size={20} className="text-primary" />
                                        <p className="text-xs font-medium text-foreground">Plan generated. Review the integration strategy below and confirm deployment.</p>
                                    </div>

                                    {structuredPlan ? (
                                        <div className="space-y-8">
                                            {/* Header Info: Dynamic Curriculum Pills (Static after plan) */}
                                            <div className="flex flex-wrap gap-2.5 relative opacity-60">
                                                <CurriculumPill label="Anchor" value={anchoredHub?.title || 'Standalone'} icon={Database} isEditable={false} />
                                                <CurriculumPill label="Course" value={curriculum.course} icon={BookOpen} isEditable={false} />
                                                <CurriculumPill label="Unit" value={curriculum.unit} icon={Tag} isEditable={false} />
                                                <CurriculumPill label="Semester" value={curriculum.semester} icon={Calendar} isEditable={false} />
                                                <CurriculumPill label="Queue" value={`${structuredPlan.batches?.length || 0} batches`} icon={Layers} isEditable={false} />
                                            </div>

                                            <PlanCardView planRaw={activePlan} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                            <Brain size={32} className="mb-4 animate-pulse" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Compiling Architectural Plan...</p>
                                        </div>
                                    )}
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
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {b.results.length > 0 ? "Batch Execution Successful" : "Batch Parsing Failed"}
                                                </span>
                                            </div>
                                            
                                            {b.results.length === 0 && (
                                                <div className="mb-4 mt-2 p-3 rounded bg-destructive/10 border border-destructive/30">
                                                    <p className="text-[11px] text-destructive font-medium mb-3 whitespace-nowrap overflow-hidden text-ellipsis">No OKA v8.0 START_NOTE/END_NOTE regions detected. AI output failed structural validation. Review raw output below:</p>
                                                    <pre className="text-[10px] bg-background border border-border/10 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 font-mono">
                                                        {b.ai_output}
                                                    </pre>
                                                </div>
                                            )}
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



/* ─── Agent Console Utility ─── */
function AgentConsole({ agentName, title }: { agentName: string, title: string }) {
    return (
        <div className="flex items-center justify-between bg-muted/20 px-4 py-2 rounded-lg border border-dashed border-border/40">
            <div className="flex items-center gap-2">
                <Terminal size={12} className="opacity-20" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{agentName} active_sector</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Ready</span>
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
            id: 'oka',
            title: 'Obsidian Knowledge Architect',
            icon: Brain,
            color: 'text-foreground',
            bg: 'bg-muted/30',
            description: 'Autonomous ingestion engine. Automates the architectural mapping of documents into atomic knowledge clusters.',
            action: () => setActiveAgent('oka'),
            actionText: 'Architect'
        }
    ]

    if (activeAgent === 'oka') return <OkaDashboard onBack={() => setActiveAgent(null)} />

    return (
        <div className="h-full flex flex-col space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-black tracking-tighter">INTELLIGENCE</h1>
                <p className="text-muted-foreground text-sm font-medium">Coordinate autonomous agents and high-fidelity synthesis protocols.</p>
            </div>

            <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full">
                {agents.map((agent) => (
                    <Card key={agent.id} className="p-8 flex flex-col gap-8 group hover:border-primary/40 transition-all duration-500 relative overflow-hidden shadow-2xl shadow-black/20 w-full">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                            <agent.icon size={160} strokeWidth={1} />
                        </div>
                        
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className={cn("p-4 rounded-2xl w-fit", agent.bg)}>
                                <agent.icon className={cn("w-8 h-8", agent.color)} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">{agent.title}</h2>
                                <p className="text-muted-foreground text-sm leading-relaxed mt-3 font-medium">
                                    {agent.description}
                                </p>
                            </div>
                        </div>

                        <Button 
                            onClick={agent.action}
                            className={cn(
                                "w-full h-14 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl relative z-10 transition-all active:scale-95 bg-primary text-primary-foreground shadow-xl shadow-primary/20",
                            )}
                        >
                            INITIALIZE {agent.actionText}
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    )
}

