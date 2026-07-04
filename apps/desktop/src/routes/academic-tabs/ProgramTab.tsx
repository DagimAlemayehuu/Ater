import React, { useState, useMemo } from 'react'
import { CheckCircle, Check, Trash2, Plus, ChevronLeft, ChevronRight, BookOpen, GraduationCap, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { differenceInDays, startOfDay, addDays, isSameDay, startOfWeek, format } from 'date-fns'
import { stripWL, getVal, getBoolVal, getYearOrder, deriveStatus, wrapWL, cleanTitle, calcGPA, gradeColorClass, getDaysUntil } from './utils'
import { SectionHeader, EmptyState, StatCard, AcademicRoadmap, ProgramSetupForm, BigPropertyCard, EditableTitle, CreateBanner } from './SharedComponents'
import type { TabProps } from './types'
import { useNavigate } from 'react-router-dom'
import { sidecarApi } from '@/lib/sidecarApi'
import { usePomodoroStore } from '@/lib/pomodoroStore'

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'Exam': { bg: 'bg-[#ffeedd]/5 border-[#ffccaa]/30', border: 'border-[#ffccaa]/30', text: 'text-[#ffaa66]', dot: 'bg-[#ffaa66]' },
  'Assignment': { bg: 'bg-muted/10 border-border/30', border: 'border-border/30', text: 'text-foreground/80', dot: 'bg-muted-foreground/60' },
  'Study Session': { bg: 'bg-foreground/5 border-foreground/15', border: 'border-foreground/15', text: 'text-foreground/90', dot: 'bg-foreground/70' },
  'Study': { bg: 'bg-foreground/5 border-foreground/15', border: 'border-foreground/15', text: 'text-foreground/90', dot: 'bg-foreground/70' },
  'Practice': { bg: 'bg-foreground/5 border-foreground/15', border: 'border-foreground/15', text: 'text-foreground/90', dot: 'bg-foreground/70' },
  'Note Visit': { bg: 'bg-muted/5 border-border/10', border: 'border-border/10', text: 'text-muted-foreground/75', dot: 'bg-muted-foreground/40' }
};

const INTERNAL_YEAR_KEYS = ['id', 'title', 'path', 'last_synced', 'links', 'created_time', 'last_edited_time']
const INTERNAL_SEM_KEYS  = ['id', 'title', 'path', 'last_synced', 'links', 'created_time', 'last_edited_time', 'Year', 'year']

