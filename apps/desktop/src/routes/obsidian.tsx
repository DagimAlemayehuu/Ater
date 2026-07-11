/* eslint-disable @typescript-eslint/no-explicit-any */
import {useState, useRef, useEffect, useMemo, useCallback, useTransition} from 'react'
import {
 Trash2, ShieldCheck, RefreshCw,
 Sparkles, Paperclip, FileText, Folder, ChevronRight,
  X, Zap,
 Database, Search, Archive,
 ChevronDown, ChevronUp, Maximize2, Minimize2, Info, PanelLeft,
  Plus, ArrowLeft, ChevronLeft, GraduationCap, Calendar, Building, Circle, Network,
  Edit3, Save, FolderPlus, Hash, CheckSquare, Link, List, Heart,
  Activity, Play, SkipForward, MapPin
} from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { useConfig } from '@/lib/ConfigContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PanelLoader } from '@/components/ui/loading-state'
import { MarkdownViewer } from '@/components/obsidian/MarkdownViewer'
import { PdfViewer } from '@/components/obsidian/PdfViewer'
import { ObsidianGraphView } from '@/components/obsidian/ObsidianGraphView'
import { ObsidianEditor } from '@/components/obsidian/ObsidianEditor'
import { NoteProperties } from '@/components/obsidian/NoteProperties'
import { LearningWorkspace } from '@/components/intelligence/LearningWorkspace'
import { parseHubTree } from '@/components/obsidian/HubConnectionsNav'
import { KnowledgeFooter } from '@/components/obsidian/KnowledgeFooter'
import { useLayout } from '@/context/layout-provider'
import { useNavigation } from '@/context/navigation-context'
import { useHeader } from '@/context/header-context'
import { useSidebarContent } from '@/context/sidebar-content-context'
import React, { lazy, Suspense } from 'react'
import { sidecarApi, ObsidianFile } from '@/lib/sidecarApi'
import { updateProperty, deleteProperty, toggleChecklistLink, parseFrontmatter } from '@/lib/markdownHelper'
import { useArtifactStore } from '@/lib/artifacts/store'
import { extractArtifacts } from '@/lib/artifacts/parser'
import { UnifiedSandboxViewer } from '@/components/obsidian/UnifiedSandboxViewer'


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

const cleanTitle = (val: any): string => {
  if (val === undefined || val === null) return ''
  return String(val).replace(/\[\[(.*?)\]\]/g, '$1').replace(/_/g, ' ').trim()
}

const isTemporaryLessonPath = (path?: string | null) => {
  return typeof path === 'string' && path.includes('remediation_temp')
}

interface FileTreeItemProps {
  node: FileNode
  level: number
  selectedPath: string | null
  renamingPath: string | null
  newItemName: string
  creatingInPath: string | null
  creatingType: 'file' | 'folder' | null
  expandedFolders: Set<string>
  dragOverPath: string | null
  draggedPath: string | null
  searchQuery: string
  onToggleFolder: (path: string) => void
  onSelectFile: (path: string) => void
  onStartRename: (path: string, name: string) => void
  onDelete: (path: string, isFolder: boolean) => void
  onNewItem: (parentPath: string, type: 'file' | 'folder') => void
  onRenameChange: (name: string) => void
  onRenameSubmit: () => void
  onRenameCancel: () => void
  onCreateChange: (name: string) => void
  onCreateSubmit: () => void
  onCreateCancel: () => void
  onDragStart: (e: React.DragEvent, path: string) => void
  onDragOver: (e: React.DragEvent, path: string) => void
  onDragLeave: (e: React.DragEvent, path: string) => void
  onDrop: (e: React.DragEvent, targetPath: string | null) => void
  onDragEnd: () => void
  renderTree: (nodes: FileNode[], level: number) => React.ReactNode
  lockedNotes?: Set<string>
}

const FileTreeItem = React.memo(({
  node,
  level,
  selectedPath,
  renamingPath,
  newItemName,
  creatingInPath,
  creatingType,
  expandedFolders,
  dragOverPath,
  draggedPath,
  searchQuery,
  onToggleFolder,
  onSelectFile,
  onStartRename,
  onDelete,
  onNewItem,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onCreateChange,
  onCreateSubmit,
  onCreateCancel,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  renderTree,
  lockedNotes
}: FileTreeItemProps) => {
  const isExpanded = expandedFolders.has(node.path) || searchQuery !== ''
  const isSelected = selectedPath === node.path
  const isRenaming = renamingPath === node.path
  const isLocked = !node.isFolder && lockedNotes?.has(String(node.path).replace(/\\/g, '/').toLowerCase())

  return (
    <div
     className="flex flex-col"
     onDragOver={(e) => !isLocked && onDragOver(e, node.path)}
     onDragLeave={(e) => !isLocked && onDragLeave(e, node.path)}
     onDragEnd={onDragEnd}
     onDrop={(e) => !isLocked && onDrop(e, node.path)}
    >
      <div
        draggable={!isLocked}
        data-tour={!node.isFolder ? 'obsidian-file-item' : undefined}
        onDragStart={(e) => !isLocked && onDragStart(e, node.path)}
        onClick={() => {
          if (isLocked) {
            toast.error("This lesson is locked. Complete your current lesson first.")
            return
          }
          node.isFolder ? onToggleFolder(node.path) : onSelectFile(node.path)
        }}
        className={cn(
          "flex items-center gap-1.5 py-1 cursor-pointer px-2 group relative rounded-[4px] mx-1",
          isSelected
            ? "bg-bento-item text-foreground font-semibold shadow-sm"
            : isLocked
              ? "text-muted-foreground/30 opacity-40 cursor-not-allowed"
              : "hover:bg-foreground/[0.03] text-muted-foreground hover:text-foreground",
          dragOverPath === node.path && "bg-bento-item/50 ring-1 ring-[#242426] ring-inset",
          draggedPath === node.path && "opacity-40 grayscale"
        )}
      >
        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
          {node.isFolder ? (
            <ChevronRight className={cn("w-3 h-3 ", isExpanded ? "rotate-90" : "")} />
          ) : null}
        </div>

        {node.isFolder ? (
          <Folder className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground/60")} />
        ) : (typeof node.path === 'string' && node.path.toLowerCase().endsWith('.pdf')) ? (
          <FileText className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground/50")} />
        ) : (
          <FileText className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground/40")} />
        )}

        {isRenaming ? (
          <input
            autoFocus
            className="flex-1 bg-background border border-primary rounded-[8px] px-1 py-0 text-[12px] outline-none h-5"
            value={newItemName}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubmit()
              if (e.key === 'Escape') onRenameCancel()
            }}
            onBlur={onRenameSubmit}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-[12px] flex-1">
            {node.name.replace('.md', '').replace('.pdf', '')}
          </span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0 ">
          {node.isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNewItem(node.path, 'file')
              }}
              className="p-0.5 hover:bg-accent hover:text-foreground rounded-[8px] "
              title="New file"
            >
              <Plus size={10} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStartRename(node.path, node.name)
            }}
            className="p-0.5 hover:bg-accent hover:text-foreground rounded-[8px] "
            title="Rename"
          >
            <Edit3 size={10} />
          </button>
          <button
            onClick={(e) => onDelete(node.path, node.isFolder)}
            className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded-[8px] "
            title="Delete"
          >
            <Trash2 size={10} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      {node.isFolder && isExpanded && (
        <div className="pl-3.5 border-l border-border/10 ml-[9px]">
          {creatingInPath === node.path && creatingType && (
            <div className="flex items-center gap-1.5 py-1 px-2">
              <div className="w-4 h-4 shrink-0" />
              {creatingType === 'folder' ? <Folder size={12} className="text-muted-foreground/60" /> : <FileText size={12} className="text-muted-foreground/40" />}
              <input
                autoFocus
                className="flex-1 bg-background border border-primary rounded-[8px] px-1 py-0 text-[12px] outline-none h-5"
                placeholder={`New ${creatingType}...`}
                value={newItemName}
                onChange={(e) => onCreateChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCreateSubmit()
                  if (e.key === 'Escape') onCreateCancel()
                }}
                onBlur={onCreateSubmit}
              />
            </div>
          )}
          {node.children && renderTree(node.children, level + 1)}
        </div>
      )}
    </div>
  )
});


function normalizeHub(h: any) { 
  if (!h) return h;
  return { 
    ...h, 
    title: h.title ?? h.name ?? 'Untitled', 
    name: h.name ?? h.title ?? '' 
  };
}

function normalizeFile(f: any) { 
  if (!f) return f;
  return { 
    ...f, 
    name: f.name ?? f.title ?? 'Untitled',
    title: f.title ?? f.name ?? '' 
  };
}

const normalizeVaultPath = (p: string) => String(p || '').replace(/\\/g, '/').toLowerCase()

