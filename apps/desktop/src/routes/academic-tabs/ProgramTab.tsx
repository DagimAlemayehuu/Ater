import React, { useState, useMemo } from 'react'
import { Check, Zap, Trash2, ChevronDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal, getYearOrder, deriveStatus } from './utils'
import { SectionHeader, EmptyState, StatCard, AcademicRoadmap, ProgramSetupForm, CoursePropertyGrid } from './SharedComponents'
import type { TabProps } from './types'

export default function ProgramTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, onRefresh }: TabProps) {
    const [selectedYearId, setSelectedYearId] = useState<string | null>(null)
    const [showSetup, setShowSetup] = useState(false)
    const [showProperties, setShowProperties] = useState(true)
    const [expandedSemId, setExpandedSemId] = useState<string | null>(null)

    const years = data.years || []
    const semesters = data.semesters || []
    const courses = data.courses || []
    const yearSchema = databases.find(d => d.id === '09 - Years')?.schema || {}

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
        .filter(s => stripWL(getVal(s, 'Year', 'year')).toLowerCase().includes(selectedYear?.title?.toLowerCase() || 'NOMATCH'))
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
                        <h2 className="text-3xl font-black uppercase">{selectedYear.title}</h2>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{activeProgram} · {level}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {derived === 'Completed' && !currentStatus.toLowerCase().includes('complet') && (
                            <button onClick={() => onUpdate('09 - Years', selectedYearId, { Status: '[[Completed]]' })}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase rounded-lg animate-pulse hover:bg-emerald-500 hover:text-white transition-all">
                                Finish Year
                            </button>
                        )}
                        <button onClick={() => handleSetCurrentYear(selectedYearId)}
                            className="px-3 py-1.5 bg-primary/10 text-primary text-[8px] font-black uppercase rounded-lg hover:bg-primary/20 transition-all">
                            Set Active
                        </button>
                        <button onClick={() => { onDelete('09 - Years', selectedYearId); setSelectedYearId(null) }}
                            className="p-2 text-muted-foreground/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Level" value={level || '--'} />
                    <StatCard label="Credits" value={`${earnedCredits} / ${targetCredits}`} />
                    <StatCard label="GPA" value={gpa} accent />
                </div>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <SectionHeader title="Properties" />
                        <button onClick={() => setShowProperties(!showProperties)} className="p-1 text-muted-foreground/30 hover:text-foreground transition-all">
                            <ChevronDown size={12} className={cn('transition-all', !showProperties && 'rotate-180')} />
                        </button>
                    </div>
                    {showProperties && (
                        <CoursePropertyGrid item={selectedYear} schema={yearSchema} onUpdate={(k, v) => onUpdate('09 - Years', selectedYearId, { [k]: v })} />
                    )}
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <SectionHeader title="Semesters" count={relatedSemesters.length} />
                        <button onClick={() => onCreate('08 - Semesters', 'New Semester', { Year: `[[${selectedYear.title}]]`, Status: '[[Planned]]' })}
                            className="px-2 py-1 bg-foreground text-background text-[8px] font-black uppercase rounded hover:opacity-80 transition-all">Add</button>
                    </div>
                    {relatedSemesters.length === 0 && <EmptyState message="No semesters yet. Add one above." />}
                    <div className="roadmap-container pl-2">
                        <div className="roadmap-line opacity-5" />
                        {relatedSemesters.map((s, idx) => {
                            const statusRaw = stripWL(getVal(s, 'Status', 'status'))
                            const isCompleted = statusRaw.toLowerCase().includes('complet')
                            const isActive = statusRaw.toLowerCase().includes('active')
                            const isExpanded = expandedSemId === s.id
                            const semCourses = courses.filter(c =>
                                stripWL(getVal(c, 'Semester', 'semester')).toLowerCase().includes(s.title?.toLowerCase())
                            )
                            const derivedSem = deriveStatus(semCourses)

                            return (
                                <div key={idx} className="roadmap-node cursor-pointer" onClick={() => setExpandedSemId(isExpanded ? null : s.id)}>
                                    <div className={cn('roadmap-dot', isCompleted ? 'roadmap-dot-completed' : isActive ? 'roadmap-dot-active pulse-node' : 'roadmap-dot-planned')}>
                                        {isCompleted ? <Check size={10} strokeWidth={4} /> : (idx + 1)}
                                    </div>
                                    <div className={cn('roadmap-content p-4 border rounded-xl transition-all', isExpanded ? 'border-primary/20 bg-primary/[0.02]' : 'border-border/15 bg-muted/5 hover:border-foreground/10')}>
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <span className={cn('text-[12px] font-black uppercase', isExpanded ? 'text-primary' : 'text-foreground')}>{s.title}</span>
                                                <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">{statusRaw}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {derivedSem === 'Completed' && !isCompleted && (
                                                    <button onClick={e => { e.stopPropagation(); onUpdate('08 - Semesters', s.id, { Status: '[[Completed]]' }) }}
                                                        className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase rounded border border-emerald-500/20">
                                                        Mark Done
                                                    </button>
                                                )}
                                                <ChevronDown size={11} className={cn('text-muted-foreground/20 transition-all', isExpanded && 'rotate-180 text-primary/40')} />
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-border/10 space-y-2 animate-in fade-in slide-in-from-top-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">Courses ({semCourses.length})</span>
                                                    <button onClick={e => { e.stopPropagation(); onCreate('07 - Courses', 'New Course', { Semester: `[[${s.title}]]`, Status: '[[Active]]' }) }}
                                                        className="text-[8px] font-black uppercase text-primary/60 hover:text-primary transition-all">+ Add</button>
                                                </div>
                                                {semCourses.map((c, cidx) => (
                                                    <div key={cidx} onClick={e => { e.stopPropagation(); navigateTo('COURSES') }}
                                                        className="flex items-center justify-between p-2.5 border border-border/10 rounded-lg hover:border-primary/30 bg-background/50 cursor-pointer transition-all group/c">
                                                        <span className="text-[10px] font-black uppercase group-hover/c:text-primary transition-colors">{c.title}</span>
                                                        <span className="text-[8px] font-black text-muted-foreground/30">{getVal(c, 'Credits', 'credits')} CR</span>
                                                    </div>
                                                ))}
                                                {semCourses.length === 0 && <p className="text-[9px] text-muted-foreground/20 font-black uppercase">No courses linked to this semester</p>}
                                            </div>
                                        )}
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
                        {showSetup ? 'Back' : 'Setup'}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {programYears.length > 0 ? (
                        <AcademicRoadmap items={programYears} activeId={selectedYearId} onSelect={setSelectedYearId} />
                    ) : (
                        <p className="text-[9px] font-black uppercase text-muted-foreground/20 text-center mt-8">No program yet</p>
                    )}
                </div>
                <button onClick={() => onCreate('09 - Years', 'Year', { 'Target Years': targetYears, Status: '[[Planned]]' })}
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
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Program</p>
                                <h2 className="text-3xl font-black uppercase tracking-tight">{activeProgram || 'Your Program'}</h2>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                                    {stripWL(getVal(activeYear, 'Academic Level', 'academic_level'))}
                                </span>
                            </div>
                            <div className="h-12 w-12 rounded-full border border-border/10 flex items-center justify-center bg-primary/5 text-primary">
                                <Zap size={20} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard label="Completion" value={`${Math.round((completedCount / targetYears) * 100)}%`} accent />
                            <StatCard label="Duration" value={`${targetYears} Yrs`} />
                            <StatCard label="Current Year" value={activeYear?.title?.split(' ').pop() || '--'} />
                            <StatCard label="GPA" value={getVal(activeYear, 'Cumulative GPA', 'cumulative_gpa') || '0.00'} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                                <span>Overall Progress</span>
                                <span>{completedCount}/{targetYears} Years</span>
                            </div>
                            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                                <div className="h-full bg-foreground transition-all duration-700" style={{ width: `${(completedCount / targetYears) * 100}%` }} />
                            </div>
                        </div>

                        <section className="space-y-4">
                            <SectionHeader title="Edit Program" />
                            <div className="p-6 border border-border/10 rounded-2xl bg-muted/5 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <ProgramFieldEditor label="Program Title" defaultValue={activeProgram}
                                    onBlur={val => { if (val && val !== activeProgram) handleUpdateProgram(activeProgram, val, stripWL(getVal(activeYear, 'Academic Level')), targetYears) }} />
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Level</label>
                                    <select
                                        defaultValue={stripWL(getVal(activeYear, 'Academic Level', 'academic_level')) || 'Undergraduate'}
                                        onChange={e => handleUpdateProgram(activeProgram, activeProgram, e.target.value, targetYears)}
                                        className="bg-background border border-border/20 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase outline-none">
                                        <option>High School</option>
                                        <option>Undergraduate</option>
                                        <option>Master's</option>
                                        <option>PhD</option>
                                    </select>
                                </div>
                                <ProgramFieldEditor label="Duration (Years)" defaultValue={String(targetYears)} type="number"
                                    onBlur={val => { const v = parseInt(val); if (v && v !== targetYears) handleUpdateProgram(activeProgram, activeProgram, stripWL(getVal(activeYear, 'Academic Level')), v) }} />
                            </div>
                        </section>

                        {semesters.filter(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase().includes('active')).length > 0 && (
                            <section className="space-y-4">
                                <SectionHeader title="Active Semesters" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {semesters.filter(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase().includes('active')).map((s, idx) => (
                                        <div key={idx} className="p-4 border border-primary/20 bg-primary/5 rounded-xl flex items-center justify-between">
                                            <div>
                                                <span className="text-[13px] font-black uppercase">{s.title}</span>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{stripWL(getVal(s, 'Year', 'year'))}</p>
                                            </div>
                                            <span className="text-[8px] font-black text-primary uppercase">Active</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
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
