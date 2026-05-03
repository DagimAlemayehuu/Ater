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
import type {AcademicTab, AcademicData, VaultDatabase, TabProps} from './academic-tabs/types'

export default function AcademicDashboard() {
 const [data, setData] = useState<AcademicData | null>(null)
 const [loading, setLoading] = useState(true)
 const [databases, setDatabases] = useState<VaultDatabase[]>([])
 const [activeTab, setActiveTab] = useState<AcademicTab>('PROGRAM')
 const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
 const [showCalendar, setShowCalendar] = useState(false)
 const [sidebarWidth, setSidebarWidth] = useState(32)
 const [isResizing, setIsResizing] = useState(false)
 const nav = useNavigate()
 const API_BASE = 'http://127.0.0.1:8765'

 // ── Resizable sidebar ──────────────────────────────────────────────────────
 const handleMouseMove = useCallback((e: MouseEvent) => {
 if (!isResizing) return
 const pct = (e.clientX / window.innerWidth) * 100
 if (pct > 18 && pct < 60) setSidebarWidth(pct)
}, [isResizing])

 const handleMouseUp = useCallback(() => setIsResizing(false), [])

 useEffect(() => {
 window.addEventListener('mousemove', handleMouseMove)
 window.addEventListener('mouseup', handleMouseUp)
 return () => {
 window.removeEventListener('mousemove', handleMouseMove)
 window.removeEventListener('mouseup', handleMouseUp)
}
}, [handleMouseMove, handleMouseUp])

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
 const es = new EventSource(`${API_BASE}/vault/events`)
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

 // ── Tab definitions ────────────────────────────────────────────────────────
 const tabs: {id: AcademicTab; label: string; icon: React.ReactNode}[] = [
 {id: 'PROGRAM', label: 'Program', icon: <GraduationCap size={11} />},
 {id: 'COURSES', label: 'Courses', icon: <BookOpen size={11} />},
 {id: 'PLANNER', label: 'Planner', icon: <Brain size={11} />},
 {id: 'ASSIGNMENTS', label: 'Assignments', icon: <ClipboardList size={11} />},
 {id: 'EXAMS', label: 'Exams', icon: <FlaskConical size={11} />},
 {id: 'PRACTICE', label: 'Practice', icon: <Layers size={11} />},
 ]

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
 <>
 {/* ── Calendar Full Screen Overlay ── */}
 {activeTab === 'CALENDAR' && (
 <div className="fixed inset-0 z-[100] bg-background flex flex-col -95">
 <div className="shrink-0 px-6 lg:px-10 py-6 border-b border-border/10 flex items-center justify-between bg-background">
 <div>
 <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Academic Hub</p>
 <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Calendar</h1>
 </div>
 <button onClick={() => setActiveTab('PROGRAM')}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/10 border border-border/20 text-muted-foreground/50 hover:text-foreground text-[8px] font-black uppercase tracking-widest rounded-lg transition-all">
 <ChevronLeft size={10} /> Close Calendar
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-10">
 <div className="max-w-5xl mx-auto">
 <MiniCalendar events={calendarEvents} onSelectEvent={(path) => nav(`/obsidian?path=${encodeURIComponent(path)}&fullscreen=true`)} />
 </div>
 </div>
 </div>
 )}

 <div className="flex flex-1 overflow-hidden">
 {/* ── Main Content ── */}
 <main className="flex-1 flex flex-col overflow-hidden min-w-0">
 {/* Top bar */}
 <div className="shrink-0 px-6 lg:px-10 pt-5 pb-0 border-b border-border/10">
 <div className="flex items-center justify-between mb-4">
 <div>
 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">Academic Hub</p>
 <h1 className="text-[13px] font-black uppercase tracking-tight text-foreground">{tabs.find(t => t.id === activeTab)?.label}</h1>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={handleSync} className="flex items-center justify-center w-7 h-7 bg-background border border-border text-muted-foreground rounded-md hover:text-foreground hover:border-primary transition-all shadow-sm" title="Sync Vault">
 <RefreshCw size={12} />
 </button>
 <button onClick={() => setActiveTab(activeTab === 'CALENDAR' ? 'PROGRAM' : 'CALENDAR')}
 className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all',
 activeTab === 'CALENDAR' ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary shadow-sm')}>
 <CalendarDays size={11} />
 {activeTab === 'CALENDAR' ? 'Close' : 'Calendar'}
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
 </>
 </div>
 )
}

