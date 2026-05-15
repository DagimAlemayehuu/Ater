import React, {useState, useEffect, useRef} from 'react'
import {
 ShieldCheck, RefreshCw, 
 FileText, Activity, 
 Zap,
 User, BookOpen, DollarSign, Bot, ChevronLeft, ChevronRight, ArrowRight, Settings as SettingsIcon, Target, Database, FileEdit, Tag, Calendar, LayoutDashboard, Sparkles, Plus, Info, X, Copy, Archive, Layers, ChevronDown, Check, ArrowLeft, CheckCircle, CheckCircle2
} from 'lucide-react'
import {sidecarApi} from '@/lib/sidecarApi'
import {cn} from '@/lib/utils'
import {useConfig} from '@/lib/ConfigContext'
import {useHeader} from '@/context/header-context'
import {useNavigate} from 'react-router-dom'

/* ─── Utilities ─── */
const cleanTitle = (val: any): string => {
  if (val === undefined || val === null) return ''
  return String(val).replace(/\[\[(.*?)\]\]/g, '$1').replace(/_/g, ' ').trim()
}

/* ─── Plan UI Components ─── */
function CurriculumPill({
 label, 
 value, 
 onChange, 
 icon: Icon, 
 isEditable = true,
 isDropdown = false,
 onClick,
 options = []
}: {
 label: string, 
 value: string, 
 onChange?: (v: string) => void, 
 icon: any, 
 isEditable?: boolean,
 isDropdown?: boolean,
 onClick?: () => void,
 options?: string[]
}) {
 const [isMenuOpen, setIsMenuOpen] = useState(false);

 return (
 <div className="relative">
 <div 
 onClick={() => {
 if (isDropdown) onClick?.();
 else if (options.length > 0) setIsMenuOpen(!isMenuOpen);
}}
 className={cn(
 "px-2.5 py-1.5 rounded bg-background border border-border text-xs font-semibold uppercase tracking-tight flex items-center gap-2  hover:bg-muted hover:border-muted-foreground/30",
 (isDropdown || options.length > 0) && "cursor-pointer"
 )}
 >
 <Icon size={14} className="text-muted-foreground group-hover:text-foreground " />
 <div className="flex items-center gap-1.5">
 <span className="text-muted-foreground">{label}:</span>
 {isEditable && options.length === 0 ? (
 <input 
 className="bg-transparent border-none focus:outline-none text-foreground font-medium min-w-[20px] placeholder:text-muted-foreground/40 border-b border-transparent focus:border-border "
 value={value}
 onChange={(e) => onChange?.(e.target.value)}
 placeholder="Set..."
 onClick={(e) => e.stopPropagation()}
 />
 ) : (
 <span className="text-foreground font-medium">{value || 'None'}</span>
 )}
 </div>
 {(isDropdown || options.length > 0) && <ChevronDown size={14} className="text-muted-foreground ml-1" />}
 </div>

 {/* Selection Menu for Pills with Options */}
 {isMenuOpen && options.length > 0 && (
 <>
 <div className="fixed inset-0 z-[110]" onClick={() => setIsMenuOpen(false)} />
 <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border shadow-md rounded z-[120] p-1.5 ">
 <div className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground tracking-tight mb-1">{label} Options</div>
 <div className="max-h-40 overflow-y-auto custom-scrollbar">
 {options.map(opt => (
 <button 
 key={opt}
 onClick={() => {
 onChange?.(opt);
 setIsMenuOpen(false);
}}
 className={cn(
 "w-full text-left px-2 py-1.5 rounded text-sm font-medium  hover:bg-muted",
 value === opt && "text-foreground bg-accent"
 )}
 >
 {opt}
 </button>
 ))}
 </div>
 </div>
 </>
 )}
 </div>
 )
}

