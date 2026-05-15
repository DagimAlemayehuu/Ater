import React, {useState, useEffect, useCallback} from 'react'
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
import {cleanTitle} from './academic-tabs/utils'
import type {AcademicTab, AcademicData, VaultDatabase, TabProps} from './academic-tabs/types'
import { usePomodoroStore } from '@/lib/pomodoroStore'

export default function AcademicDashboard() {
  const { history: storeHistory } = usePomodoroStore()
  const [data, setData] = useState<AcademicData | null>(null)
  const [apiStudyHistory, setApiStudyHistory] = useState<{sessions: any[], telemetry: any[], practice?: any[]}>({sessions: [], telemetry: [], practice: []})
  const [loading, setLoading] = useState(true)
 const [databases, setDatabases] = useState<VaultDatabase[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') || 'PROGRAM') as AcademicTab
  const setActiveTab = (tab: AcademicTab | ((prev: AcademicTab) => AcademicTab)) => {
    if (typeof tab === 'function') {
      const current = (searchParams.get('tab') || 'PROGRAM') as AcademicTab
      setSearchParams({ tab: tab(current) })
    } else {
      setSearchParams({ tab })
    }
  }
  const selectedItemId = searchParams.get('id')
  const setSelectedItemId = (id: string | null) => setSearchParams(prev => {
    if (id) prev.set('id', id)
    else prev.delete('id')
    return prev
  })
  const {setRightContent} = useHeader()
 const {setIsFullscreen} = useLayout()
 const nav = useNavigate()
 const API_BASE = 'http://127.0.0.1:8765'

 // ── Data fetching ──────────────────────────────────────────────────────────
 const fetchData = useCallback(async () => {
 try {
  const [dashRes, studyRes] = await Promise.all([
    sidecarApi.academicsDashboard(),
    sidecarApi.getStudyHistory()
  ])
  setData(dashRes as any)
  setApiStudyHistory(studyRes || { sessions: [], telemetry: [], practice: [] })
 } catch {toast.error('Could not connect to vault')}
  finally {setLoading(false)}
}, [])

 const fetchDatabases = useCallback(async () => {
 try {
 const res = await sidecarApi.listVaultDatabases()
 setDatabases(res.databases || [])
} catch {}
}, [])

  useEffect(() => {
    fetchData()
    fetchDatabases()
    
    let es: EventSource | null = null;

    // SSE for real-time vault changes
    const setupSSE = async () => {
      try {
        const config = await sidecarApi.getConfig()
        const vaultPath = config.obsidianVaultPath
        if (!vaultPath) return

        es = new EventSource(`${API_BASE}/api/vault/events?vault_path=${encodeURIComponent(vaultPath)}`)
        
        es.onerror = () => {
          if (es) {
            es.close()
            es = null
          }
        }

        es.onmessage = (ev) => {
          try {
            const d = JSON.parse(ev.data)
            if (['vault_change', 'file_create', 'file_delete'].includes(d.type)) fetchData()
          } catch {}
        }
      } catch (err) {
        console.error('[Academic] SSE Setup failed:', err)
      }
    }

    setupSSE()
    
    return () => {
      if (es) es.close()
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
 if (dbId.includes('Years')) key = 'years';
 else if (dbId.includes('Semesters')) key = 'semesters';
 else if (dbId.includes('Courses')) key = 'courses';
 else if (dbId.includes('Study Planner')) key = 'study_sessions';
 else if (dbId.includes('Exams')) key = 'exams';
 else if (dbId.includes('Assignments')) key = 'assignments';
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
 // Optimistic update for creation
 setData(prev => {
 if (!prev) return prev
 const next = {...prev}
 let key: keyof AcademicData | undefined;
 if (dbId.includes('Years')) key = 'years';
 else if (dbId.includes('Semesters')) key = 'semesters';
 else if (dbId.includes('Courses')) key = 'courses';
 else if (dbId.includes('Study Planner')) key = 'study_sessions';
 else if (dbId.includes('Exams')) key = 'exams';
 else if (dbId.includes('Assignments')) key = 'assignments';
 if (key && Array.isArray(next[key])) {
 const newItem = {id: title, title, ...props}
 next[key] = [...(next[key] as any[]), newItem]
}
 return next
})

 try {
 const res = await sidecarApi.createVaultRow(dbId, title, props || {})
 fetchData()
 return res.id || null
} catch {
 toast.error('Creation failed')
 fetchData()
 return null
}
}, [fetchData])

 const onDelete = useCallback(async (dbId: string, itemId: string) => {
 if (!window.confirm('Delete this item? This cannot be undone.')) return
 try {
 await sidecarApi.deleteVaultRow(dbId, itemId)
 fetchData()
} catch {toast.error('Delete failed')}
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
       <button aria-label="Sync Vault Databases" onClick={handleSync} className="h-8 px-3 flex items-center justify-center rounded-none bg-background border border-border text-foreground/50 hover:text-foreground hover:bg-foreground/5 hover:border-foreground/40 transition-none   text-[10px] font-black uppercase tracking-widest" title="Sync Vault Databases">
         <RefreshCw size={12} />
       </button>
       <button onClick={() => setActiveTab(prev => prev === 'CALENDAR' ? 'PROGRAM' : 'CALENDAR')}
         title={activeTab === 'CALENDAR' ? 'Return to Hub' : 'View Academic Calendar (Cmd+C)'}
         aria-label={activeTab === 'CALENDAR' ? 'Return to Hub' : 'View Academic Calendar'}
         className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[8px] font-black uppercase tracking-widest  focus-visible:ring-1 focus-visible:ring-primary outline-none',
         activeTab === 'CALENDAR' ? 'bg-foreground/10 text-foreground border border-border/50' : 'bg-background border border-border text-foreground/50 hover:text-foreground hover:border-primary shadow-sm')}>
         <CalendarDays size={11} />
         <span className="inline">{activeTab === 'CALENDAR' ? 'Dashboard' : 'Calendar'}</span>
       </button>
     </div>
   )
   return () => setRightContent(null)
 }, [handleSync, activeTab, setRightContent])

 // ── Tab definitions ────────────────────────────────────────────────────────
 const tabs = React.useMemo(() => [
 {id: 'PROGRAM' as AcademicTab, label: 'Program', icon: <GraduationCap size={11} />},
 {id: 'COURSES' as AcademicTab, label: 'Courses', icon: <BookOpen size={11} />},
 {id: 'PLANNER' as AcademicTab, label: 'Planner', icon: <LayoutDashboard size={11} />},
 {id: 'ASSIGNMENTS' as AcademicTab, label: 'Assignments', icon: <ClipboardList size={11} />},
 {id: 'EXAMS' as AcademicTab, label: 'Exams', icon: <FlaskConical size={11} />},
 {id: 'PRACTICE' as AcademicTab, label: 'Practice', icon: <Layers size={11} />},
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
  databases,
  onUpdate,
  onCreate,
  onDelete,
  onOpenNote: (path) => nav(`/obsidian?path=${encodeURIComponent(path)}&fullscreen=true`),
  navigateTo: (tab, id) => {
    setSearchParams(prev => {
      prev.set('tab', tab)
      if (id) prev.set('id', id)
      else prev.delete('id')
      return prev
    })
   },
  onRefresh: fetchData,
 }

 // ── Loading ────────────────────────────────────────────────────────────────
 if (loading) {
  return (
   <div className="h-full flex items-center justify-center bg-background">
    <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-none" />
   </div>
  )
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
          ? `Note: ${h.notePath?.split('/').pop()?.replace('.md', '') || 'Focus'}`
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
      title: `Read: ${t.note_path?.split('/').pop()?.replace('.md', '') || 'Note'}`,
      _type: 'Note Visit',
      _date: t.timestamp || new Date().toISOString(),
      duration: t.duration_seconds
    })),
    ...(apiStudyHistory?.practice || []).map(p => ({
      id: p.id,
      title: `Recall: ${p.note_path?.split('/').pop()?.replace('.md', '') || p.hub_id || 'Quiz'}`,
      _type: 'Practice',
      _date: p.timestamp,
      isCorrect: p.is_correct
    }))
  ]

 return (
  <div className="h-full flex flex-col bg-background font-sans overflow-hidden">
   <div className="flex flex-1 overflow-hidden">
    {/* ── Main Content ── */}
    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
     {/* Top bar */}
     <div className={cn("shrink-0 px-10 pt-3 pb-0 border-b border-border bg-background sticky top-0 z-30 ", activeTab === 'CALENDAR' && "hidden")}>
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide mb-2">
       {tabs.map(t => (
        <TabButton key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} icon={t.icon} label={t.label} />
       ))}
      </div>
     </div>

     {/* Tab content */}
     <div className="flex-1 overflow-hidden">
      {data && (
       <>
        {activeTab === 'CALENDAR' && (
         <div className="h-full flex flex-col p-4 bg-background">
          <AcademicCalendar 
           events={calendarEvents} 
           onSelectEvent={(path) => nav(`/obsidian?path=${encodeURIComponent(path)}&fullscreen=true`)} 
          />
         </div>
        )}
        {activeTab === 'PROGRAM' && <ProgramTab {...tabProps} />}
        {activeTab === 'COURSES' && <CoursesTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />}
        {activeTab === 'PLANNER' && <StudyPlannerTab {...tabProps} />}
        {activeTab === 'ASSIGNMENTS' && <AssignmentsTab {...tabProps} />}
        {activeTab === 'EXAMS' && <ExamsTab {...tabProps} initialSelectedId={selectedItemId} onClearSelection={() => setSelectedItemId(null)} />}
        {activeTab === 'PRACTICE' && (
         <div className="h-full overflow-hidden bg-background">
          <PracticeModule noAnimation={true} />
         </div>
        )}
       </>
      )}
     </div>
    </main>
   </div>
  </div>
 )
}
