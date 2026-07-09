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

export default function ObsidianVaultPage() {
  const { config, saveConfig } = useConfig()
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