const academicHubPathFromNote = (notePath: string, hubName: string): string => {
  const normalized = String(notePath || '').replace(/\\/g, '/')
  const match = normalized.match(/^Notes\/academic\/([^/]+)\/([^/]+)\/([^/]+)\//i)
  if (!match || !hubName) return ''
  return `database/study planner/${match[1]}/${match[2]}/${match[3]}/${hubName.replace(/\.md$/i, '')}.md`
}

export default function ObsidianVaultPage() {  const { config, saveConfig } = useConfig()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  const {
    setCurrentHub, setIsActive, setShowOverlay,
    setTimeLeft, setShowStats, mode, addNoteFocus, currentHub
  } = usePomodoroStore()
  const location = useLocation()

  // --- Focus Tracking ---
  const [entryTime] = useState(() => Date.now());
  const entryTimeRef = useRef<number>(entryTime);
  const lastPathRef = useRef<string | null>(null);

  // --- Layout State ---

  const [showGraphView, setShowGraphView] = useState(() => searchParams.get('graph') === '1')


  const [sidebarTab, setSidebarTab] = useState<'explorer' | 'hubs' | 'pdfs'>('explorer')
  const [hubs, setHubs] = useState<any[]>([])
  const [loadingHubs, setLoadingHubs] = useState(false)
 // --- Vault Explorer State ---
 const [files, setFiles] = useState<ObsidianFile[]>([])
 const [loadingFiles, setLoadingFiles] = useState(false)
 const [selectedPath, setSelectedPath] = useState<string | null>(null)
 const [loadedPath, setLoadedPath] = useState<string | null>(null)
 const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
 const selectRequestId = useRef(0)
 const [selectedPage, setSelectedPage] = useState(1)
 const [selectedFilteredPages, setSelectedFilteredPages] = useState<number[]>([])
const [noteMetadata, setNoteMetadata] = useState<Record<string, any>>({})
 const [noteContent, setNoteContent] = useState('')
   const noteContentRef = useRef('')

  useEffect(() => {
    const isGraph = searchParams.get('graph') === '1';
    if (isGraph !== showGraphView) {
      setShowGraphView(isGraph);
    }
  }, [searchParams]);

  useEffect(() => {
    const isGraph = searchParams.get('graph') === '1' || showGraphView;
    const hasPath = !!searchParams.get('path') || !!selectedPath;
    if (!hasPath && !isGraph && isMountedRef.current) {
      navigate('/academic');
    }
  }, [selectedPath, searchParams, showGraphView, navigate]);

  const {
    artifacts,
    isPanelOpen,
    panelWidth,
    setPanelOpen,
    resetArtifacts
  } = useArtifactStore()
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)

  // --- Card Dashboard States ---
  const [dashboardTab, setDashboardTab] = useState<'hubs' | 'inbox' | 'pdfs'>('hubs')
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('')
  
  const [workspaceHub, setWorkspaceHub] = useState<string | null>(null)
  const [workspaceHubNotes, setWorkspaceHubNotes] = useState<string[]>([])
  const [loadingHubNotes, setLoadingHubNotes] = useState(false)
  
  // Load notes inside a hub when workspaceHub changes
  useEffect(() => {
    if (!workspaceHub) {
      setWorkspaceHubNotes([])
      return
    }
    let active = true
    const loadNotesFromHub = async () => {
      setLoadingHubNotes(true)
      try {
        const res = await sidecarApi.readObsidianNote(workspaceHub)
        if (!active) return
        const content = res.content || ''
        const regex = /\[\[(.*?)\]\]/g
        const links: string[] = []
        let match
        while ((match = regex.exec(content)) !== null) {
          const rawLink = match[1]
          const cleanLink = rawLink.split('|')[0].trim().replace(/ /g, '_')
          if (cleanLink && !links.includes(cleanLink)) {
            links.push(cleanLink)
          }
        }
        setWorkspaceHubNotes(links)
      } catch (err) {
        console.error('Failed to read hub notes:', err)
      } finally {
        if (active) setLoadingHubNotes(false)
      }
    }
    loadNotesFromHub()
    return () => {
      active = false
    }
  }, [workspaceHub])
  // Listen for remediation lesson navigation in Knowledge Base
  useEffect(() => {
    const handleOpenRemediation = (event: Event) => {
      const detail = (event as CustomEvent<{ tempPath: string }>).detail || {};
      if (detail.tempPath) {
        setSelectedPath(detail.tempPath);
      }
    };

    const handleRestoreOriginal = (event: Event) => {
      const detail = (event as CustomEvent<{ originalPath: string }>).detail || {};
      if (detail.originalPath) {
        setSelectedPath(detail.originalPath);
      }
    };

    window.addEventListener('ater:open-remediation-lesson', handleOpenRemediation);
    window.addEventListener('ater:restore-original-lesson', handleRestoreOriginal);

    return () => {
      window.removeEventListener('ater:open-remediation-lesson', handleOpenRemediation);
      window.removeEventListener('ater:restore-original-lesson', handleRestoreOriginal);
    };
  }, []);

  // Clean up temporary note when leaving Knowledge Base
  useEffect(() => {
    return () => {
      void sidecarApi.deleteObsidianItem('database/learning paths/remediation_temp.md').catch(() => {});
    };
  }, []);

  // Dragging split logic for resizing
  useEffect(() => {
    if (!isDraggingSplit) return

    const onMove = (event: MouseEvent) => {
      const viewportWidth = window.innerWidth || 1
      const rightWidth = viewportWidth - event.clientX
      useArtifactStore.getState().setPanelWidth((rightWidth / viewportWidth) * 100)
    }
    const onUp = () => setIsDraggingSplit(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingSplit])

  // Parse artifacts automatically on note content changes
  useEffect(() => {
    if (selectedPath && !selectedPath.toLowerCase().endsWith('.pdf') && noteContent) {
      const extracted = extractArtifacts(noteContent)
      if (extracted.artifacts.length > 0) {
        useArtifactStore.getState().registerArtifacts(extracted.artifacts)
        useArtifactStore.getState().setPanelOpen(true)
      } else {
        useArtifactStore.getState().resetArtifacts()
      }
    } else {
      useArtifactStore.getState().resetArtifacts()
    }
  }, [noteContent, selectedPath])

  // Reset store on unmount
  useEffect(() => {
    return () => {
      useArtifactStore.getState().resetArtifacts()
    }
  }, [])

  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  // --- Note List for Autocomplete ---
  const noteList = useMemo(() => {
    return files
      .filter(f => !f.is_dir && typeof (f.name ?? (f as any).title) === 'string' && (f.name ?? (f as any).title ?? '').toLowerCase().endsWith('.md'))
      .map(f => (f.name ?? (f as any).title ?? '').slice(0, -3))
  }, [files])

  // --- PDF State & Ref ---
  const pdfRef = useRef<any>(null)
  const [pdfState, setPdfState] = useState({
    page: 1,
    pageCount: 1,
    sidebarOpen: false,
    isFullscreen: false
  })
  const [waypoints, setWaypoints] = useState<number[]>([])
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0)
  const { push, history, currentIndex } = useNavigation()
  const { setCenterContent, setRightContent } = useHeader()
  const { isFullscreen, setIsFullscreen } = useLayout()
  const { setSidebarContent } = useSidebarContent()
  const handlePdfStateChange = useCallback((state: any) => {
    setPdfState({
      page: state.page,
      pageCount: state.pageCount || 1,
      sidebarOpen: state.sidebarOpen,
      isFullscreen: state.isFullscreen
    })
  }, [])

  // --- Focus Tracking Effect ---
  useEffect(() => {
    // Record time spent on the PREVIOUS note
    if (lastPathRef.current && lastPathRef.current !== selectedPath) {
      const duration = Math.floor((Date.now() - entryTimeRef.current) / 1000);
      if (duration >= 5) { // Only record if spent more than 5 seconds
        addNoteFocus(lastPathRef.current, duration, currentHub);
      }
    }

    // Reset for the NEW note
    entryTimeRef.current = Date.now();
    lastPathRef.current = selectedPath;
  }, [selectedPath, addNoteFocus, currentHub]);

  // Record on unmount
  useEffect(() => {
    return () => {
      if (lastPathRef.current) {
        const duration = Math.floor((Date.now() - entryTimeRef.current) / 1000);
        if (duration >= 5) {
          addNoteFocus(lastPathRef.current, duration, currentHub);
        }
      }
    };
  }, [addNoteFocus, currentHub]);

  // --- Header Action Registration ---
  useEffect(() => {
    // Center Content (Status/Meta)
    setCenterContent(null)

     // Right Content (Actions)
     setRightContent(
       <div className="flex items-center gap-1.5">
         {selectedPath && (
           <>
             {isEditing ? (
               <div className="flex items-center gap-1.5">
                 <button
                   onClick={handleSaveNote}
                   className="h-8 px-3 bg-primary text-primary-foreground rounded-[8px] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:opacity-90"
                 >
                   <Save size={12} /> SAVE
                 </button>
                 <button
                   onClick={() => setIsEditing(false)}
                   className="h-8 px-3 bg-muted text-muted-foreground rounded-[8px] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-accent"
                 >
                   <X size={12} /> CANCEL
                 </button>
               </div>
             ) : (
               <div className="flex items-center gap-1">
                 <button
                   onClick={() => setIsEditing(true)}
                   className="w-8 h-8 flex items-center justify-center bg-background border border-border text-muted-foreground rounded-[8px] hover:text-foreground hover:border-primary  shadow-sm"
                   title="Edit Note"
                 >
                    <Edit3 size={14} />
                 </button>
                 {(noteMetadata?.source_file || noteMetadata?.source) && (
                   <button
                      data-tour="btn-jump-pdf"
                      onClick={async () => {
                        const src = noteMetadata.source_file || noteMetadata.source
                        if (!src) return;
                                                 let cleanPath = src
                         if (Array.isArray(src) && src.length > 0) {
                           cleanPath = src[0]
                         }
                         if (typeof cleanPath === 'string') {
                           cleanPath = cleanPath.replace(/^\[+/, '').replace(/\]+$/, '').split('|')[0]
                           if (cleanPath.includes('#')) {
                             cleanPath = cleanPath.split('#')[0]
                           }
                         }

                        // 2. Resolve Waypoints
                        const wps = Array.isArray(noteMetadata.source_pages)
                          ? noteMetadata.source_pages
                          : (noteMetadata.source_pages ? [noteMetadata.source_pages] : (noteMetadata.source_page ? [noteMetadata.source_page] : []))

                        const numericWaypoints = wps.map(Number).filter(n => !isNaN(n))
                        const firstPage = numericWaypoints.length > 0 ? numericWaypoints[0] : 1

                        // 3. Resolve Path via sidecar to ensure exact match even if moved/nested
                        let resolvedPath = cleanPath
                        try {
                          const searchRes = await sidecarApi.findVaultPage(cleanPath)
                          if (searchRes.found && searchRes.path) {
                            resolvedPath = searchRes.path
                          } else {
                            // Fallback to searching only by filename in case the PDF was moved (e.g. to Inbox/Generated)
                            const parts = cleanPath.split(/[/\\]/)
                            const filename = parts[parts.length - 1]
                            if (filename) {
                              const searchRes2 = await sidecarApi.findVaultPage(filename)
                              if (searchRes2.found && searchRes2.path) {
                                resolvedPath = searchRes2.path
                              }
                            }
                          }
                        } catch (err) {
                          console.error("[Jump] Path resolution failed", err)
                        }

                        // 4. Trigger Select
                        setWaypoints(numericWaypoints)
                        setCurrentWaypointIndex(0)
                        await selectFile(resolvedPath, firstPage, false, [], true)
                      }}
                     className="w-8 h-8 flex items-center justify-center bg-background border border-border text-muted-foreground rounded-[8px] hover:text-foreground hover:border-primary  shadow-sm"
                     title="Jump to Source PDF"
                   >
                     <FileText size={14} />
                   </button>
                 )}
                   <button
                      data-tour="btn-toggle-properties"
                      onClick={() => config && saveConfig({ showProperties: !config.showProperties })}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-[8px] border  shadow-sm",
                         config?.showProperties
                         ? "bg-foreground/10 border-foreground/50 text-foreground"
                         : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                      )}
                      title="Toggle Properties"
                    >
                      <Info size={14} />
                    </button>
               </div>
             )}
           </>
         )}

         {selectedPath && typeof selectedPath === 'string' && selectedPath.toLowerCase().endsWith('.pdf') && (
            <div className="flex items-center gap-1.5">
              {/* Waypoint Navigation (if multiple) */}
              {waypoints.length > 1 && (
                <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-[8px] border border-primary/20 h-8">
                  <MapPin size={10} className="text-primary opacity-50 mr-0.5" />
                  <div className="flex items-center gap-1">
                    {waypoints.map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentWaypointIndex(idx);
                          pdfRef.current?.handleJump(page);
                        }}
                        className={cn(
                          "w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-[8px] border transition-none",
                          currentWaypointIndex === idx
                            ? "bg-foreground/10 border-foreground/50 text-foreground shadow-sm"
                            : "bg-background/50 border-border/40 text-muted-foreground/60 hover:border-foreground/40 hover:text-foreground"
                        )}
                        title={`Jump to Page ${page}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-[8px] border border-border/50 h-8">
             <button
               onClick={() => pdfRef.current?.handlePrev()}
               className="p-1 hover:bg-background rounded-[8px]  text-muted-foreground hover:text-foreground"
             >
               <ChevronLeft size={12} />
             </button>
             <div className="flex items-center gap-1 min-w-[32px] justify-center px-1">
               <span className="text-[10px] font-black text-foreground tabular-nums">{pdfState.page}</span>
               <span className="text-[9px] font-bold text-muted-foreground/40">/</span>
               <span className="text-[10px] font-black text-muted-foreground tabular-nums">{pdfState.pageCount}</span>
             </div>
             <button
               onClick={() => pdfRef.current?.handleNext()}
               className="p-1 hover:bg-background rounded-[8px]  text-muted-foreground hover:text-foreground"
             >
               <ChevronRight size={12} />
             </button>
           </div>
            </div>
         )}

         {selectedPath && (
           <button
             onClick={() => setIsFullscreen(!isFullscreen)}
             className={cn(
               "w-8 h-8 flex items-center justify-center rounded-[8px] border  shadow-sm",
                isFullscreen
                ? "bg-foreground/10 border-foreground/50 text-foreground"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
             )}
             title={isFullscreen ? "Exit Focus Mode" : "Focus Mode"}
           >
             {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
           </button>
         )}
       </div>
     )

     return () => {
       setCenterContent(null)
       setRightContent(null)
     }
  }, [selectedPath, isEditing, isFullscreen, pdfState.page, pdfState.pageCount, noteMetadata, config, saveConfig, setCenterContent, setRightContent, setIsFullscreen])

 // --- Sync & Topology Cache ---
 const currentHubPath = useRef<string | null>(null);


 // --- File Operations State ---
 const [renamingPath, setRenamingPath] = useState<string | null>(null)
 const [newItemName, setNewItemName] = useState('')
 const [creatingInPath, setCreatingInPath] = useState<string | null>(null) // Path of parent folder
 const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null)

  // --- Sidebar Resize State ---
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  // --- Navigation Listener ---
  useEffect(() => {
    const entry = history[currentIndex];
    if (entry && entry.type === 'file' && entry.path !== selectedPath) {
      selectFile(entry.path, entry.metadata?.page || 1, true, entry.metadata?.filterPages || []);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(160, Math.min(window.innerWidth * 0.4, e.clientX))
        setSidebarWidth(newWidth)
      }
    }
    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])


 const handleSRSRating = async (rating: number) => {
   if (!selectedPath) return;
   try {
     await sidecarApi.srsReview(selectedPath, rating);
     toast.success("SRS progress saved!");
   } catch (e: any) {
     toast.error("Failed to save SRS review: " + e.message);
   }
 };

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
 const [inputValue, setInputValue] = useState('')
 const [isPending, startTransition] = useTransition()
 const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

 // --- Ater Agent State ---
 const [queueStatus, setQueueStatus] = useState<any>(null)
 const [inboxFiles, setInboxFiles] = useState<InboxFile[]>([])
 const [loadingInbox, setLoadingInbox] = useState(false)
 const [selectedInboxFile, setSelectedInboxFile] = useState<InboxFile | null>(null)
 const [processing, setProcessing] = useState(false)
 const [activePlan, setActivePlan] = useState<string | null>(null)
 const [planData, setPlanData] = useState<any | null>(null)
 const [sessionId, setSessionId] = useState<string | null>(null)
 const [lockedNotes, setLockedNotes] = useState<Set<string>>(new Set())
 const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
 const [currentBatch, setCurrentBatch] = useState<number>(0)
 const [totalBatches, setTotalBatches] = useState<number>(0)
 const [isCompleted, setIsCompleted] = useState(false)
 const [batchFeed, setBatchFeed] = useState<any[]>([])
 const [aterError, setAterError] = useState<string | null>(null)
 const [hubConnections, setHubConnections] = useState<string | null>(null)
 const studyTree = useMemo(() => parseHubTree(hubConnections || ''), [hubConnections])

 const fetchHubConnections = useCallback(async () => {
 if (!noteMetadata || Object.keys(noteMetadata).length === 0) {
 setHubConnections(null)
 return
}

 // Expanded key list for hub detection
 const hubKeys = ['hub', 'Hub', 'HUB', 'concept_hub', 'course_hub', 'area', 'project']
 let rawHub: any = null
 for (const key of hubKeys) {
 if (noteMetadata[key]) {
 rawHub = noteMetadata[key]
 break
}
}

 // Heuristic: If it's a Hub note itself, the hub is "self"
 const isHubNote = (typeof loadedPath === 'string' && loadedPath.toLowerCase().includes('_hub.md')) || noteMetadata?.type?.toLowerCase() === 'hub'

 if (!rawHub && !isHubNote) {
 setHubConnections(null)
 return
}

 try {
 let topologies: string | null = null

 const extractSection = (content: string) => {
 if (!content) return null
 const normalized = content.replace(/\r\n/g, '\n');
 const match = normalized.match(/(?:#+\s*(?:Core Topologies|Connections|Structure|Nav|Outline|Course Map|Curriculum).*?)\s*\n([\s\S]*?)(?=\n#+\s|$)/i)
 if (match && match[1]) return match[1].trim()
 const listMatch = normalized.match(/(?:^|\n)(\s*[-*]\s+[\s\S]*?)(?=\n\n|\n#|$)/)
 if (listMatch && listMatch[1]) return listMatch[1].trim()
 return normalized.trim()
}

 if (isHubNote && noteContent) {
 topologies = extractSection(noteContent)
}

  if (!topologies && rawHub) {
  const hubItems = Array.isArray(rawHub) ? rawHub : [rawHub]
  const hubVal = hubItems[0]
  const cleanHubName = String(hubVal).replace(/^\[+/, '').replace(/\]+$/, '').split('|')[0].trim()

  if (cleanHubName) {
  const tryPath = async (p: string) => {
  try {
  const note = await sidecarApi.readObsidianNote(p)
  return extractSection(note.content)
} catch(e) {console.error(e);}
  return null
}

  const academicHubPath = academicHubPathFromNote(String(loadedPath || ''), cleanHubName)
  if (academicHubPath) {
  topologies = await tryPath(academicHubPath)
}

  if (!topologies) {
  const res = await sidecarApi.findVaultPage(cleanHubName)
  if (res.found && res.path) {
    topologies = await tryPath(res.path)
  }
}

  if (!topologies) {
  const searchPaths = [
   `database/study planner/${cleanHubName}.md`,
   `database/study planner/${cleanHubName}_Hub.md`,
   `database/areas/${cleanHubName}.md`,
   `database/areas/${cleanHubName}_Hub.md`,
  `${cleanHubName}_Hub.md`
  ]
  for (const p of searchPaths) {
  topologies = await tryPath(p)
  if (topologies) break
}
}
}
}

 if (topologies) {
  const pageName = typeof loadedPath === 'string' ? loadedPath.split(/[/\\]/).pop()?.replace('.md', '').replace('.pdf', '') || '' : ''
  if (pageName) {
  const escapedPageName = pageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(\\[\\[${escapedPageName}(?:\\|[^\\]]*)?\\]\\])`, 'gi')
  topologies = topologies.replace(regex, `**$1**`)
}
 setHubConnections(topologies)
} else {
 setHubConnections(null)
}
} catch (e) {
  console.error("[HubConnections] fetchHubConnections failed:", e);
  setHubConnections(null);
}
}, [noteMetadata, loadedPath, noteContent])

  // ── Shared helper: surgically update ONE frontmatter key without touching anything else ──
  const updateFrontmatterProperty = async (
  path: string,
  key: string,
  value: string | boolean | number,
  currentMetadata?: Record<string, any>
  ): Promise<void> => {
  const noteData = await sidecarApi.readObsidianNote(path);
  const content: string = noteData.content ?? '';
  const newFileContent = updateProperty(content, key, value);
  await sidecarApi.updateObsidianNote(path, newFileContent);
 };

  useEffect(() => {
  fetchHubConnections()
 }, [fetchHubConnections])

  const handleToggleCheckbox = async (label: string, isChecked: boolean, target: string | null, skipAtomicUpdate: boolean = false) => {
  if (!selectedPath) return;
  try {
  // 1. Update the Hub Note checkbox
  const rawHub = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.concept_hub;
  let cleanHubName = '';
  if (rawHub) {
  const hubItems = Array.isArray(rawHub) ? rawHub : [rawHub];
  cleanHubName = String(hubItems[0] || '').replace(/^\[+/, '').replace(/\]+$/, '').trim();
 }

  const isCurrentAHub = (typeof selectedPath === 'string' && selectedPath.toLowerCase().includes('_hub.md')) || noteMetadata?.type?.toLowerCase() === 'hub';
  if (!cleanHubName && isCurrentAHub) {
  cleanHubName = typeof selectedPath === 'string' ? selectedPath.split(/[/\\]/).pop()?.replace('.md', '') || '' : '';
 }

  if (cleanHubName) {
  const res = await sidecarApi.findVaultPage(cleanHubName);
  const hubPath = res.path || (files.find(f => (f.name ?? (f as any).title ?? '').toLowerCase().includes(cleanHubName.toLowerCase()))?.path);

  if (hubPath) {
  const hubData = await sidecarApi.readObsidianNote(hubPath);
  if (hubData.content) {
          const { content: updatedContent, updated } = toggleChecklistLink(
            hubData.content,
            target || label || '',
            isChecked
          );

          if (updated) {
            await sidecarApi.updateObsidianNote(hubPath, updatedContent);
            if (selectedPath === hubPath) {
              setNoteContent(updatedContent);
              setEditedContent(updatedContent);
            }
          }
        }
      }
    }

  // 2. Update the atomic note's internal 'read' property
  if (skipAtomicUpdate) return;
  const targetPath = (target && target.endsWith('.md')) ? target : null;
  let resTarget = {found: !!targetPath, path: targetPath};
  if (!resTarget.found) {
  resTarget = (await sidecarApi.findVaultPage(target || label)) as {found: boolean, path: string | null};
 }

  if (resTarget.found && resTarget.path) {
  await updateFrontmatterProperty(resTarget.path, 'read', isChecked);
  if (selectedPath === resTarget.path) {
  setNoteMetadata(prev => ({...prev, read: isChecked}));
 }
 }
 } catch(e) {
  console.error("[Sync] handleToggleCheckbox failed:", e);
 }
 }

  const handleAddProperty = async (name: string, type: string) => {
  if (!selectedPath || !name) return
  setLoadingNote(true)
  try {
  const res = await sidecarApi.readObsidianNote(selectedPath)
  let content = res.content
  let defaultValue: any = '""'
  if (type === 'checkbox') defaultValue = 'false'
  if (type === 'number') defaultValue = '0'
  if (type === 'list') defaultValue = '[]'
  if (type === 'link') defaultValue = '"[[]]"'
  if (type === 'date') defaultValue = `"${new Date().toISOString().split('T')[0]}"`

  const newPropLine = `${name}: ${defaultValue}\n`

  if (content.startsWith('---\n')) {
  const endMatch = content.indexOf('\n---', 4)
  if (endMatch !== -1) {
  content = content.slice(0, endMatch) + '\n' + newPropLine + content.slice(endMatch)
} else {
  content = content.replace('---\n', `---\n${newPropLine}`)
}
} else {
  content = `---\n${newPropLine}---\n\n${content}`
}

  await sidecarApi.updateObsidianNote(selectedPath, content)
  const refreshed = await sidecarApi.readObsidianNote(selectedPath)
  setNoteMetadata(refreshed.metadata || {})
  setNoteContent(refreshed.content || '')
  setEditedContent(refreshed.content || '')
} catch (err) {
  console.error("Failed to add property", err)
} finally {
  setLoadingNote(false)
}
}

  const handleUpdateProperty = async (name: string, value: any) => {
  if (!selectedPath) return;
  setLoadingNote(true);
  try {
  // Use the shared helper – guarantees ONLY this key changes
  const finalVal = typeof value === 'boolean' ? value
  : (value === 'true' || value === 'false') ? (value === 'true')
  : typeof value === 'number' ? value
  : String(value);

  await updateFrontmatterProperty(selectedPath, name, finalVal, noteMetadata);

  const refreshed = await sidecarApi.readObsidianNote(selectedPath);
  setNoteMetadata(refreshed.metadata ?? {});

  // Sync 'read' to Hub checkbox (bi-directional)
  if (name.toLowerCase() === 'read') {
  const label = selectedPath.split(/[/\\]/).pop()?.replace('.md', '') ?? '';
  await handleToggleCheckbox(label, !!value, selectedPath, true);
}
} catch (err) {
  console.error('[Property] Failed to update property:', err);
} finally {
  setLoadingNote(false)
}
};

 const handleDeleteProperty = async (name: string) => {
  if (!selectedPath) return
  setLoadingNote(true)
  try {
  const res = await sidecarApi.readObsidianNote(selectedPath)
  const content = res.content
  const newContent = deleteProperty(content, name)

  await sidecarApi.updateObsidianNote(selectedPath, newContent)
  const refreshed = await sidecarApi.readObsidianNote(selectedPath)
  setNoteMetadata(refreshed.metadata || {})
  setNoteContent(refreshed.content || '')
  setEditedContent(refreshed.content || '')
} catch (err) {
  console.error("Failed to delete property", err)
} finally {
  setLoadingNote(false)
}
}

  useEffect(() => {
    let active = true
    const fetchSessionLockState = async () => {
      const activeSessionId = localStorage.getItem('ater_active_session_id')
      if (!activeSessionId) {
        if (active) setLockedNotes(new Set())
        return
      }
      try {
        const session = await sidecarApi.getTutorStatus(activeSessionId)
        if (!session || !session.curriculum || !active) return

        const normalize = (p: string) => String(p || '').replace(/\\/g, '/').toLowerCase()
        const completed = new Set((session.completed_notes || []).map(normalize))
        const unlocked = new Set((session.active_note_unlocks || []).map(normalize))
        const current = normalize(session.current_note_path || '')

        const lockedSet = new Set<string>()
        session.curriculum.forEach((p: string) => {
          const normP = normalize(p)
          if (!completed.has(normP) && !unlocked.has(normP) && normP !== current) {
            lockedSet.add(normP)
          }
        })
        if (active) setLockedNotes(lockedSet)
      } catch (err) {
        console.error('Failed to fetch locks for tree view:', err)
      }
    }
    void fetchSessionLockState()
    return () => { active = false }
  }, [selectedPath, location.search])

  // --- Sync & Polling ---
  useEffect(() => {
    if (location.pathname !== '/obsidian') return

    const searchParams = new URLSearchParams(location.search)
    const initSearch = searchParams.get('search')
    const initPath = searchParams.get('path')
    const initPage = parseInt(searchParams.get('page') || '1')
    const initFilterRaw = searchParams.get('filterPages')
    const initFilterPages = initFilterRaw ? initFilterRaw.split(',').map(Number) : []
    const initFullscreen = searchParams.get('fullscreen') === 'true'

    if (initFullscreen) {
      setIsFullscreen(true)
    }

    if (initPath) {
      // Sync state from URL if different
      if (initPath !== selectedPath || initPage !== selectedPage) {
        selectFile(initPath, initPage, true, initFilterPages)
      }

      // Expand parent folders
      const parts = initPath.split(/[/\\]/)
      const toExpand: string[] = []
      let current = ''
      parts.slice(0, -1).forEach(part => {
        current = current ? `${current}/${part}` : part
        toExpand.push(current)
      })
      setExpandedFolders(prev => {
        const next = new Set(prev)
        toExpand.forEach(p => next.add(p))
        return next
      })
    } else {
      if (selectedPath !== null) {
        setSelectedPath(null)
      }
      if (Object.keys(noteMetadata).length > 0) {
        setNoteMetadata({})
      }
      if (noteContent !== '') {
        setNoteContent('')
      }
      if (editedContent !== '') {
        setEditedContent('')
      }
      if (initSearch) {
        if (searchQuery !== initSearch) {
          setSearchQuery(initSearch)
          setInputValue(initSearch)
        }
      } else {
        if (searchQuery !== '') {
          setSearchQuery('')
          setInputValue('')
        }
      }
    }
  }, [location.search, location.pathname, selectedPath, selectedPage, noteMetadata, noteContent, editedContent, searchQuery])

 useEffect(() => {
 fetchFiles()
 fetchStatus()
 fetchInbox()

 // Polling for realtime sync
 const interval = setInterval(() => {
 fetchFiles()
 fetchStatus()
}, 15000)

 return () => clearInterval(interval)
}, [config?.obsidianVaultPath])

 // --- Actions ---
 const fetchFiles = useCallback(async () => {
 setLoadingFiles(true)
 try {
 const res = await sidecarApi.listObsidianFiles()
 setFiles((res.files || []).map(normalizeFile))
} catch (err) {
 console.error('Failed to fetch obsidian files:', err)
} finally {
 setLoadingFiles(false)
}
}, [])

 const fetchStatus = async () => {
 try {
 const res = await sidecarApi.aterQueueStatus()
 setQueueStatus(res)
} catch (err) {console.error(err)}
}

 const fetchInbox = async () => {
 setLoadingInbox(true)
 try {
 const res = await sidecarApi.aterListInbox()
 setInboxFiles(res.files || [])
} finally {setLoadingInbox(false)}
}

 const handleDeleteItem = useCallback(async (path: string, isFolder: boolean) => {
    // 1. Lock Protection
    try {
      const isLocked = await checkLockState(path)
      if (isLocked) {
        toast.error("This lesson is locked and cannot be deleted.")
        return
      }
    } catch (err) {
      console.error("Lock check error:", err)
    }

    // 2. User Confirmation
    const itemName = path.split(/[/\\]/).pop() || 'item';
    if (!window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

 try {
 await sidecarApi.deleteObsidianItem(path)
 await fetchFiles()
 if (selectedPath === path || selectedPath?.startsWith(path + '/')) {
 setSelectedPath(null)
 setLoadedPath(null)
 setNoteMetadata({})
 setNoteContent('')
 setEditedContent('')
 setHubConnections(null)
}
} catch (err: any) {
 toast.error(`Delete failed: ${err.message}`)
}
}, [fetchFiles, selectedPath, lockedNotes])

 const handleCreateItem = useCallback(async () => {
 if (!newItemName) {
 setCreatingInPath(null)
 setCreatingType(null)
 return
}

 const path = creatingInPath ? `${creatingInPath}/${newItemName}` : newItemName
 const fullPath = creatingType === 'file' ? (path.endsWith('.md') ? path : `${path}.md`) : path

 // Lock Protection for parent folder
 if (creatingInPath) {
    try {
      const isLocked = await checkLockState(creatingInPath)
      if (isLocked) {
        toast.error("The target folder is locked.")
        setCreatingInPath(null)
        setCreatingType(null)
        return
      }
    } catch (err) {
      console.error("Lock check error:", err)
    }
 }

 try {
 if (creatingType === 'file') {
 await sidecarApi.createObsidianFile(fullPath, `---\ntitle: ${newItemName.replace('.md', '')}\n---\n\n`)
} else {
 await sidecarApi.createObsidianFolder(fullPath)
}
 await fetchFiles()
 setCreatingInPath(null)
 setCreatingType(null)
 setNewItemName('')
 if (creatingType === 'file') {
 selectFile(fullPath)
}
} catch (err: any) {
 toast.error(`Creation failed: ${err.message}`)
}
}, [creatingInPath, creatingType, newItemName, fetchFiles])

 const handleRenameItem = useCallback(async () => {
 if (!renamingPath || !newItemName) {
 setRenamingPath(null)
 return
}

 // Lock Protection
 try {
   const isLocked = await checkLockState(renamingPath)
   if (isLocked) {
     toast.error("This lesson is locked and cannot be renamed.")
     setRenamingPath(null)
     return
   }
 } catch (err) {
   console.error("Lock check error:", err)
 }

 const parentPath = renamingPath.includes('/') ? renamingPath.substring(0, renamingPath.lastIndexOf('/')) : ''
 let newPath = parentPath ? `${parentPath}/${newItemName}` : newItemName

 // Preserve extension for files if not provided
 if (!renamingPath.endsWith('/') && renamingPath.includes('.')) {
 const ext = renamingPath.split('.').pop()
 if (!newPath.endsWith(`.${ext}`)) {
 newPath += `.${ext}`
}
}

 try {
 await sidecarApi.moveObsidianItem(renamingPath, newPath)
 await fetchFiles()
 if (selectedPath === renamingPath) {
 setSelectedPath(newPath)
}
 setRenamingPath(null)
 setNewItemName('')
} catch (err: any) {
  toast.error(`Rename failed: ${err.message}`)
 }
}, [renamingPath, newItemName, fetchFiles, selectedPath])



const [activeTutorSession, setActiveTutorSession] = useState<any | null>(null)

const activePreview = useMemo(() => {
  if (!selectedPath) return null;
  const rawHub = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.concept_hub;
  const hubValue = Array.isArray(rawHub) ? rawHub[0] : rawHub;
  const hubName = String(hubValue || '').replace(/^\[+/, '').replace(/\]+$/, '').split('|')[0].trim().replace(/\.md$/i, '');
  let resolvedHubPath = '';
  if (hubName) {
    resolvedHubPath = academicHubPathFromNote(selectedPath, hubName) || '';
  }
  const isHub = selectedPath.toLowerCase().includes('_hub.md') || String(noteMetadata?.type || '').toLowerCase() === 'hub';
  return {
    title: cleanTitle(noteMetadata?.title || noteMetadata?.Title || selectedPath.split(/[/\\]/).pop()?.replace('.md', '') || 'Lesson'),
    lessonPath: isHub ? selectedPath : resolvedHubPath,
    notePath: selectedPath,
    hubPath: isHub ? selectedPath : resolvedHubPath,
    previewUrl: '',
  };
}, [selectedPath, noteMetadata]);

const isLessonNote = useMemo(() => {
  if (!selectedPath) return false;
  const pathLower = selectedPath.toLowerCase();
  const rawHub = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.concept_hub;
  const isHub = pathLower.includes('_hub.md') || String(noteMetadata?.type || '').toLowerCase() === 'hub';
  return !!(isHub || rawHub);
}, [selectedPath, noteMetadata]);

const [isLessonActive, setIsLessonActive] = useState(false);

useEffect(() => {
  const isPanelOpen = localStorage.getItem('ater_lesson_panel_open') === 'true';
  const activeNotePath = localStorage.getItem('ater_study_active_note_path');
  if (isPanelOpen && activeNotePath === selectedPath && isLessonNote) {
    setIsLessonActive(true);
  } else {
    setIsLessonActive(false);
  }
}, [selectedPath, isLessonNote]);

const checkLockState = async (path: string): Promise<boolean> => {
  const targetPath = normalizeVaultPath(path)
  if (lockedNotes.has(targetPath)) return true

  const activeSessionId = localStorage.getItem('ater_active_session_id')
  if (!activeSessionId) return false

  try {
    const session = await sidecarApi.getTutorStatus(activeSessionId)
    if (!session || !session.curriculum) return false

    const inCurriculum = session.curriculum.some((p: string) => normalizeVaultPath(p) === targetPath)
    if (!inCurriculum) return false

    const completed = new Set((session.completed_notes || []).map(normalizeVaultPath))
    const unlocked = new Set((session.active_note_unlocks || []).map(normalizeVaultPath))
    const current = normalizeVaultPath(session.current_note_path || '')

    if (completed.has(targetPath) || unlocked.has(targetPath) || targetPath === current) {
      return false
    }

    return true // Locked
  } catch (err) {
    console.error('Error verifying lock status:', err)
    return false
  }
}

const selectFile = useCallback(async (path: string, page: number = 1, fromHistory: boolean = false, filterPages: number[] = [], keepMetadata: boolean = false) => {
    // Lock validation
    try {
      const isLocked = await checkLockState(path)
      if (isLocked) {
        toast.error("This lesson is locked. Complete your current lesson first.")
        return
      }
    } catch (err) {
      console.error("Lock check error:", err)
    }

    const norm = String(path).toLowerCase();
    const cleanItemName = path.split(/[/\\]/).pop()?.replace('.md', '') || '';
    if (norm.includes('database/courses/')) {
      navigate(`/academic?tab=COURSES&id=${encodeURIComponent(cleanItemName)}`);
      return;
    } else if (norm.includes('database/semesters/') || norm.includes('database/years/')) {
      navigate(`/academic?tab=PROGRAM&id=${encodeURIComponent(cleanItemName)}`);
      return;
    } else if (norm.includes('database/exams/')) {
      navigate(`/academic?tab=EXAMS&id=${encodeURIComponent(cleanItemName)}`);
      return;
    } else if (norm.includes('database/assignments/')) {
      navigate(`/academic?tab=ASSIGNMENTS&id=${encodeURIComponent(cleanItemName)}`);
      return;
    } else if (norm.includes('practice')) {
      navigate(`/academic?tab=PRACTICE&id=${encodeURIComponent(cleanItemName)}`);
      return;
    }

    if (!keepMetadata) {
      // Check if we are opening a PDF that matches the currently open note's source file,
      // in which case we want to extract and preserve the waypoints from the current note's metadata
      const isOpeningPdf = typeof path === 'string' && path.toLowerCase().endsWith('.pdf');
      const noteSource = noteMetadata?.source_file || noteMetadata?.source;
      let sourceMatches = false;
      if (isOpeningPdf && noteSource) {
        let cleanSource = '';
        if (Array.isArray(noteSource) && noteSource.length > 0) {
          cleanSource = noteSource[0];
        } else if (typeof noteSource === 'string') {
          cleanSource = noteSource;
        }
        cleanSource = cleanSource.replace(/^\[+/, '').replace(/\]+$/, '').split('|')[0].trim();
        const cleanSourceBase = cleanSource.split(/[/\\]/).pop()?.toLowerCase();
        const pathBase = path.split(/[/\\]/).pop()?.toLowerCase();
        if (cleanSourceBase && pathBase && (cleanSourceBase === pathBase || path.toLowerCase().includes(cleanSource.toLowerCase()))) {
          sourceMatches = true;
        }
      }

      if (sourceMatches) {
        const wps = Array.isArray(noteMetadata.source_pages)
          ? noteMetadata.source_pages
          : (noteMetadata.source_pages ? [noteMetadata.source_pages] : (noteMetadata.source_page ? [noteMetadata.source_page] : []));
        const numericWaypoints = wps.map(Number).filter(n => !isNaN(n));
        setWaypoints(numericWaypoints);
        const wpIndex = numericWaypoints.indexOf(page);
        setCurrentWaypointIndex(wpIndex >= 0 ? wpIndex : 0);
      } else {
        setWaypoints([]);
      }
    }

    // If the PDF is already active in the viewer, execute a direct jump without reloading or returning early
    if (selectedPath === path && path.toLowerCase().endsWith('.pdf')) {
      setSelectedPage(page);
      pdfRef.current?.handleJump(page);

      // Sync URL search params
      if (!fromHistory) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('path', path);
        if (page > 1) searchParams.set('page', page.toString());
        else searchParams.delete('page');
        if (filterPages.length > 0) searchParams.set('filterPages', filterPages.join(','));
        else searchParams.delete('filterPages');
        navigate(`/obsidian?${searchParams.toString()}`);
      }
      return;
    }

    // 0. Skip if already loading the exact same thing
    if (selectedPath === path && selectedPage === page && !fromHistory) {
      console.log(`[selectFile] Skip: Already on ${path}`);
      return;
    }

    // Always hide Graph View when a file/PDF is explicitly selected to show the main panel content
    setShowGraphView(false);

    selectRequestId.current += 1
    const currentReq = selectRequestId.current

    console.log(`[selectFile] START: ${path} (reqId: ${currentReq})`)

    if (!fromHistory) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('path', path);
      if (page > 1) searchParams.set('page', page.toString());
      else searchParams.delete('page');

      if (filterPages.length > 0) searchParams.set('filterPages', filterPages.join(','));
      else searchParams.delete('filterPages');

      navigate(`/obsidian?${searchParams.toString()}`);

      push({
        type: 'file',
        path: path,
        metadata: { page, filterPages }
      }, false);
    }

    setSelectedPath(path)
    setSelectedPage(page)
    setSelectedFilteredPages(filterPages)

    // Delayed loading state: Only show spinner if it takes > 150ms
    const loadingTimeout = setTimeout(() => {
      if (selectRequestId.current === currentReq) {
        setLoadingNote(true)
      }
    }, 150);

    // Safety timeout: 15 seconds max for any document load
    const safetyTimeout = setTimeout(() => {
      if (selectRequestId.current === currentReq) {
        console.warn(`[selectFile] Safety timeout triggered for ${path} (reqId: ${currentReq})`);
        setLoadingNote(false);
      }
    }, 15000);

    // PDFs are handled by an iframe, we don't need to read content here
    if (typeof path === 'string' && path.toLowerCase().endsWith('.pdf')) {
      console.log(`[selectFile] PDF detected: ${path}`);
      if (!keepMetadata) {
        setNoteMetadata({})
        setNoteContent('')
        setEditedContent('')
      }
      setIsEditing(false)
      clearTimeout(loadingTimeout)
      clearTimeout(safetyTimeout)
      setLoadingNote(false)
      setLoadedPath(path)
      return
    }

    try {
      console.log(`[selectFile] Fetching content: ${path}`);
      const res = await sidecarApi.readObsidianNote(path)

      // Prevent stale data from overwriting new request
      if (selectRequestId.current !== currentReq) {
        console.log(`[selectFile] Request ${currentReq} is stale, ignoring result.`);
        return
      }

      const content = res.content || '';
      const metadata = res.metadata || {};

      setNoteMetadata(metadata);
      setNoteContent(content);
      noteContentRef.current = content;
      setEditedContent(content);
      setIsEditing(false);
      setLoadedPath(path);

      console.log(`[selectFile] SUCCESS: ${path} (${content.length} chars)`);
    } catch (err) {
      console.error(`[selectFile] ERROR: Failed to read note: ${path}`, err)
      if (selectRequestId.current === currentReq) {
        setNoteMetadata({})
        setNoteContent('# Error\nFailed to load content. Please check if the file exists or the backend is running.')
        setLoadedPath(null)
      }
    } finally {
      clearTimeout(loadingTimeout);
      clearTimeout(safetyTimeout);
      if (selectRequestId.current === currentReq) {
        setLoadingNote(false)
      }
    }
  }, [navigate, noteMetadata, selectedPath, selectedPage, location.search, push, lockedNotes])

  const handleWikiLinkClick = async (pageName: string, pageNumber?: number, filterPages: number[] = []) => {
    let cleanPageName = pageName;
    let resolvedPageNumber = pageNumber;

    if (pageName && typeof pageName === 'string' && pageName.includes('#')) {
      const parts = pageName.split('#');
      cleanPageName = parts[0];
      const anchor = parts[1];
      if (anchor.startsWith('page=')) {
        const parsed = parseInt(anchor.replace('page=', ''), 10);
        if (!isNaN(parsed)) {
          resolvedPageNumber = parsed;
        }
      } else {
        const parsed = parseInt(anchor, 10);
        if (!isNaN(parsed)) {
          resolvedPageNumber = parsed;
        }
      }
    }

    selectRequestId.current += 1;
    const currentReq = selectRequestId.current;

    setLoadingNote(true);
    const safetyTimeout = setTimeout(() => {
      if (selectRequestId.current === currentReq) {
        console.warn(`[WikiLink] Safety timeout triggered for ${cleanPageName}`);
        setLoadingNote(false);
      }
    }, 15000);

    try {
      console.log(`[WikiLink] Finding page: ${cleanPageName} (resolvedPageNumber: ${resolvedPageNumber})`);
      const res = await sidecarApi.findVaultPage(cleanPageName);

      if (selectRequestId.current !== currentReq) return;
      if (res.found && res.path) {
        await selectFile(res.path, resolvedPageNumber, false, filterPages);
      } else if (res.found && res.type === 'database') {
        await selectFile(`database/${res.db_id}/${res.file_name}`, resolvedPageNumber, false, filterPages);
      } else {
        console.warn(`[WikiLink] Page not found: ${cleanPageName}. Creating new...`);
        // If the pageName looks like a path (contains slashes), resolve it from root instead of current folder.
        let newPath = "";
        if (pageName.includes('/')) {
          newPath = pageName.endsWith('.md') ? pageName : `${pageName}.md`;
        } else {
          let folder = 'database/bases/Inbox';
          if (selectedPath && selectedPath.includes('/')) {
            folder = selectedPath.substring(0, selectedPath.lastIndexOf('/'));
          }
          newPath = folder ? `${folder}/${pageName}.md` : `${pageName}.md`;
        }

        const initialContent = `---\ntitle: ${pageName.split(/[/\\]/).pop()?.replace('.md', '')}\nread: false\n---\n\n# ${pageName.split(/[/\\]/).pop()?.replace('.md', '')}\n`;

        await sidecarApi.createObsidianFile(newPath, initialContent);
        await fetchFiles();
        await selectFile(newPath, 1, false, []);
      }
    } catch (err) {
      console.error(`[WikiLink] Error:`, err);
      toast.error("Failed to resolve link");
    } finally {
      clearTimeout(safetyTimeout);
      if (selectRequestId.current === currentReq) {
        setLoadingNote(false);
      }
    }
  }

  const openSelectedInLessonRuntime = useCallback(async () => {
    const isCurrentHubNote = typeof selectedPath === 'string' && (
      selectedPath.toLowerCase().includes('_hub.md') ||
      selectedPath.toLowerCase().includes('database/study planner/') ||
      noteMetadata?.type?.toLowerCase() === 'hub'
    );

    if (isCurrentHubNote && selectedPath) {
      try {
        let tutorSession = null;
        try {
          tutorSession = await sidecarApi.getTutorSessionByHub(selectedPath);
        } catch (err) {
          console.error('Failed to fetch tutor session:', err);
        }

        let hubTargetPath = tutorSession?.current_note_path;
        if (!hubTargetPath && tutorSession?.curriculum && tutorSession.curriculum.length > 0) {
          hubTargetPath = tutorSession.curriculum[0];
        }
        if (!hubTargetPath && studyTree && studyTree.length > 0) {
          hubTargetPath = studyTree[0].target || '';
        }

        if (hubTargetPath) {
          let targetMetadata: any = {};
          try {
            const noteRes = await sidecarApi.readObsidianNote(hubTargetPath);
            if (noteRes && noteRes.metadata) {
              targetMetadata = noteRes.metadata;
            }
          } catch (err) {
            console.error('Failed to read note metadata for hubTargetPath:', err);
          }
          const title = cleanTitle(targetMetadata?.title || targetMetadata?.Title || hubTargetPath.split(/[/\\]/).pop()?.replace(/\.md$/i, '') || 'Lesson');
          const preview = {
            title,
            lessonPath: hubTargetPath,
            notePath: hubTargetPath,
            hubPath: selectedPath,
            previewUrl: '',
          };
          localStorage.setItem('ater_lesson_preview', JSON.stringify(preview));
          localStorage.setItem('ater_lesson_panel_open', JSON.stringify(true));
          localStorage.setItem('ater_study_active_note_path', hubTargetPath);
          localStorage.setItem('ater_canonical_lesson_path', hubTargetPath);
          localStorage.setItem('ater_original_note_path', hubTargetPath);
          setSelectedPath(hubTargetPath);
          setSearchParams({ path: hubTargetPath });
          setIsLessonActive(true);
          if (tutorSession) {
            setActiveTutorSession(tutorSession);
          }
          return;
        }
      } catch (err) {
        console.error('Failed to open hub lesson:', err);
      }
    }

    let targetPath = selectedPath;

    // Resolve the last atomic note from the active tutor session
    const activeSessionId = localStorage.getItem('ater_active_session_id');
    if (activeSessionId) {
      const session = sidecarApi.getTutorStatusSync();
      if (session) {
        const normalize = (p: string) => String(p || '').replace(/\\/g, '/').toLowerCase();
        const completed = new Set((session.completed_notes || []).map(normalize));
        const unlocked = new Set((session.active_note_unlocks || []).map(normalize));
        const current = normalize(session.current_note_path || '');

        let lastUnlocked = session.current_note_path || '';
        if (!lastUnlocked && session.curriculum) {
          for (let i = session.curriculum.length - 1; i >= 0; i--) {
            const note = session.curriculum[i];
            const normNote = normalize(note);
            if (completed.has(normNote) || unlocked.has(normNote) || normNote === current) {
              lastUnlocked = note;
              break;
            }
          }
        }
        if (lastUnlocked) {
          targetPath = lastUnlocked;
        }
      }
    }

    if (!targetPath || targetPath.toLowerCase().endsWith('.pdf') || isTemporaryLessonPath(targetPath)) {
      toast.error('Select an active tutor session or open an atomic lesson note first.')
      return
    }

    let targetMetadata = noteMetadata;
    if (targetPath !== selectedPath) {
      try {
        const noteRes = await sidecarApi.readObsidianNote(targetPath);
        if (noteRes && noteRes.metadata) {
          targetMetadata = noteRes.metadata;
        }
      } catch (err) {
        console.error('Failed to read note metadata for targetPath:', err);
      }
    }

    let hubPath = ''
    const rawHub = targetMetadata?.hub || targetMetadata?.Hub || targetMetadata?.concept_hub
    const isHubNote = targetPath.toLowerCase().includes('_hub.md') || String(targetMetadata?.type || '').toLowerCase() === 'hub'

    if (isHubNote) {
      hubPath = targetPath
    } else if (rawHub) {
      const hubValue = Array.isArray(rawHub) ? rawHub[0] : rawHub
      const hubName = String(hubValue || '')
        .replace(/^\[+/, '')
        .replace(/\]+$/, '')
        .split('|')[0]
        .trim()
        .replace(/\.md$/i, '')

      if (hubName) {
        const academicHubPath = academicHubPathFromNote(targetPath, hubName)
        if (academicHubPath) {
          hubPath = academicHubPath
        } else {
          try {
            const res = await sidecarApi.findVaultPage(hubName)
            if (res.found && res.path) {
              hubPath = res.path
            }
          } catch (err) {
            console.error('Failed to resolve lesson hub from Knowledge Base:', err)
          }
        }
      }
    }

    const title = cleanTitle(targetMetadata?.title || targetMetadata?.Title || targetPath.split(/[/\\]/).pop()?.replace(/\.md$/i, '') || 'Lesson')
    const preview = {
      title,
      lessonPath: targetPath,
      notePath: targetPath,
      hubPath,
      previewUrl: '',
    }

    localStorage.setItem('ater_lesson_preview', JSON.stringify(preview))
    localStorage.setItem('ater_lesson_panel_open', JSON.stringify(true))
    localStorage.setItem('ater_study_active_note_path', targetPath)
    localStorage.setItem('ater_canonical_lesson_path', targetPath)
    localStorage.setItem('ater_original_note_path', targetPath)
    setSelectedPath(targetPath)
    setSearchParams({ path: targetPath })
    setIsLessonActive(true)
  }, [setSearchParams, noteMetadata, selectedPath, studyTree, setActiveTutorSession])

  const fetchHubs = async () => {
    setLoadingHubs(true)
    try {
      const res = await sidecarApi.listHubs()
      setHubs((res.hubs || []).map(normalizeHub))
    } catch (err) {
      console.error("Failed to fetch hubs:", err)
    } finally {
      setLoadingHubs(false)
    }
  }

  useEffect(() => {
    fetchHubs() // Initial fetch
  }, [])

  useEffect(() => {
    if (sidebarTab === 'hubs') fetchHubs()
  }, [sidebarTab])

  // Grouping logic for Hubs
  const groupedHubs = useMemo(() => {
    const groups: Record<string, any[]> = {}
    hubs.filter(hub => {
      if (!searchQuery) return true;
      return (typeof (hub.title ?? hub.name) === 'string' && (hub.title ?? hub.name ?? '').toLowerCase().includes((searchQuery || '').toLowerCase())) ||
             (hub.course && typeof hub.course === 'string' && hub.course.toLowerCase().includes((searchQuery || '').toLowerCase()));
    }).forEach(hub => {
      const course = hub.course || 'Uncategorized'
      if (!groups[course]) groups[course] = []
      groups[course].push(hub)
    })
    // Sort courses and units
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key].sort((a, b) => (parseInt(a.unit) || 0) - (parseInt(b.unit) || 0))
      return acc
    }, {} as Record<string, any[]>)
  }, [hubs, searchQuery])

  // Grouping logic for PDFs
  const groupedPdfs = useMemo(() => {
    const pdfFiles = files.filter(f => {
      const isPdf = typeof f.path === 'string' && f.path.toLowerCase().endsWith('.pdf');
      if (!isPdf) return false;
      if (!searchQuery) return true;
      return (typeof (f.name ?? (f as any).title) === 'string' && (f.name ?? (f as any).title ?? '').toLowerCase().includes((searchQuery || '').toLowerCase())) ||
             (typeof f.path === 'string' && f.path.toLowerCase().includes((searchQuery || '').toLowerCase()));
    })
    const groups: Record<string, any[]> = {}
    pdfFiles.forEach(file => {
      const parts = file.path.split(/[/\\]/)
      const folder = parts.length > 1 ? parts[parts.length - 2] : 'Root'
      if (!groups[folder]) groups[folder] = []
      groups[folder].push(file)
    })
    return groups
  }, [files, searchQuery])

  const toggleFolder = useCallback((path: string) => {
 const newExpanded = new Set(expandedFolders)
 if (newExpanded.has(path)) newExpanded.delete(path)
 else newExpanded.add(path)
 setExpandedFolders(newExpanded)
}, [expandedFolders])

 const toggleAutoDeploy = async () => {
 await saveConfig({autoDeploy: !config?.autoDeploy})
 await sidecarApi.aterWatcherToggle()
 fetchStatus()
}

 const resetAterSession = () => {
 setSessionId(null)
 setIsAwaitingConfirmation(false)
 setIsCompleted(false)
 setActivePlan(null)
 setPlanData(null)
 setBatchFeed([])
 setSelectedInboxFile(null)
 setAterError(null)
 fetchInbox()
}

 const processSelectedFile = async () => {
 if (!selectedInboxFile) return
 setProcessing(true)
 setAterError(null)
 setActivePlan(null)
 setBatchFeed([])
 setIsCompleted(false)
 setIsAwaitingConfirmation(false)

 try {
 const res = await sidecarApi.aterProcess({file_path: selectedInboxFile.path})
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
 setAterError(err.message || 'Workflow failed')
} finally {setProcessing(false)}
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
 const res = await sidecarApi.aterConfirm({session_id: targetId})

 if (res.status === 'error') {
 throw new Error((res as any).message || (res as any).detail || "Backend generation failed.");
}

 tempBatch = res.current_batch || (tempBatch + 1)
 setCurrentBatch(tempBatch)
 setBatchFeed(prev => [...prev, {batch: tempBatch, results: res.results}])
 currentHasMore = res.has_more
 if (currentHasMore) await new Promise(r => setTimeout(r, 2000))
}
 setIsCompleted(true)
 fetchFiles() // Refresh explorer
} catch (err: any) {
 setAterError(err.message)
} finally {
 setProcessing(false)
}
}

  const handleRegenerateNote = async (path: string | null) => {
    if (!path) return
    setProcessing(true)
    setAterError(null)
    setActivePlan(null)
    setBatchFeed([])
    setIsCompleted(false)
    setIsAwaitingConfirmation(false)

    try {
      const res = await sidecarApi.aterProcess({file_path: path})
      setActivePlan(res.plan_raw)
      setPlanData(res.plan_structured)
      setSessionId(res.session_id)
      setTotalBatches(res.plan_structured?.batches?.length || 1)
      setCurrentBatch(0)

      if (config?.autoDeploy) {
        setTimeout(() => confirmDeployment(res.session_id), 800)
      } else {
        setIsAwaitingConfirmation(true)
      }
      toast.success("Regeneration started")
    } catch (err: any) {
      setAterError(err.message || 'Regeneration failed')
      toast.error("Regeneration failed")
    } finally {
      setProcessing(false)
    }
  }

  const handleHealNote = async (path: string | null) => {
    if (!path) return
    setProcessing(true)
    try {
      toast.info("Healing note logic triggered...")
      console.log("Heal requested for:", path)
      await new Promise(r => setTimeout(r, 1000))
      toast.success("Note healing complete")
    } catch (err: any) {
      toast.error("Healing failed")
    } finally {
      setProcessing(false)
    }
  }

 // --- Tree Construction ---
 const fileTree = useMemo(() => {
 const root: FileNode[] = []

 files.filter(file => !file.path.endsWith('.html')).forEach(file => {
 const parts = file.path.split(/[/\\]/).filter(p => p.length > 0)
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

  const [isNoteMetadataExpanded, setIsNoteMetadataExpanded] = useState(false)
  const [contentMatchPaths, setContentMatchPaths] = useState<Set<string>>(new Set())

  const matchesSearch = useCallback((node: FileNode, queryLower: string): boolean => {
    if (!queryLower) return true
    if (typeof node.path === 'string' && node.path.toLowerCase().includes(queryLower)) return true
    if (contentMatchPaths.has(node.path)) return true
    if (node.children) {
      return node.children.some(child => matchesSearch(child, queryLower))
    }
    return false
  }, [contentMatchPaths])

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setContentMatchPaths(new Set())
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await sidecarApi.searchVaultFull(searchQuery)
        setContentMatchPaths(new Set(res.paths))
      } catch (e) { console.error("Search failed", e) }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return fileTree
    const queryLower = searchQuery.toLowerCase()

    const filterTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(node => matchesSearch(node, queryLower))
        .map(node => ({
          ...node,
          children: node.children ? filterTree(node.children) : undefined
        }))
    }

    return filterTree(fileTree)
  }, [fileTree, searchQuery, matchesSearch])

 const [draggedPath, setDraggedPath] = useState<string | null>(null)
 const [dragOverPath, setDragOverPath] = useState<string | null>(null)
 const expandTimerRef = useRef<NodeJS.Timeout | null>(null)

 const handleDrop = useCallback(async (e: React.DragEvent, targetPath: string | null) => {
  e.preventDefault()
  e.stopPropagation()
  setDragOverPath(null)
  if (expandTimerRef.current) {
   clearTimeout(expandTimerRef.current)
   expandTimerRef.current = null
  }

  const sourcePath = draggedPath || e.dataTransfer.getData('text/plain')
  if (!sourcePath) return

  // 0. Lock Protection
  try {
    const isLockedSource = await checkLockState(sourcePath)
    if (isLockedSource) {
      toast.error("This lesson is locked and cannot be moved.")
      setDraggedPath(null)
      return
    }
    if (targetPath) {
      const isLockedTarget = await checkLockState(targetPath)
      if (isLockedTarget) {
        toast.error("The target folder is locked.")
        setDraggedPath(null)
        return
      }
    }
  } catch (err) {
    console.error("Lock check error:", err)
  }

  // 1. Determine the target folder. If dropped on a file, use its parent folder.
  let targetFolderPath = targetPath
  if (targetPath) {
   // Check if target is a file in the existing files list
   const targetFile = files.find(f => f.path === targetPath)
   if (targetFile && !targetFile.is_dir) {
    targetFolderPath = targetPath.includes('/') ? targetPath.substring(0, targetPath.lastIndexOf('/')) : null
   }
  }

  const fileName = sourcePath.split(/[/\\]/).pop()
  if (!fileName) return

  const newPath = targetFolderPath ? `${targetFolderPath}/${fileName}` : fileName

  // 2. Prevent dropping into self or into a subfolder of self
  if (sourcePath === newPath) return
  if (targetFolderPath && (targetFolderPath === sourcePath || targetFolderPath.startsWith(sourcePath + '/'))) {
   console.warn("Cannot move a folder into itself or its descendants")
   return
  }

  try {
   await sidecarApi.moveObsidianItem(sourcePath, newPath)
   await fetchFiles()
  } catch (err: any) {
   console.error("Move failed:", err)
   toast.error(`Move failed: ${err.message}`)
  } finally {
   setDraggedPath(null)
  }
 }, [draggedPath, files, fetchFiles])

 const renderTree = useCallback((nodes: FileNode[], level = 0) => {
  const result = nodes.map(node => (
    <FileTreeItem
      key={node.path}
      node={node}
      level={level}
      selectedPath={selectedPath}
      renamingPath={renamingPath}
      newItemName={newItemName}
      creatingInPath={creatingInPath}
      creatingType={creatingType}
      expandedFolders={expandedFolders}
      dragOverPath={dragOverPath}
      draggedPath={draggedPath}
      searchQuery={searchQuery}
      onToggleFolder={toggleFolder}
      onSelectFile={selectFile}
      onStartRename={(path, name) => {
        setRenamingPath(path);
        setNewItemName(name);
      }}
      onDelete={handleDeleteItem}
      onNewItem={(path, type) => {
        setCreatingInPath(path);
        setCreatingType(type);
        setNewItemName('');
        if (!expandedFolders.has(path)) toggleFolder(path);
      }}
      onRenameChange={setNewItemName}
      onRenameSubmit={handleRenameItem}
      onRenameCancel={() => setRenamingPath(null)}
      onCreateChange={setNewItemName}
      onCreateSubmit={handleCreateItem}
      onCreateCancel={() => {
        setCreatingInPath(null);
        setCreatingType(null);
      }}
      onDragStart={(e, path) => {
        setDraggedPath(path);
        e.dataTransfer.setData('text/plain', path);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setDragImage(e.currentTarget, 10, 10);
      }}
      onDragOver={(e, path) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverPath !== path) {
          setDragOverPath(path);
          if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
          const targetNode = files.find(f => f.path === path);
          if (targetNode?.is_dir && !expandedFolders.has(path)) {
            expandTimerRef.current = setTimeout(() => {
              setExpandedFolders(prev => new Set(prev).add(path));
            }, 700);
          }
        }
      }}
      onDragLeave={(e, path) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragOverPath === path) {
          setDragOverPath(null);
          if (expandTimerRef.current) {
            clearTimeout(expandTimerRef.current);
            expandTimerRef.current = null;
          }
        }
      }}
      onDrop={handleDrop}
      onDragEnd={() => {
        setDraggedPath(null);
        setDragOverPath(null);
        if (expandTimerRef.current) {
          clearTimeout(expandTimerRef.current);
          expandTimerRef.current = null;
        }
      }}
      renderTree={renderTree}
      lockedNotes={lockedNotes}
    />
  ));

  if (level === 0 && creatingInPath === null && creatingType) {
    result.unshift(
      <div key="new-item-root" className="flex items-center gap-2 py-1.5 px-6">
        {creatingType === 'folder' ? <Folder size={14} className="text-muted-foreground" /> : <FileText size={14} className="text-muted-foreground" />}
        <input
          autoFocus
          className="flex-1 bg-background border border-primary rounded-[8px] px-1 py-0.5 text-[13px] outline-none"
          placeholder={`New ${creatingType}...`}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateItem()
            if (e.key === 'Escape') {setCreatingInPath(null); setCreatingType(null);}
          }}
          onBlur={handleCreateItem}
        />
      </div>
    );
  }

  return result;
}, [
  selectedPath,
  renamingPath,
  newItemName,
  creatingInPath,
  creatingType,
  expandedFolders,
  dragOverPath,
  draggedPath,
  searchQuery,
  toggleFolder,
  selectFile,
  handleDeleteItem,
  handleRenameItem,
  handleCreateItem,
  handleDrop,
  files,
  lockedNotes
]);

  const selectedIsPdf = typeof selectedPath === 'string' && selectedPath.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    setSidebarContent(
      <div className="flex flex-col w-full min-h-0 text-left">
        {/* Global Toolbar */}
        <div className="pb-3 flex items-center justify-between gap-1 select-none shrink-0 border-b border-border/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Knowledge Base</span>
          <div className="flex items-center gap-1">
            <button
              className="p-1 text-muted-foreground hover:text-foreground rounded-[4px] hover:bg-muted/30 shrink-0"
              title="New Note"
              onClick={() => {setCreatingInPath(null); setCreatingType('file'); setNewItemName('');}}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 text-muted-foreground hover:text-foreground rounded-[4px] hover:bg-muted/30 shrink-0"
              title="New Folder"
              onClick={() => {setCreatingInPath(null); setCreatingType('folder'); setNewItemName('');}}
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 text-muted-foreground hover:text-foreground rounded-[4px] hover:bg-muted/30 shrink-0"
              title="Refresh Vault"
              onClick={fetchFiles}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              className={cn(
                "p-1 rounded-[4px] shrink-0",
                showGraphView
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
              onClick={() => setShowGraphView(!showGraphView)}
              title="Toggle Graph View"
            >
              <Network className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="my-2.5 relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-3 bg-muted/20 border border-border/30 rounded-[6px] text-[11px] focus:outline-none focus:border-foreground/30 transition-all font-medium placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Sidebar Tabs */}
        <div className="flex border-b border-border/20 text-[9px] font-black tracking-widest mb-2 shrink-0 select-none">
          <button
            onClick={() => setSidebarTab('explorer')}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center",
              sidebarTab === 'explorer'
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            FILES
          </button>
          <button
            onClick={() => setSidebarTab('hubs')}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center",
              sidebarTab === 'hubs'
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            HUBS
          </button>
          <button
            onClick={() => setSidebarTab('pdfs')}
            className={cn(
              "flex-1 py-1.5 border-b-2 outline-none text-center",
              sidebarTab === 'pdfs'
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            PDFS
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 pr-1 text-xs">
          {sidebarTab === 'explorer' && (
            <div
              className="py-1 min-h-full"
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => handleDrop(e, null)}
            >
              {files.length > 0 ? renderTree(filteredFiles) : (
                <div className="py-6 text-center opacity-40">
                  <Folder className="w-6 h-6 mx-auto mb-1 opacity-20" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Vault Empty</p>
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'hubs' && (
            <div className="flex flex-col gap-3 py-1">
              {loadingHubs ? (
                <div className="py-6 flex justify-center"><RefreshCw size={14} className="animate-spin text-muted-foreground/30" /></div>
              ) : Object.keys(groupedHubs).length > 0 ? (
                Object.entries(groupedHubs).map(([course, courseHubs]) => (
                  <div key={course} className="flex flex-col gap-0.5">
                    <div className="px-1 py-0.5 flex items-center gap-2 select-none">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{course}</span>
                      <div className="h-px flex-1 bg-border/20" />
                    </div>
                    {courseHubs.map(hub => (
                      <button
                        key={hub.id}
                        onClick={() => selectFile(hub.path)}
                        className={cn(
                          "flex flex-col p-1.5 rounded-[4px] text-left transition-none text-[11px]",
                          selectedPath === hub.path ? "bg-muted/80 text-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black opacity-50 tabular-nums">U{hub.unit || '0'}</span>
                          <span className="truncate">{(hub.title ?? hub.name ?? '').replace(' Hub', '')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">No hubs found</div>
              )}
            </div>
          )}

          {sidebarTab === 'pdfs' && (
            <div className="flex flex-col gap-3 py-1">
              {Object.entries(groupedPdfs).map(([folder, folderPdfs]) => (
                <div key={folder} className="flex flex-col gap-0.5">
                  <div className="px-1 py-0.5 flex items-center gap-2 select-none">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{folder}</span>
                    <div className="h-px flex-1 bg-border/20" />
                  </div>
                  {folderPdfs.map(file => (
                    <button
                      key={file.path}
                      onClick={() => selectFile(file.path)}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded-[4px] text-left transition-all text-[11px]",
                        selectedPath === file.path
                          ? "bg-muted/80 text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      )}
                    >
                      <FileText size={12} className={cn(
                        "shrink-0",
                        selectedPath === file.path ? "text-foreground" : "text-muted-foreground/50"
                      )} />
                      <span className="truncate">{(file.name ?? (file as any).title ?? '').replace('.pdf', '')}</span>
                    </button>
                  ))}
                </div>
              ))}
              {Object.keys(groupedPdfs).length === 0 && (
                <div className="py-10 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">No PDFs found</div>
              )}
            </div>
          )}
        </div>
      </div>
    , 'obsidian');
  }, [
    sidebarTab, searchQuery, files, filteredFiles, loadingHubs, groupedHubs, groupedPdfs, selectedPath, showGraphView,
    setSidebarContent, fetchFiles, selectFile, renderTree, handleDrop, setCreatingInPath, setCreatingType, setNewItemName
  ]);

  // --- Card Dashboard CRUD Handlers ---
  const onCreateHub = async () => {
    const name = window.prompt("Enter new Hub title:");
    if (!name) return;
    const cleanName = name.replace(/ /g, '_');
    const targetPath = `hubs/${cleanName}.md`;
    try {
      await sidecarApi.createObsidianFile(targetPath, `---\ntitle: ${name}\ntype: hub\n---\n\n# ${name}\n\n`);
      await fetchFiles();
      await fetchHubs();
      toast.success("Hub created successfully");
    } catch (err: any) {
      toast.error(`Failed to create Hub: ${err.message}`);
    }
  };

  const onCreateNoteInHub = async () => {
    const name = window.prompt("Enter note title:");
    if (!name) return;
    const cleanName = name.replace(/ /g, '_');
    const targetPath = `${cleanName}.md`;
    try {
      await sidecarApi.createObsidianFile(targetPath, `---\ntitle: ${name}\n---\n\n# ${name}\n\n`);
      if (workspaceHub) {
        const hubRes = await sidecarApi.readObsidianNote(workspaceHub);
        const currentContent = hubRes.content || '';
        const updatedContent = `${currentContent}\n\n- [[${cleanName}]]`;
        await sidecarApi.updateObsidianNote(workspaceHub, updatedContent);
      }
      await fetchFiles();
      setWorkspaceHubNotes(prev => [...prev, cleanName]);
      toast.success("Note created and linked successfully");
    } catch (err: any) {
      toast.error(`Failed to create Note: ${err.message}`);
    }
  };

  const onDeleteCard = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = window.confirm(`Are you sure you want to delete ${path.split(/[/\\]/).pop()}?`);
    if (!confirm) return;
    try {
      await sidecarApi.deleteObsidianItem(path);
      await fetchFiles();
      await fetchHubs();
      if (workspaceHub === path) {
        setWorkspaceHub(null);
      }
      toast.success("Item deleted successfully");
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const onRenameCard = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const oldName = path.split(/[/\\]/).pop() || '';
    const newName = window.prompt("Rename item to:", oldName);
    if (!newName || newName === oldName) return;
    
    const pathParts = path.split(/[/\\]/);
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');
    
    try {
      await sidecarApi.moveObsidianItem(path, newPath);
      await fetchFiles();
      await fetchHubs();
      if (workspaceHub === path) {
        setWorkspaceHub(newPath);
      }
      toast.success("Item renamed successfully");
    } catch (err: any) {
      toast.error(`Rename failed: ${err.message}`);
    }
  };

  const onMoveNote = async (notePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const noteName = notePath.split(/[/\\]/).pop()?.replace('.md', '') || '';
    const cleanNoteName = noteName.replace(/ /g, '_');
    
    const otherHubs = hubs.filter(h => h.path !== workspaceHub);
    if (otherHubs.length === 0) {
      toast.error("No other Hubs available to move to");
      return;
    }
    
    const hubTitles = otherHubs.map((h, i) => `${i + 1}. ${h.title ?? h.name ?? 'Untitled'}`).join('\n');
    const choice = window.prompt(`Select destination Hub (enter number 1-${otherHubs.length}):\n\n${hubTitles}`);
    if (!choice) return;
    const index = parseInt(choice) - 1;
    if (isNaN(index) || index < 0 || index >= otherHubs.length) {
      toast.error("Invalid choice");
      return;
    }
    
    const targetHub = otherHubs[index];
    try {
      if (workspaceHub) {
        const currentHubRes = await sidecarApi.readObsidianNote(workspaceHub);
        const content = currentHubRes.content || '';
        const regex = new RegExp(`-?\\s*\\[\\[${cleanNoteName.replace(/_/g, '[_ ]')}(\\|.*?)?\\]\\]\\s*\\n?`, 'g');
        const updatedContent = content.replace(regex, '');
        await sidecarApi.updateObsidianNote(workspaceHub, updatedContent);
      }
      
      const targetHubRes = await sidecarApi.readObsidianNote(targetHub.path);
      const targetContent = targetHubRes.content || '';
      const updatedTargetContent = `${targetContent}\n\n- [[${cleanNoteName}]]`;
      await sidecarApi.updateObsidianNote(targetHub.path, updatedTargetContent);
      
      if (workspaceHub) {
        setWorkspaceHubNotes(prev => prev.filter(n => n !== cleanNoteName));
      }
      await fetchFiles();
      toast.success(`Note moved to ${targetHub.title ?? targetHub.name ?? 'Untitled'}`);
    } catch (err: any) {
      toast.error(`Move failed: ${err.message}`);
    }
  };

  const renderDashboardBreadcrumbs = () => {
    return (
      <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground select-none">
        <button 
          onClick={() => {
            setWorkspaceHub(null);
          }}
          className="hover:text-foreground transition-colors"
        >
          Hubs
        </button>
        {workspaceHub && (
          <>
            <ChevronRight size={10} className="opacity-40" />
            <span className="text-foreground">
              {workspaceHub.split(/[/\\]/).pop()?.replace('.md', '').replace(/_/g, ' ')}
            </span>
          </>
        )}
      </div>
    )
  }

  const resolveNotesForHub = () => {
    if (loadingHubNotes) return [];
    return files.filter(f => {
      if (f.is_dir || !(f.name ?? (f as any).title ?? '').endsWith('.md')) return false;
      const nameWithoutExt = (f.name ?? (f as any).title ?? '').slice(0, -3).replace(/ /g, '_');
      return workspaceHubNotes.some(link => {
        return link.replace(/ /g, '_') === nameWithoutExt || f.path.replace(/\\/g, '/').includes(link);
      });
    });
  }

  const renderDashboard = () => {
    // Search filtering logic
    const filteredHubs = hubs.filter(h => 
      (h.title ?? h.name ?? '').toLowerCase().includes(dashboardSearchQuery.toLowerCase()) || 
      (h.course && h.course.toLowerCase().includes(dashboardSearchQuery.toLowerCase()))
    );

    const filteredNotes = resolveNotesForHub().filter(file => 
      (file.name ?? (file as any).title ?? '').toLowerCase().includes(dashboardSearchQuery.toLowerCase())
    );

    const filteredInbox = inboxFiles.filter(file => 
      (file.name ?? (file as any).title ?? '').toLowerCase().includes(dashboardSearchQuery.toLowerCase())
    );

    const filteredPdfs = files.filter(f => !f.is_dir && (f.name ?? (f as any).title ?? '').endsWith('.pdf')).filter(file => 
      (file.name ?? (file as any).title ?? '').toLowerCase().includes(dashboardSearchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col h-full w-full p-6 text-foreground overflow-y-auto custom-scrollbar font-sans select-none">
        {/* Dashboard Tabs Switcher */}
        <div className="flex items-center gap-1.5 border-b border-border/10 pb-4 mb-4 shrink-0 select-none">
          {([
            { id: 'hubs', label: 'Hubs', icon: <Network size={12} /> },
            { id: 'inbox', label: 'Inbox', icon: <Archive size={12} /> },
            { id: 'pdfs', label: 'PDFs', icon: <FileText size={12} /> }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setDashboardTab(tab.id);
                setWorkspaceHub(null);
                setDashboardSearchQuery('');
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                dashboardTab === tab.id
                  ? "bg-foreground text-background border-foreground font-extrabold"
                  : "bg-muted/10 text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted/20"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Toolbar: Search & Graph View Toggle */}
        <div className="flex items-center gap-3 mb-6 select-none shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
            <input
              type="text"
              placeholder={
                dashboardTab === 'hubs'
                  ? (workspaceHub ? "Search note stubs..." : "Search hubs...")
                  : dashboardTab === 'inbox'
                    ? "Search inbox files..."
                    : "Search PDFs..."
              }
              value={dashboardSearchQuery}
              onChange={(e) => setDashboardSearchQuery(e.target.value)}
              className="w-full bg-muted/10 border border-border/40 rounded-[8px] pl-9 pr-4 py-2 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-foreground/30 transition-all font-sans"
            />
            {dashboardSearchQuery && (
              <button
                onClick={() => setDashboardSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted-foreground/40 hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowGraphView(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/20"
          >
            <Network size={12} />
            <span>Graph View</span>
          </button>
        </div>

        {/* Tab contents */}
        {dashboardTab === 'hubs' && (
          <div className="flex-1 flex flex-col min-h-0">
            {workspaceHub && renderDashboardBreadcrumbs()}

            {/* Level 1: Hubs list */}
            {!workspaceHub && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between select-none">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Curriculum Hub Nodes</span>
                  <button
                    onClick={onCreateHub}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Plus size={10} /> Add Hub
                  </button>
                </div>
                <div className="h-px bg-border/20 mb-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHubs.length > 0 ? (
                    filteredHubs.map(hub => {
                      return (
                        <div
                          key={hub.id}
                          onClick={() => setWorkspaceHub(hub.path)}
                          className="bg-bento-card hover:bg-bento-item border border-border/40 hover:border-foreground/30 rounded-[8px] p-4 cursor-pointer transition-all duration-100 flex flex-col justify-between min-h-[110px] group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 border border-border/30 px-1.5 py-0.5 rounded-[4px] font-mono">
                                UNIT {hub.unit || '0'}
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate mt-1">
                              {hub.title ?? hub.name ?? 'Untitled'}
                            </h3>
                            <p className="text-[9px] text-muted-foreground/50 mt-1 truncate font-mono">
                              {hub.course || 'Uncategorized'}
                            </p>
                          </div>
                          
                          {/* Card CRUD Controls */}
                          <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                            <button
                              onClick={(e) => onRenameCard(hub.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => onDeleteCard(hub.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-3 py-12 border border-dashed border-border/40 rounded-[8px] text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">
                      {dashboardSearchQuery ? "No matching Hubs found" : "No Hub Notes Found In Vault"}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Level 2: Note Stubs inside active Hub */}
            {workspaceHub && (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between select-none">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Atomic Note Stubs</span>
                  <button
                    onClick={onCreateNoteInHub}
                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Plus size={10} /> Add Note
                  </button>
                </div>
                <div className="h-px bg-border/20 mb-2" />
                
                {loadingHubNotes ? (
                  <div className="py-12 flex justify-center"><RefreshCw size={24} className="animate-spin text-muted-foreground/30" /></div>
                ) : filteredNotes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map(file => {
                      const cleanNoteName = (file.name ?? (file as any).title ?? '').slice(0, -3).replace(/_/g, ' ');
                      return (
                        <div
                          key={file.path}
                          onClick={() => selectFile(file.path)}
                          className="bg-bento-card hover:bg-bento-item border border-border/40 hover:border-foreground/30 rounded-[8px] p-4 cursor-pointer transition-all duration-100 flex flex-col justify-between min-h-[96px] group"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1.5">
                              <FileText size={12} className="shrink-0" />
                              <span className="text-[8px] font-black uppercase tracking-widest font-mono truncate">
                                ATOMIC NOTE
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors mt-1.5 leading-snug line-clamp-2">
                              {cleanNoteName}
                            </h3>
                          </div>
                          
                          {/* Note Card Actions */}
                          <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                            <button
                              onClick={(e) => onRenameCard(file.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => onMoveNote(file.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                            >
                              Move
                            </button>
                            <button
                              onClick={(e) => onDeleteCard(file.path, e)}
                              className="text-[8px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-12 border border-dashed border-border/40 rounded-[8px] text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">
                    {dashboardSearchQuery ? "No matching Notes found" : "No Atomic Notes Linked In This Hub Yet"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {dashboardTab === 'inbox' && (
          <div className="space-y-4">
            <div className="px-1 flex items-center justify-between select-none">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Inbox files</span>
              <button
                onClick={async () => {
                  const name = window.prompt("Enter new inbox item title:");
                  if (!name) return;
                  const cleanName = name.replace(/ /g, '_');
                  try {
                    await sidecarApi.createObsidianFile(`inbox/${cleanName}.md`, `---\ntitle: ${name}\n---\n\n`);
                    await fetchInbox();
                    toast.success("Inbox item created");
                  } catch (err: any) {
                    toast.error(`Creation failed: ${err.message}`);
                  }
                }}
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Plus size={10} /> Add Item
              </button>
            </div>
            <div className="h-px bg-border/20 mb-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInbox.length > 0 ? (
                filteredInbox.map(file => {
                  return (
                    <div
                      key={file.path}
                      onClick={() => selectFile(file.path)}
                      className="bg-bento-card hover:bg-bento-item border border-border/40 hover:border-foreground/30 rounded-[8px] p-4 cursor-pointer transition-all duration-100 flex flex-col justify-between min-h-[96px] group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1.5">
                          <Archive size={12} className="shrink-0" />
                          <span className="text-[8px] font-black uppercase tracking-widest font-mono">Inbox file</span>
                        </div>
                        <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {(file.name ?? (file as any).title ?? '').replace('.pdf', '')}
                        </h3>
                      </div>
                      
                      {/* Inbox Card Actions */}
                      <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        <button
                          onClick={(e) => onRenameCard(file.path, e)}
                          className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => onDeleteCard(file.path, e)}
                          className="text-[8px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-3 py-12 border border-dashed border-border/40 rounded-[8px] text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">
                  {dashboardSearchQuery ? "No matching Inbox files found" : "Inbox is empty"}
                </div>
              )}
            </div>
          </div>
        )}

        {dashboardTab === 'pdfs' && (
          <div className="space-y-4">
            <div className="px-1 flex items-center justify-between select-none">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Reference PDF Documents</span>
              <button
                onClick={async () => {
                  const name = window.prompt("Enter new reference note title:");
                  if (!name) return;
                  const cleanName = name.replace(/ /g, '_');
                  try {
                    await sidecarApi.createObsidianFile(`${cleanName}.md`, `---\ntitle: ${name}\ntags: [reference]\n---\n\n`);
                    await fetchFiles();
                    toast.success("Reference note created");
                  } catch (err: any) {
                    toast.error(`Creation failed: ${err.message}`);
                  }
                }}
                className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Plus size={10} /> Add Reference
              </button>
            </div>
            <div className="h-px bg-border/20 mb-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPdfs.length > 0 ? (
                filteredPdfs.map(file => {
                  return (
                    <div
                      key={file.path}
                      onClick={() => selectFile(file.path)}
                      className="bg-bento-card hover:bg-bento-item border border-border/40 hover:border-foreground/30 rounded-[8px] p-4 cursor-pointer transition-all duration-100 flex flex-col justify-between min-h-[96px] group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-muted-foreground/50 mb-1.5">
                          <FileText size={12} className="shrink-0" />
                          <span className="text-[8px] font-black uppercase tracking-widest font-mono">PDF reference</span>
                        </div>
                        <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {(file.name ?? (file as any).title ?? '').replace('.pdf', '')}
                        </h3>
                      </div>
                      
                      {/* PDF Card Actions */}
                      <div className="flex items-center justify-end gap-3 mt-3 border-t border-border/10 pt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        <button
                          onClick={(e) => onRenameCard(file.path, e)}
                          className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground hover:underline cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => onDeleteCard(file.path, e)}
                          className="text-[8px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-3 py-12 border border-dashed border-border/40 rounded-[8px] text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">
                  {dashboardSearchQuery ? "No matching PDFs found" : "No Reference PDFs In Vault"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  useEffect(() => {
    return () => {
      setSidebarContent(null, 'obsidian');
    };
  }, [setSidebarContent]);

  return (
  <div className="flex flex-row h-full w-full select-none bg-transparent gap-3 overflow-hidden font-sans relative">
    <style dangerouslySetInnerHTML={{__html: `
      .editor-content p {
        margin-bottom: 1.5rem;
        line-height: 1.7;
        color: hsl(var(--foreground) / 0.8);
      }
      .editor-content strong {
        color: hsl(var(--foreground));
        font-weight: 700;
      }
      .underlined-term {
        border-bottom: 1px solid hsl(var(--muted-foreground));
        padding-bottom: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #242426;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a1a1aa;
      }
      .panel-transition {
        transition: width 0.3s ease-in-out, margin 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out;
      }
    `}} />

    {/* Main Editor Panel */}
    {showGraphView ? (
      <div className="flex-1 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden panel-transition flex flex-col">
        {/* Graph Header Bar */}
        <div className="p-4 border-b border-border/10 flex items-center justify-between shrink-0 select-none">
          <button
            onClick={() => {
              setShowGraphView(false);
              navigate('/academic');
            }}
            className="text-[9px] font-black uppercase tracking-widest hover:text-foreground text-muted-foreground bg-muted/10 border border-border/40 px-2.5 py-1 rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={10} /> Back to Dashboard
          </button>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 font-mono">
            Vault Graph Relations
          </span>
        </div>
        <div className="flex-1 min-h-0 relative">
          <ObsidianGraphView onNodeClick={(path) => {
            selectFile(path);
            setShowGraphView(false);
          }} />
        </div>
      </div>
    ) : (
      <div className="flex-1 flex flex-row min-w-0 h-full gap-3 relative">
        <main
          data-purpose="main-editor"
          className="bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-y-auto custom-scrollbar relative flex flex-col min-w-0 panel-transition"
          style={{ width: (isPanelOpen && artifacts.length > 0) ? `${100 - panelWidth}%` : '100%', flex: (isPanelOpen && artifacts.length > 0) ? 'none' : '1 1 0%' }}
        >
        {!selectedPath ? (
          renderDashboard()
        ) : (
          <div className={cn(
            "mx-auto w-full max-w-full relative flex-1 flex flex-col min-h-0",
            selectedIsPdf ? "px-4 pt-3 pb-0 overflow-hidden" : "py-4 px-6 h-full bg-transparent"
          )}>
            {loadingNote && (
              <PanelLoader label="Loading Document" />
            )}

            {/* Back to Dashboard Button Bar */}
            <div className="mb-3 shrink-0 select-none flex items-center justify-between border-b border-border/10 pb-2">
              <button
                onClick={() => {
                  setSelectedPath(null);
                  setLoadedPath(null);
                  setNoteMetadata({});
                  setNoteContent('');
                  setEditedContent('');
                  // Also clear selection in search query
                  setSearchParams((prev: URLSearchParams) => {
                    prev.delete('path');
                    return prev;
                  });
                }}
                className="text-[9px] font-black uppercase tracking-widest hover:text-foreground text-muted-foreground bg-muted/10 border border-border/40 px-2.5 py-1 rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={10} /> Back to Dashboard
              </button>
              
              {selectedIsPdf && (
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 font-mono truncate max-w-[300px]">
                  PDF: {selectedPath.split(/[/\\]/).pop()?.replace('.pdf', '')}
                </span>
              )}
            </div>

            {/* Note details */}
            {!selectedIsPdf ? (
              isLessonActive && !isEditing ? (
                <div className="editor-content w-full flex-1 flex flex-col min-h-0">
                  <LearningWorkspace
                    preview={activePreview!}
                    tutorSession={activeTutorSession}
                    onTutorSessionChange={setActiveTutorSession}
                    onPreviewChange={(p) => {
                      if (p?.notePath) {
                        setSelectedPath(p.notePath)
                        setSearchParams({ path: p.notePath })
                      }
                    }}
                    onClose={() => {
                      localStorage.setItem('ater_lesson_panel_open', 'false')
                      setIsLessonActive(false)
                    }}
                    onWikiLinkClick={handleWikiLinkClick}
                    onUpdateProperty={handleUpdateProperty}
                    onDeleteProperty={handleDeleteProperty}
                    onAddProperty={handleAddProperty}
                  />
                </div>
              ) : (
                <div className="editor-content w-full flex-1 flex flex-col min-h-0">
                  <div className="shrink-0">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <h1 className="min-w-0 text-[32px] font-bold text-foreground tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: '28px' }}>
                        {(noteMetadata?.title || noteMetadata?.Title || selectedPath.split(/[/\\]/).pop()?.replace('.md', '').replace('.pdf', '') || '').replace(/_/g, ' ')}
                      </h1>
                      {!isTemporaryLessonPath(selectedPath) && (
                        <button
                          type="button"
                          onClick={() => void openSelectedInLessonRuntime()}
                          className="h-9 shrink-0 rounded-[8px] border border-border bg-bento-item px-4 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
                        >
                          Continue Lesson
                        </button>
                      )}
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex items-center gap-2 mb-6 border-b border-border pb-6">
                      {noteMetadata?.semester && (
                        <button className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans gap-1">
                          <Calendar size={10} />
                          {cleanTitle(noteMetadata.semester)}
                        </button>
                      )}
                      {noteMetadata?.course && (
                        <button className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans gap-1">
                          <GraduationCap size={10} />
                          {cleanTitle(noteMetadata.course)}
                        </button>
                      )}
                      {noteMetadata?.unit && (
                        <button className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans gap-1">
                          <Hash size={10} />
                          UNIT {cleanTitle(noteMetadata.unit)}
                        </button>
                      )}
                    </div>

                    {config?.showProperties && (
                      <NoteProperties
                        metadata={noteMetadata}
                        onNavigate={handleWikiLinkClick}
                        onAddProperty={handleAddProperty}
                        onUpdateProperty={handleUpdateProperty}
                        onDeleteProperty={handleDeleteProperty}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-h-0">
                    {isEditing ? (
                      <ObsidianEditor
                        value={editedContent}
                        onChange={setEditedContent}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                            e.preventDefault()
                            handleSaveNote()
                          }
                        }}
                        noteList={noteList}
                      />
                    ) : (
                      <MarkdownViewer
                        key={selectedPath}
                        content={noteContent}
                        onNavigate={handleWikiLinkClick}
                        path={selectedPath || undefined}
                        noteMode={String(noteMetadata?.mode || '')}
                        noteTitle={String(noteMetadata?.title || '')}
                        noteCourse={String(noteMetadata?.course || '')}
                      />
                    )}
                  </div>

                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
                <div className="flex-1 min-h-0">
                  <PdfViewer
                    ref={pdfRef}
                    path={selectedPath}
                    title={selectedPath.split(/[/\\]/).pop() || ''}
                    initialPage={selectedPage}
                    filterPages={selectedFilteredPages}
                    onStateChange={handlePdfStateChange}
                  />
                </div>

                {/* Knowledge Navigation Footer for PDF (when in context) */}
                {studyTree.length > 0 && (
                  <div className="border-t border-border bg-bento-panel/50 px-16 py-8">
                    <KnowledgeFooter
                      tree={studyTree}
                      activePath={selectedPath}
                      onNavigate={handleWikiLinkClick}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </main>

        {(isPanelOpen && artifacts.length > 0) && (
          <>
            <button
              type="button"
              aria-label="Resize artifact panel"
              onMouseDown={(event) => {
                event.preventDefault()
                setIsDraggingSplit(true)
              }}
              className="w-1.5 shrink-0 cursor-col-resize border-x border-border/40 bg-muted hover:bg-foreground/20 rounded-[6px]"
            />
            <div
              className="min-w-[420px] max-w-[82%] rounded-[12px] overflow-hidden border border-border/40 bg-bento-panel shadow-sm shrink-0"
              style={{ width: `${panelWidth}%` }}
            >
              <UnifiedSandboxViewer shielded={isDraggingSplit} />
            </div>
          </>
        )}
      </div>
    )}

    {isResizing && (
      <div className="fixed inset-0 z-[9999] cursor-col-resize select-none bg-transparent" />
    )}
  </div>
  )
}
