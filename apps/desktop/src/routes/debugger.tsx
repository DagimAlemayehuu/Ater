import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { sidecarApi } from '@/lib/sidecarApi'
import { Loader2, Search, Bug, FileText, Send, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

interface Message {
    role: 'user' | 'assistant'
    content: string
    sources?: string[]
}

export default function Debugger() {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Auto-sync on mount to ensure index exists
        const initSync = async () => {
            setSyncing(true)
            try {
                await sidecarApi.vaultSync(false)
            } catch (err) {
                console.error('Initial sync failed', err)
            } finally {
                setSyncing(false)
            }
        }
        initSync()
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSync = async () => {
        setSyncing(true)
        const tid = toast.loading('Syncing vault...')
        try {
            const { result } = await sidecarApi.vaultSync(true)
            toast.success(`Sync complete: ${result.files_processed} files, ${result.chunks_created} chunks`, { id: tid })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.message || 'Sync failed', { id: tid })
        } finally {
            setSyncing(false)
        }
    }

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim() || loading) return

        const userMsg: Message = { role: 'user', content: query }
        setMessages(prev => [...prev, userMsg])
        setQuery('')
        setLoading(true)

        try {
            const { response, sources } = await sidecarApi.debuggerQuery(userMsg.content)
            const assistantMsg: Message = { 
                role: 'assistant', 
                content: response,
                sources 
            }
            setMessages(prev => [...prev, assistantMsg])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.message || 'Search failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full space-y-4 p-4 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">The Debugger</h1>
                    <p className="text-muted-foreground">
                        RAG-grounded retrieval. Answers derived strictly from your Obsidian vault.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSync}
                        disabled={syncing}
                        className="h-8 border-primary/20 hover:bg-primary/5"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5 mr-2", syncing && "animate-spin")} />
                        {syncing ? 'Syncing...' : 'Sync Vault'}
                    </Button>
                    <Badge variant="outline" className="px-3 py-1 h-8 text-xs font-medium border-primary/20 bg-primary/5 text-primary">
                        <Bug className="w-4 h-4 mr-2" />
                        RAG Mode Active
                    </Badge>
                </div>
            </div>

            <Card className="flex-1 flex flex-col min-h-0 border-primary/10 shadow-lg shadow-primary/5">
                <CardHeader className="border-b bg-muted/30 py-3">
                    <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Vault Intelligence</CardTitle>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <ScrollArea className="flex-1 p-4 lg:p-6">
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Bug className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold">Ready to Debug</h3>
                                        <p className="text-muted-foreground max-w-sm">
                                            Ask me anything about your notes. I'll search your entire vault and provide a factual answer based on your data.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-4">
                                        {[
                                            "What are my main goals for Q2?",
                                            "Summarize my research on AI agents.",
                                            "What was that quote about resilience?",
                                            "Where did I leave off on the Life OS project?"
                                        ].map(example => (
                                            <Button 
                                                key={example}
                                                variant="outline" 
                                                className="text-xs h-auto py-2 px-3 text-left justify-start hover:bg-primary/5 hover:border-primary/30"
                                                onClick={() => {
                                                    setQuery(example)
                                                }}
                                            >
                                                {example}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`
                                        max-w-[85%] rounded-2xl p-4 shadow-sm
                                        ${msg.role === 'user' 
                                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                            : 'bg-muted border border-border/50 rounded-tl-none'}
                                    `}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                        
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-border/30">
                                                <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    Sources ({msg.sources.length})
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {msg.sources.map((src, sIdx) => (
                                                        <Badge key={sIdx} variant="secondary" className="text-[10px] px-2 py-0 h-5 font-normal bg-background/50">
                                                            {src.split('/').pop()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-4 lg:p-6 border-t bg-muted/20">
                        <form onSubmit={handleSearch} className="max-w-4xl mx-auto flex items-center space-x-2">
                            <Input
                                placeholder="Query your vault..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={loading}
                                className="flex-1 bg-background border-primary/20 focus-visible:ring-primary/30 h-11"
                            />
                            <Button type="submit" disabled={loading || !query.trim()} className="h-11 px-6">
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
