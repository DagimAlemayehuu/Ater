import React, { useState, useMemo, useEffect } from 'react'
import { Hash, ChevronRight, Plus, Check, BookOpen, Trash2 } from 'lucide-react'
import { format, parseISO, differenceInDays, isBefore, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal } from './utils'
import { SectionHeader, EmptyState, StatCard, BigPropertyCard } from './SharedComponents'
import type { TabProps } from './types'

export default function ExamsTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, initialSelectedId, onClearSelection }: TabProps) {
    const [courseFilter, setCourseFilter] = useState<string>('All')
    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null)
    const [editingScore, setEditingScore] = useState<string | null>(null)
    const [scoreInput, setScoreInput] = useState('')

    useEffect(() => {
        if (initialSelectedId) {
            setSelectedId(initialSelectedId)
            if (onClearSelection) onClearSelection()
        }
    }, [initialSelectedId, onClearSelection])

    const courses = data.courses || []
    const allExams = data.exams || []
    const hubs = data.study_sessions || []

    const now = startOfDay(new Date())

    const filtered = useMemo(() => {
        if (courseFilter === 'All') return allExams
        const cName = courses.find(c => c.id === courseFilter)?.title || ''
        return allExams.filter(e => {
            const examCourse = getVal(e, 'Course', 'course').toLowerCase()
            return examCourse === cName.toLowerCase() && examCourse !== ''
        })
    }, [allExams, courseFilter, courses])

    const upcoming = filtered.filter(e => e.date && !isBefore(parseISO(e.date), now))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const past = filtered.filter(e => !e.date || isBefore(parseISO(e.date), now))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const nextExam = upcoming[0]
    const daysToNext = nextExam?.date ? differenceInDays(parseISO(nextExam.date), now) : null

    const handleAddScore = async (exam: any) => {
        if (!scoreInput.trim()) return
        try {
            await onUpdate('04 - Exams', exam.id, { score: scoreInput.trim() })
            toast.success('Score saved')
            setEditingScore(null)
            setScoreInput('')
        } catch { toast.error('Update failed') }
    }

    // Selected exam detail
    if (selectedId) {
        const exam = allExams.find(e => e.id === selectedId)
        if (!exam) { setSelectedId(null); return null }
        const schema = databases.find(d => d.id === '04 - Exams')?.schema || {}
        const examCourse = stripWL(getVal(exam, 'Course', 'course'))
        const relatedHubs = hubs.filter(h => {
            const hubCourse = getVal(h, 'course', 'Course').toLowerCase()
            return hubCourse === examCourse.toLowerCase() && hubCourse !== ''
        })
        const doneHubs = relatedHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length

        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Exam Detail</span>
                        <h2 className="text-2xl font-black uppercase cursor-pointer hover:text-primary transition-colors block"
                            onClick={(e) => {
                                e.stopPropagation()
                                const next = window.prompt('Rename Exam', exam.title || '')
                                if (next && next !== exam.title) {
                                    onUpdate('04 - Exams', exam.id, { title: next })
                                    setSelectedId(next)
                                }
                            }}>{exam.title}</h2>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{examCourse}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { onDelete('04 - Exams', selectedId); setSelectedId(null) }}
                            className="p-2 text-muted-foreground/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                            <Trash2 size={13} />
                        </button>
                        <button onClick={() => setSelectedId(null)} className="px-3 py-1.5 bg-muted/10 border border-border/20 rounded-lg text-[9px] font-black uppercase hover:bg-muted/20 transition-all">Back</button>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard label="Preparation Progress" value={`${doneHubs} / ${relatedHubs.length} Hubs`} accent />
                    {exam.date && !isBefore(parseISO(exam.date), now) && (
                        <StatCard label="Countdown" value={`${differenceInDays(parseISO(exam.date), now)} Days Left`} />
                    )}
                </div>

                {/* Properties */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(() => {
                        const internal = ['id', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by']
                        const keys = new Set([...Object.keys(schema || {}), ...Object.keys(exam || {})])
                        return Array.from(keys)
                            .filter(k => !internal.includes(k))
                            .sort((a, b) => {
                                const priority = ['date', 'score', 'Course', 'Type']
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
                                    value={exam[key]}
                                    schema={schema[key]}
                                    onUpdate={(v) => onUpdate('04 - Exams', exam.id, { [key]: v })}
                                />
                            ))
                    })()}
                </div>

                {relatedHubs.length > 0 && (
                    <section className="space-y-4">
                        <SectionHeader title="Study Material Prep" count={relatedHubs.length} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {relatedHubs.map((hub, idx) => {
                                const hubStatus = stripWL(getVal(hub, 'status', 'Status'))
                                const isDone = hubStatus.toLowerCase().includes('complet')
                                return (
                                    <div key={idx} className={cn('p-3 border rounded-xl flex items-center gap-3', isDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/15 bg-background')}>
                                        <div className={cn('w-4 h-4 rounded-full border flex items-center justify-center shrink-0', isDone ? 'bg-emerald-500 border-emerald-500' : 'border-border/30')}>
                                            {isDone && <Check size={9} strokeWidth={4} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={cn('text-[10px] font-black uppercase truncate block', isDone ? 'text-muted-foreground/40' : 'text-foreground')}>
                                                {hub.title?.replace(/_/g, ' ') || hub.id}
                                            </span>
                                            <span className="text-[7px] font-black text-muted-foreground/30 uppercase">Unit {getVal(hub, 'unit', 'Unit') || '?'}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Next Exam Hero */}
            {nextExam && (
                <div className="mx-6 mt-6 mb-2 shrink-0">
                    <div className="p-6 sm:p-8 bg-foreground text-background rounded-2xl flex items-center justify-between gap-6">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-background/50">Next Exam</span>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">{nextExam.title}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-background/60">
                                {stripWL(getVal(nextExam, 'Course', 'course'))} · {nextExam.date ? format(parseISO(nextExam.date), 'MMM dd, yyyy') : '--'}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className={cn('text-5xl font-black tracking-tighter', daysToNext !== null && daysToNext <= 3 ? 'text-red-400' : daysToNext !== null && daysToNext <= 7 ? 'text-amber-400' : '')}>
                                {daysToNext ?? '--'}
                            </div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-background/50">Days Left</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter + Add bar */}
            <div className="px-6 py-3 border-b border-border/10 flex items-center gap-3 flex-wrap shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
                    {['All', ...courses.map(c => c.id)].map(id => {
                        const label = id === 'All' ? 'All' : courses.find(c => c.id === id)?.title || id
                        return (
                            <button key={id} onClick={() => setCourseFilter(id)}
                                className={cn('px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wide whitespace-nowrap transition-all',
                                    courseFilter === id ? 'bg-foreground text-background' : 'bg-muted/10 text-muted-foreground/50 hover:text-foreground')}>
                                {label}
                            </button>
                        )
                    })}
                </div>
                <button onClick={() => {
                    const title = window.prompt('Enter Exam Title', 'New Exam') || 'New Exam'
                    onCreate('04 - Exams', title)
                }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-[8px] font-black uppercase rounded-lg hover:opacity-80 transition-all">
                    <Plus size={10} /> Add Exam
                </button>
            </div>

            {/* Exam lists */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 pb-24">
                {/* Upcoming */}
                <section className="space-y-3">
                    <SectionHeader title={`Upcoming — ${upcoming.length}`} />
                    {upcoming.length === 0 && <EmptyState message="No upcoming exams." />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {upcoming.map((exam, idx) => {
                            const days = differenceInDays(parseISO(exam.date), now)
                            const urgency = days <= 3 ? 'text-red-400 border-red-500/20' : days <= 7 ? 'text-amber-400 border-amber-500/20' : 'text-muted-foreground/60 border-border/20'
                            const examCourse = stripWL(getVal(exam, 'Course', 'course')).toLowerCase()
                            const relatedHubs = hubs.filter(h => {
                                const hubCourse = stripWL(getVal(h, 'course', 'Course')).toLowerCase()
                                return hubCourse === examCourse && hubCourse !== ''
                            })
                            const doneHubs = relatedHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length
                            const prepPct = relatedHubs.length > 0 ? Math.round((doneHubs / relatedHubs.length) * 100) : null

                            return (
                                <div key={idx} onClick={() => setSelectedId(exam.id)}
                                    className={cn('p-5 border rounded-xl cursor-pointer hover:border-foreground/20 bg-background transition-all', urgency.split(' ')[1] || 'border-border/20')}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[13px] font-black uppercase block truncate">{exam.title}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{examCourse}</span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={cn('text-xl font-black', urgency.split(' ')[0])}>{days}</div>
                                            <div className="text-[7px] font-black uppercase text-muted-foreground/30">days</div>
                                        </div>
                                    </div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
                                        {format(parseISO(exam.date), 'EEE, MMM dd')}
                                    </div>
                                    {prepPct !== null && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/30">Prep</span>
                                                <span className="text-[7px] font-black text-muted-foreground/40">{doneHubs}/{relatedHubs.length} hubs</span>
                                            </div>
                                            <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500/60 transition-all" style={{ width: `${prepPct}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* Past */}
                {past.length > 0 && (
                    <section className="space-y-3 opacity-60">
                        <SectionHeader title={`Past — ${past.length}`} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {past.map((exam, idx) => {
                                const isEditing = editingScore === exam.id
                                const score = getVal(exam, 'score', 'Score')
                                return (
                                    <div key={idx} onClick={() => !isEditing && setSelectedId(exam.id)}
                                        className="p-5 border border-border/10 rounded-xl bg-background cursor-pointer hover:border-foreground/10 transition-all">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[13px] font-black uppercase block truncate">{exam.title}</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">
                                                    {stripWL(getVal(exam, 'Course', 'course'))} · {exam.date ? format(parseISO(exam.date), 'MMM dd') : '--'}
                                                </span>
                                            </div>
                                            <div onClick={e => e.stopPropagation()}>
                                                {score ? (
                                                    <span className="px-2 py-1 bg-foreground/5 border border-border/20 rounded text-[10px] font-black text-foreground">{score}</span>
                                                ) : isEditing ? (
                                                    <div className="flex items-center gap-1">
                                                        <input autoFocus value={scoreInput} onChange={e => setScoreInput(e.target.value)} placeholder="Score"
                                                            className="w-20 bg-background border border-border/30 px-2 py-1 rounded text-[10px] font-black focus:outline-none"
                                                            onKeyDown={e => { if (e.key === 'Enter') handleAddScore(exam); if (e.key === 'Escape') setEditingScore(null) }} />
                                                        <button onClick={() => handleAddScore(exam)} className="p-1 text-primary"><Check size={11} /></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => { setEditingScore(exam.id); setScoreInput('') }}
                                                        className="px-2 py-1 text-[8px] font-black uppercase tracking-wide text-muted-foreground/30 border border-border/10 rounded hover:border-border/30 hover:text-foreground transition-all">
                                                        + Score
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
