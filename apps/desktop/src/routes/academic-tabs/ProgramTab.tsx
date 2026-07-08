import React, { useState, useMemo } from 'react'
import { Check, Trash2, Plus, ChevronLeft, ChevronRight, Calendar, Search, X, Edit2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { differenceInDays, startOfDay, addDays, isSameDay, startOfWeek, format } from 'date-fns'
import { stripWL, getVal, getBoolVal, getYearOrder, deriveStatus, wrapWL, cleanTitle, calcGPA, gradeColorClass, getDaysUntil } from './utils'
import { invoke } from '@tauri-apps/api/core'
import { SectionHeader, EmptyState, StatCard, ProgramSetupForm, BigPropertyCard, EditableTitle, CreateBanner } from './SharedComponents'
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
  const [sidecarPort, setSidecarPort]           = useState<number>(8765)
  const [sidecarToken, setSidecarToken]         = useState<string>('')
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null)
  
  // Tab control state
  const [leftBottomTab, setLeftBottomTab]       = useState<'planner' | 'exams' | 'assignments'>('planner')
  const [activeCoursesTab, setActiveCoursesTab] = useState<'courses' | 'hubs' | 'inbox' | 'pdf'>('courses')
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
  
  const [editingCourseId, setEditingCourseId]   = useState<string | null>(null)
  const [editCourseName, setEditCourseName]     = useState('')
  const [editCourseCredits, setEditCourseCredits] = useState('')
  const [editCourseSem, setEditCourseSem]       = useState('')

  // Planner search/filter/sort/add/edit states
  const [plannerSearch, setPlannerSearch]       = useState('')
  const [plannerSort, setPlannerSort]           = useState<'title' | 'unit' | 'course'>('title')
  const [plannerFilter, setPlannerFilter]       = useState<'Active' | 'All' | 'Completed'>('Active')
  const [isAddingPlannerHub, setIsAddingPlannerHub] = useState(false)
  const [newHubName, setNewHubName]             = useState('')
  const [newHubCourse, setNewHubCourse]         = useState('')
  const [newHubUnit, setNewHubUnit]             = useState('')

  const [editingHubId, setEditingHubId]         = useState<string | null>(null)
  const [editHubName, setEditHubName]           = useState('')
  const [editHubCourse, setEditHubCourse]       = useState('')
  const [editHubUnit, setEditHubUnit]           = useState('')
  const [editHubStatus, setEditHubStatus]       = useState('')

  // Hubs Tab search/filter/sort/add/edit states
  const [hubsTabSearch, setHubsTabSearch]       = useState('')
  const [hubsTabFilter, setHubsTabFilter]       = useState<'Active' | 'All' | 'Completed'>('Active')
  const [hubsTabSort, setHubsTabSort]           = useState<'title' | 'unit' | 'course'>('title')
  const [isAddingHubsTab, setIsAddingHubsTab]   = useState(false)
  const [newHubsTabName, setNewHubsTabName]     = useState('')
  const [newHubsTabCourse, setNewHubsTabCourse] = useState('')
  const [newHubsTabUnit, setNewHubsTabUnit]     = useState('')

  // Inbox search/sort/add/edit states
  const [inboxSearch, setInboxSearch]           = useState('')
  const [inboxSort, setInboxSort]               = useState<'name' | 'path'>('name')
  const [isAddingInbox, setIsAddingInbox]       = useState(false)
  const [newInboxName, setNewInboxName]         = useState('')
  const [editingInboxPath, setEditingInboxPath] = useState<string | null>(null)
  const [editInboxName, setEditInboxName]       = useState('')

  // PDF search/sort/add/edit states
  const [pdfSearch, setPdfSearch]               = useState('')
  const [pdfSort, setPdfSort]                   = useState<'name' | 'path'>('name')
  const [isAddingPdf, setIsAddingPdf]           = useState(false)
  const [newPdfName, setNewPdfName]             = useState('')
  const [editingPdfPath, setEditingPdfPath]     = useState<string | null>(null)
  const [editPdfName, setEditPdfName]           = useState('')

  // Assignments search/filter/sort/add/edit states
  const [assignmentsSearch, setAssignmentsSearch] = useState('')
  const [assignmentsFilter, setAssignmentsFilter] = useState<'All' | 'Active' | 'Completed'>('Active')
  const [assignmentsSort, setAssignmentsSort]     = useState<'title' | 'dueDate' | 'course'>('dueDate')
  const [isAddingAssignment, setIsAddingAssignment] = useState(false)
  const [newAssignmentName, setNewAssignmentName] = useState('')
  const [newAssignmentCourse, setNewAssignmentCourse] = useState('')
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState('')
  
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [editAssignmentName, setEditAssignmentName] = useState('')
  const [editAssignmentCourse, setEditAssignmentCourse] = useState('')
  const [editAssignmentDueDate, setEditAssignmentDueDate] = useState('')
  const [editAssignmentStatus, setEditAssignmentStatus] = useState('')

  // Exams search/filter/sort/add/edit states
  const [examsSearch, setExamsSearch]             = useState('')
  const [examsFilter, setExamsFilter]             = useState<'All' | 'Upcoming' | 'Past'>('Upcoming')
  const [examsSort, setExamsSort]                 = useState<'title' | 'date' | 'course'>('date')
  const [isAddingExam, setIsAddingExam]           = useState(false)
  const [newExamName, setNewExamName]             = useState('')
  const [newExamCourse, setNewExamCourse]         = useState('')
  const [newExamDate, setNewExamDate]             = useState('')
  const [newExamType, setNewExamType]             = useState('Midterm')

  const [editingExamId, setEditingExamId]         = useState<string | null>(null)
  const [editExamName, setEditExamName]           = useState('')
  const [editExamCourse, setEditExamCourse]       = useState('')
  const [editExamDate, setEditExamDate]           = useState('')
  const [editExamType, setEditExamType]           = useState('Midterm')

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



  const years       = useMemo(() => data.years          || [], [data.years])
  const semesters   = useMemo(() => data.semesters      || [], [data.semesters])
  const courses     = useMemo(() => data.courses        || [], [data.courses])
  const assignments = useMemo(() => data.assignments    || [], [data.assignments])
  const exams       = useMemo(() => data.exams          || [], [data.exams])
  const hubs        = useMemo(() => data.study_sessions || [], [data.study_sessions])
  const now         = useMemo(() => startOfDay(new Date()), [])
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

  const sorted = useMemo(() => {
    return [...years].sort((a, b) => {
      const aTitle = cleanTitle(a?.title || getVal(a, 'title'));
      const bTitle = cleanTitle(b?.title || getVal(b, 'title'));
      return getYearOrder(aTitle) - getYearOrder(bTitle);
    });
  }, [years])

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

  const displayedAssignments = useMemo(() => {
    let list = assignments

    if (assignmentsSearch.trim()) {
      const q = assignmentsSearch.toLowerCase()
      list = list.filter(a => cleanTitle(a.title).toLowerCase().includes(q))
    }

    if (assignmentsFilter === 'Active') {
      list = list.filter(a => !(a.done === true || a.done === 'true' || stripWL(getVal(a, 'Status', 'status')).toLowerCase().includes('complet')))
    } else if (assignmentsFilter === 'Completed') {
      list = list.filter(a => (a.done === true || a.done === 'true' || stripWL(getVal(a, 'Status', 'status')).toLowerCase().includes('complet')))
    }

    list = [...list].sort((a, b) => {
      if (assignmentsSort === 'dueDate') {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 9999999999999
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 9999999999999
        return dateA - dateB
      }
      if (assignmentsSort === 'course') {
        const courseA = stripWL(getVal(a, 'Course', 'course')) || ''
        const courseB = stripWL(getVal(b, 'Course', 'course')) || ''
        return courseA.localeCompare(courseB)
      }
      return cleanTitle(a.title).localeCompare(cleanTitle(b.title))
    })

    return list
  }, [assignments, assignmentsSearch, assignmentsFilter, assignmentsSort, now])

  const displayedExams = useMemo(() => {
    let list = exams

    if (examsSearch.trim()) {
      const q = examsSearch.toLowerCase()
      list = list.filter(e => cleanTitle(e.title).toLowerCase().includes(q))
    }

    if (examsFilter === 'Upcoming') {
      list = list.filter(e => {
        const date = e.date ? new Date(e.date) : null
        return date && differenceInDays(date, now) >= 0
      })
    } else if (examsFilter === 'Past') {
      list = list.filter(e => {
        const date = e.date ? new Date(e.date) : null
        return date && differenceInDays(date, now) < 0
      })
    }

    list = [...list].sort((a, b) => {
      if (examsSort === 'date') {
        const dateA = a.date ? new Date(a.date).getTime() : 9999999999999
        const dateB = b.date ? new Date(b.date).getTime() : 9999999999999
        return dateA - dateB
      }
      if (examsSort === 'course') {
        const courseA = stripWL(getVal(a, 'Course', 'course')) || ''
        const courseB = stripWL(getVal(b, 'Course', 'course')) || ''
        return courseA.localeCompare(courseB)
      }
      return cleanTitle(a.title).localeCompare(cleanTitle(b.title))
    })

    return list
  }, [exams, examsSearch, examsFilter, examsSort, now])

  const displayedHubsTab = useMemo(() => {
    let list = hubs

    if (hubsTabSearch.trim()) {
      const q = hubsTabSearch.toLowerCase()
      list = list.filter(h => cleanTitle(h.title).toLowerCase().includes(q))
    }

    if (hubsTabFilter === 'Active') {
      list = list.filter(h => !stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet'))
    } else if (hubsTabFilter === 'Completed') {
      list = list.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet'))
    }

    list = [...list].sort((a, b) => {
      if (hubsTabSort === 'unit') {
        const unitA = getVal(a, 'unit', 'Unit') || ''
        const unitB = getVal(b, 'unit', 'Unit') || ''
        return unitA.localeCompare(unitB)
      }
      if (hubsTabSort === 'course') {
        const courseA = stripWL(getVal(a, 'course', 'Course')) || ''
        const courseB = stripWL(getVal(b, 'course', 'Course')) || ''
        return courseA.localeCompare(courseB)
      }
      return cleanTitle(a.title).localeCompare(cleanTitle(b.title))
    })

    return list
  }, [hubs, hubsTabSearch, hubsTabFilter, hubsTabSort])

  const displayedInbox = useMemo(() => {
    let list = inboxFiles

    if (inboxSearch.trim()) {
      const q = inboxSearch.toLowerCase()
      list = list.filter(f => {
        const filename = f.name || f.path?.split('/').pop() || 'Untitled'
        return filename.toLowerCase().includes(q)
      })
    }

    list = [...list].sort((a, b) => {
      const nameA = a.name || a.path?.split('/').pop() || 'Untitled'
      const nameB = b.name || b.path?.split('/').pop() || 'Untitled'
      if (inboxSort === 'path') {
        return (a.path || '').localeCompare(b.path || '')
      }
      return nameA.localeCompare(nameB)
    })

    return list
  }, [inboxFiles, inboxSearch, inboxSort])

  const displayedPDFs = useMemo(() => {
    let list = pdfFiles

    if (pdfSearch.trim()) {
      const q = pdfSearch.toLowerCase()
      list = list.filter(f => {
        const filename = f.name || f.path?.split('/').pop() || 'Untitled'
        return filename.toLowerCase().includes(q)
      })
    }

    list = [...list].sort((a, b) => {
      const nameA = a.name || a.path?.split('/').pop() || 'Untitled'
      const nameB = b.name || b.path?.split('/').pop() || 'Untitled'
      if (pdfSort === 'path') {
        return (a.path || '').localeCompare(b.path || '')
      }
      return nameA.localeCompare(nameB)
    })

    return list
  }, [pdfFiles, pdfSearch, pdfSort])

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
              className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans">
              + ADD
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
              {activeProgram}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isCurrentYear && (
              <button onClick={() => handleSetCurrentYear(selectedYearId)}
                className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans">
                SET ACTIVE
              </button>
            )}
            {derived === 'Completed' && !currentStatus.toLowerCase().includes('complet') && (
              <button onClick={() => onUpdate('years', selectedYearId, { Status: '[[Completed]]' })}
                className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans">
                MARK COMPLETE
              </button>
            )}
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
              className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans">
              + ADD
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

  const getDaySummary = (day: Date) => {
    const dayEvents = calendarEvents.filter(e => e._date && isSameDay(new Date(e._date), day))
    
    const examsList = dayEvents.filter(e => e._type === 'Exam')
    const assignmentsList = dayEvents.filter(e => e._type === 'Assignment')
    const sessionsList = dayEvents.filter(e => e._type === 'Study Session' || e._type === 'Study')
    const practiceList = dayEvents.filter(e => e._type === 'Practice')
    const notesList = dayEvents.filter(e => e._type === 'Note Visit')

    return {
      exams: examsList,
      assignments: assignmentsList,
      sessions: sessionsList,
      practices: practiceList,
      notes: notesList,
      total: dayEvents.length
    }
  }

  return (
    <div className="h-full overflow-hidden flex flex-col p-8 space-y-6 select-none">
        {programYears.length === 0 || showSetup ? (
          <div className="flex-1 overflow-y-auto pr-1">
            {showSetup && <button onClick={() => setShowSetup(false)} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground mb-6 transition-colors">← Back to Overview</button>}
            <ProgramSetupForm onScaffold={(n, y, l, c) => { handleScaffold(n, y, l, c); setShowSetup(false) }} />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col space-y-6">


            {/* Comprehensive Academic Life Hub Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 items-stretch">
              {/* Left Column: Calendar & Planner */}
              <div className="col-span-1 lg:col-span-2 flex flex-col gap-6 h-full min-h-0">
                {/* Week Calendar */}
                <section className="p-5 border border-border bg-bento-card rounded-[8px] flex flex-col flex-1 min-h-0 space-y-4">
                  <div className="flex justify-end items-center mb-2">
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
                        className="px-2.5 h-7 bg-muted/10 text-[7px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/20 border border-border/40 hover:border-foreground/30 rounded-[5px] transition-all font-sans flex items-center justify-center cursor-pointer ml-1"
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
                        <div 
                          key={dayIdx} 
                          onClick={() => setSelectedCalendarDay(day)}
                          className={cn("p-3 border rounded-[8px] flex flex-col gap-2 min-w-0 transition-all cursor-pointer",
                            isTodayDay 
                              ? "bg-foreground/5 border-foreground/35 ring-1 ring-inset ring-foreground/10" 
                              : "bg-bento-card border-border hover:bg-bento-item/15 hover:border-border/80")}
                        >
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
                                  onClick={(e) => {
                                    e.stopPropagation();
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

                {/* Planner Card */}
                <section className="p-5 border border-border bg-bento-card rounded-[8px] flex flex-col flex-1 min-h-0 space-y-3">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 shrink-0">
                    <div className="flex gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground font-sans">
                        Planner
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => navigateTo('HUBS')} 
                      className="px-2.5 h-6 bg-muted/10 text-[7px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/20 border border-border/40 hover:border-foreground/30 rounded-[5px] transition-all font-sans flex items-center justify-center cursor-pointer"
                    >
                      All →
                    </button>
                  </div>

                  {/* Controls Row (Fixed) */}
                  <div className="py-1 shrink-0 flex gap-2 flex-wrap items-center">
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
                  </div>

                  {/* Tab Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar-mini pr-1 pt-1.5 space-y-3">
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
                      <div className="grid grid-cols-1 gap-2">
                        {displayedHubs.map((hub, idx) => {
                          const isEditing = editingHubId === hub.id
                          const isDone = stripWL(getVal(hub, 'status', 'Status')).toLowerCase().includes('complet')
                          return (
                            <div key={idx} onClick={() => !isEditing && onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
                              className={cn("p-2.5 border border-border bg-bento-card rounded-[6px] transition-colors flex flex-col gap-2 font-sans relative group", 
                                !isEditing && "hover:bg-bento-item/20 cursor-pointer")}
                            >
                              {isEditing ? (
                                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                  <input 
                                    type="text"
                                    value={editHubName}
                                    onChange={e => setEditHubName(e.target.value)}
                                    className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                    placeholder="Hub title"
                                  />
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <select 
                                      value={editHubCourse}
                                      onChange={e => setEditHubCourse(e.target.value)}
                                      className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                    >
                                      <option value="">Course...</option>
                                      {courses.map(c => (
                                        <option key={c.id} value={c.title}>{cleanTitle(c.title)}</option>
                                      ))}
                                    </select>
                                    <input 
                                      type="text"
                                      value={editHubUnit}
                                      onChange={e => setEditHubUnit(e.target.value)}
                                      className="bg-muted/20 text-[9px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                      placeholder="Unit"
                                    />
                                    <select 
                                      value={editHubStatus}
                                      onChange={e => setEditHubStatus(e.target.value)}
                                      className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                    >
                                      <option value="Active">Active</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </div>
                                  <div className="flex justify-end gap-1.5">
                                    <button 
                                      onClick={() => setEditingHubId(null)}
                                      className="px-2 py-0.5 text-[8px] font-black uppercase border border-border rounded-[4px] text-muted-foreground"
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (!editHubName.trim()) return
                                        try {
                                          await onUpdate('study planner', hub.id, {
                                            title: editHubName.trim(),
                                            course: wrapWL(editHubCourse),
                                            unit: editHubUnit,
                                            status: wrapWL(editHubStatus)
                                          })
                                          toast.success('Study hub updated')
                                          setEditingHubId(null)
                                          onRefresh()
                                        } catch {
                                          toast.error('Update failed')
                                        }
                                      }}
                                      className="px-2 py-0.5 text-[8px] font-black uppercase bg-foreground text-background rounded-[4px]"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={cn("text-[10px] font-black uppercase truncate text-foreground/90 pr-4 font-sans", isDone && "line-through text-muted-foreground/60")}>
                                      {cleanTitle(hub.title || hub.id)}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors font-sans" />
                                      
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setEditingHubId(hub.id)
                                          setEditHubName(hub.title || hub.id)
                                          setEditHubCourse(stripWL(getVal(hub, 'course', 'Course')))
                                          setEditHubUnit(getVal(hub, 'unit', 'Unit'))
                                          setEditHubStatus(stripWL(getVal(hub, 'status', 'Status')) || 'Active')
                                        }}
                                        className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:group-hover:text-foreground hover:bg-muted/15 rounded transition-all font-sans"
                                      >
                                        <Edit2 size={9} />
                                      </button>
                                      
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
                                  <div className="flex justify-between items-center text-[7.5px] font-black uppercase text-muted-foreground/50 tracking-wider">
                                    <span>Course: {cleanTitle(stripWL(getVal(hub, 'course', 'Course')) || '--')}</span>
                                    <span>Unit: {getVal(hub, 'unit', 'Unit') || '--'}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Courses, Combined Tasks & Exams */}
              <div className="col-span-1 lg:col-span-1 flex flex-col gap-6 h-full min-h-0">
                {/* Upper Right Hub/Inbox/PDF Tabbed Interface */}
                <section className="p-5 border border-border bg-bento-card rounded-[8px] flex flex-col flex-1 min-h-0 space-y-3">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 shrink-0">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setActiveCoursesTab('courses')}
                        className={cn("text-[10px] font-black uppercase tracking-widest transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          activeCoursesTab === 'courses' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Courses
                      </button>
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
                    {activeCoursesTab === 'courses' && (
                      <button 
                        onClick={() => navigateTo('COURSES')} 
                        className="px-2.5 h-6 bg-muted/10 text-[7px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/20 border border-border/40 hover:border-foreground/30 rounded-[5px] transition-all font-sans flex items-center justify-center cursor-pointer font-bold"
                      >
                        Open Page →
                      </button>
                    )}
                    {activeCoursesTab === 'hubs' && (
                      <button 
                        onClick={() => navigateTo('PLANNER')} 
                        className="px-2.5 h-6 bg-muted/10 text-[7px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/20 border border-border/40 hover:border-foreground/30 rounded-[5px] transition-all font-sans flex items-center justify-center cursor-pointer font-bold"
                      >
                        Open Page →
                      </button>
                    )}
                    {(activeCoursesTab === 'inbox' || activeCoursesTab === 'pdf') && (
                      <button 
                        onClick={() => navigate('/obsidian')} 
                        className="px-2.5 h-6 bg-muted/10 text-[7px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/20 border border-border/40 hover:border-foreground/30 rounded-[5px] transition-all font-sans flex items-center justify-center cursor-pointer font-bold"
                      >
                        Open Vault →
                      </button>
                    )}
                  </div>

                  {/* Tab Controls Row */}
                  <div className="py-1 shrink-0 flex gap-2 flex-wrap items-center">
                    {activeCoursesTab === 'courses' && (
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

                    {activeCoursesTab === 'hubs' && (
                      <>
                        <div className="flex-1 min-w-[100px] flex items-center gap-1.5 px-2 py-0.5 bg-muted/10 border border-border/40 rounded-[4px]">
                          <Search size={9} className="text-muted-foreground/45" />
                          <input 
                            type="text"
                            value={hubsTabSearch}
                            onChange={e => setHubsTabSearch(e.target.value)}
                            placeholder="Search hubs..."
                            className="bg-transparent text-[9px] font-bold text-foreground outline-none w-full placeholder:text-muted-foreground/25 font-sans"
                          />
                        </div>

                        <select 
                          value={hubsTabFilter}
                          onChange={e => setHubsTabFilter(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="All">All Statuses</option>
                        </select>

                        <select 
                          value={hubsTabSort}
                          onChange={e => setHubsTabSort(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="title">Sort: Title</option>
                          <option value="unit">Sort: Unit</option>
                          <option value="course">Sort: Course</option>
                        </select>

                        <button 
                          onClick={() => { setIsAddingHubsTab(!isAddingHubsTab); if (!isAddingHubsTab) { setNewHubsTabName(''); setNewHubsTabCourse(courses[0]?.title || ''); setNewHubsTabUnit('') } }}
                          className="px-2 py-0.5 bg-muted/20 text-[9px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] flex items-center gap-1 transition-all"
                        >
                          <Plus size={9} /> Add
                        </button>
                      </>
                    )}

                    {activeCoursesTab === 'inbox' && (
                      <>
                        <div className="flex-1 min-w-[120px] flex items-center gap-1.5 px-2 py-0.5 bg-muted/10 border border-border/40 rounded-[4px]">
                          <Search size={9} className="text-muted-foreground/45" />
                          <input 
                            type="text"
                            value={inboxSearch}
                            onChange={e => setInboxSearch(e.target.value)}
                            placeholder="Search inbox..."
                            className="bg-transparent text-[9px] font-bold text-foreground outline-none w-full placeholder:text-muted-foreground/25 font-sans"
                          />
                        </div>

                        <select 
                          value={inboxSort}
                          onChange={e => setInboxSort(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="name">Sort: Name</option>
                          <option value="path">Sort: Path</option>
                        </select>

                        <button 
                          onClick={() => { setIsAddingInbox(!isAddingInbox); if (!isAddingInbox) { setNewInboxName('') } }}
                          className="px-2 py-0.5 bg-muted/20 text-[9px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] flex items-center gap-1 transition-all"
                        >
                          <Plus size={9} /> Add Note
                        </button>
                      </>
                    )}

                    {activeCoursesTab === 'pdf' && (
                      <>
                        <div className="flex-1 min-w-[120px] flex items-center gap-1.5 px-2 py-0.5 bg-muted/10 border border-border/40 rounded-[4px]">
                          <Search size={9} className="text-muted-foreground/45" />
                          <input 
                            type="text"
                            value={pdfSearch}
                            onChange={e => setPdfSearch(e.target.value)}
                            placeholder="Search PDFs..."
                            className="bg-transparent text-[9px] font-bold text-foreground outline-none w-full placeholder:text-muted-foreground/25 font-sans"
                          />
                        </div>

                        <select 
                          value={pdfSort}
                          onChange={e => setPdfSort(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="name">Sort: Name</option>
                          <option value="path">Sort: Path</option>
                        </select>

                        <button 
                          onClick={() => { setIsAddingPdf(!isAddingPdf); if (!isAddingPdf) { setNewPdfName('') } }}
                          className="px-2 py-0.5 bg-muted/20 text-[9px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] flex items-center gap-1 transition-all"
                        >
                          <Plus size={9} /> Add PDF
                        </button>
                      </>
                    )}
                  </div>

                  {/* Tab Body (Scrollable) */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar-mini pr-1 pt-1.5 space-y-3">
                    {activeCoursesTab === 'courses' && (
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
                          <div className="grid grid-cols-1 gap-2">
                            {displayedCourses.map((c, idx) => {
                              const isEditing = editingCourseId === c.id
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
                                <div key={idx} onClick={() => !isEditing && navigateTo('COURSES', c.id)}
                                  className={cn("p-2.5 border border-border bg-bento-item/25 rounded-[6px] transition-colors flex flex-col gap-1 font-sans relative group", 
                                    !isEditing && "hover:bg-bento-item/50 cursor-pointer")}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                      <input 
                                        type="text"
                                        value={editCourseName}
                                        onChange={e => setEditCourseName(e.target.value)}
                                        className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                        placeholder="Course Title"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <input 
                                          type="text"
                                          value={editCourseCredits}
                                          onChange={e => setEditCourseCredits(e.target.value)}
                                          className="bg-muted/20 text-[9px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                          placeholder="Credits"
                                        />
                                        <select 
                                          value={editCourseSem}
                                          onChange={e => setEditCourseSem(e.target.value)}
                                          className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                        >
                                          <option value="">Semester...</option>
                                          {(data.semesters || []).map(s => (
                                            <option key={s.id} value={s.title}>{cleanTitle(s.title)}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex justify-end gap-1.5">
                                        <button 
                                          onClick={() => setEditingCourseId(null)}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase border border-border rounded-[4px] text-muted-foreground"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={async () => {
                                            if (!editCourseName.trim()) return
                                            try {
                                              await onUpdate('courses', c.id, {
                                                title: editCourseName.trim(),
                                                Credits: editCourseCredits,
                                                Semester: wrapWL(editCourseSem)
                                              })
                                              toast.success('Course updated')
                                              setEditingCourseId(null)
                                              onRefresh()
                                            } catch {
                                              toast.error('Update failed')
                                            }
                                          }}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase bg-foreground text-background rounded-[4px]"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="text-[10px] font-black uppercase truncate text-foreground/90 leading-tight pr-10 font-sans">{cleanTitle(c.title)}</span>
                                        {grade && <span className={cn('px-1 py-0.5 text-[6.5px] font-black uppercase border shrink-0 font-sans', gradeColorClass(grade))}>{grade}</span>}
                                      </div>
                                      <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans font-medium">
                                        <span>{credits} CR · Sem: {cleanTitle(stripWL(getVal(c, 'Semester', 'semester')))}</span>
                                        {pendingCt > 0 ? (
                                          <span className="text-foreground">{pendingCt} due</span>
                                        ) : daysToExam !== null && daysToExam >= 0 ? (
                                          <span className={daysToExam <= 7 ? 'text-foreground' : 'text-muted-foreground/50'}>exam in {daysToExam}d</span>
                                        ) : (
                                          <span className="text-muted-foreground/30">Clear</span>
                                        )}
                                      </div>

                                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setEditingCourseId(c.id)
                                            setEditCourseName(c.title)
                                            setEditCourseCredits(credits)
                                            setEditCourseSem(stripWL(getVal(c, 'Semester', 'semester')))
                                          }}
                                          className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground/45 hover:group-hover:text-foreground hover:bg-muted/10 rounded transition-all"
                                        >
                                          <Edit2 size={9} />
                                        </button>
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (confirm(`Delete course "${cleanTitle(c.title)}"?`)) {
                                              onDelete('courses', c.id).then(onRefresh);
                                            } 
                                          }}
                                          className="p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all"
                                        >
                                          <Trash2 size={9} />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeCoursesTab === 'hubs' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {isAddingHubsTab && (
                          <div className="p-3 border border-border/80 bg-bento-card rounded-[6px] space-y-2.5 font-sans shrink-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">Add Study Hub</span>
                            <div className="space-y-1.5">
                              <input 
                                type="text"
                                value={newHubsTabName}
                                onChange={e => setNewHubsTabName(e.target.value)}
                                placeholder="Hub title (e.g. Chapter 3 Hub)"
                                className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/30 p-1.5 border border-border/50 rounded-[4px]"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select 
                                  value={newHubsTabCourse}
                                  onChange={e => setNewHubsTabCourse(e.target.value)}
                                  className="w-full bg-bento-card text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border rounded-[4px]"
                                >
                                  <option value="">Course...</option>
                                  {courses.map(c => (
                                    <option key={c.id} value={c.title}>{cleanTitle(c.title)}</option>
                                  ))}
                                </select>
                                <input 
                                  type="text"
                                  value={newHubsTabUnit}
                                  onChange={e => setNewHubsTabUnit(e.target.value)}
                                  placeholder="Unit (e.g. Chapter 3)"
                                  className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => { setIsAddingHubsTab(false); setNewHubsTabName('') }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/10 rounded-[4px] text-muted-foreground transition-colors font-sans"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!newHubsTabName.trim()) return
                                  try {
                                    await onCreate('study planner', newHubsTabName.trim(), {
                                      course: wrapWL(newHubsTabCourse),
                                      unit: newHubsTabUnit,
                                      status: wrapWL('Active')
                                    })
                                    toast.success('Study hub created')
                                    setNewHubsTabName('')
                                    setIsAddingHubsTab(false)
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

                        {displayedHubsTab.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No study hubs</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {displayedHubsTab.map((hub, idx) => {
                              const isEditing = editingHubId === hub.id
                              const isDone = stripWL(getVal(hub, 'status', 'Status')).toLowerCase().includes('complet')
                              return (
                                <div key={idx} onClick={() => !isEditing && onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
                                  className={cn("p-2.5 border border-border bg-bento-card rounded-[6px] transition-colors flex flex-col gap-1.5 font-sans relative group", 
                                    !isEditing && "hover:bg-bento-item/20 cursor-pointer")}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                      <input 
                                        type="text"
                                        value={editHubName}
                                        onChange={e => setEditHubName(e.target.value)}
                                        className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                      />
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <select 
                                          value={editHubCourse}
                                          onChange={e => setEditHubCourse(e.target.value)}
                                          className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                        >
                                          <option value="">Course...</option>
                                          {courses.map(c => (
                                            <option key={c.id} value={c.title}>{cleanTitle(c.title)}</option>
                                          ))}
                                        </select>
                                        <input 
                                          type="text"
                                          value={editHubUnit}
                                          onChange={e => setEditHubUnit(e.target.value)}
                                          className="bg-muted/20 text-[9px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                          placeholder="Unit"
                                        />
                                        <select 
                                          value={editHubStatus}
                                          onChange={e => setEditHubStatus(e.target.value)}
                                          className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                        >
                                          <option value="Active">Active</option>
                                          <option value="Completed">Completed</option>
                                        </select>
                                      </div>
                                      <div className="flex justify-end gap-1.5">
                                        <button 
                                          onClick={() => setEditingHubId(null)}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase border border-border rounded-[4px] text-muted-foreground"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={async () => {
                                            if (!editHubName.trim()) return
                                            try {
                                              await onUpdate('study planner', hub.id, {
                                                title: editHubName.trim(),
                                                course: wrapWL(editHubCourse),
                                                unit: editHubUnit,
                                                status: wrapWL(editHubStatus)
                                              })
                                              toast.success('Study hub updated')
                                              setEditingHubId(null)
                                              onRefresh()
                                            } catch {
                                              toast.error('Update failed')
                                            }
                                          }}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase bg-foreground text-background rounded-[4px]"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className={cn("text-[10px] font-black uppercase truncate text-foreground/90 pr-10 font-sans", isDone && "line-through text-muted-foreground/60")}>
                                          {cleanTitle(hub.title || hub.id)}
                                        </span>
                                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                          <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors font-sans" />
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              setEditingHubId(hub.id)
                                              setEditHubName(hub.title || hub.id)
                                              setEditHubCourse(stripWL(getVal(hub, 'course', 'Course')))
                                              setEditHubUnit(getVal(hub, 'unit', 'Unit'))
                                              setEditHubStatus(stripWL(getVal(hub, 'status', 'Status')) || 'Active')
                                            }}
                                            className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground/45 hover:group-hover:text-foreground hover:bg-muted/10 rounded transition-all"
                                          >
                                            <Edit2 size={9} />
                                          </button>
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              if (confirm(`Delete study hub "${cleanTitle(hub.title || hub.id)}"?`)) {
                                                onDelete('study planner', hub.id).then(onRefresh);
                                              } 
                                            }}
                                            className="p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all"
                                          >
                                            <Trash2 size={9} />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center text-[7px] font-black uppercase text-muted-foreground/50 tracking-wider">
                                        <span>Course: {cleanTitle(stripWL(getVal(hub, 'course', 'Course')) || '--')}</span>
                                        <span>Unit: {getVal(hub, 'unit', 'Unit') || '--'}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeCoursesTab === 'inbox' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {isAddingInbox && (
                          <div className="p-3 border border-border/80 bg-bento-card rounded-[6px] space-y-2.5 font-sans shrink-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">Create Inbox Note</span>
                            <input 
                              type="text"
                              value={newInboxName}
                              onChange={e => setNewInboxName(e.target.value)}
                              placeholder="Note filename (e.g. Lecture Notes)"
                              className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/30 p-1.5 border border-border/50 rounded-[4px]"
                            />
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => setIsAddingInbox(false)}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/10 rounded-[4px] text-muted-foreground transition-colors font-sans"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!newInboxName.trim()) return
                                  try {
                                    await sidecarApi.createObsidianFile(`database/inbox/${newInboxName.trim()}.md`, `# ${newInboxName.trim()}`)
                                    toast.success('Inbox note created')
                                    setNewInboxName('')
                                    setIsAddingInbox(false)
                                    // Refresh files
                                    sidecarApi.aterListInbox().then(res => setInboxFiles(res?.files || []))
                                  } catch {
                                    toast.error('Failed to create note')
                                  }
                                }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 rounded-[4px] transition-colors font-sans"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        {displayedInbox.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">Inbox is empty</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {displayedInbox.map((file, idx) => {
                              const filename = file.name || file.path?.split('/').pop() || 'Untitled'
                              const isEditing = editingInboxPath === file.path
                              return (
                                <div key={idx} onClick={() => !isEditing && onOpenNote(file.path)}
                                  className={cn("p-2.5 border border-border bg-bento-card rounded-[6px] transition-colors flex flex-col gap-1.5 font-sans relative group", 
                                    !isEditing && "hover:bg-bento-item/20 cursor-pointer")}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                      <input 
                                        type="text"
                                        value={editInboxName}
                                        onChange={e => setEditInboxName(e.target.value)}
                                        className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <button 
                                          onClick={() => setEditingInboxPath(null)}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase border border-border rounded-[4px] text-muted-foreground"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={async () => {
                                            if (!editInboxName.trim()) return
                                            try {
                                              const dir = file.path.substring(0, file.path.lastIndexOf('/'))
                                              const newPath = `${dir}/${editInboxName.trim()}.md`
                                              await sidecarApi.moveObsidianItem(file.path, newPath)
                                              toast.success('File renamed')
                                              setEditingInboxPath(null)
                                              sidecarApi.aterListInbox().then(res => setInboxFiles(res?.files || []))
                                            } catch {
                                              toast.error('Rename failed')
                                            }
                                          }}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase bg-foreground text-background rounded-[4px]"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-black uppercase truncate text-foreground/90 pr-10 font-sans">{cleanTitle(filename)}</span>
                                      
                                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                        <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors font-sans" />
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setEditingInboxPath(file.path)
                                            setEditInboxName(filename.replace(/\.md$/, ''))
                                          }}
                                          className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground/45 hover:group-hover:text-foreground hover:bg-muted/10 rounded transition-all"
                                        >
                                          <Edit2 size={9} />
                                        </button>
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (confirm(`Delete inbox note "${filename}"?`)) {
                                              sidecarApi.deleteObsidianItem(file.path).then(() => {
                                                sidecarApi.aterListInbox().then(res => setInboxFiles(res?.files || []))
                                              })
                                            } 
                                          }}
                                          className="p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all"
                                        >
                                          <Trash2 size={9} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeCoursesTab === 'pdf' && (
                      <div className="flex-grow flex flex-col gap-3 font-sans">
                        {isAddingPdf && (
                          <div className="p-3 border border-border/80 bg-bento-card rounded-[6px] space-y-2.5 font-sans shrink-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">Add PDF placeholder</span>
                            <input 
                              type="text"
                              value={newPdfName}
                              onChange={e => setNewPdfName(e.target.value)}
                              placeholder="PDF filename (e.g. Syllabus)"
                              className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/30 p-1.5 border border-border/50 rounded-[4px]"
                            />
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => setIsAddingPdf(false)}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/10 rounded-[4px] text-muted-foreground transition-colors font-sans"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!newPdfName.trim()) return
                                  try {
                                    await sidecarApi.createObsidianFile(`database/pdf/${newPdfName.trim()}.pdf`, '')
                                    toast.success('PDF placeholder created')
                                    setNewPdfName('')
                                    setIsAddingPdf(false)
                                    // Refresh files
                                    sidecarApi.listObsidianFiles().then(res => {
                                      const pdfs = (res?.files || []).filter((f: any) => !f.is_dir && f.path.toLowerCase().endsWith('.pdf'))
                                      setPdfFiles(pdfs)
                                    })
                                  } catch {
                                    toast.error('Failed to create PDF')
                                  }
                                }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 rounded-[4px] transition-colors font-sans"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        {displayedPDFs.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No PDFs in vault</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {displayedPDFs.map((file, idx) => {
                              const filename = file.name || file.path?.split('/').pop() || 'Untitled'
                              const isEditing = editingPdfPath === file.path
                              return (
                                <div key={idx} onClick={() => !isEditing && onOpenNote(file.path)}
                                  className={cn("p-2.5 border border-border bg-bento-card rounded-[6px] transition-colors flex flex-col gap-1.5 font-sans relative group", 
                                    !isEditing && "hover:bg-bento-item/20 cursor-pointer")}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                      <input 
                                        type="text"
                                        value={editPdfName}
                                        onChange={e => setEditPdfName(e.target.value)}
                                        className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <button 
                                          onClick={() => setEditingPdfPath(null)}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase border border-border rounded-[4px] text-muted-foreground"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={async () => {
                                            if (!editPdfName.trim()) return
                                            try {
                                              const dir = file.path.substring(0, file.path.lastIndexOf('/'))
                                              const newPath = `${dir}/${editPdfName.trim()}.pdf`
                                              await sidecarApi.moveObsidianItem(file.path, newPath)
                                              toast.success('PDF renamed')
                                              setEditingPdfPath(null)
                                              sidecarApi.listObsidianFiles().then(res => {
                                                const pdfs = (res?.files || []).filter((f: any) => !f.is_dir && f.path.toLowerCase().endsWith('.pdf'))
                                                setPdfFiles(pdfs)
                                              })
                                            } catch {
                                              toast.error('Rename failed')
                                            }
                                          }}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase bg-foreground text-background rounded-[4px]"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-black uppercase truncate text-foreground/90 pr-10 font-sans">{cleanTitle(filename)}</span>
                                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                        <ChevronRight size={10} className="text-muted-foreground/30 group-hover:text-foreground/60 transition-colors font-sans" />
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setEditingPdfPath(file.path)
                                            setEditPdfName(filename.replace(/\.pdf$/, ''))
                                          }}
                                          className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground/45 hover:group-hover:text-foreground hover:bg-muted/10 rounded transition-all"
                                        >
                                          <Edit2 size={9} />
                                        </button>
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (confirm(`Delete PDF "${filename}"?`)) {
                                              sidecarApi.deleteObsidianItem(file.path).then(() => {
                                                sidecarApi.listObsidianFiles().then(res => {
                                                  const pdfs = (res?.files || []).filter((f: any) => !f.is_dir && f.path.toLowerCase().endsWith('.pdf'))
                                                  setPdfFiles(pdfs)
                                                })
                                              })
                                            } 
                                          }}
                                          className="p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all"
                                        >
                                          <Trash2 size={9} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* Combined Assignments & Exams Card */}
                <section className="p-5 border border-border bg-bento-card rounded-[8px] flex flex-col space-y-4 flex-1 min-h-0">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2 shrink-0">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSidebarTab('assignments')}
                        className={cn("text-[9px] font-black uppercase tracking-wider transition-colors pb-1 border-b-2 -mb-[9px] focus:outline-none font-sans", 
                          sidebarTab === 'assignments' 
                            ? "text-foreground border-foreground" 
                            : "text-muted-foreground/45 border-transparent hover:text-foreground")}
                      >
                        Assignments
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
                    </div>
                    {sidebarTab === 'assignments' && (
                      <button 
                        onClick={() => navigateTo('ASSIGNMENTS')} 
                        className="px-2.5 h-6 bg-muted/10 text-[7px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/20 border border-border/40 hover:border-foreground/30 rounded-[5px] transition-all font-sans flex items-center justify-center cursor-pointer font-bold"
                      >
                        Open Page →
                      </button>
                    )}
                    {sidebarTab === 'exams' && (
                      <button 
                        onClick={() => navigateTo('EXAMS')} 
                        className="px-2.5 h-6 bg-muted/10 text-[7px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted/20 border border-border/40 hover:border-foreground/30 rounded-[5px] transition-all font-sans flex items-center justify-center cursor-pointer font-bold"
                      >
                        Open Page →
                      </button>
                    )}
                  </div>

                  {/* Tab Controls Row */}
                  <div className="py-1 shrink-0 flex gap-2 flex-wrap items-center">
                    {sidebarTab === 'assignments' && (
                      <>
                        <div className="flex-1 min-w-[100px] flex items-center gap-1.5 px-2 py-0.5 bg-muted/10 border border-border/40 rounded-[4px]">
                          <Search size={9} className="text-muted-foreground/45" />
                          <input 
                            type="text"
                            value={assignmentsSearch}
                            onChange={e => setAssignmentsSearch(e.target.value)}
                            placeholder="Search tasks..."
                            className="bg-transparent text-[9px] font-bold text-foreground outline-none w-full placeholder:text-muted-foreground/25 font-sans"
                          />
                        </div>

                        <select 
                          value={assignmentsFilter}
                          onChange={e => setAssignmentsFilter(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="All">All Statuses</option>
                        </select>

                        <select 
                          value={assignmentsSort}
                          onChange={e => setAssignmentsSort(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="dueDate">Sort: Due Date</option>
                          <option value="title">Sort: Title</option>
                          <option value="course">Sort: Course</option>
                        </select>

                        <button 
                          onClick={() => { setIsAddingAssignment(!isAddingAssignment); if (!isAddingAssignment) { setNewAssignmentName(''); setNewAssignmentCourse(courses[0]?.title || ''); setNewAssignmentDueDate('') } }}
                          className="px-2 py-0.5 bg-muted/20 text-[9px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] flex items-center gap-1 transition-all"
                        >
                          <Plus size={9} /> Add
                        </button>
                      </>
                    )}

                    {sidebarTab === 'exams' && (
                      <>
                        <div className="flex-1 min-w-[100px] flex items-center gap-1.5 px-2 py-0.5 bg-muted/10 border border-border/40 rounded-[4px]">
                          <Search size={9} className="text-muted-foreground/45" />
                          <input 
                            type="text"
                            value={examsSearch}
                            onChange={e => setExamsSearch(e.target.value)}
                            placeholder="Search exams..."
                            className="bg-transparent text-[9px] font-bold text-foreground outline-none w-full placeholder:text-muted-foreground/25 font-sans"
                          />
                        </div>

                        <select 
                          value={examsFilter}
                          onChange={e => setExamsFilter(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Past">Past</option>
                          <option value="All">All Exams</option>
                        </select>

                        <select 
                          value={examsSort}
                          onChange={e => setExamsSort(e.target.value as any)}
                          className="bg-bento-card text-[9.5px] font-bold text-foreground border border-border px-1.5 py-0.5 rounded-[4px] focus:outline-none hover:bg-bento-item/50 transition-colors cursor-pointer"
                        >
                          <option value="date">Sort: Date</option>
                          <option value="title">Sort: Title</option>
                          <option value="course">Sort: Course</option>
                        </select>

                        <button 
                          onClick={() => { setIsAddingExam(!isAddingExam); if (!isAddingExam) { setNewExamName(''); setNewExamCourse(courses[0]?.title || ''); setNewExamDate(''); setNewExamType('Midterm') } }}
                          className="px-2 py-0.5 bg-muted/20 text-[9px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] flex items-center gap-1 transition-all"
                        >
                          <Plus size={9} /> Add
                        </button>
                      </>
                    )}
                  </div>

                  {/* Tab Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar-mini pr-1 pt-1.5 space-y-3">
                    {sidebarTab === 'assignments' && (
                      <div className="space-y-3 font-sans">
                        {isAddingAssignment && (
                          <div className="p-3 border border-border/80 bg-bento-card rounded-[6px] space-y-2.5 font-sans shrink-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">Add Assignment</span>
                            <div className="space-y-1.5">
                              <input 
                                type="text"
                                value={newAssignmentName}
                                onChange={e => setNewAssignmentName(e.target.value)}
                                placeholder="Assignment title..."
                                className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/30 p-1.5 border border-border/50 rounded-[4px]"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select 
                                  value={newAssignmentCourse}
                                  onChange={e => setNewAssignmentCourse(e.target.value)}
                                  className="w-full bg-bento-card text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border rounded-[4px]"
                                >
                                  <option value="">Course...</option>
                                  {courses.map(c => (
                                    <option key={c.id} value={c.title}>{cleanTitle(c.title)}</option>
                                  ))}
                                </select>
                                <input 
                                  type="date"
                                  value={newAssignmentDueDate}
                                  onChange={e => setNewAssignmentDueDate(e.target.value)}
                                  className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => { setIsAddingAssignment(false); setNewAssignmentName('') }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/10 rounded-[4px] text-muted-foreground transition-colors font-sans"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!newAssignmentName.trim()) return
                                  try {
                                    await onCreate('assignments', newAssignmentName.trim(), {
                                      Course: wrapWL(newAssignmentCourse),
                                      due_date: newAssignmentDueDate,
                                      done: wrapWL('false')
                                    })
                                    toast.success('Assignment created')
                                    setNewAssignmentName('')
                                    setIsAddingAssignment(false)
                                    onRefresh()
                                  } catch {
                                    toast.error('Failed to create assignment')
                                  }
                                }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 rounded-[4px] transition-colors font-sans"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        {displayedAssignments.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans">No assignments match filter</p>
                        ) : (
                          <div className="space-y-2">
                            {displayedAssignments.map((a, idx) => {
                              const daysLeft = getDaysUntil(a.due_date)
                              const isEditing = editingAssignmentId === a.id
                              return (
                                <div key={idx} onClick={() => !isEditing && navigateTo('ASSIGNMENTS', a.id)}
                                  className={cn("p-2.5 border border-border bg-bento-item/25 rounded-[6px] transition-colors flex flex-col gap-2 font-sans relative group", 
                                    !isEditing && "hover:bg-bento-item/50 cursor-pointer")}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                      <input 
                                        type="text"
                                        value={editAssignmentName}
                                        onChange={e => setEditAssignmentName(e.target.value)}
                                        className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                      />
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <select 
                                          value={editAssignmentCourse}
                                          onChange={e => setEditAssignmentCourse(e.target.value)}
                                          className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                        >
                                          <option value="">Course...</option>
                                          {courses.map(c => (
                                            <option key={c.id} value={c.title}>{cleanTitle(c.title)}</option>
                                          ))}
                                        </select>
                                        <input 
                                          type="date"
                                          value={editAssignmentDueDate}
                                          onChange={e => setEditAssignmentDueDate(e.target.value)}
                                          className="bg-muted/20 text-[9px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                        />
                                        <select 
                                          value={editAssignmentStatus}
                                          onChange={e => setEditAssignmentStatus(e.target.value)}
                                          className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                        >
                                          <option value="false">Active</option>
                                          <option value="true">Completed</option>
                                        </select>
                                      </div>
                                      <div className="flex justify-end gap-1.5">
                                        <button 
                                          onClick={() => setEditingAssignmentId(null)}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase border border-border rounded-[4px] text-muted-foreground"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={async () => {
                                            if (!editAssignmentName.trim()) return
                                            try {
                                              await onUpdate('assignments', a.id, {
                                                title: editAssignmentName.trim(),
                                                Course: wrapWL(editAssignmentCourse),
                                                due_date: editAssignmentDueDate,
                                                done: wrapWL(editAssignmentStatus)
                                              })
                                              toast.success('Assignment updated')
                                              setEditingAssignmentId(null)
                                              onRefresh()
                                            } catch {
                                              toast.error('Update failed')
                                            }
                                          }}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase bg-foreground text-background rounded-[4px]"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <button onClick={(e) => toggleAssignment(a, e)}
                                            className={cn("w-4 h-4 border rounded-[3px] flex items-center justify-center shrink-0 transition-colors bg-bento-card",
                                              a.done ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
                                          >
                                            {a.done && <Check size={9} strokeWidth={4} className="text-background" />}
                                          </button>
                                          <span className={cn("text-[10px] font-black uppercase truncate text-foreground/90 pr-10", a.done && "line-through text-muted-foreground/60")}>
                                            {cleanTitle(a.title)}
                                          </span>
                                        </div>
                                        
                                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
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
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              setEditingAssignmentId(a.id)
                                              setEditAssignmentName(a.title)
                                              setEditAssignmentCourse(stripWL(getVal(a, 'Course', 'course')))
                                              setEditAssignmentDueDate(a.due_date || '')
                                              setEditAssignmentStatus(String(a.done || 'false'))
                                            }}
                                            className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground/45 hover:group-hover:text-foreground hover:bg-muted/10 rounded transition-all"
                                          >
                                            <Edit2 size={9} />
                                          </button>
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              if (confirm(`Delete task "${cleanTitle(a.title)}"?`)) {
                                                onDelete('assignments', a.id).then(onRefresh);
                                              } 
                                            }}
                                            className="p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all"
                                          >
                                            <Trash2 size={9} />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center text-[7px] font-black uppercase text-muted-foreground/40 tracking-wider">
                                        <span>Course: {cleanTitle(stripWL(getVal(a, 'Course', 'course')) || '--')}</span>
                                        <span>Due: {a.due_date ? format(new Date(a.due_date), 'MMM d, yyyy') : '--'}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {sidebarTab === 'exams' && (
                      <div className="space-y-3 font-sans">
                        {isAddingExam && (
                          <div className="p-3 border border-border/80 bg-bento-card rounded-[6px] space-y-2.5 font-sans shrink-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">Add Exam</span>
                            <div className="space-y-1.5">
                              <input 
                                type="text"
                                value={newExamName}
                                onChange={e => setNewExamName(e.target.value)}
                                placeholder="Exam title..."
                                className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/30 p-1.5 border border-border/50 rounded-[4px]"
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <select 
                                  value={newExamCourse}
                                  onChange={e => setNewExamCourse(e.target.value)}
                                  className="w-full bg-bento-card text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border rounded-[4px]"
                                >
                                  <option value="">Course...</option>
                                  {courses.map(c => (
                                    <option key={c.id} value={c.title}>{cleanTitle(c.title)}</option>
                                  ))}
                                </select>
                                <input 
                                  type="date"
                                  value={newExamDate}
                                  onChange={e => setNewExamDate(e.target.value)}
                                  className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                />
                                <select 
                                  value={newExamType}
                                  onChange={e => setNewExamType(e.target.value)}
                                  className="w-full bg-bento-card text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border rounded-[4px]"
                                >
                                  <option value="Midterm">Midterm</option>
                                  <option value="Final">Final</option>
                                  <option value="Quiz">Quiz</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => { setIsAddingExam(false); setNewExamName('') }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/10 rounded-[4px] text-muted-foreground transition-colors font-sans"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!newExamName.trim()) return
                                  try {
                                    await onCreate('exams', newExamName.trim(), {
                                      Course: wrapWL(newExamCourse),
                                      date: newExamDate,
                                      Type: wrapWL(newExamType)
                                    })
                                    toast.success('Exam created')
                                    setNewExamName('')
                                    setIsAddingExam(false)
                                    onRefresh()
                                  } catch {
                                    toast.error('Failed to create exam')
                                  }
                                }}
                                className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 rounded-[4px] transition-colors font-sans"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                        {displayedExams.length === 0 ? (
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans">No exams match filter</p>
                        ) : (
                          <div className="space-y-2">
                            {displayedExams.map((e, idx) => {
                              const daysLeft = differenceInDays(new Date(e.date), now)
                              const isEditing = editingExamId === e.id
                              return (
                                <div key={idx} onClick={() => !isEditing && navigateTo('EXAMS', e.id)}
                                  className={cn("p-2.5 border border-border bg-bento-item/25 rounded-[6px] transition-colors flex flex-col gap-2 font-sans relative group", 
                                    !isEditing && "hover:bg-bento-item/50 cursor-pointer")}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                      <input 
                                        type="text"
                                        value={editExamName}
                                        onChange={e => setEditExamName(e.target.value)}
                                        className="w-full bg-muted/20 text-[10px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                      />
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <select 
                                          value={editExamCourse}
                                          onChange={e => setEditExamCourse(e.target.value)}
                                          className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                        >
                                          <option value="">Course...</option>
                                          {courses.map(c => (
                                            <option key={c.id} value={c.title}>{cleanTitle(c.title)}</option>
                                          ))}
                                        </select>
                                        <input 
                                          type="date"
                                          value={editExamDate}
                                          onChange={e => setEditExamDate(e.target.value)}
                                          className="bg-muted/20 text-[9px] font-bold text-foreground focus:outline-none p-1.5 border border-border/50 rounded-[4px]"
                                        />
                                        <select 
                                          value={editExamType}
                                          onChange={e => setEditExamType(e.target.value)}
                                          className="bg-bento-card text-[9px] font-bold text-foreground border border-border p-1.5 rounded-[4px] focus:outline-none"
                                        >
                                          <option value="Midterm">Midterm</option>
                                          <option value="Final">Final</option>
                                          <option value="Quiz">Quiz</option>
                                        </select>
                                      </div>
                                      <div className="flex justify-end gap-1.5">
                                        <button 
                                          onClick={() => setEditingExamId(null)}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase border border-border rounded-[4px] text-muted-foreground"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={async () => {
                                            if (!editExamName.trim()) return
                                            try {
                                              await onUpdate('exams', e.id, {
                                                title: editExamName.trim(),
                                                Course: wrapWL(editExamCourse),
                                                date: editExamDate,
                                                Type: wrapWL(editExamType)
                                              })
                                              toast.success('Exam updated')
                                              setEditingExamId(null)
                                              onRefresh()
                                            } catch {
                                              toast.error('Update failed')
                                            }
                                          }}
                                          className="px-2 py-0.5 text-[8px] font-black uppercase bg-foreground text-background rounded-[4px]"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-[10px] font-black uppercase truncate text-foreground/90 pr-10">{cleanTitle(e.title)}</span>
                                          <span className="text-[7px] font-black uppercase text-muted-foreground/45 mt-0.5">
                                            {e.date ? format(new Date(e.date), 'MMM d, yyyy') : '--'}
                                          </span>
                                        </div>
                                        
                                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                          <span className={cn("text-[7px] font-black uppercase px-1.5 py-0.5 rounded-[4px] border shrink-0",
                                            daysLeft <= 3 
                                              ? "bg-foreground text-background border-foreground font-black" 
                                              : "bg-muted/10 border-border/40 text-muted-foreground/60"
                                          )}>
                                            {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                                          </span>
                                          <button 
                                            onClick={(evt) => { 
                                              evt.stopPropagation(); 
                                              setEditingExamId(e.id)
                                              setEditExamName(e.title)
                                              setEditExamCourse(stripWL(getVal(e, 'Course', 'course')))
                                              setEditExamDate(e.date || '')
                                              setEditExamType(stripWL(getVal(e, 'Type', 'type')) || 'Midterm')
                                            }}
                                            className="p-1 text-muted-foreground/0 group-hover:text-muted-foreground/45 hover:group-hover:text-foreground hover:bg-muted/10 rounded transition-all"
                                          >
                                            <Edit2 size={9} />
                                          </button>
                                          <button 
                                            onClick={(evt) => { 
                                              evt.stopPropagation(); 
                                              if (confirm(`Delete exam "${cleanTitle(e.title)}"?`)) {
                                                onDelete('exams', e.id).then(onRefresh);
                                              } 
                                            }}
                                            className="p-1 text-muted-foreground/0 group-hover:text-destructive/50 hover:group-hover:text-destructive hover:bg-destructive/15 rounded transition-all"
                                          >
                                            <Trash2 size={9} />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center text-[7px] font-black uppercase text-muted-foreground/40 tracking-wider">
                                        <span>Course: {cleanTitle(stripWL(getVal(e, 'Course', 'course')) || '--')}</span>
                                        <span>Type: {stripWL(getVal(e, 'Type', 'type')) || '--'}</span>
                                      </div>
                                    </>
                                  )}
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

        {selectedCalendarDay && (() => {
          const summary = getDaySummary(selectedCalendarDay)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
              {/* Backdrop close area */}
              <div className="absolute inset-0" onClick={() => setSelectedCalendarDay(null)} />
              
              <div className="bg-bento-panel border border-border/40 shadow-xl rounded-[16px] max-w-md w-full p-6 space-y-5 relative z-10 select-none animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Day View</p>
                    <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                      {format(selectedCalendarDay, 'EEEE, MMM d')}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedCalendarDay(null)}
                    className="p-1.5 hover:bg-muted/20 border border-transparent hover:border-border/30 rounded-[8px] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Counts Overview Grid */}
                <div className="grid grid-cols-5 gap-2 border-b border-border/20 pb-4">
                  {[
                    { label: 'Exams', count: summary.exams.length, color: 'text-orange-500 bg-orange-500/10' },
                    { label: 'Tasks', count: summary.assignments.length, color: 'text-blue-500 bg-blue-500/10' },
                    { label: 'Study', count: summary.sessions.length, color: 'text-emerald-500 bg-emerald-500/10' },
                    { label: 'Practice', count: summary.practices.length, color: 'text-purple-500 bg-purple-500/10' },
                    { label: 'Notes', count: summary.notes.length, color: 'text-pink-500 bg-pink-500/10' }
                  ].map((cat, idx) => (
                    <div key={idx} className="flex flex-col items-center p-2 rounded-[8px] bg-bento-card border border-border/30">
                      <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider mb-1">
                        {cat.label}
                      </span>
                      <span className={cn("text-base font-black px-2 py-0.5 rounded-[4px]", cat.color)}>
                        {cat.count}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Events Detail List */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {summary.total === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-2 opacity-35">
                      <Calendar size={28} strokeWidth={1} className="text-muted-foreground" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">No events scheduled</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Render categories if they have events */}
                      {[
                        { title: 'Exams', list: summary.exams, type: 'Exam' },
                        { title: 'Assignments', list: summary.assignments, type: 'Assignment' },
                        { title: 'Study Sessions', list: summary.sessions, type: 'Study Session' },
                        { title: 'Practice', list: summary.practices, type: 'Practice' },
                        { title: 'Notes Visited', list: summary.notes, type: 'Note Visit' }
                      ].map((group, gIdx) => {
                        if (group.list.length === 0) return null;
                        return (
                          <div key={gIdx} className="space-y-1.5">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 pl-1">
                              {group.title}
                            </h4>
                            <div className="space-y-1">
                              {group.list.map((ev, evIdx) => {
                                const style = EVENT_COLORS[ev._type] || EVENT_COLORS['Note Visit']
                                const isClickable = ev._type === 'Assignment' || ev._type === 'Exam' || ev._type === 'Note Visit' || ev._type === 'Study' || ev._type === 'Study Session'
                                return (
                                  <div
                                    key={evIdx}
                                    onClick={() => {
                                      if (!isClickable) return;
                                      setSelectedCalendarDay(null);
                                      const evAny = ev as any;
                                      if (evAny._type === 'Assignment') navigateTo('ASSIGNMENTS', evAny.id);
                                      else if (evAny._type === 'Exam') navigateTo('EXAMS', evAny.id);
                                      else if (evAny._type === 'Note Visit' && evAny.id) onOpenNote(evAny.id);
                                      else if (evAny._type === 'Study' && evAny.notePath) onOpenNote(evAny.notePath);
                                      else if (evAny._type === 'Study Session' && evAny.hub_id) {
                                        const sHub = (data.study_sessions || []).find(h => h.id === evAny.hub_id);
                                        onOpenNote(sHub?.path || `database/study planner/${evAny.hub_id}.md`);
                                      }
                                    }}
                                    className={cn(
                                      "flex items-center justify-between p-2.5 rounded-[8px] border text-xs transition-all",
                                      style.bg, style.border, style.text,
                                      isClickable ? "cursor-pointer hover:bg-opacity-80 active:scale-[0.98]" : ""
                                    )}
                                  >
                                    <span className="font-semibold truncate max-w-[280px]">{cleanTitle(ev.title)}</span>
                                     {(ev as any).done && <CheckCircle size={12} className="shrink-0 opacity-80" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}
    </div>
  )
}
