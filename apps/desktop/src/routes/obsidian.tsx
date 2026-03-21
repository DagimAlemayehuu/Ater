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
            setSearchQuery(initSearch)
        }
    }, [location.search])

    useEffect(() => {
        if (files.length === 0) {
            fetchFiles()
        }
    }, [])

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
                    <p className="text-muted-foreground text-sm mt-0.5">Vault visualization and knowledge explorer.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
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
            </div>
        </div>
    )
}