function BatchTreeView({batches, processedNotes}: {batches: any[], processedNotes: any[]}) {
 if (!batches || batches.length === 0) return null;

 const processedTitles = new Set(processedNotes?.map((n: any) => {
   const raw = typeof n === 'string' ? n : (n?.title ?? '');
   return cleanTitle(raw).toLowerCase();
 }));

 // Flatten all notes, tagged done/pending
 const allNotes: {batchId: number; note: string; isDone: boolean}[] = [];
 batches.forEach((batch: any) => {
   batch.notes?.forEach((note: string) => {
     allNotes.push({
       batchId: batch.id,
       note,
       isDone: processedTitles.has(cleanTitle(note).toLowerCase()),
     });
   });
 });

 // Done notes float to top, pending follow
 const sorted = [
   ...allNotes.filter(n => n.isDone),
   ...allNotes.filter(n => !n.isDone),
 ];

 const firstPendingIdx = sorted.findIndex(n => !n.isDone);
 const firstPendingRef = useRef<HTMLDivElement | null>(null);

 useEffect(() => {
   firstPendingRef.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
 }, [firstPendingIdx]);

 return (
 <div className="flex flex-col gap-0.5 overflow-y-auto custom-scrollbar pr-2 pb-4 max-h-[340px]">
   {sorted.map((item, idx) => {
     const isCurrentNote = !item.isDone && idx === firstPendingIdx;
     return (
       <div
         key={`${item.batchId}-${item.note}-${idx}`}
         ref={isCurrentNote ? firstPendingRef : null}
         className={cn(
           "flex items-center gap-3 px-2 py-1.5 rounded-none  ",
           item.isDone ? "opacity-35" : "opacity-100",
           isCurrentNote && "bg-muted/15 border border-border/40"
         )}
       >
         <div className="shrink-0 flex items-center justify-center w-3 h-3">
           {item.isDone ? (
             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
               <circle cx="6" cy="6" r="5" fill="currentColor" className="text-muted-foreground/50" />
             </svg>
           ) : (
             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
               <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"
                 className={isCurrentNote ? "text-foreground" : "text-muted-foreground/30"} />
             </svg>
           )}
         </div>
         <span className={cn(
           "text-[11px] font-black uppercase tracking-widest truncate flex-1",
           item.isDone
             ? "line-through text-muted-foreground/30"
             : isCurrentNote
               ? "text-foreground"
               : "text-muted-foreground/60"
         )}>
           {cleanTitle(item.note)}
         </span>
         {isCurrentNote && (
           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 shrink-0">
             Now
           </span>
         )}
       </div>
     );
   })}
 </div>
 )
}

