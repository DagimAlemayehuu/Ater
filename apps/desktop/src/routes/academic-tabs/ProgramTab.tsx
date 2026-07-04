import React, { useState, useMemo } from 'react'
import { CheckCircle, Check, Trash2, Plus, ChevronLeft, ChevronRight, BookOpen, GraduationCap, Calendar, Clock, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { differenceInDays, startOfDay, addDays, isSameDay, startOfWeek, format } from 'date-fns'
import { stripWL, getVal, getBoolVal, getYearOrder, deriveStatus, wrapWL, cleanTitle, calcGPA, gradeColorClass, getDaysUntil } from './utils'
import { invoke } from '@tauri-apps/api/core'
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
  const [sidebarTab,     setSidebarTab]         = useState<'assignments' | 'exams' | 'notebooklm'>('assignments')
  const [notebooks, setNotebooks]               = useState<any[]>([])
  const [sidecarPort, setSidecarPort]           = useState<number>(8765)
  const [sidecarToken, setSidecarToken]         = useState<string>('')
  
  // Tab control state
  const [leftBottomTab, setLeftBottomTab]       = useState<'courses' | 'planner' | 'practice'>('courses')
  const [activeCoursesTab, setActiveCoursesTab] = useState<'hubs' | 'inbox' | 'pdf'>('hubs')
  const [inboxFiles, setInboxFiles]             = useState<any[]>([])
  const [pdfFiles, setPdfFiles]                 = useState<any[]>([])

  // Courses search/filter/sort/add/edit states
  const [coursesSearch, setCoursesSearch]       = useState('')
  const [coursesSort, setCoursesSort]           = useState<'title' | 'credits' | 'grade'>('title')
  const [coursesFilter, setCoursesFilter]       = useState<string>('All')
  const [isAddingCourse, setIsAddingCourse]     = useState(false)
  const [newCourseName, setNewCourseName]       = useState('')
  const [newCourseCredits, setNewCourseCredits] = useState('4')
  const [newCourseSem, setNewCourseSem]         = useState('')
  
  // Planner search/filter/sort/add/edit states
  const [plannerSearch, setPlannerSearch]       = useState('')
  const [plannerSort, setPlannerSort]           = useState<'title' | 'unit' | 'course'>('title')
  const [plannerFilter, setPlannerFilter]       = useState<'Active' | 'All' | 'Completed'>('Active')
  const [isAddingPlannerHub, setIsAddingPlannerHub] = useState(false)
  const [newHubName, setNewHubName]             = useState('')
  const [newHubCourse, setNewHubCourse]         = useState('')
  const [newHubUnit, setNewHubUnit]             = useState('')

  // Practice search/sort states
  const [practiceSearch, setPracticeSearch]     = useState('')
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

  const loadStudyHistory = () => {
    sidecarApi.getStudyHistory()
      .then(res => setApiStudyHistory(res || { sessions: [], telemetry: [], practice: [] }))
      .catch(() => {})
  }

  const handleDeletePractice = async (path: string) => {
    try {
      await sidecarApi.deletePractice(path)
      toast.success('Practice session deleted')
      loadStudyHistory()
    } catch {
      toast.error('Failed to delete practice session')
    }
  }

  React.useEffect(() => {
    loadStudyHistory()

    sidecarApi.aterListInbox()
      .then(res => setInboxFiles(res?.files || []))
      .catch(err => console.error("Error fetching inbox:", err))

    sidecarApi.listObsidianFiles()
      .then(res => {
        const allFiles = res?.files || []
        const pdfs = allFiles.filter((f: any) => !f.is_dir && f.path.toLowerCase().endsWith('.pdf'))
        setPdfFiles(pdfs)
      })
      .catch(err => console.error("Error fetching vault files:", err))
  }, [data])

  // Fetch Tauri sidecar config
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const port = await invoke<number>('get_sidecar_port').catch(() => 8765)
        const token = await invoke<string>('get_sidecar_token').catch(() => '')
        setSidecarPort(port)
        setSidecarToken(token)
      } catch (err) {
        console.error('Error fetching sidecar config in ProgramTab:', err)
      }
    }
    fetchConfig()
  }, [])

  // Fetch notebooks list when sidecar is configured
  React.useEffect(() => {
    if (!sidecarPort) return
    const fetchNotebooks = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${sidecarPort}/api/notebooklm/notebooks`, {
          headers: { 'X-Ater-Token': sidecarToken }
        })
        if (res.ok) {
          const data = await res.json()
          setNotebooks(data || [])
        }
      } catch (err) {
        console.error('Error loading notebooks in ProgramTab:', err)
      }
    }
    fetchNotebooks()
  }, [sidecarPort, sidecarToken])

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

  // ─── Filter, Sort & Search Listings for Bottom Left container ───
  const displayedCourses = useMemo(() => {
    let list = courses
    
    if (coursesSearch.trim()) {
      const q = coursesSearch.toLowerCase()
      list = list.filter(c => cleanTitle(c.title).toLowerCase().includes(q))
    }
    
    if (coursesFilter !== 'All') {
      list = list.filter(c => {
        const sem = stripWL(getVal(c, 'Semester', 'semester'))
        return sem.toLowerCase() === coursesFilter.toLowerCase()
      })
    }
    
    list = [...list].sort((a, b) => {
      if (coursesSort === 'credits') {
        const credA = parseFloat(getVal(a, 'Credits', 'credits')) || 0
        const credB = parseFloat(getVal(b, 'Credits', 'credits')) || 0
        return credB - credA
      }
      if (coursesSort === 'grade') {
        const gradeA = stripWL(getVal(a, 'Grade', 'grade')) || 'F'
        const gradeB = stripWL(getVal(b, 'Grade', 'grade')) || 'F'
        return gradeA.localeCompare(gradeB)
      }
      return cleanTitle(a.title).localeCompare(cleanTitle(b.title))
    })
    
    return list
  }, [courses, coursesSearch, coursesFilter, coursesSort])

  const displayedHubs = useMemo(() => {
    let list = hubs
    
    if (plannerSearch.trim()) {
      const q = plannerSearch.toLowerCase()
      list = list.filter(h => cleanTitle(h.title).toLowerCase().includes(q))
    }
    
    if (plannerFilter === 'Active') {
      list = list.filter(h => !stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet'))
    } else if (plannerFilter === 'Completed') {
      list = list.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet'))
    }
    
    list = [...list].sort((a, b) => {
      if (plannerSort === 'unit') {
        const unitA = getVal(a, 'unit', 'Unit') || ''
        const unitB = getVal(b, 'unit', 'Unit') || ''
        return unitA.localeCompare(unitB)
      }
      if (plannerSort === 'course') {
        const courseA = stripWL(getVal(a, 'course', 'Course')) || ''
        const courseB = stripWL(getVal(b, 'course', 'Course')) || ''
        return courseA.localeCompare(courseB)
      }
      return cleanTitle(a.title).localeCompare(cleanTitle(b.title))
    })
    
    return list
  }, [hubs, plannerSearch, plannerFilter, plannerSort])

  const displayedPractices = useMemo(() => {
    let list = apiStudyHistory?.practice || []
    if (practiceSearch.trim()) {
      const q = practiceSearch.toLowerCase()
      list = list.filter((p: any) => {
        const title = p.title || p.note_path?.split('/').pop()?.replace('.md', '') || 'Practice Session'
        return title.toLowerCase().includes(q)
      })
    }
    return list
  }, [apiStudyHistory?.practice, practiceSearch])
  const activeHubs = hubs.filter(h => !stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).slice(0, 5)
  const upcomingExams = exams
    .filter(e => {
      const examDate = e.date ? new Date(e.date) : null
      return examDate && differenceInDays(examDate, now) >= 0
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8 pb-16 space-y-6">
        {programYears.length === 0 || showSetup ? (
          <>
            {showSetup && <button onClick={() => setShowSetup(false)} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground mb-6 transition-colors">← Back to Overview</button>}
            <ProgramSetupForm onScaffold={(n, y, l, c) => { handleScaffold(n, y, l, c); setShowSetup(false) }} />
          </>
        ) : (
          <div className="space-y-6">
            {/* Program Header */}
            <div className="flex flex-col gap-2.5">
              {/* Row 1: Program Name and Year Pills */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/45 mb-1 leading-none">Academic Program</p>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-foreground leading-none">{activeProgram || 'Your Program'}</h1>
                </div>
                
                {/* Year Pills (aligned inline with program name) */}
                <div className="flex items-center gap-2 pt-3 flex-wrap">
                  {programYears.map((y, idx) => {
                    const status = stripWL(getVal(y, 'Status', 'status'))
                    const isDone = status.toLowerCase().includes('complet')
                    const isActive = getBoolVal(y, 'Current Year', 'current_year')
                    return (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedYearId(y.id)}
                        className={cn('px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border rounded-[6px] transition-all flex items-center gap-1.5 cursor-pointer font-sans h-7',
                          isActive 
                           ? 'border-foreground/35 bg-bento-item text-foreground ring-1 ring-inset ring-foreground/5' 
                           : 'border-border/40 bg-bento-card text-muted-foreground/55 hover:text-foreground hover:bg-bento-item/20')}
                      >
                        <span>{cleanTitle(y.title)}</span>
                        {isActive && <div className="w-1.5 h-1.5 bg-foreground rounded-full" />}
                        {isDone && <CheckCircle size={9} className="text-foreground/70" />}
                      </button>
                    )
                  })}
                </div>

                {/* Edit Program Button */}
                <button 
                  onClick={() => setShowSetup(true)}
                  className="ml-auto h-7 px-3 bg-muted/20 text-[9px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/40 border border-border/40 hover:border-foreground/30 rounded-[8px] transition-all font-sans"
                >
                  Edit Program
                </button>
              </div>

              {/* Row 2: Academic Level (Undergraduate) and Active Status Buttons */}
              <div className="flex items-center gap-4 flex-wrap border-t border-border/20 pt-2.5">
                <span className="text-[12px] font-black uppercase tracking-wider text-muted-foreground/80 font-sans leading-none">
                  {cleanTitle(getVal(activeYear, 'Academic Level', 'academic_level')) || 'Undergraduate'}
                </span>
                
                <div className="w-px h-4 bg-border/30 mx-1" />

                {/* Active Year button */}
                {activeYear && (
                  <button 
                    onClick={() => setSelectedYearId(activeYear.id)}
                    className="px-3.5 py-1.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[9.5px] font-black uppercase tracking-wider rounded-[6px] text-foreground transition-all flex items-center gap-1.5 h-7 font-sans"
                  >
                    <span className="text-muted-foreground/50">Year:</span>
                    <span>{cleanTitle(activeYear.title)}</span>
                  </button>
                )}

                {/* Active Semester button */}
                {activeSem && (
                  <button 
                    onClick={() => setSelectedSemId(activeSem.id)}
                    className="px-3.5 py-1.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[9.5px] font-black uppercase tracking-wider rounded-[6px] text-foreground transition-all flex items-center gap-1.5 h-7 font-sans"
                  >
                    <span className="text-muted-foreground/50">Sem:</span>
                    <span>{cleanTitle(activeSem.title)}</span>
                  </button>
                )}

                {/* Cumulative GPA button */}
                <div className="px-3.5 py-1.5 border border-border/50 bg-bento-card/30 text-[9.5px] font-black uppercase tracking-wider rounded-[6px] text-foreground flex items-center gap-1.5 h-7 font-sans select-none">
                  <span className="text-muted-foreground/50">GPA:</span>
                  <span>{getVal(activeYear, 'Cumulative GPA', 'cumulative_gpa') || '--'}</span>
                </div>
              </div>
            </div>

            {/* Comprehensive Academic Life Hub Grid */}
            <div className="grid grid-cols-3 gap-6 items-stretch">
              {/* Left Column: Calendar & Planner */}
              <div className="col-span-2 flex flex-col gap-6">
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
                                    else if (evAny._type === 'Study Session' && evAny.hub_id) {
                                      const sHub = (data.study_sessions || []).find(h => h.id === evAny.hub_id);
                                      onOpenNote(sHub?.path || `database/study planner/${evAny.hub_id}.md`);
                                    }
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

                {/* Courses, Planner & Practice Tabbed Card */}
                <section className="p-5 border border-border bg-bento-card rounded-[8px] flex flex-col h-[350px] space-y-3">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 shrink-0">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setLeftBottomTab('courses')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          leftBottomTab === 'courses' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Courses
                      </button>
                      <button 
                        onClick={() => setLeftBottomTab('planner')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          leftBottomTab === 'planner' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Planner
                      </button>
                      <button 
                        onClick={() => setLeftBottomTab('practice')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          leftBottomTab === 'practice' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Practice
                      </button>
                    </div>
                    
                    {leftBottomTab === 'courses' && (
                      <button onClick={() => navigateTo('COURSES')} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans">
                        All →
                      </button>
                    )}
                    {leftBottomTab === 'planner' && (
                      <button onClick={() => onOpenNote ? onOpenNote('database/study planner') : navigate('/obsidian?path=database/study planner')} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans">
                        All →
                      </button>
                    )}
                    {leftBottomTab === 'practice' && (
                      <button onClick={() => navigateTo('PRACTICE')} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans">
                        All →
                      </button>
                    )}
                  </div>

                  {/* Controls Row (Fixed) */}
                  <div className="py-1 shrink-0 flex gap-2 flex-wrap items-center">
                    {leftBottomTab === 'courses' && (
                      <>
                        <div className="flex-1 min-w-[100px] flex items-center gap-1.5 px-2 py-0.5 bg-muted/10 border border-border/40 rounded-[4px]">
                          <Search size={9} className="text-muted-foreground/45" />
                          <input 
                            type="text"
                            value={coursesSearch}
                            onChange={e => setCoursesSearch(e.target.value)}
                            placeholder="Search..."
                            className="bg-transparent text-[9px] font-bold text-foreground outline-none w-full placeholder:text-muted-foreground/25 font-sans"
                          />
                        </div>

                        <select 
                          value={coursesFilter}
                          onChange={e => setCoursesFilter(e.target.value)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="All">All Semesters</option>
                          {(data.semesters || []).map(s => (
                            <option key={s.id} value={s.title}>{cleanTitle(s.title)}</option>
                          ))}
                        </select>

                        <select 
                          value={coursesSort}
                          onChange={e => setCoursesSort(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="title">Sort: Title</option>
                          <option value="credits">Sort: Credits</option>
                          <option value="grade">Sort: Grade</option>
                        </select>

                        <button 
                          onClick={() => { setIsAddingCourse(!isAddingCourse); if (!isAddingCourse) { setNewCourseName(''); setNewCourseCredits('4'); setNewCourseSem(data.semesters?.[0]?.title || '') } }}
                          className="px-2 py-0.5 bg-muted/20 text-[9px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] flex items-center gap-1 transition-all"
                        >
                          <Plus size={9} /> Add
                        </button>
                      </>
                    )}

                    {leftBottomTab === 'planner' && (
                      <>
                        <div className="flex-1 min-w-[100px] flex items-center gap-1.5 px-2 py-0.5 bg-muted/10 border border-border/40 rounded-[4px]">
                          <Search size={9} className="text-muted-foreground/45" />
                          <input 
                            type="text"
                            value={plannerSearch}
                            onChange={e => setPlannerSearch(e.target.value)}
                            placeholder="Search..."
                            className="bg-transparent text-[9px] font-bold text-foreground outline-none w-full placeholder:text-muted-foreground/25 font-sans"
                          />
                        </div>

                        <select 
                          value={plannerFilter}
                          onChange={e => setPlannerFilter(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="All">All Statuses</option>
                        </select>

                        <select 
                          value={plannerSort}
                          onChange={e => setPlannerSort(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="title">Sort: Title</option>
                          <option value="unit">Sort: Unit</option>
                          <option value="course">Sort: Course</option>
                        </select>

                        <button 
                          onClick={() => { setIsAddingPlannerHub(!isAddingPlannerHub); if (!isAddingPlannerHub) { setNewHubName(''); setNewHubCourse(courses[0]?.title || ''); setNewHubUnit('') } }}
                          className="px-2 py-0.5 bg-muted/20 text-[9px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] flex items-center gap-1 transition-all"
                        >
                          <Plus size={9} /> Add
                        </button>
                      </>
                    )}

                    {leftBottomTab === 'practice' && (
                      <>
                        <div className="flex-1 min-w-[120px] flex items-center gap-1.5 px-2 py-0.5 bg-muted/10 border border-border/40 rounded-[4px]">
                          <Search size={9} className="text-muted-foreground/45" />
                          <input 
                            type="text"
                            value={practiceSearch}
                            onChange={e => setPracticeSearch(e.target.value)}
                            placeholder="Search Practice..."
                            className="bg-transparent text-[9px] font-bold text-foreground outline-none w-full placeholder:text-muted-foreground/25 font-sans"
                          />
                        </div>

                        <button 
                          onClick={() => navigateTo('PRACTICE')}
                          className="px-2.5 py-0.5 bg-foreground text-background text-[9px] font-black uppercase tracking-widest hover:bg-foreground/90 rounded-[4px] flex items-center gap-1 transition-all font-sans"
                        >
                          <Plus size={9} /> Start Session
                        </button>
                      </>
                    )}
                  </div>

                  {/* Tab Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar-mini pr-1 pt-1.5 space-y-3">
                    {leftBottomTab === 'courses' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {isAddingCourse && (
                          <div className="p-3 border border-border/80 bg-bento-card rounded-[6px] space-y-2.5 font-sans shrink-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">Add New Course</span>
                            <div className="space-y-1.5">
                              <input 
                                type="text"
                                value={newCourseName}
                                onChange={e => setNewCourseName(e.target.value)}
                                placeholder="Course title (e.g. OOP with Java)"
                                className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/30 p-1.5 border border-border/50 rounded-[4px]"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="number"
                                  value={newCourseCredits}
                                  onChange={e => setNewCourseCredits(e.target.value)}
                                  placeholder="Credits"
                                  className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                />
                                <select 
                                  value={newCourseSem}
                                  onChange={e => setNewCourseSem(e.target.value)}
                                  className="w-full bg-bento-card text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border rounded-[4px]"
                                >
                                  <option value="">Semester...</option>
                                  {(data.semesters || []).map(s => (
                                    <option key={s.id} value={s.title}>{cleanTitle(s.title)}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => { setIsAddingCourse(false); setNewCourseName('') }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/10 rounded-[4px] text-muted-foreground transition-colors font-sans"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!newCourseName.trim()) return
                                  try {
                                    await onCreate('courses', newCourseName.trim(), {
                                      Credits: newCourseCredits || '4',
                                      Semester: wrapWL(newCourseSem || (data.semesters?.[0]?.title || 'Winter2026')),
                                      Status: wrapWL('Planned')
                                    })
                                    toast.success('Course created')
                                    setNewCourseName('')
                                    setIsAddingCourse(false)
                                    onRefresh()
                                  } catch {
                                    toast.error('Failed to create course')
                                  }
                                }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 rounded-[4px] transition-colors font-sans"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        {displayedCourses.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No courses match filter</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {displayedCourses.map((c, idx) => {
                              const grade       = stripWL(getVal(c, 'Grade', 'grade'))
                              const credits     = getVal(c, 'Credits', 'credits')
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
                                  className="p-2.5 border border-border bg-bento-item/25 hover:bg-bento-item/50 rounded-[6px] transition-colors flex flex-col gap-1 cursor-pointer font-sans group relative">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-[10px] font-black uppercase truncate text-foreground/90 leading-tight pr-4 font-sans">{cleanTitle(c.title)}</span>
                                    {grade && <span className={cn('px-1 py-0.5 text-[6.5px] font-black uppercase border shrink-0 font-sans', gradeColorClass(grade))}>{grade}</span>}
                                  </div>
                                  <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans font-medium">
                                    <span>{credits} CR</span>
                                    {pendingCt > 0 ? (
                                      <span className="text-foreground">{pendingCt} due</span>
                                    ) : daysToExam !== null && daysToExam >= 0 ? (
                                      <span className={daysToExam <= 7 ? 'text-foreground' : 'text-muted-foreground/50'}>exam in {daysToExam}d</span>
                                    ) : (
                                      <span className="text-muted-foreground/30">Clear</span>
                                    )}
                                  </div>

                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (confirm(`Delete course "${cleanTitle(c.title)}"?`)) {
                                        onDelete('courses', c.id).then(onRefresh);
                                      } 
                                    }}
                                    className="absolute top-1.5 right-1.5 p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all font-sans"
                                  >
                                    <Trash2 size={9} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {leftBottomTab === 'planner' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {isAddingPlannerHub && (
                          <div className="p-3 border border-border/80 bg-bento-card rounded-[6px] space-y-2.5 font-sans shrink-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">Add Study Hub</span>
                            <div className="space-y-1.5">
                              <input 
                                type="text"
                                value={newHubName}
                                onChange={e => setNewHubName(e.target.value)}
                                placeholder="Hub title (e.g. Chapter 3 Hub)"
                                className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/30 p-1.5 border border-border/50 rounded-[4px]"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select 
                                  value={newHubCourse}
                                  onChange={e => setNewHubCourse(e.target.value)}
                                  className="w-full bg-bento-card text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border rounded-[4px]"
                                >
                                  <option value="">Course...</option>
                                  {courses.map(c => (
                                    <option key={c.id} value={c.title}>{cleanTitle(c.title)}</option>
                                  ))}
                                </select>
                                <input 
                                  type="text"
                                  value={newHubUnit}
                                  onChange={e => setNewHubUnit(e.target.value)}
                                  placeholder="Unit (e.g. Chapter 3)"
                                  className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => { setIsAddingPlannerHub(false); setNewHubName('') }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/10 rounded-[4px] text-muted-foreground transition-colors font-sans"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!newHubName.trim()) return
                                  try {
                                    await onCreate('study planner', newHubName.trim(), {
                                      course: wrapWL(newHubCourse),
                                      unit: newHubUnit,
                                      status: wrapWL('Active')
                                    })
                                    toast.success('Study hub created')
                                    setNewHubName('')
                                    setIsAddingPlannerHub(false)
                                    onRefresh()
                                  } catch {
                                    toast.error('Failed to create study hub')
                                  }
                                }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 rounded-[4px] transition-colors font-sans"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        {displayedHubs.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No hubs match filter</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {displayedHubs.map((hub, idx) => {
                              return (
                                <div key={idx} onClick={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
                                  className="p-2.5 border border-border bg-bento-card hover:bg-bento-item/20 rounded-[6px] transition-colors flex items-center justify-between cursor-pointer gap-2 font-sans group relative">
                                  <span className="text-[10px] font-black uppercase truncate text-foreground/90 pr-4 font-sans">{cleanTitle(hub.title || hub.id)}</span>
                                  
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors font-sans" />
                                    
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (confirm(`Delete study hub "${cleanTitle(hub.title || hub.id)}"?`)) {
                                          onDelete('study planner', hub.id).then(onRefresh);
                                        } 
                                      }}
                                      className="p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all font-sans"
                                    >
                                      <Trash2 size={9} />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {leftBottomTab === 'practice' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {displayedPractices.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No practice history</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {displayedPractices.map((p, idx) => {
                              const score = p.score || 0
                              const total = p.total_questions || p.totalQuestions || 0
                              const dateStr = p.timestamp ? format(new Date(p.timestamp), 'MMM d') : ''
                              
                              return (
                                <div key={idx} onClick={() => navigateTo('PRACTICE')}
                                  className="p-2.5 border border-border bg-bento-item/25 hover:bg-bento-item/50 rounded-[6px] transition-colors flex flex-col gap-1 cursor-pointer group relative font-sans">
                                  <div className="flex items-start justify-between gap-2 pr-4">
                                    <span className="text-[10px] font-black uppercase truncate text-foreground/90 leading-tight">
                                      {cleanTitle(p.title || p.note_path?.split('/').pop()?.replace('.md', '') || 'Practice Session')}
                                    </span>
                                    {total > 0 && (
                                      <span className="px-1 py-0.5 text-[6.5px] font-black uppercase border border-border bg-bento-item text-foreground shrink-0 font-sans">
                                        {score}/{total}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans font-medium">
                                    <span>Recall Practice</span>
                                    <span>{dateStr}</span>
                                  </div>

                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (confirm('Delete practice history record?')) {
                                        handleDeletePractice(p.path);
                                      } 
                                    }}
                                    className="absolute top-1.5 right-1.5 p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all font-sans"
                                  >
                                    <Trash2 size={9} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Courses, Combined Tasks & Exams */}
              <div className="col-span-1 flex flex-col gap-6">
                {/* Upper Right Hub/Inbox/PDF Tabbed Interface */}
                <section className="p-5 border border-border bg-bento-card rounded-[8px] flex flex-col h-[270px] space-y-3">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 shrink-0">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setActiveCoursesTab('hubs')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          activeCoursesTab === 'hubs' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Hubs
                      </button>
                      <button 
                        onClick={() => setActiveCoursesTab('inbox')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          activeCoursesTab === 'inbox' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Inbox
                      </button>
                      <button 
                        onClick={() => setActiveCoursesTab('pdf')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          activeCoursesTab === 'pdf' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Tab Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar-mini pr-1 pt-1.5 space-y-3">
                    {activeCoursesTab === 'hubs' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {hubs.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No study hubs</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {hubs.map((hub, idx) => {
                              const isDone = stripWL(getVal(hub, 'status', 'Status')).toLowerCase().includes('complet')
                              return (
                                <div key={idx} onClick={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
                                  className="p-2.5 border border-border bg-bento-card hover:bg-bento-item/20 rounded-[6px] transition-colors flex items-center justify-between cursor-pointer gap-2 font-sans group relative">
                                  <span className={cn("text-[10px] font-black uppercase truncate text-foreground/90 pr-4 font-sans", isDone && "line-through text-muted-foreground/60")}>{cleanTitle(hub.title || hub.id)}</span>
                                  <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors font-sans" />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeCoursesTab === 'inbox' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {inboxFiles.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">Inbox is empty</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {inboxFiles.map((file, idx) => {
                              const filename = file.name || file.path?.split('/').pop() || 'Untitled'
                              return (
                                <div key={idx} onClick={() => onOpenNote(file.path)}
                                  className="p-2.5 border border-border bg-bento-card hover:bg-bento-item/20 rounded-[6px] transition-colors flex items-center justify-between cursor-pointer gap-2 font-sans group relative">
                                  <span className="text-[10px] font-black uppercase truncate text-foreground/90 pr-4 font-sans">{cleanTitle(filename)}</span>
                                  <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors font-sans" />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeCoursesTab === 'pdf' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {pdfFiles.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No PDFs in vault</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {pdfFiles.map((file, idx) => {
                              const filename = file.name || file.path?.split('/').pop() || 'Untitled'
                              return (
                                <div key={idx} onClick={() => onOpenNote(file.path)}
                                  className="p-2.5 border border-border bg-bento-card hover:bg-bento-item/20 rounded-[6px] transition-colors flex items-center justify-between cursor-pointer gap-2 font-sans group relative">
                                  <span className="text-[10px] font-black uppercase truncate text-foreground/90 pr-4 font-sans">{cleanTitle(filename)}</span>
                                  <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors font-sans" />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* Combined Tasks, Exams & NotebookLM Card */}
                <section className="p-5 border border-border bg-bento-card rounded-[8px] flex-1 flex flex-col space-y-4 min-h-[250px]">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSidebarTab('assignments')}
                        className={cn("text-[9px] font-black uppercase tracking-wider transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          sidebarTab === 'assignments' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Tasks
                      </button>
                      <button 
                        onClick={() => setSidebarTab('exams')}
                        className={cn("text-[9px] font-black uppercase tracking-wider transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          sidebarTab === 'exams' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Exams
                      </button>
                      <button 
                        onClick={() => setSidebarTab('notebooklm')}
                        className={cn("text-[9px] font-black uppercase tracking-wider transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          sidebarTab === 'notebooklm' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        NotebookLM
                      </button>
                    </div>
                    {sidebarTab === 'assignments' && (
                      <button 
                        onClick={() => navigateTo('ASSIGNMENTS')} 
                        className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans"
                      >
                        Open →
                      </button>
                    )}
                    {sidebarTab === 'exams' && (
                      <button 
                        onClick={() => navigateTo('EXAMS')} 
                        className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans"
                      >
                        Open →
                      </button>
                    )}
                    {sidebarTab === 'notebooklm' && (
                      <button 
                        onClick={() => navigate('/notebooks')} 
                        className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors font-sans"
                      >
                        Open →
                      </button>
                    )}
                  </div>

                  {/* Tab Body */}
                  <div className="h-[135px] overflow-y-auto custom-scrollbar-mini pr-1 pt-2">
                    {sidebarTab === 'assignments' && (
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
                                      className={cn("w-4 h-4 border rounded-[3px] flex items-center justify-center shrink-0 transition-colors bg-bento-card",
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
                                          ? "bg-foreground/5 border-foreground/20 text-foreground" 
                                          : "bg-muted/10 border-border/40 text-muted-foreground/60"
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
                    )}

                    {sidebarTab === 'exams' && (
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
                                      : "bg-muted/10 border-border/40 text-muted-foreground/60"
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

                    {sidebarTab === 'notebooklm' && (
                      <div>
                        {notebooks.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans">No notebooks found</p>
                        ) : (
                          <div className="space-y-2">
                            {notebooks.slice(0, 4).map((nb, idx) => {
                              return (
                                <div key={idx} onClick={() => navigate('/notebooks')}
                                  className="p-3 border border-border bg-bento-item/25 hover:bg-bento-item/50 rounded-[6px] transition-colors flex items-center justify-between cursor-pointer gap-2 font-sans">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black uppercase truncate text-foreground/90">{cleanTitle(nb.title)}</span>
                                    <span className="text-[7px] font-black uppercase text-muted-foreground/45 mt-0.5">
                                      {nb.sources_count || nb.sources?.length || 0} sources
                                    </span>
                                  </div>
                                  <ChevronRight size={10} className="text-muted-foreground/30 shrink-0" />
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
