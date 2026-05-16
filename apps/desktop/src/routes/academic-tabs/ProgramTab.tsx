import React, {useState, useMemo} from 'react'
import {Check, Zap, Trash2, Plus, ChevronRight, BookOpen, Calendar} from 'lucide-react'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {stripWL, getVal, getBoolVal, getYearOrder, deriveStatus, wrapWL, cleanTitle} from './utils'
import {SectionHeader, EmptyState, StatCard, AcademicRoadmap, ProgramSetupForm, BigPropertyCard, EditableTitle} from './SharedComponents'
import type {TabProps} from './types'

export default function ProgramTab({data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, onRefresh}: TabProps) {
 const [selectedYearId, setSelectedYearId] = useState<string | null>(null)
 const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null)
 const [showSetup, setShowSetup] = useState(false)
 const [showProperties, setShowProperties] = useState(true)

 const years = data.years || []
 const semesters = data.semesters || []
 const courses = data.courses || []
 const yearSchema = databases.find(d => d.id === 'years')?.schema || {}
 const semesterSchema = databases.find(d => d.id === 'semesters')?.schema || {}

 const sorted = [...years].sort((a, b) => getYearOrder(a?.title || '') - getYearOrder(b?.title || ''))
 const activeYear = years.find(y => {
    const isCurrent = getBoolVal(y, 'Current Year', 'current_year')
    const status = String(stripWL(getVal(y, 'Status', 'status'))).toLowerCase()
    return isCurrent || status.includes('active')
  }) || years[0]

 const activeProgram = cleanTitle(stripWL(getVal(activeYear, 'Program', 'program')))
 const programYears = activeProgram
 ? sorted.filter(y => stripWL(getVal(y, 'Program', 'program')) === activeProgram)
 : sorted
 const completedCount = programYears.filter(y => stripWL(getVal(y, 'Status', 'status')).toLowerCase().includes('complet')).length
 const targetYears = parseInt(getVal(activeYear, 'Target Years', 'target_years')) || Math.max(programYears.length, 1)

 const selectedYear = sorted.find(y => y.id === selectedYearId)
 const relatedSemesters = semesters
 .filter(s => {
 const semYear = getVal(s, 'Year', 'year').toLowerCase().trim()
 const targetYear = String(selectedYear?.title || '').toLowerCase().trim()
 return semYear === targetYear && targetYear !== ''
})
 .sort((a, b) => {
 const order = ['Autumn', 'Fall', 'Winter', 'Spring', 'Summer']
 const ai = order.findIndex(o => String(a.title || '').includes(o))
 const bi = order.findIndex(o => String(b.title || '').includes(o))
 return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
})

 const handleScaffold = async (name: string, numYears: number, level: string, currentIdx: number) => {
  try {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
  const cleanName = cleanTitle(name)
  const promises = []
  for (let i = 0; i < numYears; i++) {
  const title = `Year ${romans[i] || (i + 1)}`
  const status = i < currentIdx ? wrapWL('Completed') : i === currentIdx ? wrapWL('Active') : wrapWL('Planned')
  promises.push(onCreate('years', title, {
  Program: wrapWL(cleanName),
  'Academic Level': wrapWL(level),
  Status: status,
  'Current Year': i === currentIdx,
  'Target Years': numYears,
  'Earned Credits': 0,
  'Target Credits': 0,
  'Cumulative GPA': 0.00
}))
}
  await Promise.all(promises)
  toast.success(`Program "${cleanName}" deployed!`)
  onRefresh()
} catch {toast.error('Scaffolding failed')}
}

 const handleUpdateProgram = async (oldName: string, newName: string, level: string, numYears: number) => {
  try {
  const toUpdate = years.filter(y => stripWL(getVal(y, 'Program', 'program')) === oldName)
  const cleanNewName = cleanTitle(newName)
  await Promise.all(toUpdate.map(y => 
  onUpdate('years', y.id, {
  Program: wrapWL(cleanNewName),
  'Academic Level': wrapWL(level),
  'Target Years': numYears
})
  ))
  toast.success('Program updated')
  onRefresh()
} catch {toast.error('Update failed')}
}

 const handleSetCurrentYear = async (id: string) => {
  try {
  await Promise.all(years.map(y => 
  onUpdate('years', y.id, {'Current Year': y.id === id})
  ))
  toast.success('Active year set')
} catch {toast.error('Failed to set active year')}
}

 // ── Semester Detail ────────────────────────────────────────────────────────
 if (selectedSemesterId) {
 const semester = semesters.find(s => s.id === selectedSemesterId)
 if (!semester) {setSelectedSemesterId(null); return null}
 const semCourses = courses.filter(c => {
 const courseSem = getVal(c, 'Semester', 'semester').toLowerCase()
 const targetSem = String(semester.title || '').toLowerCase()
 return courseSem.includes(targetSem) && targetSem !== ''
})

 return (
 <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
 <div className="flex items-start justify-between">
 <div>
 <button onClick={() => setSelectedSemesterId(null)} className="text-[8px] font-black uppercase tracking-widest text-foreground/50 mb-2 ">← {selectedYear?.title || 'Year'}</button>
 <EditableTitle
 value={semester.title}
 className="text-xl font-black uppercase tracking-tight"
 onSave={(next) => {
 onUpdate('semesters', semester.id, {title: next})
}}
 />
 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{cleanTitle(activeProgram)} · {cleanTitle(selectedYear?.title || '')}</span>
 </div>
 <div className="flex items-center gap-2">
                    <button onClick={() => onOpenNote(semester.path || `database/semesters/${semester.id}.md`)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-none " title="Open Note">
                        <BookOpen size={13} />
                    </button>
                    <button onClick={() => {onDelete('semesters', selectedSemesterId); setSelectedSemesterId(null)}}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none ">
                        <Trash2 size={13} />
                    </button>
 </div>
 </div>
 
 <div className="grid grid-cols-3 gap-4">
 <BigPropertyCard
 label="Status"
 value={semester.Status || semester.properties?.Status || 'Active'}
 schema={semesterSchema['Status']}
 onUpdate={(v) => onUpdate('semesters', selectedSemesterId, {Status: v})}
 />
 <StatCard label="Total Credits" value={semCourses.reduce((acc, c) => acc + (parseFloat(getVal(c, 'Credits', 'credits')) || 0), 0)} />
 <StatCard label="Courses" value={semCourses.length} />
 </div>

 <div className="grid grid-cols-4 gap-4">
 {(() => {
 const internal = ['id', 'title', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by', 'Status', 'status', 'Year', 'year', 'Term', 'term']
 const keys = new Set([...Object.keys(semesterSchema || {}), ...Object.keys(semester || {})])
 return Array.from(keys)
 .filter(k => !internal.includes(k))
 .sort((a, b) => {
 const priority = ['Status', 'Year', 'Term']
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
 value={semester[key]}
 schema={semesterSchema[key]}
 onUpdate={(v) => onUpdate('semesters', selectedSemesterId, {[key]: v})}
 />
 ))
})()}
 </div>

 <section className="space-y-4">
 <div className="flex items-center justify-between">
 <SectionHeader title="Courses" count={semCourses.length} />
 <button onClick={() => {
 const title = window.prompt('Enter Course Title', 'New Course') || 'New Course'
 onCreate('courses', title, {Semester: `[[${semester.title}]]`, Status: '[[Active]]'})
}}
 className="px-2 py-1 text-foreground border border-border bg-background text-[8px] font-black uppercase hover:border-foreground/50 ">Add Course</button>
 </div>
 {semCourses.length === 0 && <EmptyState message="No courses linked to this semester." />}
 <div className="grid grid-cols-3 gap-4">
 {semCourses.map((c, idx) => (
 <div key={idx} onClick={() => navigateTo('COURSES', c.id)}
 className="p-6 border border-border bg-muted/5  cursor-pointer group">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50">Course</span>
 <span className="text-[9px] font-black text-foreground/50">{getVal(c, 'Credits', 'credits')} CR</span>
 </div>
 <h3 className="text-xl font-black uppercase tracking-tight  text-foreground">{cleanTitle(stripWL(c.title))}</h3>
 <p className="text-[8px] font-black uppercase tracking-widest text-foreground/40 mt-2">{stripWL(getVal(c, 'Status', 'status'))}</p>
 </div>
 ))}
 </div>
 </section>
 </div>
 )
}

 // ── Year Detail ────────────────────────────────────────────────────────────
 if (selectedYearId && selectedYear) {
 const earnedCredits = getVal(selectedYear, 'Earned Credits', 'earned_credits') || '0'
 const targetCredits = getVal(selectedYear, 'Target Credits', 'target_credits') || '0'
 const gpa = getVal(selectedYear, 'Cumulative GPA', 'cumulative_gpa') || '0.00'
 const level = stripWL(getVal(selectedYear, 'Academic Level', 'academic_level'))
 const derived = deriveStatus(relatedSemesters)
 const currentStatus = stripWL(getVal(selectedYear, 'Status', 'status'))

 return (
 <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
 <div className="flex items-start justify-between">
 <div>
 <button onClick={() => setSelectedYearId(null)} className="text-[8px] font-black uppercase tracking-widest text-foreground/50 mb-2 ">← Program</button>
 <EditableTitle
 value={selectedYear.title}
 className="text-2xl font-black uppercase tracking-tighter mb-2"
 onSave={(next) => {
 onUpdate('years', selectedYear.id, {title: next})
 }}
 />
 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{cleanTitle(activeProgram)} · {cleanTitle(level)}</span>
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 {derived === 'Completed' && !currentStatus.toLowerCase().includes('complet') && (
 <button onClick={() => onUpdate('years', selectedYearId, {Status: '[[Completed]]'})}
 className="px-3 py-1.5 bg-muted border border-border text-foreground text-[8px] font-black uppercase rounded-none hover:bg-muted/80 ">
 Mark Complete
 </button>
 )}
                    <button onClick={() => onOpenNote(selectedYear.path || `database/years/${selectedYear.id}.md`)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-none " title="Open Note">
                        <BookOpen size={13} />
                    </button>
                    <button onClick={() => {onDelete('years', selectedYearId); setSelectedYearId(null)}}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none ">
                        <Trash2 size={13} />
                    </button>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-4">
 <BigPropertyCard
 label="Status"
 value={selectedYear.Status || selectedYear.properties?.Status || 'Active'}
 schema={yearSchema['Status']}
 onUpdate={(v) => onUpdate('years', selectedYearId, {Status: v})}
 />
 <StatCard label="Credits" value={`${earnedCredits} / ${targetCredits}`} />
 <StatCard label="GPA" value={gpa} />
 </div>

 <div className="grid grid-cols-4 gap-4">
 {(() => {
 const internal = ['id', 'title', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by', 'Academic Level', 'Earned Credits', 'Target Credits', 'Current Year', 'Program', 'Target Years', 'Status', 'status']
 const keys = new Set([...Object.keys(yearSchema || {}), ...Object.keys(selectedYear || {})])
 return Array.from(keys)
 .filter(k => !internal.includes(k))
 .sort((a, b) => {
 // Prioritize important ones
 const priority = ['Status', 'Academic Level', 'Cumulative GPA', 'Earned Credits', 'Target Credits']
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
 value={selectedYear[key]}
 schema={yearSchema[key]}
 onUpdate={(v) => onUpdate('years', selectedYearId, {[key]: v})}
 />
 ))
})()}
 </div>

 <section className="space-y-4">
 <div className="flex items-center justify-between">
 <SectionHeader title="Semesters" count={relatedSemesters.length} />
 <button onClick={() => {
 const title = window.prompt('Enter Semester Title', 'New Semester') || 'New Semester'
 onCreate('semesters', title, {Year: `[[${selectedYear.title}]]`, Status: '[[Planned]]'})
}}
 className="px-2 py-1 text-foreground border border-border bg-background text-[8px] font-black uppercase hover:border-foreground/50 ">Add</button>
 </div>
 {relatedSemesters.length === 0 && <EmptyState message="No semesters yet. Add one above." />}
 <div className="roadmap-container pl-2">
 <div className="roadmap-line opacity-5" />
 {relatedSemesters.map((s, idx) => {
 const statusRaw = stripWL(getVal(s, 'Status', 'status'))
 const isCompleted = statusRaw.toLowerCase().includes('complet')
 const isActive = statusRaw.toLowerCase().includes('active')

 return (
 <div key={idx} className="roadmap-node cursor-pointer group/sem" onClick={() => setSelectedSemesterId(s.id)}>
 <div className={cn('roadmap-dot', isCompleted ? 'roadmap-dot-completed' : isActive ? 'roadmap-dot-active pulse-node' : 'roadmap-dot-planned')}>
 {isCompleted ? <Check size={10} strokeWidth={4} /> : (idx + 1)}
 </div>
 <div className="roadmap-content p-4 border border-border bg-muted/5 rounded-none  flex items-center justify-between">
 <div className="min-w-0">
 <span className="text-[12px] font-black uppercase ">{cleanTitle(s.title)}</span>
 <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-foreground/50">{statusRaw}</span>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="text-[8px] font-black uppercase text-muted-foreground ">View Details</span>
 <ChevronRight size={11} className="text-muted-foreground " />
 </div>
 </div>
 </div>
 )
})}
 </div>
 </section>
 </div>
 )
}

 // ── Program Overview ─────────────────────────────────────────────────────────
 return (
 <div className="h-full flex overflow-hidden">
 {/* Left: Roadmap panel */}
 <aside className="w-56 shrink-0 border-r border-border flex flex-col p-5 overflow-hidden">
 <div className="flex items-center justify-between mb-4">
 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/60">Roadmap</span>
 <button onClick={() => setShowSetup(!showSetup)} className="px-2 py-1 bg-foreground/5 text-[7px] font-black uppercase tracking-widest hover:bg-foreground/70  border border-border/10">
 {showSetup ? 'Back' : (programYears.length > 0 ? 'Edit' : 'Setup')}
 </button>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 {programYears.length > 0 ? (
 <AcademicRoadmap items={programYears} semesters={semesters} activeId={selectedYearId} onSelect={setSelectedYearId} />
 ) : (
 <p className="text-[9px] font-black uppercase text-foreground/40 text-center mt-8">No program yet</p>
 )}
 </div>
 </aside>

 {/* Right: Overview or setup */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-24">
 {programYears.length === 0 ? (
 <ProgramSetupForm onScaffold={(n, y, l, c) => {handleScaffold(n, y, l, c); setShowSetup(false)}} />
 ) : (
 <div className="space-y-10 ">
 {showSetup && activeYear && (
    <section className="space-y-6   zoom-in-95 ">
       <div className="flex items-center justify-between border-b border-border pb-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest">Edit Program Details</h3>
           <button onClick={() => setShowSetup(false)} className="text-[10px] font-black uppercase text-foreground/60 ">Close</button>
       </div>
       <div className="grid grid-cols-3 gap-4">
           {(() => {
               const internal = ['id', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by']
               const keys = new Set([...Object.keys(yearSchema || {}), ...Object.keys(activeYear || {})])
               return Array.from(keys)
                   .filter(k => !internal.includes(k))
                   .sort((a, b) => {
                       const priority = ['Program', 'Academic Level', 'Status', 'Target Years', 'Current Year']
                       const ai = priority.indexOf(a); const bi = priority.indexOf(b)
                       if (ai !== -1 && bi !== -1) return ai - bi
                       if (ai !== -1) return -1
                       if (bi !== -1) return 1
                       return a.localeCompare(b)
                   })
                   .map(key => (
                       <BigPropertyCard
                           key={key}
                           label={key}
                           value={activeYear[key]}
                           schema={yearSchema[key]}
                           onUpdate={(v) => {
                               if (['Program', 'Academic Level', 'Target Years'].includes(key)) {
                                   handleUpdateProgram(
                                       activeProgram,
                                       key === 'Program' ? stripWL(v) : activeProgram,
                                       key === 'Academic Level' ? stripWL(v) : stripWL(getVal(activeYear, 'Academic Level')),
                                       key === 'Target Years' ? parseInt(v) : targetYears
                                   )
                               } else {
                                   onUpdate('years', activeYear.id, {[key]: v})
                               }
                           }}
                       />
                   ))
           })()}
       </div>
    </section>
 )}
 <div className="flex items-center justify-between">
 <div className="group/protitle">
 <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50">Program</p>
 <EditableTitle
 value={activeProgram || 'Your Program'}
 className="text-2xl font-black uppercase tracking-tight"
 onSave={(next) => {
 handleUpdateProgram(activeProgram, next, stripWL(getVal(activeYear, 'Academic Level')), targetYears)
}}
 />
 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
 {cleanTitle(stripWL(getVal(activeYear, 'Academic Level', 'academic_level')))}
 </span>
 </div>
 </div>

 {(() => {
  const activeSem = semesters.find(s => {
    const sStatus = String(stripWL(getVal(s, 'Status', 'status'))).toLowerCase()
    const isActiveBool = getBoolVal(s, 'Active', 'active')
    return sStatus.includes('active') || isActiveBool
  })
 return (
 <div className="grid grid-cols-3 gap-4">
 <StatCard label="Current Year" value={cleanTitle(activeYear?.title?.split(' ').pop() || '--')} onClick={() => activeYear && setSelectedYearId(activeYear.id)} />
 <StatCard label="Current Semester" value={cleanTitle(activeSem?.title || '--')} accent onClick={() => activeSem && setSelectedSemesterId(activeSem.id)} />
 <StatCard label="CGPA" value={getVal(activeYear, 'Cumulative GPA', 'cumulative_gpa') || '0.00'} />
 </div>
 )
})()}




 {/* Active Status Sections */}
 <div className="space-y-8">
 {/* Active Courses (Linked to Active Semesters) */}
 {(() => {
 const activeSemTitles = semesters
 .filter(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase().includes('active'))
 .map(s => s.title?.toLowerCase())
 
 const activeCourses = courses.filter(c => {
 const status = stripWL(getVal(c, 'Status', 'status')).toLowerCase()
 const isNotCompleted = !status.includes('complet')
 const courseSem = getVal(c, 'Semester', 'semester').toLowerCase()
 const isInActiveSem = activeSemTitles.some(title => title && courseSem.includes(title))
 return isNotCompleted && isInActiveSem
})

 if (activeCourses.length === 0) return null

 return (
 <section className="space-y-4">
 <SectionHeader title="Active Courses" count={activeCourses.length} />
 <div className="grid grid-cols-3 gap-4">
 {activeCourses.map((c, idx) => (
 <div key={`course-${idx}`} className="p-4 border border-border bg-muted/5 rounded-none flex items-center justify-between cursor-pointer hover:bg-muted/10 "
 onClick={() => navigateTo('COURSES', c.id)}>
 <div>
  <span className="text-[13px] font-black uppercase text-foreground">{cleanTitle(stripWL(c.title))}</span>
 <p className="text-[8px] font-black uppercase tracking-widest text-foreground/40">{getVal(c, 'Credits', 'credits')} Credits</p>
 </div>
 <ChevronRight size={14} className="text-muted-foreground" />
 </div>
 ))}
 </div>
 </section>
 )
})()}
 </div>
 </div>
 )}
 </div>
 </div>
 )
}

// Small controlled field to avoid stale closure in the program editor
function ProgramFieldEditor({label, defaultValue, onBlur, type = 'text'}: {label: string; defaultValue: string; onBlur: (val: string) => void; type?: string}) {
 const [val, setVal] = useState(defaultValue)
 return (
 <div className="flex flex-col gap-1">
 <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
 <input type={type} value={val} onChange={e => setVal(e.target.value)} onBlur={() => onBlur(val)}
 className="bg-background border border-border/20 px-3 py-2.5 rounded-none text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20" />
 </div>
 )
}
