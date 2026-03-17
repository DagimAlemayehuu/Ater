import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, RefreshCw } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThemeSwitch } from '@/components/theme-switch'
import type { LucideIcon } from 'lucide-react'

interface Message {
    role: 'user' | 'model'
    content: string
}

interface AgentConsoleProps {
    agentId: string
    name: string
    role: string
    description: string
    icon: LucideIcon
    status: string
    suggestions?: string[]
}

export default function AgentConsole({ agentId, name, role, description, icon: Icon, status, suggestions }: AgentConsoleProps) {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const handleSend = async (forcedQuery?: string) => {
        const text = forcedQuery || query
        if (!text.trim() || loading) return

        const userMsg: Message = { role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        if (!forcedQuery) setQuery('')
        setLoading(true)

        try {
            let res: { response: string }
            
            // Route to specific API method based on agentId
            switch (agentId) {
                case 'financer':
                    res = await sidecarApi.chatWithFinancer(text, messages)
                    break
                case 'scout':
                    res = await sidecarApi.chatWithScout(text, messages)
                    break
                case 'scribe':
                    res = await sidecarApi.chatWithScribe(text, messages)
                    break
                case 'architect':
                    res = await sidecarApi.chatWithArchitect(text, messages)
                    break
                case 'auditor':
                    res = await sidecarApi.chatWithAuditor(text, messages)
                    break
                default:
                    res = await sidecarApi.chatWithCoach(text, messages) // Fallback
            }
            
            const aiMsg: Message = { role: 'model', content: res.response }
            setMessages(prev => [...prev, aiMsg])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', content: `Error: ${error.message}` }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 p-4 lg:p-8 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/agents')} className="p-2 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight leading-none">{name}</h1>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{role}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        {status}
                    </div>
                    <ThemeSwitch />
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60 px-8">
                            <div className="p-4 rounded-full bg-muted border border-border mb-2">
                                <Icon className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-bold">{name} Console</h3>
                            <p className="text-sm max-w-sm">
                                {description}
                            </p>
                            {suggestions && suggestions.length > 0 && (
                                <div className="grid grid-cols-1 gap-2 w-full max-w-xs pt-4">
                                    {suggestions.map((s, i) => (
                                        <button key={i} onClick={() => handleSend(s)} className="text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 border border-border transition-all">
                                            "{s}"
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                            <div className={cn("max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap", 
                                msg.role === 'user' ? "bg-foreground text-background rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm shadow-sm")}>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs pl-2">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            {name} is thinking...
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-border bg-muted/30">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Command ${name}...`}
                            className="flex-1 h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!query.trim() || loading}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-foreground text-background disabled:opacity-50 transition-all hover:opacity-90"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
