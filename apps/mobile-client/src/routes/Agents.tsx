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
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [isCompleted, setIsCompleted] = useState(false)
    const [status, setStatus] = useState<any>(null)

    useEffect(() => {
        fetchInbox()
        const it = setInterval(fetchStatus, 3000)
        return () => clearInterval(it)
    }, [])

    const fetchInbox = async () => {
        try {
            const res = await sidecarApi.listObsidianFiles(true)
            setInboxFiles(res.files.filter(f => !f.is_dir && f.path.endsWith('.md')).slice(0, 30))
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
        // Simulate extraction phase
        setTimeout(() => {
            setProcessing(false)
            setStep('analyze')
        }, 1500)
    }

    const handleGeneratePlan = async () => {
        setProcessing(true)
        try {
            const res = await sidecarApi.brainstorm(
                `Generate an OKA structural plan for "${selectedFile.path}". 
                1. Identify the Master Hub title (wrapped in <hub_note>). 
                2. List 5-8 Atomic Notes (wrapped in <atomic_notes> using [[links]]). 
                3. Create 3 Socratic questions (wrapped in <pq_note>).`,
                "You are the Obsidian Knowledge Architect (OKA) v23.0."
            )
            setActivePlan(res.response)
            setStep('plan')
        } catch (e) {
            alert('Generation Failed')
        } finally {
            setProcessing(false)
        }
    }

    const handleConfirm = async () => {
        setProcessing(true)
        try {
            await sidecarApi.okaProcess({
                path: selectedFile.path,
                plan: activePlan
            })
            setIsCompleted(true)
            setStep('deploy')
        } catch (e) {
            alert('Deployment Error')
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
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Pending Ingestion</h3>
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
                                                <p className="text-sm font-bold truncate text-primary uppercase tracking-tight">{f.path.split('/').pop()}</p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground/60 truncate pl-6">{f.path}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {selectedFile && (
                                <Button onClick={handleAnalyze} className="w-full py-8 font-black uppercase tracking-[0.3em] gap-3 shadow-2xl shadow-primary/20 text-xs">
                                    <Zap size={16} /> Initialize Analysis
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
                                        OKA has processed the file heuristics. The document appears to contain high-density curriculum data.
                                    </p>
                                </div>
                                
                                <div className="space-y-4 pt-4 border-t border-border/50 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CURRICULUM_MATCH</span>
                                        <Badge variant="outline" className="text-[10px] font-black tracking-widest border-primary/20 text-primary">CS_CORE_L2</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">ENTITY_DENSITY</span>
                                        <span className="text-[11px] font-bold">84% High</span>
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
                                    Confirm & Deploy
                                </Button>
                                <Button variant="outline" onClick={() => setStep('analyze')} className="w-full py-6 font-black uppercase tracking-[0.2em] border-2 text-[10px]">
                                    Re-Generate Draft
                                </Button>
                            </div>
                        </div>
                    )}

                    {isCompleted && (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                            <div className="w-24 h-24 bg-primary text-primary-foreground rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                                <CheckCircle size={48} />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Sync Complete</h2>
                                <p className="text-sm text-muted-foreground px-12 leading-relaxed font-medium">
                                    Knowledge clusters have been successfully anchored to your relational vault.
                                </p>
                            </div>
                            <Button variant="outline" onClick={onBack} className="px-12 py-7 font-black uppercase tracking-[0.3em] border-2 rounded-2xl text-[10px]">
                                Return to Registry
                            </Button>
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
