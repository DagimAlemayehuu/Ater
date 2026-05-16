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
 const schema = databases.find(d => d.id === 'courses')?.schema || {}
 const now = startOfDay(new Date())

 const activeSemesters = (data.semesters || []).filter(s => String(stripWL(getVal(s, 'Status', 'status'))).toLowerCase() === 'active').map(s => String(s.title || '').toLowerCase())

 const filtered = useMemo(() => {
 let cs = allCourses
 if (statusFilter === 'Active') {
  cs = cs.filter(c => {
  const isCompleted = String(stripWL(getVal(c, 'Status', 'status'))).toLowerCase().includes('complet')
  const courseSem = String(stripWL(getVal(c, 'Semester', 'semester'))).toLowerCase()
  const inActiveSemester = activeSemesters.length === 0 || activeSemesters.some(s => courseSem.includes(s))
  return !isCompleted && inActiveSemester
  })
 }
 if (statusFilter === 'Completed') cs = cs.filter(c => String(stripWL(getVal(c, 'Status', 'status'))).toLowerCase().includes('complet'))
 if (search.trim()) cs = cs.filter(c => String(c.title || '').toLowerCase().includes(search.toLowerCase()))
 return cs
 }, [allCourses, statusFilter, search, activeSemesters])

 // ── Course Detail ───────────────────────────────────────────────────────────
 if (selectedId) {
 const course = allCourses.find(c => c.id === selectedId)
 if (!course) {setSelectedId(null); return null}

 const grade = stripWL(getVal(course, 'Grade', 'grade'))
 const credits = getVal(course, 'Credits', 'credits')
 const professor = stripWL(getVal(course, 'Professor', 'professor'))
 const difficulty = stripWL(getVal(course, 'Difficulty', 'difficulty'))

 const courseAssignments = assignments.filter(a => String(stripWL(getVal(a, 'Course', 'course'))).toLowerCase().includes(String(course.title || '').toLowerCase()))
 const pendingAssignments = courseAssignments.filter(a => !a.done)
 const courseExams = exams.filter(e => String(stripWL(getVal(e, 'Course', 'course'))).toLowerCase().includes(String(course.title || '').toLowerCase()))
 const upcomingExams = courseExams.filter(e => e.date && new Date(e.date).getTime() >= now.getTime()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
 const nextExam = upcomingExams[0]
 const courseHubs = hubs.filter(h => String(stripWL(getVal(h, 'course', 'Course'))).toLowerCase().includes(String(course.title || '').toLowerCase()))
 const doneHubs = courseHubs.filter(h => String(stripWL(getVal(h, 'status', 'Status'))).toLowerCase().includes('complet')).length

 return (
 <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
 {/* Header */}
 <div className="flex items-start justify-between">
 <div>
 <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground  mb-2 ">← Courses</button>
 <EditableTitle
 value={cleanTitle(course.title)}
 className="text-xl font-black uppercase tracking-tight"
 onSave={(next) => {
 onUpdate('courses', course.id, {title: next})
 setSelectedId(next)
}}
 />
 <div className="flex items-center gap-3 mt-1">
 {professor && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{professor}</span>}
 {grade && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase border', gradeColorClass(grade))}>{grade}</span>}
 </div>
 </div>
  <div className="flex items-center gap-2">
  <button onClick={() => onOpenNote(course.path || `database/courses/${course.id}.md`)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-none " title="Open Note">
  <BookOpen size={14} />
  </button>
  <button onClick={() => onDelete('courses', selectedId)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none ">
  <Trash2 size={14} />
  </button>
  </div>
 </div>

 {/* Quick Stats */}

 {/* Next exam callout */}
 {nextExam && (
 <div className="p-4 bg-muted/5 border border-border rounded-none flex items-center justify-between">
 <div>
 <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Next Exam</span>
 <p className="text-[13px] font-black uppercase">{nextExam.title}</p>
 </div>
 <div className="text-right">
 <span className="text-2xl font-black text-foreground">{nextExam.date ? differenceInDays(new Date(nextExam.date), now) : '--'}</span>
 <p className="text-[8px] font-black uppercase text-muted-foreground">days</p>
 </div>
 </div>
 )}

 {/* Properties */}
 <div className="grid grid-cols-4 gap-4">
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
 onUpdate={(v) => onUpdate('courses', selectedId, {[key]: v})}
 />
 ))
})()}
 </div>

 {/* Pending Assignments */}
 {pendingAssignments.length > 0 && (
 <section className="space-y-4">
 <SectionHeader title={`Pending Assignments — ${pendingAssignments.length}`} onAction={() => {
 const title = window.prompt('Enter Assignment Title', 'New Assignment') || 'New Assignment'
 onCreate('assignments', title, {Course: `[[${course.title}]]`})
}} />
 <div className="flex flex-col gap-2">
 {pendingAssignments.slice(0, 5).map((a, idx) => (
 <div key={idx} onClick={() => onOpenNote(a.path || `database/assignments/${a.id}.md`)}
 className="flex items-center gap-3 p-3 border border-border rounded-none cursor-pointer bg-background ">
 <div className="w-3 h-3 rounded-none border border-border shrink-0" />
 <span className="text-[11px] font-black uppercase flex-1">{cleanTitle(a.title)}</span>
 {a.due_date && <span className="text-[8px] font-black text-muted-foreground">{a.due_date.split('T')[0]}</span>}
 </div>
 ))}
 </div>
 </section>
 )}

 {/* Study Hubs */}
 {courseHubs.length > 0 && (
 <section className="space-y-4">
 <SectionHeader title={`Study Hubs — ${courseHubs.length}`} onAction={() => navigateTo('PLANNER')} actionLabel="View All" />
 <div className="grid grid-cols-2 gap-3">
 {courseHubs.slice(0, 6).map((hub, idx) => {
 const hStatus = stripWL(getVal(hub, 'status', 'Status'))
 const isDone = hStatus.toLowerCase().includes('complet')
 return (
 <div key={idx} onClick={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
 className={cn('p-3 border rounded-none flex items-center gap-3 cursor-pointer hover:border-foreground/70 ',
 isDone ? 'border-border bg-muted/5 opacity-50' : 'border-border bg-background')}>
 <div className={cn('w-3 h-3 rounded-none border shrink-0', isDone ? 'bg-primary border-primary' : 'border-border')} />
 <span className={cn('text-[10px] font-black uppercase truncate', isDone ? 'text-muted-foreground line-through' : 'text-foreground')}>
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
 <div className="flex items-center gap-1.5 bg-muted/5 p-1 rounded-none border border-border">
 {(['Active', 'All', 'Completed'] as const).map(f => (
 <button key={f} onClick={() => setStatusFilter(f)}
 className={cn('px-3 py-1.5 rounded-none text-[8px] font-black uppercase tracking-widest ',
 statusFilter === f ? 'bg-muted/20 text-foreground border border-border' : 'text-muted-foreground  hover:bg-muted/5'
 )}>{f}</button>
 ))}
 </div>
 <div className="flex items-center gap-2 flex-1 bg-muted/5 border border-border rounded-none px-3 py-2">
 <Search size={11} className="text-muted-foreground" />
 <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
 className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none text-foreground placeholder:text-muted-foreground" />
 </div>
 <button onClick={() => {
 const title = window.prompt('Enter Course Title', 'New Course') || 'New Course'
 const cleanCourseTitle = cleanTitle(title)
 onCreate('courses', cleanCourseTitle, {status: wrapWL('Active')})
}}
 className="flex items-center gap-1.5 px-3 py-2 text-foreground border border-border bg-background text-[8px] font-black uppercase rounded-none hover:border-foreground/50 ">
 <Plus size={10} /> Add
 </button>
 </div>

 {/* Grid */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
 {filtered.length === 0 && <EmptyState message="No courses found." icon={<GraduationCap size={24} />} />}
 <div className="grid grid-cols-3 gap-4">
 {filtered.map((course, idx) => {
 const grade = stripWL(getVal(course, 'Grade', 'grade'))
 const credits = getVal(course, 'Credits', 'credits')
 const professor = stripWL(getVal(course, 'Professor', 'professor'))
 const courseAssignments = assignments.filter(a => String(stripWL(getVal(a, 'Course', 'course'))).toLowerCase().includes(String(course.title || '').toLowerCase()))
 const pending = courseAssignments.filter(a => !a.done).length
 const courseExams = exams.filter(e => String(stripWL(getVal(e, 'Course', 'course'))).toLowerCase().includes(String(course.title || '').toLowerCase()))
 const nextExam = courseExams.filter(e => e.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
 const daysToExam = nextExam?.date ? differenceInDays(new Date(nextExam.date), now) : null
 const courseHubs = hubs.filter(h => String(stripWL(getVal(h, 'course', 'Course'))).toLowerCase().includes(String(course.title || '').toLowerCase()))
 const doneHubs = courseHubs.filter(h => String(stripWL(getVal(h, 'status', 'Status'))).toLowerCase().includes('complet')).length

 return (
 <div key={idx} onClick={() => setSelectedId(course.id)}
 className="p-5 border border-border rounded-none cursor-pointer bg-background  group flex flex-col gap-3">
 {/* Title + Grade */}
 <div className="flex items-start justify-between gap-2">
 <h3 className="text-[13px] font-black uppercase leading-tight text-foreground cursor-pointer"
 onClick={(e) => {
 e.stopPropagation()
 const next = window.prompt('Rename Course', course.title || '')
 if (next && next !== course.title) {
   const cleanNext = cleanTitle(next)
   onUpdate('courses', course.id, {title: cleanNext})
 }
}}>{cleanTitle(course.title)}</h3>
 {grade && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase border shrink-0', gradeColorClass(grade))}>{grade}</span>}
 </div>

 {/* Meta */}
 <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-foreground/50">
 {professor && <span>{professor}</span>}
 {professor && credits && <span>·</span>}
 {credits && <span>{credits} CR</span>}
 </div>

 {/* Hub progress */}
 {courseHubs.length > 0 && (
 <div className="space-y-1">
 <div className="flex justify-between text-[7px] font-black uppercase text-foreground/60">
 <span>Study Progress</span>
 <span>{doneHubs}/{courseHubs.length}</span>
 </div>
 <div className="h-1 bg-muted/20 rounded-none overflow-hidden">
 <div className="h-full bg-foreground/70 " style={{width: `${courseHubs.length > 0 ? (doneHubs / courseHubs.length) * 100 : 0}%`}} />
 </div>
 </div>
 )}

 {/* Quick stats */}
 <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest border-t border-border pt-2">
 {pending > 0 && <span className="text-foreground">{pending} due</span>}
 {daysToExam !== null && daysToExam >= 0 && (
 <span className={daysToExam <= 7 ? 'text-foreground font-black' : 'text-foreground/60'}>exam in {daysToExam}d</span>
 )}
 {pending === 0 && daysToExam === null && <span className="text-foreground/40">All clear</span>}
 </div>
 </div>
 )
})}
 </div>
 </div>
 </div>
 )
}
