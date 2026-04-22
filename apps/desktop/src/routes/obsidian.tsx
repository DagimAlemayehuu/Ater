import { useState, useRef, useEffect, useMemo } from 'react'
import { 
    Send, Bot, User, Trash2, ShieldCheck, RefreshCw, 
    Sparkles, Paperclip, FileText, Folder, ChevronRight, 
    Search, LayoutGrid, BrainCircuit, X, Zap, Activity, 
    PauseCircle, ListChecks, Archive, Terminal, Database,
    ChevronDown, ChevronUp, Maximize2, Minimize2, Info, PanelLeft, Layout, FolderOpen,
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
import { useLayout } from '@/context/layout-provider'
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
            <div className="grid grid-cols-2 gap-y-6 gap-x-20 py-10 border-y border-border" data-purpose="note-metadata">
                {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-4">
                        <div className="w-5 flex justify-center text-muted-foreground">
                            {getPropertyIcon(key)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                            <span className="text-[14px] font-medium text-foreground">
                                {key.toLowerCase() === 'status' ? (
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest",
                                        value === 'Completed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    )}>{String(value)}</span>
                                ) : (
                                    String(value).startsWith('[[') ? (
                                        <button 
                                            onClick={() => onNavigate(String(value).slice(2, -2))}
                                            className="text-foreground hover:underline underline-offset-4 decoration-border"
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

// Parses hub markdown connections into a depth-aware tree for sidebar navigation
type NavNode = { label: string; target: string | null; depth: number; children: NavNode[]; isChecked: boolean }

function parseHubTree(content: string): NavNode[] {
    const lines = content.split('\n')
    const wikilinkRe = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/
    const listItemRe = /^(\s*)[\-\*]\s+(.*)/

    const roots: NavNode[] = []
    const stack: NavNode[] = []

    for (const line of lines) {
        const m = listItemRe.exec(line)
        if (!m) continue
        const indent = m[1].length
        const text = m[2].trim()

        const wm = wikilinkRe.exec(text)
        const target = wm ? wm[1].trim() : null
        const label = wm
            ? (wm[2] || wm[1]).trim().split('/').pop() || wm[1]
            : text.replace(/\[x\]|\[ \]/ig, '').replace(/\*\*/g, '').trim()

        const isChecked = text.toLowerCase().startsWith('[x]')
        const depth = Math.floor(indent / 2)
        const node: NavNode = { label, target, depth, children: [], isChecked }

        // Pop stack until parent depth < current depth
        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
            stack.pop()
        }

        if (stack.length === 0) {
            roots.push(node)
        } else {
            stack[stack.length - 1].children.push(node)
        }
        stack.push(node)
    }
    return roots
}

function HubConnectionsNav({ content, activePath, onNavigate, onToggleCheckbox }: { content: string, activePath: string | null, onNavigate: (name: string) => void, onToggleCheckbox: (label: string, isChecked: boolean, target: string | null) => void }) {
    const activeNoteName = activePath?.split('/').pop()?.replace('.md', '').replace('.pdf', '')?.toLowerCase() || ''
    const tree = parseHubTree(content)

    function isActive(node: NavNode): boolean {
        if (!node.target) return false
        const targetClean = node.target.split('/').pop()?.replace('.md', '')?.replace('.pdf', '')?.toLowerCase() || ''
        return targetClean === activeNoteName || node.label.toLowerCase() === activeNoteName
    }

    function renderNode(node: NavNode, idx: number): React.ReactNode {
        const active = isActive(node)
        const hasChildren = node.children.length > 0
        const indentLevel = node.depth
        const isRoot = indentLevel === 0

        return (
            <div key={`${node.target ?? node.label}-${idx}`} className="group/nav-item">
                <div 
                    className={cn(
                        "flex items-center transition-all duration-200 border-l py-1.5",
                        active 
                            ? "border-primary bg-accent/50 -mr-3 pr-3" 
                            : isRoot ? "border-transparent text-muted-foreground" : "border-transparent text-muted-foreground group-hover/nav-item:border-border"
                    )}
                    style={{ paddingLeft: (indentLevel * 12) + 8 }}
                >
                    {node.target ? (
                        <div className="flex items-center w-full gap-2">
                            <input 
                                type="checkbox" 
                                checked={node.isChecked} 
                                onChange={(e) => onToggleCheckbox(node.label, e.target.checked, node.target)}
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px] border border-muted-foreground/30 text-primary bg-background appearance-none checked:bg-primary checked:border-primary cursor-pointer" 
                            />
                            <button
                                onClick={() => onNavigate(node.target!)}
                                className={cn(
                                    "text-left leading-tight truncate transition-colors flex-1",
                                    active 
                                        ? "text-[11px] font-black text-foreground" 
                                        : "text-[10px] font-bold group-hover/nav-item:text-foreground"
                                )}
                                title={node.target}
                            >
                                {node.label}
                            </button>
                        </div>
                    ) : (
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest leading-none px-1 py-0.5 rounded",
                            isRoot ? "text-foreground bg-muted" : "text-muted-foreground/50"
                        )}>
                            {node.label}
                        </span>
                    )}
                </div>
                {hasChildren && (
                    <div className="mt-0.5 mb-1.5">
                        {node.children.map((child, cidx) => renderNode(child, cidx))}
                    </div>
                )}
            </div>
        )
    }

    if (tree.length === 0) {
        return (
            <div className="py-6 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                No connections
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-0.5 mt-2">
            {tree.map((node, idx) => renderNode(node, idx))}
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
    
    const { isFullscreen, setIsFullscreen } = useLayout()
    const [showProperties, setShowProperties] = useState(false)

    // --- PDF State & Ref ---
    const pdfRef = useRef<any>(null)
    const [pdfState, setPdfState] = useState({
        page: 1,
        pageCount: 1,
        sidebarOpen: false,
        isFullscreen: false
    })

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
    const [hubConnections, setHubConnections] = useState<string | null>(null)

    useEffect(() => {
        const fetchHubConnections = async () => {
            const rawHub = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.concept_hub || noteMetadata?.course || noteMetadata?.Course || noteMetadata?.semester;
            if (!rawHub) {
                setHubConnections(null)
                return
            }
            
            try {
                const hubItems = Array.isArray(rawHub) ? rawHub : [rawHub];
                const cleanHubName = String(hubItems[0] || '').replace(/\[\[/g, '').replace(/\]\]/g, '').trim();
                
                if (!cleanHubName) {
                    setHubConnections(null);
                    return;
                }
                
                const res = await sidecarApi.findVaultPage(cleanHubName)
                let topologies: string | null = null;
                
                const tryPath = async (p: string) => {
                    try {
                        const note = await sidecarApi.readObsidianNote(p)
                        if (note.content) {
                            const match = note.content.match(/(?:#+\s*Core Topologies.*?|#+\s*Connections)\s*\n([\s\S]*?)(?=\n#+\s|$)/i)
                            if (match && match[1]) {
                                return match[1].trim()
                            }
                        }
                    } catch(e) {}
                    return null;
                }

                if (res.found && res.path) {
                    topologies = await tryPath(res.path)
                }
                
                if (!topologies) {
                    topologies = await tryPath(`3-Database/06 - Study Planner/${cleanHubName}.md`)
                }
                
                if (!topologies) {
                    topologies = await tryPath(`3-Database/06 - Study Planner/${cleanHubName}_Hub.md`)
                }
                
                if (!topologies) {
                    topologies = await tryPath(`3-Database/06 - Study Planner/3_Relational_Model_And_Database_Design_Hub.md`)
                }
                
                const tryPathWithSuffix = async (p: string) => {
                    if (res.found && res.path) return topologies;
                    const res2 = await sidecarApi.findVaultPage(`${cleanHubName}_Hub`)
                    if (res2.found && res2.path) {
                        return await tryPath(res2.path)
                    }
                    return null;
                }

                if (!topologies) {
                    topologies = await tryPathWithSuffix(cleanHubName)
                }
                
                if (topologies) {
                    const pageName = selectedPath?.split('/').pop()?.replace('.md', '').replace('.pdf', '') || '';
                    if (pageName) {
                        // Bold the current active note
                        const regex = new RegExp(`(\\[\\[${pageName}\\]\\])`, 'gi');
                        topologies = topologies.replace(regex, `**$1**`);
                    }
                    setHubConnections(topologies)
                } else {
                    setHubConnections(null)
                }
            } catch (err) {
                console.error("Failed to fetch hub connections", err)
                setHubConnections(null)
            }
        }
        
        fetchHubConnections()
    }, [noteMetadata, selectedPath])

    const handleToggleCheckbox = async (label: string, isChecked: boolean, target: string | null) => {
        if (hubConnections && selectedPath) {
            try {
                const rawHub = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.concept_hub || noteMetadata?.course || noteMetadata?.Course || noteMetadata?.semester;
                let cleanHubName = '';
                if (rawHub) {
                    const hubItems = Array.isArray(rawHub) ? rawHub : [rawHub];
                    cleanHubName = String(hubItems[0] || '').replace(/\[\[/g, '').replace(/\]\]/g, '').trim();
                }
                if (!cleanHubName && !selectedPath.toLowerCase().endsWith('.pdf')) {
                    cleanHubName = selectedPath.split('/').pop()?.replace('.md', '') || '';
                }

                if (cleanHubName) {
                    const res = await sidecarApi.findVaultPage(cleanHubName);
                    let hubPath = res.path;
                    if (!hubPath) {
                        const res2 = await sidecarApi.findVaultPage(`${cleanHubName}_Hub`);
                        hubPath = res2.path;
                    }
                    if (hubPath) {
                        const hubData = await sidecarApi.readObsidianNote(hubPath);
                        if (hubData.content) {
                            const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex = new RegExp(`- \\[\\[?[ xX]\\]?\\] (\\[\\[${escapedLabel}\\]\\]|\\*\\*\\[\\[${escapedLabel}\\]\\]\\*\\*|${escapedLabel})`, 'gi');
                            const newCheck = isChecked ? 'x' : ' ';
                            const updatedContent = hubData.content.replace(regex, `- [${newCheck}] $1`);
                            await sidecarApi.updateObsidianNote(hubPath, updatedContent);
                            
                            // Re-fetch hub visually via state update
                            setNoteMetadata({ ...noteMetadata });
                        }
                    }
                }

                if (target) {
                    const resTarget = await sidecarApi.findVaultPage(target);
                    if (resTarget.path) {
                        const targetData = await sidecarApi.readObsidianNote(resTarget.path);
                        let newContent = targetData.content;
                        if (newContent.includes('read: ')) {
                            newContent = newContent.replace(/read:\s*(true|false|True|False)/i, `read: ${isChecked}`);
                        } else if (newContent.startsWith('---\n')) {
                            newContent = newContent.replace('---\n', `---\nread: ${isChecked}\n`);
                        }
                        await sidecarApi.updateObsidianNote(resTarget.path, newContent);
                    }
                }
            } catch(e) {
                console.error("Failed to toggle checkbox", e);
            }
        }
    }

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
                
                if (res.status === 'error') {
                    throw new Error(res.message || res.detail || "Backend generation failed.");
                }
                
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
                                isSelected ? "bg-accent text-accent-foreground font-medium rounded-md mx-2 px-2" : "hover:bg-accent/50 text-muted-foreground"
                            )}
                        >
                            {node.isFolder ? (
                                <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", isExpanded ? "rotate-90 text-muted-foreground" : "text-muted-foreground")} />
                            ) : (
                                <div className="w-3.5 h-3.5 shrink-0 text-transparent" />
                            )}
                            
                            {node.isFolder ? (
                                <Folder className={cn("w-4 h-4 shrink-0", isSelected ? "text-accent-foreground" : "text-muted-foreground")} />
                            ) : node.path.toLowerCase().endsWith('.pdf') ? (
                                <FileText className={cn("w-4 h-4 shrink-0", isSelected ? "text-accent-foreground" : "text-red-500/70")} />
                            ) : (
                                <FileText className={cn("w-4 h-4 shrink-0", isSelected ? "text-accent-foreground" : "text-muted-foreground")} />
                            )}
                            
                            <span className="truncate text-[13px] flex-1">{node.name}</span>

                            <button
                                onClick={(e) => handleDeleteItem(e, node.path, node.isFolder)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
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
        <div className="flex flex-col h-full w-full select-none bg-background text-foreground overflow-hidden font-sans">
            <div className="flex flex-1 overflow-hidden h-full">
                {/* MainContentArea */}
                <main className="flex-1 flex flex-col min-w-0">
                    <div className="flex flex-1 overflow-hidden">
                        {/* ExplorerSidebar */}
                        {!isFullscreen && (
                        <aside className="w-64 border-r border-border flex flex-col bg-background shrink-0">
                            {/* Explorer Toolbar */}
                            <div className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 w-full">
                                    <div className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center p-1 rounded hover:bg-accent shrink-0" title="New file">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="relative flex items-center">
                                            <Search className="absolute left-2 w-3.5 h-3.5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-muted border border-border text-[12px] px-2 py-1.5 pl-7 rounded focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground transition-shadow"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center p-1 rounded hover:bg-accent shrink-0" title="Collapse sidebar">
                                        <ChevronLeft className="w-5 h-5" />
                                    </div>
                                    <div 
                                        className={cn("cursor-pointer flex items-center justify-center p-1 rounded hover:bg-accent shrink-0", showGraphView ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground")} 
                                        onClick={() => setShowGraphView(!showGraphView)} 
                                        title="Toggle Graph View"
                                    >
                                        <Network className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* File Tree */}
                            <div className="flex-1 overflow-y-auto min-h-0 text-[13px] text-muted-foreground custom-scrollbar">
                                <div className="py-2">
                                    {files.length > 0 ? renderTree(fileTree) : (
                                        <div className="py-10 text-center opacity-40">
                                            <Database size={24} className="mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-[10px] font-bold uppercase">Vault Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                        )}

                        {/* Editor Workspace */}
                        <section className="flex-1 flex bg-background overflow-hidden">
                            {showGraphView ? (
                                <div className="flex-1">
                                    <ObsidianGraphView onNodeClick={(path) => {
                                        selectFile(path);
                                        setShowGraphView(false);
                                    }} />
                                </div>
                            ) : (
                                <>
                                    {/* Sticky Connections Column */}
                                    {selectedPath && !selectedPath.toLowerCase().endsWith('.pdf') && (
                                        <aside className="w-52 shrink-0 border-r border-border flex flex-col bg-background overflow-hidden">
                                            <div className="sticky top-0 flex flex-col h-full overflow-hidden">
                                                {/* Header */}
                                                <div className="px-4 pt-5 pb-3 flex items-center gap-2 border-b border-border shrink-0">
                                                    <Network size={11} className="text-muted-foreground shrink-0" />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Connections</span>
                                                </div>

                                                {/* Hub name badge */}
                                                {(() => {
                                                    const hubName = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.HUB || noteMetadata?.concept_hub || noteMetadata?.course || noteMetadata?.Course
                                                    if (!hubName) return null
                                                    const clean = typeof hubName === 'string' ? hubName.replace(/\[\[/g, '').replace(/\]\]/g, '').split('/').pop() : ''
                                                    return (
                                                        <div className="px-4 py-2 shrink-0">
                                                            <button
                                                                onClick={() => handleWikiLinkClick(typeof hubName === 'string' ? hubName.replace(/\[\[/g, '').replace(/\]\]/g, '') : '')}
                                                                className="w-full text-left text-[9px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground truncate transition-colors"
                                                                title={clean || ''}
                                                            >
                                                                {clean}
                                                            </button>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Connection links */}
                                                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6">
                                                    {hubConnections ? (
                                                        <HubConnectionsNav
                                                            content={hubConnections}
                                                            activePath={selectedPath}
                                                            onNavigate={handleWikiLinkClick}
                                                            onToggleCheckbox={handleToggleCheckbox}
                                                        />
                                                    ) : (
                                                        <div className="py-8 flex flex-col items-center gap-2 opacity-25">
                                                            <Network size={18} strokeWidth={1.5} className="text-muted-foreground" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center">No hub linked</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </aside>
                                    )}

                                    {/* Scrollable Content Column */}
                                    <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                                    {!selectedPath ? (
                                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground/30 gap-4 mt-32">
                                            <FileText size={64} strokeWidth={1} />
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Select an asset to visualize</p>
                                        </div>
                                    ) : (
                                        <div className={cn("mx-auto py-12 px-16 w-full max-w-full overflow-hidden", selectedPath.toLowerCase().endsWith('.pdf') ? "max-w-none" : "max-w-5xl")}>
                                            {loadingNote ? (
                                                <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                                    <RefreshCw size={24} className="animate-spin" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Loading Document...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Top Bar: History & Actions */}
                                                    <div className="flex items-start justify-between mb-8 opacity-100 transition-opacity gap-8">
                                                        <div className="flex flex-col gap-4 flex-1">
                                                            <div className="flex items-center gap-4">
                                                                {/* History Controls */}
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button 
                                                                        onClick={handleBack}
                                                                    disabled={historyIndex <= 0}
                                                                    className={cn(
                                                                        "flex items-center justify-center w-7 h-7 rounded-md border transition-all shadow-sm",
                                                                        historyIndex > 0 
                                                                            ? "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary" 
                                                                            : "bg-muted border-muted text-muted-foreground/30 cursor-not-allowed"
                                                                    )}
                                                                    title="Go back"
                                                                >
                                                                    <ChevronLeft size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={handleForward}
                                                                    disabled={historyIndex >= history.length - 1}
                                                                    className={cn(
                                                                        "flex items-center justify-center w-7 h-7 rounded-md border transition-all shadow-sm",
                                                                        historyIndex < history.length - 1 
                                                                            ? "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary" 
                                                                            : "bg-muted border-muted text-muted-foreground/30 cursor-not-allowed"
                                                                    )}
                                                                    title="Go forward"
                                                                >
                                                                    <ChevronRight size={16} />
                                                                </button>
                                                                </div>

                                                                {/* PDF Specific Controls */}
                                                                {selectedPath.toLowerCase().endsWith('.pdf') && (
                                                                    <div className="flex items-center gap-4 flex-1 justify-end">
                                                                        {/* Navigation & Status Bundle */}
                                                                        <div className="flex items-center gap-1.5 bg-muted rounded-lg border border-border p-0.5 pr-2 shadow-sm">
                                                                            <div className="flex items-center gap-0.5">
                                                                                <button 
                                                                                    onClick={() => pdfRef.current?.handlePrev()}
                                                                                    className="p-1.5 hover:bg-background rounded-md transition-all text-muted-foreground hover:text-foreground hover:shadow-sm"
                                                                                    title="Previous Page"
                                                                                >
                                                                                    <ChevronLeft size={16} />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => pdfRef.current?.handleNext()}
                                                                                    className="p-1.5 hover:bg-background rounded-md transition-all text-muted-foreground hover:text-foreground hover:shadow-sm"
                                                                                    title="Next Page"
                                                                                >
                                                                                    <ChevronRight size={16} />
                                                                                </button>
                                                                            </div>
                                                                            <div className="w-px h-3 bg-border mx-0.5" />
                                                                            <div className="flex items-center gap-1 min-w-[32px] justify-center">
                                                                                <span className="text-[10px] font-black text-foreground tabular-nums">{pdfState.page}</span>
                                                                                <span className="text-[9px] font-bold text-muted-foreground/40">/</span>
                                                                                <span className="text-[10px] font-black text-muted-foreground tabular-nums">{pdfState.pageCount}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Actions Bundle */}
                                                                        <div className="flex items-center gap-1">
                                                                            <button 
                                                                                onClick={() => pdfRef.current?.toggleSidebar()}
                                                                                className={cn(
                                                                                    "flex items-center justify-center w-8 h-8 rounded-md border transition-all shadow-sm",
                                                                                    pdfState.sidebarOpen 
                                                                                        ? "bg-primary border-primary text-primary-foreground" 
                                                                                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary"
                                                                                )}
                                                                                title="Toggle Assistant Sidebar"
                                                                            >
                                                                                <PanelLeft size={16} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => setIsFullscreen(!isFullscreen)}
                                                                                className={cn(
                                                                                    "flex items-center justify-center w-8 h-8 rounded-md border transition-all shadow-sm",
                                                                                    isFullscreen 
                                                                                        ? "bg-primary border-primary text-primary-foreground" 
                                                                                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary"
                                                                                )}
                                                                                title="Fullscreen"
                                                                            >
                                                                                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons for Markdown */}
                                                        {!selectedPath.toLowerCase().endsWith('.pdf') && (
                                                            <div className="flex flex-col items-end gap-3 opacity-100 transition-opacity shrink-0">
                                                                {isEditing ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <button 
                                                                            onClick={handleSaveNote}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
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
                                                                            className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-sm"
                                                                        >
                                                                            <X size={14} /> Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                        <div className="flex flex-row flex-wrap items-center justify-end gap-2 shrink-0">
                                                                            <button 
                                                                                onClick={() => setIsFullscreen(!isFullscreen)}
                                                                                className="flex items-center justify-center w-7 h-7 bg-background border border-border text-muted-foreground rounded-md hover:text-foreground hover:border-primary transition-all shadow-sm"
                                                                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                                                            >
                                                                                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />} 
                                                                            </button>

                                                                            <button 
                                                                                onClick={() => setShowProperties(!showProperties)}
                                                                                className="flex items-center justify-center w-7 h-7 bg-background border border-border text-muted-foreground rounded-md hover:text-foreground hover:border-primary transition-all shadow-sm"
                                                                                title={showProperties ? "Hide Properties" : "View Properties"}
                                                                            >
                                                                                {showProperties ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 
                                                                            </button>

                                                                            <button 
                                                                                onClick={() => setIsEditing(true)}
                                                                                className="flex items-center justify-center w-7 h-7 bg-background border border-border text-muted-foreground rounded-md hover:text-foreground hover:border-primary transition-all shadow-sm"
                                                                                title="Edit Note"
                                                                            >
                                                                                <Edit3 size={14} />
                                                                            </button>

                                                                            <button 
                                                                                onClick={(e) => handleDeleteItem(e as any, selectedPath!, false)}
                                                                                className="flex items-center justify-center w-7 h-7 bg-background border border-border text-muted-foreground rounded-md hover:text-destructive hover:border-destructive transition-all shadow-sm"
                                                                                title="Delete Note"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                            
                                                                            {(() => {
                                                                                const metadata = noteMetadata || {};
                                                                                const rawSource = metadata.source || metadata.Source;
                                                                                
                                                                                let pages: number[] = [];
                                                                                const rawPages = metadata.source_pages || metadata.occurrence || metadata.Occurrence || metadata.source_page || metadata.Source_Page;
                                                                                
                                                                                if (Array.isArray(rawPages)) {
                                                                                    pages = rawPages.map(Number).filter(p => !isNaN(p));
                                                                                } else if (typeof rawPages === 'number') {
                                                                                    pages = [rawPages];
                                                                                } else if (typeof rawPages === 'string') {
                                                                                    pages = rawPages.split(',').map(p => Number(p.trim())).filter(p => !isNaN(p));
                                                                                }
                                                                                
                                                                                if (rawSource) {
                                                                                    const sourceStr = Array.isArray(rawSource) ? String(rawSource[0]) : String(rawSource);
                                                                                    const match = sourceStr.match(/\[\[(.*?)\]\]/);
                                                                                    const cleanPath = match ? match[1] : sourceStr;
                                                                                    
                                                                                    if (cleanPath) {
                                                                                        return (
                                                                                            <div className="flex flex-col items-end gap-2">
                                                                                                <button 
                                                                                                    onClick={() => handleWikiLinkClick(cleanPath, pages[0] || 1, pages)}
                                                                                                    className="flex items-center justify-center h-7 px-3 bg-background border border-border text-muted-foreground rounded-md hover:text-foreground hover:border-primary transition-all shadow-sm group/btn"
                                                                                                >
                                                                                                    <FileText size={14} className="group-hover/btn:rotate-6 transition-transform text-indigo-500/50 group-hover/btn:text-indigo-500 mr-1.5" /> 
                                                                                                    <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                                                                                                        Jump to PDF {pages.length === 1 && pages[0] > 1 ? `(P. ${pages[0]})` : ''}
                                                                                                    </span>
                                                                                                </button>
                                                                                                
                                                                                                {pages.length > 1 && (
                                                                                                    <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-[200px]">
                                                                                                        <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-tighter">Occurrences:</span>
                                                                                                        {pages.slice(0, 5).map((p, idx) => (
                                                                                                            <button
                                                                                                                key={idx}
                                                                                                                onClick={() => handleWikiLinkClick(cleanPath, p, pages)}
                                                                                                                className="px-1.5 py-0.5 bg-muted border border-border text-muted-foreground rounded hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-500/10 text-[9px] font-medium transition-colors"
                                                                                                            >
                                                                                                                P.{p}
                                                                                                            </button>
                                                                                                        ))}
                                                                                                        {pages.length > 5 && (
                                                                                                            <span className="text-[9px] text-muted-foreground/30 italic">+{pages.length - 5} more</span>
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

                                                    {/* Page Title */}
                                                    <div className="flex items-start justify-between mb-12 group">
                                                        <h1 className="text-5xl font-extrabold text-foreground tracking-tight leading-tight flex-1">
                                                            {selectedPath.split('/').pop()?.replace('.md', '').replace('.pdf', '')}
                                                        </h1>
                                                    </div>

                                                    {selectedPath.toLowerCase().endsWith('.pdf') ? (
                                                        <div className="h-[calc(100vh-280px)] -mx-16 mb-20">
                                                            <PdfViewer 
                                                                ref={pdfRef}
                                                                path={selectedPath} 
                                                                title={selectedPath.split('/').pop() || ''} 
                                                                initialPage={selectedPage} 
                                                                filterPages={selectedFilteredPages}
                                                                onStateChange={(state) => setPdfState({
                                                                    page: state.page,
                                                                    pageCount: state.pageCount || 1,
                                                                    sidebarOpen: state.sidebarOpen,
                                                                    isFullscreen: state.isFullscreen
                                                                })}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {showProperties && (
                                                                <NoteProperties 
                                                                    metadata={noteMetadata} 
                                                                    onNavigate={handleWikiLinkClick} 
                                                                />
                                                            )}

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
                                                                        className="w-full h-[600px] p-8 bg-muted border border-border rounded-2xl font-mono text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                                                                        placeholder="Start writing..."
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    <MarkdownViewer content={noteContent} onNavigate={handleWikiLinkClick} path={selectedPath || undefined} />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                </>
                            )}
                        </section>

                        {/* Right: OKA Architect (Collapsible Panel) */}
                        {showArchitect && (
                            <div className="w-[400px] border-l border-border bg-muted/30 flex flex-col shrink-0 overflow-hidden relative z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                                {/* OKA Header */}
                                <div className="p-4 border-b border-border bg-background flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <BrainCircuit size={16} className="text-foreground" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Knowledge Architect</h3>
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded border border-border">
                                        <span className="text-[8px] font-bold uppercase text-muted-foreground">Auto</span>
                                        <button 
                                            onClick={toggleAutoDeploy}
                                            className={cn("relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out", config?.autoDeploy ? 'bg-primary' : 'bg-muted-foreground/30')}
                                        >
                                            <span className={cn("pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out", config?.autoDeploy ? 'translate-x-3.5' : 'translate-x-0')} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-muted/10 min-h-0 custom-scrollbar">
                                    <div className="p-4 space-y-6">
                                        {/* Pipeline Status */}
                                        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Pipeline</h4>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", queueStatus?.status !== 'idle' ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                                                    <span className="text-[10px] font-bold uppercase text-foreground">{queueStatus?.status || 'Idle'}</span>
                                                </div>
                                                <span className="text-[9px] font-medium text-muted-foreground">{queueStatus?.pending_count || 0} Pending</span>
                                            </div>
                                            {queueStatus?.status !== 'idle' && (
                                                <div className="space-y-1.5">
                                                    <p className="text-[9px] text-muted-foreground truncate">{queueStatus?.current_file}</p>
                                                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(queueStatus?.current_batch / (queueStatus?.total_batches || 1)) * 100}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Inbox Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inbox</h4>
                                            <div className="grid gap-1.5">
                                                {inboxFiles.length > 0 ? inboxFiles.map(f => (
                                                    <div 
                                                        key={f.path} 
                                                        onClick={() => { setSelectedInboxFile(f); setOkaError(null); setActivePlan(null); setIsAwaitingConfirmation(false); }}
                                                        className={cn(
                                                            "p-2.5 rounded-md border text-[10px] cursor-pointer transition-all", 
                                                            selectedInboxFile?.path === f.path ? "bg-accent border-border" : "bg-background hover:bg-accent/50 border-border"
                                                        )}
                                                    >
                                                        <p className="font-bold text-foreground truncate">{f.name}</p>
                                                        <p className="text-muted-foreground truncate mt-0.5">{f.path}</p>
                                                    </div>
                                                )) : (
                                                    <div className="py-8 text-center border border-dashed border-border rounded-lg text-muted-foreground">
                                                        <Archive size={20} className="mx-auto mb-1 opacity-50" />
                                                        <p className="text-[9px] font-bold uppercase">Inbox Empty</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Workspace Area */}
                                        {selectedInboxFile && (
                                            <div className="pt-4 border-t border-border space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Active Analysis</h4>
                                                    <button onClick={resetOkaSession} className="text-[9px] font-bold text-muted-foreground hover:text-foreground transition-colors">Reset</button>
                                                </div>
                                                
                                                {!activePlan && !processing && (
                                                    <Button onClick={processSelectedFile} className="w-full h-8 text-[10px] font-bold uppercase bg-background border border-border text-foreground hover:bg-accent">
                                                        <Zap size={12} className="mr-2" /> Analyze Document
                                                    </Button>
                                                )}

                                                {processing && (
                                                    <div className="py-10 text-center space-y-3">
                                                        <RefreshCw size={24} className="animate-spin mx-auto text-muted-foreground" />
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Architecting...</p>
                                                    </div>
                                                )}

                                                {activePlan && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent border border-border">
                                                            <Sparkles size={12} className="text-foreground animate-pulse" />
                                                            <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Architectural Plan</p>
                                                        </div>
                                                        
                                                        {/* Clean Text-based Plan Output */}
                                                        <div className="p-4 rounded-xl bg-background border border-border shadow-sm max-h-[400px] overflow-y-auto">
                                                            <div className="prose prose-xs max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {activePlan}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>

                                                        {isAwaitingConfirmation && (
                                                            <Button onClick={() => confirmDeployment()} className="w-full h-10 text-[10px] font-bold uppercase bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-black/10 tracking-widest">
                                                                <ShieldCheck size={14} className="mr-2" /> Start Deployment
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}

                                                {batchFeed.length > 0 && (
                                                    <div className="space-y-3 pt-4 border-t border-border">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-bold uppercase text-muted-foreground">Deploy Progress</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground">{currentBatch} / {totalBatches} Batches</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {batchFeed.map(b => (
                                                                <div key={b.batch} className="space-y-1.5">
                                                                    <div className="flex items-center gap-2 py-1">
                                                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-border">
                                                                            <span className="text-[8px] font-bold text-foreground">{b.batch}</span>
                                                                        </div>
                                                                        <span className="text-[9px] font-bold uppercase text-foreground">Batch {b.batch} Deployed</span>
                                                                    </div>
                                                                    {b.results.map((r: any, idx: number) => (
                                                                        <div key={`${b.batch}-${idx}`} className="p-2.5 border border-border rounded-md bg-background space-y-1 shadow-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText size={10} className="text-muted-foreground shrink-0" />
                                                                                <span className="text-[10px] font-semibold truncate text-foreground">{r.title}</span>
                                                                                <span className="ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r.status || 'created'}</span>
                                                                            </div>
                                                                            {r.path && (
                                                                                <p className="text-[8px] text-muted-foreground font-mono truncate pl-5">{r.path}</p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {okaError && (
                                                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-[10px] font-mono text-destructive">
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
