import React, { useState, useEffect } from 'react'
import { 
    ShieldCheck, RefreshCw, 
    FileText, Activity, 
    Zap,
    Brain, ArrowLeft, Bot, Sparkles, ChevronRight, ListChecks,
    Database, Calendar,
    UserCheck, Search, X, Info, Shield, Check, Save, MessageSquare, Layout, Clock, Plus, ExternalLink, Battery, BrainCircuit,
    BookOpen, Tag, Layers, ChevronDown, FileEdit, HelpCircle,
    Archive, Terminal, CheckCircle
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
                    "px-2.5 py-1.5 rounded bg-background border border-border text-xs font-semibold uppercase tracking-tight flex items-center gap-2 transition-all hover:bg-muted hover:border-muted-foreground/30",
                    (isDropdown || options.length > 0) && "cursor-pointer"
                )}
            >
                <Icon size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{label}:</span>
                    {isEditable && options.length === 0 ? (
                        <input 
                            className="bg-transparent border-none focus:outline-none text-foreground font-medium min-w-[20px] placeholder:text-muted-foreground/40 border-b border-transparent focus:border-border transition-all"
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            placeholder="Set..."
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-foreground font-medium">{value || 'None'}</span>
                    )}
                </div>
                {(isDropdown || options.length > 0) && <ChevronDown size={14} className="text-muted-foreground ml-1" />}
            </div>

            {/* Selection Menu for Pills with Options */}
            {isMenuOpen && options.length > 0 && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border shadow-md rounded z-[120] p-1.5 animate-in fade-in slide-in-from-top-1">
                        <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground tracking-tight mb-1">{label} Options</div>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                            {options.map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => {
                                        onChange?.(opt);
                                        setIsMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-2 py-1.5 rounded text-sm font-medium transition-all hover:bg-muted",
                                        value === opt && "text-foreground bg-accent"
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

function BatchTreeView({ batches, processedNotes }: { batches: any[], processedNotes: any[] }) {
    if (!batches || batches.length === 0) return null;
    const processedTitles = new Set(processedNotes?.map(n => n.title));

    return (
        <div className="space-y-3">
            {batches.map((batch: any) => (
                <div key={batch.id} className="p-4 rounded border border-border bg-muted/20">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                            {batch.id}
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Batch {batch.id}</h4>
                    </div>
                    <div className="space-y-1.5">
                        {batch.notes?.map((note: string, idx: number) => {
                            const isProcessed = processedTitles.has(note);
                            return (
                                <div key={idx} className={`flex items-center gap-2 pl-7 group transition-opacity ${isProcessed ? 'opacity-50' : ''}`}>
                                    {isProcessed ? (
                                        <CheckCircle size={12} className="text-emerald-500" />
                                    ) : (
                                        <FileText size={12} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                                    )}
                                    <span className={`text-[11px] font-medium truncate ${isProcessed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                        {note}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
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
        // Strategy 1: Bulleted/numbered list lines (standard AI output)
        const listLines = text.split('\n').filter(l => 
            l.trim().match(/^\d+\./) || l.trim().startsWith('-') || l.trim().startsWith('*')
        )
        
        // Strategy 2: Comma-separated [[links]] inline (also common AI output)
        const inlineLinks: string[] = []
        if (listLines.length === 0) {
            const allLinks = [...text.matchAll(/\[\[([^\]]+)\]\]/g)]
            allLinks.forEach(m => inlineLinks.push(m[1]))
        }

        if (listLines.length === 0 && inlineLinks.length > 0) {
            // Return flat card nodes from inline links
            return inlineLinks.map(title => ({
                level: 0,
                title: cleanLink(`[[${title}]]`),
                mode: null,
                parent: null,
                pages: [],
                description: ''
            }))
        }
        
        return listLines.map(line => {
            // Determine level from indentation
            const indentMatch = line.match(/^(\s*)/)
            const spaces = indentMatch ? indentMatch[1].length : 0
            const level = Math.floor(spaces / 2)

            // Extract content
            const rawContent = line.replace(/^\s*(\d+\.|-|\*)\s*/, '').trim()
            
            // Extract bits
            const titleMatch = rawContent.match(/\[\[(.*?)\]\]/)
            const modeMatch = rawContent.match(/\(Mode\s+([A-Z]+)\)/i)
            const parentMatch = rawContent.match(/Parent:\s*\[\[(.*?)\]\]/)
            const pagesMatch = rawContent.match(/Pages:\s*\[(.*?)\]/)

            let description = '';
            if (rawContent.includes(':')) {
                // Try to find the description which is usually after the mode and before Parent/Pages
                description = rawContent.split(':').slice(1).join(':')
                    .split('Parent:')[0]
                    .split('Pages:')[0]
                    .trim();
            }

            return {
                level,
                title: titleMatch ? titleMatch[1] : cleanLink(rawContent.split('-')[0]),
                mode: modeMatch ? modeMatch[1] : null,
                parent: parentMatch ? parentMatch[1] : null,
                pages: pagesMatch ? pagesMatch[1].split(',').map(p => p.trim()).filter(p => p) : [],
                description: description
            }
        })
    }

    const atomicTree = atomicContent ? parseAtomicTree(atomicContent) : []

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-3">
                {hubContent && (
                    <div className="rounded border border-border bg-background p-5 hover:border-muted-foreground/30 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-1.5 bg-muted rounded text-foreground">
                                <Brain size={16} />
                            </div>
                            <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Master Unit Hub</h4>
                        </div>
                        <div className="text-sm font-medium text-foreground underline decoration-muted-foreground/20 underline-offset-4 cursor-default">
                            {cleanLink(hubContent)}
                        </div>
                    </div>
                )}
                {pqContent && (
                    <div className="rounded border border-border bg-background p-5 hover:border-muted-foreground/30 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-1.5 bg-muted rounded text-foreground">
                                <ShieldCheck size={16} />
                            </div>
                            <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Mastery Assessment</h4>
                        </div>
                        <div className="text-sm font-medium text-foreground underline decoration-muted-foreground/20 underline-offset-4 cursor-default">
                            {cleanLink(pqContent)}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Layers size={16} className="text-muted-foreground" />
                    <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Architectural Fragments</h4>
                </div>
                
                <div className="flex flex-col gap-2">
                    {atomicTree.map((node, i) => (
                        <div 
                            key={i} 
                            style={{ marginLeft: `${node.level * 24}px` }}
                            className={cn(
                                "p-3 rounded border bg-background hover:border-muted-foreground/30 hover:bg-muted/50 transition-all relative overflow-hidden group min-w-0 w-full",
                                node.level > 0 ? "border-dashed opacity-90 scale-[1] border-border" : "border-solid border-border shadow-sm"
                            )}
                        >
                            {node.level > 0 && (
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border group-hover:bg-muted-foreground/40 transition-colors" />
                            )}
                            <div className="flex items-start justify-between gap-4 min-w-0">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className={cn(
                                        "p-1.5 rounded shrink-0 mt-0.5",
                                        node.level === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <FileText size={12} />
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="font-bold text-[13px] text-foreground truncate group-hover:text-foreground transition-colors">
                                            {node.title}
                                            {node.mode && (
                                                <span className="ml-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest border border-border px-1 rounded">
                                                    {node.mode}
                                                </span>
                                            )}
                                        </div>
                                        {node.description && (
                                            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg">
                                                {node.description}
                                            </p>
                                        )}
                                        {node.pages.length > 0 && (
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">Relevant Pages:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {node.pages.map(p => (
                                                        <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded hover:bg-background hover:border-muted-foreground/30 transition-all cursor-default">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {node.parent && (
                                    <div className="hidden sm:flex items-center gap-1 text-[9px] font-bold uppercase text-muted-foreground shrink-0">
                                        <ArrowLeft size={10} />
                                        <span className="truncate max-w-[80px]">{node.parent}</span>
                                    </div>
                                )}
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
        // Poll status frequently during active deployments
        const itv = setInterval(fetchStatus, queueStatus?.status !== 'idle' ? 1500 : 3000)
        return () => clearInterval(itv)
    }, [queueStatus?.status])

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
            
            // CRITICAL FIX: If anchored_hub is present use it; otherwise fall back to detected_curriculum
            // This ensures the UI pre-fills even when the AI had to create a new hub stub.
            const anchor = res.anchored_hub
            const detected = res.detected_curriculum
            
            setCurriculum({
                course: anchor?.course || detected?.course || '',
                unit: String(anchor?.unit || detected?.unit || ''),
                semester: anchor?.semester || detected?.semester || '',
                hub_title: anchor?.title || (detected?.hub_title ? (
                    (detected.unit ? detected.unit + ' ' : '') + detected.hub_title + ' Hub'
                ) : ''),
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

    const confirmDeployment = async (isStrict = false) => {
        if (!sessionId) return
        setProcessing(true)
        setIsAwaitingConfirmation(false)
        setIsAwaitingNextBatch(false)
        
        try {
            let currentHasMore = true;
            let currentLocalBatch = currentBatch;
            
            while (currentHasMore) {
                const command = isStrict ? "Proceed Batch (Auto)" : (currentLocalBatch === 0 
                    ? "Confirm Final Plan & Proceed Batch 1" 
                    : `Proceed Batch ${currentLocalBatch + 1}`);

                const res = await sidecarApi.okaConfirm({ 
                    session_id: sessionId, 
                    command,
                    curriculum_override: currentLocalBatch === 0 ? {
                        course: String(curriculum.course || ""),
                        unit: String(curriculum.unit || ""),
                        semester: String(curriculum.semester || ""),
                        hub_title: String(curriculum.hub_title || "")
                    } : undefined,
                    anchored_hub_id: anchoredHub?.id ? String(anchoredHub.id) : undefined
                })
                
                if (res.status === 'error') {
                    throw new Error(res.message || res.detail || "Backend generation failed.");
                }
                
                const tempBatch = res.current_batch || (currentLocalBatch + 1)
                currentLocalBatch = tempBatch
                setCurrentBatch(tempBatch)

                setBatchFeed(prev => [...prev, { 
                    batch: tempBatch, 
                    results: res.results || [],
                    ai_output: res.ai_output || ""
                }])

                currentHasMore = res.has_more;
                
                if (currentHasMore) {
                    if (isStrict) {
                        // Small cooldown to let UI render and avoid immediately hammering the backend
                        await new Promise(r => setTimeout(r, 500));
                    } else {
                        setIsAwaitingNextBatch(true)
                        break; // Break the loop so user has to click proceed again
                    }
                } else {
                    setIsCompleted(true)
                    break;
                }
            }
        } catch (err: any) { 
            setOkaError(err.message || 'Workflow failed')
            setIsAwaitingNextBatch(true) // allow retry
        } finally { 
            setProcessing(false) 
        }
    }
    return (
        <div className="h-full flex flex-col font-sans bg-background text-foreground overflow-hidden p-12">
            <div className="flex items-center justify-between pb-8 shrink-0">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-tight mb-4">
                        <button onClick={onBack} className="hover:text-foreground transition-colors">Intelligence</button>
                        <span className="text-muted-foreground/30">/</span>
                        <span className="text-muted-foreground">OKA Dashboard</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Obsidian Knowledge Architect</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-muted border border-border px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-tight text-muted-foreground">
                        <span>Auto-Ingest</span>
                        <button 
                            onClick={toggleAutoDeploy}
                            className={cn("relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none", config?.autoDeploy ? 'bg-primary' : 'bg-muted-foreground/30')}
                        >
                            <span className={cn("pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-4' : 'translate-x-0')} />
                        </button>
                    </div>
                    <button onClick={() => { fetchInbox(); fetchStatus(); }} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-muted-foreground bg-background border border-border hover:bg-muted transition-colors">
                        <RefreshCw size={14} className="mr-2" /> Sync
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="w-[320px] flex flex-col gap-6 shrink-0 overflow-hidden">
                    <div className="rounded border border-border bg-background p-5 shrink-0 shadow-sm">
                        <h3 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground mb-4">Pipeline Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", queueStatus?.status !== 'idle' ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{queueStatus?.status || 'Idle'}</span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">{queueStatus?.pending_count || 0} Pending</span>
                            </div>
                            
                            {queueStatus?.status !== 'idle' && (
                                <div className="space-y-3 pt-2 border-t border-border">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Current File</p>
                                        <p className="text-[11px] font-semibold text-foreground truncate">{queueStatus?.current_file}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="text-foreground">{queueStatus?.current_batch} / {queueStatus?.total_batches} Batches</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                                            <div className="h-full bg-primary transition-all duration-700 ease-in-out" style={{ width: `${(queueStatus?.current_batch / (queueStatus?.total_batches || 1)) * 100}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 p-2 bg-muted rounded border border-border">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Last Action</p>
                                        <p className="text-[10px] font-medium text-muted-foreground truncate">{queueStatus?.last_action || 'Initializing...'}</p>
                                    </div>

                                    {queueStatus?.processed_notes?.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Recent Assets</p>
                                            <div className="flex flex-col gap-1">
                                                {queueStatus?.processed_notes?.slice(-3).reverse().map((note: any, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                                        <span className="truncate font-medium">{note.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {queueStatus?.status === 'idle' && queueStatus?.pending_count === 0 && (
                                <div className="py-4 text-center">
                                    <p className="text-[10px] font-medium text-muted-foreground">All systems clear. Vault is synchronized.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 border border-border rounded bg-background overflow-hidden flex flex-col shadow-sm">
                        <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Inbox</h3>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted text-foreground rounded">{inboxFiles.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {loadingInbox ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
                                ))
                            ) : inboxFiles.length > 0 ? (
                                inboxFiles.map(f => (
                                    <div 
                                        key={f.path} 
                                        onClick={() => { setSelectedInboxFile(f); setOkaError(null); setActivePlan(null); setIsAwaitingConfirmation(false); setIsCurriculumReady(false); }}
                                        className={cn(
                                            "p-3 rounded-md border text-[11px] cursor-pointer transition-all", 
                                            selectedInboxFile?.path === f.path ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-transparent text-muted-foreground"
                                        )}
                                    >
                                        <p className="font-bold truncate">{f.name}</p>
                                        <p className={cn("text-[9px] truncate mt-1", selectedInboxFile?.path === f.path ? "text-primary-foreground/70" : "text-muted-foreground/60")}>{f.path}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-muted-foreground/30">
                                    <Archive size={32} className="mx-auto mb-2" />
                                    <p className="text-xs font-semibold uppercase tracking-tight">Empty Inbox</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col rounded border border-border bg-background shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded text-foreground">
                                <Bot className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-bold truncate text-foreground">
                                {selectedInboxFile?.name || 'Architect Workspace'}
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {selectedInboxFile && !isCurriculumReady && !isAwaitingConfirmation && !isAwaitingNextBatch && !isCompleted && (
                                <button onClick={() => processSelectedFile()} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-muted-foreground bg-background border border-border hover:bg-muted transition-colors disabled:opacity-50">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                    Analyze File
                                </button>
                            )}
                            {isCurriculumReady && !isAwaitingConfirmation && !isCompleted && (
                                <button onClick={startPlanning} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-primary-foreground border border-primary bg-primary hover:opacity-90 transition-colors  disabled:opacity-50">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <ChevronRight className="mr-2" size={12} />}
                                    Continue to Plan
                                </button>
                            )}
                            {isAwaitingConfirmation && (
                               <div className="flex gap-2">
                                   <button onClick={() => confirmDeployment(true)} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-primary-foreground border border-orange-500 bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50">
                                       {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                       Strictly Generate All
                                   </button>
                                   <button onClick={() => confirmDeployment(false)} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-primary-foreground border border-primary bg-primary hover:opacity-90 transition-colors disabled:opacity-50">
                                       {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <ShieldCheck className="mr-2" size={12} />}
                                       Confirm Plan & Run Batch 1
                                   </button>
                               </div>
                            )}
                            {isAwaitingNextBatch && (
                               <div className="flex gap-2">
                                   <button onClick={() => confirmDeployment(true)} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-primary-foreground border border-orange-500 bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50">
                                       {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                       Strictly Finish All
                                   </button>
                                   <button onClick={() => confirmDeployment(false)} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-primary-foreground bg-primary transition-colors disabled:opacity-50 hover:opacity-90">
                                       {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                       Proceed Batch {currentBatch + 1} of {totalBatches}
                                   </button>
                               </div>
                            )}

                            {isCompleted && (
                                <button onClick={resetOkaSession} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-muted-foreground bg-background border border-border hover:bg-muted transition-colors">
                                    Reset Workspace
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50">
                        <div className="p-8 max-w-4xl mx-auto">
                            {!selectedInboxFile && !processing && (
                                <div className="py-32 flex flex-col items-center justify-center text-center text-muted-foreground/30">
                                    <BrainCircuit size={64} strokeWidth={1} className="mb-6" />
                                    <h4 className="text-lg font-bold mb-2 text-muted-foreground">Architect Standby</h4>
                                    <p className="text-sm max-w-xs text-muted-foreground/60">Select a file from the inbox to begin autonomous knowledge architecture.</p>
                                    <div className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-muted-foreground/60 bg-muted px-4 py-2 rounded border border-border">
                                        <Info size={12} />
                                        Deployment Base: {config?.academicFolderPath || '1-Academic'}
                                    </div>
                                </div>
                            )}

                            {processing && !batchFeed.length && !activePlan && (
                                <div className="py-32 flex flex-col items-center justify-center text-center">
                                    <RefreshCw size={48} className="animate-spin text-primary mb-6" />
                                    <h4 className="text-lg font-bold mb-4 text-foreground">Architecting Knowledge...</h4>
                                    <p className="text-xs text-primary font-mono bg-muted px-4 py-2 rounded border border-border">
                                        {queueStatus?.manual_status?.[selectedInboxFile?.path] || 'The AI is analyzing the document structure...'}
                                    </p>
                                </div>
                            )}

                            {processing && (activePlan || batchFeed.length > 0) && (
                                <div className="mb-8 p-4 rounded bg-muted border border-border flex items-center justify-between  animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <RefreshCw size={20} className="animate-spin text-primary" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-primary">System Working</p>
                                    </div>
                                    <p className="text-[10px] font-mono text-muted-foreground">
                                        {queueStatus?.manual_status?.[selectedInboxFile?.path] || 'Executing Batch...'}
                                    </p>
                                </div>
                            )}

                            {isCurriculumReady && !activePlan && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 p-6 rounded bg-muted/30 border border-border space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Sparkles size={24} className="text-primary animate-pulse" />
                                            <div>
                                                <h4 className="text-sm font-semibold tracking-tight text-foreground">Curriculum Alignment</h4>
                                                <p className="text-xs font-medium text-muted-foreground">OKA has detected a potential curriculum match. Review and edit the metadata below.</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2.5 relative">
                                            <div className="relative group/popover">
                                                <CurriculumPill 
                                                    label="Anchor" 
                                                    value={anchoredHub?.title || 'Standalone'} 
                                                    icon={Database} 
                                                    isEditable={false} 
                                                    isDropdown={true}
                                                />
                                                <div className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border shadow-xl rounded z-[100] p-1.5 hidden group-focus-within/popover:block group-hover/popover:block animate-in fade-in slide-in-from-top-1">
                                                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-tight border-b border-border mb-1 flex items-center justify-between">
                                                        <span>Study Planner Hubs</span>
                                                        <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        <button 
                                                            onClick={() => handleHubSelect('new')}
                                                            className="w-full flex items-center gap-2 p-2 hover:bg-muted text-foreground rounded transition-all text-left"
                                                        >
                                                            <Plus size={12} />
                                                            <span className="text-xs font-semibold uppercase tracking-tight tracking-tight">New Hub (Manual)...</span>
                                                        </button>
                                                        {availableHubs.map(h => (
                                                            <button 
                                                                key={h.id} 
                                                                onClick={() => handleHubSelect(h)}
                                                                className={cn(
                                                                    "w-full flex flex-col p-2 hover:bg-muted rounded transition-all text-left",
                                                                    anchoredHub?.id === h.id && "bg-accent border-l-2 border-primary"
                                                                )}
                                                            >
                                                                <span className="text-[10px] font-bold truncate text-foreground">{h.title}</span>
                                                                <div className="flex items-center gap-2 text-muted-foreground text-[8px] font-bold uppercase mt-1">
                                                                    <span>{h.course || 'No Course'}</span>
                                                                    <span>•</span>
                                                                    <span>Unit {h.unit || '?'}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hub Title — always editable so user can correct AI detection */}
                                            <CurriculumPill 
                                                label="Hub Title" 
                                                value={curriculum.hub_title} 
                                                onChange={v => setCurriculum(p => ({ ...p, hub_title: v }))}
                                                icon={FileEdit} 
                                            />

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

                            {/* Manual Flow View */}
                            {activePlan && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 p-4 rounded bg-muted border border-border flex items-center gap-3">
                                        <Sparkles size={20} className="text-primary" />
                                        <p className="text-xs font-medium text-foreground">Plan generated. Review the integration strategy below and confirm deployment.</p>
                                    </div>

                                    {structuredPlan ? (
                                        <div className="space-y-8">
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
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30">
                                            <Brain size={32} className="mb-4 animate-pulse" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Compiling Architectural Plan...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Autonomous Pipeline View - Tree Structure */}
                            {queueStatus && queueStatus.status !== 'idle' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 p-4 rounded bg-primary border border-primary flex items-center justify-between shadow-lg shadow-primary/20">
                                        <div className="flex items-center gap-3 text-primary-foreground">
                                            <Activity size={18} className="animate-pulse" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Autonomous Execution Active</p>
                                                <p className="text-xs font-medium">{queueStatus?.current_file}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/60">Progress</p>
                                            <p className="text-xs font-bold text-primary-foreground tracking-widest">{queueStatus?.current_batch} / {queueStatus?.total_batches}</p>
                                        </div>
                                    </div>

                                    {/* Real-time Plan Preview (Same as Manual) */}
                                    {queueStatus.plan_raw && (
                                        <div className="mb-12">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 px-1">Architectural Blueprint</h4>
                                            <PlanCardView planRaw={queueStatus.plan_raw} />
                                        </div>
                                    )}
                                    
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 px-1">Deployment Queue</h4>
                                        <BatchTreeView 
                                            batches={queueStatus?.planned_batches || []} 
                                            processedNotes={queueStatus?.processed_notes || []} 
                                        />
                                    </div>
                                </div>
                            )}

                            {batchFeed.length > 0 && (
                                <div className="space-y-6 mt-8 pt-8 border-t border-border">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Deployment Progress</h4>
                                        <span className="text-xs font-bold text-muted-foreground">{currentBatch} / {totalBatches} Batches</span>
                                    </div>
                                    {batchFeed.map(b => (
                                        <div key={b.batch} className="p-6 rounded border border-border bg-muted/20 animate-in fade-in duration-300">
                                             <div className="flex items-center gap-2 mb-4">
                                                 <div className="w-5 h-5 rounded bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                                     {b.batch}
                                                 </div>
                                                <span className={cn("text-xs font-semibold uppercase tracking-tight", b.results.length > 0 ? "text-foreground" : "text-destructive")}>
                                                    {b.results.length > 0 ? "Batch Execution Successful" : "Batch Parsing Failed"}
                                                </span>
                                            </div>
                                            
                                            {b.results.length === 0 && (
                                                <div className="mb-4 mt-2 p-3 rounded bg-destructive/10 border border-destructive/20">
                                                    <p className="text-[11px] text-destructive font-medium mb-3 whitespace-nowrap overflow-hidden text-ellipsis">No OKA Regions detected. structural validation failed.</p>
                                                    <pre className="text-[10px] bg-background border border-border p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 font-mono text-muted-foreground">
                                                        {b.ai_output}
                                                    </pre>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {b.results.map((r: any, i: number) => (
                                                    <div key={i} className="p-3 border border-border rounded bg-background flex items-center gap-3 shadow-sm">
                                                        <div className="p-1.5 bg-muted rounded text-muted-foreground">
                                                            <FileText size={12} />
                                                        </div>
                                                        <span className="text-[11px] font-medium truncate text-foreground">{r.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {isCompleted && (
                                        <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                                            <div className="w-16 h-16 rounded-full bg-muted text-primary flex items-center justify-center mb-6 border border-border shadow-sm">
                                                <ShieldCheck size={32} />
                                            </div>
                                            <h4 className="text-xl font-bold mb-2 text-foreground">Architecture Complete</h4>
                                            <p className="text-sm text-muted-foreground mb-8">All knowledge fragments have been successfully deployed to your vault.</p>
                                            <button onClick={() => navigate('/obsidian')} className="flex items-center justify-center rounded px-4 py-2 text-[12px] font-medium text-muted-foreground bg-background border border-border hover:bg-muted transition-colors">
                                                Go to Vault
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {okaError && (
                                <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
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
            bg: 'bg-muted',
            description: 'Autonomous ingestion engine. Automates the architectural mapping of documents into atomic knowledge clusters.',
            action: () => setActiveAgent('oka'),
            actionText: 'Architect'
        }
    ]

    if (activeAgent === 'oka') return <OkaDashboard onBack={() => setActiveAgent(null)} />

    return (
        <div className="h-full flex flex-col p-16 space-y-10 animate-in fade-in duration-700 bg-background text-foreground overflow-y-auto custom-scrollbar">
            <div className="flex flex-col space-y-2 mb-8 shrink-0">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 border-b border-border pb-4">
                    <span>System</span>
                    <span className="material-symbols-outlined text-[12px]"><ChevronRight size={12}/></span>
                    <span className="text-muted-foreground">Intelligence</span>
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-2">Automata</h1>
                <p className="text-muted-foreground text-[16px] leading-relaxed">Coordinate autonomous agents and high-fidelity synthesis protocols.</p>
            </div>

            <div className="flex-1 flex max-w-3xl mx-auto w-full pt-10">
                {agents.map((agent) => (
                    <div key={agent.id} className="p-8 flex flex-col gap-8 group hover:border-muted-foreground/30 transition-all duration-500 relative overflow-hidden border border-border rounded bg-background shadow-sm w-full h-fit">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                            <agent.icon size={160} strokeWidth={1} className="text-foreground" />
                        </div>
                        
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className={cn("p-4 rounded w-fit border border-border shadow-inner", agent.bg)}>
                                <agent.icon className={cn("w-8 h-8", agent.color)} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-foreground">{agent.title}</h2>
                                <p className="text-muted-foreground text-[13px] leading-relaxed mt-3 font-medium">
                                    {agent.description}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={agent.action}
                            className={cn(
                                "w-full h-12 flex items-center justify-center font-bold uppercase tracking-wider text-[11px] rounded relative z-10 transition-all bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/10",
                            )}
                        >
                            <Zap size={14} className="mr-2" /> INITIALIZE {agent.actionText}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
