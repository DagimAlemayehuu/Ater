import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {RefreshCw, CalendarDays, GraduationCap, BookOpen, ClipboardList, FlaskConical, LayoutDashboard, Layers, ChevronLeft, ChevronRight, Activity} from 'lucide-react'
import {format, subMonths, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday, parseISO, startOfDay} from 'date-fns'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {sidecarApi} from '@/lib/sidecarApi'
import {useHeader} from '@/context/header-context'
import {useLayout} from '@/context/layout-provider'
import {PracticeModule} from './practice'
import {TabButton} from './academic-tabs/SharedComponents'
import AcademicCalendar from '@/components/academic/AcademicCalendar'
import ProgramTab from './academic-tabs/ProgramTab'
import CoursesTab from './academic-tabs/CoursesTab'
import StudyPlannerTab from './academic-tabs/StudyPlannerTab'
import AssignmentsTab from './academic-tabs/AssignmentsTab'
import ExamsTab from './academic-tabs/ExamsTab'
// import { SIDECAR_BASE_URL } from '@/lib/sidecarApi'
import {cleanTitle, DEFAULT_SCHEMAS, wrapWL} from './academic-tabs/utils'
import type {AcademicTab, AcademicData, VaultDatabase, TabProps} from './academic-tabs/types'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { BlockingLoader } from '@/components/ui/loading-state'

