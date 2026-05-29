/* eslint-disable @typescript-eslint/no-explicit-any */
import {useState, useRef, useEffect, useMemo, useCallback, useTransition} from 'react'
import {
 Trash2, ShieldCheck, RefreshCw, 
 Sparkles, Paperclip, FileText, Folder, ChevronRight, 
  X, Zap, 
 Database, Search, Archive,
 ChevronDown, ChevronUp, Maximize2, Minimize2, Info, PanelLeft,
  Plus, ChevronLeft, GraduationCap, Calendar, Building, Circle, Network,
  Edit3, Save, FolderPlus, Hash, CheckSquare, Link, List, Heart,
  Activity, Play, SkipForward, MapPin
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { useConfig } from '@/lib/ConfigContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PanelLoader } from '@/components/ui/loading-state'
import { MarkdownViewer } from '@/components/obsidian/MarkdownViewer'
import { PdfViewer } from '@/components/obsidian/PdfViewer'
import { ObsidianGraphView } from '@/components/obsidian/ObsidianGraphView'
import { NoteProperties } from '@/components/obsidian/NoteProperties'
import { HubConnectionsNav, parseHubTree } from '@/components/obsidian/HubConnectionsNav'
import { KnowledgeFooter } from '@/components/obsidian/KnowledgeFooter'
import { useLayout } from '@/context/layout-provider'
import { useNavigation } from '@/context/navigation-context'
import { useHeader } from '@/context/header-context'
import React, { lazy, Suspense } from 'react'
import { sidecarApi, ObsidianFile } from '@/lib/sidecarApi'
import { updateProperty, deleteProperty, toggleChecklistLink, parseFrontmatter } from '@/lib/markdownHelper'

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

export default function ObsidianVaultPage() {
  const { config, saveConfig } = useConfig()
  const navigate = useNavigate()
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

  const [showGraphView, setShowGraphView] = useState(false)
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
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')

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
  const [connectionsWidth, setConnectionsWidth] = useState(240)
  const [isResizingConnections, setIsResizingConnections] = useState(false)

 const startResizing = (e: React.MouseEvent) => {
 e.preventDefault()
 setIsResizing(true)
}

 const startResizingConnections = (e: React.MouseEvent) => {
 e.preventDefault()
 setIsResizingConnections(true)
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
} else if (isResizingConnections) {
  // Calculate based on explorer width
  const xOffset = !isFullscreen ? sidebarWidth : 0
  const newWidth = Math.max(160, Math.min(window.innerWidth * 0.3, e.clientX - xOffset))
  setConnectionsWidth(newWidth)
}
}
  const handleMouseUp = () => {
  setIsResizing(false)
  setIsResizingConnections(false)
}

  if (isResizing || isResizingConnections) {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}
  return () => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
}
}, [isResizing, isResizingConnections, sidebarWidth, isFullscreen])


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
  const res = await sidecarApi.findVaultPage(cleanHubName)
  const tryPath = async (p: string) => {
  try {
  const note = await sidecarApi.readObsidianNote(p)
  return extractSection(note.content)
} catch(e) {console.error(e);}
  return null
}

  if (res.found && res.path) {
  topologies = await tryPath(res.path)
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
  const pageName = typeof loadedPath === 'string' ? loadedPath.split('/').pop()?.replace('.md', '').replace('.pdf', '') || '' : ''
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
  cleanHubName = typeof selectedPath === 'string' ? selectedPath.split('/').pop()?.replace('.md', '') || '' : '';
 }

  if (cleanHubName) {
  const res = await sidecarApi.findVaultPage(cleanHubName);
  const hubPath = res.path || (files.find(f => f.name.toLowerCase().includes(cleanHubName.toLowerCase()))?.path);
  
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
  const label = selectedPath.split('/').pop()?.replace('.md', '') ?? '';
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

 // --- Sync & Polling ---
  useEffect(() => {
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
      const parts = initPath.split('/')
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
      setSelectedPath(null)
      setNoteMetadata({})
      setNoteContent('')
      setEditedContent('')
      if (initSearch) {
        setSearchQuery(initSearch)
        setInputValue(initSearch)
      } else {
        setSearchQuery('')
        setInputValue('')
      }
    }
  }, [location.search, selectedPath, selectedPage])

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

 const handleDeleteItem = async (path: string, isFolder: boolean) => {
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
}

 const handleCreateItem = async () => {
 if (!newItemName) {
 setCreatingInPath(null)
 setCreatingType(null)
 return
}

 const path = creatingInPath ? `${creatingInPath}/${newItemName}` : newItemName
 const fullPath = creatingType === 'file' ? (path.endsWith('.md') ? path : `${path}.md`) : path

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
}

 const handleRenameItem = async () => {
 if (!renamingPath || !newItemName) {
 setRenamingPath(null)
 return
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
}

const selectFile = async (path: string, page: number = 1, fromHistory: boolean = false, filterPages: number[] = [], keepMetadata: boolean = false) => {
    const norm = String(path).toLowerCase();
    const cleanItemName = path.split('/').pop()?.replace('.md', '') || '';
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
        const cleanSourceBase = cleanSource.split('/').pop()?.toLowerCase();
        const pathBase = path.split('/').pop()?.toLowerCase();
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
        navigate({ search: searchParams.toString() }, { replace: false });
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
    
    if (!fromHistory) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('path', path);
      if (page > 1) searchParams.set('page', page.toString());
      else searchParams.delete('page');
      
      if (filterPages.length > 0) searchParams.set('filterPages', filterPages.join(','));
      else searchParams.delete('filterPages');
      
      navigate({ search: searchParams.toString() }, { replace: false });

      push({ 
        type: 'file', 
        path: path, 
        metadata: { page, filterPages } 
        // Note: we don't store keepMetadata in history as it's a one-time intent
      }, false);
    }

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
  }

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
        
        const initialContent = `---\ntitle: ${pageName.split('/').pop()?.replace('.md', '')}\nread: false\n---\n\n# ${pageName.split('/').pop()?.replace('.md', '')}\n`;
        
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

  const fetchHubs = async () => {
    setLoadingHubs(true)
    try {
      const res = await sidecarApi.listHubs()
      setHubs(res.hubs || [])
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
      return (typeof hub.title === 'string' && hub.title.toLowerCase().includes((searchQuery || '').toLowerCase())) || 
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
      return (typeof f.name === 'string' && f.name.toLowerCase().includes((searchQuery || '').toLowerCase())) || 
             (typeof f.path === 'string' && f.path.toLowerCase().includes((searchQuery || '').toLowerCase()));
    })
    const groups: Record<string, any[]> = {}
    pdfFiles.forEach(file => {
      const parts = file.path.split('/')
      const folder = parts.length > 1 ? parts[parts.length - 2] : 'Root'
      if (!groups[folder]) groups[folder] = []
      groups[folder].push(file)
    })
    return groups
  }, [files, searchQuery])

  const toggleFolder = (path: string) => {
 const newExpanded = new Set(expandedFolders)
 if (newExpanded.has(path)) newExpanded.delete(path)
 else newExpanded.add(path)
 setExpandedFolders(newExpanded)
}

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
 
 files.forEach(file => {
 const parts = file.path.split('/').filter(p => p.length > 0)
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

  const matchesSearch = useCallback((node: FileNode, query: string): boolean => {
    if (!query) return true
    if (typeof node.path === 'string' && node.path.toLowerCase().includes((query || '').toLowerCase())) return true
    if (contentMatchPaths.has(node.path)) return true
    if (node.children) {
      return node.children.some(child => matchesSearch(child, query))
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
    
    const filterTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(node => matchesSearch(node, searchQuery))
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

 const handleDrop = async (e: React.DragEvent, targetPath: string | null) => {
  e.preventDefault()
  e.stopPropagation()
  setDragOverPath(null)
  if (expandTimerRef.current) {
   clearTimeout(expandTimerRef.current)
   expandTimerRef.current = null
  }
  
  const sourcePath = draggedPath || e.dataTransfer.getData('text/plain')
  if (!sourcePath) return
  
  // 1. Determine the target folder. If dropped on a file, use its parent folder.
  let targetFolderPath = targetPath
  if (targetPath) {
   // Check if target is a file in the existing files list
   const targetFile = files.find(f => f.path === targetPath)
   if (targetFile && !targetFile.is_dir) {
    targetFolderPath = targetPath.includes('/') ? targetPath.substring(0, targetPath.lastIndexOf('/')) : null
   }
  }

  const fileName = sourcePath.split('/').pop()
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
   if (selectedPath === sourcePath) setSelectedPath(newPath)
  } catch (err: any) {
   console.error("Move failed:", err)
   toast.error(`Move failed: ${err.message}`)
  } finally {
   setDraggedPath(null)
  }
 }

 const renderTree = (nodes: FileNode[], level = 0) => {
  const result = nodes
  .filter(node => matchesSearch(node, searchQuery))
  .map(node => {
   const isExpanded = expandedFolders.has(node.path) || (searchQuery !== '' && matchesSearch(node, searchQuery))
   const isSelected = selectedPath === node.path
   const isRenaming = renamingPath === node.path
   
   return (
    <div 
     key={node.path} 
     className="flex flex-col"
     onDragOver={(e) => {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'move'
      
      if (dragOverPath !== node.path) {
       setDragOverPath(node.path)
       
       // VS Code Style Auto-expand
       if (expandTimerRef.current) clearTimeout(expandTimerRef.current)
       if (node.isFolder && !expandedFolders.has(node.path)) {
        expandTimerRef.current = setTimeout(() => {
         setExpandedFolders(prev => new Set(prev).add(node.path))
        }, 700)
       }
      }
     }}
     onDragLeave={(e) => {
      e.preventDefault()
      e.stopPropagation()
      if (dragOverPath === node.path) {
       setDragOverPath(null)
       if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current)
        expandTimerRef.current = null
       }
      }
     }}
     onDragEnd={() => {
      setDraggedPath(null)
      setDragOverPath(null)
      if (expandTimerRef.current) {
       clearTimeout(expandTimerRef.current)
       expandTimerRef.current = null
      }
     }}
     onDrop={(e) => handleDrop(e, node.path)}
    >
 <div 
 draggable
 onDragStart={(e) => {
 setDraggedPath(node.path)
 e.dataTransfer.setData('text/plain', node.path)
 e.dataTransfer.effectAllowed = 'move'
 // Ensure drag preview looks good
 e.dataTransfer.setDragImage(e.currentTarget, 10, 10)
}}
 onClick={() => node.isFolder ? toggleFolder(node.path) : selectFile(node.path)}
 className={cn(
    "flex items-center gap-1.5 py-1 cursor-pointer px-2 group relative rounded-[4px] mx-1",
    isSelected 
     ? "bg-[#232326] text-foreground font-semibold shadow-sm" 
     : "hover:bg-foreground/[0.03] text-[#a1a1aa] hover:text-foreground",
    dragOverPath === node.path && "bg-[#232326]/50 ring-1 ring-[#242426] ring-inset",
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
 onChange={(e) => setNewItemName(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleRenameItem()
 if (e.key === 'Escape') setRenamingPath(null)
}}
 onBlur={handleRenameItem}
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
 setCreatingInPath(node.path)
 setCreatingType('file')
 setNewItemName('')
 if (!isExpanded) toggleFolder(node.path)
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
 setRenamingPath(node.path)
 setNewItemName(node.name)
}}
 className="p-0.5 hover:bg-accent hover:text-foreground rounded-[8px] "
 title="Rename"
 >
 <Edit3 size={10} />
 </button>
 <button
 onClick={(e) => handleDeleteItem(node.path, node.isFolder)}
 className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded-[8px] "
 title="Delete"
 >
 <Trash2 size={10} strokeWidth={2.5} />
 </button>
 </div>
 </div>
 {node.isFolder && isExpanded && (
 <div className="pl-3.5 border-l border-border/10 ml-[9px]">
 {creatingInPath === node.path && (
 <div className="flex items-center gap-1.5 py-1 px-2">
 <div className="w-4 h-4 shrink-0" />
 {creatingType === 'folder' ? <Folder size={12} className="text-muted-foreground/60" /> : <FileText size={12} className="text-muted-foreground/40" />}
 <input
 autoFocus
 className="flex-1 bg-background border border-primary rounded-[8px] px-1 py-0 text-[12px] outline-none h-5"
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
 )}
 {node.children && renderTree(node.children, level + 1)}
 </div>
 )}
 </div>
 )
})

 // Root level creation
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
 )
}

 return result
}

  return (
  <div className="flex flex-row h-full w-full select-none bg-transparent gap-3 overflow-hidden font-sans relative">
    <style dangerouslySetInnerHTML={{__html: `
      .editor-content p {
        margin-bottom: 1.5rem;
        line-height: 1.7;
        color: #a1a1aa;
      }
      .editor-content strong {
        color: #ebebeb;
        font-weight: 600;
      }
      .underlined-term {        border-bottom: 1px solid #a1a1aa;
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

    {/* ExplorerSidebar */}
    {!isFullscreen && (
      <aside 
        onMouseEnter={() => window.focus()}
        className="relative border border-border/40 flex flex-col bg-bento-panel shadow-sm shrink-0 group/sidebar z-40 overflow-hidden rounded-[12px] panel-transition"
        style={{width: `${sidebarWidth}px`}}
      >
        {/* Resize Handle */}
        <div 
          className={cn(
            "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-foreground/20",
            isResizing ? "bg-foreground w-1" : "bg-transparent"
          )}
          onMouseDown={startResizing}
        />
        
        {/* Global Toolbar */}
        <div className="p-4 flex items-center justify-between gap-2">
          <button 
            className="p-1.5 text-[#a1a1aa] hover:text-foreground rounded-[4px] hover:bg-bento-item shrink-0" 
            title="New Note"
            onClick={() => {setCreatingInPath(null); setCreatingType('file'); setNewItemName('');}}
          >
            <Plus className="w-[18px] h-[18px]" />
          </button>
          <button 
            className="p-1.5 text-[#a1a1aa] hover:text-foreground rounded-[4px] hover:bg-bento-item shrink-0" 
            title="New Folder"
            onClick={() => {setCreatingInPath(null); setCreatingType('folder'); setNewItemName('');}}
          >
            <FolderPlus className="w-[18px] h-[18px]" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a1a1aa]" />
            <input
              type="text"
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                setInputValue(val);
                startTransition(() => {
                  setSearchQuery(val);
                });
              }}
              className={cn(
                "w-full bg-background border border-border/40 rounded-[4px] py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-[#a1a1aa]/50 focus:outline-none focus:border-border transition-colors",
                isPending && "opacity-75"
              )}
            />
          </div>
          <button 
            className={cn(
              "p-1.5 rounded-[4px] shrink-0 transition-colors", 
              showGraphView 
                ? "text-foreground bg-bento-item" 
                : "text-[#a1a1aa] hover:text-foreground hover:bg-bento-item"
            )} 
            onClick={() => setShowGraphView(!showGraphView)} 
            title="Toggle Graph View"
          >
            <Network className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Sidebar Tabs */}
        <div className="flex border-b border-border/40 px-4 text-xs font-semibold tracking-[0.02em] mb-2 shrink-0">
          <button 
            onClick={() => setSidebarTab('explorer')}
            className={cn(
              "px-3 py-3 border-b-2 outline-none transition-none",
              sidebarTab === 'explorer' 
                ? "text-foreground border-foreground font-semibold" 
                : "text-[#a1a1aa] border-transparent hover:text-foreground"
            )}
          >
            EXPLORER
          </button>
          <button 
            onClick={() => setSidebarTab('hubs')}
            className={cn(
              "px-3 py-3 border-b-2 outline-none transition-none",
              sidebarTab === 'hubs' 
                ? "text-foreground border-foreground font-semibold" 
                : "text-[#a1a1aa] border-transparent hover:text-foreground"
            )}
          >
            HUBS
          </button>
          <button 
            onClick={() => setSidebarTab('pdfs')}
            className={cn(
              "px-3 py-3 border-b-2 outline-none transition-none",
              sidebarTab === 'pdfs' 
                ? "text-foreground border-foreground font-semibold" 
                : "text-[#a1a1aa] border-transparent hover:text-foreground"
            )}
          >
            PDFS
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 text-sm text-[#a1a1aa]">
          {sidebarTab === 'explorer' && (
            <div 
              className="py-2 min-h-full"
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => handleDrop(e, null)}
            >
              {files.length > 0 ? renderTree(filteredFiles) : (
                <div className="py-10 text-center opacity-40">
                  <Folder className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Vault Empty</p>
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'hubs' && (
            <div className="flex flex-col p-2 gap-4">
              {loadingHubs ? (
                <div className="py-8 flex justify-center"><RefreshCw size={16} className="animate-spin text-[#a1a1aa]/30" /></div>
              ) : Object.keys(groupedHubs).length > 0 ? (
                Object.entries(groupedHubs).map(([course, courseHubs]) => (
                  <div key={course} className="flex flex-col gap-1">
                    <div className="px-2 py-1 flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a1a1aa]/40">{course}</span>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                    {courseHubs.map(hub => (
                      <button 
                        key={hub.id}
                        onClick={() => selectFile(hub.path)}
                        className={cn(
                          "flex flex-col p-2 rounded-[4px] hover:bg-bento-item text-left transition-none mx-1",
                          selectedPath === hub.path ? "bg-bento-item text-foreground font-medium" : "text-[#a1a1aa] hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black opacity-50 tabular-nums">U{hub.unit || '0'}</span>
                          <span className="text-[12px] truncate">{hub.title.replace(' Hub', '')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]/20">No hubs found</div>
              )}
            </div>
          )}

          {sidebarTab === 'pdfs' && (
            <div className="flex flex-col p-2 gap-4">
              {Object.entries(groupedPdfs).map(([folder, folderPdfs]) => (
                <div key={folder} className="flex flex-col gap-1">
                  <div className="px-2 py-1 flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a1a1aa]/40">{folder}</span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                  {folderPdfs.map(file => (
                    <button 
                      key={file.path}
                      onClick={() => selectFile(file.path)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-[4px] text-left transition-all mx-1",
                        selectedPath === file.path 
                          ? "bg-bento-item text-foreground font-medium" 
                          : "text-[#a1a1aa] hover:text-foreground hover:bg-bento-item"
                      )}
                    >
                      <FileText size={14} className={cn(
                        "shrink-0",
                        selectedPath === file.path ? "text-foreground" : "text-[#a1a1aa]/50"
                      )} />
                      <span className="text-[12px] truncate">{file.name.replace('.pdf', '')}</span>
                    </button>
                  ))}
                </div>
              ))}
              {Object.keys(groupedPdfs).length === 0 && (
                <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]/20">No PDFs found</div>
              )}
            </div>
          )}
        </div>
      </aside>
    )}

    {/* Main Editor Panel */}
    {showGraphView ? (
      <div className="flex-1 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden panel-transition">
        <ObsidianGraphView onNodeClick={(path) => {
          selectFile(path);
          setShowGraphView(false);
        }} />
      </div>
    ) : (
      <main 
        data-purpose="main-editor"
        className="flex-1 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-y-auto custom-scrollbar relative flex flex-col min-w-0 panel-transition"
      >
        {!selectedPath ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-[#a1a1aa]/20 gap-4 mt-32">
            <FileText size={64} strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]/40">Select an asset to visualize</p>
          </div>
        ) : (
          <div className={cn("mx-auto w-full max-w-full relative flex-1 flex flex-col", (typeof selectedPath === 'string' && selectedPath.toLowerCase().endsWith('.pdf')) ? "p-0 overflow-hidden" : "py-4 px-6 max-w-full")}>
            {loadingNote && (
              <PanelLoader label="Loading Document" />
            )}
            
            {/* Note details */}
            {!(typeof selectedPath === 'string' && selectedPath.toLowerCase().endsWith('.pdf')) ? (
              <div className="editor-content px-2 mx-auto max-w-[95%] w-full">
                <h1 className="text-[32px] font-bold mb-4 text-foreground tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: '28px' }}>
                  {(noteMetadata?.title || noteMetadata?.Title || selectedPath.split('/').pop()?.replace('.md', '').replace('.pdf', '') || '').replace(/_/g, ' ')}
                </h1>

                {/* Metadata Pills */}
                <div className="flex items-center gap-2 mb-10 border-b border-[#242426] pb-6">
                  {noteMetadata?.semester && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#242426] text-[#a1a1aa] hover:text-foreground hover:bg-[#232326] transition-colors text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {cleanTitle(noteMetadata.semester)}
                    </button>
                  )}
                  {noteMetadata?.course && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#242426] text-[#a1a1aa] hover:text-foreground hover:bg-[#232326] transition-colors text-xs font-medium">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {cleanTitle(noteMetadata.course)}
                    </button>
                  )}
                  {noteMetadata?.unit && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#242426] text-[#a1a1aa] hover:text-foreground hover:bg-[#232326] transition-colors text-xs font-medium">
                      <Hash className="w-3.5 h-3.5" />
                      Unit {cleanTitle(noteMetadata.unit)}
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

                <div className="mt-8">
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
                      className="w-full h-[600px] p-8 bg-[#151517] border border-[#242426] rounded-[4px] font-mono text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-white/20 text-foreground"
                      placeholder="Start writing..."
                      autoFocus
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

                <KnowledgeFooter 
                  tree={studyTree} 
                  activePath={selectedPath}
                  onNavigate={handleWikiLinkClick}
                  onFinish={async () => {
                    if (selectedPath) {
                      const label = selectedPath.split('/').pop()?.replace('.md', '') ?? '';
                      await handleToggleCheckbox(label, true, selectedPath);
                    }
                  }}
                />

                <div className="mt-8 mb-12 flex flex-col items-center gap-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a1a1aa]/50">Space Repetition Review</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => handleSRSRating(1)} className="px-6 py-2 rounded-[4px] text-xs font-bold border border-destructive/30 text-destructive hover:bg-destructive/10 transition-none">Again</button>
                    <button onClick={() => handleSRSRating(2)} className="px-6 py-2 rounded-[4px] text-xs font-bold border border-[#a1a1aa]/30 text-[#a1a1aa] hover:bg-[#232326] transition-none">Hard</button>
                    <button onClick={() => handleSRSRating(3)} className="px-6 py-2 rounded-[4px] text-xs font-bold border border-primary/50 text-primary hover:bg-primary/10 transition-none">Good</button>
                    <button onClick={() => handleSRSRating(4)} className="px-6 py-2 rounded-[4px] text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-none shadow-lg shadow-primary/20">Easy</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
                <div className="flex-1 min-h-0">
                  <PdfViewer 
                    ref={pdfRef}
                    path={selectedPath} 
                    title={selectedPath.split('/').pop() || ''} 
                    initialPage={selectedPage} 
                    filterPages={selectedFilteredPages}
                    onStateChange={handlePdfStateChange}
                  />
                </div>
                
                {/* Knowledge Navigation Footer for PDF (when in context) */}
                {studyTree.length > 0 && (
                  <div className="border-t border-[#242426] bg-[#151517]/50 px-16 py-8">
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
    )}

    {/* Map Checklist Sidebar (Right-Contextual) */}
    {selectedPath && !(typeof selectedPath === 'string' && selectedPath.toLowerCase().endsWith('.pdf')) && !isFullscreen && (
      <aside 
        data-purpose="map-checklist"
        onMouseEnter={() => window.focus()}
        className="relative border border-border/40 flex flex-col bg-bento-panel shadow-sm shrink-0 group/connections overflow-hidden rounded-[12px] panel-transition"
        style={{width: `${connectionsWidth}px`}}
      >
        {/* Resize Handle */}
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-foreground/20",
            isResizingConnections ? "bg-foreground w-1" : "bg-transparent"
          )}
          onMouseDown={startResizingConnections}
        />
        
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#242426] flex items-center gap-2 text-xs font-semibold tracking-[0.02em] text-[#a1a1aa] uppercase bg-transparent shrink-0">
            <svg fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
              <rect height="18" rx="2" width="18" x="3" y="3"></rect>
              <path d="M9 3v18"></path>
              <path d="M15 3v18"></path>
            </svg>
            MAP
          </div>

          {/* Hub Context Badge */}
          {(() => {
            const hubName = noteMetadata?.hub || noteMetadata?.Hub || noteMetadata?.HUB || noteMetadata?.concept_hub || noteMetadata?.course || noteMetadata?.Course
            if (!hubName) return null
            const clean = typeof hubName === 'string' ? hubName.replace(/\[\[/g, '').replace(/\]\]/g, '').split('/').pop() : ''
            return (
              <div className="p-4 pb-1 shrink-0">
                <div className="text-[11px] text-[#a1a1aa] uppercase font-semibold mb-2 tracking-[0.02em]">Topic</div>
                <button
                  onClick={() => handleWikiLinkClick(typeof hubName === 'string' ? hubName.replace(/\[\[/g, '').replace(/\]\]/g, '') : '')}
                  className="w-full flex items-center justify-between bg-[#232326] border border-[#242426] rounded-[12px] p-3 text-sm cursor-pointer hover:bg-opacity-80 transition-colors text-left"
                >
                  <span className="truncate text-foreground font-medium">{clean?.replace(/_/g, ' ')}</span>
                  <ChevronDown size={16} className="text-[#a1a1aa] shrink-0" />
                </button>
              </div>
            )
          })()}

          {/* Connection links */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 text-sm text-[#a1a1aa]">
            <div className="max-w-5xl mx-auto mt-2">
              {hubConnections ? (
                <HubConnectionsNav
                  content={hubConnections}
                  activePath={selectedPath}
                  onNavigate={handleWikiLinkClick}
                  onToggleCheckbox={handleToggleCheckbox}
                  searchQuery={searchQuery}
                />
              ) : (
                <div className="py-20 flex flex-col items-center gap-3 opacity-20">
                  <Network size={24} strokeWidth={1} className="text-[#a1a1aa]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#a1a1aa] text-center">No Map Found</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    )}
    
    {(isResizing || isResizingConnections) && (
      <div className="fixed inset-0 z-[9999] cursor-col-resize select-none bg-transparent" />
    )}
  </div>
  )
}
