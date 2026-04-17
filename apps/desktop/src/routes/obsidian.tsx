import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Send, Bot, User, Trash2, ShieldCheck, RefreshCw, 
    Sparkles, Paperclip, FileText, Folder, ChevronRight, 
    Search, LayoutGrid, BrainCircuit, X, Zap, Activity, 
    PauseCircle, ListChecks, Archive, Terminal, Database,
    ChevronDown, Info, PanelLeft, Layout, FolderOpen,
    Plus, ChevronLeft, GraduationCap, Calendar, Building, Circle, Users, Settings, Network,
    Edit3, Save
} from 'lucide-react'
import { sidecarApi, ObsidianFile } from '@/lib/sidecarApi'
import { ObsidianGraphView } from '@/components/obsidian/ObsidianGraphView'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { useLocation, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownViewer } from '@/components/obsidian/MarkdownViewer'
import { PdfViewer } from '@/components/obsidian/PdfViewer'
import { renderWikiLinks } from '@/components/obsidian/WikiLink'
import React from 'react'

interface InboxFile {
    name: string
    path: string
}

interface FileNode {
    name: string
    path: string
    isFolder: boolean
    children?: FileNode[]
}

function NoteProperties({ metadata, onNavigate }: { metadata: Record<string, any>, onNavigate: (link: string) => void }) {
    if (!metadata || Object.keys(metadata).length === 0) return null

    const getPropertyIcon = (key: string) => {
        switch (key.toLowerCase()) {
            case 'course': return <GraduationCap size={18} />
            case 'semester': return <Calendar size={18} />
            case 'department': return <Building size={18} />
            case 'status': return <Circle size={18} />
            case 'source': return <Paperclip size={18} />
            case 'source_page': return <FileText size={18} />
            default: return <Info size={18} />
        }
    }
    
    return (
        <div className="flex flex-col gap-8 mb-12">
            <div className="grid grid-cols-2 gap-y-6 gap-x-20 py-10 border-y border-gray-100" data-purpose="note-metadata">
                {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-4">
                        <div className="w-5 flex justify-center text-gray-400">
                            {getPropertyIcon(key)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                            <span className="text-[14px] font-medium text-gray-800">
                                {key.toLowerCase() === 'status' ? (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest",
                                        value === 'Completed' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                                    )}>{String(value)}</span>
                                ) : (
                                    String(value).startsWith('[[') ? (
                                        <button 
                                            onClick={() => onNavigate(String(value).slice(2, -2))}
                                            className="text-black hover:underline underline-offset-4 decoration-gray-200"
                                        >
                                            {String(value).slice(2, -2).split('/').pop()}
                                        </button>
                                    ) : String(value)
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ObsidianVaultPage() {
    const { config, saveConfig } = useConfig()
    const location = useLocation()
    const navigate = useNavigate()
    
    // --- Layout State ---
    const [showArchitect, setShowArchitect] = useState(false)
    const [showGraphView, setShowGraphView] = useState(false)

    // --- Vault Explorer State ---
    const [files, setFiles] = useState<ObsidianFile[]>([])
    const [loadingFiles, setLoadingFiles] = useState(false)
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [selectedPage, setSelectedPage] = useState(1)
    const [selectedFilteredPages, setSelectedFilteredPages] = useState<number[]>([])
    const [noteMetadata, setNoteMetadata] = useState<Record<string, any>>({})
    const [noteContent, setNoteContent] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [editedContent, setEditedContent] = useState('')
    const [history, setHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)

    const handleSaveNote = async () => {
        if (!selectedPath) return
        setLoadingNote(true)
        try {
            await sidecarApi.updateObsidianNote(selectedPath, editedContent)
            setNoteContent(editedContent)
            setIsEditing(false)
        } catch (err: any) {
            console.error("Save failed:", err)
        } finally {
            setLoadingNote(false)
        }
    }
    const [loadingNote, setLoadingNote] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

    // --- OKA Agent State ---
    const [queueStatus, setQueueStatus] = useState<any>(null)
    const [inboxFiles, setInboxFiles] = useState<InboxFile[]>([])
    const [loadingInbox, setLoadingInbox] = useState(false)
    const [selectedInboxFile, setSelectedInboxFile] = useState<InboxFile | null>(null)
    const [processing, setProcessing] = useState(false)
    const [activePlan, setActivePlan] = useState<string | null>(null)
    const [planData, setPlanData] = useState<any | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
    const [currentBatch, setCurrentBatch] = useState<number>(0)
    const [totalBatches, setTotalBatches] = useState<number>(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [batchFeed, setBatchFeed] = useState<any[]>([])
    const [okaError, setOkaError] = useState<string | null>(null)

    // --- Sync & Polling ---
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
        fetchFiles()
        fetchStatus()
        fetchInbox()
        
        // Polling for realtime sync
        const interval = setInterval(() => {
            fetchFiles()
            fetchStatus()
        }, 5000)
        
        return () => clearInterval(interval)
    }, [config?.obsidianVaultPath])

    // --- Actions ---
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

    const fetchStatus = async () => {
        try {
            const res = await sidecarApi.okaQueueStatus()
            setQueueStatus(res)
        } catch (err) { console.error(err) }
    }

    const fetchInbox = async () => {
        setLoadingInbox(true)
        try {
            const res = await sidecarApi.okaListInbox()
            setInboxFiles(res.files || [])
        } finally { setLoadingInbox(false) }
    }

    const handleDeleteItem = async (e: React.MouseEvent, path: string, isFolder: boolean) => {
        e.stopPropagation()
        try {
            await sidecarApi.deleteObsidianItem(path)
            await fetchFiles()
            if (selectedPath === path || selectedPath?.startsWith(path + '/')) {
                setSelectedPath(null)
                setNoteMetadata({})
                setNoteContent('')
            }
        } catch (err: any) {
            alert(`Delete failed: ${err.message}`)
        }
    }

    const selectFile = async (path: string, page: number = 1, fromHistory: boolean = false, filterPages: number[] = []) => {
        setSelectedPath(path)
        setSelectedPage(page)
        setSelectedFilteredPages(filterPages)
        setLoadingNote(true)
        
        if (!fromHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            if (newHistory[newHistory.length - 1] !== path) {
                newHistory.push(path);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
        }

        if (path.toLowerCase().endsWith('.pdf')) {
            setNoteMetadata({})
            setNoteContent('')
            setEditedContent('')
            setIsEditing(false)
            setLoadingNote(false)
            return
        }

        try {
            const res = await sidecarApi.readObsidianNote(path)
            setNoteMetadata(res.metadata || {})
            setNoteContent(res.content || '')
            setEditedContent(res.content || '')
            setIsEditing(false)
        } catch (err) {
            console.error('Failed to read note:', err)
            setNoteMetadata({})
            setNoteContent('# Error\nFailed to load content.')
        } finally { setLoadingNote(false) }
    }

    const handleBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            selectFile(history[newIndex], 1, true, []);
        }
    }

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            selectFile(history[newIndex], 1, true, []);
        }
    }

    const handleWikiLinkClick = async (pageName: string, pageNumber?: number, filterPages: number[] = []) => {
        try {
            const res = await sidecarApi.findVaultPage(pageName);
            if (res.found && res.path) {
                selectFile(res.path, pageNumber, false, filterPages);
            } else if (res.found && res.type === 'database') {
                selectFile(`3-Database/${res.db_id}/${res.file_name}`, pageNumber, false, filterPages);
            } else {
                // Not found. Create a new note in the same directory as the currently selected file
                let folder = '';
                if (selectedPath && selectedPath.includes('/')) {
                    folder = selectedPath.substring(0, selectedPath.lastIndexOf('/'));
                }
                
                const newPath = folder ? `${folder}/${pageName}.md` : `${pageName}.md`;
                const initialContent = `---\ntitle: ${pageName}\n---\n\n`;
                await sidecarApi.updateObsidianNote(newPath, initialContent);
                fetchFiles(); // refresh file tree since we created a new note
                selectFile(newPath, 1, false, []);
            }
        } catch (e) {
            console.error(e);
        }
    }

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(path)) newExpanded.delete(path)
        else newExpanded.add(path)
        setExpandedFolders(newExpanded)
    }

    const toggleAutoDeploy = async () => {
        await saveConfig({ autoDeploy: !config?.autoDeploy })
        await sidecarApi.okaWatcherToggle()
        fetchStatus()
    }

    const resetOkaSession = () => {
        setSessionId(null)
        setIsAwaitingConfirmation(false)
        setIsCompleted(false)
        setActivePlan(null)
        setPlanData(null)
        setBatchFeed([])
        setSelectedInboxFile(null)
        setOkaError(null)
        fetchInbox()
    }

    const processSelectedFile = async () => {
        if (!selectedInboxFile) return
        setProcessing(true)
        setOkaError(null)
        setActivePlan(null)
        setBatchFeed([])
        setIsCompleted(false)
        setIsAwaitingConfirmation(false)
        
        try {
            const res = await sidecarApi.okaProcess({ file_path: selectedInboxFile.path })
            setActivePlan(res.plan_raw)
            setPlanData(res.plan_structured)
            setSessionId(res.session_id)
            setTotalBatches(res.plan_structured?.batches?.length || 1)
            setCurrentBatch(0)
            
            // Auto Deploy Circuit
            if (config?.autoDeploy) {
                // Proceed immediately without manual confirmation
                setTimeout(() => confirmDeployment(res.session_id), 800);
            } else {
                setIsAwaitingConfirmation(true)
            }
        } catch (err: any) {
            setOkaError(err.message || 'Workflow failed')
        } finally { setProcessing(false) }
    }

    const confirmDeployment = async (forcedId?: string) => {
        const targetId = forcedId || sessionId
        if (!targetId) return
        
        setProcessing(true)
        setIsAwaitingConfirmation(false) // Hide button if manual
        
        try {
            let currentHasMore = true
            let tempBatch = 0
            while (currentHasMore) {
                const res = await sidecarApi.okaConfirm({ session_id: targetId })
                tempBatch = res.current_batch || (tempBatch + 1)
                setCurrentBatch(tempBatch)
                setBatchFeed(prev => [...prev, { batch: tempBatch, results: res.results }])
                currentHasMore = res.has_more
                if (currentHasMore) await new Promise(r => setTimeout(r, 2000))
            }
            setIsCompleted(true)
            fetchFiles() // Refresh explorer
        } catch (err: any) { 
            setOkaError(err.message) 
        } finally { 
            setProcessing(false) 
        }
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
                    const isFolder = !isLast || file.is_dir
                    existing = {
                        name: part,
                        path: currentPath,
                        isFolder: isFolder,
                        children: isFolder ? [] : undefined
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

    const matchesSearch = (node: FileNode, query: string): boolean => {
        if (!query) return true
        if (node.path.toLowerCase().includes(query.toLowerCase())) return true
        if (node.children) {
            return node.children.some(child => matchesSearch(child, query))
        }
        return false
    }

    const renderTree = (nodes: FileNode[], level = 0) => {
        return nodes
            .filter(node => matchesSearch(node, searchQuery))
            .map(node => {
                const isExpanded = expandedFolders.has(node.path) || (searchQuery !== '' && matchesSearch(node, searchQuery))
                const isSelected = selectedPath === node.path
                
                return (
                    <div key={node.path} className="flex flex-col">
                        <div 
                            onClick={() => node.isFolder ? toggleFolder(node.path) : selectFile(node.path)}
                            className={cn(
                                "flex items-center gap-2 py-1.5 cursor-pointer transition-colors px-4 group",
                                isSelected ? "bg-[#E5E7EB] text-black font-medium rounded-md mx-2 px-2" : "hover:bg-[#F3F4F6] text-gray-600"
                            )}
                        >
                            {node.isFolder ? (
                                <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", isExpanded ? "rotate-90 text-gray-400" : "text-gray-400")} />
                            ) : (
                                <div className="w-3.5 h-3.5 shrink-0 text-transparent" />
                            )}
                            
                            {node.isFolder ? (
                                <Folder className={cn("w-4 h-4 shrink-0", isSelected ? "text-black" : "text-gray-400")} />
                            ) : node.path.toLowerCase().endsWith('.pdf') ? (
                                <FileText className={cn("w-4 h-4 shrink-0", isSelected ? "text-black" : "text-red-500/70")} />
                            ) : (
                                <FileText className={cn("w-4 h-4 shrink-0", isSelected ? "text-black" : "text-gray-400")} />
                            )}
                            
                            <span className="truncate text-[13px] flex-1">{node.name}</span>

                            <button
                                onClick={(e) => handleDeleteItem(e, node.path, node.isFolder)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded transition-all"
                                title={`Delete ${node.isFolder ? 'folder' : 'file'}`}
                            >
                                <Trash2 size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                        {node.isFolder && isExpanded && node.children && (
                            <div className="pl-4">
                                {renderTree(node.children, level + 1)}
                            </div>
                        )}
                    </div>
                )
            })
    }

    return (
        <div className="flex flex-col h-full w-full select-none bg-white text-[#111827] overflow-hidden font-sans">
            <div className="flex flex-1 overflow-hidden h-full">
                {/* MainContentArea */}
                <main className="flex-1 flex flex-col min-w-0">
                    <div className="flex flex-1 overflow-hidden">
                        {/* ExplorerSidebar */}
                        <aside className="w-64 border-r border-[#E5E5E5] flex flex-col bg-white shrink-0">
                            {/* Explorer Toolbar */}
                            <div className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="text-gray-400 hover:text-black cursor-pointer flex items-center justify-center p-1 rounded hover:bg-gray-100 shrink-0" title="New file">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="relative flex items-center">
                                            <Search className="absolute left-2 w-3.5 h-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 text-[12px] px-2 py-1.5 pl-7 rounded focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-400 transition-shadow"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-gray-400 hover:text-black cursor-pointer flex items-center justify-center p-1 rounded hover:bg-gray-100 shrink-0" title="Collapse sidebar">
                                        <ChevronLeft className="w-5 h-5" />
                                    </div>
                                    <div 
                                        className={cn("cursor-pointer flex items-center justify-center p-1 rounded hover:bg-gray-100 shrink-0", showGraphView ? "text-black bg-gray-100" : "text-gray-400 hover:text-black")} 
                                        onClick={() => setShowGraphView(!showGraphView)} 
                                        title="Toggle Graph View"
                                    >
                                        <Network className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* File Tree */}
                            <div className="flex-1 overflow-y-auto min-h-0 text-[13px] text-gray-600 custom-scrollbar">
                                <div className="py-2">
                                    {files.length > 0 ? renderTree(fileTree) : (
                                        <div className="py-10 text-center opacity-40">
                                            <Database size={24} className="mx-auto mb-2 text-gray-400" />
                                            <p className="text-[10px] font-bold uppercase">Vault Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* Editor Workspace */}
                        <section className="flex-1 flex flex-col bg-white overflow-hidden relative">
                            {showGraphView ? (
                                <ObsidianGraphView onNodeClick={(path) => {
                                    selectFile(path);
                                    setShowGraphView(false);
                                }} />
                            ) : (
                                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                                    {!selectedPath ? (
                                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-300 gap-4 mt-32">
                                            <FileText size={64} strokeWidth={1} />
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Select an asset to visualize</p>
                                        </div>
                                    ) : (
                                        <div className={cn("mx-auto py-12 px-16 w-full max-w-full overflow-hidden", selectedPath.toLowerCase().endsWith('.pdf') ? "max-w-none" : "max-w-5xl")}>
                                            {loadingNote ? (
                                                <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-400">
                                                    <RefreshCw size={24} className="animate-spin" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Loading Document...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Navigation & Breadcrumb Header */}
                                                    <div className="flex flex-col gap-4 mb-10">
                                                        {/* Breadcrumb Path */}
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest overflow-hidden text-ellipsis whitespace-nowrap">
                                                            {selectedPath.split('/').map((part, idx, arr) => (
                                                                <div key={idx} className="flex items-center gap-2 overflow-hidden shrink-0">
                                                                    <span className={idx === arr.length - 1 ? "text-gray-600 truncate max-w-[200px]" : "truncate max-w-[150px]"}>
                                                                        {part.replace('.md', '').replace('.pdf', '')}
                                                                    </span>
                                                                    {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 shrink-0" />}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* History Controls */}
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={handleBack}
                                                                disabled={historyIndex <= 0}
                                                                className={cn(
                                                                    "flex items-center justify-center w-8 h-8 rounded-md border transition-all shadow-sm",
                                                                    historyIndex > 0 
                                                                        ? "bg-white border-gray-100 text-gray-400 hover:text-black hover:border-black" 
                                                                        : "bg-gray-50 border-gray-50 text-gray-200 cursor-not-allowed"
                                                                )}
                                                                title="Go back"
                                                            >
                                                                <ChevronLeft size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={handleForward}
                                                                disabled={historyIndex >= history.length - 1}
                                                                className={cn(
                                                                    "flex items-center justify-center w-8 h-8 rounded-md border transition-all shadow-sm",
                                                                    historyIndex < history.length - 1 
                                                                        ? "bg-white border-gray-100 text-gray-400 hover:text-black hover:border-black" 
                                                                        : "bg-gray-50 border-gray-50 text-gray-200 cursor-not-allowed"
                                                                )}
                                                                title="Go forward"
                                                            >
                                                                <ChevronRight size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Page Title & Actions */}
                                                    <div className="flex items-start justify-between mb-12 group">
                                                        <h1 className="text-5xl font-extrabold text-[#111827] tracking-tight leading-tight flex-1 min-w-0 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                                            {selectedPath.split('/').pop()?.replace('.md', '').replace('.pdf', '')}
                                                        </h1>
                                                        {!selectedPath.toLowerCase().endsWith('.pdf') && (
                                                            <div className="flex flex-col items-end gap-3 opacity-100 transition-opacity">
                                                                {isEditing ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <button 
                                                                            onClick={handleSaveNote}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-sm"
                                                                        >
                                                                            <Save size={14} /> Save
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => {
                                                                                if (editedContent !== noteContent) {
                                                                                    if (confirm("Discard unsaved changes?")) {
                                                                                        setIsEditing(false)
                                                                                    }
                                                                                } else {
                                                                                    setIsEditing(false)
                                                                                }
                                                                            }}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-sm"
                                                                        >
                                                                            <X size={14} /> Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                                            <button 
                                                                                onClick={() => setIsEditing(true)}
                                                                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 text-gray-400 rounded-md text-[10px] font-bold uppercase tracking-widest hover:text-black hover:border-black transition-all shadow-sm w-fit"
                                                                            >
                                                                                <Edit3 size={12} /> Edit Note
                                                                            </button>

                                                                            <button 
                                                                                onClick={(e) => handleDeleteItem(e as any, selectedPath!, false)}
                                                                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 text-gray-400 rounded-md text-[10px] font-bold uppercase tracking-widest hover:text-red-500 hover:border-red-500 transition-all shadow-sm w-fit"
                                                                            >
                                                                                <Trash2 size={12} /> Delete Note
                                                                            </button>
                                                                            
                                                                            {(() => {
                                                                                const metadata = noteMetadata || {};
                                                                                const source = metadata.source || metadata.Source;
                                                                                
                                                                                // Support both source_page (scalar) and source_pages (list)
                                                                                let pages: number[] = [];
                                                                                if (Array.isArray(metadata.source_pages)) {
                                                                                    pages = metadata.source_pages.map(Number);
                                                                                } else if (metadata.source_page || metadata.Source_Page) {
                                                                                    pages = [Number(metadata.source_page || metadata.Source_Page)];
                                                                                } else if (typeof metadata.source_pages === 'string') {
                                                                                    pages = metadata.source_pages.split(',').map(p => Number(p.trim())).filter(p => !isNaN(p));
                                                                                }
                                                                                
                                                                                if (source) {
                                                                                    const match = typeof source === 'string' ? source.match(/\[\[(.*?)\]\]/) : null;
                                                                                    const cleanPath = match ? match[1] : (typeof source === 'string' ? source : null);
                                                                                    
                                                                                    if (cleanPath) {
                                                                                        return (
                                                                                            <div className="flex flex-col items-end gap-2">
                                                                                                <button 
                                                                                                    onClick={() => handleWikiLinkClick(cleanPath, pages[0] || 1, pages)}
                                                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 text-gray-400 rounded-md text-[10px] font-bold uppercase tracking-widest hover:text-black hover:border-black transition-all shadow-sm group/btn w-fit"
                                                                                                    title="Open Source PDF"
                                                                                                >
                                                                                                    <FileText size={12} className="group-hover/btn:rotate-6 transition-transform text-indigo-500/50 group-hover/btn:text-indigo-500" /> 
                                                                                                    Jump to PDF {pages.length === 1 && pages[0] > 1 ? `(P. ${pages[0]})` : ''}
                                                                                                </button>
                                                                                                
                                                                                                {pages.length > 1 && (
                                                                                                    <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[200px]">
                                                                                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Occurrences:</span>
                                                                                                        {pages.slice(0, 5).map((p, idx) => (
                                                                                                            <button
                                                                                                                key={idx}
                                                                                                                onClick={() => handleWikiLinkClick(cleanPath, p, pages)}
                                                                                                                className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 text-gray-400 rounded hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 text-[9px] font-medium transition-colors"
                                                                                                            >
                                                                                                                P.{p}
                                                                                                            </button>
                                                                                                        ))}
                                                                                                        {pages.length > 5 && (
                                                                                                            <span className="text-[9px] text-gray-300 italic">+{pages.length - 5} more</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                }
                                                                                return null;
                                                                            })()}
                                                                        </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {selectedPath.toLowerCase().endsWith('.pdf') ? (
                                                        <div className="h-[calc(100vh-280px)] -mx-16 mb-20">
                                                            <PdfViewer 
                                                                path={selectedPath} 
                                                                title={selectedPath.split('/').pop() || ''} 
                                                                initialPage={selectedPage} 
                                                                filterPages={selectedFilteredPages}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <NoteProperties 
                                                                metadata={noteMetadata} 
                                                                onNavigate={handleWikiLinkClick} 
                                                            />

                                                            {/* Markdown Content */}
                                                            <div className="mt-12">
                                                                {isEditing ? (
                                                                    <textarea
                                                                        value={editedContent}
                                                                        onChange={(e) => setEditedContent(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                                                                                e.preventDefault()
                                                                                handleSaveNote()
                                                                            }
                                                                        }}
                                                                        className="w-full h-[600px] p-8 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                                                                        placeholder="Start writing..."
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    <MarkdownViewer content={noteContent} onNavigate={handleWikiLinkClick} />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Right: OKA Architect (Collapsible Panel) */}
                        {showArchitect && (
                            <div className="w-[400px] border-l border-[#E5E5E5] bg-gray-50 flex flex-col shrink-0 overflow-hidden relative z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                                {/* OKA Header */}
                                <div className="p-4 border-b border-[#E5E5E5] bg-white flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <BrainCircuit size={16} className="text-[#111827]" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Knowledge Architect</h3>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                        <span className="text-[8px] font-bold uppercase text-gray-500">Auto</span>
                                        <button 
                                            onClick={toggleAutoDeploy}
                                            className={cn("relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out", config?.autoDeploy ? 'bg-[#111827]' : 'bg-gray-300')}
                                        >
                                            <span className={cn("pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-3.5' : 'translate-x-0')} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0 custom-scrollbar">
                                    <div className="p-4 space-y-6">
                                        {/* Pipeline Status */}
                                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Pipeline</h4>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", queueStatus?.status !== 'idle' ? "bg-black animate-pulse" : "bg-gray-300")} />
                                                    <span className="text-[10px] font-bold uppercase text-gray-900">{queueStatus?.status || 'Idle'}</span>
                                                </div>
                                                <span className="text-[9px] font-medium text-gray-400">{queueStatus?.pending_count || 0} Pending</span>
                                            </div>
                                            {queueStatus?.status !== 'idle' && (
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] text-gray-500 truncate">{queueStatus?.current_file}</p>
                                                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-black transition-all duration-500" style={{ width: `${(queueStatus?.current_batch / (queueStatus?.total_batches || 1)) * 100}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Inbox Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Inbox</h4>
                                            <div className="grid gap-1.5">
                                                {inboxFiles.length > 0 ? inboxFiles.map(f => (
                                                    <div 
                                                        key={f.path} 
                                                        onClick={() => { setSelectedInboxFile(f); setOkaError(null); setActivePlan(null); setIsAwaitingConfirmation(false); }}
                                                        className={cn(
                                                            "p-2.5 rounded-md border text-[10px] cursor-pointer transition-all", 
                                                            selectedInboxFile?.path === f.path ? "bg-gray-100 border-gray-300" : "bg-white hover:bg-gray-50 border-gray-100"
                                                        )}
                                                    >
                                                        <p className="font-bold text-gray-900 truncate">{f.name}</p>
                                                        <p className="text-gray-400 truncate mt-0.5">{f.path}</p>
                                                    </div>
                                                )) : (
                                                    <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg text-gray-400">
                                                        <Archive size={20} className="mx-auto mb-1 opacity-50" />
                                                        <p className="text-[9px] font-bold uppercase">Inbox Empty</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Workspace Area */}
                                        {selectedInboxFile && (
                                            <div className="pt-4 border-t border-gray-200 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#111827]">Active Analysis</h4>
                                                    <button onClick={resetOkaSession} className="text-[9px] font-bold text-gray-400 hover:text-[#111827] transition-colors">Reset</button>
                                                </div>
                                                
                                                {!activePlan && !processing && (
                                                    <Button onClick={processSelectedFile} className="w-full h-8 text-[10px] font-bold uppercase bg-white border border-gray-200 text-[#111827] hover:bg-gray-50">
                                                        <Zap size={12} className="mr-2" /> Analyze Document
                                                    </Button>
                                                )}

                                                {processing && (
                                                    <div className="py-10 text-center space-y-3">
                                                        <RefreshCw size={24} className="animate-spin mx-auto text-gray-400" />
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Architecting...</p>
                                                    </div>
                                                )}

                                                {activePlan && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200">
                                                            <Sparkles size={12} className="text-[#111827] animate-pulse" />
                                                            <p className="text-[10px] font-bold text-[#111827] uppercase tracking-wider">Architectural Plan</p>
                                                        </div>
                                                        
                                                        {/* Clean Text-based Plan Output */}
                                                        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm max-h-[400px] overflow-y-auto">
                                                            <div className="prose prose-xs max-w-none prose-headings:font-bold prose-headings:text-[#111827] prose-p:text-gray-500 prose-strong:text-[#111827] prose-ul:text-gray-500">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {activePlan}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>

                                                        {isAwaitingConfirmation && (
                                                            <Button onClick={() => confirmDeployment()} className="w-full h-10 text-[10px] font-bold uppercase bg-[#111827] text-white hover:bg-black shadow-lg shadow-black/10 tracking-widest">
                                                                <ShieldCheck size={14} className="mr-2" /> Start Deployment
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}

                                                {batchFeed.length > 0 && (
                                                    <div className="space-y-3 pt-4 border-t border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-bold uppercase text-gray-500">Deploy Progress</span>
                                                            <span className="text-[9px] font-bold text-gray-500">{currentBatch} / {totalBatches} Batches</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {batchFeed.map(b => (
                                                                <div key={b.batch} className="space-y-1.5">
                                                                    <div className="flex items-center gap-2 py-1">
                                                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                                                            <span className="text-[8px] font-bold text-[#111827]">{b.batch}</span>
                                                                        </div>
                                                                        <span className="text-[9px] font-bold uppercase text-[#111827]">Batch {b.batch} Deployed</span>
                                                                    </div>
                                                                    {b.results.map((r: any, idx: number) => (
                                                                        <div key={`${b.batch}-${idx}`} className="p-2.5 border border-gray-100 rounded-md bg-white space-y-1 shadow-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText size={10} className="text-gray-400 shrink-0" />
                                                                                <span className="text-[10px] font-semibold truncate text-[#111827]">{r.title}</span>
                                                                                <span className="ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{r.status || 'created'}</span>
                                                                            </div>
                                                                            {r.path && (
                                                                                <p className="text-[8px] text-gray-400 font-mono truncate pl-5">{r.path}</p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {okaError && (
                                                    <div className="p-3 rounded-md bg-red-50 border border-red-100 text-[10px] font-mono text-red-600">
                                                        {okaError}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