export default function AcademicDashboard() {
  const { history: storeHistory } = usePomodoroStore()
 const [data, setData] = useState<AcademicData | null>(null)
  const [apiStudyHistory, setApiStudyHistory] = useState<{sessions: any[], telemetry: any[], practice?: any[]}>({sessions: [], telemetry: [], practice: []})
  const [loading, setLoading] = useState(true)
 const [databases, setDatabases] = useState<VaultDatabase[]>([])
 const [, startDataTransition] = React.useTransition()
 const isMountedRef = useRef(false)
 const dataRequestIdRef = useRef(0)
 const databaseRequestIdRef = useRef(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (String(searchParams.get('tab') || 'PROGRAM').toUpperCase()) as AcademicTab
  const setActiveTab = (tab: AcademicTab | ((prev: AcademicTab) => AcademicTab)) => {
    if (typeof tab === 'function') {
      const current = (String(searchParams.get('tab') || 'PROGRAM').toUpperCase()) as AcademicTab
      setSearchParams({ tab: tab(current).toUpperCase() })
    } else {
      setSearchParams({ tab: tab.toUpperCase() })
    }
  }
  const selectedItemId = searchParams.get('id')
  const setSelectedItemId = (id: string | null) => setSearchParams(prev => {
    if (id) prev.set('id', id)
    else prev.delete('id')
    prev.set('tab', String(prev.get('tab') || 'PROGRAM').toUpperCase())
    return prev
  })
  const {setRightContent} = useHeader()
 const {setIsFullscreen} = useLayout()
 const nav = useNavigate()
 // const API_BASE = SIDECAR_BASE_URL

 // ── Data fetching ──────────────────────────────────────────────────────────
 const fetchData = useCallback(async () => {
 const requestId = ++dataRequestIdRef.current
 try {
  const dashRes = await sidecarApi.academicsDashboard()
  if (!isMountedRef.current || requestId !== dataRequestIdRef.current) return
  startDataTransition(() => {
    setData(dashRes as any)
    setLoading(false)
  })

  sidecarApi.getStudyHistory()
    .then(studyRes => {
      if (isMountedRef.current && requestId === dataRequestIdRef.current) {
        setApiStudyHistory(studyRes || { sessions: [], telemetry: [], practice: [] })
      }
    })
    .catch(() => {
      if (isMountedRef.current && requestId === dataRequestIdRef.current) {
        setApiStudyHistory({ sessions: [], telemetry: [], practice: [] })
      }
    })
 } catch {
  if (!isMountedRef.current || requestId !== dataRequestIdRef.current) return
  toast.error('Could not connect to vault')
  setLoading(false)
 }
}, [])

 const fetchDatabases = useCallback(async () => {
 const requestId = ++databaseRequestIdRef.current
 try {
 const res = await sidecarApi.listVaultDatabases()
 if (isMountedRef.current && requestId === databaseRequestIdRef.current) {
  startDataTransition(() => setDatabases(res.databases || []))
 }
} catch {}
}, [])

  useEffect(() => {
    isMountedRef.current = true
    fetchData()
    fetchDatabases()

    const handleFocus = () => {
      sidecarApi.clearOptionsCache()
      fetchData()
      fetchDatabases()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      isMountedRef.current = false
      dataRequestIdRef.current += 1
      databaseRequestIdRef.current += 1
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchData, fetchDatabases])

 useEffect(() => {
  setIsFullscreen(false)
 }, [setIsFullscreen])

 // ── Shared handlers ────────────────────────────────────────────────────────
  const onUpdate = useCallback(async (dbId: string, itemId: string, properties: Record<string, any>) => {
  console.log(`[Academic] Updating ${dbId}/${itemId}:`, properties)
  // Optimistic update
  setData(prev => {
  if (!prev) return prev
  const next = {...prev}
  let key: keyof AcademicData | undefined;
  const dbIdLow = dbId.toLowerCase();
  if (dbIdLow.includes('year')) key = 'years';
  else if (dbIdLow.includes('semester')) key = 'semesters';
  else if (dbIdLow.includes('course')) key = 'courses';
  else if (dbIdLow.includes('study planner') || dbIdLow.includes('study_sessions')) key = 'study_sessions';
  else if (dbIdLow.includes('exam')) key = 'exams';
  else if (dbIdLow.includes('assignment')) key = 'assignments';
  
  if (key && Array.isArray(next[key])) {
  next[key] = (next[key] as any[]).map(item => {
  if (item.id === itemId) {
  const updated = {...item, ...properties}
  if (properties.title) updated.id = properties.title
  return updated
}
  return item
})
}
  return next
})

  try {
  if (properties.title && properties.title !== itemId) {
  await sidecarApi.renameVaultFile(dbId, itemId, properties.title)
} else {
  await sidecarApi.updateVaultRow(dbId, itemId, properties)
}
  fetchData()
} catch {
  toast.error('Update failed')
  fetchData() // Revert to server state
}
}, [fetchData])

  const onCreate = useCallback(async (dbId: string, title: string, props?: Record<string, any>): Promise<string | null> => {
  const dbIdLow = dbId.toLowerCase();
  // Optimistic update for creation
  setData(prev => {
  if (!prev) return prev
  const next = {...prev}
  let key: keyof AcademicData | undefined;
  if (dbIdLow.includes('year')) key = 'years';
  else if (dbIdLow.includes('semester')) key = 'semesters';
  else if (dbIdLow.includes('course')) key = 'courses';
  else if (dbIdLow.includes('study planner') || dbIdLow.includes('study_sessions')) key = 'study_sessions';
  else if (dbIdLow.includes('exam')) key = 'exams';
  else if (dbIdLow.includes('assignment')) key = 'assignments';
  
  if (key && Array.isArray(next[key])) {
  const newItem = {id: title, title, ...props}
  next[key] = [...(next[key] as any[]), newItem]
}
  return next
})

  try {
  // Fill missing schema properties with empty strings or default wraps
  const finalProps = { ...props }
  const schema = DEFAULT_SCHEMAS[dbIdLow] || {}
  for (const [k, v] of Object.entries(schema)) {
    if (!(k in finalProps)) {
      finalProps[k] = v.type === 'relation' ? wrapWL('') : ''
    }
  }

  const res = await sidecarApi.createVaultRow(dbId, title, finalProps)
  fetchData()
  return res.id || null
} catch {
  toast.error('Creation failed')
  fetchData()
  return null
}
}, [fetchData])

  const onDelete = useCallback(async (dbId: string, itemId: string) => {
    try {
      await sidecarApi.deleteVaultRow(dbId, itemId)
      fetchData()
    } catch {toast.error('Delete failed')}
  }, [fetchData])

  const onScaffold = useCallback(async (name: string, years: number, level: string, currentYearIdx: number) => {
    try {
      const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
      const cleanName = name.replace(/_/g, ' ').trim()
      
      for (let i = 0; i < years; i++) {
        const title = `Year ${romans[i] || (i + 1)}`
        const status = i < currentYearIdx ? '[[Completed]]' : i === currentYearIdx ? '[[Active]]' : '[[Planned]]'
        const isCurrent = i === currentYearIdx
        
        await sidecarApi.createVaultRow('years', title, {
          Status: status,
          'Academic Level': `[[${level}]]`,
          'Current Year': isCurrent,
          Program: `[[${cleanName}]]`
        })
      }
      toast.success('Program roadmap deployed')
      fetchData()
    } catch (err) {
      console.error('Scaffold failed', err)
      toast.error('Failed to deploy roadmap')
    }
  }, [fetchData])

 const handleSync = useCallback(async () => {
 try {
 await sidecarApi.academicsSyncProfile()
 toast.success('Vault synced')
 fetchData()
 fetchDatabases()
 } catch {toast.error('Sync failed')}
 }, [fetchData, fetchDatabases])

 useEffect(() => {
   setRightContent(
     <div className="flex items-center gap-2 shrink-0">
       <button 
         aria-label="Sync Vault Databases" 
         onClick={handleSync} 
         data-tour="db-sync"
         className="h-8 px-3 flex items-center justify-center rounded-[8px] bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-bento-item hover:border-foreground/30 transition-all text-[9px] font-black uppercase tracking-widest" 
         title="Sync Vault Databases"
       >
         <RefreshCw size={12} />
       </button>
       <button 
         onClick={() => setActiveTab(prev => prev === 'CALENDAR' ? 'PROGRAM' : 'CALENDAR')}
         title={activeTab === 'CALENDAR' ? 'Return to Hub' : 'View Academic Calendar (Cmd+C)'}
         aria-label={activeTab === 'CALENDAR' ? 'Return to Hub' : 'View Academic Calendar'}
         data-tour="db-calendar"
         className={cn(
           'h-8 flex items-center gap-1.5 px-3 rounded-[8px] text-[9px] font-black uppercase tracking-widest focus-visible:ring-1 focus-visible:ring-primary outline-none transition-all',
           activeTab === 'CALENDAR' 
             ? 'bg-primary text-primary-foreground border border-primary' 
             : 'bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-bento-item hover:border-foreground/30'
         )}
       >
         <CalendarDays size={12} />
         <span className="inline">{activeTab === 'CALENDAR' ? 'Dashboard' : 'Calendar'}</span>
       </button>
     </div>
   )
   return () => setRightContent(null)
 }, [handleSync, activeTab, setRightContent])

 // ── Tab definitions ────────────────────────────────────────────────────────
 const augmentedDatabases = useMemo(() => {
   return databases.map(db => {
     const schema = DEFAULT_SCHEMAS[db.id.toLowerCase()] || {}
     return { ...db, schema: { ...schema, ...db.schema } }
   })
 }, [databases])

 const tabs = React.useMemo(() => [
 {id: 'PROGRAM' as AcademicTab, label: 'Program', icon: <GraduationCap size={11} />, dataTour: 'tab-academic-program'},
 {id: 'COURSES' as AcademicTab, label: 'Courses', icon: <BookOpen size={11} />, dataTour: 'tab-academic-courses'},
 {id: 'PLANNER' as AcademicTab, label: 'Planner', icon: <LayoutDashboard size={11} />, dataTour: 'tab-academic-planner'},
 {id: 'ASSIGNMENTS' as AcademicTab, label: 'Assignments', icon: <ClipboardList size={11} />, dataTour: 'tab-academic-assignments'},
 {id: 'EXAMS' as AcademicTab, label: 'Exams', icon: <FlaskConical size={11} />, dataTour: 'tab-academic-exams'},
 {id: 'PRACTICE' as AcademicTab, label: 'Practice', icon: <Layers size={11} />, dataTour: 'tab-academic-practice'},
 ], [])

 // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
  // Don't trigger if user is typing in an input/textarea
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

  // Tabs: Cmd/Ctrl + 1-6
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '6') {
   e.preventDefault()
   const index = parseInt(e.key) - 1
   if (tabs[index]) setActiveTab(tabs[index].id)
  }

  // Calendar: Cmd/Ctrl + C
  if (e.key.toLowerCase() === 'c' && (e.metaKey || e.ctrlKey)) {
   e.preventDefault()
   setActiveTab(prev => prev === 'CALENDAR' ? 'PROGRAM' : 'CALENDAR')
  }
 }
 window.addEventListener('keydown', handleKeyDown)
 return () => window.removeEventListener('keydown', handleKeyDown)
 }, [tabs])
 // ── Tab props ──────────────────────────────────────────────────────────────
 const tabProps: TabProps = {
  data: data!,
  databases: augmentedDatabases,
  onUpdate,
  onCreate,
  onDelete,
  onOpenNote: (path) => nav(`/obsidian?path=${encodeURIComponent(path)}&fullscreen=true`),
  navigateTo: (tab, id) => {
    setSearchParams(prev => {
      prev.set('tab', tab.toUpperCase())
      if (id) prev.set('id', id)
      else prev.delete('id')
      return prev
    })
   },
   onRefresh: fetchData,
   onScaffold,
  }

 // ── Loading ────────────────────────────────────────────────────────────────
 if (loading) {
  return <BlockingLoader label="Opening Academic Dashboard" />
 }

  // ── Upcoming items for the calendar ───────────────────────────────────────
  const calendarEvents = [
    ...(data?.assignments || []).map(a => ({...a, _type: 'Assignment', _date: a.due_date})),
    ...(data?.exams || []).map(e => ({...e, _type: 'Exam', _date: e.date})),
    // Local Store History (Real-time)
    ...(storeHistory || []).map(h => ({
      ...h,
      _type: 'Study',
      _date: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
      title: h.type === 'practice' 
        ? `Recall: ${h.score}/${h.totalQuestions}` 
        : h.type === 'note_focus' 
          ? `Note: ${h.notePath?.split(/[/\\]/).pop()?.replace('.md', '') || 'Focus'}`
          : `Session: ${h.hub || 'Focus'}`
    })),
    // API History (Persistent)
    ...(apiStudyHistory?.sessions || []).map(s => ({
      id: s.id,
      title: `${s.hub_id || 'Focus'} Session`,
      _type: 'Study Session',
      _date: s.timestamp || new Date().toISOString(),
      duration: s.duration_seconds
    })),
    ...(apiStudyHistory?.telemetry || []).map(t => ({
      id: t.id,
      title: `Read: ${t.note_path?.split(/[/\\]/).pop()?.replace('.md', '') || 'Note'}`,
      _type: 'Note Visit',
      _date: t.timestamp || new Date().toISOString(),
      duration: t.duration_seconds
    })),
    ...(apiStudyHistory?.practice || []).map(p => ({
      id: p.id,
      title: `Recall: ${p.note_path?.split(/[/\\]/).pop()?.replace('.md', '') || p.hub_id || 'Quiz'}`,
      _type: 'Practice',
      _date: p.timestamp,
      isCorrect: p.is_correct
    }))
  ]

 return (
  <div className="h-full flex flex-col bg-transparent font-sans overflow-hidden gap-3">
     {/* Top bar Bento Box */}
     <div className={cn("shrink-0 px-6 bg-bento-panel border border-border/40 rounded-[12px] h-12 flex items-center shadow-sm z-30", activeTab === 'CALENDAR' && "hidden")}>
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide h-full">
        {tabs.map(t => (
         <TabButton key={t.id} active={activeTab === t.id} onClick={() => setSearchParams({ tab: t.id })} icon={t.icon} label={t.label} data-tour={t.dataTour} />
        ))}
      </div>
     </div>

     {/* Tab content area */}
     <div className="flex-1 overflow-hidden">
      {data && (
       <>
        {activeTab === 'CALENDAR' && (
         <div className="h-full flex flex-col p-4 bg-bento-panel rounded-[12px] border border-border/40 shadow-sm">
          <AcademicCalendar 
           events={calendarEvents} 
           onSelectEvent={(path) => nav(`/obsidian?path=${encodeURIComponent(path)}&fullscreen=true`)} 
          />
         </div>
        )}
        
        {activeTab === 'PROGRAM' && <ProgramTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />}

        {activeTab === 'COURSES' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <CoursesTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'PLANNER' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <StudyPlannerTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'ASSIGNMENTS' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <AssignmentsTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'EXAMS' && (
          <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden">
            <ExamsTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />
          </div>
        )}

        {activeTab === 'PRACTICE' && (
         <div className="h-full overflow-hidden bg-bento-panel rounded-[12px] border border-border/40 shadow-sm">
          <PracticeModule noAnimation={true} />
         </div>
        )}
       </>
      )}
     </div>
  </div>
 )
}
