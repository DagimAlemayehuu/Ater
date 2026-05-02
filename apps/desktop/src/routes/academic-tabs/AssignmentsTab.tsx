import React, { useState, useMemo } from 'react'
import { AlertTriangle, Check, Clock, CalendarDays, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { format, parseISO, isSameDay, isAfter, isBefore, addDays, startOfDay, endOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal, priorityColorClass, getDaysUntil, isOverdue } from './utils'
import { SectionHeader, EmptyState, BadgePill } from './SharedComponents'
import type { TabProps } from './types'

export default function AssignmentsTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo }: TabProps) {
    const [courseFilter, setCourseFilter] = useState<string>('All')
    const [showDone, setShowDone] = useState(false)

    const courses = data.courses || []
    const allAssignments = data.assignments || []

    const filtered = useMemo(() => {
        if (courseFilter === 'All') return allAssignments
        const cName = courses.find(c => c.id === courseFilter)?.title || ''
        return allAssignments.filter(a => stripWL(getVal(a, 'Course', 'course')).toLowerCase().includes(cName.toLowerCase()))
    }, [allAssignments, courseFilter, courses])

    const today = startOfDay(new Date())
    const endOfToday = endOfDay(new Date())
    const endOfThisWeek = addDays(today, 7)

    const pending = filtered.filter(a => !a.done && a.done !== true)
    const done = filtered.filter(a => a.done === true || a.done === 'true')

    const overdue = pending.filter(a => a.due_date && isBefore(parseISO(a.due_date), today))
    const todayDue = pending.filter(a => a.due_date && isSameDay(parseISO(a.due_date), new Date()))
    const thisWeek = pending.filter(a => a.due_date && isAfter(parseISO(a.due_date), endOfToday) && isBefore(parseISO(a.due_date), endOfThisWeek))
    const upcoming = pending.filter(a => a.due_date && isAfter(parseISO(a.due_date), endOfThisWeek))
    const undated = pending.filter(a => !a.due_date)

    const handleComplete = async (a: any) => {
        try {
            await onUpdate('03 - Assignments', a.id, { done: true })
            toast.success('Marked done')
        } catch { toast.error('Update failed') }
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* ── Stats + Filters ── */}
            <div className="px-6 py-4 border-b border-border/10 flex items-center gap-4 flex-wrap shrink-0">
                {/* Stats */}
                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                    <span className="text-foreground">{pending.length} <span className="text-muted-foreground/40">pending</span></span>
                    {overdue.length > 0 && <span className="text-red-400">{overdue.length} <span className="text-muted-foreground/40">overdue</span></span>}
                    {todayDue.length > 0 && <span className="text-amber-400">{todayDue.length} <span className="text-muted-foreground/40">today</span></span>}
                    <span className="text-muted-foreground/30">{done.length} done</span>
                </div>
                <div className="flex-1" />
                {/* Course filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    {['All', ...courses.map(c => c.id)].map(id => {
                        const label = id === 'All' ? 'All' : courses.find(c => c.id === id)?.title || id
                        return (
                            <button key={id} onClick={() => setCourseFilter(id)}
                                className={cn(
                                    'px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wide whitespace-nowrap transition-all',
                                    courseFilter === id ? 'bg-foreground text-background' : 'bg-muted/10 text-muted-foreground/50 hover:text-foreground'
                                )}>{label}</button>
                        )
                    })}
                </div>
                <button onClick={() => onCreate('03 - Assignments', 'New Assignment', courseFilter !== 'All' ? { Course: `[[${courses.find(c => c.id === courseFilter)?.title}]]` } : {})}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-[8px] font-black uppercase rounded-lg hover:opacity-80 transition-all">
                    <Plus size={10} /> Add
                </button>
            </div>

            {/* ── Assignment list ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-24">
                {pending.length === 0 && done.length === 0 && <EmptyState message="No assignments. Add one to get started." icon={<CalendarDays size={24} />} />}

                {/* OVERDUE */}
                {overdue.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={11} className="text-red-400" />
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-red-400">Overdue — {overdue.length}</span>
                            <div className="h-px flex-1 bg-red-500/10" />
                        </div>
                        <div className="flex flex-col gap-2">
                            {overdue.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`3-Database/03 - Assignments/${a.id}.md`)} urgency="overdue" />)}
                        </div>
                    </section>
                )}

                {/* TODAY */}
                {todayDue.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Clock size={11} className="text-amber-400" />
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-amber-400">Due Today — {todayDue.length}</span>
                            <div className="h-px flex-1 bg-amber-500/10" />
                        </div>
                        <div className="flex flex-col gap-2">
                            {todayDue.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`3-Database/03 - Assignments/${a.id}.md`)} urgency="today" />)}
                        </div>
                    </section>
                )}

                {/* THIS WEEK */}
                {thisWeek.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center gap-3">
                            <CalendarDays size={11} className="text-muted-foreground/40" />
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">This Week — {thisWeek.length}</span>
                            <div className="h-px flex-1 bg-border/10" />
                        </div>
                        <div className="flex flex-col gap-2">
                            {thisWeek.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`3-Database/03 - Assignments/${a.id}.md`)} urgency="week" />)}
                        </div>
                    </section>
                )}

                {/* UPCOMING */}
                {upcoming.length > 0 && (
                    <section className="space-y-2">
                        <SectionHeader title={`Upcoming — ${upcoming.length}`} />
                        <div className="flex flex-col gap-2">
                            {upcoming.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`3-Database/03 - Assignments/${a.id}.md`)} urgency="normal" />)}
                        </div>
                    </section>
                )}

                {/* UNDATED */}
                {undated.length > 0 && (
                    <section className="space-y-2">
                        <SectionHeader title={`No Due Date — ${undated.length}`} />
                        <div className="flex flex-col gap-2">
                            {undated.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={handleComplete} onOpen={() => onOpenNote(`3-Database/03 - Assignments/${a.id}.md`)} urgency="normal" />)}
                        </div>
                    </section>
                )}

                {/* DONE (collapsible) */}
                {done.length > 0 && (
                    <section className="space-y-2 opacity-50">
                        <button onClick={() => setShowDone(!showDone)} className="flex items-center gap-3 w-full group">
                            <Check size={11} className="text-emerald-500" />
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Done — {done.length}</span>
                            <div className="h-px flex-1 bg-border/10" />
                            {showDone ? <ChevronUp size={10} className="text-muted-foreground/30" /> : <ChevronDown size={10} className="text-muted-foreground/30" />}
                        </button>
                        {showDone && (
                            <div className="flex flex-col gap-2">
                                {done.map((a, idx) => <AssignmentRow key={idx} a={a} courses={courses} onComplete={() => {}} onOpen={() => onOpenNote(`3-Database/03 - Assignments/${a.id}.md`)} urgency="done" />)}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    )
}

// ─── Assignment Row ────────────────────────────────────────────────────────────
function AssignmentRow({ a, courses, onComplete, onOpen, urgency }: {
    a: any; courses: any[]; onComplete: (a: any) => void; onOpen: () => void; urgency: 'overdue' | 'today' | 'week' | 'normal' | 'done'
}) {
    const isDone = a.done === true || a.done === 'true'
    const courseName = stripWL(getVal(a, 'Course', 'course'))
    const priority = stripWL(getVal(a, 'Priority', 'priority'))
    const days = getDaysUntil(a.due_date)

    const daysLabel = () => {
        if (!a.due_date) return null
        if (days === null) return null
        if (days < 0) return `${Math.abs(days)}d overdue`
        if (days === 0) return 'Today'
        if (days === 1) return 'Tomorrow'
        return `${days}d`
    }

    const daysColor = urgency === 'overdue' ? 'text-red-400' : urgency === 'today' ? 'text-amber-400' : 'text-muted-foreground/40'

    return (
        <div onClick={onOpen} className={cn(
            'flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all group',
            urgency === 'overdue' ? 'border-red-500/15 bg-red-500/[0.02] hover:border-red-500/30' :
            urgency === 'today' ? 'border-amber-500/15 bg-amber-500/[0.02] hover:border-amber-500/30' :
            urgency === 'done' ? 'border-border/5 opacity-60' : 'border-border/15 hover:border-foreground/10 bg-background'
        )}>
            {/* Checkbox */}
            <button onClick={e => { e.stopPropagation(); if (!isDone) onComplete(a) }}
                className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all',
                    isDone ? 'bg-emerald-500 border-emerald-500' : 'border-border/40 hover:border-primary'
                )}>
                {isDone && <Check size={9} strokeWidth={4} className="text-white" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <span className={cn('text-[12px] font-black uppercase truncate block', isDone ? 'line-through text-muted-foreground/40' : 'text-foreground group-hover:text-primary transition-colors')}>
                    {a.title}
                </span>
                {courseName && <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{courseName}</span>}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
                {priority && <span className={cn('px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border', priorityColorClass(priority))}>{priority}</span>}
                {daysLabel() && <span className={cn('text-[9px] font-black uppercase tracking-widest', daysColor)}>{daysLabel()}</span>}
            </div>
        </div>
    )
}
