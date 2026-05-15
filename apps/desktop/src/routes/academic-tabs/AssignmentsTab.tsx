import React, {useState, useMemo} from 'react'
import {AlertTriangle, Check, Clock, CalendarDays, ChevronDown, ChevronUp, Plus, Trash2} from 'lucide-react'
import {format, parseISO, isSameDay, isAfter, isBefore, addDays, startOfDay, endOfDay} from 'date-fns'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {stripWL, getVal, priorityColorClass, getDaysUntil, isOverdue, statusColorClass, wrapWL, cleanTitle} from './utils'
import {SectionHeader, EmptyState, BadgePill, EditableTitle} from './SharedComponents'
import type {TabProps} from './types'

export default function AssignmentsTab({data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo}: TabProps) {
  const [statusFilter, setStatusFilter] = useState<'Active' | 'All'>('Active')
  const [courseFilter, setCourseFilter] = useState<string>('All')
  const [showDone, setShowDone] = useState(false)

  const allCourses = data.courses || []
  const allAssignments = data.assignments || []

  const activeSemesters = (data.semesters || []).filter(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase() === 'active').map(s => (s.title || '').toLowerCase())

  const courses = useMemo(() => {
    if (statusFilter === 'All') return allCourses
    return allCourses.filter(c => {
      const isCompleted = stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet')
      const courseSem = stripWL(getVal(c, 'Semester', 'semester')).toLowerCase()
      const inActiveSemester = activeSemesters.length === 0 || activeSemesters.some(s => courseSem.includes(s))
      return !isCompleted && inActiveSemester
    })
  }, [allCourses, statusFilter, activeSemesters])

 const filtered = useMemo(() => {
 if (courseFilter === 'All') return allAssignments.filter(a => {
   const cName = getVal(a, 'Course', 'course')
   return courses.find(c => cleanTitle(c.title).toLowerCase() === cleanTitle(cName).toLowerCase()) || cName === ''
 })
 const cName = cleanTitle(courses.find(c => c.id === courseFilter)?.title || '')
 return allAssignments.filter(a => {
 const assignmentCourse = getVal(a, 'Course', 'course').toLowerCase()
 return assignmentCourse === cName.toLowerCase() && assignmentCourse !== ''
})
}, [allAssignments, courseFilter, courses])

 const today = startOfDay(new Date())
 const endOfToday = endOfDay(new Date())
 const endOfThisWeek = addDays(today, 7)

 const pending = filtered.filter(a => !a.done && a.done !== true)
 const done = filtered.filter(a => a.done === true || a.done === 'true')

 const overdue = pending.filter(a => {
 const d = getVal(a, 'due date', 'due_date')
 return d && isBefore(parseISO(d), today)
})
 const todayDue = pending.filter(a => {
 const d = getVal(a, 'due date', 'due_date')
 return d && isSameDay(parseISO(d), new Date())
})
 const thisWeek = pending.filter(a => {
 const d = getVal(a, 'due date', 'due_date')
 return d && isAfter(parseISO(d), endOfToday) && isBefore(parseISO(d), endOfThisWeek)
})
 const upcoming = pending.filter(a => {
 const d = getVal(a, 'due date', 'due_date')
 return d && isAfter(parseISO(d), endOfThisWeek)
})
 const undated = pending.filter(a => !getVal(a, 'due date', 'due_date'))

 const handleComplete = async (a: any) => {
 try {
 await onUpdate('03 - Assignments', a.id, {done: true})
 toast.success('Marked done')
} catch {toast.error('Update failed')}
}

 return (
 <div className="h-full flex flex-col overflow-hidden">
 {/* ── Stats + Filters ── */}
  <div className="px-6 py-4 border-b border-border flex flex-col gap-4 shrink-0">
  <div className="flex items-center justify-between w-full">
   {/* Stats */}
   <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
   <span className="text-foreground">{pending.length} <span className="text-foreground/50">pending</span></span>
   {overdue.length > 0 && <span className="text-foreground font-black">{overdue.length} <span className="text-foreground/60">overdue</span></span>}
   {todayDue.length > 0 && <span className="text-foreground">{todayDue.length} <span className="text-foreground/50">today</span></span>}
   <span className="text-foreground/40">{done.length} done</span>
   </div>
   
   {/* Filters */}
   <div className="flex items-center gap-2">
    <div className="flex bg-muted/5 p-1 rounded-none border border-border">
     <button onClick={() => setStatusFilter('Active')} className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-none ", statusFilter === 'Active' ? "bg-muted/20 text-foreground border border-border" : "text-foreground/50  hover:bg-muted/5")}>Active</button>
     <button onClick={() => setStatusFilter('All')} className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-none ", statusFilter === 'All' ? "bg-muted/20 text-foreground border border-border" : "text-foreground/50  hover:bg-muted/5")}>All</button>
    </div>
   </div>
  </div>
  
  <div className="flex items-center gap-2 w-full">
  {/* Course filter pills */}
  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
 {['All', ...courses.map(c => c.id)].map(id => {
 const label = id === 'All' ? 'All' : cleanTitle(courses.find(c => c.id === id)?.title || id)
 return (
 <button key={id} onClick={() => setCourseFilter(id)}
 className={cn(
 'px-3 py-1 rounded-none text-[8px] font-black uppercase tracking-wide whitespace-nowrap ',
 courseFilter === id ? 'text-foreground border border-foreground bg-muted/5' : 'border border-transparent bg-muted/5 text-foreground/50  hover:border-border'
 )}>{label}</button>
 )
})}
 </div>
   <button onClick={() => {
   const title = window.prompt('Enter Assignment Title', 'New Assignment') || 'New Assignment'
   const cleanAsgnTitle = cleanTitle(title)
   const props = courseFilter !== 'All' ? {Course: wrapWL(courses.find(c => c.id === courseFilter)?.title)} : {}
   onCreate('03 - Assignments', cleanAsgnTitle, props)
 }}
   className="flex items-center gap-1.5 px-3 py-1.5 text-foreground bg-background border border-border text-[8px] font-black uppercase rounded-none hover:border-foreground/70  shrink-0">
   <Plus size={10} /> Add
   </button>
  </div>
  </div>

 {/* ── Assignment list ── */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-24">
 {pending.length === 0 && done.length === 0 && <EmptyState message="No assignments. Add one to get started." icon={<CalendarDays size={24} />} />}

 {/* OVERDUE */}
 {overdue.length > 0 && (
 <section className="space-y-2">
 <div className="flex items-center gap-3">
 <AlertTriangle size={11} className="text-foreground" />
 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground">Overdue — {overdue.length}</span>
 <div className="h-px flex-1 bg-border/20" />
 </div>
 <div className="flex flex-col gap-2">
 {overdue.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`Database/03 - Assignments/${a.id}.md`)} onDelete={() => onDelete('03 - Assignments', a.id)} onUpdate={onUpdate} urgency="overdue" />)}
 </div>
 </section>
 )}

 {/* TODAY */}
 {todayDue.length > 0 && (
 <section className="space-y-2">
 <div className="flex items-center gap-3">
 <Clock size={11} className="text-foreground/60" />
 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/60">Due Today — {todayDue.length}</span>
 <div className="h-px flex-1 bg-border/10" />
 </div>
 <div className="flex flex-col gap-2">
 {todayDue.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`Database/03 - Assignments/${a.id}.md`)} onDelete={() => onDelete('03 - Assignments', a.id)} onUpdate={onUpdate} urgency="today" />)}
 </div>
 </section>
 )}

 {/* THIS WEEK */}
 {thisWeek.length > 0 && (
 <section className="space-y-2">
 <div className="flex items-center gap-3">
 <CalendarDays size={11} className="text-foreground/60" />
 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/60">This Week — {thisWeek.length}</span>
 <div className="h-px flex-1 bg-border/10" />
 </div>
 <div className="flex flex-col gap-2">
 {thisWeek.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`Database/03 - Assignments/${a.id}.md`)} onDelete={() => onDelete('03 - Assignments', a.id)} onUpdate={onUpdate} urgency="week" />)}
 </div>
 </section>
 )}

 {/* UPCOMING */}
 {upcoming.length > 0 && (
 <section className="space-y-2">
 <SectionHeader title={`Upcoming — ${upcoming.length}`} />
 <div className="flex flex-col gap-2">
 {upcoming.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`Database/03 - Assignments/${a.id}.md`)} onDelete={() => onDelete('03 - Assignments', a.id)} onUpdate={onUpdate} urgency="normal" />)}
 </div>
 </section>
 )}

 {/* UNDATED */}
 {undated.length > 0 && (
 <section className="space-y-2">
 <SectionHeader title={`No Due Date — ${undated.length}`} />
 <div className="flex flex-col gap-2">
 {undated.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`Database/03 - Assignments/${a.id}.md`)} onDelete={() => onDelete('03 - Assignments', a.id)} onUpdate={onUpdate} urgency="normal" />)}
 </div>
 </section>
 )}

 {/* DONE (collapsible) */}
 {done.length > 0 && (
 <section className="space-y-2 opacity-50">
 <button onClick={() => setShowDone(!showDone)} className="flex items-center gap-3 w-full group">
 <Check size={11} className="text-foreground/40" />
 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/40">Done — {done.length}</span>
 <div className="h-px flex-1 bg-border/10" />
 {showDone ? <ChevronUp size={10} className="text-foreground/40" /> : <ChevronDown size={10} className="text-foreground/40" />}
 </button>
 {showDone && (
 <div className="flex flex-col gap-2">
 {done.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={() => {}} onOpen={() => onOpenNote(`Database/03 - Assignments/${a.id}.md`)} onDelete={() => onDelete('03 - Assignments', a.id)} onUpdate={onUpdate} urgency="done" />)}
 </div>
 )}
 </section>
 )}
 </div>
 </div>
 )
}

