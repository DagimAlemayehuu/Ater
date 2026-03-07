import { useState, useEffect } from 'react'
import { Target, ExternalLink, RefreshCw, Calendar, CheckSquare, Clock, AlertCircle, X, Plus, ChevronRight, Layers, Flag, Hash, Link2, Save, Trash2 } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GoalRaw { id: string; properties: Record<string, any>; url: string }

interface Goal {
    id: string
    raw: GoalRaw
    title: string
    type: string
    priority: string
    completed: boolean
    remainingDays: string
    area: string
    year: string
    month: string
    week: string
    quarter: string
    dueDate: string
    url: string
}

const GOALS_DB_ID = '2a9219ed-7519-815f-ac0f-ebfcd1dcd003'

const GOAL_TYPES = ['Weekly Goal', 'Monthly Goal', 'Quarterly Goal', 'Yearly Goal', 'Lifetime Goal']
const PRIORITIES = ['High', 'Medium', 'Low', 'None']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGoal(page: any): Goal {
    const props = page.properties
    const title = props.Name?.title?.[0]?.plain_text || 'Untitled'
    const type = props['Type of Goal']?.select?.name || 'Uncategorized'
    const priority = props.Priority?.select?.name || 'None'
    const completed = props.Completed?.checkbox || false
    const remainingRaw = props.Remaining?.formula?.string || ''
    const area = props.Area?.select?.name || props.Area?.relation?.[0]?.id || ''
    const year = props.Year?.select?.name || props.Year?.formula?.string || ''
    const month = props.Month?.select?.name || props.Month?.formula?.string || ''
    const week = props.Week?.select?.name || props.Week?.formula?.string || ''
    const quarter = props['Yearly Quarter']?.select?.name || props['Yearly Quarter']?.formula?.string || ''
    const dueDate = props['Due Date']?.date?.start || ''

    return {
        id: page.id,
        raw: page,
        title,
        type,
        priority,
        completed,
        remainingDays: remainingRaw.trim(),
        area,
        year,
        month,
        week,
        quarter,
        dueDate,
        url: page.url
    }
}

