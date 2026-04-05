import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, RefreshCw, Calendar, CheckSquare, Clock, X, Plus, Save, Trash2, Search, CheckCircle2, ChevronRight } from 'lucide-react'
import { sidecarApi } from '../../lib/sidecarApi'
import { cn } from '../../lib/utils'

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

    const [markdownContent, setMarkdownContent] = useState('')
    const [loadingContent, setLoadingContent] = useState(false)
    const [savingContent, setSavingContent] = useState(false)

    useEffect(() => {
        if (selectedGoal) {
            fetchContent(selectedGoal.id)
        }
    }, [selectedGoal?.id])

    const fetchContent = async (id: string) => {
        setLoadingContent(true)
        try {
            const res = await sidecarApi.getNotionPageContent(id)
            const text = res.blocks
                .map((b: any) => {
                    const blockType = b.type
                    const content = b[blockType]?.rich_text?.map((t: any) => t.plain_text).join('') || ''
                    if (blockType === 'heading_1') return `# ${content}`
                    if (blockType === 'heading_2') return `## ${content}`
                    if (blockType === 'heading_3') return `### ${content}`
                    if (blockType === 'bulleted_list_item') return `- ${content}`
                    if (blockType === 'numbered_list_item') return `1. ${content}`
                    return content
                })
                .join('\n')
            setMarkdownContent(text)
        } catch (err) {
            console.error('Failed to fetch page content:', err)
        } finally {
            setLoadingContent(false)
        }
    }

    const saveContent = async () => {
        if (!selectedGoal) return
        setSavingContent(true)
        try {
            await sidecarApi.updateNotionPageContent(selectedGoal.id, markdownContent)
        } catch (err) {
            console.error('Failed to save content:', err)
        } finally {
            setSavingContent(false)
        }
    }

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
            if (selectedGoal) {
                const updated = parsedGoals.find((g: any) => g.id === selectedGoal.id)
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

    const changeArea = (goalId: string, val: string) => {
        updateGoalProperty(goalId, { Area: { select: { name: val } } })
    }

    const changeQuarter = (goalId: string, val: string) => {
        updateGoalProperty(goalId, { 'Yearly Quarter': { select: { name: val } } })
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
        if (!confirm('Are you sure you want to delete this goal?')) return
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

    const filteredGoals = filter === 'All'
        ? goals
        : goals.filter(g => g.type.includes(filter))

    return (
        <div className="flex h-full gap-6 animate-in fade-in duration-500 overflow-hidden font-sans relative">
            {/* Main Content */}
            <div className="flex flex-col transition-all duration-300 overflow-hidden h-full rounded-xl border bg-card text-card-foreground shadow-sm w-full">
                {/* Header Section */}
                <div className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">Goals</h2>
                            <p className="text-sm text-muted-foreground mt-1">Manage your goals.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchGoals}
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-md border text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 bg-background"
                            >
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin", !loading && "mr-2")} />
                                {!loading && "Refresh"}
                            </button>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
                            >
                                <Plus className="mr-2 h-4 w-4" /> New Goal
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                        <div className="relative w-full sm:w-[250px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search goals..."
                                className="w-full flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                        <div className="flex items-center p-1 bg-muted/50 rounded-md">
                            {['All', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'].map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-sm text-xs font-medium transition-all",
                                        filter === f
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List View */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {loading && goals.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span className="text-sm font-medium">Syncing data...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 pb-10">
                            {filteredGoals.map(goal => (
                                <div key={goal.id}
                                    onClick={() => setSelectedGoal(goal)}
                                    className={cn(
                                        "group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer bg-card hover:bg-accent/50",
                                        goal.completed && "opacity-60 bg-muted/30",
                                        selectedGoal?.id === goal.id && "ring-1 ring-primary border-primary bg-primary/5"
                                    )}>

                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleCompletion(goal) }}
                                            disabled={!!updatingId}
                                            className={cn(
                                                "shrink-0 h-5 w-5 rounded border flex items-center justify-center transition-colors",
                                                goal.completed
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
                                            )}
                                        >
                                            <CheckSquare className={cn("h-3.5 w-3.5", updatingId === goal.id && "animate-spin text-foreground opacity-100", !goal.completed && "opacity-0 group-hover:opacity-50")} />
                                        </button>

                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "shrink-0 w-2 h-2 rounded-full",
                                                    goal.priority === 'High' ? "bg-primary" :
                                                        goal.priority === 'Medium' ? "bg-amber-500" :
                                                            goal.priority === 'Low' ? "bg-emerald-500" : "bg-muted-foreground"
                                                )} />
                                                <h3 className={cn(
                                                    "font-medium text-sm truncate",
                                                    goal.completed && "line-through text-muted-foreground"
                                                )}>
                                                    {goal.title}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 ml-4">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {goal.type.split(' ')[0]}
                                                </span>
                                                {goal.dueDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {goal.dueDate}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 pl-2">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Editing Panel Modal */}
            {selectedGoal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedGoal(null)} />
                    <div className="relative w-full max-w-4xl h-[85vh] flex flex-col rounded-xl border bg-card text-card-foreground shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b bg-muted/10 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">Goal Details</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <a href={selectedGoal.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent text-muted-foreground transition-colors">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                                <button onClick={() => setSelectedGoal(null)} className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent text-muted-foreground transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto flex flex-col bg-background custom-scrollbar">
                            <div className="p-6 space-y-6 shrink-0 border-b border-border/50">
                                <div>
                                    <input
                                        value={selectedGoal.title}
                                        onChange={(e) => changeTitle(selectedGoal.id, e.target.value)}
                                        className={cn(
                                            "w-full bg-transparent text-xl sm:text-2xl font-bold tracking-tight text-foreground outline-none border-none placeholder:text-muted-foreground",
                                            selectedGoal.completed && "line-through text-muted-foreground"
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <DetailProperty label="Status">
                                        <button
                                            onClick={() => toggleCompletion(selectedGoal)}
                                            className={cn(
                                                "w-full h-9 px-3 rounded-md text-sm font-medium border flex justify-between items-center transition-colors",
                                                selectedGoal.completed
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                                                    : "bg-background hover:bg-accent text-foreground"
                                            )}
                                        >
                                            {selectedGoal.completed ? 'Completed' : 'In Progress'}
                                            {selectedGoal.completed ? <CheckCircle2 className="h-4 w-4" /> : <CheckSquare className="h-4 w-4 opacity-50" />}
                                        </button>
                                    </DetailProperty>

                                    <DetailProperty label="Priority">
                                        <select value={selectedGoal.priority} onChange={e => changePriority(selectedGoal.id, e.target.value)}
                                            className="h-9 px-3 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </DetailProperty>

                                    <DetailProperty label="Goal Type">
                                        <select value={selectedGoal.type} onChange={e => changeType(selectedGoal.id, e.target.value)}
                                            className="h-9 px-3 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                            {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </DetailProperty>

                                    <DetailProperty label="Area">
                                        <select value={selectedGoal.area} onChange={e => changeArea(selectedGoal.id, e.target.value)}
                                            className="h-9 px-3 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                            {['Personal', 'Academic', 'Financial', 'Fitness', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </DetailProperty>

                                    <DetailProperty label="Timeframe Quarter">
                                        <select value={selectedGoal.quarter} onChange={e => changeQuarter(selectedGoal.id, e.target.value)}
                                            className="h-9 px-3 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground appearance-none cursor-pointer">
                                            {['First Quarter', 'Second Quarter', 'Third Quarter', 'Fourth Quarter', 'Pre-Launch'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </DetailProperty>

                                    <DetailProperty label="Due Date">
                                        <input type="date" value={selectedGoal.dueDate} onChange={e => changeDueDate(selectedGoal.id, e.target.value)}
                                            className="h-9 px-3 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground cursor-pointer" />
                                    </DetailProperty>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col relative min-h-[300px]">
                                <div className="flex items-center justify-between px-6 py-2 bg-muted/10 border-b border-border/50 shrink-0">
                                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5" /> Content Narrative
                                    </span>
                                    <button
                                        onClick={saveContent}
                                        disabled={savingContent}
                                        className="inline-flex items-center justify-center rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-7 px-3 border shadow-sm"
                                    >
                                        {savingContent ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                                        {savingContent ? "Saving" : "Save changes"}
                                    </button>
                                </div>

                                <div className="flex-1 relative">
                                    {loadingContent && (
                                        <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                    <textarea
                                        value={markdownContent}
                                        onChange={(e) => setMarkdownContent(e.target.value)}
                                        placeholder="Add notes, context, subtasks..."
                                        className="w-full h-full p-6 bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/50 custom-scrollbar"
                                    />
                                </div>
                            </div>

                            {/* Footer details */}
                            <div className="p-4 bg-muted/10 shrink-0 flex items-center justify-between border-t border-border/50">
                                <span className="text-xs text-muted-foreground">Markdown supported</span>
                                <button
                                    onClick={() => deleteTarget(selectedGoal.id)}
                                    className="flex items-center gap-1.5 text-xs text-destructive hover:underline font-medium"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Goal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Overlay */}
            {showCreate && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                    <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <div className="space-y-1">
                                <h3 className="font-semibold tracking-tight text-xl">Create Goal</h3>
                                <p className="text-sm text-muted-foreground">Add a new target to your system.</p>
                            </div>
                            <button onClick={() => setShowCreate(false)} className="rounded-md p-1 hover:bg-accent focus:outline-none">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Title</label>
                                <input
                                    autoFocus
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="e.g. Master React fundamentals"
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Type</label>
                                    <select value={newType} onChange={e => setNewType(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                                        {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Priority</label>
                                    <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Due Date (Optional)</label>
                                <input
                                    type="date"
                                    value={newDueDate}
                                    onChange={e => setNewDueDate(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 mt-2">
                            <button onClick={() => setShowCreate(false)} className="inline-flex items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4">
                                Cancel
                            </button>
                            <button
                                onClick={createGoal}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 shadow-sm"
                            >
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

function DetailProperty({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            {children}
        </div>
    )
}

function FileText(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
}
