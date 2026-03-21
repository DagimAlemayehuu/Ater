import { Header } from '@/components/layout/header'
import { Search } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowRight, RefreshCw, Calendar, CheckCircle2,
    Circle, GraduationCap, Target, BookOpen, Zap,
    MessageSquare, ArrowUpRight, Brain
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

const GOALS_DB_ID = '2a9219ed-7519-815f-ac0f-ebfcd1dcd003'

interface Goal {
    id: string
    title: string
    type: string
    priority: string
    completed: boolean
    dueDate: string
    remaining: string
}

function parseGoal(page: any): Goal {
    const props = page.properties
    return {
        id: page.id,
        title: props.Name?.title?.[0]?.plain_text || 'Untitled',
        type: props['Type of Goal']?.select?.name || '',
        priority: props.Priority?.select?.name || 'None',
        completed: props.Completed?.checkbox || false,
        dueDate: props['Due Date']?.date?.start || '',
        remaining: props.Remaining?.formula?.string || '',
    }
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [goals, setGoals] = useState<Goal[]>([])
    const [academics, setAcademics] = useState<{ courses: any[], exams: any[], assignments: any[], units: any[] }>({ courses: [], exams: [], assignments: [], units: [] })
    const [notionCount, setNotionCount] = useState(0)
    const [obsidianCount, setObsidianCount] = useState(0)

    const fetchData = useCallback(async () => {
        try {
            const [goalsRes, academicRes, notionRes, obsidianRes] = await Promise.all([
                sidecarApi.queryNotionDatabase(GOALS_DB_ID).catch(() => ({ results: [] })),
                sidecarApi.academicsDashboard().catch(() => ({ courses: [], exams: [], assignments: [], units: [] })),
                sidecarApi.listNotionPages().catch(() => ({ pages: [] })),
                sidecarApi.listObsidianFiles().catch(() => ({ files: [] })),
            ])

            const parsed = goalsRes.results.map(parseGoal)
            parsed.sort((a, b) => {
                if (a.completed && !b.completed) return 1
                if (!a.completed && b.completed) return -1
                const pw: Record<string, number> = { High: 3, Medium: 2, Low: 1, None: 0 }
                return (pw[b.priority] || 0) - (pw[a.priority] || 0)
            })
            setGoals(parsed)
            setAcademics({
                courses: academicRes.courses || [],
                exams: academicRes.exams || [],
                assignments: academicRes.assignments || [],
                units: academicRes.units || [],
            })
            setNotionCount(notionRes.pages?.length || 0)
            setObsidianCount(obsidianRes.files?.length || 0)
        } catch (err) {
            console.error('Dashboard fetch failed:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleRefresh = async () => {
        setSyncing(true)
        setLoading(true)
        await fetchData()
        setSyncing(false)
    }

    const activeGoals = goals.filter(g => !g.completed)
    const completedGoals = goals.filter(g => g.completed)

    const today = new Date()
    const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    // Merge exams + assignments into deadlines
    const deadlines: { id: string; name: string; date: string; type: 'exam' | 'assignment' }[] = []
    academics.exams.forEach((e: any) => {
        deadlines.push({ id: e.id, name: e.properties?.['Name']?.title?.[0]?.plain_text || 'Exam', date: e.properties?.['Exam Date']?.date?.start || '', type: 'exam' })
    })
    academics.assignments.forEach((a: any) => {
        deadlines.push({ id: a.id, name: a.properties?.['Name']?.title?.[0]?.plain_text || 'Assignment', date: a.properties?.['Deadline']?.date?.start || '', type: 'assignment' })
    })
    deadlines.sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'No date'
        const d = new Date(dateStr)
        const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (diff < 0) return `${formatted} · overdue`
        if (diff === 0) return `${formatted} · today`
        if (diff === 1) return `${formatted} · tomorrow`
        if (diff <= 7) return `${formatted} · ${diff}d left`
        return formatted
    }

    const isUrgent = (dateStr: string) => {
        if (!dateStr) return false
        return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) <= 3
    }

    return (
        <div className="flex-1 space-y-6 animate-in fade-in duration-300">
            {/* Stats Row */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active Goals" value={loading ? '—' : String(activeGoals.length)} sub={`${completedGoals.length} completed`} icon={<Target className="h-3.5 w-3.5" />} onClick={() => navigate('/notion')} />
                <StatCard label="Deadlines" value={loading ? '—' : String(deadlines.length)} sub={deadlines.filter(d => isUrgent(d.date)).length > 0 ? `${deadlines.filter(d => isUrgent(d.date)).length} this week` : 'none this week'} icon={<Calendar className="h-3.5 w-3.5" />} onClick={() => navigate('/notion')} />
                <StatCard label="Courses" value={loading ? '—' : String(academics.courses.length)} sub={`${academics.units.length} units`} icon={<BookOpen className="h-3.5 w-3.5" />} onClick={() => navigate('/notion')} />
                <StatCard label="Knowledge" value={loading ? '—' : String(notionCount + obsidianCount)} sub={`${notionCount} pages · ${obsidianCount} files`} icon={<Zap className="h-3.5 w-3.5" />} />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <QuickAction label="Notion" sub="Manage goals & work" icon={<MessageSquare className="h-4 w-4" />} onClick={() => navigate('/notion')} />
                <QuickAction label="Obsidian" sub="Knowledge chat" icon={<Target className="h-4 w-4" />} onClick={() => navigate('/obsidian')} />
                <QuickAction label="Strategist" sub="Simulate life pivot" icon={<Brain className="h-4 w-4" />} onClick={() => navigate('/strategist')} />
                <QuickAction label="Settings" sub="System config" icon={<GraduationCap className="h-4 w-4" />} onClick={() => navigate('/settings')} />
            </div>

            {/* Main Grid */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
                {/* Deadlines */}
                <Section title="Upcoming Deadlines" sub="Exams and assignments" action="View all" onAction={() => navigate('/notion')} className="lg:col-span-2">
                    {loading ? <Loading /> : deadlines.length === 0 ? (
                        <Empty text="No upcoming deadlines." />
                    ) : (
                        <div className="space-y-1">
                            {deadlines.slice(0, 7).map(d => (
                                <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors">
                                    <div className={cn("w-1 h-6 rounded-full shrink-0 bg-muted-foreground/30", isUrgent(d.date) && "bg-foreground")} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{d.name}</p>
                                        <p className={cn("text-xs mt-0.5", isUrgent(d.date) ? "text-foreground font-medium" : "text-muted-foreground")}>{formatDate(d.date)}</p>
                                    </div>
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                        {d.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* Active Goals */}
                <Section title="Active Goals" sub={`${activeGoals.length} open`} action="View all" onAction={() => navigate('/notion')} className="lg:col-span-3">
                    {loading ? <Loading /> : activeGoals.length === 0 ? (
                        <Empty text="No active goals." />
                    ) : (
                        <div className="space-y-0.5">
                            {activeGoals.slice(0, 8).map(goal => (
                                <div key={goal.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/notion')}>
                                    <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{goal.title}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            {goal.type && <span className="text-xs text-muted-foreground">{goal.type}</span>}
                                            {goal.dueDate && (
                                                <>
                                                    <span className="text-muted-foreground/30">·</span>
                                                    <span className="text-xs text-muted-foreground">{formatDate(goal.dueDate)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                                        {goal.priority}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 pb-6">
                {/* Courses */}
                <Section title="Courses" sub="Current semester" action="View all" onAction={() => navigate('/notion')}>
                    {loading ? <Loading /> : academics.courses.length === 0 ? (
                        <Empty text="No courses found." />
                    ) : (
                        <div className="space-y-0.5">
                            {academics.courses.slice(0, 6).map((c: any) => {
                                const name = c.properties?.['Course Name']?.title?.[0]?.plain_text || 'Untitled'
                                const goal = c.properties?.['Goal']?.select?.name || ''
                                const grade = c.properties?.['Grade']?.select?.name || ''
                                return (
                                    <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/notion')}>
                                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-sm font-medium flex-1 truncate">{name}</span>
                                        {grade && <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{grade}</span>}
                                        {goal && !grade && <span className="text-xs text-muted-foreground">→ {goal}</span>}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </Section>

                {/* Completed Goals */}
                <Section title="Completed" sub="Recently finished">
                    {loading ? <Loading /> : completedGoals.length === 0 ? (
                        <Empty text="No completed goals yet." />
                    ) : (
                        <div className="space-y-0.5">
                            {completedGoals.slice(0, 6).map(goal => (
                                <div key={goal.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                    <span className="text-sm text-muted-foreground line-through truncate flex-1">{goal.title}</span>
                                    {goal.type && <span className="text-xs text-muted-foreground/40">{goal.type}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>
        </div>
    )
}

/* ─── Components ─── */

function StatCard({ label, value, sub, icon, onClick }: {
    label: string; value: string; sub: string; icon: React.ReactNode; onClick?: () => void
}) {
    return (
        <div onClick={onClick} className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <span className="text-muted-foreground/60">{icon}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
    )
}

function QuickAction({ label, sub, icon, onClick }: {
    label: string; sub: string; icon: React.ReactNode; onClick: () => void
}) {
    return (
        <button onClick={onClick} className="flex items-center gap-3 rounded-lg border bg-card p-3.5 hover:bg-muted/40 transition-colors text-left group w-full">
            <div className="text-muted-foreground group-hover:text-foreground transition-colors">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
        </button>
    )
}

function Section({ title, sub, action, onAction, className, children }: {
    title: string; sub?: string; action?: string; onAction?: () => void; className?: string; children: React.ReactNode
}) {
    return (
        <div className={cn("rounded-lg border bg-card", className)}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                </div>
                {action && onAction && (
                    <button onClick={onAction} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                        {action} <ArrowRight className="h-3 w-3" />
                    </button>
                )}
            </div>
            <div className="px-1 pb-2">{children}</div>
        </div>
    )
}

function Loading() {
    return (
        <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground/40" />
        </div>
    )
}

function Empty({ text }: { text: string }) {
    return (
        <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    )
}