export default function Goals() {
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<string>('All')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
    const [showCreate, setShowCreate] = useState(false)

    // Create form state
    const [newTitle, setNewTitle] = useState('')
    const [newType, setNewType] = useState('Weekly Goal')
    const [newPriority, setNewPriority] = useState('Medium')
    const [newDueDate, setNewDueDate] = useState('')

    useEffect(() => {
        fetchGoals()
    }, [])

    const fetchGoals = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.queryNotionDatabase(GOALS_DB_ID)
            const parsedGoals = res.results.map(parseGoal)
            parsedGoals.sort((a: Goal, b: Goal) => {
                if (a.completed && !b.completed) return 1
                if (!a.completed && b.completed) return -1
                const pw: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1, 'None': 0 }
                return (pw[b.priority] || 0) - (pw[a.priority] || 0)
            })
            setGoals(parsedGoals)
            // If detail panel is open, refresh it
            if (selectedGoal) {
                const updated = parsedGoals.find(g => g.id === selectedGoal.id)
                if (updated) setSelectedGoal(updated)
            }
        } catch (err) {
            console.error('Failed to fetch goals:', err)
        } finally {
            setLoading(false)
        }
    }

    const updateGoalProperty = async (goalId: string, properties: Record<string, any>) => {
        setUpdatingId(goalId)
        try {
            await sidecarApi.updateNotionPage(goalId, properties)
            await fetchGoals()
        } catch (err) {
            console.error('Failed to update goal:', err)
        } finally {
            setUpdatingId(null)
        }
    }

    const toggleCompletion = (goal: Goal) => {
        updateGoalProperty(goal.id, { Completed: { checkbox: !goal.completed } })
    }

    const changePriority = (goalId: string, newPri: string) => {
        updateGoalProperty(goalId, { Priority: { select: { name: newPri } } })
    }

    const changeType = (goalId: string, newGType: string) => {
        updateGoalProperty(goalId, { 'Type of Goal': { select: { name: newGType } } })
    }

    const changeDueDate = (goalId: string, date: string) => {
        if (!date) return
        updateGoalProperty(goalId, { 'Due Date': { date: { start: date } } })
    }

    const changeTitle = (goalId: string, newName: string) => {
        updateGoalProperty(goalId, { Name: { title: [{ text: { content: newName } }] } })
    }

    const createGoal = async () => {
        if (!newTitle.trim()) return
        setLoading(true)
        try {
            const properties: Record<string, any> = {
                Name: { title: [{ text: { content: newTitle.trim() } }] },
                'Type of Goal': { select: { name: newType } },
                Priority: { select: { name: newPriority } }
            }
            if (newDueDate) {
                properties['Due Date'] = { date: { start: newDueDate } }
            }
            await sidecarApi.createNotionPage(GOALS_DB_ID, properties)
            setNewTitle('')
            setNewDueDate('')
            setShowCreate(false)
            await fetchGoals()
        } catch (err) {
            console.error('Failed to create goal:', err)
        } finally {
            setLoading(false)
        }
    }

    const deleteTarget = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return
        setLoading(true)
        try {
            await sidecarApi.deleteNotionPage(id)
            setSelectedGoal(null)
            await fetchGoals()
        } catch (err) {
            console.error('Failed to delete goal:', err)
        } finally {
            setLoading(false)
        }
    }

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'High': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            case 'Low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
        }
    }

    const filteredGoals = filter === 'All'
        ? goals
        : goals.filter(g => g.type.includes(filter))

    return (
        <div className="flex h-[calc(100vh-140px)] gap-0 animate-in fade-in duration-700 overflow-hidden">
            {/* Main Content */}
            <div className={cn(
                "flex flex-col gap-6 transition-all duration-500 overflow-hidden",
                selectedGoal ? "w-[55%]" : "w-full"
            )}>
                {/* Header */}
                <div className="flex flex-col gap-5 shrink-0">
                    <div className="flex items-end justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h2 className="text-4xl font-black tracking-tightest bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent italic">
                                    OBJECTIVES
                                </h2>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground/60 tracking-wide uppercase px-1">
                                Mission Critical Performance Metrics
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowCreate(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5" /> NEW GOAL
                            </button>
                            <a
                                href="https://notion.so/2a9219ed7519815fac0febfcd1dcd003"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 transition-all hover:scale-105 active:scale-95 text-muted-foreground hover:text-white"
                            >
                                NOTION <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button onClick={fetchGoals} disabled={loading}
                                className="p-3 rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all disabled:opacity-50 group hover:scale-110 active:scale-90">
                                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 p-1.5 bg-zinc-900/50 border border-white/5 rounded-full w-fit mx-auto shadow-2xl backdrop-blur-xl">
                        {['All', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'Lifetime'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={cn(
                                    "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === f
                                        ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                                )}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Create Goal Modal */}
                {showCreate && (
                    <div className="shrink-0 mx-auto w-full max-w-lg p-6 bg-card border border-white/10 rounded-3xl shadow-2xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">New Objective</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-white/10 text-zinc-500"><X className="w-4 h-4" /></button>
                        </div>
                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Goal title..."
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-zinc-600" autoFocus />
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Type</label>
                                <select value={newType} onChange={e => setNewType(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none appearance-none cursor-pointer">
                                    {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Priority</label>
                                <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none appearance-none cursor-pointer">
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold uppercase text-zinc-500 mb-1 block">Due Date</label>
                                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer" />
                            </div>
                        </div>
                        <button onClick={createGoal} disabled={!newTitle.trim() || loading}
                            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40">
                            Deploy Objective
                        </button>
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-auto custom-scrollbar px-1">
                    {loading && goals.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse rounded-full" />
                                <RefreshCw className="w-12 h-12 animate-spin text-primary relative" />
                            </div>
                            <span className="text-xs font-black tracking-[0.3em] uppercase animate-pulse text-primary/50">Synchronizing...</span>
                        </div>
                    ) : (
                        <div className={cn(
                            "grid gap-4 pb-20",
                            selectedGoal
                                ? "grid-cols-1 lg:grid-cols-2"
                                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                        )}>
                            {filteredGoals.map(goal => (
                                <div key={goal.id}
                                    onClick={() => setSelectedGoal(goal)}
                                    className={cn(
                                        "group relative flex flex-col gap-4 p-6 rounded-3xl border bg-card/50 backdrop-blur-sm transition-all duration-300 cursor-pointer",
                                        "hover:bg-card hover:border-primary/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]",
                                        goal.completed ? "opacity-40 grayscale" : "",
                                        selectedGoal?.id === goal.id ? "border-primary/40 bg-card ring-1 ring-primary/20" : ""
                                    )}>
                                    {/* Priority & Completion Header */}
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                                            getPriorityStyles(goal.priority)
                                        )}>
                                            {goal.priority}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleCompletion(goal) }}
                                            disabled={!!updatingId}
                                            className={cn(
                                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all border-2",
                                                goal.completed
                                                    ? "bg-primary border-primary text-black"
                                                    : "bg-zinc-900 border-white/5 text-zinc-600 hover:border-primary/50 hover:text-primary"
                                            )}>
                                            <CheckSquare className={cn("w-4 h-4", updatingId === goal.id && "animate-spin")} />
                                        </button>
                                    </div>

                                    {/* Title */}
                                    <h3 className={cn(
                                        "font-black text-lg leading-[1.15] tracking-tight text-white group-hover:text-primary transition-colors",
                                        goal.completed && "line-through"
                                    )}>
                                        {goal.title}
                                    </h3>

                                    {/* Type Badge */}
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> {goal.type}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full animate-pulse", goal.completed ? "bg-zinc-700" : "bg-primary")} />
                                            <span className={cn(
                                                "text-[10px] font-black tracking-widest uppercase text-zinc-500 flex items-center gap-1.5",
                                                goal.remainingDays.toLowerCase().includes('past') && "text-rose-400",
                                                goal.remainingDays.toLowerCase().includes('today') && "text-amber-400"
                                            )}>
                                                <Clock className="w-3 h-3" />
                                                {goal.remainingDays || 'INDEFINITE'}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && filteredGoals.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground/20 italic">
                            <AlertCircle className="w-12 h-12" />
                            <p className="text-sm font-bold uppercase tracking-widest">No Tactical Targets Identified</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Panel - Slide-in sidebar */}
            {selectedGoal && (
                <GoalDetailPanel
                    goal={selectedGoal}
                    updatingId={updatingId}
                    onClose={() => setSelectedGoal(null)}
                    onToggleComplete={() => toggleCompletion(selectedGoal)}
                    onChangePriority={(p) => changePriority(selectedGoal.id, p)}
                    onChangeType={(t) => changeType(selectedGoal.id, t)}
                    onChangeDueDate={(d) => changeDueDate(selectedGoal.id, d)}
                    onChangeTitle={(t) => changeTitle(selectedGoal.id, t)}
                    onDelete={() => deleteTarget(selectedGoal.id)}
                />
            )}
        </div>
    )
}

interface DetailPanelProps {
    goal: Goal
    updatingId: string | null
    onClose: () => void
    onToggleComplete: () => void
    onChangePriority: (priority: string) => void
    onChangeType: (type: string) => void
    onChangeDueDate: (date: string) => void
    onChangeTitle: (title: string) => void
    onDelete: () => void
}

function GoalDetailPanel({ goal, updatingId, onClose, onToggleComplete, onChangePriority, onChangeType, onChangeDueDate, onChangeTitle, onDelete }: DetailPanelProps) {
    const [editingTitle, setEditingTitle] = useState(false)
    const [titleDraft, setTitleDraft] = useState(goal.title)

    // Sync title draft when goal changes
    useEffect(() => {
        setTitleDraft(goal.title)
        setEditingTitle(false)
    }, [goal.id, goal.title])

    const saveTitle = () => {
        if (titleDraft.trim() && titleDraft !== goal.title) {
            onChangeTitle(titleDraft.trim())
        }
        setEditingTitle(false)
    }

    const isUpdating = updatingId === goal.id

    return (
        <div className="w-[45%] border-l border-white/5 bg-card/30 backdrop-blur-xl flex flex-col animate-in slide-in-from-right-5 duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Goal Details</span>
                    {isUpdating && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
                </div>
                <div className="flex items-center gap-2">
                    <a href={goal.url} target="_blank" rel="noreferrer"
                        className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    {editingTitle ? (
                        <div className="flex gap-2">
                            <input value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                                className="flex-1 bg-zinc-900 border border-primary/30 rounded-xl px-4 py-3 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-primary/40" autoFocus />
                            <button onClick={saveTitle} className="p-3 rounded-xl bg-primary text-black hover:opacity-90 transition-all">
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <h2 onClick={() => setEditingTitle(true)}
                            className={cn(
                                "text-2xl font-black tracking-tight text-white cursor-pointer hover:text-primary transition-colors leading-tight",
                                goal.completed && "line-through opacity-60"
                            )}
                            title="Click to edit">
                            {goal.title}
                        </h2>
                    )}
                </div>

                {/* Completion Toggle */}
                <button onClick={onToggleComplete} disabled={isUpdating}
                    className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        goal.completed
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-primary/20 hover:text-primary"
                    )}>
                    <CheckSquare className={cn("w-5 h-5", isUpdating && "animate-spin")} />
                    <span className="text-sm font-bold uppercase tracking-wider">{goal.completed ? 'Completed ✓' : 'Mark as Completed'}</span>
                </button>

                {/* Properties Grid */}
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">Properties</h4>

                    {/* Type of Goal */}
                    <PropertyRow icon={<Layers className="w-4 h-4" />} label="Type of Goal">
                        <select value={goal.type} onChange={e => onChangeType(e.target.value)} disabled={isUpdating}
                            className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none appearance-none cursor-pointer hover:border-primary/30 transition-colors w-full">
                            {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </PropertyRow>

                    {/* Priority */}
                    <PropertyRow icon={<Flag className="w-4 h-4" />} label="Priority">
                        <select value={goal.priority} onChange={e => onChangePriority(e.target.value)} disabled={isUpdating}
                            className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none appearance-none cursor-pointer hover:border-primary/30 transition-colors w-full">
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </PropertyRow>

                    {/* Due Date */}
                    <PropertyRow icon={<Calendar className="w-4 h-4" />} label="Due Date">
                        <input type="date" value={goal.dueDate} onChange={e => onChangeDueDate(e.target.value)} disabled={isUpdating}
                            className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer hover:border-primary/30 transition-colors w-full" />
                    </PropertyRow>

                    {/* Remaining (Read-only formula) */}
                    <PropertyRow icon={<Clock className="w-4 h-4" />} label="Remaining">
                        <span className={cn(
                            "text-xs font-bold px-3 py-2",
                            goal.remainingDays.toLowerCase().includes('past') && "text-rose-400",
                            goal.remainingDays.toLowerCase().includes('today') && "text-amber-400",
                            !goal.remainingDays && "text-zinc-600"
                        )}>
                            {goal.remainingDays || 'No due date set'}
                        </span>
                    </PropertyRow>

                    {/* Year */}
                    {goal.year && (
                        <PropertyRow icon={<Hash className="w-4 h-4" />} label="Year">
                            <span className="text-xs font-bold text-zinc-300 px-3 py-2">{goal.year}</span>
                        </PropertyRow>
                    )}

                    {/* Month */}
                    {goal.month && (
                        <PropertyRow icon={<Hash className="w-4 h-4" />} label="Month">
                            <span className="text-xs font-bold text-zinc-300 px-3 py-2">{goal.month}</span>
                        </PropertyRow>
                    )}

                    {/* Week */}
                    {goal.week && (
                        <PropertyRow icon={<Hash className="w-4 h-4" />} label="Week">
                            <span className="text-xs font-bold text-zinc-300 px-3 py-2">{goal.week}</span>
                        </PropertyRow>
                    )}

                    {/* Quarterly */}
                    {goal.quarter && (
                        <PropertyRow icon={<Hash className="w-4 h-4" />} label="Yearly Quarter">
                            <span className="text-xs font-bold text-zinc-300 px-3 py-2">{goal.quarter}</span>
                        </PropertyRow>
                    )}

                    {/* Area */}
                    {goal.area && (
                        <PropertyRow icon={<Layers className="w-4 h-4" />} label="Area">
                            <span className="text-xs font-bold text-zinc-300 px-3 py-2">{goal.area}</span>
                        </PropertyRow>
                    )}
                </div>

                {/* Open in Notion */}
                <a href={goal.url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
                    <Link2 className="w-4 h-4" /> Open in Notion
                </a>

                {/* Delete Goal */}
                <button
                    onClick={onDelete}
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition-all text-xs font-bold uppercase tracking-widest mt-4"
                >
                    <Trash2 className="w-4 h-4" /> Delete Objective
                </button>
            </div>
        </div>
    )
}

function PropertyRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 py-3 px-1 border-b border-white/5 last:border-b-0">
            <div className="text-zinc-600 shrink-0">{icon}</div>
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider w-28 shrink-0">{label}</span>
            <div className="flex-1">{children}</div>
        </div>
    )
}
