import React, {useState, useMemo} from 'react'
import {Search, SortAsc, BookOpen, PlayCircle, Target, Check, Plus, Trash2} from 'lucide-react'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {stripWL, getVal, statusColorClass, confidenceColorClass, groupBy, wrapWL, cleanTitle} from './utils'
import {SectionHeader, EmptyState, ProgressRing, EditableTitle} from './SharedComponents'
import type {TabProps} from './types'

type SortKey = 'unit' | 'status' | 'confidence' | 'study_date'
type StatusFilter = 'All' | 'Not Started' | 'In Progress' | 'Reviewing' | 'Completed'

export default function StudyPlannerTab({data, onUpdate, onCreate, onDelete, onOpenNote, navigateTo}: TabProps) {
 const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
 const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
 const [sortKey, setSortKey] = useState<SortKey>('unit')
 const [search, setSearch] = useState('')
 const [courseFilter, setCourseFilter] = useState<'Active' | 'All'>('Active')

 const allCourses = data.courses || []
 const allHubs = data.study_sessions || []

 const activeSemesters = (data.semesters || []).filter(s => String(stripWL(getVal(s, 'Status', 'status'))).toLowerCase() === 'active').map(s => String(s.title || '').toLowerCase())

 const courses = useMemo(() => {
  if (courseFilter === 'All') return allCourses
  return allCourses.filter(c => {
   const isCompleted = String(stripWL(getVal(c, 'Status', 'status'))).toLowerCase().includes('complet')
   const courseSem = String(stripWL(getVal(c, 'Semester', 'semester'))).toLowerCase()
   const inActiveSemester = activeSemesters.length === 0 || activeSemesters.some(s => courseSem.includes(s))
   return !isCompleted && inActiveSemester
  })
 }, [allCourses, courseFilter, activeSemesters])

 // ── Stats per course ──────────────────────────────────────────────────────
 const courseStats = useMemo(() => {
 return courses.reduce((acc, c) => {
 const hubs = allHubs.filter(h => {
 const hubCourse = String(getVal(h, 'course', 'Course')).toLowerCase()
 const targetCourse = String(c.title || '').toLowerCase()
 return hubCourse === targetCourse && hubCourse !== ''
})
 const done = hubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length
 acc[c.id] = {total: hubs.length, done}
 return acc
}, {} as Record<string, {total: number; done: number}>)
}, [courses, allHubs])

 const totalDone = allHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length

 // ── Filtered + sorted hubs ────────────────────────────────────────────────
 const visibleHubs = useMemo(() => {
 const selectedCourse = courses.find(c => c.id === selectedCourseId)
 let hubs = allHubs

 // Course filter
 if (selectedCourseId && selectedCourse) {
 hubs = hubs.filter(h => {
 const hubCourse = String(getVal(h, 'course', 'Course')).toLowerCase()
 const targetCourse = String(selectedCourse.title || '').toLowerCase()
 return hubCourse === targetCourse && hubCourse !== ''
})
}

 // Status filter
 if (statusFilter !== 'All') {
 hubs = hubs.filter(h => {
  const s = stripWL(getVal(h, 'status', 'Status')).toLowerCase()
  if (statusFilter === 'Not Started') return !s || s.includes('not') || s === ''
  if (statusFilter === 'In Progress') return s.includes('progress')
  if (statusFilter === 'Reviewing') return s.includes('review')
  if (statusFilter === 'Completed') return s.includes('complet')
 return true
})
}

 // Search
 if (search.trim()) {
 hubs = hubs.filter(h =>
 String(h.title || h.id || '').toLowerCase().includes(search.toLowerCase())
 )
}

 // Sort
 return [...hubs].sort((a, b) => {
 if (sortKey === 'unit') return (parseInt(getVal(a, 'unit', 'Unit')) || 99) - (parseInt(getVal(b, 'unit', 'Unit')) || 99)
 if (sortKey === 'status') return getVal(a, 'status', 'Status').localeCompare(getVal(b, 'status', 'Status'))
 if (sortKey === 'confidence') return getVal(b, 'confidence', 'Confidence').localeCompare(getVal(a, 'confidence', 'Confidence'))
 if (sortKey === 'study_date') {
 const da = getVal(a, 'study date', 'study_date') || '9999'
 const db = getVal(b, 'study date', 'study_date') || '9999'
 return da.localeCompare(db)
}
 return 0
})
}, [allHubs, courses, selectedCourseId, statusFilter, sortKey, search])

 // ── Grouping ──────────────────────────────────────────────────────────────
 // When a course is selected: group by unit
 // When "All" is selected: group by course
 const sections: {title: string; hubs: any[]}[] = useMemo(() => {
 if (selectedCourseId) {
 const grouped = groupBy(visibleHubs, h => {
 const u = getVal(h, 'unit', 'Unit')
 return u ? `Unit ${u}` : 'General'
})
 const keys = Object.keys(grouped).sort((a, b) => {
 const na = parseInt(a.replace('Unit ', '')) || 99
 const nb = parseInt(b.replace('Unit ', '')) || 99
 return na - nb
})
 return keys.map(k => ({title: k, hubs: grouped[k]}))
} else {
 // Group by course
 const withCourse = courses.map(course => {
 const hubs = visibleHubs.filter(h => {
 const hubCourse = getVal(h, 'course', 'Course').toLowerCase()
 const targetCourse = (course.title || '').toLowerCase()
 return hubCourse === targetCourse && hubCourse !== ''
})
 return {title: course.title, hubs}
}).filter(s => s.hubs.length > 0)

 // Hubs with no linked course
 const linked = new Set(withCourse.flatMap(s => s.hubs.map((h: any) => h.id)))
 const unclaimed = visibleHubs.filter(h => !linked.has(h.id))
 if (unclaimed.length > 0) withCourse.push({title: 'Uncategorized', hubs: unclaimed})

 return withCourse
}
}, [visibleHubs, selectedCourseId, courses])

 const handleSetStatus = async (hub: any, status: string) => {
 try {
 await onUpdate('study planer', hub.id, {status: wrapWL(status)})
} catch {toast.error('Update failed')}
}

 const handleSetStudyDate = async (hub: any, date: string) => {
 try {
 await onUpdate('study planer', hub.id, {'study date': date})
 toast.success('Study date set')
} catch {toast.error('Update failed')}
}

 const selectedCourse = courses.find(c => c.id === selectedCourseId)

 return (
 <div className="h-full flex overflow-hidden">
 {/* ── Left Course Sidebar ── */}
 <aside className="w-56 shrink-0 border-r border-border flex flex-col overflow-hidden">
  <div className="p-4 border-b border-border flex flex-col gap-3">
   <div className="flex items-center justify-between">
    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/50 flex items-center gap-1.5"><Target size={10} />Courses</p>
   </div>
   <div className="flex bg-muted/5 p-1 rounded-none border border-border w-full">
    <button onClick={() => setCourseFilter('Active')} className={cn("flex-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-none ", courseFilter === 'Active' ? "bg-muted/20 text-foreground border border-border" : "text-foreground/50  hover:bg-muted/5")}>Active</button>
    <button onClick={() => setCourseFilter('All')} className={cn("flex-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-none ", courseFilter === 'All' ? "bg-muted/20 text-foreground border border-border" : "text-foreground/50  hover:bg-muted/5")}>All</button>
   </div>
  </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 {/* All Hubs option */}
 <button
 onClick={() => setSelectedCourseId(null)}
 className={cn(
 'w-full flex items-center justify-between px-4 py-3 text-left border-b border-border ',
 !selectedCourseId ? 'bg-foreground/5 text-foreground' : 'text-foreground/50'
 )}>
 <div className="min-w-0">
 <p className="text-[11px] font-black uppercase">All Hubs</p>
 <p className="text-[8px] font-black text-foreground/40">{totalDone}/{allHubs.length} done</p>
 </div>
 <ProgressRing done={totalDone} total={allHubs.length} size={28} />
 </button>

 {courses.map((course, idx) => {
 const stats = courseStats[course.id] || {total: 0, done: 0}
 return (
 <button key={idx} onClick={() => setSelectedCourseId(course.id)}
 className={cn(
 'w-full flex items-center justify-between px-4 py-3 text-left border-b border-border ',
 selectedCourseId === course.id ? 'bg-foreground/5 text-foreground' : 'text-foreground/50'
 )}>
 <div className="min-w-0 pr-2">
 <p className="text-[10px] font-black uppercase truncate">{cleanTitle(course.title)}</p>
 <p className="text-[8px] font-black text-foreground/40">{stats.done}/{stats.total} done</p>
 </div>
 <ProgressRing done={stats.done} total={stats.total} size={28} />
 </button>
 )
})}
 </div>
 <div className="p-3 border-t border-border">
 <button
 onClick={() => {
 const title = window.prompt('Enter Hub Title', 'New Hub') || 'New Hub'
 const cleanHubTitle = cleanTitle(title)
 onCreate('study planer', cleanHubTitle, selectedCourseId && selectedCourse ? {course: wrapWL(selectedCourse.title)} : {})
}}
 className="w-full py-2 bg-foreground/5 text-[8px] font-black uppercase tracking-widest rounded-none ">
 + Add Hub
 </button>
 </div>
 </aside>

 {/* ── Main Content ── */}
 <div className="flex-1 flex flex-col overflow-hidden">
 {/* Controls bar */}
 <div className="px-6 py-3 border-b border-border flex items-center gap-3 flex-wrap shrink-0">
 <div className="flex items-center gap-2 flex-1 min-w-[140px]">
 <Search size={12} className="text-foreground/40 shrink-0" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hubs..."
 className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none placeholder:text-foreground/30" />
 </div>
 <div className="flex items-center gap-1 bg-muted/5 p-0.5 rounded-none flex-wrap">
 {(['All', 'Not Started', 'In Progress', 'Reviewing', 'Completed'] as StatusFilter[]).map(s => (
 <button key={s} onClick={() => setStatusFilter(s)}
 className={cn('px-2 py-1 text-[7px] font-black uppercase tracking-wide  whitespace-nowrap',
 statusFilter === s ? 'bg-background text-foreground shadow-sm' : 'text-foreground/40'
 )}>{s}</button>
 ))}
 </div>
 <div className="flex items-center gap-1.5">
 <SortAsc size={11} className="text-foreground/50" />
 <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
 className="bg-transparent text-[9px] font-black uppercase text-foreground/60 focus:outline-none cursor-pointer">
 <option value="unit">Unit</option>
 <option value="status">Status</option>
 <option value="confidence">Confidence</option>
 <option value="study_date">Study Date</option>
 </select>
 </div>
 </div>

 {/* Stats strip for selected course */}
 {selectedCourse && (
 <div className="px-6 py-2.5 border-b border-border flex items-center gap-5 shrink-0 bg-muted/[0.03]">
 <span className="text-[12px] font-black uppercase">{cleanTitle(selectedCourse.title)}</span>
 <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-widest text-foreground/50">
 <span>{visibleHubs.length} hubs</span>
 <span className="text-foreground">{visibleHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length} done</span>
 <span className="text-foreground/50">{visibleHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('progress')).length} in progress</span>
 </div>
 </div>
 )}

 {/* Hub content */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
 {visibleHubs.length === 0 && (
 <EmptyState
  message={allHubs.length === 0 ? "No study hubs yet. Process course materials to generate them." : "No hubs match your filter."}
 icon={<Target size={24} />}
 />
 )}

 {sections.map((section, si) => (
 <section key={si} className="space-y-3">
 <div className="flex items-center gap-3">
 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/50 shrink-0">{section.title}</span>
 <div className="h-px flex-1 bg-border" />
 <span className="text-[8px] font-black text-foreground/50">{section.hubs.length}</span>
 </div>
 <div className="grid grid-cols-3 gap-3">
 {section.hubs.map((hub, idx) => (
 <HubCard key={idx} hub={hub}
 onOpen={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
 onPractice={() => navigateTo('PRACTICE', hub.id)}
 onSetStatus={handleSetStatus}
 onSetStudyDate={handleSetStudyDate}
 onDelete={() => onDelete('study planer', hub.id)}
 onUpdate={onUpdate}
 />
 ))}
 </div>
 </section>
 ))}
 </div>
 </div>
 </div>
 )
}

// ─── Hub Card ─────────────────────────────────────────────────────────────────
function HubCard({hub, onOpen, onPractice, onSetStatus, onSetStudyDate, onDelete, onUpdate}: {
 hub: any
 onOpen: () => void
 onPractice: () => void
 onSetStatus: (hub: any, status: string) => void
 onSetStudyDate: (hub: any, date: string) => void
 onDelete: () => void
 onUpdate: (folder: string, id: string, props: any) => void
}) {
 const [showStatusMenu, setShowStatusMenu] = useState(false)
 const status = stripWL(getVal(hub, 'status', 'Status'))
 const confidence = stripWL(getVal(hub, 'confidence', 'Confidence'))
 const studyDate = getVal(hub, 'study date', 'study_date')
 const isCompleted = status.toLowerCase().includes('complet')
 const displayTitle = cleanTitle(hub.title || hub.id || '').replace(/_Hub$/i, '').replace(/Hub$/i, '').trim()

 return (
 <div className={cn(
 'relative p-4 border rounded-none flex flex-col gap-3  group/hub',
 isCompleted ? 'border-border bg-muted/5 opacity-60' : 'border-border bg-background hover:bg-muted/5'
 )}>
 {/* Header */}
 <div className="flex items-start gap-2">
 <EditableTitle
 value={displayTitle}
 className={cn('text-[11px] font-black uppercase leading-tight flex-1', isCompleted ? 'text-muted-foreground line-through' : 'text-foreground')}
 onSave={(next) => onUpdate('study planer', hub.id, {title: next})}
 />
 <div className="flex items-center gap-1">
 {isCompleted && <Check size={12} className="text-foreground/40 shrink-0" />}
 <button onClick={(e) => {e.stopPropagation(); onDelete()}}
 className="p-1.5 text-muted-foreground/0 group-hover/hub:text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none ">
 <Trash2 size={11} />
 </button>
 </div>
 </div>

 {/* Badges */}
 <div className="flex items-center gap-1.5 flex-wrap">
 <div className="relative">
 <button
 onClick={() => setShowStatusMenu(!showStatusMenu)}
 className={cn('px-2 py-0.5 text-[7px] font-black uppercase tracking-widest border ',
 statusColorClass(status) || 'text-foreground/40 bg-muted/10 border-border')}>
 {status || 'Not Started'}
 </button>
 {showStatusMenu && (
 <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-none shadow-xl z-20 p-1 min-w-[150px]">
 {['Planned', 'In Progress', 'Completed'].map(s => (
 <button key={s} onClick={(e) => {e.stopPropagation(); onUpdate('study planer', hub.id, {Status: wrapWL(s)}); setShowStatusMenu(false)}}
 className={cn('w-full text-left px-3 py-1.5 text-[8px] font-black uppercase hover:bg-muted/10 ', statusColorClass(s))}>
 {s}
 </button>
 ))}
 </div>
 )}
 </div>
 {confidence && (
 <span className={cn('text-[7px] font-black uppercase tracking-wide', confidenceColorClass(confidence))}>
 {confidence}
 </span>
 )}
 </div>

 {/* Study date */}
 <div className="flex items-center gap-2">
 <span className="text-[7px] font-black uppercase tracking-widest text-foreground/50 shrink-0">Study Date</span>
 <input
 type="date"
 value={studyDate || ''}
 onChange={e => onSetStudyDate(hub, e.target.value)}
 className="flex-1 bg-transparent text-[9px] font-black text-foreground/40 focus:text-foreground focus:outline-none border-b border-transparent focus:border-primary  cursor-pointer min-w-0"
 />
 </div>

 {/* Actions */}
 <div className="flex gap-2 pt-1 border-t border-border">
 <button onClick={onOpen} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[8px] font-black uppercase text-foreground/50  hover:bg-muted/10 rounded-none ">
 <BookOpen size={10} />Open
 </button>
 <button onClick={onPractice} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[8px] font-black uppercase text-primary/70  hover:bg-primary/5 rounded-none  border border-primary/10">
 <PlayCircle size={10} />Practice
 </button>
 </div>
 </div>
 )
}
