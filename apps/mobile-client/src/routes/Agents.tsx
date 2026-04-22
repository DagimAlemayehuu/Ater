import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { 
    Zap, Brain, ChevronRight, Activity, Bot, 
    Layers, Search, FileText, CheckCircle, 
    ArrowLeft, MoreVertical, Archive, BrainCircuit,
    Info, Sparkles, Database, FileEdit, BookOpen, Tag, Calendar,
    CheckCircle2, XCircle, RefreshCw, Clock, Box, Network,
    Trash2, AlertTriangle, ListChecks, History, PlayCircle,
    ChevronDown, ChevronUp, Loader2, Sparkle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

/* --- Plan Card View Component --- */
function PlanCardView({ planRaw }: { planRaw: string }) {
    const extract = (tag: string) => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's')
        const match = planRaw.match(regex)
        return match ? match[1].trim() : null
    }

    const hubContent = extract('hub_note')
    const atomicContent = extract('atomic_notes')
    const pqContent = extract('pq_note')

    const cleanLink = (text: string) => text.replace(/\[\[(.*?)\]\]/g, '$1').replace(/\*\*/g, '').replace(/\*/g, '')

    return (
        <div className="space-y-6">
            {hubContent && (
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl shadow-sm">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Relational Hub</h4>
                    <p className="text-sm font-bold text-primary flex items-center gap-2">
                        <Network size={14} /> {cleanLink(hubContent)}
                    </p>
                </div>
            )}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-1">Atomic Fragments</h4>
                <div className="grid grid-cols-1 gap-2">
                    {atomicContent?.split('\n').filter(l => l.includes('[[')).map((line, i) => (
                        <div key={i} className="p-4 bg-muted/20 border border-border rounded-xl flex items-center gap-3 group transition-all hover:bg-muted/40">
                            <FileText size={14} className="text-muted-foreground" />
                            <span className="text-xs font-bold truncate text-primary">{cleanLink(line)}</span>
                        </div>
                    ))}
                </div>
            </div>
            {pqContent && (
                <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] mb-2">Pedagogical Layer</h4>
                    <p className="text-[11px] font-medium text-amber-700/80 leading-relaxed italic">{pqContent}</p>
                </div>
            )}
        </div>
    )
}

