import React, {useState, useMemo, useEffect} from 'react'
import {Search, ChevronRight, Trash2, Check, BookOpen, Hash, GraduationCap, Plus} from 'lucide-react'
import {cn} from '@/lib/utils'
import {format, parseISO, differenceInDays, startOfDay} from 'date-fns'
import {stripWL, getVal, gradeColorClass, getDaysUntil, wrapWL, cleanTitle} from './utils'
import {SectionHeader, EmptyState, StatCard, BigPropertyCard, EditableTitle} from './SharedComponents'
import type {TabProps} from './types'

export default function CoursesTab({data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, initialSelectedId, onClearSelection}: TabProps) {
 const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null)

 useEffect(() => {
 if (initialSelectedId) {
 setSelectedId(initialSelectedId)
 if (onClearSelection) onClearSelection()
}
}, [initialSelectedId, onClearSelection])
 const [statusFilter, setStatusFilter] = useState<'Active' | 'All' | 'Completed'>('Active')
 const [search, setSearch] = useState('')

 const allCourses = data.courses || []
 const assignments = data.assignments || []
 const exams = data.exams || []
 const hubs = data.study_sessions || []
 const schema = databases.find(d => d.id === '07 - Courses')?.schema || {}
 const now = startOfDay(new Date())

 const filtered = useMemo(() => {
 let cs = allCourses
 if (statusFilter === 'Active') cs = cs.filter(c => !stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet'))
 if (statusFilter === 'Completed') cs = cs.filter(c => stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet'))
 if (search.trim()) cs = cs.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()))
 return cs
}, [allCourses, statusFilter, search])

 // ── Course Detail ───────────────────────────────────────────────────────────
 if (selectedId) {
 const course = allCourses.find(c => c.id === selectedId)
 if (!course) {setSelectedId(null); return null}

 const grade = stripWL(getVal(course, 'Grade', 'grade'))
 const credits = getVal(course, 'Credits', 'credits')
 const professor = stripWL(getVal(course, 'Professor', 'professor'))
 const difficulty = stripWL(getVal(course, 'Difficulty', 'difficulty'))

 const courseAssignments = assignments.filter(a => stripWL(getVal(a, 'Course', 'course')).toLowerCase().includes(course.title?.toLowerCase()))
 const pendingAssignments = courseAssignments.filter(a => !a.done)
 const courseExams = exams.filter(e => stripWL(getVal(e, 'Course', 'course')).toLowerCase().includes(course.title?.toLowerCase()))
 const upcomingExams = courseExams.filter(e => e.date && new Date(e.date).getTime() >= now.getTime()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
 const nextExam = upcomingExams[0]
 const courseHubs = hubs.filter(h => stripWL(getVal(h, 'course', 'Course')).toLowerCase().includes(course.title?.toLowerCase()))
 const doneHubs = courseHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length

 return (
 <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-10 pb-24">
 {/* Header */}
 <div className="flex items-start justify-between">
 <div>
 <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground mb-2 transition-all">← Courses</button>
 <EditableTitle
 value={cleanTitle(course.title)}
 className="text-xl font-black uppercase tracking-tight"
 onSave={(next) => {
 onUpdate('07 - Courses', course.id, {title: next})
 setSelectedId(next)
}}
 />
 <div className="flex items-center gap-3 mt-1">
 {professor && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{professor}</span>}
 {grade && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase rounded border', gradeColorClass(grade))}>{grade}</span>}
 </div>
 </div>
 <button onClick={() => onDelete('07 - Courses', selectedId)} className="p-2 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
 <Trash2 size={14} />
 </button>
 </div>

 {/* Quick Stats */}

 {/* Next exam callout */}
 {nextExam && (
 <div className="p-4 bg-muted/5 border border-border rounded-xl flex items-center justify-between">
 <div>
 <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Next Exam</span>
 <p className="text-[13px] font-black uppercase">{nextExam.title}</p>
 </div>
 <div className="text-right">
 <span className="text-2xl font-black text-foreground">{nextExam.date ? differenceInDays(new Date(nextExam.date), now) : '--'}</span>
 <p className="text-[8px] font-black uppercase text-muted-foreground/40">days</p>
 </div>
 </div>
 )}

 {/* Properties */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {(() => {
 const internal = ['id', 'title', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by', 'Assignments', 'Study Progress']
 const keys = new Set([...Object.keys(schema || {}), ...Object.keys(course || {})])
 return Array.from(keys)
 .filter(k => !internal.includes(k))
 .sort((a, b) => {
 const priority = ['Status', 'Grade', 'Credits', 'Professor', 'Semester']
 const ai = priority.indexOf(a)
 const bi = priority.indexOf(b)
 if (ai !== -1 && bi !== -1) return ai - bi
 if (ai !== -1) return -1
 if (bi !== -1) return 1
 return a.localeCompare(b)
})
 .map(key => (
 <BigPropertyCard
 key={key}
 label={key}
 value={course[key]}
 schema={schema[key]}
 onUpdate={(v) => onUpdate('07 - Courses', selectedId, {[key]: v})}
 />
 ))
})()}
 </div>

 {/* Pending Assignments */}
 {pendingAssignments.length > 0 && (
 <section className="space-y-4">
 <SectionHeader title={`Pending Assignments — ${pendingAssignments.length}`} onAction={() => {
 const title = window.prompt('Enter Assignment Title', 'New Assignment') || 'New Assignment'
 onCreate('03 - Assignments', title, {Course: `[[${course.title}]]`})
}} />
 <div className="flex flex-col gap-2">
 {pendingAssignments.slice(0, 5).map((a, idx) => (
 <div key={idx} onClick={() => onOpenNote(`3-Database/03 - Assignments/${a.id}.md`)}
 className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer bg-background transition-all">
 <div className="w-3 h-3 rounded-full border border-border shrink-0" />
 <span className="text-[11px] font-black uppercase flex-1">{cleanTitle(a.title)}</span>
 {a.due_date && <span className="text-[8px] font-black text-muted-foreground/40">{a.due_date.split('T')[0]}</span>}
 </div>
 ))}
 </div>
 </section>
 )}

 {/* Study Hubs */}
 {courseHubs.length > 0 && (
 <section className="space-y-4">
 <SectionHeader title={`Study Hubs — ${courseHubs.length}`} onAction={() => navigateTo('PLANNER')} actionLabel="View All" />
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {courseHubs.slice(0, 6).map((hub, idx) => {
 const hStatus = stripWL(getVal(hub, 'status', 'Status'))
 const isDone = hStatus.toLowerCase().includes('complet')
 return (
 <div key={idx} onClick={() => onOpenNote(`3-Database/06 - Study Planner/${hub.id}.md`)}
 className={cn('p-3 border rounded-xl flex items-center gap-3 cursor-pointer hover:border-foreground/10 transition-all',
 isDone ? 'border-border bg-muted/5 opacity-50' : 'border-border bg-background')}>
 <div className={cn('w-3 h-3 rounded-full border shrink-0', isDone ? 'bg-primary border-primary' : 'border-border')} />
 <span className={cn('text-[10px] font-black uppercase truncate', isDone ? 'text-muted-foreground/30 line-through' : 'text-foreground')}>
 {cleanTitle(hub.title || hub.id)}
 </span>
 </div>
 )
})}
 </div>
 </section>
 )}
 </div>
 )
}

 // ── Course List ─────────────────────────────────────────────────────────────
 return (
 <div className="h-full flex flex-col overflow-hidden">
 {/* Filter bar */}
 <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
 <div className="flex items-center gap-1.5 bg-muted/10 p-1 rounded-lg">
 {(['Active', 'All', 'Completed'] as const).map(f => (
 <button key={f} onClick={() => setStatusFilter(f)}
 className={cn('px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all',
 statusFilter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground/50 hover:text-foreground'
 )}>{f}</button>
 ))}
 </div>
 <div className="flex items-center gap-2 flex-1 bg-muted/5 border border-border rounded-lg px-3 py-2">
 <Search size={11} className="text-muted-foreground/30" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
 className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none text-foreground placeholder:text-muted-foreground/30" />
 </div>
 <button onClick={() => {
 const title = window.prompt('Enter Course Title', 'New Course') || 'New Course'
 const cleanCourseTitle = cleanTitle(title)
 onCreate('07 - Courses', cleanCourseTitle, {status: wrapWL('Active')})
}}
 className="flex items-center gap-1.5 px-3 py-2 text-foreground border border-border bg-background text-[8px] font-black uppercase rounded-lg hover:border-foreground/50 transition-all">
 <Plus size={10} /> Add
 </button>
 </div>

 {/* Grid */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
 {filtered.length === 0 && <EmptyState message="No courses found." icon={<GraduationCap size={24} />} />}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {filtered.map((course, idx) => {
 const grade = stripWL(getVal(course, 'Grade', 'grade'))
 const credits = getVal(course, 'Credits', 'credits')
 const professor = stripWL(getVal(course, 'Professor', 'professor'))
 const courseAssignments = assignments.filter(a => stripWL(getVal(a, 'Course', 'course')).toLowerCase().includes(course.title?.toLowerCase()))
 const pending = courseAssignments.filter(a => !a.done).length
 const courseExams = exams.filter(e => stripWL(getVal(e, 'Course', 'course')).toLowerCase().includes(course.title?.toLowerCase()))
 const nextExam = courseExams.filter(e => e.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
 const daysToExam = nextExam?.date ? differenceInDays(new Date(nextExam.date), now) : null
 const courseHubs = hubs.filter(h => stripWL(getVal(h, 'course', 'Course')).toLowerCase().includes(course.title?.toLowerCase()))
 const doneHubs = courseHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length

 return (
 <div key={idx} onClick={() => setSelectedId(course.id)}
 className="p-5 border border-border rounded-xl cursor-pointer bg-background transition-all group flex flex-col gap-3">
 {/* Title + Grade */}
 <div className="flex items-start justify-between gap-2">
 <h3 className="text-[13px] font-black uppercase leading-tight transition-colors cursor-pointer"
 onClick={(e) => {
 e.stopPropagation()
 const next = window.prompt('Rename Course', course.title || '')
 if (next && next !== course.title) {
   const cleanNext = cleanTitle(next)
   onUpdate('07 - Courses', course.id, {title: cleanNext})
 }
}}>{cleanTitle(course.title)}</h3>
 {grade && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase rounded border shrink-0', gradeColorClass(grade))}>{grade}</span>}
 </div>

 {/* Meta */}
 <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
 {professor && <span>{professor}</span>}
 {professor && credits && <span>·</span>}
 {credits && <span>{credits} CR</span>}
 </div>

 {/* Hub progress */}
 {courseHubs.length > 0 && (
 <div className="space-y-1">
 <div className="flex justify-between text-[7px] font-black uppercase text-muted-foreground/30">
 <span>Study Progress</span>
 <span>{doneHubs}/{courseHubs.length}</span>
 </div>
 <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
 <div className="h-full bg-foreground/30 transition-all" style={{width: `${courseHubs.length > 0 ? (doneHubs / courseHubs.length) * 100 : 0}%`}} />
 </div>
 </div>
 )}

 {/* Quick stats */}
 <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest border-t border-border pt-2">
 {pending > 0 && <span className="text-foreground/70">{pending} due</span>}
 {daysToExam !== null && daysToExam >= 0 && (
 <span className={daysToExam <= 7 ? 'text-foreground font-black' : 'text-muted-foreground/30'}>exam in {daysToExam}d</span>
 )}
 {pending === 0 && daysToExam === null && <span className="text-muted-foreground/20">All clear</span>}
 </div>
 </div>
 )
})}
 </div>
 </div>
 </div>
 )
}
