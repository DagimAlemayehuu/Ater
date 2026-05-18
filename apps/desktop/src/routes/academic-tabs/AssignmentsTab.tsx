import React, { useState, useMemo, useEffect } from 'react'
import { Check, Trash2, BookOpen, Plus, Filter, Search, Clock } from 'lucide-react'
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal, getDaysUntil, isOverdue, wrapWL, cleanTitle, statusColorClass, priorityColorClass } from './utils'
import { SectionHeader, EmptyState, BigPropertyCard, EditableTitle, CreateBanner, CountdownBadge } from './SharedComponents'
import type { TabProps } from './types'

const INTERNAL = ['id', 'title', 'path', 'last_synced', 'links', 'done']

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Submitted', 'Graded', 'Late']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']

export default function AssignmentsTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo }: TabProps) {
  const [filter,       setFilter]       = useState<'All' | 'Pending' | 'Completed'>('Pending')
  const [courseFilter, setCourseFilter] = useState<string>('All')
  const [search,       setSearch]       = useState('')
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [adding,       setAdding]       = useState(false)
  const [sortBy,       setSortBy]       = useState<'due' | 'priority' | 'course'>('due')

  const allAssignments = data.assignments || []
  const courses        = data.courses     || []
  const schema         = databases.find(d => d.id === 'assignments')?.schema || {}
  const now            = startOfDay(new Date())

  const courseOptions = useMemo(() =>
    ['All', ...Array.from(new Set(allAssignments.map(a => stripWL(getVal(a, 'Course', 'course'))).filter(Boolean)))],
    [allAssignments])

  const filtered = useMemo(() => {
    let items = allAssignments
    if (filter === 'Pending')   items = items.filter(a => !(a.done === true || a.done === 'true'))
    if (filter === 'Completed') items = items.filter(a => a.done === true || a.done === 'true' ||
      stripWL(getVal(a, 'Status', 'status')).toLowerCase().includes('complet'))
    if (courseFilter !== 'All') items = items.filter(a => stripWL(getVal(a, 'Course', 'course')) === courseFilter)
    if (search.trim()) items = items.filter(a => String(a.title || '').toLowerCase().includes(search.toLowerCase()))

    // Sort
    return [...items].sort((a, b) => {
      if (sortBy === 'due') {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity
        return da - db
      }
      if (sortBy === 'priority') {
        const order = ['Critical', 'High', 'Medium', 'Low']
        const pa = order.indexOf(stripWL(getVal(a, 'Priority', 'priority')))
        const pb = order.indexOf(stripWL(getVal(b, 'Priority', 'priority')))
        return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
      }
      if (sortBy === 'course') {
        return stripWL(getVal(a, 'Course', 'course')).localeCompare(stripWL(getVal(b, 'Course', 'course')))
      }
      return 0
    })
  }, [allAssignments, filter, courseFilter, search, sortBy])

  const pending    = allAssignments.filter(a => !(a.done === true || a.done === 'true'))
  const overdue    = pending.filter(a => a.due_date && isOverdue(a.due_date))
  const dueSoon    = pending.filter(a => { const d = getDaysUntil(a.due_date); return d !== null && d >= 0 && d <= 3 })

  // ─── Confirm done ──────────────────────────────────────────────────────────
  const handleToggleDone = async (a: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const isDone = a.done === true || a.done === 'true' ||
      stripWL(getVal(a, 'Status', 'status')).toLowerCase().includes('complet')
    try {
      await onUpdate('assignments', a.id, { done: !isDone, Status: wrapWL(isDone ? 'In Progress' : 'Completed') })
    } catch { toast.error('Update failed') }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const assignment = useMemo(() => allAssignments.find(a => a.id === selectedId), [allAssignments, selectedId])

  useEffect(() => {
    if (selectedId && !assignment && allAssignments.length > 0) {
      setSelectedId(null)
    }
  }, [selectedId, assignment, allAssignments, setSelectedId])

  if (selectedId && assignment) {

    const isDone    = assignment.done === true || assignment.done === 'true' ||
      stripWL(getVal(assignment, 'Status', 'status')).toLowerCase().includes('complet')
    const daysLeft  = getDaysUntil(assignment.due_date)
    const course    = stripWL(getVal(assignment, 'Course', 'course'))
    const priority  = stripWL(getVal(assignment, 'Priority', 'priority'))
    const extraKeys = Object.keys({ ...schema, ...assignment }).filter(k =>
      !INTERNAL.includes(k) && !['Status', 'status', 'Course', 'course', 'Priority', 'priority', 'due_date'].includes(k))

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">← Assignments</button>
            <div className="flex items-center gap-3">
              <button onClick={e => handleToggleDone(assignment, e)}
                className={cn('w-5 h-5 border flex items-center justify-center shrink-0',
                  isDone ? 'bg-foreground border-foreground' : 'border-border hover:border-foreground')}>
                {isDone && <Check size={11} strokeWidth={3} className="text-background" />}
              </button>
              <EditableTitle value={cleanTitle(assignment.title)} className={cn('text-2xl font-black uppercase tracking-tight', isDone && 'line-through text-muted-foreground')}
                onSave={v => onUpdate('assignments', assignment.id, { title: v })} />
            </div>
            <div className="flex items-center gap-3 mt-1 pl-8">
              {course   && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{course}</span>}
              {priority && <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase border', priorityColorClass(priority))}>{priority}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {daysLeft !== null && (
              <div className={cn('px-4 py-2 border text-center', daysLeft < 0 ? 'border-foreground bg-muted/10' : daysLeft <= 3 ? 'border-foreground/40' : 'border-border')}>
                <div className="text-2xl font-black">{daysLeft < 0 ? Math.abs(daysLeft) : daysLeft}</div>
                <div className="text-[7px] font-black uppercase">{daysLeft < 0 ? 'days late' : 'days left'}</div>
              </div>
            )}
            <button onClick={() => onOpenNote(assignment.path || `database/assignments/${assignment.id}.md`)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10"><BookOpen size={14} /></button>
            <button onClick={() => { onDelete('assignments', selectedId); setSelectedId(null) }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Core properties */}
        <div className="grid grid-cols-4 gap-4">
          <BigPropertyCard label="Status" value={getVal(assignment, 'Status', 'status') || 'Not Started'}
            schema={{ type: 'select' }} onUpdate={v => onUpdate('assignments', assignment.id, { Status: v })} />
          <BigPropertyCard label="Priority" value={getVal(assignment, 'Priority', 'priority') || ''}
            schema={{ type: 'select', source: 'priority' }} onUpdate={v => onUpdate('assignments', assignment.id, { Priority: v })} />
          <BigPropertyCard label="Due Date" value={assignment.due_date || ''}
            schema={{ type: 'date' }} onUpdate={v => onUpdate('assignments', assignment.id, { due_date: v })} />
          <BigPropertyCard label="Course" value={getVal(assignment, 'Course', 'course') || ''}
            schema={{ type: 'relation', source: 'database/courses' }} onUpdate={v => onUpdate('assignments', assignment.id, { Course: v })} />
        </div>

        {/* Extra properties */}
        {extraKeys.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {extraKeys.map(key => (
              <BigPropertyCard key={key} label={key} value={assignment[key]} schema={schema[key]}
                onUpdate={v => onUpdate('assignments', assignment.id, { [key]: v })} />
            ))}
          </div>
        )}

        {/* Mark complete */}
        <button onClick={e => handleToggleDone(assignment, e)}
          className={cn('px-6 py-3 border text-[10px] font-black uppercase tracking-widest w-full',
            isDone ? 'border-border text-muted-foreground hover:bg-muted/5' : 'border-foreground text-foreground hover:bg-foreground/5')}>
          {isDone ? '↩ Mark Incomplete' : '✓ Mark Complete'}
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Alerts */}
      {overdue.length > 0 && (
        <div className="px-6 py-2.5 bg-foreground/5 border-b border-foreground/20 flex items-center gap-3 text-[9px] font-black uppercase tracking-widest shrink-0">
          <span className="text-foreground">{overdue.length} overdue</span>
          <div className="h-3 w-px bg-border" />
          {overdue.slice(0, 3).map((a, i) => (
            <button key={i} onClick={() => setSelectedId(a.id)} className="text-foreground/60 hover:text-foreground">
              {cleanTitle(a.title)}
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0 flex-wrap bg-background">
        <div className="flex items-center gap-1 bg-muted/5 border border-border p-1">
          {(['Pending', 'All', 'Completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 text-[8px] font-black uppercase tracking-widest',
                filter === f ? 'bg-muted/20 text-foreground border border-border' : 'text-muted-foreground hover:bg-muted/5')}>
              {f}
            </button>
          ))}
        </div>

        {/* Course filter */}
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}
          className="bg-background border border-border px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground focus:outline-none">
          {courseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="bg-background border border-border px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground focus:outline-none">
          <option value="due">By Due Date</option>
          <option value="priority">By Priority</option>
          <option value="course">By Course</option>
        </select>

        <div className="flex items-center gap-2 flex-1 bg-muted/5 border border-border px-3 py-2">
          <Search size={11} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none" />
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-foreground border border-border bg-background text-[8px] font-black uppercase hover:border-foreground/50">
          <Plus size={10} /> Add
        </button>
      </div>

      {/* Add banner */}
      {adding && (
        <div className="px-6 pt-3 shrink-0">
          <CreateBanner label="Assignment" placeholder="e.g. Problem Set 3"
            onConfirm={name => {
              onCreate('assignments', name, { Status: wrapWL('Not Started'), Priority: wrapWL('Medium') })
              setAdding(false)
            }}
            onCancel={() => setAdding(false)} />
        </div>
      )}

      {/* Stats row */}
      <div className="px-6 py-2 border-b border-border flex items-center gap-5 text-[8px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
        <span>{pending.length} pending</span>
        <span>{overdue.length > 0 ? `${overdue.length} overdue` : '0 overdue'}</span>
        <span>{dueSoon.length} due soon</span>
        <span className="ml-auto">{filtered.length} shown</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 pb-24 space-y-2">
        {filtered.length === 0 && !adding && <EmptyState message="No assignments found." />}
        {filtered.map((a, idx) => {
          const isDone     = a.done === true || a.done === 'true' || stripWL(getVal(a, 'Status', 'status')).toLowerCase().includes('complet')
          const course     = stripWL(getVal(a, 'Course', 'course'))
          const priority   = stripWL(getVal(a, 'Priority', 'priority'))
          const daysLeft   = getDaysUntil(a.due_date)
          const isLate     = daysLeft !== null && daysLeft < 0 && !isDone

          return (
            <div key={idx} onClick={() => setSelectedId(a.id)}
              className={cn('flex items-center gap-4 p-3 border cursor-pointer group hover:border-foreground/40',
                isDone ? 'opacity-40 border-border/20 bg-muted/3' : isLate ? 'border-foreground/30 bg-muted/5' : 'border-border bg-background hover:bg-muted/3')}>
              <button onClick={e => handleToggleDone(a, e)}
                className={cn('w-4 h-4 border shrink-0 flex items-center justify-center',
                  isDone ? 'bg-foreground border-foreground' : 'border-border hover:border-foreground')}>
                {isDone && <Check size={9} strokeWidth={4} className="text-background" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className={cn('text-[11px] font-black uppercase truncate block', isDone && 'line-through text-muted-foreground')}>
                  {cleanTitle(a.title)}
                </span>
                {course && <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">{course}</span>}
              </div>
              {priority && (
                <span className={cn('px-2 py-0.5 text-[7px] font-black uppercase border shrink-0', priorityColorClass(priority))}>{priority}</span>
              )}
              {daysLeft !== null && !isDone && <CountdownBadge days={daysLeft} />}
              {a.due_date && isDone && (
                <span className="text-[9px] font-black uppercase text-muted-foreground/40">
                  {format(parseISO(a.due_date), 'MMM d')}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
