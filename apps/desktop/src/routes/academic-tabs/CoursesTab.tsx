import React, { useState, useMemo, useEffect } from 'react'
import { Search, Trash2, BookOpen, Plus, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { differenceInDays, startOfDay } from 'date-fns'
import { stripWL, getVal, gradeColorClass, getDaysUntil, wrapWL, cleanTitle, calcGPA } from './utils'
import { SectionHeader, EmptyState, StatCard, BigPropertyCard, EditableTitle, CreateBanner, CountdownBadge } from './SharedComponents'
import type { TabProps } from './types'

const INTERNAL = ['id', 'title', 'path', 'last_synced', 'links', 'created_time', 'last_edited_time']

export default function CoursesTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, initialSelectedId, onClearSelection }: TabProps) {
  const [selectedId,    setSelectedId]    = useState<string | null>(initialSelectedId || null)
  const [statusFilter,  setStatusFilter]  = useState<'Active' | 'All' | 'Completed'>('Active')
  const [search,        setSearch]        = useState('')
  const [addingCourse,  setAddingCourse]  = useState(false)
  const [prevInitId,    setPrevInitId]    = useState<string | null>(initialSelectedId || null)

  // Sync external navigation
  if (initialSelectedId && initialSelectedId !== prevInitId) {
    setSelectedId(initialSelectedId); setPrevInitId(initialSelectedId)
  }
  useEffect(() => { if (initialSelectedId && onClearSelection) onClearSelection() }, [initialSelectedId, onClearSelection])

  const allCourses    = data.courses     || []
  const assignments   = data.assignments || []
  const exams         = data.exams       || []
  const hubs          = data.study_sessions || []
  const schema        = databases.find(d => d.id === 'courses')?.schema || {}
  const now           = startOfDay(new Date())

  const activeSemTitles = (data.semesters || [])
    .filter(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase() === 'active')
    .map(s => String(s.title || '').toLowerCase())

  const filtered = useMemo(() => {
    let cs = allCourses
    if (statusFilter === 'Active') {
      cs = cs.filter(c => {
        const done  = stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet')
        const cSem  = stripWL(getVal(c, 'Semester', 'semester')).toLowerCase()
        const inAct = activeSemTitles.length === 0 || activeSemTitles.some(s => cSem.includes(s))
        return !done && inAct
      })
    } else if (statusFilter === 'Completed') {
      cs = cs.filter(c => stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet'))
    }
    if (search.trim()) cs = cs.filter(c => String(c.title || '').toLowerCase().includes(search.toLowerCase()))
    return cs
  }, [allCourses, statusFilter, search, activeSemTitles])

  // ─────────────────────────────────────────────────────────────────────────
  // COURSE DETAIL
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedId) {
    const course = allCourses.find(c => c.id === selectedId)
    if (!course) { setSelectedId(null); return null }

    const grade      = stripWL(getVal(course, 'Grade', 'grade'))
    const credits    = getVal(course, 'Credits', 'credits')
    const professor  = stripWL(getVal(course, 'Professor', 'professor'))
    const semester   = stripWL(getVal(course, 'Semester', 'semester'))

    const courseAssignments = assignments.filter(a =>
      stripWL(getVal(a, 'Course', 'course')).toLowerCase().includes(String(course.title || '').toLowerCase()))
    const pending = courseAssignments.filter(a => !a.done && a.done !== 'true')
    const done    = courseAssignments.filter(a => a.done === true || a.done === 'true')

    const courseExams    = exams.filter(e => stripWL(getVal(e, 'Course', 'course')).toLowerCase().includes(String(course.title || '').toLowerCase()))
    const upcomingExams  = courseExams.filter(e => e.date && new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const nextExam       = upcomingExams[0]

    const courseHubs  = hubs.filter(h => stripWL(getVal(h, 'course', 'Course')).toLowerCase().includes(String(course.title || '').toLowerCase()))
    const doneHubs    = courseHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length

    const extraKeys = Object.keys({ ...schema, ...course }).filter(k => !INTERNAL.includes(k))
      .sort((a, b) => {
        const pri = ['Status', 'Grade', 'Credits', 'Semester', 'Professor', 'Difficulty']
        return (pri.indexOf(a) === -1 ? 99 : pri.indexOf(a)) - (pri.indexOf(b) === -1 ? 99 : pri.indexOf(b))
      })

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">← Courses</button>
            <EditableTitle value={cleanTitle(course.title)} className="text-2xl font-black uppercase tracking-tight"
              onSave={v => { onUpdate('courses', course.id, { title: v }); setSelectedId(v) }} />
            <div className="flex items-center gap-3 mt-1">
              {professor && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{professor}</span>}
              {semester  && <span className="text-[9px] font-black uppercase text-foreground/40">· {semester}</span>}
              {grade     && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase border', gradeColorClass(grade))}>{grade}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenNote(course.path || `database/courses/${course.id}.md`)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10" title="Open Note"><BookOpen size={14} /></button>
            <button onClick={() => { onDelete('courses', selectedId); setSelectedId(null) }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Countdown */}
        {nextExam && (
          <div className="p-5 bg-muted/5 border border-border flex items-center justify-between">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Next Exam</span>
              <p className="text-[14px] font-black uppercase mt-0.5">{cleanTitle(nextExam.title)}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black">{nextExam.date ? differenceInDays(new Date(nextExam.date), now) : '--'}</span>
              <p className="text-[8px] font-black uppercase text-muted-foreground">days</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Credits"     value={credits || '--'} />
          <StatCard label="Assignments" value={`${done.length}/${courseAssignments.length}`} sub="completed" />
          <StatCard label="Hubs"        value={`${doneHubs}/${courseHubs.length}`} sub="studied" />
          <StatCard label="Exams"       value={courseExams.length} />
        </div>

        {/* Properties */}
        <div className="grid grid-cols-4 gap-4">
          {extraKeys.map(key => (
            <BigPropertyCard key={key} label={key} value={course[key]} schema={schema[key]}
              onUpdate={v => onUpdate('courses', selectedId, { [key]: v })} />
          ))}
        </div>

        {/* Hub progress */}
        {courseHubs.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeader title="Study Hubs" count={courseHubs.length} />
              <button onClick={() => navigateTo('PLANNER')} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">View All →</button>
            </div>
            <div className="w-full bg-muted/20 h-1.5 mb-2">
              <div className="h-full bg-foreground/70" style={{ width: `${courseHubs.length > 0 ? (doneHubs / courseHubs.length) * 100 : 0}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {courseHubs.slice(0, 6).map((hub, idx) => {
                const isDone = stripWL(getVal(hub, 'status', 'Status')).toLowerCase().includes('complet')
                return (
                  <div key={idx} onClick={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
                    className={cn('p-3 border flex items-center gap-3 cursor-pointer hover:border-foreground/40',
                      isDone ? 'border-border bg-muted/5 opacity-50' : 'border-border bg-background')}>
                    <div className={cn('w-3 h-3 border shrink-0', isDone ? 'bg-foreground border-foreground' : 'border-border')} />
                    <span className={cn('text-[10px] font-black uppercase truncate', isDone ? 'text-muted-foreground line-through' : 'text-foreground')}>
                      {cleanTitle(hub.title || hub.id)}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Pending Assignments */}
        {pending.length > 0 && (
          <section className="space-y-3">
            <SectionHeader title={`Pending Assignments`} count={pending.length}
              onAction={() => onCreate('assignments', 'New Assignment', { Course: wrapWL(course.title) })} />
            <div className="flex flex-col gap-2">
              {pending.map((a, idx) => (
                <div key={idx} onClick={() => onOpenNote(a.path || `database/assignments/${a.id}.md`)}
                  className="flex items-center gap-3 p-3 border border-border cursor-pointer hover:bg-muted/5">
                  <div className="w-3.5 h-3.5 border border-border shrink-0" />
                  <span className="text-[11px] font-black uppercase flex-1">{cleanTitle(a.title)}</span>
                  {a.due_date && <CountdownBadge days={getDaysUntil(a.due_date)} />}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COURSE LIST
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5 bg-muted/5 p-1 border border-border">
          {(['Active', 'All', 'Completed'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn('px-3 py-1.5 text-[8px] font-black uppercase tracking-widest',
                statusFilter === f ? 'bg-muted/20 text-foreground border border-border' : 'text-muted-foreground hover:bg-muted/5')}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 bg-muted/5 border border-border px-3 py-2">
          <Search size={11} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
            className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none text-foreground placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => setAddingCourse(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-foreground border border-border bg-background text-[8px] font-black uppercase hover:border-foreground/50">
          <Plus size={10} /> Add
        </button>
      </div>

      {addingCourse && (
        <div className="px-6 pt-3 shrink-0">
          <CreateBanner label="Course" placeholder="e.g. Calculus II"
            onConfirm={name => { onCreate('courses', name, { Status: wrapWL('Active') }); setAddingCourse(false) }}
            onCancel={() => setAddingCourse(false)} />
        </div>
      )}

      {/* Summary stats */}
      <div className="px-6 py-2 border-b border-border flex items-center gap-5 text-[8px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
        <span>{allCourses.length} total</span>
        <span>{filtered.length} shown</span>
        <span>{allCourses.filter(c => !stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet')).length} active</span>
        <span className="ml-auto text-foreground">{calcGPA(allCourses.filter(c => getVal(c, 'Grade', 'grade')))} GPA</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
        {filtered.length === 0 && !addingCourse && <EmptyState message="No courses found." />}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((course, idx) => {
            const grade       = stripWL(getVal(course, 'Grade', 'grade'))
            const credits     = getVal(course, 'Credits', 'credits')
            const professor   = stripWL(getVal(course, 'Professor', 'professor'))
            const semester    = stripWL(getVal(course, 'Semester', 'semester'))
            const cAssign     = assignments.filter(a => stripWL(getVal(a, 'Course', 'course')).toLowerCase().includes(String(course.title || '').toLowerCase()))
            const pendingCt   = cAssign.filter(a => !a.done).length
            const cExams      = exams.filter(e => stripWL(getVal(e, 'Course', 'course')).toLowerCase().includes(String(course.title || '').toLowerCase()))
            const nextEx      = cExams.filter(e => e.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
            const daysToExam  = nextEx?.date ? differenceInDays(new Date(nextEx.date), now) : null
            const cHubs       = hubs.filter(h => stripWL(getVal(h, 'course', 'Course')).toLowerCase().includes(String(course.title || '').toLowerCase()))
            const doneH       = cHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length

            return (
              <div key={idx} onClick={() => setSelectedId(course.id)}
                className="p-5 border border-border bg-background cursor-pointer hover:bg-muted/5 hover:border-foreground/40 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-black uppercase leading-tight text-foreground">{cleanTitle(course.title)}</h3>
                  {grade && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase border shrink-0', gradeColorClass(grade))}>{grade}</span>}
                </div>
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-foreground/50">
                  {professor && <span>{professor}</span>}
                  {semester  && <span>· {semester}</span>}
                  {credits   && <span>· {credits} CR</span>}
                </div>
                {cHubs.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] font-black uppercase text-foreground/50">
                      <span>Study Progress</span><span>{doneH}/{cHubs.length}</span>
                    </div>
                    <div className="h-0.5 bg-muted/20 overflow-hidden">
                      <div className="h-full bg-foreground/60" style={{ width: `${cHubs.length > 0 ? (doneH / cHubs.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest border-t border-border pt-2">
                  {pendingCt > 0 && <span className="text-foreground">{pendingCt} due</span>}
                  {daysToExam !== null && daysToExam >= 0 && (
                    <span className={daysToExam <= 7 ? 'text-foreground font-black' : 'text-foreground/60'}>exam in {daysToExam}d</span>
                  )}
                  {pendingCt === 0 && daysToExam === null && <span className="text-foreground/30">All clear</span>}
                  <ChevronRight size={10} className="ml-auto text-muted-foreground/40" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
