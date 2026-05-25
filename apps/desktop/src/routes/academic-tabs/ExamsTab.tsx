import React, { useState, useMemo } from 'react'
import { Check, Trash2, BookOpen, Plus, Search, Target } from 'lucide-react'
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal, getDaysUntil, typeColorClass, gradeColorClass, wrapWL, cleanTitle, getNumVal, getBoolVal } from './utils'
import { EmptyState, BigPropertyCard, EditableTitle, CreateBanner, CountdownBadge, StatusBadge } from './SharedComponents'
import type { TabProps } from './types'

const INTERNAL = ['id', 'title', 'path', 'last_synced', 'links']
const EXAM_TYPES = ['Quiz', 'Midterm', 'Final', 'Lab Exam', 'Practical', 'Oral', 'Online']
const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']

export default function ExamsTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo }: TabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter,     setFilter]     = useState<'Upcoming' | 'All' | 'Past'>('Upcoming')
  const [course,     setCourse]     = useState<string>('All')
  const [search,     setSearch]     = useState('')
  const [adding,     setAdding]     = useState(false)
  const [showGrader, setShowGrader] = useState(false)

  const allExams  = data.exams   || []
  const courses   = data.courses || []
  const hubs      = data.study_sessions || []
  const schema    = databases.find(d => d.id === 'exams')?.schema || {}
  const now       = startOfDay(new Date())

  const courseOptions = useMemo(() =>
    ['All', ...Array.from(new Set(allExams.map(e => stripWL(getVal(e, 'Course', 'course'))).filter(Boolean)))],
    [allExams])

  const filtered = useMemo(() => {
    let items = allExams
    if (filter === 'Upcoming') items = items.filter(e => !e.date || new Date(e.date) >= now)
    if (filter === 'Past')     items = items.filter(e => e.date && new Date(e.date) < now)
    if (course !== 'All')      items = items.filter(e => stripWL(getVal(e, 'Course', 'course')) === course)
    if (search.trim())         items = items.filter(e => String(e.title || '').toLowerCase().includes(search.toLowerCase()))
    return [...items].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : Infinity
      const db = b.date ? new Date(b.date).getTime() : Infinity
      return filter === 'Past' ? db - da : da - db
    })
  }, [allExams, filter, course, search])

  const upcoming = allExams.filter(e => e.date && new Date(e.date) >= now)
  const next = upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  // ─────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const exam = useMemo(() => allExams.find(e => e.id === selectedId), [allExams, selectedId])

  React.useEffect(() => {
    if (selectedId && !exam && allExams.length > 0) {
      setSelectedId(null)
    }
  }, [selectedId, exam, allExams, setSelectedId])

  if (selectedId && exam) {

    const grade    = stripWL(getVal(exam, 'Grade', 'grade'))
    const score    = getVal(exam, 'Score', 'score')
    const maxScore = getVal(exam, 'Max Score', 'max_score')
    const examType = stripWL(getVal(exam, 'Type', 'type', 'Exam Type'))
    const examCourse = stripWL(getVal(exam, 'Course', 'course'))
    const isPast   = exam.date && new Date(exam.date) < now
    const daysLeft = getDaysUntil(exam.date)

    // linked hubs for this exam
    const examHubs = hubs.filter(h => {
      const hExam = stripWL(getVal(h, 'exam', 'Exam', 'linked_exam')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
      const hName = String(exam.title || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
      return hExam.includes(hName) && hName !== ''
    })
    const studyHubDone = examHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length
    const totalStudyTime = examHubs.reduce((acc, h) => acc + (getNumVal(h, 'study_time', 'total_time') || 0), 0)

    const extraKeys = Object.keys({ ...schema, ...exam }).filter(k =>
      !INTERNAL.includes(k) && !['Status', 'Grade', 'Score', 'Max Score', 'Type', 'Course', 'date', 'Exam Type', 'Difficulty', 'Confidence'].includes(k))

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">← Exams</button>
            <EditableTitle value={cleanTitle(exam.title)} className="text-2xl font-black uppercase tracking-tight"
              onSave={v => onUpdate('exams', exam.id, { title: v })} />
            <div className="flex items-center gap-3 mt-1">
              {examCourse && <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{examCourse}</span>}
              {examType   && <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase border', typeColorClass(examType))}>{examType}</span>}
              {grade      && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase border', gradeColorClass(grade))}>{grade}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPast && daysLeft !== null && (
              <div className={cn('px-4 py-2 border text-center rounded-[8px]', daysLeft <= 3 ? 'border-foreground bg-[#232326]' : 'border-[#242426] bg-[#1a1a1c]')}>
                <div className="text-2xl font-black text-foreground">{daysLeft}</div>
                <div className="text-[7px] font-black uppercase text-[#a1a1aa]">days</div>
              </div>
            )}
            <button onClick={() => onOpenNote(exam.path || `database/exams/${exam.id}.md`)} className="p-2 text-[#a1a1aa] hover:text-foreground hover:bg-[#232326]/50 rounded-[4px] transition-colors"><BookOpen size={14} /></button>
            <button onClick={() => { onDelete('exams', selectedId); setSelectedId(null) }} className="p-2 text-[#a1a1aa] hover:text-destructive hover:bg-destructive/10 rounded-[4px] transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Score entry if past */}
        {isPast && !grade && (
          <div className="p-5 bg-[#1a1a1c] border border-[#242426] rounded-[8px] space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#a1a1aa]">Enter Your Result</p>
            <div className="grid grid-cols-4 gap-3">
              {GRADES.map(g => (
                <button key={g} onClick={() => onUpdate('exams', exam.id, { Grade: wrapWL(g), Status: wrapWL('Graded') })}
                  className={cn('py-2 border rounded-[6px] text-[10px] font-black uppercase hover:border-foreground/50 hover:bg-[#232326]/50 transition-colors', gradeColorClass(g))}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <BigPropertyCard label="Status" value={getVal(exam, 'Status', 'status') || (isPast ? 'Past' : 'Upcoming')}
            schema={{ type: 'select', source: 'database/exams/status' }} onUpdate={v => onUpdate('exams', exam.id, { Status: v })} />
          <BigPropertyCard label="Date" value={exam.date || ''}
            schema={{ type: 'date' }} onUpdate={v => onUpdate('exams', exam.id, { date: v })} />
          <BigPropertyCard label="Grade" value={grade}
            schema={{ type: 'select', source: 'database/courses/grade' }} onUpdate={v => onUpdate('exams', exam.id, { Grade: v })} />
          <BigPropertyCard label="Course" value={getVal(exam, 'Course', 'course')}
            schema={{ type: 'relation', source: 'database/courses' }} onUpdate={v => onUpdate('exams', exam.id, { Course: v })} />
        </div>

        {/* Preparation tracking */}
        {!isPast && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#a1a1aa]">Preparation</span>
              <button onClick={() => navigateTo('PLANNER')} className="text-[8px] font-black uppercase text-[#a1a1aa] hover:text-foreground">View Hubs →</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border border-[#242426] bg-[#1a1a1c] rounded-[8px]">
                <span className="text-[8px] font-black uppercase text-[#a1a1aa]">Study Hubs Done</span>
                <p className="text-xl font-black mt-1 text-foreground">{studyHubDone} / {examHubs.length}</p>
              </div>
              <div className="p-4 border border-[#242426] bg-[#1a1a1c] rounded-[8px]">
                <span className="text-[8px] font-black uppercase text-[#a1a1aa]">Total Study Time</span>
                <p className="text-xl font-black mt-1 text-foreground">{totalStudyTime > 0 ? `${Math.round(totalStudyTime / 60)}h` : '--'}</p>
              </div>
              <BigPropertyCard label="Confidence" value={getVal(exam, 'Confidence', 'confidence') || ''}
                schema={{ type: 'select', source: 'database/exams/confidence' }} onUpdate={v => onUpdate('exams', exam.id, { Confidence: v })} />
            </div>
            {examHubs.length > 0 && (
              <div className="space-y-1.5">
                {examHubs.map((h, i) => {
                  const done = stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')
                  return (
                    <div key={i} onClick={() => onOpenNote(h.path || `database/study planner/${h.id}.md`)}
                      className={cn('flex items-center gap-3 p-2.5 border rounded-[6px] cursor-pointer hover:border-foreground/45 transition-colors',
                        done ? 'border-[#242426] opacity-50 bg-[#1a1a1c]/50' : 'border-[#242426] bg-[#1a1a1c]')}>
                      <div className={cn('w-3.5 h-3.5 border rounded-[3px] flex items-center justify-center shrink-0', done ? 'bg-foreground border-foreground' : 'border-[#242426]')}>
                        {done && <Check size={8} strokeWidth={4} className="text-background" />}
                      </div>
                      <span className={cn('text-[10px] font-black uppercase flex-1', done && 'line-through text-[#a1a1aa]')}>
                        {cleanTitle(h.title || h.id)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Extra properties */}
        {extraKeys.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {extraKeys.map(key => (
              <BigPropertyCard key={key} label={key} value={exam[key]} schema={schema[key]}
                onUpdate={v => onUpdate('exams', exam.id, { [key]: v })} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Next Exam banner */}
      {next && (
        <div className="mx-6 mt-4 p-4 bg-[#1a1a1c] border border-[#242426] rounded-[8px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Target size={12} className="text-[#a1a1aa]" />
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#a1a1aa]">Next Exam</span>
              <p className="text-[12px] font-black uppercase text-foreground">{cleanTitle(next.title)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-foreground">{differenceInDays(new Date(next.date), now)}</span>
            <p className="text-[8px] font-black uppercase text-[#a1a1aa]">days</p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="px-6 py-3 border-b border-[#242426] flex items-center gap-3 shrink-0 flex-wrap bg-transparent">
        <div className="flex items-center gap-1 bg-[#1a1a1c] border border-[#242426] p-1 rounded-[6px]">
          {(['Upcoming', 'All', 'Past'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-[4px] transition-colors',
                filter === f ? 'bg-[#232326] text-foreground' : 'text-[#a1a1aa] hover:text-foreground')}>
              {f}
            </button>
          ))}
        </div>
        <select value={course} onChange={e => setCourse(e.target.value)}
          className="bg-[#1a1a1c] border border-[#242426] rounded-[6px] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-foreground focus:outline-none cursor-pointer">
          {courseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="flex items-center gap-2 flex-1 bg-[#1a1a1c] border border-[#242426] rounded-[6px] px-3 py-2">
          <Search size={11} className="text-[#a1a1aa]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..."
            className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none text-foreground placeholder:text-muted-foreground/30" />
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-[#a1a1aa] hover:text-foreground border border-[#242426] bg-[#232326]/50 rounded-[6px] text-[8px] font-black uppercase hover:bg-[#232326] transition-colors">
          <Plus size={10} /> Add
        </button>
      </div>

      {adding && (
        <div className="px-6 pt-3 shrink-0">
          <CreateBanner label="Exam" placeholder="e.g. Calculus Midterm"
            onConfirm={name => {
              onCreate('exams', name, { Status: wrapWL('Upcoming'), Type: wrapWL('Midterm') })
              setAdding(false)
            }}
            onCancel={() => setAdding(false)} />
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
        {filtered.length === 0 && !adding && <EmptyState message="No exams found." />}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((exam, idx) => {
            const grade    = stripWL(getVal(exam, 'Grade', 'grade'))
            const examType = stripWL(getVal(exam, 'Type', 'type'))
            const examCourse = stripWL(getVal(exam, 'Course', 'course'))
            const daysLeft = getDaysUntil(exam.date)
            const isPast   = exam.date && new Date(exam.date) < now
            const isUrgent = !isPast && daysLeft !== null && daysLeft <= 7

            return (
              <div key={idx} onClick={() => setSelectedId(exam.id)}
                className={cn('p-5 border rounded-[8px] cursor-pointer flex flex-col gap-3 hover:border-foreground/40 transition-colors',
                  isUrgent ? 'border-[#242426] bg-[#1a1a1c] ring-1 ring-white/10' : 'border-[#242426] bg-[#1a1a1c] hover:bg-[#232326]/30')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {examType && <span className={cn('inline-block px-2 py-0.5 text-[7px] font-black uppercase border rounded-[3px] mb-2', typeColorClass(examType))}>{examType}</span>}
                    <h3 className="text-[13px] font-black uppercase leading-tight text-foreground">{cleanTitle(exam.title)}</h3>
                    {examCourse && <p className="text-[8px] font-black uppercase tracking-widest text-[#a1a1aa]/65 mt-1">{examCourse}</p>}
                  </div>
                  {grade && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase border shrink-0', gradeColorClass(grade))}>{grade}</span>}
                </div>
                <div className="flex items-center justify-between border-t border-[#242426] pt-2">
                  {exam.date && (
                    <span className="text-[9px] font-black uppercase text-muted-foreground">
                      {format(parseISO(exam.date), 'MMM d, yyyy')}
                    </span>
                  )}
                  {!isPast && daysLeft !== null && <CountdownBadge days={daysLeft} />}
                  {isPast && !grade && <span className="text-[8px] font-black uppercase text-[#a1a1aa]/50">Grade?</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
