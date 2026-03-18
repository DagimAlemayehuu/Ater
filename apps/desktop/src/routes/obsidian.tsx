import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Send, Bot, User, Trash2, ShieldCheck, RefreshCw, 
    Sparkles, Paperclip, FileText, Folder, ChevronRight, 
    Search, LayoutGrid, BrainCircuit, X
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface FileNode {
    name: string
    path: string
    isFolder: boolean
    children?: FileNode[]
}

export default function Obsidian() {
    const { config } = useConfig()
    const location = useLocation()
    
    // --- Tabs State ---
    const [activeTab, setActiveTab] = useState('intelligence')

    // --- Intelligence / Chat State ---
    const [systemInstruction, setSystemInstruction] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [attachedFile, setAttachedFile] = useState<{ name: string, uri: string } | null>(null)
    const [uploading, setUploading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // --- Vault Explorer State ---
    const [files, setFiles] = useState<any[]>([])
    const [loadingFiles, setLoadingFiles] = useState(false)
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [noteContent, setNoteContent] = useState('')
    const [loadingNote, setLoadingNote] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']))

    // --- Effects ---
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const initSearch = searchParams.get('search')
        const initPath = searchParams.get('path')
        
        if (initPath) {
            setActiveTab('explorer')
            selectFile(initPath)
            
            // Expand parent folders
            const parts = initPath.split('/')
            const newExpanded = new Set(expandedFolders)
            let current = ''
            parts.slice(0, -1).forEach(part => {
                current = current ? `${current}/${part}` : part
                newExpanded.add(current)
            })
            setExpandedFolders(newExpanded)
        } else if (initSearch) {
            setActiveTab('explorer')
            setSearchQuery(initSearch)
        }
    }, [location.search])
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, loading])

    useEffect(() => {
        if (activeTab === 'explorer' && files.length === 0) {
            fetchFiles()
        }
    }, [activeTab])

    // --- Intelligence Actions ---
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
                systemInstruction,
                messages.map(m => ({ role: m.role, content: m.content })), // history
                currentFileUri
            )

            setMessages([...newMessages, { role: 'assistant', content: res.response }])
        } catch (err) {
            console.error('Gemini Chat failed:', err)
            setMessages([...newMessages, { role: 'assistant', content: 'Error: Failed to communicate with Gemini. Ensure your API key is valid.' }])
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
            alert('Failed to upload file to Gemini.')
        } finally {
            setUploading(false)
        }
    }

    const clearChat = () => {
        if (confirm('Clear entire conversation?')) {
            setMessages([])
        }
    }

    // --- Explorer Actions ---
    const fetchFiles = async () => {
        setLoadingFiles(true)
        try {
            const res = await sidecarApi.listObsidianFiles()
            setFiles(res.files || [])
        } catch (err) {
            console.error('Failed to fetch obsidian files:', err)
        } finally {
            setLoadingFiles(false)
        }
    }

    const selectFile = async (path: string) => {
        setSelectedPath(path)
        setLoadingNote(true)
        try {
            const res = await sidecarApi.readObsidianNote(path)
            setNoteContent(res.content || '')
        } catch (err) {
            console.error('Failed to read note:', err)
            setNoteContent('# Error\nFailed to load content.')
        } finally {
            setLoadingNote(false)
        }
    }

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(path)) newExpanded.delete(path)
        else newExpanded.add(path)
        setExpandedFolders(newExpanded)
    }

    // --- Tree Construction ---
    const fileTree = useMemo(() => {
        const root: FileNode[] = []
        
        files.forEach(file => {
            const parts = file.path.split('/')
            let currentLevel = root
            
            parts.forEach((part: string, index: number) => {
                const isLast = index === parts.length - 1
                const currentPath = parts.slice(0, index + 1).join('/')
                
                let existing = currentLevel.find(node => node.name === part)
                
                if (!existing) {
                    existing = {
                        name: part,
                        path: currentPath,
                        isFolder: !isLast,
                        children: isLast ? undefined : []
                    }
                    currentLevel.push(existing)
                }
                
                if (!isLast && existing.children) {
                    currentLevel = existing.children
                }
            })
        })

        const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) => {
                if (a.isFolder && !b.isFolder) return -1
                if (!a.isFolder && b.isFolder) return 1
                return a.name.localeCompare(b.name)
            })
            nodes.forEach(node => {
                if (node.children) sortNodes(node.children)
            })
        }
        
        sortNodes(root)
        return root
    }, [files])

    const renderTree = (nodes: FileNode[], level = 0) => {
        return nodes.map(node => {
            const isExpanded = expandedFolders.has(node.path)
            const isSelected = selectedPath === node.path
            
            // Search filter
            if (searchQuery && !node.path.toLowerCase().includes(searchQuery.toLowerCase())) {
                return null
            }

            return (
                <div key={node.path} className="flex flex-col">
                    <div 
                        onClick={() => node.isFolder ? toggleFolder(node.path) : selectFile(node.path)}
                        className={cn(
                            "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors",
                            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                            level > 0 && "ml-4"
                        )}
                    >
                        {node.isFolder ? (
                            <>
                                <ChevronRight size={14} className={cn("transition-transform shrink-0", isExpanded && "rotate-90")} />
                                <Folder size={14} className={cn("shrink-0", isSelected ? "text-primary-foreground" : "text-primary/70")} />
                            </>
                        ) : (
                            <FileText size={14} className="shrink-0 ml-5" />
                        )}
                        <span className="truncate">{node.name}</span>
                    </div>
                    {node.isFolder && isExpanded && node.children && (
                        <div className="border-l border-border/50 ml-3 mt-0.5">
                            {renderTree(node.children, level + 1)}
                        </div>
                    )}
                </div>
            )
        })
    }

    return (
        <div className="h-full flex-1 flex flex-col space-y-6 md:flex w-full mx-auto animate-in fade-in duration-300">
            <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Obsidian Hub</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Reasoning intelligence and vault visualization.</p>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="intelligence" className="gap-2 text-xs">
                            <BrainCircuit size={14} /> Intelligence
                        </TabsTrigger>
                        <TabsTrigger value="explorer" className="gap-2 text-xs">
                            <LayoutGrid size={14} /> Vault Explorer
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 min-h-0">
                {/* --- Intelligence View --- */}
                {activeTab === 'intelligence' && (
                    <div className="flex h-full gap-6 overflow-hidden pb-6">
                        {/* System Instruction Panel (Left) */}
                        <div className="w-1/3 flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-semibold tracking-tight text-foreground">System Instruction</h3>
                            </div>
                            <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
                                <textarea
                                    value={systemInstruction}
                                    onChange={(e) => setSystemInstruction(e.target.value)}
                                    placeholder="Paste your system instructions here..."
                                    className="flex-1 w-full p-4 bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/50 custom-scrollbar font-mono"
                                />
                                <div className="p-3 bg-muted/30 border-t text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-2">
                                    <Sparkles size={12} className="text-primary" />
                                    Directs Gemini's behavior
                                </div>
                            </div>
                        </div>

                        {/* Chat Panel (Right) */}
                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-semibold tracking-tight text-foreground">Gemini Chat</h3>
                                </div>
                                <button onClick={clearChat} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors">
                                    <Trash2 size={12} /> Clear
                                </button>
                            </div>
                            
                            <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden relative">
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-muted/5">
                                    {messages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 text-center">
                                            <Bot size={48} strokeWidth={1} className="mb-2" />
                                            <p className="text-sm font-medium">Start a session using custom instructions</p>
                                            <p className="text-xs max-w-[200px]">Upload a file to provide specific knowledge context.</p>
                                        </div>
                                    )}
                                    
                                    {messages.map((msg, i) => (
                                        <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                            </div>
                                            <div className={cn("flex flex-col gap-1.5 max-w-[85%]", msg.role === 'user' ? "items-end" : "")}>
                                                <div className={cn("px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm", msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/50 border rounded-tl-none prose prose-sm dark:prose-invert max-w-none font-sans")}>
                                                    {msg.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown> : msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {loading && (
                                        <div className="flex gap-4 animate-pulse">
                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border shadow-sm">
                                                <Bot size={16} className="text-muted-foreground" />
                                            </div>
                                            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-muted/30 border text-sm flex items-center gap-2">
                                                <RefreshCw size={14} className="animate-spin text-primary" />
                                                <span>Reasoning...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-background border-t">
                                    {attachedFile && (
                                        <div className="mb-3 flex items-center gap-2 p-2 bg-primary/10 rounded-md border border-primary/20 text-xs text-primary animate-in slide-in-from-bottom-1">
                                            <Paperclip size={12} />
                                            <span className="truncate max-w-[200px] font-semibold">{attachedFile.name}</span>
                                            <button onClick={() => setAttachedFile(null)} className="ml-auto hover:text-foreground">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="relative flex items-center gap-2">
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md,.py,.js,.ts,.json,.cpp,.java,.rs,.html,.css" />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className={cn(
                                                "p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-colors",
                                                uploading && "animate-pulse"
                                            )}
                                            title="Upload to Gemini"
                                        >
                                            {uploading ? <RefreshCw size={18} className="animate-spin" /> : <Paperclip size={18} />}
                                        </button>
                                        <input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="Ask Gemini anything..."
                                            className="flex-1 bg-muted/30 border border-input rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim() || loading || uploading}
                                            className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Explorer View --- */}
                {activeTab === 'explorer' && (
                    <div className="flex h-full gap-6 overflow-hidden pb-6">
                        {/* Folder Tree (Left) */}
                        <div className="w-[300px] flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Filter vault..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto rounded-xl border bg-card p-4 custom-scrollbar">
                                {loadingFiles && files.length === 0 ? (
                                    <div className="h-full flex items-center justify-center opacity-50"><RefreshCw size={24} className="animate-spin" /></div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {renderTree(fileTree)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Single Pane Document Reader (Right) */}
                        <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden bg-background">
                            {!selectedPath ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3">
                                    <FileText size={48} strokeWidth={1} />
                                    <p className="text-sm font-medium">Select a note from your vault</p>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full animate-in fade-in duration-300">
                                    {/* Reader Header */}
                                    <div className="px-6 py-4 border-b bg-muted/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                                <FileText className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold truncate text-foreground">{selectedPath.split('/').pop()}</span>
                                                <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tight">{selectedPath}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setSelectedPath(null)}
                                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Reader Content - Scrollable Independent Area */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                                        <div className="max-w-3xl mx-auto px-8 py-12">
                                            {loadingNote ? (
                                                <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
                                                    <RefreshCw size={32} className="animate-spin text-primary" />
                                                    <p className="text-sm font-medium">Reading knowledge asset...</p>
                                                </div>
                                            ) : (
                                                <div className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-li:my-1 max-w-none animate-in fade-in duration-500">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {noteContent}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
