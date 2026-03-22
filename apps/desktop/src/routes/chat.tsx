import { useState, useRef, useEffect } from 'react'
import { 
    Send, Bot, User, Trash2,
    Zap, Activity, History, 
    Layout, Search, Trash
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

interface HistoryItem {
    id: string
    query: string
    response: string
    timestamp: string
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
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [showLog, setShowLog] = useState(true)
    const [configError, setConfigError] = useState<string | null>(null)
    
    const scrollRef = useRef<HTMLDivElement>(null)

    // Load history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('orchestrator_history')
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory))
            } catch (e) {
                console.error('Failed to parse history', e)
            }
        }
    }, [])

    // Save history to localStorage
    useEffect(() => {
        localStorage.setItem('orchestrator_history', JSON.stringify(history))
    }, [history])

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
            setConfigError(null)
            
            // Add to history
            const newItem: HistoryItem = {
                id: crypto.randomUUID(),
                query: currentInput,
                response: res.response,
                timestamp: new Date().toLocaleString()
            }
            setHistory(prev => [newItem, ...prev].slice(0, 50))
            
        } catch (err: any) {
            console.error('Orchestrator Chat failed:', err)
            const errMsg = err?.message || 'Unknown error'
            setConfigError(errMsg)
            setMessages([...newMessages, { 
                role: 'assistant', 
                content: `**Error**\n\n${errMsg}` 
            }])
        } finally {
            setLoading(false)
        }
    }

    const deleteHistoryItem = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id))
    }

    const clearHistory = () => {
        if (confirm('Clear all chat history?')) {
            setHistory([])
        }
    }

    const suggestions = [
        "Strategize my week based on goals",
        "Summarize my research brief",
        "Audit my financial records",
        "Check my academic deadlines"
    ]

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            <div className="flex-1 flex min-h-0 w-full overflow-hidden">
                {/* Main Interaction Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-background shrink-0">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold tracking-tight">Orchestrator</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowLog(!showLog)}
                                className={cn("h-8 text-xs", showLog ? "bg-muted text-foreground" : "text-muted-foreground")}
                            >
                                <Layout className="w-3.5 h-3.5 mr-2" />
                                {showLog ? 'Hide Mission Control' : 'Show Mission Control'}
                            </Button>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {configError && (
                        <div className="shrink-0 bg-destructive/10 border-b border-destructive/20 px-6 py-2 flex items-center justify-between gap-4">
                            <p className="text-xs text-destructive truncate flex-1">
                                {configError}
                            </p>
                            <button onClick={() => setConfigError(null)} className="text-destructive/60 hover:text-destructive text-[10px] font-bold">Dismiss</button>
                        </div>
                    )}

                    <div className="flex-1 relative overflow-y-auto custom-scrollbar w-full" ref={scrollRef}>
                        <div className="p-6 md:p-8 space-y-8 max-w-3xl mx-auto pb-32">
                                {messages.length === 0 && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-xl font-bold mb-2">How can I help you?</h2>
                                        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                                            Ask anything about your goals, research, or system.
                                        </p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setInput(s) }}
                                                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground bg-muted/40 hover:bg-muted border border-border/50 rounded-lg transition-all"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <div key={i} className={cn(
                                        "flex flex-col gap-2", 
                                        msg.role === 'user' ? "items-end" : "items-start"
                                    )}>
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                {msg.role === 'user' ? 'You' : 'Orchestrator'}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "px-4 py-3 rounded-lg text-sm leading-relaxed max-w-[85%] border", 
                                            msg.role === 'user' 
                                                ? "bg-primary text-primary-foreground border-primary" 
                                                : "bg-muted/50 text-foreground border-border/50"
                                        )}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex flex-col gap-2 items-start">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                Processing...
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 rounded-lg bg-muted/30 border border-dashed border-border text-xs text-muted-foreground min-w-[200px]">
                                            {orchestratorStatus.logs.length > 0 
                                                ? orchestratorStatus.logs[orchestratorStatus.logs.length - 1].replace(/\[.*\]\s*\[.*\]\s*/, '')
                                                : 'Starting operations...'}
                                        </div>
                                    </div>
                                )}
                            </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-background border-t shrink-0">
                        <div className="max-w-3xl mx-auto">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                                className="relative flex items-center bg-muted/50 border border-border rounded-lg p-1.5 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-sm"
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={loading}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 py-2 placeholder:text-muted-foreground/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all shrink-0"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Column: Mission Control */}
                {showLog && (
                    <div className="w-[380px] flex flex-col shrink-0 bg-muted/10 border-l border-border/40 animate-in slide-in-from-right duration-300">
                        <div className="h-14 border-b border-border/40 flex items-center px-1 bg-background shrink-0">
                            {[
                                { id: 'mission', label: 'Mission', icon: Activity },
                                { id: 'history', label: 'History', icon: History }
                            ].map((tab) => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex-1 py-4 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-2",
                                        activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            {activeTab === 'mission' ? (
                                <div className="h-full flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full", loading ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                                                <span className="text-xs font-medium">{loading ? 'Active' : 'Standby'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stage</p>
                                            <p className="text-xs font-medium truncate">{orchestratorStatus.stage || "Idle"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Strategic Plan</h3>
                                        <div className="p-4 bg-background border rounded-lg min-h-[100px] text-xs leading-relaxed">
                                            {orchestratorStatus.current_plan ? (
                                                <p>{orchestratorStatus.current_plan}</p>
                                            ) : (
                                                <p className="text-muted-foreground/50">No active plan.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Deployed Agents</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {orchestratorStatus.active_agents.length > 0 ? orchestratorStatus.active_agents.map(a => (
                                                <div key={a} className="px-2 py-1 bg-muted border rounded-md text-[10px] font-medium flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                                    {a}
                                                </div>
                                            )) : (
                                                <p className="text-xs text-muted-foreground/50">No active agents.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1 flex flex-col min-h-0">
                                        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Operational Log</h3>
                                        <div className="flex-1 min-h-[150px] bg-muted/20 border border-border/40 rounded-lg overflow-hidden flex flex-col">
                                            <ScrollArea className="flex-1">
                                                <div className="p-3 font-mono text-[10px] space-y-2">
                                                    {orchestratorStatus.logs.length > 0 ? orchestratorStatus.logs.map((log, i) => (
                                                        <div key={i} className="flex gap-2 text-muted-foreground border-b border-border/5 pb-1 last:border-0">
                                                            <span className="opacity-30 shrink-0">{i + 1}</span>
                                                            <span className="break-all">{log.replace(/\[.*\]\s*/, '')}</span>
                                                        </div>
                                                    )) : (
                                                        <p className="text-muted-foreground/30 italic">Logs will appear here...</p>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col overflow-hidden">
                                     <div className="p-4 border-b flex justify-between items-center bg-muted/5">
                                         <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Session History</span>
                                         {history.length > 0 && (
                                             <Button variant="ghost" size="sm" onClick={clearHistory} className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/5">
                                                 Clear All
                                             </Button>
                                         )}
                                     </div>
                                     <ScrollArea className="flex-1">
                                        <div className="p-4 space-y-3">
                                            {history.length > 0 ? history.map((h) => (
                                                <div key={h.id} className="p-3 rounded-lg border bg-card hover:border-primary/30 transition-all group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[9px] font-medium text-muted-foreground">{h.timestamp}</span>
                                                        <button onClick={() => deleteHistoryItem(h.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all">
                                                            <Trash size={12} />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs font-semibold mb-1 truncate">{h.query}</p>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                        {h.response}
                                                    </p>
                                                </div>
                                            )) : (
                                                <div className="py-24 text-center text-muted-foreground/30">
                                                    <History size={32} className="mx-auto mb-2 opacity-20" />
                                                    <p className="text-xs font-medium">No history found</p>
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
