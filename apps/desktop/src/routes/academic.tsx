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
import ProgramTab from './academic-tabs/ProgramTab'
import CoursesTab from './academic-tabs/CoursesTab'
import StudyPlannerTab from './academic-tabs/StudyPlannerTab'
import AssignmentsTab from './academic-tabs/AssignmentsTab'
import ExamsTab from './academic-tabs/ExamsTab'
import {cleanTitle} from './academic-tabs/utils'
import type {AcademicTab, AcademicData, VaultDatabase, TabProps} from './academic-tabs/types'

export default function AcademicDashboard() {
 const [data, setData] = useState<AcademicData | null>(null)
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
 const res = await sidecarApi.academicsDashboard()
 setData(res as any)
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
 // SSE for real-time vault changes
 const es = new EventSource(`${API_BASE}/api/vault/events`)
 es.onerror = () => es.close() // don't crash if not available
 es.onmessage = (ev) => {
 try {
 const d = JSON.parse(ev.data)
 if (['vault_change', 'file_create', 'file_delete'].includes(d.type)) fetchData()
} catch {}
}
 return () => es.close()
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

 const handleUpdateProgram = async (oldName: string, newName: string, level: string, yearsCount: number) => {
 try {
 console.log('Renaming program globally:', oldName, '->', newName)
 const yearsToUpdate = (data?.years || []).filter(y => {
 const p = (y.Program || y.program || '').replace(/[[\]]/g, '')
 return p.toLowerCase() === oldName.toLowerCase()
})
 await Promise.all(yearsToUpdate.map(y => 
 onUpdate('09 - Years', y.id, {Program: `[[${newName}]]`})
 ))
 toast.success('Program renamed across all years')
} catch (err) {
 console.error('Program rename failed:', err)
 toast.error('Rename failed') 
}
}

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
       <button aria-label="Sync Vault Databases" onClick={handleSync} className="flex items-center justify-center w-7 h-7 bg-background border border-border text-muted-foreground rounded-md hover:text-foreground hover:border-primary  shadow-sm focus-visible:ring-1 focus-visible:ring-primary outline-none" title="Sync Vault Databases">
         <RefreshCw size={12} />
       </button>
       <button onClick={() => setActiveTab(prev => prev === 'CALENDAR' ? 'PROGRAM' : 'CALENDAR')}
         title={activeTab === 'CALENDAR' ? 'Return to Hub' : 'View Academic Calendar (Cmd+C)'}
         aria-label={activeTab === 'CALENDAR' ? 'Return to Hub' : 'View Academic Calendar'}
         className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest  focus-visible:ring-1 focus-visible:ring-primary outline-none',
         activeTab === 'CALENDAR' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary shadow-sm')}>
         <CalendarDays size={11} />
         <span className="hidden sm:inline">{activeTab === 'CALENDAR' ? 'Close' : 'Calendar'}</span>
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
    <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
   </div>
  )
 }

 // ── Upcoming items for the calendar ───────────────────────────────────────
 const calendarEvents = [
  ...(data?.assignments || []).map(a => ({...a, _type: 'Assignment', _date: a.due_date})),
  ...(data?.exams || []).map(e => ({...e, _type: 'Exam', _date: e.date})),
 ]

 return (
  <div className="h-full flex flex-col bg-background font-sans overflow-hidden">
   <div className="flex flex-1 overflow-hidden">
    {/* ── Main Content ── */}
    <main className="flex-1 flex flex-col overflow-hidden min-w-0">
     {/* Top bar */}
     <div className={cn("shrink-0 px-4 sm:px-6 lg:px-10 pt-3 pb-0 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-30 ", activeTab === 'CALENDAR' && "hidden")}>
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
         <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-10 bg-background custom-scrollbar">
          <div className="w-full max-w-6xl mx-auto">
           <MiniCalendar 
            events={calendarEvents} 
            onSelectEvent={(path) => nav(`/obsidian?path=${encodeURIComponent(path)}&fullscreen=true`)} 
           />
          </div>
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

// ─── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({events, onSelectEvent}: {events: any[]; onSelectEvent: (path: string) => void}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const cells: Date[] = []
  let d = startDate
  while (d <= endDate) { cells.push(d); d = addDays(d, 1) }

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, any[]>()
    events.forEach(e => {
      if (!e._date) return
      try {
        const dateStr = format(parseISO(e._date), 'yyyy-MM-dd')
        if (!map.has(dateStr)) map.set(dateStr, [])
        map.get(dateStr)!.push(e)
      } catch {}
    })
    return map
  }, [events])

  return (
    <div className="flex flex-col h-full bg-background font-sans">
      {/* Premium Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h3 className="text-xl font-black tracking-tighter uppercase leading-none">{format(currentMonth, 'MMMM')}</h3>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">{format(currentMonth, 'yyyy')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/40 hover:border-foreground/40 text-muted-foreground/60 hover:text-foreground transition-all outline-none"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())} 
            className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border border-border/40 hover:border-foreground/40 text-muted-foreground/60 hover:text-foreground transition-all outline-none"
          >
            Today
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border/40 hover:border-foreground/40 text-muted-foreground/60 hover:text-foreground transition-all outline-none"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="grid grid-cols-7 mb-4">
          {days.map(d => (
            <div key={d} className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px border border-border/40 rounded-2xl overflow-hidden bg-border/20 shadow-[0_0_50px_rgba(0,0,0,0.1)]">
          {cells.map((cell, i) => {
            const cellDateStr = format(cell, 'yyyy-MM-dd')
            const dayEvents = eventsByDate.get(cellDateStr) || []
            const inMonth = isSameMonth(cell, currentMonth)
            const today = isToday(cell)
            
            return (
              <div 
                key={i} 
                className={cn(
                  'min-h-[100px] p-2 flex flex-col gap-1 transition-colors relative group',
                  !inMonth ? 'bg-muted/[0.02] opacity-40' : 'bg-background',
                  today && 'z-10 ring-1 ring-inset ring-primary/40'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-[11px] font-black tracking-tight px-1.5 py-0.5 rounded-md',
                    today ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/20'
                  )}>
                    {format(cell, 'd')}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar-mini">
                  {dayEvents.map((ev, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => onSelectEvent(ev._type === 'Assignment' ? `Database/03 - Assignments/${ev.id}.md` : `Database/04 - Exams/${ev.id}.md`)}
                      className={cn(
                        'text-[8px] font-black uppercase px-2 py-1.5 rounded-lg border transition-all text-left truncate flex items-center gap-1.5 group/event',
                        ev._type === 'Exam' 
                          ? 'border-primary/20 bg-primary/[0.03] text-primary hover:bg-primary/[0.08]' 
                          : 'border-border/40 bg-muted/5 text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                      )}
                    >
                      <div className={cn("w-1 h-2 rounded-full shrink-0", ev._type === 'Exam' ? 'bg-primary' : 'bg-muted-foreground/30')} />
                      {cleanTitle(ev.title)}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Integration */}
      <div className="mt-12 border-t border-border/20 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Upcoming Pipeline</h4>
          <Activity size={12} className="text-muted-foreground/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events
            .filter(e => e._date && new Date(e._date) >= startOfDay(new Date()))
            .sort((a, b) => new Date(a._date).getTime() - new Date(b._date).getTime())
            .slice(0, 3)
            .map((ev, idx) => (
              <button 
                key={idx} 
                onClick={() => onSelectEvent(ev._type === 'Assignment' ? `Database/03 - Assignments/${ev.id}.md` : `Database/04 - Exams/${ev.id}.md`)}
                className="flex flex-col gap-3 p-4 rounded-2xl border border-border/40 bg-muted/[0.02] hover:bg-muted/[0.05] hover:border-foreground/20 transition-all group text-left"
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                    ev._type === 'Exam' ? "border-primary/30 text-primary bg-primary/5" : "border-border/60 text-muted-foreground bg-muted/5"
                  )}>
                    {ev._type}
                  </span>
                  <span className="text-[10px] font-black text-muted-foreground/20 uppercase">{format(parseISO(ev._date), 'MMM dd')}</span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-tight text-foreground/80 group-hover:text-foreground transition-colors line-clamp-2 leading-tight">
                  {cleanTitle(ev.title)}
                </p>
                <div className="mt-auto pt-2 flex items-center gap-2">
                  <div className="h-0.5 flex-1 bg-border/20 rounded-full overflow-hidden">
                    <div className={cn("h-full", ev._type === 'Exam' ? 'bg-primary' : 'bg-muted-foreground/40')} style={{width: '40%'}} />
                  </div>
                  <span className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-widest">Priority</span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
   )
 }
