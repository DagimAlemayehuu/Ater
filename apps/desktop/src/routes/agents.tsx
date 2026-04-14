import React, { useState, useEffect } from 'react'
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
                    "px-2.5 py-1.5 rounded bg-white border border-gray-200 text-xs font-semibold uppercase tracking-tight flex items-center gap-2 transition-all hover:bg-gray-50 hover:border-gray-300",
                    (isDropdown || options.length > 0) && "cursor-pointer"
                )}
            >
                <Icon size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">{label}:</span>
                    {isEditable && options.length === 0 ? (
                        <input 
                            className="bg-transparent border-none focus:outline-none text-[#111827] font-medium min-w-[20px] placeholder:text-gray-300 border-b border-transparent focus:border-gray-400 transition-all"
                            value={value}
                            onChange={(e) => onChange?.(e.target.value)}
                            placeholder="Set..."
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-[#111827] font-medium">{value || 'None'}</span>
                    )}
                </div>
                {(isDropdown || options.length > 0) && <ChevronDown size={14} className="text-gray-400 ml-1" />}
            </div>

            {/* Selection Menu for Pills with Options */}
            {isMenuOpen && options.length > 0 && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-md rounded z-[120] p-1.5 animate-in fade-in slide-in-from-top-1">
                        <div className="px-2 py-1 text-xs font-semibold uppercase text-gray-500 tracking-tight mb-1">{label} Options</div>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                            {options.map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => {
                                        onChange?.(opt);
                                        setIsMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-2 py-1.5 rounded text-sm font-medium transition-all hover:bg-gray-50",
                                        value === opt && "text-[#111827] bg-gray-100"
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-3">
                {hubContent && (
                    <div className="rounded border border-gray-200 bg-white p-5 hover:border-gray-300 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-1.5 bg-gray-100 rounded text-[#111827]">
                                <Brain size={16} />
                            </div>
                            <h4 className="text-xs font-semibold uppercase tracking-tight text-gray-500">Master Unit Hub</h4>
                        </div>
                        <div className="text-sm font-medium text-[#111827] underline decoration-gray-200 underline-offset-4 cursor-default">
                            {cleanLink(hubContent)}
                        </div>
                    </div>
                )}
                {pqContent && (
                    <div className="rounded border border-gray-200 bg-white p-5 hover:border-gray-300 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-1.5 bg-gray-100 rounded text-[#111827]">
                                <ShieldCheck size={16} />
                            </div>
                            <h4 className="text-xs font-semibold uppercase tracking-tight text-gray-500">Mastery Assessment</h4>
                        </div>
                        <div className="text-sm font-medium text-[#111827] underline decoration-gray-200 underline-offset-4 cursor-default">
                            {cleanLink(pqContent)}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Layers size={16} className="text-gray-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-tight text-gray-500">Architectural Fragments</h4>
                </div>
                
                <div className="flex flex-col gap-2">
                    {atomicTree.map((node, i) => (
                        <div 
                            key={i} 
                            style={{ marginLeft: `${node.level * 24}px` }}
                            className={cn(
                                "p-3 rounded border bg-white hover:border-gray-300 hover:bg-gray-50 transition-all relative overflow-hidden group min-w-0 w-full",
                                node.level > 0 ? "border-dashed opacity-90 scale-[0.99] border-gray-200" : "border-solid border-gray-200"
                            )}
                        >
                            {node.level > 0 && (
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-100 group-hover:bg-gray-200 transition-colors" />
                            )}
                            <div className="flex items-center justify-between gap-4 min-w-0">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={cn(
                                        "p-1.5 rounded shrink-0",
                                        node.level === 0 ? "bg-gray-100 text-[#111827]" : "bg-gray-50 text-gray-400"
                                    )}>
                                        <FileText size={14} />
                                    </div>
                                    <div className="font-medium text-sm text-[#111827] underline decoration-transparent group-hover:decoration-gray-200 underline-offset-2 break-words overflow-hidden max-w-full transition-all">
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
        <div className="h-full flex flex-col font-sans bg-white text-[#111827] overflow-hidden p-12">
            <div className="flex items-center justify-between pb-8 shrink-0">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-tight mb-4">
                        <button onClick={onBack} className="hover:text-gray-900 transition-colors">Intelligence</button>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-600">OKA Dashboard</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#111827]">Obsidian Knowledge Architect</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-tight text-gray-700 text-gray-500">
                        <span>Auto-Ingest</span>
                        <button 
                            onClick={toggleAutoDeploy}
                            className={cn("relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none", config?.autoDeploy ? 'bg-[#111827]' : 'bg-gray-300')}
                        >
                            <span className={cn("pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white  ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-4' : 'translate-x-0')} />
                        </button>
                    </div>
                    <button onClick={() => { fetchInbox(); fetchStatus(); }} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-gray-700 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                        <RefreshCw size={14} className="mr-2" /> Sync
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="w-[320px] flex flex-col gap-6 shrink-0 overflow-hidden">
                    <div className="rounded border border-gray-200 bg-white p-5  shrink-0">
                        <h3 className="text-xs font-semibold uppercase tracking-tight text-gray-500 mb-4">Pipeline Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", queueStatus?.status !== 'idle' ? "bg-black animate-pulse" : "bg-gray-300")} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{queueStatus?.status || 'Idle'}</span>
                                </div>
                                <span className="text-xs font-medium text-gray-500">{queueStatus?.pending_count || 0} Pending</span>
                            </div>
                            {queueStatus?.status !== 'idle' && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-gray-500 truncate">{queueStatus?.current_file}</p>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-black transition-all duration-500" style={{ width: `${(queueStatus?.current_batch / (queueStatus?.total_batches || 1)) * 100}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 border border-gray-200 rounded bg-white overflow-hidden flex flex-col ">
                        <div className="p-3 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-tight text-gray-500">Inbox</h3>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 text-[#111827] rounded">{inboxFiles.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {loadingInbox ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-12 rounded-md bg-gray-100 animate-pulse" />
                                ))
                            ) : inboxFiles.length > 0 ? (
                                inboxFiles.map(f => (
                                    <div 
                                        key={f.path} 
                                        onClick={() => { setSelectedInboxFile(f); setOkaError(null); setActivePlan(null); setIsAwaitingConfirmation(false); setIsCurriculumReady(false); }}
                                        className={cn(
                                            "p-3 rounded-md border text-[11px] cursor-pointer transition-all", 
                                            selectedInboxFile?.path === f.path ? "bg-[#111827] text-white border-[#111827] " : "bg-white hover:bg-gray-50 border-transparent text-gray-700"
                                        )}
                                    >
                                        <p className="font-bold truncate">{f.name}</p>
                                        <p className={cn("text-[9px] truncate mt-1", selectedInboxFile?.path === f.path ? "text-gray-300" : "text-gray-400")}>{f.path}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-gray-300">
                                    <Archive size={32} className="mx-auto mb-2" />
                                    <p className="text-xs font-semibold uppercase tracking-tight text-gray-700">Empty Inbox</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col rounded border border-gray-200 bg-white  overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-200 rounded text-black">
                                <Bot className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-bold truncate text-gray-900">
                                {selectedInboxFile?.name || 'Architect Workspace'}
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {selectedInboxFile && !isCurriculumReady && !isAwaitingConfirmation && !isAwaitingNextBatch && !isCompleted && (
                                <button onClick={() => processSelectedFile()} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-gray-700 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                    Analyze File
                                </button>
                            )}
                            {isCurriculumReady && !isAwaitingConfirmation && !isCompleted && (
                                <button onClick={startPlanning} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-gray-700 text-white border border-[#111827] bg-[#111827] hover:bg-black transition-colors  disabled:opacity-50">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <ChevronRight className="mr-2" size={12} />}
                                    Continue to Plan
                                </button>
                            )}
                            {isAwaitingConfirmation && (
                                <button onClick={confirmDeployment} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-gray-700 text-white border border-[#111827] bg-[#111827] hover:bg-black transition-colors  disabled:opacity-50">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <ShieldCheck className="mr-2" size={12} />}
                                    Confirm Plan & Run Batch 1
                                </button>
                            )}
                            {isAwaitingNextBatch && (
                                <button onClick={confirmDeployment} disabled={processing} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-white border border-[#111827] bg-[#111827] transition-colors disabled:opacity-50 hover:bg-black">
                                    {processing ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap className="mr-2" size={12} />}
                                    Proceed Batch {currentBatch + 1} of {totalBatches}
                                </button>
                            )}
                            {isCompleted && (
                                <button onClick={resetOkaSession} className="flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-tight text-gray-700 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                                    Reset Workspace
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-8 max-w-4xl mx-auto">
                            {!selectedInboxFile && !processing && (
                                <div className="py-32 flex flex-col items-center justify-center text-center text-gray-400">
                                    <BrainCircuit size={64} strokeWidth={1} className="mb-6" />
                                    <h4 className="text-lg font-bold mb-2 text-gray-700">Architect Standby</h4>
                                    <p className="text-sm max-w-xs text-gray-500">Select a file from the inbox to begin autonomous knowledge architecture.</p>
                                    <div className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-tight text-gray-500 bg-gray-50 px-4 py-2 rounded border border-gray-200">
                                        <Info size={12} />
                                        Deployment Base: {config?.academicFolderPath || '1-Academic'}
                                    </div>
                                </div>
                            )}

                            {processing && !batchFeed.length && !activePlan && (
                                <div className="py-32 flex flex-col items-center justify-center text-center">
                                    <RefreshCw size={48} className="animate-spin text-[#111827] mb-6" />
                                    <h4 className="text-lg font-bold mb-4">Architecting Knowledge...</h4>
                                    <p className="text-xs text-[#111827] font-mono bg-gray-100 px-4 py-2 rounded border border-gray-200">
                                        {queueStatus?.manual_status?.[selectedInboxFile?.path] || 'The AI is analyzing the document structure...'}
                                    </p>
                                </div>
                            )}

                            {processing && (activePlan || batchFeed.length > 0) && (
                                <div className="mb-8 p-4 rounded bg-gray-100 border border-gray-300 flex items-center justify-between  animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <RefreshCw size={20} className="animate-spin text-[#111827]" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-[#111827]">System Working</p>
                                    </div>
                                    <p className="text-[10px] font-mono text-gray-700">
                                        {queueStatus?.manual_status?.[selectedInboxFile?.path] || 'Executing Batch...'}
                                    </p>
                                </div>
                            )}

                            {isCurriculumReady && !activePlan && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-8 p-6 rounded bg-gray-50 border border-gray-200 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Sparkles size={24} className="text-[#111827] animate-pulse" />
                                            <div>
                                                <h4 className="text-sm font-semibold tracking-tight text-[#111827]">Curriculum Alignment</h4>
                                                <p className="text-xs font-medium text-gray-500">OKA has detected a potential curriculum match. Review and edit the metadata below.</p>
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
                                                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded z-[100] p-1.5 hidden group-focus-within/popover:block group-hover/popover:block animate-in fade-in slide-in-from-top-1">
                                                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase text-gray-500 tracking-tight border-b border-gray-100 mb-1 flex items-center justify-between">
                                                        <span>Study Planner Hubs</span>
                                                        <div className="size-1.5 rounded-full bg-black animate-pulse" />
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        <button 
                                                            onClick={() => handleHubSelect('new')}
                                                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 text-[#111827] rounded transition-all text-left"
                                                        >
                                                            <Plus size={12} />
                                                            <span className="text-xs font-semibold uppercase tracking-tight text-gray-700 tracking-tight">New Hub (Manual)...</span>
                                                        </button>
                                                        {availableHubs.map(h => (
                                                            <button 
                                                                key={h.id} 
                                                                onClick={() => handleHubSelect(h)}
                                                                className={cn(
                                                                    "w-full flex flex-col p-2 hover:bg-gray-50 rounded transition-all text-left",
                                                                    anchoredHub?.id === h.id && "bg-gray-100 border-l-2 border-[#111827]"
                                                                )}
                                                            >
                                                                <span className="text-[10px] font-bold truncate text-gray-900">{h.title}</span>
                                                                <div className="flex items-center gap-2 text-gray-400 text-[8px] font-bold uppercase mt-1">
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
                                    <div className="mb-8 p-4 rounded bg-gray-50 border border-gray-200 flex items-center gap-3">
                                        <Sparkles size={20} className="text-[#111827]" />
                                        <p className="text-xs font-medium text-gray-900">Plan generated. Review the integration strategy below and confirm deployment.</p>
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
                                        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                                            <Brain size={32} className="mb-4 animate-pulse" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Compiling Architectural Plan...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {batchFeed.length > 0 && (
                                <div className="space-y-6 mt-8 pt-8 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900">Deployment Progress</h4>
                                        <span className="text-xs font-bold text-gray-500">{currentBatch} / {totalBatches} Batches</span>
                                    </div>
                                    {batchFeed.map(b => (
                                        <div key={b.batch} className="p-6 rounded border border-gray-200 bg-gray-50 animate-in fade-in duration-300">
                                             <div className="flex items-center gap-2 mb-4">
                                                 <div className="w-5 h-5 rounded bg-[#111827] text-[10px] font-bold text-white flex items-center justify-center">
                                                     {b.batch}
                                                 </div>
                                                <span className={cn("text-xs font-semibold uppercase tracking-tight", b.results.length > 0 ? "text-[#111827]" : "text-red-500")}>
                                                    {b.results.length > 0 ? "Batch Execution Successful" : "Batch Parsing Failed"}
                                                </span>
                                            </div>
                                            
                                            {b.results.length === 0 && (
                                                <div className="mb-4 mt-2 p-3 rounded bg-red-50 border border-red-200">
                                                    <p className="text-[11px] text-red-600 font-medium mb-3 whitespace-nowrap overflow-hidden text-ellipsis">No OKA v8.0 START_NOTE/END_NOTE regions detected. AI output failed structural validation. Review raw output below:</p>
                                                    <pre className="text-[10px] bg-white border border-gray-200 p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40 font-mono text-gray-700">
                                                        {b.ai_output}
                                                    </pre>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {b.results.map((r: any, i: number) => (
                                                    <div key={i} className="p-3 border border-gray-200 rounded bg-white flex items-center gap-3 ">
                                                        <div className="p-1.5 bg-gray-100 rounded text-gray-500">
                                                            <FileText size={12} />
                                                        </div>
                                                        <span className="text-[11px] font-medium truncate text-gray-900">{r.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {isCompleted && (
                                        <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 text-[#111827] flex items-center justify-center mb-6 border border-gray-200">
                                                <ShieldCheck size={32} />
                                            </div>
                                            <h4 className="text-xl font-bold mb-2 text-gray-900">Architecture Complete</h4>
                                            <p className="text-sm text-gray-500 mb-8">All knowledge fragments have been successfully deployed to your vault.</p>
                                            <button onClick={() => navigate('/obsidian')} className="flex items-center justify-center rounded px-4 py-2 text-[12px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                                                Go to Vault
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {okaError && (
                                <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
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
            color: 'text-gray-900',
            bg: 'bg-gray-100',
            description: 'Autonomous ingestion engine. Automates the architectural mapping of documents into atomic knowledge clusters.',
            action: () => setActiveAgent('oka'),
            actionText: 'Architect'
        }
    ]

    if (activeAgent === 'oka') return <OkaDashboard onBack={() => setActiveAgent(null)} />

    return (
        <div className="h-full flex flex-col p-16 space-y-10 animate-in fade-in duration-700 bg-white text-[#111827] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col space-y-2 mb-8 shrink-0">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-4">
                    <span>System</span>
                    <span className="material-symbols-outlined text-[12px]"><ChevronRight size={12}/></span>
                    <span className="text-gray-600">Intelligence</span>
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight text-[#111827] leading-tight mb-2">Automata</h1>
                <p className="text-gray-600 text-[16px] leading-relaxed">Coordinate autonomous agents and high-fidelity synthesis protocols.</p>
            </div>

            <div className="flex-1 flex max-w-3xl mx-auto w-full pt-10">
                {agents.map((agent) => (
                    <div key={agent.id} className="p-8 flex flex-col gap-8 group hover:border-gray-400 transition-all duration-500 relative overflow-hidden  border border-gray-200 rounded bg-white w-full h-fit">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                            <agent.icon size={160} strokeWidth={1} className="text-black" />
                        </div>
                        
                        <div className="flex flex-col gap-6 relative z-10">
                            <div className={cn("p-4 rounded w-fit border border-gray-200", agent.bg)}>
                                <agent.icon className={cn("w-8 h-8", agent.color)} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-gray-900">{agent.title}</h2>
                                <p className="text-gray-500 text-[13px] leading-relaxed mt-3 font-medium">
                                    {agent.description}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={agent.action}
                            className={cn(
                                "w-full h-12 flex items-center justify-center font-bold uppercase tracking-wider text-[11px] rounded relative z-10 transition-all bg-[#111827] text-white hover:bg-black",
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