/* --- OKA Architect Dashboard --- */
function OkaDashboard({ onBack }: { onBack: () => void }) {
    const [inboxFiles, setInboxFiles] = useState<any[]>([])
    const [selectedFile, setSelectedFile] = useState<any>(null)
    const [processing, setProcessing] = useState(false)
    const [step, setStep] = useState<'inbox' | 'analyze' | 'plan' | 'deploy'>('inbox')
    
    // Pipeline State
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [anchoredHub, setAnchoredHub] = useState<any>(null)
    const [curriculum, setCurriculum] = useState({ course: '', unit: '', semester: '', hub_title: '' })
    
    // Batching State
    const [currentBatch, setCurrentBatch] = useState<number>(0)
    const [totalBatches, setTotalBatches] = useState<number>(0)
    const [batchFeed, setBatchFeed] = useState<any[]>([])
    const [isCompleted, setIsCompleted] = useState(false)
    const [status, setStatus] = useState<any>(null)

    useEffect(() => {
        fetchInbox()
        const it = setInterval(fetchStatus, 3000)
        return () => clearInterval(it)
    }, [])

    const fetchInbox = async () => {
        try {
            const res = await sidecarApi.okaListInbox()
            setInboxFiles(res.files || [])
        } catch (e) { console.error(e) }
    }

    const fetchStatus = async () => {
        try {
            const res = await sidecarApi.okaQueueStatus()
            setStatus(res)
        } catch (e) {}
    }

    const handleAnalyze = async () => {
        if (!selectedFile) return
        setProcessing(true)
        try {
            const res = await sidecarApi.okaProcess({ 
                file_path: selectedFile.path
            })
            setAnchoredHub(res.anchored_hub)
            const anchor = res.anchored_hub
            const detected = res.detected_curriculum
            setCurriculum({
                course: anchor?.course || detected?.course || '',
                unit: String(anchor?.unit || detected?.unit || ''),
                semester: anchor?.semester || detected?.semester || '',
                hub_title: anchor?.title || (detected?.hub_title ? ((detected.unit ? detected.unit + ' ' : '') + detected.hub_title + ' Hub') : ''),
            })
            setStep('analyze')
        } catch (e) {
            alert('Analysis Failed')
        } finally {
            setProcessing(false)
        }
    }

    const handleGeneratePlan = async () => {
        setProcessing(true)
        try {
            const res = await sidecarApi.okaGeneratePlan({ 
                file_path: selectedFile.path,
                curriculum: {
                    course: String(curriculum.course || ""),
                    unit: String(curriculum.unit || ""),
                    semester: String(curriculum.semester || ""),
                    hub_title: String(curriculum.hub_title || "")
                },
                target_hub_id: anchoredHub?.id ? String(anchoredHub.id) : undefined
            })
            setActivePlan(res.plan_raw)
            setSessionId(res.session_id)
            setTotalBatches(res.plan_structured?.batches?.length || 1)
            setCurrentBatch(0)
            setStep('plan')
        } catch (e) {
            alert('Generation Failed')
        } finally {
            setProcessing(false)
        }
    }

    const handleConfirm = async () => {
        if (!sessionId) return
        setProcessing(true)
        setStep('deploy')
        
        try {
            let currentHasMore = true;
            let currentLocalBatch = 0;
            
            while (currentHasMore) {
                const command = "Proceed Batch (Auto)";
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
                    results: res.results || []
                }])

                currentHasMore = res.has_more;
                if (currentHasMore) {
                    await new Promise(r => setTimeout(r, 500));
                } else {
                    setIsCompleted(true)
                    break;
                }
            }
        } catch (err: any) { 
            alert('Deployment Error: ' + err.message)
        } finally { 
            setProcessing(false) 
        }
    }

    return (
        <div className="flex flex-col h-full bg-background animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-12 pb-6 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">OKA_ARCHITECT_v23</div>
                    <div className="w-8" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Architect<br/><span className="text-muted-foreground/30">Workspace</span></h1>
                    <div className="flex items-center gap-2 pt-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status?.status === 'processing' ? "bg-amber-500" : "bg-green-500")} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">System Status: {status?.status || 'IDLE'}</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 pb-40">
                    {step === 'inbox' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Pending Ingestion</h3>
                                <Button variant="ghost" size="sm" onClick={async () => {
                                    const res = await sidecarApi.okaPickFileToInbox();
                                    if (res.success) fetchInbox();
                                }} className="h-8 text-[9px] font-black uppercase tracking-widest gap-2 bg-primary/5 text-primary rounded-xl">
                                    <Sparkles size={12} /> Upload Fragment
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {inboxFiles.map((f) => (
                                    <button 
                                        key={f.path}
                                        onClick={() => setSelectedFile(f)}
                                        className={cn(
                                            "p-4 border rounded-2xl text-left transition-all relative overflow-hidden group",
                                            selectedFile?.path === f.path ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-muted/10 hover:border-primary/20"
                                        )}
                                    >
                                        {selectedFile?.path === f.path && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
                                        <div className="flex items-center gap-3 mb-1">
                                            <FileText size={14} className={selectedFile?.path === f.path ? "text-primary" : "text-muted-foreground"} />
                                            <p className="text-sm font-bold truncate text-primary uppercase tracking-tight">{f.name || f.path.split('/').pop()}</p>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/60 truncate pl-6">{f.path}</p>
                                    </button>
                                ))}
                            </div>
                            
                            {selectedFile && (
                                <Button onClick={handleAnalyze} disabled={processing} className="w-full py-8 font-black uppercase tracking-[0.3em] gap-3 shadow-2xl shadow-primary/20 text-xs">
                                    {processing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                    Initialize Analysis
                                </Button>
                            )}
                        </div>
                    )}

                    {step === 'analyze' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 bg-muted/20 border border-border rounded-3xl space-y-6 relative overflow-hidden">
                                <Sparkle className="text-primary/20 absolute -right-4 -top-4" size={100} />
                                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-xl">
                                    <Bot size={28} />
                                </div>
                                <div className="space-y-2 relative z-10">
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Detection Phase</h3>
                                    <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
                                        OKA has processed the file heuristics. Review the detected curriculum alignment below.
                                    </p>
                                </div>
                                
                                <div className="space-y-4 pt-4 border-t border-border/50 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Hub Title</label>
                                        <input value={curriculum.hub_title} onChange={e => setCurriculum({...curriculum, hub_title: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Course</label>
                                        <input value={curriculum.course} onChange={e => setCurriculum({...curriculum, course: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Unit</label>
                                            <input value={curriculum.unit} onChange={e => setCurriculum({...curriculum, unit: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Semester</label>
                                            <input value={curriculum.semester} onChange={e => setCurriculum({...curriculum, semester: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleGeneratePlan} disabled={processing} className="w-full py-8 font-black uppercase tracking-[0.3em] gap-3 shadow-xl text-xs">
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <ChevronRight size={16} />}
                                Architecture Draft
                            </Button>
                        </div>
                    )}

                    {step === 'plan' && activePlan && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <PlanCardView planRaw={activePlan} />
                            <div className="grid grid-cols-1 gap-4">
                                <Button onClick={handleConfirm} disabled={processing} className="w-full py-8 font-black uppercase tracking-[0.3em] gap-3 shadow-2xl shadow-primary/20 text-xs">
                                    {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                    Deploy All Batches
                                </Button>
                                <Button variant="outline" onClick={() => setStep('analyze')} className="w-full py-6 font-black uppercase tracking-[0.2em] border-2 text-[10px]">
                                    Re-Generate Draft
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'deploy' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8 p-6 rounded-[2rem] bg-muted/20 border border-border flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <Activity size={24} className="text-primary animate-pulse" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Deployment Progress</p>
                                        <p className="text-sm font-bold">{currentBatch} / {totalBatches} Batches</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                                    <div className="h-full bg-primary transition-all duration-700 ease-in-out" style={{ width: `${(currentBatch / (totalBatches || 1)) * 100}%` }} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {batchFeed.map(b => (
                                    <div key={b.batch} className="p-5 rounded-2xl border border-border bg-muted/10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5 rounded bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                                {b.batch}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                                                Batch {b.batch} Complete
                                            </span>
                                        </div>
                                        <div className="space-y-2 pl-7">
                                            {b.results.map((r: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                                    <FileText size={12} />
                                                    <span>{r.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {isCompleted && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-700">
                                    <div className="w-20 h-20 bg-primary text-primary-foreground rounded-[2rem] flex items-center justify-center shadow-xl">
                                        <CheckCircle size={40} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black uppercase tracking-tighter">Sync Complete</h2>
                                        <p className="text-xs text-muted-foreground px-8 leading-relaxed font-medium">
                                            Knowledge clusters anchored successfully.
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={onBack} className="px-10 py-6 font-black uppercase tracking-[0.3em] border-2 rounded-xl text-[10px]">
                                        Return to Registry
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

/* --- Main Agents Hub --- */
export default function Agents() {
    const [activeAgent, setActiveAgent] = useState<string | null>(null)
    const [status, setStatus] = useState<any>(null)

    useEffect(() => {
        fetchStatus()
        const it = setInterval(fetchStatus, 5000)
        return () => clearInterval(it)
    }, [])

    const fetchStatus = async () => {
        try {
            const res = await sidecarApi.okaQueueStatus()
            setStatus(res)
        } catch (e) {}
    }

    if (activeAgent === 'oka') return <OkaDashboard onBack={() => setActiveAgent(null)} />

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500 overflow-y-auto">
            <div className="px-6 pt-16 pb-10">
                <nav className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">INTELLIGENCE</span>
                    <ChevronRight size={10} className="text-border" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">AUTOMATA</span>
                </nav>
                
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-10 leading-none">Neural<br/><span className="text-muted-foreground/30">Registry</span></h1>
                
                {/* OKA Card */}
                <div className="relative group p-10 border border-border bg-muted/10 rounded-[2rem] overflow-hidden space-y-10 shadow-sm border-l-8 border-l-primary">
                    <Brain className="text-primary opacity-5 absolute -right-8 -top-8" size={180} strokeWidth={1} />
                    
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-xl">
                                <Bot size={32} />
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">AVAILABILITY</span>
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] font-black uppercase tracking-widest px-3">Standby</Badge>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Knowledge Architect</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                Autonomous agent for data atomization and structural vault anchoring.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 py-6 border-y border-border/40">
                            <div>
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Queue Status</span>
                                <span className="text-xs font-bold uppercase">{status?.pending_count || 0} Batches</span>
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Precision</span>
                                <span className="text-xs font-bold uppercase text-indigo-500">98.2% SOTA</span>
                            </div>
                        </div>
                    </div>

                    <Button onClick={() => setActiveAgent('oka')} className="w-full py-8 font-black uppercase tracking-[0.3em] gap-3 relative z-10 shadow-2xl text-xs rounded-2xl">
                        <Zap size={16} /> Initialize OKA
                    </Button>
                </div>
            </div>
            <div className="h-40 shrink-0" />
        </div>
    )
}