export default function ProgramTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, onRefresh, initialSelectedId, onClearSelection }: TabProps) {
  const navigate = useNavigate()
  const [selectedYearId, setSelectedYearId]     = useState<string | null>(null)
  const [selectedSemId,  setSelectedSemId]      = useState<string | null>(null)
  const [showSetup,      setShowSetup]          = useState(false)
  const [addingSem,      setAddingSem]          = useState(false)
  const [addingCourse,   setAddingCourse]       = useState(false)
  const [sidebarTab,     setSidebarTab]         = useState<'assignments' | 'exams'>('assignments')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [quickHubName, setQuickHubName]         = useState('')
  const [isAddingHub, setIsAddingHub]           = useState(false)
  const { history: storeHistory }                = usePomodoroStore()
  const [apiStudyHistory, setApiStudyHistory]   = useState<{sessions: any[], telemetry: any[], practice?: any[]}>({sessions: [], telemetry: [], practice: []})

  // Sync external navigation
  React.useEffect(() => {
    if (initialSelectedId) {
      const semestersList = data.semesters || []
      const yearsList = data.years || []
      const isSem = semestersList.some(s => s.id === initialSelectedId)
      if (isSem) {
        setSelectedSemId(initialSelectedId)
        const semItem = semestersList.find(s => s.id === initialSelectedId)
        const parentYearTitle = semItem ? stripWL(getVal(semItem, 'Year', 'year')) : ''
        const parentYear = yearsList.find(y => String(y.title || '').toLowerCase().trim() === parentYearTitle.toLowerCase().trim())
        if (parentYear) {
          setSelectedYearId(parentYear.id)
        }
      } else {
        const isYear = yearsList.some(y => y.id === initialSelectedId)
        if (isYear) {
          setSelectedYearId(initialSelectedId)
          setSelectedSemId(null)
        }
      }
      if (onClearSelection) onClearSelection()
    }
  }, [initialSelectedId, data.semesters, data.years, onClearSelection])

  React.useEffect(() => {
    sidecarApi.getStudyHistory()
      .then(res => setApiStudyHistory(res || { sessions: [], telemetry: [], practice: [] }))
      .catch(() => {})
  }, [data])

  const years     = data.years     || []
  const semesters = data.semesters || []
  const courses   = data.courses   || []
  const assignments = data.assignments || []
  const exams       = data.exams || []
  const hubs        = data.study_sessions || []
  const now         = startOfDay(new Date())
  const yearSchema = databases.find(d => d.id === 'years')?.schema     || {}
  const semSchema  = databases.find(d => d.id === 'semesters')?.schema || {}

  const calendarEvents = useMemo(() => {
    return [
      ...(data?.assignments || []).map(a => ({...a, _type: 'Assignment', _date: a.due_date})),
      ...(data?.exams || []).map(e => ({...e, _type: 'Exam', _date: e.date})),
      ...(storeHistory || []).map(h => ({
        ...h,
        _type: 'Study',
        _date: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
        title: h.type === 'practice' 
          ? `Recall: ${h.score}/${h.totalQuestions}` 
          : h.type === 'note_focus' 
            ? `Note: ${h.notePath?.split(/[/\\]/).pop()?.replace('.md', '') || 'Focus'}`
            : `Session: ${h.hub || 'Focus'}`
      })),
      ...(apiStudyHistory?.sessions || []).map(s => ({
        id: s.id,
        title: `${s.hub_id || 'Focus'} Session`,
        _type: 'Study Session',
        _date: s.timestamp || new Date().toISOString(),
        duration: s.duration_seconds
      })),
      ...(apiStudyHistory?.telemetry || []).map(t => ({
        id: t.id,
        title: `Read: ${t.note_path?.split(/[/\\]/).pop()?.replace('.md', '') || 'Note'}`,
        _type: 'Note Visit',
        _date: t.timestamp || new Date().toISOString(),
        duration: t.duration_seconds
      })),
      ...(apiStudyHistory?.practice || []).map(p => ({
        id: p.id,
        title: `Recall: ${p.note_path?.split(/[/\\]/).pop()?.replace('.md', '') || p.hub_id || 'Quiz'}`,
        _type: 'Practice',
        _date: p.timestamp,
        isCorrect: p.is_correct
      }))
    ]
  }, [data, storeHistory, apiStudyHistory])

  const sorted = useMemo(() => [...years].sort((a, b) => getYearOrder(a?.title || '') - getYearOrder(b?.title || '')), [years])

  const activeYear = years.find(y => getBoolVal(y, 'Current Year', 'current_year') || stripWL(getVal(y, 'Status', 'status')).toLowerCase().includes('active')) || years[0]
  const activeProgram = cleanTitle(stripWL(getVal(activeYear, 'Program', 'program')))

  const programYears = activeProgram
    ? sorted.filter(y => cleanTitle(stripWL(getVal(y, 'Program', 'program'))) === activeProgram)
    : sorted

  const completedYears = programYears.filter(y => stripWL(getVal(y, 'Status', 'status')).toLowerCase().includes('complet')).length
  const targetYears    = parseInt(getVal(activeYear, 'Target Years', 'target_years')) || Math.max(programYears.length, 1)

  const selectedYear = sorted.find(y => y.id === selectedYearId)

  const sem = useMemo(() => semesters.find(s => s.id === selectedSemId), [semesters, selectedSemId])

  React.useEffect(() => {
    if (selectedYearId && !selectedYear && sorted.length > 0) {
      setSelectedYearId(null)
    }
  }, [selectedYearId, selectedYear, sorted])

  React.useEffect(() => {
    if (selectedSemId && !sem && semesters.length > 0) {
      setSelectedSemId(null)
    }
  }, [selectedSemId, sem, semesters])

  const relatedSemesters = useMemo(() => semesters
    .filter(s => {
      const semYear   = getVal(s, 'Year', 'year').toLowerCase().trim()
      const targetYear = String(selectedYear?.title || '').toLowerCase().trim()
      return semYear === targetYear && targetYear !== ''
    })
    .sort((a, b) => {
      const order = ['Autumn', 'Fall', 'Winter', 'Spring', 'Summer']
      const ai = order.findIndex(o => String(a.title || '').includes(o))
      const bi = order.findIndex(o => String(b.title || '').includes(o))
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    }), [semesters, selectedYear])

  // ── Scaffold new program ──────────────────────────────────────────────────
  const handleScaffold = async (name: string, numYears: number, level: string, currentIdx: number) => {
    try {
      const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
      await Promise.all(Array.from({ length: numYears }, (_, i) =>
        onCreate('years', `Year ${romans[i] || (i + 1)}`, {
          Program:          wrapWL(name),
          'Academic Level': wrapWL(level),
          Status:           wrapWL(i < currentIdx ? 'Completed' : i === currentIdx ? 'Active' : 'Planned'),
          'Current Year':   i === currentIdx,
          'Target Years':   numYears,
          'Earned Credits': 0,
          'Target Credits': 0,
          'Cumulative GPA': 0,
        })
      ))
      toast.success(`Program "${name}" deployed!`)
      onRefresh()
    } catch { toast.error('Scaffolding failed') }
  }

  // ── Set current year ───────────────────────────────────────────────────────
  const handleSetCurrentYear = async (id: string) => {
    try {
      await Promise.all(years.map(y => onUpdate('years', y.id, { 'Current Year': y.id === id })))
      toast.success('Active year set')
      onRefresh()
    } catch { toast.error('Failed') }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEMESTER DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedSemId && sem) {
    const semCourses = courses.filter(c => {
      const cSem = getVal(c, 'Semester', 'semester').toLowerCase()
      const tSem = String(sem.title || '').toLowerCase()
      return cSem.includes(tSem) && tSem !== ''
    })
    const totalCredits = semCourses.reduce((acc, c) => acc + (parseFloat(getVal(c, 'Credits', 'credits')) || 0), 0)
    const semGPA = calcGPA(semCourses.filter(c => getVal(c, 'Grade', 'grade')))
    const extraKeys = Object.keys({ ...semSchema, ...sem })
      .filter(k => !INTERNAL_SEM_KEYS.includes(k) && !['Status', 'status'].includes(k))

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedSemId(null)}
              className="text-[8px] font-black uppercase tracking-widest text-foreground/50 mb-2">
              ← {selectedYear?.title || 'Year'}
            </button>
            <EditableTitle value={sem.title} className="text-2xl font-black uppercase tracking-tight"
              onSave={v => onUpdate('semesters', sem.id, { title: v })} />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
              {activeProgram} · {cleanTitle(selectedYear?.title || '')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenNote(sem.path || `database/semesters/${sem.id}.md`)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10" title="Open Note">
              <BookOpen size={13} />
            </button>
            <button onClick={() => { onDelete('semesters', selectedSemId); setSelectedSemId(null) }}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <BigPropertyCard label="Status" value={sem.Status || sem.status || 'Active'}
            schema={semSchema['Status']} onUpdate={v => onUpdate('semesters', sem.id, { Status: v })} />
          <StatCard label="Total Credits" value={totalCredits} />
          <StatCard label="Courses"       value={semCourses.length} />
          <StatCard label="Semester GPA"  value={semGPA !== '--' ? semGPA : '--'} />
        </div>

        {/* Other properties */}
        {extraKeys.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {extraKeys.map(key => (
              <BigPropertyCard key={key} label={key} value={sem[key]} schema={semSchema[key]}
                onUpdate={v => onUpdate('semesters', sem.id, { [key]: v })} />
            ))}
          </div>
        )}

        {/* Courses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="Courses" count={semCourses.length} />
            <button onClick={() => setAddingCourse(true)}
              className="flex items-center gap-1 px-2 py-1 text-foreground border border-border bg-background text-[8px] font-black uppercase hover:border-foreground/50">
              <Plus size={8} /> Add
            </button>
          </div>
          {addingCourse && (
            <CreateBanner label="Course"
              onConfirm={name => {
                onCreate('courses', name, { Semester: wrapWL(sem.title), Status: wrapWL('Active') })
                setAddingCourse(false)
              }}
              onCancel={() => setAddingCourse(false)} />
          )}
          {semCourses.length === 0 && !addingCourse && <EmptyState message="No courses linked to this semester." />}
          <div className="grid grid-cols-3 gap-4">
            {semCourses.map((c, idx) => (
              <div key={idx} onClick={() => navigateTo('COURSES', c.id)}
                className="p-5 border border-border bg-bento-card rounded-[8px] cursor-pointer hover:bg-bento-item/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/65">Course</span>
                  <span className="text-[9px] font-black text-foreground">{getVal(c, 'Credits', 'credits')} CR</span>
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-foreground">{cleanTitle(c.title)}</h3>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mt-1">{getVal(c, 'Status', 'status')}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // YEAR DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedYearId && selectedYear) {
    const earnedCredits = getVal(selectedYear, 'Earned Credits', 'earned_credits') || '0'
    const targetCredits = getVal(selectedYear, 'Target Credits', 'target_credits') || '0'
    const gpa           = getVal(selectedYear, 'Cumulative GPA', 'cumulative_gpa') || '--'
    const level         = getVal(selectedYear, 'Academic Level', 'academic_level')
    const derived       = deriveStatus(relatedSemesters)
    const currentStatus = stripWL(getVal(selectedYear, 'Status', 'status'))
    const isCurrentYear = getBoolVal(selectedYear, 'Current Year', 'current_year')

    const extraKeys = Object.keys({ ...yearSchema, ...selectedYear })
      .filter(k => !INTERNAL_YEAR_KEYS.includes(k) &&
        !['Status', 'status', 'Academic Level', 'academic_level',
          'Earned Credits', 'earned_credits', 'Target Credits', 'target_credits',
          'Current Year', 'current_year', 'Program', 'program', 'Target Years', 'target_years',
          'Cumulative GPA', 'cumulative_gpa'].includes(k))

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedYearId(null)}
              className="text-[8px] font-black uppercase tracking-widest text-foreground/50 mb-2">← Program</button>
            <EditableTitle value={selectedYear.title} className="text-2xl font-black uppercase tracking-tighter mb-1"
              onSave={v => onUpdate('years', selectedYear.id, { title: v })} />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
              {activeProgram} · {cleanTitle(level)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isCurrentYear && (
              <button onClick={() => handleSetCurrentYear(selectedYearId)}
                className="px-3 py-1.5 border border-border bg-bento-item/50 rounded-[4px] text-[8px] font-black uppercase text-foreground hover:bg-bento-item transition-colors">
                Set Active
              </button>
            )}
            {derived === 'Completed' && !currentStatus.toLowerCase().includes('complet') && (
              <button onClick={() => onUpdate('years', selectedYearId, { Status: '[[Completed]]' })}
                className="px-3 py-1.5 bg-bento-item/50 border border-border rounded-[4px] text-[8px] font-black uppercase text-foreground hover:bg-bento-item transition-colors">
                Mark Complete
              </button>
            )}
            <button onClick={() => onOpenNote(selectedYear.path || `database/years/${selectedYear.id}.md`)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-bento-item/50 rounded-[4px] transition-colors">
              <BookOpen size={13} />
            </button>
            <button onClick={() => { onDelete('years', selectedYearId); setSelectedYearId(null) }}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[4px] transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <BigPropertyCard label="Status" value={selectedYear.Status || selectedYear.status || 'Planned'}
            schema={yearSchema['Status']} onUpdate={v => onUpdate('years', selectedYearId, { Status: v })} />
          <StatCard label="Credits" value={`${earnedCredits} / ${targetCredits}`} />
          <StatCard label="Cumulative GPA" value={gpa} />
          <StatCard label="Semesters" value={relatedSemesters.length} />
        </div>

        {extraKeys.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {extraKeys.map(key => (
              <BigPropertyCard key={key} label={key} value={selectedYear[key]} schema={yearSchema[key]}
                onUpdate={v => onUpdate('years', selectedYearId, { [key]: v })} />
            ))}
          </div>
        )}

        {/* Semesters */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title="Semesters" count={relatedSemesters.length} />
            <button onClick={() => setAddingSem(true)}
              className="flex items-center gap-1 px-2 py-1 text-foreground border border-border bg-background text-[8px] font-black uppercase hover:border-foreground/50">
              <Plus size={8} /> Add
            </button>
          </div>
          {addingSem && (
            <CreateBanner label="Semester"
              placeholder="e.g. Autumn 2024"
              onConfirm={name => {
                onCreate('semesters', name, { Year: wrapWL(selectedYear.title), Status: wrapWL('Planned') })
                setAddingSem(false)
              }}
              onCancel={() => setAddingSem(false)} />
          )}
          {relatedSemesters.length === 0 && !addingSem && <EmptyState message="No semesters yet. Add one above." />}
          <div className="flex flex-col gap-2">
            {relatedSemesters.map((s, idx) => {
              const sStatus  = stripWL(getVal(s, 'Status', 'status'))
              const isActive = sStatus.toLowerCase().includes('active')
              const isDone   = sStatus.toLowerCase().includes('complet')
              const semCourses = courses.filter(c => {
                const cSem = getVal(c, 'Semester', 'semester').toLowerCase()
                return cSem.includes(String(s.title || '').toLowerCase()) && String(s.title || '') !== ''
              })
              return (
                <div key={idx} onClick={() => setSelectedSemId(s.id)}
                  className="flex items-center justify-between p-4 border border-border bg-bento-card rounded-[8px] cursor-pointer hover:bg-bento-item/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-5 h-5 border rounded-[4px] flex items-center justify-center text-[8px] font-black shrink-0',
                      isDone ? 'border-primary bg-primary text-primary-foreground' :
                      isActive ? 'border-muted-foreground text-foreground bg-bento-item' : 'border-border text-muted-foreground')}>
                      {isDone ? <Check size={9} strokeWidth={4} /> : idx + 1}
                    </div>
                    <div>
                      <span className="text-[12px] font-black uppercase text-foreground">{cleanTitle(s.title)}</span>
                      <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/65">{sStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[8px] font-black uppercase text-muted-foreground">{semCourses.length} courses</span>
                    <ChevronRight size={11} className="text-muted-foreground" />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROGRAM OVERVIEW
  // ─────────────────────────────────────────────────────────────────────────
  const activeSem = semesters.find(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase().includes('active'))
  const activeCourses = courses.filter(c => {
    const isNotDone = !stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet')
    const cSem = getVal(c, 'Semester', 'semester').toLowerCase()
    const inActiveSem = activeSem ? cSem.includes(String(activeSem.title || '').toLowerCase()) : false
    return isNotDone && inActiveSem
  })

  const toggleAssignment = async (a: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const isDone = a.done === true || a.done === 'true' ||
      stripWL(getVal(a, 'Status', 'status')).toLowerCase().includes('complet')
    try {
      await onUpdate('assignments', a.id, { done: !isDone, Status: wrapWL(isDone ? 'In Progress' : 'Completed') })
      toast.success('Assignment updated')
    } catch {
      toast.error('Update failed')
    }
  }

  const toggleHub = async (hub: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const statusStr = stripWL(getVal(hub, 'status', 'Status')).toLowerCase()
    const isDone = statusStr.includes('complet')
    try {
      await onUpdate('study planner', hub.id, { status: wrapWL(isDone ? 'Active' : 'Completed') })
      toast.success('Study hub updated')
    } catch {
      toast.error('Update failed')
    }
  }

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i))

  const pendingAssignments = assignments.filter(a => !(a.done === true || a.done === 'true')).slice(0, 5)
  const activeHubs = hubs.filter(h => !stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).slice(0, 5)
  const upcomingExams = exams
    .filter(e => {
      const examDate = e.date ? new Date(e.date) : null
      return examDate && differenceInDays(examDate, now) >= 0
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-10 pb-24 space-y-10">
        {programYears.length === 0 || showSetup ? (
          <>
            {showSetup && <button onClick={() => setShowSetup(false)} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground mb-6 transition-colors">← Back to Overview</button>}
            <ProgramSetupForm onScaffold={(n, y, l, c) => { handleScaffold(n, y, l, c); setShowSetup(false) }} />
          </>
        ) : (
          <div className="space-y-10">
            {/* Program Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">Academic Program</p>
                <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">{activeProgram || 'Your Program'}</h1>
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 block mt-1">
                  {cleanTitle(getVal(activeYear, 'Academic Level', 'academic_level'))}
                </span>
              </div>
              <button 
                onClick={() => setShowSetup(true)}
                className="h-7 px-3 bg-muted/20 text-[9px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/40 border border-border/40 hover:border-foreground/30 rounded-[8px] transition-all font-sans"
              >
                Edit Program
              </button>
            </div>

            {/* All Years (Micro Pills) */}
            <div className="flex gap-2 flex-wrap">
              {programYears.map((y, idx) => {
                const status = stripWL(getVal(y, 'Status', 'status'))
                const isDone = status.toLowerCase().includes('complet')
                const isActive = getBoolVal(y, 'Current Year', 'current_year')
                return (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedYearId(y.id)}
                    className={cn('px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border rounded-[4px] transition-all flex items-center gap-1.5 cursor-pointer font-sans',
                      isActive 
                       ? 'border-foreground/35 bg-bento-item text-foreground ring-1 ring-inset ring-foreground/5' 
                       : 'border-border/40 bg-bento-card text-muted-foreground/55 hover:text-foreground hover:bg-bento-item/20')}
                  >
                    <span>{cleanTitle(y.title)}</span>
                    {isActive && <div className="w-1.5 h-1.5 bg-foreground rounded-full" />}
                    {isDone && <CheckCircle size={8} className="text-foreground/70" />}
                  </button>
                )
              })}
            </div>

            {/* Minimized Flex Stats Cards */}
            <div className="flex gap-3 flex-wrap">
              {activeYear && (
                <div 
                  onClick={() => setSelectedYearId(activeYear.id)}
                  className="px-3 py-1.5 border border-border bg-bento-card hover:bg-bento-item/30 rounded-[6px] transition-all cursor-pointer flex flex-col gap-0.5"
                >
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/50">Active Year</span>
                  <span className="text-[10px] font-black uppercase text-foreground leading-tight">{cleanTitle(activeYear.title)}</span>
                </div>
              )}
              {activeSem && (
                <div 
                  onClick={() => setSelectedSemId(activeSem.id)}
                  className="px-3 py-1.5 border border-border bg-bento-card hover:bg-bento-item/30 rounded-[6px] transition-all cursor-pointer flex flex-col gap-0.5"
                >
                  <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/50">Active Semester</span>
                  <span className="text-[10px] font-black uppercase text-foreground leading-tight">{cleanTitle(activeSem.title)}</span>
                </div>
              )}
              <div className="px-3 py-1.5 border border-border bg-bento-card rounded-[6px] flex flex-col gap-0.5 select-none">
                <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/50">Cumulative GPA</span>
                <span className="text-[10px] font-black uppercase text-foreground leading-tight">{getVal(activeYear, 'Cumulative GPA', 'cumulative_gpa') || '--'}</span>
              </div>
            </div>

            {/* Comprehensive Academic Life Hub Grid */}
            <div className="grid grid-cols-3 gap-8 items-start">
              {/* Left Column: Calendar & Planner */}
              <div className="col-span-2 space-y-8">
                {/* Week Calendar */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <SectionHeader title="Weekly Calendar" />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center p-1 bg-muted/20 rounded-[6px] border border-border/40">
                        <button 
                          onClick={() => setCurrentWeekStart(prev => addDays(prev, -7))} 
                          className="w-5 h-5 flex items-center justify-center rounded-[4px] hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer font-sans"
                        >
                          <ChevronLeft size={12}/>
                        </button>
                        <div className="w-px h-3 bg-border/40 mx-1" />
                        <button 
                          onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} 
                          className="px-2 h-5 text-[7px] font-black uppercase tracking-widest rounded-[4px] hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer font-sans"
                        >
                          Today
                        </button>
                        <div className="w-px h-3 bg-border/40 mx-1" />
                        <button 
                          onClick={() => setCurrentWeekStart(prev => addDays(prev, 7))} 
                          className="w-5 h-5 flex items-center justify-center rounded-[4px] hover:bg-muted/40 text-muted-foreground/60 hover:text-foreground transition-all cursor-pointer font-sans"
                        >
                          <ChevronRight size={12}/>
                        </button>
                      </div>
                      <button 
                        onClick={() => navigate('/calendar')} 
                        className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans pl-2"
                      >
                        Open Full Calendar →
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, dayIdx) => {
                      const dayEvents = calendarEvents.filter(e => e._date && isSameDay(new Date(e._date), day))
                      const isTodayDay = isSameDay(day, now)

                      // Sort events: Exams first (10), pending assignments (8), sessions/practices (6), done assignments (4), note visits (2)
                      const sortedEvents = [...dayEvents].sort((a, b) => {
                        const score = (ev: any) => {
                          if (ev._type === 'Exam') return 10;
                          if (ev._type === 'Assignment' && !ev.done) return 8;
                          if (ev._type === 'Study Session' || ev._type === 'Study' || ev._type === 'Practice') return 6;
                          if (ev._type === 'Assignment' && ev.done) return 4;
                          return 2; // Note Visit
                        }
                        return score(b) - score(a);
                      });

                      const maxVisible = 3;
                      const visibleEvents = sortedEvents.slice(0, maxVisible);
                      const extraCount = dayEvents.length - maxVisible;

                      return (
                        <div key={dayIdx} className={cn("p-3 border rounded-[8px] flex flex-col gap-2 min-w-0 transition-all",
                          isTodayDay 
                            ? "bg-foreground/5 border-foreground/35 ring-1 ring-inset ring-foreground/10" 
                            : "bg-bento-card border-border hover:bg-bento-item/10")}>
                          <div className="flex justify-between items-baseline shrink-0">
                            <span className={cn("text-[8px] font-black uppercase tracking-widest", isTodayDay ? "text-foreground" : "text-muted-foreground/45")}>
                              {format(day, 'EEE')}
                            </span>
                            <span className={cn("text-[11px] font-black leading-none", isTodayDay ? "text-foreground" : "text-muted-foreground/75")}>
                              {format(day, 'd')}
                            </span>
                          </div>
                          <div className="flex-1 flex flex-col gap-1 min-h-[110px] overflow-y-auto custom-scrollbar-mini pr-0.5">
                            {visibleEvents.map((ev, idx) => {
                              const style = EVENT_COLORS[ev._type] || EVENT_COLORS['Note Visit']
                              const isClickable = ev._type === 'Assignment' || ev._type === 'Exam' || ev._type === 'Note Visit' || ev._type === 'Study' || ev._type === 'Study Session'
                              
                              return (
                                <div 
                                  key={idx} 
                                  onClick={() => {
                                    const evAny = ev as any
                                    if (evAny._type === 'Assignment') navigateTo('ASSIGNMENTS', evAny.id);
                                    else if (evAny._type === 'Exam') navigateTo('EXAMS', evAny.id);
                                    else if (evAny._type === 'Note Visit' && evAny.id) onOpenNote(evAny.id);
                                    else if (evAny._type === 'Study' && evAny.notePath) onOpenNote(evAny.notePath);
                                    else if (evAny._type === 'Study Session' && evAny.hub_id) navigateTo('PLANNER', evAny.hub_id);
                                  }}
                                  className={cn("text-[7.5px] font-black uppercase truncate px-1 py-0.5 rounded-[3px] border select-none leading-normal flex items-center gap-1", 
                                    style.bg, style.border, style.text,
                                    isClickable ? "cursor-pointer hover:bg-muted/25 hover:border-foreground/30 transition-colors" : "cursor-default")}
                                  title={`${ev._type}: ${cleanTitle(ev.title)}`}
                                >
                                  <span className="truncate">{cleanTitle(ev.title)}</span>
                                </div>
                              )
                            })}
                            
                            {extraCount > 0 && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/calendar');
                                }}
                                className="text-[7px] font-black uppercase text-muted-foreground/60 hover:text-foreground hover:bg-muted/10 px-1 py-0.5 rounded transition-all mt-auto w-fit text-left font-mono select-none"
                              >
                                + {extraCount} more
                              </button>
                            )}

                            {dayEvents.length === 0 && (
                              <span className="text-[6px] font-black uppercase tracking-widest text-muted-foreground/20 mt-auto select-none">No Events</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* Study Planner Checklist */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <SectionHeader title="Study Planner" count={activeHubs.length} />
                    <button onClick={() => navigateTo('PLANNER')} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans">
                      Open Full Planner →
                    </button>
                  </div>
                  {activeHubs.length === 0 ? (
                    <div className="p-5 border border-border bg-bento-card rounded-[8px] text-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2">No active study hubs</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {activeHubs.map((hub, idx) => {
                        const isDone = stripWL(getVal(hub, 'status', 'Status')).toLowerCase().includes('complet')
                        return (
                          <div key={idx} onClick={() => navigateTo('PLANNER', hub.id)}
                            className="p-3 border border-border bg-bento-card hover:bg-bento-item/20 rounded-[8px] transition-colors flex items-center justify-between cursor-pointer gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <button onClick={(e) => toggleHub(hub, e)}
                                className={cn("w-4 h-4 border rounded-[3px] flex items-center justify-center shrink-0 transition-colors bg-[#18181a]",
                                  isDone ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
                              >
                                {isDone && <Check size={9} strokeWidth={4} className="text-background" />}
                              </button>
                              <span className={cn("text-[10px] font-black uppercase truncate text-foreground/90", isDone && "line-through text-muted-foreground")}>{cleanTitle(hub.title || hub.id)}</span>
                            </div>
                            <ChevronRight size={10} className="text-muted-foreground/30 shrink-0" />
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Quick Add Hub */}
                  <div className="mt-3">
                    {isAddingHub ? (
                      <div className="flex gap-2 p-2 border border-border bg-bento-item/10 rounded-[8px]">
                        <input 
                          type="text" 
                          value={quickHubName}
                          onChange={e => setQuickHubName(e.target.value)}
                          placeholder="New hub title..."
                          className="flex-1 bg-transparent text-[10px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/30"
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && quickHubName.trim()) {
                              try {
                                await onCreate('study planner', quickHubName.trim(), { status: wrapWL('Active') })
                                toast.success('Study hub created')
                                setQuickHubName('')
                                setIsAddingHub(false)
                                onRefresh()
                              } catch {
                                toast.error('Failed to create')
                              }
                            }
                          }}
                        />
                        <button 
                          onClick={() => { setIsAddingHub(false); setQuickHubName('') }}
                          className="text-[8px] font-black uppercase text-muted-foreground/60 hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsAddingHub(true)}
                        className="w-full py-2.5 border border-dashed border-border/60 hover:border-foreground/30 rounded-[8px] flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
                      >
                        <Plus size={10} /> Add New Study Hub
                      </button>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Courses, Combined Tasks & Exams */}
              <div className="space-y-6">
                {/* Active Courses */}
                {activeCourses.length > 0 && (
                  <section className="p-5 border border-border bg-bento-card rounded-[8px] space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Active Courses</h3>
                      <button onClick={() => navigateTo('COURSES')} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans">
                        All →
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {activeCourses.map((c, idx) => {
                        const grade       = stripWL(getVal(c, 'Grade', 'grade'))
                        const credits     = getVal(c, 'Credits', 'credits')
                        const semester    = stripWL(getVal(c, 'Semester', 'semester'))
                        const courseTitleNorm = String(c.title || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
                        
                        const cAssign     = assignments.filter(a => {
                          const aCourse = stripWL(getVal(a, 'Course', 'course')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
                          return aCourse && (aCourse.includes(courseTitleNorm) || courseTitleNorm.includes(aCourse));
                        });
                        const pendingCt   = cAssign.filter(a => !a.done).length

                        const cExams      = exams.filter(e => {
                          const eCourse = stripWL(getVal(e, 'Course', 'course')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
                          return eCourse && (eCourse.includes(courseTitleNorm) || courseTitleNorm.includes(eCourse));
                        });
                        const nextEx      = cExams.filter(e => e.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
                        const daysToExam  = nextEx?.date ? differenceInDays(new Date(nextEx.date), now) : null

                        return (
                          <div key={idx} onClick={() => navigateTo('COURSES', c.id)}
                            className="p-3 border border-border bg-bento-item/25 hover:bg-bento-item/50 rounded-[6px] transition-colors flex flex-col gap-2 cursor-pointer font-sans">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10.5px] font-black uppercase truncate text-foreground/90 leading-tight">{cleanTitle(c.title)}</span>
                              {grade && <span className={cn('px-1.5 py-0.5 text-[7px] font-black uppercase border shrink-0', gradeColorClass(grade))}>{grade}</span>}
                            </div>
                            <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-muted-foreground/60">
                              <span>{semester} · {credits} CR</span>
                              {pendingCt > 0 ? (
                                <span className="text-foreground">{pendingCt} due</span>
                              ) : daysToExam !== null && daysToExam >= 0 ? (
                                <span className={daysToExam <= 7 ? 'text-foreground' : 'text-muted-foreground/50'}>exam in {daysToExam}d</span>
                              ) : (
                                <span className="text-muted-foreground/30">Clear</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* Combined Tasks & Exams Card */}
                <section className="p-5 border border-border bg-bento-card rounded-[8px] space-y-4">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSidebarTab('assignments')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          sidebarTab === 'assignments' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Assignments
                      </button>
                      <button 
                        onClick={() => setSidebarTab('exams')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          sidebarTab === 'exams' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Exams
                      </button>
                    </div>
                    <button 
                      onClick={() => navigateTo(sidebarTab === 'assignments' ? 'ASSIGNMENTS' : 'EXAMS')} 
                      className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans"
                    >
                      Open →
                    </button>
                  </div>

                  {/* Tab Body */}
                  {sidebarTab === 'assignments' ? (
                    <div>
                      {pendingAssignments.length === 0 ? (
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans">No pending assignments</p>
                      ) : (
                        <div className="space-y-2">
                          {pendingAssignments.map((a, idx) => {
                            const daysLeft = getDaysUntil(a.due_date)
                            return (
                              <div key={idx} onClick={() => navigateTo('ASSIGNMENTS', a.id)}
                                className="p-3 border border-border bg-bento-item/25 hover:bg-bento-item/50 rounded-[6px] transition-colors flex items-center justify-between cursor-pointer gap-2 font-sans">
                                <div className="flex items-center gap-2 min-w-0">
                                  <button onClick={(e) => toggleAssignment(a, e)}
                                    className={cn("w-4 h-4 border rounded-[3px] flex items-center justify-center shrink-0 transition-colors bg-[#18181a]",
                                      a.done ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
                                  >
                                    {a.done && <Check size={9} strokeWidth={4} className="text-background" />}
                                  </button>
                                  <span className="text-[10px] font-black uppercase truncate text-foreground/90">{cleanTitle(a.title)}</span>
                                </div>
                                {daysLeft !== null && (
                                  <span className={cn("text-[7px] font-black uppercase px-1.5 py-0.5 rounded-[4px] border shrink-0",
                                    daysLeft < 0 
                                      ? "bg-foreground text-background border-foreground font-black" 
                                      : daysLeft <= 3 
                                        ? "bg-[#18181a] border-foreground/30 text-foreground" 
                                        : "bg-[#18181a] border-border text-muted-foreground/60"
                                  )}>
                                    {daysLeft < 0 ? "Late" : `${daysLeft}d`}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {upcomingExams.length === 0 ? (
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans">No upcoming exams</p>
                      ) : (
                        <div className="space-y-2">
                          {upcomingExams.map((e, idx) => {
                            const daysLeft = differenceInDays(new Date(e.date), now)
                            return (
                              <div key={idx} onClick={() => navigateTo('EXAMS', e.id)}
                                className="p-3 border border-border bg-bento-item/25 hover:bg-bento-item/50 rounded-[6px] transition-colors flex items-center justify-between cursor-pointer gap-2 font-sans">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[10px] font-black uppercase truncate text-foreground/90">{cleanTitle(e.title)}</span>
                                  <span className="text-[7px] font-black uppercase text-muted-foreground/45 mt-0.5">
                                    {format(new Date(e.date), 'MMM d')}
                                  </span>
                                </div>
                                <span className={cn("text-[7px] font-black uppercase px-1.5 py-0.5 rounded-[4px] border shrink-0",
                                  daysLeft <= 3 
                                    ? "bg-foreground text-background border-foreground font-black" 
                                    : "bg-[#18181a] border-border text-muted-foreground/60"
                                )}>
                                  {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
