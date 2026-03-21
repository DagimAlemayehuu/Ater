import { useState, useRef, useEffect } from 'react'
import { 
    Send, Bot, User, Trash2, RefreshCw, 
    Sparkles, Paperclip, X, Database, 
    Activity, Layers, UserCheck, Zap, 
    ChevronRight, Terminal
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThemeSwitch } from '@/components/theme-switch'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'

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
    const [attachedFile, setAttachedFile] = useState<{ name: string, uri: string } | null>(null)
    const [uploading, setUploading] = useState(false)
    const [syncStatus, setSyncStatus] = useState({ status: 'idle', message: 'Local Vault Memory', progress: 0, total: 0 })
    const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus>({
        current_prompt: '',
        current_plan: '',
        active_agents: [],
        stage: 'Idle',
        next_agent: '',
        logs: []
    })
    
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, loading])

    // Poll for status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const s = await sidecarApi.getOrchestratorStatus()
                setOrchestratorStatus(s)
                const rs = await sidecarApi.getRagSyncStatus()
                setSyncStatus(rs)
            } catch (e) {
                // Ignore silent errors for polling
            }
        }
        
        const interval = setInterval(fetchStatus, 2000)
        fetchStatus()
        return () => clearInterval(interval)
    }, [])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg: Message = { role: 'user', content: input }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        const currentInput = input
        const currentFileUri = attachedFile?.uri
        
        setInput('')
        setAttachedFile(null)
        setLoading(true)

        try {
            const res = await sidecarApi.brainstorm(
                currentInput,
                '', // context
                '', // system instruction removed
                messages.map(m => ({ role: m.role, content: m.content })),
                currentFileUri
            )

            setMessages([...newMessages, { role: 'assistant', content: res.response }])
        } catch (err) {
            console.error('Orchestrator Chat failed:', err)
            setMessages([...newMessages, { role: 'assistant', content: 'Error: Failed to communicate with the Orchestrator.' }])
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const res = await sidecarApi.aiUpload(file)
            setAttachedFile({ name: res.name, uri: res.file_uri })
        } catch (err) {
            console.error('File upload failed:', err)
        } finally {
            setUploading(false)
        }
    }

    const suggestions = [
        "Create a master strategy for my week based on my goals.",
        "Synthesize all my research into a technical brief.",
        "Audit my financial records and suggest optimizations.",
        "Check my academics folder and summarize my next tasks."
    ]

    return (
        <>
            <Header>
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                </div>
            </Header>
            <Main>
                <div className="flex flex-col h-full space-y-6 md:flex w-full mx-auto animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Life OS Orchestrator</h2>
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5">Unified Strategic Command Centre</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "px-3 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg border bg-muted/30",
                                orchestratorStatus.stage !== 'Idle' ? "animate-pulse border-primary/20 text-primary" : "text-muted-foreground"
                            )}>
                                <Activity size={12} />
                                <span>{orchestratorStatus.stage}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 flex gap-6 pb-6">
                        {/* Main Interaction Area */}
                        <div className="flex-1 flex flex-col gap-6 min-w-0">
                            <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden bg-background relative">
                                {/* Chat Area */}
                                <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                                    <div className="space-y-6 max-w-4xl mx-auto">
                                        {messages.length === 0 && (
                                            <div className="py-20 flex flex-col items-center justify-center text-center">
                                                <div className="p-4 rounded-full bg-primary/5 mb-6">
                                                    <Zap className="w-12 h-12 text-primary/40" />
                                                </div>
                                                <h4 className="text-lg font-black uppercase tracking-widest mb-2">Command Interface Ready</h4>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider max-w-md leading-relaxed mb-8 font-medium">
                                                    Master Planner Active. Accessing 8 Specialized Units and Your Knowledge Vault.
                                                </p>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                                    {suggestions.map((s, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => { setInput(s); setTimeout(() => handleSend(), 50) }}
                                                            className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/40 hover:bg-muted border border-border/50 rounded-xl transition-all duration-200"
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {messages.map((msg, i) => (
                                            <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-1", msg.role === 'user' ? "bg-foreground text-background font-black" : "bg-muted text-foreground")}>
                                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                                </div>
                                                <div className={cn("flex flex-col gap-1.5 max-w-[85%]", msg.role === 'user' ? "items-end" : "")}>
                                                    <div className={cn(
                                                        "px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm", 
                                                        msg.role === 'user' ? "bg-foreground text-background rounded-tr-none font-medium" : "bg-muted/50 border rounded-tl-none prose prose-slate dark:prose-invert max-w-none font-sans"
                                                    )}>
                                                        {msg.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown> : msg.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {loading && (
                                            <div className="flex gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border mt-1">
                                                    <Bot size={16} className="text-foreground animate-pulse" />
                                                </div>
                                                <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-muted/30 border text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                                    <RefreshCw size={14} className="animate-spin text-primary" />
                                                    <span>Calculating Strategy...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Input Area */}
                                <div className="p-4 bg-background border-t">
                                    <div className="max-w-4xl mx-auto">
                                        <div className="relative flex items-end gap-2 bg-muted/30 border rounded-xl p-2 focus-within:ring-1 focus-within:ring-foreground/20 transition-all">
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0 mb-0.5"
                                            >
                                                <Paperclip size={18} />
                                            </button>
                                            <Textarea
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                                                placeholder="Deploy command to the workforce..."
                                                className="min-h-[50px] max-h-[200px] w-full bg-transparent border-none focus-visible:ring-0 rounded-none text-sm p-2.5 resize-none custom-scrollbar"
                                            />
                                            <button
                                                onClick={handleSend}
                                                disabled={!input.trim() || loading || uploading}
                                                className="p-3 rounded-lg bg-foreground text-background shadow hover:bg-foreground/90 disabled:opacity-50 transition-colors shrink-0 mb-0.5"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Sidebar */}
                        <div className="w-[320px] flex flex-col gap-6 shrink-0">
                            {/* Mission Status */}
                            <div className="rounded-xl border bg-card p-5 space-y-6 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <Terminal size={60} />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] border-b pb-2">Mission Control</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 flex items-center gap-2">
                                            <Sparkles size={10} /> Live Prompt
                                        </p>
                                        <p className="text-[11px] font-semibold text-foreground line-clamp-2 bg-muted/30 p-2 rounded border">
                                            {orchestratorStatus.current_prompt || "Waiting for signal..."}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 flex items-center gap-2">
                                            <Layers size={10} /> Strategic Plan
                                        </p>
                                        <div className="text-[11px] font-medium text-foreground bg-black text-white p-3 rounded-xl min-h-[80px] font-mono leading-relaxed border">
                                            {orchestratorStatus.current_plan || "> Idle System"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-muted/30 p-3 rounded-xl border">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.1em] mb-1">Active Agents</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {orchestratorStatus.active_agents.length > 0 ? orchestratorStatus.active_agents.map(a => (
                                                    <span key={a} className="px-1.5 py-0.5 bg-foreground text-background text-[9px] font-bold rounded">{a}</span>
                                                )) : <span className="text-[10px] font-bold text-muted-foreground/50">None</span>}
                                            </div>
                                        </div>
                                        <div className="bg-muted/30 p-3 rounded-xl border">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.1em] mb-1">Next Sequence</p>
                                            <p className="text-[11px] font-black uppercase">{orchestratorStatus.next_agent || "Ready"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Internal Logs */}
                            <div className="flex-1 min-h-[200px] flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b bg-muted/5 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest">Internal Sentry Logs</h3>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOrchestratorStatus(p => ({ ...p, logs: [] }))}>
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1 bg-black p-4">
                                    <div className="font-mono text-[9px] text-white/80 space-y-1.5 leading-tight uppercase font-medium">
                                        {orchestratorStatus.logs.length > 0 ? orchestratorStatus.logs.map((log, i) => (
                                            <p key={i} className="flex gap-2">
                                                <span className="text-white/30 shrink-0">[{i}]</span>
                                                <span>{log}</span>
                                            </p>
                                        )) : (
                                            <>
                                                <p className="text-white/40">SCNR: HEURISTICS_LOADED</p>
                                                <p className="text-white/40">RAG: CHROMA_ACTIVE (V1.2)</p>
                                                <p className="text-white/40">WF: 8_SPECIALISTS_READY</p>
                                                <p className="animate-pulse">_</p>
                                            </>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>
            </Main>
        </>
    )
}
