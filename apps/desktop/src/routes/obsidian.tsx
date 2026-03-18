import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Send, Bot, User, Trash2, ShieldCheck, RefreshCw, 
    Sparkles, Paperclip, FileText, Folder, ChevronRight, 
    Search, LayoutGrid, BrainCircuit, X, Activity, 
    Upload, CheckCircle2, Zap, AlertCircle, Inbox, FileSearch, Play
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

interface OkaResult {
    title: string
    path: string
    status: 'created' | 'updated' | 'moved'
    uid: string
}

interface InboxFile {
    name: string
    path: string
    size: number
    suffix: string
}

export default function Obsidian() {
    const { config } = useConfig()
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

    // --- OKA Manual Selection State ---
    const [inboxFiles, setInboxFiles] = useState<InboxFile[]>([])
    const [loadingInbox, setLoadingInbox] = useState(false)
    const [selectedInboxFile, setSelectedInboxFile] = useState<InboxFile | null>(null)
    const [okaLogs, setOkaLogs] = useState<{ id: string, name: string, status: string, count: number, time: string }[]>([])
    const [processing, setProcessing] = useState(false)
    const [previewResults, setPreviewResults] = useState<OkaResult[]>([])
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [structuredPlan, setStructuredPlan] = useState<any | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
    const [currentBatch, setCurrentBatch] = useState<number>(0)
    const [totalBatches, setTotalBatches] = useState<number>(0)
    const [hasMoreBatches, setHasMoreBatches] = useState(false)
    const [isWatcherRunning, setIsWatcherRunning] = useState(false)

    // --- Effects ---
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, loading])

    useEffect(() => {
        if (activeTab === 'explorer' && files.length === 0) {
            fetchFiles()
        }
        if (activeTab === 'autonomous') {
            checkWatcherStatus()
            fetchInbox()
            // Auto-refresh inbox every 5 seconds for "instant" detection
            const interval = setInterval(fetchInbox, 5000)
            return () => clearInterval(interval)
        }
    }, [activeTab])

    // --- OKA Actions ---
    const checkWatcherStatus = async () => {
        try {
            const status = await sidecarApi.okaWatcherStatus()
            setIsWatcherRunning(status.is_running)
        } catch (err) {
            console.error('Failed to check watcher status:', err)
        }
    }

    const fetchInbox = async () => {
        setLoadingInbox(true)
        try {
            const res = await sidecarApi.okaListInbox()
            setInboxFiles(res.files || [])
        } catch (err) {
            console.error('Failed to fetch inbox:', err)
        } finally {
            setLoadingInbox(false)
        }
    }

    const processSelectedFile = async () => {
        if (!selectedInboxFile) return

        setProcessing(true)
        setPreviewResults([])
        setActivePlan(null)
        setStructuredPlan(null)
        setSessionId(null)
        setIsAwaitingConfirmation(false)
        setCurrentBatch(0)
        try {
            const res = await sidecarApi.okaProcess({ file_path: selectedInboxFile.path })
            setActivePlan(res.plan_raw)
            setStructuredPlan(res.plan_structured)
            setSessionId(res.session_id)
            setIsAwaitingConfirmation(true)
            setTotalBatches(res.plan_structured?.batches?.length || 0)
        } catch (err) {
            console.error('OKA planning failed:', err)
            alert('Failed to generate plan. Check backend logs.')
        } finally {
            setProcessing(false)
        }
    }

    const confirmDeployment = async () => {
        if (!sessionId) return

        setProcessing(true)
        try {
            const res = await sidecarApi.okaConfirm({ 
                session_id: sessionId,
                command: "Confirm Final Plan & Proceed Batch 1"
            })
            
            setPreviewResults(res.results)
            
            setOkaLogs([{
                id: Math.random().toString(),
                name: selectedInboxFile?.name || 'Manual Session',
                status: 'Success',
                count: res.count,
                time: new Date().toLocaleTimeString()
            }, ...okaLogs])
            
            // Final Cleanup - Only one batch allowed
            setSessionId(null)
            setIsAwaitingConfirmation(false)
            setSelectedInboxFile(null)
            fetchInbox()
        } catch (err) {
            console.error('OKA confirmation failed:', err)
            alert('Failed to confirm and deploy. Check backend logs.')
        } finally {
            setProcessing(false)
        }
    }

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
        <>
            <Header>
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                </div>
            </Header>

            <Main>
                <div className="h-full flex-1 flex flex-col space-y-6 md:flex max-w-[1400px] w-full mx-auto animate-in fade-in duration-300">
                    <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Obsidian Hub</h2>
                            <p className="text-muted-foreground">Reasoning intelligence and vault visualization.</p>
                        </div>
                        
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[500px]">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="intelligence" className="gap-2">
                                    <BrainCircuit size={14} /> Intelligence
                                </TabsTrigger>
                                <TabsTrigger value="autonomous" className="gap-2">
                                    <Zap size={14} /> Autonomous
                                </TabsTrigger>
                                <TabsTrigger value="explorer" className="gap-2">
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
                                            placeholder="Paste your system instructions here... (e.g. 'You are a technical writer specializing in Obsidian notes.')"
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

                        {/* --- Autonomous View --- */}
                        {activeTab === 'autonomous' && (
                            <div className="flex h-full gap-6 overflow-hidden pb-6">
                                {/* Inbox List (Left) */}
                                <div className="w-1/3 flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <Inbox className="w-4 h-4 text-primary" />
                                            <h3 className="text-sm font-semibold tracking-tight text-foreground">Inbox Files</h3>
                                        </div>
                                        <button onClick={fetchInbox} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
                                            <RefreshCw size={14} className={cn(loadingInbox && "animate-spin")} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-muted/5">
                                            {!config?.inboxPath && !loadingInbox && (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 text-center p-6">
                                                    <AlertCircle size={48} strokeWidth={1} />
                                                    <p className="text-sm font-medium">Inbox Path Not Set</p>
                                                    <p className="text-xs">Configure your Inbox folder in Settings to see files here.</p>
                                                </div>
                                            )}
                                            
                                            {config?.inboxPath && inboxFiles.length === 0 && !loadingInbox && (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 text-center p-6">
                                                    <Inbox size={48} strokeWidth={1} />
                                                    <p className="text-sm font-medium">Inbox is empty</p>
                                                    <p className="text-xs">Drop PDFs or text files into your configured Inbox folder.</p>
                                                </div>
                                            )}
                                            
                                            {inboxFiles.map((file) => (
                                                <div 
                                                    key={file.path} 
                                                    onClick={() => setSelectedInboxFile(file)}
                                                    className={cn(
                                                        "p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3",
                                                        selectedInboxFile?.path === file.path 
                                                            ? "bg-primary border-primary text-primary-foreground" 
                                                            : "bg-background hover:bg-muted/50 text-foreground"
                                                    )}
                                                >
                                                    <div className={cn("p-2 rounded-md shrink-0", selectedInboxFile?.path === file.path ? "bg-primary-foreground/10" : "bg-muted")}>
                                                        {file.suffix === '.pdf' ? <FileSearch size={16} /> : <FileText size={16} />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-semibold truncate">{file.name}</span>
                                                        <span className={cn("text-[10px] uppercase font-bold", selectedInboxFile?.path === file.path ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                                            {(file.size / 1024).toFixed(1)} KB • {file.suffix.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-3 bg-muted/30 border-t text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">
                                            {inboxFiles.length} items ready for processing
                                        </div>
                                    </div>
                                </div>

                                {/* Selection & Log Panel (Right) */}
                                <div className="flex-1 flex flex-col gap-4">
                                    {/* Action Card */}
                                    <div className="rounded-xl border bg-card shadow-sm p-5">
                                        {!selectedInboxFile ? (
                                            <div className="h-[120px] flex flex-col items-center justify-center text-muted-foreground/40 gap-2 border-2 border-dashed rounded-lg">
                                                <Play size={24} strokeWidth={1} />
                                                <p className="text-sm font-medium">Select a file from the inbox to begin</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                        {selectedInboxFile.suffix === '.pdf' ? <FileSearch className="w-6 h-6 text-primary" /> : <FileText className="w-6 h-6 text-primary" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h3 className="text-lg font-bold tracking-tight">{selectedInboxFile.name}</h3>
                                                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">{selectedInboxFile.path}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isAwaitingConfirmation ? (
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => confirmDeployment()}
                                                                disabled={processing}
                                                                className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                                            >
                                                                {processing ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                                                Confirm
                                                            </button>
                                                            
                                                            <button 
                                                                onClick={() => { setSessionId(null); setIsAwaitingConfirmation(false); setSelectedInboxFile(null); setActivePlan(null); }}
                                                                className="p-2.5 hover:bg-muted text-muted-foreground rounded-xl transition-colors"
                                                                title="Cancel Session"
                                                            >
                                                                <X size={20} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={processSelectedFile}
                                                            disabled={processing}
                                                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {processing ? <><RefreshCw size={16} className="animate-spin" /> Planning...</> : <><Play size={16} /> Generate Plan</>}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Results & History */}
                                    <div className="flex-1 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
                                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/5">
                                            {activePlan && isAwaitingConfirmation ? (
                                                <div className="flex flex-col h-full animate-in fade-in duration-500">
                                                    <div className="p-4 border-b bg-background/50 flex items-center justify-between">
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                            <FileText size={14} /> Knowledge Asset Plan
                                                        </h4>
                                                        <div className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                                                            Awaiting Confirmation
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-background">
                                                        <div className="max-w-3xl mx-auto prose prose-sm dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-p:leading-relaxed">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activePlan}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                    
                                                    {previewResults.length > 0 && (
                                                        <div className="p-4 border-t bg-muted/20">
                                                            <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Recently Deployed Assets</h4>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {previewResults.slice(-6).map((res, i) => (
                                                                    <div key={i} className="bg-background border rounded-lg p-2 flex items-center justify-between text-[10px] shadow-sm animate-in zoom-in-95">
                                                                        <span className="font-bold truncate pr-2">{res.title}</span>
                                                                        <span className="text-green-500 font-bold">OK</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border h-full">
                                                    {okaLogs.map((log) => (
                                                        <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                                    <FileText className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-semibold text-foreground">{log.name}</span>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{log.time}</span>
                                                                        <span className="text-[10px] text-muted-foreground">•</span>
                                                                        <span className="text-[10px] text-green-500 font-bold uppercase">{log.count} notes generated</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-500 uppercase">
                                                                <CheckCircle2 size={10} /> Success
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {okaLogs.length === 0 && !processing && (
                                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-3 text-center">
                                                            <Activity size={48} strokeWidth={1} />
                                                            <p className="text-sm font-medium">Recent Activity</p>
                                                            <p className="text-xs">Select and process files to see deployment logs.</p>
                                                        </div>
                                                    )}
                                                    
                                                    {processing && (
                                                        <div className="h-full flex flex-col items-center justify-center gap-4 animate-pulse">
                                                            <div className="relative">
                                                                <BrainCircuit size={48} className="text-primary/20" />
                                                                <RefreshCw size={24} className="absolute inset-0 m-auto animate-spin text-primary" />
                                                            </div>
                                                            <p className="text-sm font-medium text-primary">OKA is architecting knowledge...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
            </Main>
        </>
    )
}
