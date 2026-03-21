import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Send, Bot, User, Trash2,
    Paperclip, Database, 
    Activity, Zap, 
    Terminal, History, Layout,
    Users,
    Command,
    Search
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface OrchestratorStatus {
    current_prompt: string
    current_plan: string
    active_agents: string[]
    stage: string
    next_agent: string
    logs: string[]
}

export default function OrchestratorPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus>({
        current_prompt: '',
        current_plan: '',
        active_agents: [],
        stage: 'Idle',
        next_agent: '',
        logs: []
    })
    const [activeTab, setActiveTab] = useState<'mission' | 'history'>('mission')
    const [history, setHistory] = useState<{ query: string, response: string, timestamp: string }[]>([])
    const [showLog, setShowLog] = useState(true)
    
    const scrollRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }, [messages, loading, orchestratorStatus.logs])

    // Poll for status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const s = await sidecarApi.getOrchestratorStatus()
                setOrchestratorStatus(s)
            } catch (e) {
                // Ignore silent errors for polling
            }
        }
        
        const interval = setInterval(fetchStatus, 1500)
        fetchStatus()
        return () => clearInterval(interval)
    }, [])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg: Message = { role: 'user', content: input }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        const currentInput = input
        
        setInput('')
        setLoading(true)

        try {
            const res = await sidecarApi.brainstorm(
                currentInput,
                '', // context
                '', // system prompt
                messages.map(m => ({ role: m.role, content: m.content }))
            )

            const assistantMsg: Message = { role: 'assistant', content: res.response }
            setMessages([...newMessages, assistantMsg])
            
            // Add to history
            setHistory(prev => [{
                query: currentInput,
                response: res.response,
                timestamp: new Date().toLocaleTimeString()
            }, ...prev].slice(0, 20))
            
        } catch (err) {
            console.error('Orchestrator Chat failed:', err)
            setMessages([...newMessages, { role: 'assistant', content: 'Error: Failed to communicate with the Orchestrator.' }])
        } finally {
            setLoading(false)
        }
    }

    const suggestions = [
        "Create a master strategy for my week based on my goals.",
        "Synthesize all my research into a technical brief.",
        "Audit my financial records and suggest optimizations.",
        "Check my academics folder and summarize my next tasks."
    ]

    return (
        <div className="flex flex-col h-full w-full bg-background selection:bg-foreground selection:text-background overflow-hidden border-t border-border/40">
            <div className="flex-1 flex min-h-0 w-full overflow-hidden">
                {/* Main Interaction Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Compact Header */}
                    <div className="h-12 border-b border-border/40 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">Mission Interface</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowLog(!showLog)}
                                className={cn("h-8 px-2 text-[10px] font-black uppercase tracking-widest", showLog ? "bg-muted text-foreground" : "text-muted-foreground")}
                            >
                                <Layout className="w-3.5 h-3.5 mr-2" />
                                {showLog ? 'Hide Mission Control' : 'Show Mission Control'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-y-auto custom-scrollbar bg-background/30 w-full" ref={scrollRef}>
                        <div className="p-6 md:p-12 space-y-12 max-w-4xl mx-auto pb-32">
                                {messages.length === 0 && (
                                    <div className="py-24 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="w-16 h-16 rounded-3xl bg-foreground text-background flex items-center justify-center shadow-2xl mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                                            <Command className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-xl font-black uppercase tracking-[0.25em] mb-4 text-foreground">Orchestrator Active</h4>
                                        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] max-w-sm leading-loose mb-12 font-bold opacity-60">
                                            Unified Command Layer for your Knowledge Vault and Specialist Workforce.
                                        </p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setInput(s) }}
                                                    className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/20 hover:bg-foreground hover:text-background border border-border/40 rounded-2xl transition-all duration-300 group"
                                                >
                                                    <span className="flex items-center justify-between">
                                                        {s}
                                                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <div key={i} className={cn(
                                        "flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300", 
                                        msg.role === 'user' ? "items-end" : "items-start"
                                    )}>
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30">
                                                {msg.role === 'user' ? 'Operator' : 'AI Orchestrator'}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "px-6 py-5 rounded-[2rem] text-sm leading-relaxed max-w-[90%] transition-all border", 
                                            msg.role === 'user' 
                                                ? "bg-foreground text-background border-foreground shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] font-medium" 
                                                : "bg-muted/30 text-foreground border-border/40 hover:border-border/80"
                                        )}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex flex-col gap-4 items-start animate-in fade-in duration-300">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 animate-pulse italic">
                                                {orchestratorStatus.stage === 'Idle' || orchestratorStatus.stage === '' ? 'CALCULATING STRATEGY' : orchestratorStatus.stage.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="px-6 py-5 rounded-[2rem] bg-muted/20 border border-dashed border-border/60 text-[11px] font-bold uppercase tracking-widest flex items-center gap-6 shadow-inner text-foreground/40 min-w-[300px]">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1 h-4 bg-foreground/20 animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1 h-4 bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1 h-4 bg-foreground/60 animate-bounce" />
                                            </div>
                                            <span className="animate-pulse">
                                                {orchestratorStatus.logs.length > 0 
                                                    ? orchestratorStatus.logs[orchestratorStatus.logs.length - 1].replace(/\[.*\]\s*\[.*\]\s*/, '')
                                                    : 'Initializing Multi-Agent Handshake...'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-background shrink-0 z-20">
                        <div className="max-w-4xl mx-auto">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                                className="relative flex items-center bg-muted/30 border border-border/40 rounded-[2rem] p-2 hover:bg-muted/40 hover:border-border/60 focus-within:bg-background focus-within:border-foreground/20 focus-within:ring-4 focus-within:ring-foreground/[0.02] transition-all duration-500 group shadow-lg"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="ISSUE AUTONOMOUS DIRECTIVE..."
                                    disabled={loading}
                                    className="flex-1 bg-transparent border-none focus:ring-0 rounded-none text-xs font-bold uppercase tracking-widest px-6 py-4 placeholder:text-foreground/20 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-xl hover:scale-95 active:scale-90 disabled:opacity-20 transition-all shrink-0 group-focus-within:rotate-12"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                            <p className="mt-4 text-center text-[8px] font-black uppercase tracking-[0.3em] text-foreground/20">
                                Restricted Access Layer // Life OS Command Kernel v2.4
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Mission Control / Ops Log */}
                {showLog && (
                    <div className="w-[420px] flex flex-col shrink-0 bg-muted/10 border-l border-border/40 animate-in slide-in-from-right duration-500 overflow-hidden">
                        <div className="h-12 border-b border-border/40 flex items-center px-4 bg-background/50 backdrop-blur-md shrink-0">
                            {[
                                { id: 'mission', label: 'Mission Monitor', icon: Activity },
                                { id: 'history', label: 'Temporal Log', icon: History }
                            ].map((tab) => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 py-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center justify-center gap-2",
                                        activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <tab.icon size={12} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            {activeTab === 'mission' ? (
                                <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
                                    {/* Operational Status Bar */}
                                    <div className="p-6 bg-background border-b border-border/40 grid grid-cols-2 gap-4 shrink-0">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Pulse</p>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full", loading ? "bg-green-500 animate-pulse" : "bg-foreground/20")} />
                                                <span className="text-[10px] font-black uppercase">{loading ? 'Processing' : 'Standby'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-50">Active Stage</p>
                                            <p className="text-[10px] font-black uppercase tracking-tight truncate border-l border-border/60 pl-2">
                                                {orchestratorStatus.stage || "IDLE"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-8 flex-1">
                                        {/* Strategic Plan */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                                                    <Zap className="w-3 h-3" /> Strategic Plan
                                                </h3>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute -inset-0.5 bg-foreground/10 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                                <div className="relative bg-black text-white p-5 rounded-2xl min-h-[160px] border border-white/5 shadow-2xl overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                                                        <Terminal className="w-8 h-8" />
                                                    </div>
                                                    <div className="font-mono text-[10px] leading-relaxed uppercase space-y-2 relative z-10">
                                                        {orchestratorStatus.current_plan ? (
                                                            <div className="text-white/90">
                                                                <span className="text-white/20 mr-2">&gt;</span>
                                                                {orchestratorStatus.current_plan}
                                                            </div>
                                                        ) : (
                                                            <div className="text-white/20 animate-pulse">
                                                                &gt; Awaiting Directive...<br />
                                                                &gt; Knowledge Graph Idle<br />
                                                                &gt; Workforce Standby
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deployment Grid */}
                                        <div className="space-y-4">
                                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                                                <Users className="w-3 h-3" /> Deployed Workforce
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {orchestratorStatus.active_agents.length > 0 ? orchestratorStatus.active_agents.map(a => (
                                                    <div key={a} className="px-3 py-2 bg-foreground text-background text-[9px] font-black rounded-lg uppercase tracking-tight flex items-center gap-2 shadow-sm animate-in zoom-in duration-300">
                                                        <UserCheck size={10} />
                                                        {a}
                                                    </div>
                                                )) : (
                                                    <div className="w-full h-12 rounded-xl border border-dashed border-border/40 flex items-center justify-center opacity-20">
                                                        <span className="text-[9px] font-black uppercase tracking-widest">No Active Sessions</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Real-time Ops Log */}
                                        <div className="space-y-4 flex-1 flex flex-col min-h-0">
                                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                                                <Activity className="w-3 h-3" /> Operational Log
                                            </h3>
                                            <div className="flex-1 min-h-[200px] bg-muted/20 border border-border/40 rounded-2xl overflow-hidden flex flex-col shadow-inner">
                                                <ScrollArea className="flex-1">
                                                    <div className="p-4 font-mono text-[9px] space-y-3 uppercase">
                                                        {orchestratorStatus.logs.length > 0 ? orchestratorStatus.logs.map((log, i) => {
                                                            const isError = log.includes("[ERROR]");
                                                            const isExecuting = log.includes("Executing Tool");
                                                            return (
                                                                <div key={i} className={cn(
                                                                    "flex gap-3 pb-2 border-b border-border/10 last:border-0",
                                                                    isError ? "text-red-500/80" : isExecuting ? "text-foreground" : "text-foreground/40"
                                                                )}>
                                                                    <span className="opacity-20 shrink-0">{i.toString().padStart(2, '0')}</span>
                                                                    <span className="break-all tracking-tight leading-relaxed">{log}</span>
                                                                </div>
                                                            )
                                                        }) : (
                                                            <div className="p-4 opacity-10 space-y-2">
                                                                <p>&gt; KERNEL_INITIALIZED</p>
                                                                <p>&gt; MAPPING_KNOWLEDGE_VAULT</p>
                                                                <p>&gt; WAITING_FOR_OPERATOR</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col overflow-hidden">
                                     <ScrollArea className="flex-1">
                                        <div className="p-6 space-y-4">
                                            {history.length > 0 ? history.map((h, i) => (
                                                <div key={i} className="p-5 rounded-2xl border border-border/40 bg-card hover:border-foreground/20 transition-all group shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">{h.timestamp}</span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-foreground mb-2 uppercase tracking-tight line-clamp-2 leading-relaxed">
                                                        {h.query}
                                                    </p>
                                                    <p className="text-[10px] text-foreground/50 line-clamp-3 font-medium !normal-case leading-relaxed">
                                                        {h.response}
                                                    </p>
                                                </div>
                                            )) : (
                                                <div className="py-32 flex flex-col items-center justify-center text-center opacity-10">
                                                    <History size={40} className="mb-4" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Temporal Vault Empty</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ChevronRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}

function UserCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <polyline points="16 11 18 13 22 9" />
        </svg>
    )
}