/* ─── Plan Card View Component ─── */
function PlanCardView({planRaw}: {planRaw: string}) {
 const extract = (tag: string) => {
 const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's')
 const match = planRaw.match(regex)
 return match ? match[1].trim() : null
}

 const hubContent = extract('hub_note')
 const pqContent = extract('pq_note')
 const atomicContent = extract('atomic_notes')

 const cleanLink = (text: string) => cleanTitle(text).replace(/\*\*/g, '').replace(/\*/g, '')

 const parseAtomicTree = (text: string) => {
 // Strategy 1: Bulleted/numbered list lines (standard AI output)
 const listLines = text.split('\n').filter(l => 
 l.trim().match(/^\d+\./) || l.trim().startsWith('-') || l.trim().startsWith('*')
 )
 
 // Strategy 2: Comma-separated [[links]] inline (also common AI output)
 const inlineLinks: string[] = []
 if (listLines.length === 0) {
 const allLinks = [...text.matchAll(/\[\[([^\]]+)\]\]/g)]
 allLinks.forEach(m => inlineLinks.push(m[1]))
}

 if (listLines.length === 0 && inlineLinks.length > 0) {
 // Return flat card nodes from inline links
 return inlineLinks.map(title => ({
 level: 0,
 title: cleanLink(`[[${title}]]`),
 mode: null,
 parent: null,
 pages: [],
 description: ''
}))
}
 
 return listLines.map(line => {
 // Determine level from indentation
 const indentMatch = line.match(/^(\s*)/)
 const spaces = indentMatch ? indentMatch[1].length : 0
 const level = Math.floor(spaces / 2)

 // Extract content
 const rawContent = line.replace(/^\s*(\d+\.|-|\*)\s*/, '').trim()
 
 // Extract bits
 const titleMatch = rawContent.match(/\[\[(.*?)\]\]/)
 const modeMatch = rawContent.match(/\(Mode\s+([A-Z]+)\)/i)
 const parentMatch = rawContent.match(/Parent:\s*\[\[(.*?)\]\]/)
 const pagesMatch = rawContent.match(/Pages:\s*\[(.*?)\]/)

 let description = '';
 if (rawContent.includes(':')) {
 // Try to find the description which is usually after the mode and before Parent/Pages
 description = rawContent.split(':').slice(1).join(':')
 .split('Parent:')[0]
 .split('Pages:')[0]
 .trim();
}

 return {
 level,
 title: titleMatch ? cleanLink(titleMatch[1]) : cleanLink(rawContent.split('-')[0]),
 mode: modeMatch ? modeMatch[1] : null,
 parent: parentMatch ? parentMatch[1] : null,
 pages: pagesMatch ? pagesMatch[1].split(',').map(p => p.trim()).filter(p => p) : [],
 description: description
}
})
}

 const atomicTree = atomicContent ? parseAtomicTree(atomicContent) : []

 return (
 <div className="flex flex-col overflow-y-auto custom-scrollbar pr-2 gap-6 h-full">
 <div className="flex flex-col gap-3">
 {hubContent && (
 <div className="rounded border border-border bg-background p-5 hover:border-muted-foreground/30  group">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-1.5 bg-muted rounded text-foreground">
 <Bot size={16} />
 </div>
 <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Topic</h4>
 </div>
 <div className="text-sm font-medium text-foreground underline decoration-muted-foreground/20 underline-offset-4 cursor-default">
 {cleanLink(hubContent)}
 </div>
 </div>
 )}
 {pqContent && (
 <div className="rounded border border-border bg-background p-5 hover:border-muted-foreground/30  group">
 <div className="flex items-center gap-3 mb-3">
 <div className="p-1.5 bg-muted rounded text-foreground">
 <ShieldCheck size={16} />
 </div>
 <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Test</h4>
 </div>
 <div className="text-sm font-medium text-foreground underline decoration-muted-foreground/20 underline-offset-4 cursor-default">
 {cleanLink(pqContent)}
 </div>
 </div>
 )}
 </div>

 <div className="flex flex-col gap-4 overflow-visible">
 <div className="flex items-center gap-2 px-1 shrink-0">
 <Layers size={16} className="text-muted-foreground" />
 <h4 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">Notes</h4>
 </div>
 
 <div className="flex flex-col gap-2">
 {atomicTree.map((node, i) => (
 <div 
 key={i} 
 style={{marginLeft: `${node.level * 24}px`}}
 className={cn(
 "p-3 rounded border bg-background hover:border-muted-foreground/30 hover:bg-muted/50  relative overflow-hidden group min-w-0 w-full",
 node.level > 0 ? "border-dashed opacity-90 scale-[1] border-border" : "border-solid border-border shadow-sm"
 )}
 >
 {node.level > 0 && (
 <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-border group-hover:bg-muted-foreground/40 " />
 )}
 <div className="flex items-start justify-between gap-4 min-w-0">
 <div className="flex items-start gap-3 min-w-0 flex-1">
 <div className={cn(
 "p-1.5 rounded shrink-0 mt-0.5",
 node.level === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
 )}>
 <FileText size={12} />
 </div>
 <div className="flex flex-col gap-1 min-w-0">
 <div className="font-bold text-[13px] text-foreground truncate group-hover:text-foreground ">
 {node.title}
 {node.mode && (
 <span className="ml-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest border border-border px-1 rounded">
 {node.mode}
 </span>
 )}
 </div>
 {node.description && (
 <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg">
 {node.description}
 </p>
 )}
 {node.pages.length > 0 && (
 <div className="flex items-center gap-1.5 mt-1.5">
 <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">Relevant Pages:</span>
 <div className="flex flex-wrap gap-1">
 {node.pages.map(p => (
 <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded hover:bg-background hover:border-muted-foreground/30  cursor-default">
 {p}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 {node.parent && (
 <div className="hidden sm:flex items-center gap-1 text-[9px] font-bold uppercase text-muted-foreground shrink-0">
 <ArrowLeft size={10} />
 <span className="truncate max-w-[80px]">{node.parent}</span>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )
}

/* ─── AI Agents (Ater) Dashboard ─── */
function AterDashboard({onBack}: {onBack: () => void}) {
 const {config, saveConfig} = useConfig()
 const navigate = useNavigate()
 const [queueStatus, setQueueStatus] = useState<any>(null)
 const [inboxFiles, setInboxFiles] = useState<any[]>([])
 const [loadingInbox, setLoadingInbox] = useState(false)
 const [selectedInboxFile, setSelectedInboxFile] = useState<any>(null)
 const [processing, setProcessing] = useState(false)
 const [activePlan, setActivePlan] = useState<string | null>(null)
 const [structuredPlan, setStructuredPlan] = useState<any>(null)
 const [sessionId, setSessionId] = useState<string | null>(null)
 const [anchoredHub, setAnchoredHub] = useState<any>(null)
 const [availableHubs, setAvailableHubs] = useState<any[]>([])
 const [availableOptions, setAvailableOptions] = useState<{courses: string[], semesters: string[], units: string[]}>({courses: [], semesters: [], units: []})
 const [curriculum, setCurriculum] = useState({course: '', unit: '', semester: '', hub_title: ''})
 const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)
 const [isCurriculumReady, setIsCurriculumReady] = useState(false)
 const [currentBatch, setCurrentBatch] = useState<number>(0)
 const [totalBatches, setTotalBatches] = useState<number>(0)
 const [isCompleted, setIsCompleted] = useState(false)
 const [batchFeed, setBatchFeed] = useState<any[]>([])
 const [aterError, setAterError] = useState<string | null>(null)

 const [isAwaitingNextBatch, setIsAwaitingNextBatch] = useState(false)

  const {setRightContent} = useHeader()

 const fetchStatus = async () => {
 try {
 const res = await sidecarApi.aterQueueStatus()
 setQueueStatus(res)
} catch (err) {console.error(err)}
}

 // Sync Header Actions
 useEffect(() => {
  const HeaderActions = (
   <div className="flex items-center gap-2">
    <div className="flex items-center gap-2 bg-muted/30 border border-border/40 px-2.5 py-1 rounded-none text-[9px] font-black uppercase tracking-widest text-muted-foreground">
     <span>Auto-Ingest</span>
     <button 
      onClick={toggleAutoDeploy}
      className={cn(
       "relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-none border border-transparent   ease-in-out focus:outline-none", 
       config?.autoDeploy ? 'bg-foreground' : 'bg-muted-foreground/30'
      )}
     >
      <span className={cn(
       "pointer-events-none inline-block h-3 w-3 transform rounded-none bg-background shadow ring-0 transition  ease-in-out", 
       config?.autoDeploy ? 'translate-x-3.5' : 'translate-x-0'
      )} />
     </button>
    </div>
    <button 
     onClick={() => {fetchInbox(); fetchStatus();}} 
     className="flex items-center justify-center w-8 h-8 bg-muted/30 border border-border/40 text-muted-foreground rounded-none hover:text-foreground hover:border-foreground/30 "
    >
     <RefreshCw size={12} />
    </button>
   </div>
  );

  setRightContent(HeaderActions);
  return () => setRightContent(null);
 }, [config?.autoDeploy, queueStatus]);

 const fetchInbox = async () => {
 setLoadingInbox(true)
 try {
 const res = await sidecarApi.aterListInbox()
 setInboxFiles(res.files || [])
} finally {setLoadingInbox(false)}
}

 useEffect(() => {
  let active = true;
  let timer: NodeJS.Timeout;

  const poll = async () => {
   if (!active) return;
   await fetchStatus();
   if (!active) return;
   timer = setTimeout(poll, 2000);
  };

  fetchInbox();
  poll();

  return () => {
   active = false;
   clearTimeout(timer);
  };
 }, [])

 const toggleAutoDeploy = async () => {
 await saveConfig({autoDeploy: !config?.autoDeploy})
 await sidecarApi.aterWatcherToggle()
 fetchStatus()
}

 const resetAterSession = () => {
 setSessionId(null)
 setIsAwaitingConfirmation(false)
 setIsCurriculumReady(false)
 setIsAwaitingNextBatch(false)
 setIsCompleted(false)
 setActivePlan(null)
 setStructuredPlan(null)
 setBatchFeed([])
 setSelectedInboxFile(null)
 setAterError(null)
 fetchInbox()
}

 const processSelectedFile = async (manualHubId?: string) => {
 if (!selectedInboxFile) return
 setProcessing(true)
 setAterError(null)
 setActivePlan(null)
 setStructuredPlan(null)
 setIsCurriculumReady(false)
 setIsAwaitingConfirmation(false)
 
 try {
 // First pass: Just get hub detection and metadata list (NO AI)
 const res = await sidecarApi.aterProcess({
 file_path: selectedInboxFile.path,
 target_hub_id: manualHubId ? String(manualHubId) : undefined
})

 if (res.status === 'error') {
  setAterError((res as any).message || 'Detection failed');
  setProcessing(false);
  return;
 }

 setAnchoredHub(res.anchored_hub)
 setAvailableHubs(res.available_hubs || [])
 setAvailableOptions(res.available_options || {courses: [], semesters: [], units: []})
 
 // CRITICAL FIX: If anchored_hub is present use it; otherwise fall back to detected_curriculum
 // This ensures the UI pre-fills even when the AI had to create a new hub stub.
 const anchor = res.anchored_hub
 const detected = res.detected_curriculum
 
 setCurriculum({
 course: anchor?.course || detected?.course || '',
 unit: String(anchor?.unit || detected?.unit || ''),
 semester: anchor?.semester || detected?.semester || '',
 hub_title: cleanTitle(anchor?.title || (detected?.hub_title ? (
 (detected.unit ? detected.unit + ' ' : '') + detected.hub_title + ' Hub'
 ) : '')),
})
 setIsCurriculumReady(true)
} catch (err: any) {
 setAterError(err.message || 'Detection failed')
} finally {setProcessing(false)}
}

 const startPlanning = async () => {
 if (!selectedInboxFile) return
 setProcessing(true)
 setAterError(null)
 try {
 // Second pass: Now generate the full plan using the (finalized) curriculum
 const res = await sidecarApi.aterGeneratePlan({
 file_path: selectedInboxFile.path,
 curriculum: {
 course: String(curriculum.course || ""),
 unit: String(curriculum.unit || ""),
 semester: String(curriculum.semester || ""),
 hub_title: String(curriculum.hub_title || "")
},
 target_hub_id: anchoredHub?.id ? String(anchoredHub.id) : undefined
})
 setActivePlan(res.plan_raw)
 setStructuredPlan(res.plan_structured)
 setSessionId(res.session_id)
 setIsAwaitingConfirmation(true)
 setTotalBatches(res.plan_structured?.batches?.length || 1)
 setCurrentBatch(0)
} catch (err: any) {
 setAterError(err.message || 'Planning failed')
} finally {setProcessing(false)}
}

 const handleHubSelect = (hub: any) => {
 if (hub === 'new') {
 setAnchoredHub({id: 'new', title: 'New Hub'})
 setCurriculum({course: '', unit: '', semester: '', hub_title: 'New Unit Hub'})
 return
}
 setAnchoredHub(hub)
 setCurriculum({
 course: hub.course || '',
 unit: String(hub.unit || ''),
 semester: hub.semester || '',
 hub_title: cleanTitle(hub.title || '')
})
}

 const confirmDeployment = async (isStrict = false) => {
 if (!sessionId) return
 setProcessing(true)
 setIsAwaitingConfirmation(false)
 setIsAwaitingNextBatch(false)
 
 try {
 let currentHasMore = true;
 let currentLocalBatch = currentBatch;
 
 while (currentHasMore) {
 const command = isStrict ? "Proceed Batch (Auto)" : (currentLocalBatch === 0 
 ? "Confirm Final Plan & Proceed Batch 1" 
 : `Proceed Batch ${currentLocalBatch + 1}`);

 const res = await sidecarApi.aterConfirm({
 session_id: sessionId, 
 command,
 curriculum_override: currentLocalBatch === 0 ? {
 course: String(curriculum.course || ""),
 unit: String(curriculum.unit || ""),
 semester: String(curriculum.semester || ""),
 hub_title: String(curriculum.hub_title || "")
} : undefined,
 anchored_hub_id: anchoredHub?.id ? String(anchoredHub.id) : undefined
})
 
 if (res.status === 'error') {
 throw new Error((res as any).message || (res as any).detail || "Backend generation failed.");
}
 
 const tempBatch = res.current_batch || (currentLocalBatch + 1)
 currentLocalBatch = tempBatch
 setCurrentBatch(tempBatch)

 setBatchFeed(prev => [...prev, {
 batch: tempBatch, 
 results: res.results || [],
 ai_output: res.ai_output || ""
}])

 currentHasMore = res.has_more;
 
 if (currentHasMore) {
 if (isStrict) {
 // Small cooldown to let UI render and avoid immediately hammering the backend
 await new Promise(r => setTimeout(r, 500));
} else {
 setIsAwaitingNextBatch(true)
 break; // Break the loop so user has to click proceed again
}
} else {
 setIsCompleted(true)
 break;
}
}
} catch (err: any) {
 setAterError(err.message || 'Workflow failed')
 setIsAwaitingNextBatch(true) // allow retry
} finally {
 setProcessing(false) 
}
}
 return (
 <div className="h-full flex flex-col font-sans bg-background text-foreground overflow-hidden">

 <div className="flex-1 overflow-hidden bg-background">
 <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 h-full flex flex-col overflow-hidden">
 {/* AUTO INGESTION VIEW */}
 {queueStatus?.status !== 'idle' && (
 <div className="flex flex-col h-full overflow-hidden mb-4">
 <div className="p-8 rounded-none border border-border bg-muted/5 flex flex-col h-full overflow-hidden gap-8">
 <div className="flex items-center justify-between border-b border-border pb-6 shrink-0">
 <div className="flex items-center gap-3">
 <div>
 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Processing File</p>
 <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{queueStatus?.current_file || 'Initializing...'}</h2>
 {queueStatus?.queue_size > 0 && (
 <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
 + {queueStatus.queue_size} file{queueStatus.queue_size > 1 ? 's' : ''} pending
 </p>
 )}
 </div>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Progress</p>
 <p className="text-xl font-black tracking-tight text-foreground">{queueStatus?.current_batch} / {queueStatus?.total_batches}</p>
 </div>
 </div>
 
 <div className="space-y-4 shrink-0">
 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
 <span>Completion</span>
 <span>{Math.round(((queueStatus?.current_batch || 0) / (queueStatus?.total_batches || 1)) * 100)}%</span>
 </div>
 <div className="h-2 w-full bg-background rounded-none overflow-hidden border border-border">
 <div className="h-full bg-foreground  duration-700 ease-in-out" style={{width: `${((queueStatus?.current_batch || 0) / (queueStatus?.total_batches || 1)) * 100}%`}} />
 </div>
 </div>

 <div className={cn("p-4 rounded border shrink-0", 
 queueStatus?.last_action?.toLowerCase().includes("rate limit") || queueStatus?.last_action?.toLowerCase().includes("fail") || queueStatus?.status === 'error'
 ? "bg-destructive/10 border-destructive/20 text-destructive" 
 : "bg-background border-border text-muted-foreground"
 )}>
 <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Last Action</p>
 <p className="text-[11px] font-bold">{queueStatus?.last_action ? cleanTitle(queueStatus.last_action) : 'Waking up agent...'}</p>
 </div>

 {queueStatus?.planned_batches?.length > 0 && (
 <div className="pt-6 border-t border-border">
 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-4">Plan Feed</h4>
 <BatchTreeView batches={queueStatus.planned_batches} processedNotes={queueStatus.processed_notes || []} />
 </div>
 )}
 </div>
 </div>
 )}

 {/* INBOX VIEW (When idle and no file selected) */}
 {queueStatus?.status === 'idle' && !selectedInboxFile && (
 <div className="flex flex-col items-center justify-center h-full px-6 overflow-hidden">
  <div className="text-center mb-10 shrink-0">
  <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4 mt-8">AI Agents</h2>
  {config?.autoDeploy ? (
    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">
      Drop your file in the folder you set
    </p>
  ) : (
    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Select a file from your inbox to begin processing.</p>
  )}
  </div>
  
  {!config?.autoDeploy && (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar min-h-0 pb-12">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
    {loadingInbox ? (
    Array.from({length: 4}).map((_, i) => (
    <div key={i} className="h-24 rounded-none bg-muted/5 border border-border " />
    ))
    ) : inboxFiles.length > 0 ? (
    inboxFiles.map(f => (
    <div 
    key={f.path} 
    onClick={() => {setSelectedInboxFile(f); setAterError(null); setActivePlan(null); setIsAwaitingConfirmation(false); setIsCurriculumReady(false); setBatchFeed([]);}}
    className="p-8 rounded-none border border-border bg-muted/5 hover:bg-muted/5 hover:border-foreground/30 cursor-pointer  group flex flex-col justify-between"
    >
    <div>
    <h3 className="text-sm font-black uppercase tracking-tight text-foreground truncate">{f.name}</h3>
    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 truncate mt-2">{f.path}</p>
    </div>
    </div>
    ))
    ) : (
    <div className="col-span-full py-20 border border-dashed border-border rounded-none flex flex-col items-center justify-center text-muted-foreground/30">
    <Archive size={32} className="mb-4 opacity-50" />
    <p className="text-[10px] font-black uppercase tracking-widest">Inbox is empty</p>
    </div>
    )}
    </div>
    </div>
  )}
 </div>
 )}

 {/* MANUAL FLOW (When file is selected) */}
 {selectedInboxFile && queueStatus?.status === 'idle' && (
 <div className="flex flex-col h-full overflow-hidden">
 {/* Selected File Header */}
 <div className="p-6 rounded-none border border-border bg-muted/5 mb-8 flex items-center justify-between shrink-0">
 <div className="flex items-center gap-4">
 <button onClick={() => setSelectedInboxFile(null)} className="p-2 bg-background border border-border rounded-none text-muted-foreground hover:text-foreground ">
 BACK
 </button>
 <div>
 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Target File</p>
 <h3 className="text-base font-black uppercase tracking-tight text-foreground truncate max-w-sm">{selectedInboxFile.name}</h3>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {!isCurriculumReady && !processing && (
 <button onClick={() => processSelectedFile()} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:border-foreground/50 rounded-none ">
 Analyze Context
 </button>
 )}
 {isCurriculumReady && !activePlan && !processing && (
 <button onClick={startPlanning} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-foreground bg-muted/5 hover:bg-muted/5 rounded-none ">
 Generate Plan
 </button>
 )}
 {isAwaitingConfirmation && (
 <div className="flex items-center gap-2">
 <button onClick={() => confirmDeployment(true)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-foreground bg-muted/5 hover:bg-muted/5 rounded-none  disabled:opacity-50">
 Full Deploy
 </button>
 <button onClick={() => confirmDeployment(false)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:border-foreground/50 rounded-none  disabled:opacity-50">
 Deploy Step 1
 </button>
 </div>
 )}
 {isAwaitingNextBatch && (
 <div className="flex items-center gap-2">
 <button onClick={() => confirmDeployment(true)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-foreground bg-muted/5 hover:bg-muted/5 rounded-none  disabled:opacity-50">
 Finish All
 </button>
 <button onClick={() => confirmDeployment(false)} disabled={processing} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:border-foreground/50 rounded-none  disabled:opacity-50">
 Next Step
 </button>
 </div>
 )}
 {isCompleted && (
 <button onClick={resetAterSession} className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground border border-border bg-background hover:border-foreground/50 rounded-none ">
 Reset
 </button>
 )}
 </div>
 </div>

 {/* Processing Indicator */}
 {processing && !activePlan && !batchFeed.length && (
 <div className="py-24 flex flex-col items-center justify-center text-center ">
 <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-none mb-6" />
 <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 text-foreground/40">Generating...</h4>
 </div>
 )}

 {processing && (activePlan || batchFeed.length > 0) && (
 <div className="mb-8 p-6 rounded-none bg-muted/5 border border-border shrink-0 flex items-center justify-between ">
 <div className="flex items-center gap-4">
 <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-none" />
 <div>
 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-1">Status</p>
 <p className="text-sm font-black uppercase tracking-tight text-foreground">Executing Plan...</p>
 </div>
 </div>
 <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 uppercase">
 Batch {currentBatch} / {totalBatches}
 </p>
 </div>
 )}

 {/* Curriculum Editor */}
 {isCurriculumReady && !activePlan && !processing && (
 <div className="mb-8 p-8 rounded-none bg-muted/5 border border-border shrink-0 space-y-6 -95">
 <div className="flex items-center gap-3 border-b border-border pb-4">
 
 <div>
 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Details Found</h4>
 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Check details below</p>
 </div>
 </div>
 <div className="flex flex-wrap gap-3">
 <CurriculumPill label="Anchor" value={anchoredHub?.title || 'Standalone'} icon={Database} isEditable={false} />
 <CurriculumPill label="Hub Title" value={curriculum.hub_title} onChange={v => setCurriculum(p => ({...p, hub_title: v}))} icon={FileEdit} />
 <CurriculumPill label="Course" value={curriculum.course} onChange={v => setCurriculum(p => ({...p, course: v}))} icon={BookOpen} options={availableOptions.courses} />
 <CurriculumPill label="Unit" value={curriculum.unit} onChange={v => setCurriculum(p => ({...p, unit: v}))} icon={Tag} options={availableOptions.units} />
 <CurriculumPill label="Semester" value={curriculum.semester} onChange={v => setCurriculum(p => ({...p, semester: v}))} icon={Calendar} options={availableOptions.semesters} />
 </div>
 </div>
 )}

 {/* Plan Review */}
 {activePlan && !processing && !batchFeed.length && (
 <div className="flex-1 overflow-hidden min-h-0">
 <div className="p-8 rounded-none bg-muted/5 border border-border flex flex-col overflow-hidden h-full">
 <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
 
 <div>
 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Plan Ready</h4>
 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Ready to create notes</p>
 </div>
 </div>
 <PlanCardView planRaw={activePlan} />
 </div>
 </div>
 )}

 {/* Execution Feed */}
 {batchFeed.length > 0 && (
 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 mt-4 pr-2">
 <div className="flex items-center justify-between pb-4 border-b border-border">
 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Logs</h4>
 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{currentBatch} / {totalBatches} Completed</span>
 </div>
 
 {batchFeed.map(b => (
 <div key={b.batch} className="p-6 rounded-none border border-border bg-muted/5 -95">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-6 h-6 rounded-none bg-foreground text-[10px] font-black text-background flex items-center justify-center">
 {b.batch}
 </div>
 <span className={cn("text-[10px] font-black uppercase tracking-widest", b.results.length > 0 ? "text-foreground" : "text-destructive")}>
 {b.results.length > 0 ? "Success" : "Failed"}
 </span>
 </div>
 
 {b.results.length === 0 && (
 <div className="mb-4 mt-2 p-4 rounded-none bg-destructive/5 border border-destructive/20">
 <p className="text-[10px] text-destructive font-black uppercase tracking-widest mb-3">No Ater Regions detected.</p>
 <pre className="text-[9px] bg-background border border-border p-3 rounded-none overflow-x-auto font-mono text-muted-foreground/60">
 {b.ai_output}
 </pre>
 </div>
 )}
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {b.results.map((r: any, i: number) => (
 <div key={i} className="p-4 border border-border rounded-none bg-background flex items-center gap-3">
 <div className="p-2 bg-muted/5 rounded-none border border-border text-muted-foreground/40">
  <FileText size={14} />
 </div>
 <span className="text-[10px] font-black uppercase tracking-widest truncate text-foreground/80">{r.title}</span>
 </div>
 ))}
 </div>
 </div>
 ))}

 {isCompleted && (
 <div className="py-16 flex flex-col items-center justify-center text-center -95">
 <div className="w-16 h-16 rounded-none bg-muted/5 border border-border text-foreground/40 flex items-center justify-center mb-6">
  <CheckCircle2 size={32} />
 </div>
 <h4 className="text-xl font-black uppercase tracking-tight mb-2 text-foreground">All Done</h4>
 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-8 max-w-sm">All files have been saved to your vault.</p>
 <button onClick={() => navigate('/obsidian')} className="flex items-center justify-center rounded-none px-6 py-3 text-[10px] font-black uppercase tracking-widest text-foreground bg-background border border-border hover:border-foreground/50 ">
 Go to Vault
 </button>
 </div>
 )}
 </div>
 )}

 {aterError && (
 <div className="p-6 rounded-none bg-destructive/5 border border-destructive/20 mt-8">
 <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-destructive">
 
 Error
 </div>
 <p className="text-[10px] font-mono text-destructive/80">{aterError}</p>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 )
}

/* ─── Main Agents Hub ─── */
export default function Agents() {
 return <AterDashboard onBack={() => {}} />
}