// ─── Assignment Row ────────────────────────────────────────────────────────────
function AssignmentRow({a, courses, onComplete, onOpen, onDelete, onUpdate, urgency}: {
 a: any; courses: any[]; onComplete: (a: any) => void; onOpen: () => void; onDelete: () => void; onUpdate: (db: string, id: string, props: any) => void; urgency: 'overdue' | 'today' | 'week' | 'normal' | 'done'
}) {
 const [showStatusMenu, setShowStatusMenu] = useState(false)
 const isDone = a.done === true || a.done === 'true'
 const courseName = stripWL(getVal(a, 'Course', 'course'))
 const priority = stripWL(getVal(a, 'Priority', 'priority'))
 const dueDate = getVal(a, 'due date', 'due_date')
 const days = getDaysUntil(dueDate)

 const daysLabel = () => {
 if (!dueDate) return null
 if (days === null) return null
 if (days < 0) return `${Math.abs(days)}d overdue`
 if (days === 0) return 'Today'
 if (days === 1) return 'Tomorrow'
 return `${days}d`
}

 const daysColor = urgency === 'overdue' ? 'text-foreground font-black' : urgency === 'today' ? 'text-foreground' : 'text-foreground/40'

 return (
  <div onClick={onOpen} className={cn(
  'flex items-center gap-3 p-3.5 border rounded-none cursor-pointer  group',
  urgency === 'overdue' ? 'border-border bg-muted/5' :
  urgency === 'today' ? 'border-border bg-muted/5' :
  urgency === 'done' ? 'border-border opacity-60' : 'border-border bg-background'
  )}>
 {/* Checkbox */}
 <button onClick={e => {e.stopPropagation(); if (!isDone) onComplete(a)}}
 className={cn('w-4 h-4 border flex items-center justify-center shrink-0 ',
 isDone ? 'bg-primary border-primary' : 'border-border hover:border-primary'
 )}>
 {isDone && <Check size={9} strokeWidth={4} className="text-primary-foreground" />}
 </button>

 {/* Content */}
 <div className="flex-1 min-w-0">
 <EditableTitle
 value={cleanTitle(a.title)}
 className={cn('text-[12px] font-black uppercase truncate block', isDone ? 'line-through text-foreground/30' : 'text-foreground')}
 onSave={(next) => onUpdate('03 - Assignments', a.id, {title: next})}
 />
 {courseName && <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">{cleanTitle(courseName)}</span>}
 </div>

 {/* Badges & Actions */}
 <div className="flex items-center gap-2 shrink-0">
 <div className="relative">
 <button onClick={e => {e.stopPropagation(); setShowStatusMenu(!showStatusMenu)}}
 className={cn('px-2 py-0.5 text-[7px] font-black uppercase tracking-widest border ',
 statusColorClass(stripWL(getVal(a, 'Status', 'status'))) || 'text-foreground/40 bg-muted/10 border-border')}>
 {cleanTitle(stripWL(getVal(a, 'Status', 'status')) || 'Planned')}
 </button>
 {showStatusMenu && (
 <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-none shadow-xl z-50 p-1 min-w-[120px]">
 {['Planned', 'In Progress', 'Completed'].map(s => (
 <button key={s} onClick={(e) => {e.stopPropagation(); onUpdate('03 - Assignments', a.id, {Status: wrapWL(s)}); setShowStatusMenu(false)}}
 className={cn('w-full text-left px-3 py-1.5 text-[8px] font-black uppercase hover:bg-muted/10 ', statusColorClass(s))}>
 {s}
 </button>
 ))}
 </div>
 )}
 </div>
 {priority && <span className={cn('px-2 py-0.5 text-[7px] font-black uppercase tracking-widest border', priorityColorClass(priority))}>{priority}</span>}
 {daysLabel() && <span className={cn('text-[9px] font-black uppercase tracking-widest', daysColor)}>{daysLabel()}</span>}
 <button onClick={(e) => {e.stopPropagation(); onDelete()}}
 className="p-1.5 text-foreground/0 group-hover:text-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-none ">
 <Trash2 size={11} />
 </button>
 </div>
 </div>
 )
}