// ─── Shared Editable UI Components ───────────────────────────────────────────
// (Moved to SharedComponents.tsx)

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

 return (
 <div className="flex flex-col h-full">
 {/* Header */}
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-[11px] font-black uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy')}</h3>
 <div className="flex items-center gap-1">
 <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-muted/10 rounded transition-all text-muted-foreground/40 hover:text-foreground"><ChevronLeft size={12} /></button>
 <button onClick={() => setCurrentMonth(new Date())} className="px-2 py-0.5 text-[7px] font-black uppercase rounded border border-border/20 hover:bg-muted/10 transition-all text-muted-foreground/40">Now</button>
 <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-muted/10 rounded transition-all text-muted-foreground/40 hover:text-foreground"><ChevronRight size={12} /></button>
 </div>
 </div>

 {/* Day headers */}
 <div className="grid grid-cols-7 mb-2">
 {days.map(d => <div key={d} className="text-center text-[7px] font-black uppercase tracking-wide text-muted-foreground/30 py-1">{d}</div>)}
 </div>

 {/* Cell grid */}
 <div className="grid grid-cols-7 gap-px border border-border/10 rounded-xl overflow-hidden flex-1">
 {cells.map((cell, i) => {
 const dayEvents = events.filter(e => {
 if (!e._date) return false
 try {return isSameDay(parseISO(e._date), cell)} catch {return false}
})
 const inMonth = isSameMonth(cell, currentMonth)
 return (
 <div key={i} className={cn('min-h-[52px] p-1.5 flex flex-col gap-1 transition-all', !inMonth ? 'opacity-15 bg-muted/5' : 'bg-background', isToday(cell) && 'bg-primary/[0.03]')}>
 <span className={cn('text-[9px] font-black', isToday(cell) ? 'text-primary' : 'text-muted-foreground/50')}>{format(cell, 'd')}</span>
 {dayEvents.slice(0, 2).map((ev, idx) => (
 <button key={idx} onClick={() => onSelectEvent(ev._type === 'Assignment' ? `3-Database/03 - Assignments/${ev.id}.md` : `3-Database/04 - Exams/${ev.id}.md`)}
 className={cn('text-[6px] font-black uppercase px-1 py-0.5 rounded truncate text-left transition-all',
 ev._type === 'Exam' ? 'text-foreground border border-foreground bg-muted/5 hover:bg-muted/10' : 'bg-muted/20 text-foreground/50 hover:bg-muted/40')}>
 {ev.title}
 </button>
 ))}
 {dayEvents.length > 2 && <span className="text-[6px] text-muted-foreground/30 font-black">+{dayEvents.length - 2}</span>}
 </div>
 )
})}
 </div>

 {/* Upcoming events list */}
 <div className="mt-4 space-y-1">
 <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/30 mb-2">Upcoming</p>
 {events
 .filter(e => e._date && new Date(e._date) >= new Date())
 .sort((a, b) => new Date(a._date).getTime() - new Date(b._date).getTime())
 .slice(0, 5)
 .map((ev, idx) => (
 <button key={idx} onClick={() => onSelectEvent(ev._type === 'Assignment' ? `3-Database/03 - Assignments/${ev.id}.md` : `3-Database/04 - Exams/${ev.id}.md`)}
 className="w-full flex items-center gap-2 text-left p-1.5 rounded-lg hover:bg-muted/10 transition-all group">
 <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', ev._type === 'Exam' ? 'bg-foreground' : 'bg-muted-foreground/40')} />
 <span className="text-[8px] font-black uppercase truncate text-muted-foreground/50 group-hover:text-foreground transition-colors">{ev.title}</span>
 <span className="text-[7px] font-black text-muted-foreground/30 ml-auto shrink-0">{ev._date ? format(parseISO(ev._date), 'MMM d') : ''}</span>
 </button>
 ))}
 </div>
 </div>
 )
}
