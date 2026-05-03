import React, { useState, useMemo } from 'react'
import { Check, Zap, Trash2, Plus, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal, getYearOrder, deriveStatus } from './utils'
import { SectionHeader, EmptyState, StatCard, AcademicRoadmap, ProgramSetupForm, BigPropertyCard, EditableTitle } from './SharedComponents'
import type { TabProps } from './types'

export default function ProgramTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, onRefresh }: TabProps) {
    const [selectedYearId, setSelectedYearId] = useState<string | null>(null)
    const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null)
    const [showSetup, setShowSetup] = useState(false)
    const [showProperties, setShowProperties] = useState(true)

    const years = data.years || []
    const semesters = data.semesters || []
    const courses = data.courses || []
    const yearSchema = databases.find(d => d.id === '09 - Years')?.schema || {}
    const semesterSchema = databases.find(d => d.id === '08 - Semesters')?.schema || {}

    const sorted = [...years].sort((a, b) => getYearOrder(a.title) - getYearOrder(b.title))
    const activeYear = sorted.find(y => y['Current Year'] === true || y['Current Year'] === 'true')
    const activeProgram = stripWL(getVal(activeYear, 'Program', 'program'))
    const programYears = activeProgram
        ? sorted.filter(y => stripWL(getVal(y, 'Program', 'program')) === activeProgram)
        : sorted
    const completedCount = programYears.filter(y => stripWL(getVal(y, 'Status', 'status')).toLowerCase().includes('complet')).length
    const targetYears = parseInt(getVal(activeYear, 'Target Years', 'target_years')) || Math.max(programYears.length, 1)

    const selectedYear = sorted.find(y => y.id === selectedYearId)
    const relatedSemesters = semesters
        .filter(s => {
            const semYear = getVal(s, 'Year', 'year').toLowerCase().trim()
            const targetYear = (selectedYear?.title || '').toLowerCase().trim()
            return semYear === targetYear && targetYear !== ''
        })
        .sort((a, b) => {
            const order = ['Autumn', 'Fall', 'Winter', 'Spring', 'Summer']
            const ai = order.findIndex(o => a.title?.includes(o))
            const bi = order.findIndex(o => b.title?.includes(o))
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        })

    const handleScaffold = async (name: string, numYears: number, level: string, currentIdx: number) => {
        try {
            const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
            for (let i = 0; i < numYears; i++) {
                const title = `Year ${romans[i] || (i + 1)}`
                const status = i < currentIdx ? '[[Completed]]' : i === currentIdx ? '[[Active]]' : '[[Planned]]'
                await onCreate('09 - Years', title, {
                    Program: `[[${name}]]`,
                    'Academic Level': `[[${level}]]`,
                    Status: status,
                    'Current Year': i === currentIdx,
                    'Target Years': numYears,
                    'Earned Credits': 0,
                    'Target Credits': 0,
                    'Cumulative GPA': 0.00
                })
            }
            toast.success(`Program "${name}" deployed!`)
            onRefresh()
        } catch { toast.error('Scaffolding failed') }
    }

    const handleUpdateProgram = async (oldName: string, newName: string, level: string, numYears: number) => {
        try {
            const toUpdate = years.filter(y => stripWL(getVal(y, 'Program', 'program')) === oldName)
            for (const y of toUpdate) {
                await onUpdate('09 - Years', y.id, {
                    Program: `[[${newName}]]`,
                    'Academic Level': `[[${level}]]`,
                    'Target Years': numYears
                })
            }
            toast.success('Program updated')
            onRefresh()
        } catch { toast.error('Update failed') }
    }

    const handleSetCurrentYear = async (id: string) => {
        for (const y of years) {
            await onUpdate('09 - Years', y.id, { 'Current Year': y.id === id })
        }
        toast.success('Active year set')
    }

    // ── Semester Detail ────────────────────────────────────────────────────────
    if (selectedSemesterId) {
        const semester = semesters.find(s => s.id === selectedSemesterId)
        if (!semester) { setSelectedSemesterId(null); return null }
        const semCourses = courses.filter(c => {
            const courseSem = getVal(c, 'Semester', 'semester').toLowerCase()
            const targetSem = (semester.title || '').toLowerCase()
            return courseSem.includes(targetSem) && targetSem !== ''
        })

        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-10 pb-24">
                <div className="flex items-start justify-between">
                    <div>
                        <button onClick={() => setSelectedSemesterId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground mb-2 transition-all">← {selectedYear?.title || 'Year'}</button>
                        <EditableTitle
                            value={semester.title}
                            className="text-3xl font-black uppercase tracking-tight"
                            onSave={(next) => {
                                onUpdate('08 - Semesters', semester.id, { title: next })
                                setSelectedSemesterId(next)
                            }}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{activeProgram} · {selectedYear?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { onDelete('08 - Semesters', selectedSemesterId); setSelectedSemesterId(null) }}
                            className="p-2 text-muted-foreground/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <BigPropertyCard
                        label="Status"
                        value={semester.Status || semester.properties?.Status || 'Active'}
                        schema={semesterSchema['Status']}
                        onUpdate={(v) => onUpdate('08 - Semesters', selectedSemesterId, { Status: v })}
                    />
                    <StatCard label="Total Credits" value={semCourses.reduce((acc, c) => acc + (parseFloat(getVal(c, 'Credits', 'credits')) || 0), 0)} />
                    <StatCard label="Courses" value={semCourses.length} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                                    onUpdate={(v) => onUpdate('08 - Semesters', selectedSemesterId, { [key]: v })}
                                />
                            ))
                    })()}
                </div>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <SectionHeader title="Courses" count={semCourses.length} />
                        <button onClick={() => {
                            const title = window.prompt('Enter Course Title', 'New Course') || 'New Course'
                            onCreate('07 - Courses', title, { Semester: `[[${semester.title}]]`, Status: '[[Active]]' })
                        }}
                            className="px-2 py-1 bg-foreground text-background text-[8px] font-black uppercase rounded hover:opacity-80 transition-all">Add Course</button>
                    </div>
                    {semCourses.length === 0 && <EmptyState message="No courses linked to this semester." />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {semCourses.map((c, idx) => (
                            <div key={idx} onClick={() => navigateTo('COURSES', c.id)}
                                className="p-6 border border-border/10 rounded-2xl bg-muted/5 hover:bg-muted/10 hover:border-foreground/10 transition-all cursor-pointer group">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Course</span>
                                    <span className="text-[9px] font-black text-muted-foreground/40">{getVal(c, 'Credits', 'credits')} CR</span>
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors">{c.title}</h3>
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mt-2">{stripWL(getVal(c, 'Status', 'status'))}</p>
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
            <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-10 pb-24">
                <div className="flex items-start justify-between">
                    <div>
                        <button onClick={() => setSelectedYearId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-foreground mb-2 transition-all">← Program</button>
                        <EditableTitle
                            value={selectedYear.title}
                            className="text-5xl font-black uppercase tracking-tighter mb-2"
                            onSave={(next) => {
                                onUpdate('09 - Years', selectedYear.id, { title: next })
                                setSelectedYearId(next)
                            }}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{activeProgram} · {level}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {derived === 'Completed' && !currentStatus.toLowerCase().includes('complet') && (
                            <button onClick={() => onUpdate('09 - Years', selectedYearId, { Status: '[[Completed]]' })}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase rounded-lg animate-pulse hover:bg-emerald-500 hover:text-white transition-all">
                                Finish Year
                            </button>
                        )}
                        <button onClick={() => { onDelete('09 - Years', selectedYearId); setSelectedYearId(null) }}
                            className="p-2 text-muted-foreground/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <BigPropertyCard
                        label="Status"
                        value={selectedYear.Status || selectedYear.properties?.Status || 'Active'}
                        schema={yearSchema['Status']}
                        onUpdate={(v) => onUpdate('09 - Years', selectedYearId, { Status: v })}
                    />
                    <StatCard label="Credits" value={`${earnedCredits} / ${targetCredits}`} />
                    <StatCard label="GPA" value={gpa} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                                    onUpdate={(v) => onUpdate('09 - Years', selectedYearId, { [key]: v })}
                                />
                            ))
                    })()}
                </div>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <SectionHeader title="Semesters" count={relatedSemesters.length} />
                        <button onClick={() => {
                            const title = window.prompt('Enter Semester Title', 'New Semester') || 'New Semester'
                            onCreate('08 - Semesters', title, { Year: `[[${selectedYear.title}]]`, Status: '[[Planned]]' })
                        }}
                            className="px-2 py-1 bg-foreground text-background text-[8px] font-black uppercase rounded hover:opacity-80 transition-all">Add</button>
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
                                    <div className="roadmap-content p-4 border border-border/15 bg-muted/5 rounded-xl hover:border-foreground/10 hover:bg-muted/10 transition-all flex items-center justify-between">
                                        <div className="min-w-0">
                                            <span className="text-[12px] font-black uppercase group-hover/sem:text-primary transition-colors">{s.title}</span>
                                            <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">{statusRaw}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[8px] font-black uppercase text-muted-foreground/20 group-hover/sem:text-primary/40 transition-colors">View Details</span>
                                            <ChevronRight size={11} className="text-muted-foreground/20 group-hover/sem:translate-x-0.5 transition-all" />
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
            <aside className="w-56 shrink-0 border-r border-border/10 flex flex-col p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Roadmap</span>
                    <button onClick={() => setShowSetup(!showSetup)} className="px-2 py-1 bg-foreground/5 text-[7px] font-black uppercase tracking-widest rounded hover:bg-foreground/10 transition-all border border-border/10">
                        {showSetup ? 'Back' : (programYears.length > 0 ? 'Edit' : 'Setup')}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {programYears.length > 0 ? (
                        <AcademicRoadmap items={programYears} activeId={selectedYearId} onSelect={setSelectedYearId} />
                    ) : (
                        <p className="text-[9px] font-black uppercase text-muted-foreground/20 text-center mt-8">No program yet</p>
                    )}
                </div>
                <button onClick={() => {
                    const title = window.prompt('Enter Year Title (e.g. Year I)', 'Year') || 'Year'
                    onCreate('09 - Years', title, { 'Target Years': targetYears, Status: '[[Planned]]' })
                }}
                    className="mt-3 w-full py-2 bg-foreground/5 hover:bg-foreground/10 text-[8px] font-black uppercase rounded-lg transition-all border border-border/10">
                    + Add Year
                </button>
            </aside>

            {/* Right: Overview or setup */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 pb-24">
                {showSetup || programYears.length === 0 ? (
                    <ProgramSetupForm onScaffold={(n, y, l, c) => { handleScaffold(n, y, l, c); setShowSetup(false) }} />
                ) : (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between">
                            <div className="group/protitle">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Program</p>
                                <EditableTitle
                                    value={activeProgram || 'Your Program'}
                                    className="text-5xl font-black uppercase tracking-tight"
                                    onSave={(next) => {
                                        handleUpdateProgram(activeProgram, next, stripWL(getVal(activeYear, 'Academic Level')), targetYears)
                                    }}
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                                    {stripWL(getVal(activeYear, 'Academic Level', 'academic_level'))}
                                </span>
                            </div>
                        </div>

                            {(() => {
                                const activeSem = semesters.find(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase().includes('active'))
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <StatCard label="Current Year" value={activeYear?.title?.split(' ').pop() || '--'} onClick={() => activeYear && setSelectedYearId(activeYear.id)} />
                                        <StatCard label="Current Semester" value={activeSem?.title || '--'} accent onClick={() => activeSem && setSelectedSemesterId(activeSem.id)} />
                                        <StatCard label="CGPA" value={getVal(activeYear, 'Cumulative GPA', 'cumulative_gpa') || '0.00'} />
                                    </div>
                                )
                            })()}


                        {showSetup && activeYear && (
                            <section className="space-y-4 animate-in slide-in-from-top-2">
                                <SectionHeader title="Edit Program Metadata" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {(() => {
                                        const internal = ['id', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by']
                                        const keys = new Set([...Object.keys(yearSchema || {}), ...Object.keys(activeYear || {})])
                                        return Array.from(keys)
                                            .filter(k => !internal.includes(k))
                                            .sort((a, b) => {
                                                const priority = ['Program', 'Academic Level', 'Status', 'Target Years', 'Current Year']
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
                                                    value={activeYear[key]}
                                                    schema={yearSchema[key]}
                                                    onUpdate={(v) => {
                                                        if (['Program', 'Academic Level', 'Target Years'].includes(key)) {
                                                            // Bulk update for program-wide properties
                                                            handleUpdateProgram(
                                                                activeProgram,
                                                                key === 'Program' ? stripWL(v) : activeProgram,
                                                                key === 'Academic Level' ? stripWL(v) : stripWL(getVal(activeYear, 'Academic Level')),
                                                                key === 'Target Years' ? parseInt(v) : targetYears
                                                            )
                                                        } else {
                                                            onUpdate('09 - Years', activeYear.id, { [key]: v })
                                                        }
                                                    }}
                                                />
                                            ))
                                    })()}
                                </div>
                            </section>
                        )}

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
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {activeCourses.map((c, idx) => (
                                                        <div key={`course-${idx}`} className="p-4 border border-border/10 bg-muted/5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-muted/10 transition-all"
                                                            onClick={() => navigateTo('COURSES', c.id)}>
                                                            <div>
                                                                <span className="text-[13px] font-black uppercase">{c.title}</span>
                                                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">{getVal(c, 'Credits', 'credits')} Credits</p>
                                                            </div>
                                                            <ChevronRight size={14} className="text-muted-foreground/20" />
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
function ProgramFieldEditor({ label, defaultValue, onBlur, type = 'text' }: { label: string; defaultValue: string; onBlur: (val: string) => void; type?: string }) {
    const [val, setVal] = useState(defaultValue)
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{label}</label>
            <input type={type} value={val} onChange={e => setVal(e.target.value)} onBlur={() => onBlur(val)}
                className="bg-background border border-border/20 px-3 py-2.5 rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20" />
        </div>
    )
}
