import React, { useState, useMemo } from 'react'
import { Check, Trash2, Plus, ChevronRight, BookOpen, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal, getBoolVal, getYearOrder, deriveStatus, wrapWL, cleanTitle, calcGPA } from './utils'
import { SectionHeader, EmptyState, StatCard, AcademicRoadmap, ProgramSetupForm, BigPropertyCard, EditableTitle, CreateBanner } from './SharedComponents'
import type { TabProps } from './types'

const INTERNAL_YEAR_KEYS = ['id', 'title', 'path', 'last_synced', 'links', 'created_time', 'last_edited_time']
const INTERNAL_SEM_KEYS  = ['id', 'title', 'path', 'last_synced', 'links', 'created_time', 'last_edited_time', 'Year', 'year']

export default function ProgramTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, onRefresh }: TabProps) {
  const [selectedYearId, setSelectedYearId]     = useState<string | null>(null)
  const [selectedSemId,  setSelectedSemId]      = useState<string | null>(null)
  const [showSetup,      setShowSetup]          = useState(false)
  const [addingSem,      setAddingSem]          = useState(false)
  const [addingCourse,   setAddingCourse]       = useState(false)

  const years     = data.years     || []
  const semesters = data.semesters || []
  const courses   = data.courses   || []
  const yearSchema = databases.find(d => d.id === 'years')?.schema     || {}
  const semSchema  = databases.find(d => d.id === 'semesters')?.schema || {}

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
                className="p-5 border border-[#242426] bg-[#0e0e0f] rounded-[8px] cursor-pointer hover:bg-[#232326]/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#a1a1aa]/65">Course</span>
                  <span className="text-[9px] font-black text-white">{getVal(c, 'Credits', 'credits')} CR</span>
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-white">{cleanTitle(c.title)}</h3>
                <p className="text-[8px] font-black uppercase tracking-widest text-[#a1a1aa]/50 mt-1">{getVal(c, 'Status', 'status')}</p>
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
                className="px-3 py-1.5 border border-[#242426] bg-[#232326]/50 rounded-[4px] text-[8px] font-black uppercase text-white hover:bg-[#232326] transition-colors">
                Set Active
              </button>
            )}
            {derived === 'Completed' && !currentStatus.toLowerCase().includes('complet') && (
              <button onClick={() => onUpdate('years', selectedYearId, { Status: '[[Completed]]' })}
                className="px-3 py-1.5 bg-[#232326]/50 border border-[#242426] rounded-[4px] text-[8px] font-black uppercase text-white hover:bg-[#232326] transition-colors">
                Mark Complete
              </button>
            )}
            <button onClick={() => onOpenNote(selectedYear.path || `database/years/${selectedYear.id}.md`)}
              className="p-2 text-[#a1a1aa] hover:text-white hover:bg-[#232326]/50 rounded-[4px] transition-colors">
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
                  className="flex items-center justify-between p-4 border border-[#242426] bg-[#0e0e0f] rounded-[8px] cursor-pointer hover:bg-[#232326]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn('w-5 h-5 border rounded-[4px] flex items-center justify-center text-[8px] font-black shrink-0',
                      isDone ? 'border-white bg-white text-[#151517]' :
                      isActive ? 'border-[#a1a1aa] text-white bg-[#232326]' : 'border-[#242426] text-muted-foreground')}>
                      {isDone ? <Check size={9} strokeWidth={4} /> : idx + 1}
                    </div>
                    <div>
                      <span className="text-[12px] font-black uppercase text-white">{cleanTitle(s.title)}</span>
                      <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-[#a1a1aa]/65">{sStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[8px] font-black uppercase text-muted-foreground">{semCourses.length} courses</span>
                    <ChevronRight size={11} className="text-[#a1a1aa]" />
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

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Roadmap Panel */}
      <aside className="w-56 shrink-0 border-r border-[#242426] flex flex-col overflow-hidden bg-transparent">
        <div className="flex items-center justify-between p-4 border-b border-[#242426]">
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a1a1aa] flex items-center gap-1.5">
            <GraduationCap size={10} /> Roadmap
          </span>
          <button onClick={() => setShowSetup(!showSetup)}
            className="px-2 py-1 bg-[#232326]/50 text-[7px] font-black uppercase tracking-widest hover:bg-[#232326] border border-[#242426] rounded-[4px] text-white transition-colors">
            {showSetup ? 'Back' : programYears.length > 0 ? 'Edit' : 'Setup'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {programYears.length > 0
            ? <AcademicRoadmap items={programYears} semesters={semesters} activeId={selectedYearId} onSelect={setSelectedYearId} />
            : <p className="text-[9px] font-black uppercase text-foreground/40 text-center mt-8">No program yet</p>
          }
        </div>
      </aside>

      {/* Right: Overview */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-24 space-y-10">
        {programYears.length === 0 || showSetup ? (
          <>
            {showSetup && <button onClick={() => setShowSetup(false)} className="text-[8px] font-black uppercase tracking-widest text-foreground/50 mb-4">← Back</button>}
            <ProgramSetupForm onScaffold={(n, y, l, c) => { handleScaffold(n, y, l, c); setShowSetup(false) }} />
          </>
        ) : (
          <div className="space-y-10">
            {/* Program Header */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50 mb-1">Program</p>
              <h1 className="text-3xl font-black uppercase tracking-tight">{activeProgram || 'Your Program'}</h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                {cleanTitle(getVal(activeYear, 'Academic Level', 'academic_level'))}
              </span>
            </div>

            {/* Program Stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Progress" value={`${completedYears} / ${targetYears} Years`}
                sub={`${Math.round((completedYears / targetYears) * 100)}% complete`} />
              <StatCard label="Active Year" value={cleanTitle(activeYear?.title || '--')}
                onClick={() => activeYear && setSelectedYearId(activeYear.id)} />
              <StatCard label="Active Semester" value={cleanTitle(activeSem?.title || '--')} accent
                onClick={() => activeSem && setSelectedSemId(activeSem.id)} />
              <StatCard label="Cumulative GPA"
                value={getVal(activeYear, 'Cumulative GPA', 'cumulative_gpa') || '--'} />
            </div>

            {/* Active Courses */}
            {activeCourses.length > 0 && (
              <section className="space-y-4">
                <SectionHeader title="Active Courses" count={activeCourses.length} />
                <div className="grid grid-cols-3 gap-4">
                  {activeCourses.map((c, idx) => (
                    <div key={idx} onClick={() => navigateTo('COURSES', c.id)}
                      className="p-4 border border-[#242426] bg-[#0e0e0f] rounded-[8px] flex items-center justify-between cursor-pointer hover:bg-[#232326]/30 transition-colors">
                      <div>
                        <span className="text-[13px] font-black uppercase text-white">{cleanTitle(c.title)}</span>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#a1a1aa]/65 mt-1">
                          {getVal(c, 'Credits', 'credits')} Credits
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-[#a1a1aa]" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All Years */}
            <section className="space-y-4">
              <SectionHeader title="All Years" count={programYears.length} />
              <div className="grid grid-cols-2 gap-4">
                {programYears.map((y, idx) => {
                  const status = stripWL(getVal(y, 'Status', 'status'))
                  const isDone = status.toLowerCase().includes('complet')
                  const isActive = getBoolVal(y, 'Current Year', 'current_year')
                  const ySems = semesters.filter(s => getVal(s, 'Year', 'year').toLowerCase() === String(y.title || '').toLowerCase())
                  return (
                    <div key={idx} onClick={() => setSelectedYearId(y.id)}
                      className={cn('p-5 border cursor-pointer rounded-[8px] transition-colors',
                        isActive ? 'border-[#a1a1aa] bg-[#232326]' : 'border-[#242426] bg-[#0e0e0f] hover:bg-[#232326]/30')}
                        style={{ contentVisibility: 'auto' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa]/65">Year</span>
                        {isActive && <div className="w-1.5 h-1.5 bg-white" />}
                        {isDone && <Check size={11} className="text-white" />}
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white">{cleanTitle(y.title)}</h3>
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#a1a1aa]/50 mt-1">
                        {status} · {ySems.length} semesters
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
