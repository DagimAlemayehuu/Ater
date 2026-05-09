import React, {useState, useEffect, useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import {RefreshCw, CalendarDays, GraduationCap, BookOpen, ClipboardList, FlaskConical, Brain, Layers, ChevronLeft, ChevronRight} from 'lucide-react'
import {format, subMonths, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday, parseISO} from 'date-fns'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {sidecarApi} from '@/lib/sidecarApi'
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
 const [activeTab, setActiveTab] = useState<AcademicTab>('PROGRAM')
 const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
 const [showCalendar, setShowCalendar] = useState(false)
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
}, [])

 // ── Shared handlers ────────────────────────────────────────────────────────
 const onUpdate = useCallback(async (dbId: string, itemId: string, properties: Record<string, any>) => {
 console.log(`[Academic] Updating ${dbId}/${itemId}:`, properties)
 // Optimistic update
 setData(prev => {
 if (!prev) return prev
 const next = {...prev}
 const dbMap: Record<string, keyof AcademicData> = {
 '09 - Years': 'years',
 '08 - Semesters': 'semesters',
 '07 - Courses': 'courses',
 '06 - Study Planner': 'study_sessions',
 '04 - Exams': 'exams',
 '03 - Assignments': 'assignments'
}
 const key = dbMap[dbId]
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
 const dbMap: Record<string, keyof AcademicData> = {
 '09 - Years': 'years',
 '08 - Semesters': 'semesters',
 '07 - Courses': 'courses',
 '06 - Study Planner': 'study_sessions',
 '04 - Exams': 'exams',
 '03 - Assignments': 'assignments'
}
 const key = dbMap[dbId]
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

 const handleSync = async () => {
 try {
 await sidecarApi.academicsSyncProfile()
 toast.success('Vault synced')
 fetchData()
 fetchDatabases()
 } catch {toast.error('Sync failed')}
 }

 // ── Tab definitions ────────────────────────────────────────────────────────
 const tabs: {id: AcademicTab; label: string; icon: React.ReactNode}[] = [
 {id: 'PROGRAM', label: 'Program', icon: <GraduationCap size={11} />},
 {id: 'COURSES', label: 'Courses', icon: <BookOpen size={11} />},
 {id: 'PLANNER', label: 'Planner', icon: <Brain size={11} />},
 {id: 'ASSIGNMENTS', label: 'Assignments', icon: <ClipboardList size={11} />},
 {id: 'EXAMS', label: 'Exams', icon: <FlaskConical size={11} />},
 {id: 'PRACTICE', label: 'Practice', icon: <Layers size={11} />},
 ]

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
   setActiveTab(tab)
   if (id) setSelectedItemId(id)
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
  <div className="shrink-0 px-4 sm:px-6 lg:px-10 pt-5 pb-0 border-b border-border/10 bg-background/95 backdrop-blur-xl sticky top-0 z-30">
  <div className="flex items-center justify-between mb-4">
  <div className="min-w-0">
  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 truncate">Academic Hub</p>
  <h1 className="text-[13px] font-black uppercase tracking-tight text-foreground truncate">
   {activeTab === 'CALENDAR' ? 'Calendar' : tabs.find(t => t.id === activeTab)?.label}
  </h1>
  </div>
 <div className="flex items-center gap-2 shrink-0">
 <button aria-label="Sync Vault Databases" onClick={handleSync} className="flex items-center justify-center w-7 h-7 bg-background border border-border text-muted-foreground rounded-md hover:text-foreground hover:border-primary transition-all shadow-sm focus-visible:ring-1 focus-visible:ring-primary outline-none" title="Sync Vault Databases">
 <RefreshCw size={12} />
 </button>
 <button onClick={() => setActiveTab(activeTab === 'CALENDAR' ? 'PROGRAM' : 'CALENDAR')}
 title={activeTab === 'CALENDAR' ? 'Return to Hub' : 'View Academic Calendar (Cmd+C)'}
 aria-label={activeTab === 'CALENDAR' ? 'Return to Hub' : 'View Academic Calendar'}
 className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all focus-visible:ring-1 focus-visible:ring-primary outline-none',
 activeTab === 'CALENDAR' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary shadow-sm')}>
 <CalendarDays size={11} />
 <span className="hidden sm:inline">{activeTab === 'CALENDAR' ? 'Close' : 'Calendar'}</span>
 </button>
 </div>
 </div>

 {/* Tab bar — flush to bottom edge of header */}
 <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
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
  <div className="h-full overflow-y-auto p-10 bg-background/50 animate-in fade-in slide-in-from-bottom-4 duration-500 custom-scrollbar">
   <div className="max-w-5xl mx-auto bg-muted/10 p-8 rounded-2xl border border-border/40 shadow-sm">
    <MiniCalendar events={calendarEvents} onSelectEvent={(path) => nav(`/obsidian?path=${encodeURIComponent(path)}&fullscreen=true`)} />
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

// ─── Mini Calendar (for sidebar) ──────────────────────────────────────────────
function MiniCalendar({events, onSelectEvent}: {events: any[]; onSelectEvent: (path: string) => void}) {
 const [currentMonth, setCurrentMonth] = useState(new Date())

 const monthStart = startOfMonth(currentMonth)
 const monthEnd = endOfMonth(monthStart)
 const startDate = startOfWeek(monthStart)
 const endDate = endOfWeek(monthEnd)

 const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

 const cells: Date[] = []
 let d = startDate
 while (d <= endDate) {cells.push(d); d = addDays(d, 1)}

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
 <div className="flex flex-col h-full">
 {/* Header */}
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-[11px] font-black uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy')}</h3>
 <div className="flex items-center gap-1">
 <button aria-label="Previous month" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-muted/10 rounded transition-all text-muted-foreground/40 hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"><ChevronLeft size={12} /></button>
 <button onClick={() => setCurrentMonth(new Date())} className="px-2 py-0.5 text-[8px] font-black uppercase rounded border border-border/20 hover:bg-muted/20 transition-all text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary outline-none">Now</button>
 <button aria-label="Next month" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-muted/10 rounded transition-all text-muted-foreground/40 hover:text-foreground focus-visible:ring-1 focus-visible:ring-primary outline-none"><ChevronRight size={12} /></button>
 </div>
 </div>

 {/* Day headers */}
 <div className="grid grid-cols-7 mb-2">
 {days.map(d => <div key={d} className="text-center text-[8px] font-black uppercase tracking-wider text-muted-foreground/40 py-1">{d}</div>)}
 </div>

 {/* Cell grid */}
 <div className="grid grid-cols-7 gap-px border border-border/10 rounded-xl overflow-hidden flex-1 bg-border/5">
 {cells.map((cell, i) => {
 const cellDateStr = format(cell, 'yyyy-MM-dd')
 const dayEvents = eventsByDate.get(cellDateStr) || []
 const inMonth = isSameMonth(cell, currentMonth)
 return (
 <div key={i} className={cn('min-h-[64px] p-2 flex flex-col gap-1 transition-all', !inMonth ? 'opacity-20 bg-muted/5' : 'bg-background', isToday(cell) && 'bg-primary/[0.03]')}>
 <span className={cn('text-[10px] font-black', isToday(cell) ? 'text-primary' : 'text-muted-foreground/50')}>{format(cell, 'd')}</span>
 {dayEvents.slice(0, 2).map((ev, idx) => (
 <button key={idx} onClick={() => onSelectEvent(ev._type === 'Assignment' ? `3-Database/03 - Assignments/${ev.id}.md` : `3-Database/04 - Exams/${ev.id}.md`)}
 className={cn('text-[8px] font-black uppercase px-1.5 py-1 rounded-md truncate text-left transition-all focus-visible:ring-1 focus-visible:ring-primary outline-none',
 ev._type === 'Exam' ? 'text-foreground border border-border bg-muted/20 hover:bg-muted/40' : 'bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/20')}>
 {cleanTitle(ev.title)}
 </button>
 ))}
 {dayEvents.length > 2 && <span className="text-[8px] text-muted-foreground/30 font-black pl-1">+{dayEvents.length - 2} more</span>}
 </div>
 )
})}
 </div>

 {/* Upcoming events list */}
 <div className="mt-8 space-y-2">
 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-4">Upcoming Schedule</p>
 {events
 .filter(e => e._date && new Date(e._date) >= new Date())
 .sort((a, b) => new Date(a._date).getTime() - new Date(b._date).getTime())
 .slice(0, 5)
 .map((ev, idx) => (
 <button key={idx} onClick={() => onSelectEvent(ev._type === 'Assignment' ? `3-Database/03 - Assignments/${ev.id}.md` : `3-Database/04 - Exams/${ev.id}.md`)}
 className="w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-muted/20 transition-all group border border-transparent hover:border-border/10 focus-visible:ring-1 focus-visible:ring-primary outline-none">
 <div className={cn('w-2 h-2 rounded-full shrink-0', ev._type === 'Exam' ? 'bg-primary' : 'bg-muted-foreground/20')} />
 <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/70 group-hover:text-foreground transition-colors">{cleanTitle(ev.title)}</span>
 <span className="text-[9px] font-black text-muted-foreground/30 ml-auto shrink-0 uppercase tracking-widest">{ev._date ? format(parseISO(ev._date), 'MMM d') : ''}</span>
 </button>
 ))}
 </div>
 </div>
 )
}
