import { useState, useMemo, useEffect, useRef } from 'react'
import {
    LayoutDashboard,
    Target,
    ScrollText,
    History,
    ClipboardCheck,
    CheckSquare,
    Clock,
    Plus,
    Send,
    BrainCircuit,
    Sparkles,
    RefreshCw,
    ExternalLink,
    Check,
    Zap,
    Trash2,
    Calendar,
    ArrowLeft,
    AlertTriangle,
    Battery
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
import { slidersToPromptFragment } from '@/components/profiles/StrategistSliders'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'

interface Message {
    role: 'user' | 'model'
    content: string
}

interface Goal {
    id: string
    title: string
    type: string
    priority: string
    completed: boolean
    remainingDays: string
    dueDate: string
    url: string
    area?: string
    quarter?: string
    week?: string
    year?: string
    month?: string
}

type MenuScreen = 'HOME' | 'MANAGE_PLAN' | 'VIEW_BREAKDOWN' | 'REPORT_REROUTING' | 'SUMMARY' | 'FULL_PLAN'

const GOALS_DB_ID = '2a9219ed-7519-815f-ac0f-ebfcd1dcd003'

export default function Strategist() {
    const { config } = useConfig()
    const [activeView, setActiveView] = useState<'dashboard' | 'goals' | 'chat'>('dashboard')
    const [currentMenu, setCurrentMenu] = useState<MenuScreen>('HOME')

    // Chat State
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(false)

    const [goals, setGoals] = useState<Goal[]>([])
    const [goalsLoading, setGoalsLoading] = useState(false)
    const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null)
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
    const [isAddingGoal, setIsAddingGoal] = useState(false)
    const [isEditingPlan, setIsEditingPlan] = useState(false)
    const [isReviewing, setIsReviewing] = useState(false)
    const [isCrisisWizard, setIsCrisisWizard] = useState(false)
    const [isDeloadWizard, setIsDeloadWizard] = useState(false)
    const [isLifePivotWizard, setIsLifePivotWizard] = useState(false)
    const [isRemovingGoals, setIsRemovingGoals] = useState(false)
    const [isManagingPriority, setIsManagingPriority] = useState(false)
    const [isUpdatingStartDate, setIsUpdatingStartDate] = useState(false)
    const [isEditingPlanAI, setIsEditingPlanAI] = useState(false)
    const [goalFilter, setGoalFilter] = useState('All')

    const hasMasterPlan = useMemo(() => {
        return config?.profileMasterPlan && config.profileMasterPlan.trim().length > 100
    }, [config?.profileMasterPlan])


    const handleSend = async (forcedQuery?: string) => {
        const text = forcedQuery || query
        if (!text.trim() || loading) return

        const userMsg: Message = { role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        if (!forcedQuery) setQuery('')
        setActiveView('chat')
        setLoading(true)

        try {
            const context = JSON.stringify({
                personalProfile: config?.profilePersonal,
                academicProfile: config?.profileAcademic,
                financialProfile: config?.profileFinancial,
                fitnessProfile: config?.profileFitness,
                masterPlan: config?.profileMasterPlan,
                masterPlanStatus: hasMasterPlan ? "Active" : "Missing",
            })

            const sliderFragment = slidersToPromptFragment(config?.strategistSliders || '')
            const fullSystemPrompt = [config?.strategistPrompt, sliderFragment].filter(Boolean).join('\n\n')
            const res = await sidecarApi.brainstorm(text, context, fullSystemPrompt || undefined)
            const aiMsg: Message = { role: 'model', content: res.response }
            setMessages(prev => [...prev, aiMsg])

            // Auto-refresh goals if the AI likely made changes via tools
            if (res.response.toLowerCase().includes('successfully') ||
                res.response.toLowerCase().includes('notion') ||
                res.response.toLowerCase().includes('updated')) {
                fetchGoals()
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            setMessages(prev => [...prev, { role: 'model', content: `CRITICAL ERROR: ${errorMsg}` }])
        } finally {
            setLoading(false)
        }
    }

    const fetchGoals = async () => {
        setGoalsLoading(true)
        try {
            // Priority 1: Use hardcoded ID if provided
            let dbId = GOALS_DB_ID

            // Priority 2: Auto-discover if the default is empty/fails
            const dbList = await sidecarApi.listNotionDatabases()
            const candidate = dbList.databases.find(d =>
                d.title?.[0]?.plain_text?.toLowerCase().includes('goal') ||
                d.title?.[0]?.plain_text?.toLowerCase().includes('target')
            )

            if (candidate) {
                dbId = candidate.id
                console.log(`[Strategist] Found auto-discovered database: ${candidate.title?.[0]?.plain_text} (${dbId})`)
            }

            const res = await sidecarApi.queryNotionDatabase(dbId)
            console.log('[Strategist] RAW GOALS RESPONSE:', res.results)

            if (!res.results || res.results.length === 0) {
                console.warn('[Strategist] No results returned for database:', dbId)
                setGoals([])
                return
            }

            const parsed = res.results.map((page: { id: string; properties: Record<string, any>; url: string }) => {
                const props = page.properties
                // We'll try to find the title property dynamically if 'Name' is missing
                const titleKey = Object.keys(props).find(k => props[k].type === 'title') || 'Name'
                const titleValue = props[titleKey]?.title?.[0]?.plain_text || 'Untitled'

                return {
                    id: page.id,
                    title: titleValue,
                    type: props['Type of Goal']?.select?.name || props['Type']?.select?.name || 'Weekly Goal',
                    priority: props.Priority?.select?.name || props['Level']?.select?.name || 'None',
                    completed: props.Completed?.checkbox || props['Done']?.checkbox || false,
                    remainingDays: props.Remaining?.formula?.string || props['Days Left']?.formula?.string || '',
                    dueDate: props['Due Date']?.date?.start || props['Deadline']?.date?.start || '',
                    area: props.Area?.select?.name,
                    quarter: props['Yearly Quarter']?.select?.name || props['Quarter']?.select?.name,
                    week: props.Week?.select?.name,
                    year: props.Year?.select?.name || props['Release Year']?.select?.name,
                    month: props.Month?.select?.name,
                    url: page.url
                }
            })
            parsed.sort((a: Goal, b: Goal) => {
                if (a.completed && !b.completed) return 1
                if (!a.completed && b.completed) return -1
                const pw: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1, 'None': 0 }
                return (pw[b.priority] || 0) - (pw[a.priority] || 0)
            })
            setGoals(parsed)
        } catch (err) {
            console.error('Failed to fetch goals:', err)
        } finally {
            setGoalsLoading(false)
        }
    }

    const toggleGoal = async (goal: Goal) => {
        setUpdatingGoalId(goal.id)
        try {
            await sidecarApi.updateNotionPage(goal.id, {
                properties: { Completed: { checkbox: !goal.completed } }
            })
            await fetchGoals()
        } catch (err) {
            console.error('Update failed:', err)
        } finally {
            setUpdatingGoalId(null)
        }
    }

    const startOnboarding = () => {
        const onboardingQuery = `
INITIATE MASTER PLAN CREATION SEQUENCE.

Guide me through building a rigid, Dalio-inspired Master Plan using exactly this structure:
1. Start Date & Core Stats
2. Achievability (Why most fail)
3. Hindrances (Specific friction)
4. Prioritization Matrix
5. Quarterly Breakdown (Q1-Q4)
6. Habit Stacking

Let's start with Step 1: Tell me about your current state and when you want to officially launch this plan.
        `.trim()
        handleSend(onboardingQuery)
    }

    // Effect to fetch goals
    useEffect(() => {
        fetchGoals()
    }, [])

    const filteredGoals = useMemo(() => {
        if (goalFilter === 'All') return goals
        return goals.filter(g => g.type.includes(goalFilter))
    }, [goals, goalFilter])

    if (!hasMasterPlan) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-8 animate-in fade-in duration-700">
                <div className="p-6 rounded-xl bg-muted border border-border">
                    <Sparkles size={48} className="text-muted-foreground" />
                </div>
                <div className="text-center max-w-md space-y-3">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">No Master Plan Yet</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        The Strategist needs a Master Plan to operate. Create one to enable goal tracking and tactical advice.
                    </p>
                </div>
                <div className="flex gap-3 w-full max-w-xs">
                    <button
                        onClick={startOnboarding}
                        className="flex-1 px-5 py-2.5 bg-foreground text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-all"
                    >
                        Create Plan
                    </button>
                    <Link
                        to="/settings"
                        className="flex-1 px-5 py-2.5 bg-muted text-muted-foreground border border-border rounded-lg text-xs font-semibold hover:text-foreground transition-all text-center"
                    >
                        Configure
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full gap-5 transition-all duration-300">
            {/* Header & Nav */}
            {/* Minimal Header & Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-muted border border-border">
                                <Zap size={16} className="text-foreground" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tighter text-foreground uppercase italic leading-none">Strategist</h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase opacity-60">System Operational</span>
                                </div>
                            </div>
                        </div>

                        <nav className="flex items-center bg-zinc-100 dark:bg-zinc-900/50 border border-border p-1 rounded-xl">
                            <NavButton active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setCurrentMenu('HOME'); }} icon={LayoutDashboard} label="Control" />
                            <NavButton active={activeView === 'goals'} onClick={() => { setActiveView('goals'); fetchGoals(); }} icon={Target} label="Objectives" />
                        </nav>
                    </div>

                    <div className="flex-1 overflow-hidden min-h-0">
                        {activeView === 'dashboard' && (
                            <div className="h-full overflow-y-auto pr-2 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {currentMenu === 'HOME' && (
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Overview</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <StatCard
                                                    title="Master Plan"
                                                    value={hasMasterPlan ? "Active" : "Not Created"}
                                                    subValue={hasMasterPlan ? "In progress" : "Not set up"}
                                                    icon={ScrollText}
                                                    color="text-muted-foreground"
                                                />
                                                <StatCard
                                                    title="Quarter"
                                                    value="Q1"
                                                    subValue="Current period"
                                                    icon={Target}
                                                    color="text-muted-foreground"
                                                />
                                                <StatCard
                                                    title="Active Goals"
                                                    value={goalsLoading ? "..." : String(goals.filter(g => !g.completed).length)}
                                                    subValue={goalsLoading ? "Loading..." : "In progress"}
                                                    icon={Target}
                                                    color="text-muted-foreground"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Weekly Focus</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {goals.filter(g => !g.completed && g.type === 'Weekly Goal').slice(0, 4).map(g => (
                                                    <div key={g.id} className="p-4 bg-muted/30 border border-border rounded-lg flex items-center justify-between group hover:bg-muted/60 transition-all cursor-pointer" onClick={() => setEditingGoal(g)}>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{g.area || 'Objective'}</span>
                                                            <span className="text-sm font-medium text-foreground">{g.title}</span>
                                                        </div>
                                                        <div className={cn("px-2 py-0.5 rounded text-[9px] font-medium",
                                                            g.priority === 'High' ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                                                                g.priority === 'Medium' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                                                    "bg-muted text-muted-foreground"
                                                        )}>
                                                            {g.priority}
                                                        </div>
                                                    </div>
                                                ))}
                                                {goals.filter(g => !g.completed && g.type === 'Weekly Goal').length === 0 && (
                                                    <div className="md:col-span-2 p-6 border border-dashed border-border rounded-lg text-center">
                                                        <span className="text-xs text-muted-foreground">No weekly goals defined</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Actions</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <MenuButton
                                                    number="1"
                                                    label="Manage Master Plan"
                                                    description="Modify strategy, goals & priorities"
                                                    onClick={() => setCurrentMenu('MANAGE_PLAN')}
                                                    icon={ScrollText}
                                                />
                                                <MenuButton
                                                    number="2"
                                                    label="View Plan Breakdown"
                                                    description="Quarterly, Monthly & Weekly focus"
                                                    onClick={() => setCurrentMenu('VIEW_BREAKDOWN')}
                                                    icon={LayoutDashboard}
                                                />
                                                <MenuButton
                                                    number="3"
                                                    label="Review & Re-routing"
                                                    description="Weekly, Monthly & Quarterly calibration"
                                                    onClick={() => setCurrentMenu('REPORT_REROUTING')}
                                                    icon={ClipboardCheck}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentMenu === 'MANAGE_PLAN' && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <button onClick={() => setCurrentMenu('HOME')} className="p-2 hover:bg-muted rounded-lg transition-all">
                                                <History size={16} className="text-muted-foreground" />
                                            </button>
                                            <h3 className="text-lg font-bold text-foreground">Manage Master Plan</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <MenuOption number="1" label="View Active Plan Summary" onClick={() => setCurrentMenu('SUMMARY')} />
                                            <MenuOption number="2" label="Add a New Goal" onClick={() => setIsAddingGoal(true)} />
                                            <MenuOption number="3" label="Remove Selected Goals" onClick={() => setIsRemovingGoals(true)} />
                                            <MenuOption number="4" label="Refine Details of a Goal" onClick={() => { setActiveView('goals'); fetchGoals(); }} />
                                            <MenuOption number="5" label="Adjust Priority Matrix" onClick={() => setIsManagingPriority(true)} />
                                            <MenuOption number="6" label="Edit Master Plan (AI)" onClick={() => setIsEditingPlanAI(true)} />
                                            <MenuOption number="7" label="Update Start Date" onClick={() => setIsUpdatingStartDate(true)} />
                                            <button onClick={() => setCurrentMenu('HOME')} className="p-4 bg-muted/30 border border-border rounded-lg text-muted-foreground text-xs font-medium hover:text-foreground transition-all">
                                                8. Return to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {currentMenu === 'VIEW_BREAKDOWN' && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setCurrentMenu('HOME')} className="p-2 hover:bg-muted rounded-lg transition-all">
                                                    <History size={16} className="text-muted-foreground" />
                                                </button>
                                                <h3 className="text-lg font-bold text-foreground">Plan Breakdown</h3>
                                            </div>
                                            <button onClick={() => { setActiveView('goals'); setGoalFilter('All'); fetchGoals(); }} className="text-xs font-medium text-primary hover:underline transition-all">
                                                View All Goals →
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {['Yearly Goal', 'Quarterly Goal', 'Monthly Goal', 'Weekly Goal'].map(type => (
                                                <div key={type} className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-foreground/20 rounded-full" />
                                                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{type}s</h4>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {goals.filter(g => g.type === type).slice(0, 3).map(g => (
                                                            <div key={g.id} className="p-3 bg-muted/30 border border-border rounded-lg flex items-center justify-between group hover:bg-muted/50 transition-all cursor-pointer" onClick={() => setEditingGoal(g)}>
                                                                <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">{g.title}</span>
                                                                <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded",
                                                                    g.completed ? "text-green-600 dark:text-green-400 bg-green-500/10" : "text-muted-foreground bg-muted")}
                                                                >
                                                                    {g.completed ? 'Done' : 'Active'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {goals.filter(g => g.type === type).length === 0 && (
                                                            <div className="p-3 border border-dashed border-border rounded-lg text-center">
                                                                <span className="text-[10px] text-muted-foreground">None found</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentMenu === 'REPORT_REROUTING' && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <button onClick={() => setCurrentMenu('HOME')} className="p-2 hover:bg-muted rounded-lg transition-all">
                                                <History size={16} className="text-muted-foreground" />
                                            </button>
                                            <h3 className="text-lg font-bold text-foreground">Review & Control</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                                            <MenuOption number="1" label="Launch Performance Review" onClick={() => setIsReviewing(true)} />
                                            <MenuOption number="2" label="Crisis Management Mode" onClick={() => setIsCrisisWizard(true)} />
                                            <MenuOption number="3" label="Deload Week Planning" onClick={() => setIsDeloadWizard(true)} />
                                            <MenuOption number="4" label="Life Pivot / System Upgrade" onClick={() => setIsLifePivotWizard(true)} />
                                            <button onClick={() => setCurrentMenu('HOME')} className="sm:col-span-2 p-4 bg-muted/30 border border-border rounded-lg text-muted-foreground text-xs font-medium hover:text-foreground transition-all">
                                                5. Return to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {currentMenu === 'SUMMARY' && (
                                    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-bold text-foreground">Plan Summary</h3>
                                            <button onClick={() => setCurrentMenu('MANAGE_PLAN')} className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-all">
                                                Back <History size={12} />
                                            </button>
                                        </div>
                                        <div className="flex-1 bg-muted/20 border border-border rounded-lg p-6 overflow-y-auto custom-scrollbar">
                                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {config?.profileMasterPlan || ''}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeView === 'goals' && (
                            <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500 overflow-hidden">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-1 p-0.5 bg-muted/50 border border-border rounded-lg">
                                        {['All', 'Weekly', 'Monthly', 'Quarterly'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setGoalFilter(f)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all",
                                                    goalFilter === f ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={fetchGoals}
                                            disabled={goalsLoading}
                                            className="p-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                                        >
                                            <RefreshCw className={cn("w-3.5 h-3.5", goalsLoading && "animate-spin")} />
                                        </button>
                                        <a
                                            href={`https://notion.so/${GOALS_DB_ID.replace(/-/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 rounded-lg bg-foreground text-background text-[10px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-all"
                                        >
                                            Notion <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                                    {goalsLoading && goals.length === 0 ? (
                                        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                            <span className="text-xs">Loading goals...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                                            {filteredGoals.map(goal => (
                                                <div
                                                    key={goal.id}
                                                    onClick={() => setEditingGoal(goal)}
                                                    className={cn(
                                                        "group flex flex-col p-4 bg-muted/20 border border-border rounded-lg transition-all duration-200 hover:bg-muted/40 cursor-pointer",
                                                        goal.completed && "opacity-40"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[9px] font-medium",
                                                            goal.priority === 'High' ? "text-red-600 dark:text-red-400 bg-red-500/10" :
                                                                goal.priority === 'Medium' ? "text-amber-600 dark:text-amber-400 bg-amber-500/10" :
                                                                    "text-muted-foreground bg-muted"
                                                        )}>
                                                            {goal.priority}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleGoal(goal); }}
                                                            disabled={updatingGoalId === goal.id}
                                                            className={cn(
                                                                "w-6 h-6 rounded border flex items-center justify-center transition-all",
                                                                goal.completed ? "bg-foreground border-foreground text-background" : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                                                            )}
                                                        >
                                                            {updatingGoalId === goal.id ? (
                                                                <RefreshCw size={10} className="animate-spin" />
                                                            ) : (
                                                                <CheckSquare size={12} />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <h4 className={cn(
                                                        "text-sm font-medium text-foreground leading-tight mb-3",
                                                        goal.completed && "line-through"
                                                    )}>
                                                        {goal.title}
                                                    </h4>
                                                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
                                                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                            <Clock size={10} />
                                                            {goal.remainingDays || 'Open'}
                                                        </div>
                                                        <div className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-medium text-muted-foreground">
                                                            {goal.type.split(' ')[0]}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {!goalsLoading && filteredGoals.length === 0 && (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs">
                                            No goals in this range
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Overlays */}
                        {editingGoal && (
                            <GoalEditor
                                goal={editingGoal}
                                onClose={() => setEditingGoal(null)}
                                onSave={() => { setEditingGoal(null); fetchGoals(); }}
                                onDelete={() => { setEditingGoal(null); fetchGoals(); }}
                            />
                        )}
                        {isAddingGoal && <GoalCreator onClose={() => setIsAddingGoal(false)} onCreated={() => { setIsAddingGoal(false); fetchGoals(); }} />}
                        {isEditingPlan && <PlanEditor onClose={() => setIsEditingPlan(false)} />}
                        {isReviewing && <ReviewWizard onClose={() => setIsReviewing(false)} onSubmit={(data) => { setIsReviewing(false); handleSend(`Analyze this performance audit: ${JSON.stringify(data)}`); }} />}
                        {isRemovingGoals && <GoalRemover goals={goals} onClose={() => setIsRemovingGoals(false)} onDeleted={() => { setIsRemovingGoals(false); fetchGoals(); }} />}
                        {isManagingPriority && <PriorityManager goals={goals} onClose={() => setIsManagingPriority(false)} onUpdated={fetchGoals} />}
                        {isUpdatingStartDate && <StartDateEditor onClose={() => setIsUpdatingStartDate(false)} />}
                        {isEditingPlanAI && <PlanAIEditor onClose={() => setIsEditingPlanAI(false)} />}
                        {isCrisisWizard && <CrisisWizard goals={goals} onClose={() => setIsCrisisWizard(false)} onSubmit={(data) => { setIsCrisisWizard(false); handleSend(`CRISIS MODE INITIATED: ${JSON.stringify(data)}`); }} />}
                        {isDeloadWizard && <DeloadWizard onClose={() => setIsDeloadWizard(false)} onSubmit={(data) => { setIsDeloadWizard(false); handleSend(`DELOAD PLAN: ${JSON.stringify(data)}`); }} />}
                        {isLifePivotWizard && <LifePivotWizard onClose={() => setIsLifePivotWizard(false)} onSubmit={(data) => { setIsLifePivotWizard(false); handleSend(`LIFE PIVOT / SYSTEM UPGRADE: ${JSON.stringify(data)}`); }} />}

                        {activeView === 'chat' && (
                            <ChatView
                                messages={messages}
                                loading={loading}
                                query={query}
                                setQuery={setQuery}
                                handleSend={handleSend}
                            />
                        )}
                    </div>
        </div>
    )
}

function ChatView({ messages, loading, query, setQuery, handleSend }: {
    messages: { role: string; content: string }[];
    loading: boolean;
    query: string;
    setQuery: (v: string) => void;
    handleSend: (msg?: string) => void;
}) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const suggestions = [
        "What should I focus on this week?",
        "Review my current priorities",
        "Help me strategize my next quarter",
        "Analyze my progress and suggest adjustments",
    ]

    return (
        <div className="flex flex-col flex-1 border bg-background shadow-xs sm:rounded-md max-w-4xl mx-auto w-full overflow-hidden mb-6 h-full animate-in fade-in duration-500">
            <div className="flex flex-1 flex-col gap-2 px-4 pt-4 pb-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-6">
                            <div className="flex size-16 items-center justify-center rounded-full border-2 border-border mb-2">
                                <BrainCircuit className="size-8 text-muted-foreground" />
                            </div>
                            <div className="text-center space-y-2 max-w-sm">
                                <h3 className="text-xl font-semibold text-foreground">Your Personal Strategist</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ask me anything — I have full context of your goals, profiles, master plan, and Notion workspace.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full mt-4">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(s)}
                                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground bg-muted/40 hover:bg-muted border border-border/50 rounded-xl transition-all duration-200 group"
                                    >
                                        <span className="opacity-80 group-hover:opacity-100 transition-opacity">{s}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.length > 0 && (
                        <>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn(
                                    "flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    msg.role === 'user' ? "items-end" : "items-start"
                                )}>
                                    <div className={cn(
                                        "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted text-foreground rounded-tl-sm"
                                    )}>
                                        <div className={cn(
                                            "prose prose-sm max-w-none leading-relaxed",
                                            msg.role === 'user' ? "text-primary-foreground" : "dark:prose-invert"
                                        )}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-muted shadow-sm">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span>Synthesizing...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex w-full flex-none gap-2 mt-2"
                >
                    <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-card px-2 py-1 focus-within:ring-1 focus-within:ring-ring focus-within:outline-none">
                        <label className="flex-1">
                            <span className="sr-only">Chat Text Box</span>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask the Strategist anything..."
                                className="h-8 w-full bg-inherit text-sm focus-visible:outline-none placeholder:text-muted-foreground/60 px-2"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={!query.trim() || loading}
                            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors focus:outline-none hidden sm:inline-flex disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: React.ElementType, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all",
                active
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    )
}

function StatCard({ title, value, subValue, icon: Icon, color }: { title: string, value: string, subValue: string, icon: React.ElementType, color: string }) {
    return (
        <div className="bg-muted/30 border border-border p-4 rounded-lg hover:bg-muted/50 transition-all h-[120px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</span>
                <div className={cn("p-1.5 rounded-md bg-muted", color)}>
                    <Icon size={14} />
                </div>
            </div>
            <div>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{subValue}</div>
            </div>
        </div>
    )
}

function MenuButton({ number, label, description, onClick, icon: Icon }: { number: string, label: string, description: string, onClick: () => void, icon: any }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col text-left p-4 bg-muted/20 border border-border rounded-lg hover:bg-muted/40 transition-all group relative h-[154px]"
        >
            <div className="absolute top-4 right-4 text-lg font-bold text-muted-foreground/20 group-hover:text-muted-foreground/30 transition-colors uppercase tracking-tighter">0{number}</div>
            <div className="p-2 rounded-md bg-muted border border-border text-muted-foreground group-hover:text-foreground transition-all mb-3 w-fit">
                <Icon size={16} />
            </div>
            <div className="mt-auto">
                <div className="text-sm font-semibold text-foreground mb-0.5">{label}</div>
                <div className="text-[10px] text-muted-foreground leading-snug">{description}</div>
            </div>
        </button>
    )
}

function MenuOption({ number, label, onClick }: { number: string, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 p-4 bg-muted/20 border border-border rounded-lg hover:bg-muted/40 transition-all group text-left"
        >
            <div className="text-sm font-semibold text-muted-foreground/30 w-5">{number}</div>
            <div className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{label}</div>
        </button>
    )
}

function GoalEditor({ goal, onClose, onSave, onDelete }: { goal: Goal, onClose: () => void, onSave: () => void, onDelete: (id: string) => void }) {
    const [title, setTitle] = useState(goal.title)
    const [priority, setPriority] = useState(goal.priority)
    const [type, setType] = useState(goal.type)
    const [area, setArea] = useState(goal.area || 'Personal')
    const [quarter, setQuarter] = useState(goal.quarter || 'First Quarter')
    const [week, setWeek] = useState(goal.week || 'Week 1')
    const [year, setYear] = useState(goal.year || '2025')
    const [month, setMonth] = useState(goal.month || 'January')
    const [markdownContent, setMarkdownContent] = useState('')
    const [loadingContent, setLoadingContent] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const fetchContent = async () => {
            setLoadingContent(true)
            try {
                const response = await sidecarApi.getNotionPageContent(goal.id)
                // Convert blocks back to simple markdown for editing
                const text = response.blocks
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
        fetchContent()
    }, [goal.id])

    const handleSave = async () => {
        setSaving(true)
        try {
            const props: any = {
                Name: { title: [{ text: { content: title } }] },
                Priority: { select: { name: priority } },
                "Type of Goal": { select: { name: type } },
                "Area": { select: { name: area } },
                "Yearly Quarter": { select: { name: quarter } },
                "Week": { select: { name: week } },
                "Year": { select: { name: year } },
                "Month": { select: { name: month } }
            }
            // Sync properties - backend extracts 'properties' key from payload
            await sidecarApi.updateNotionPage(goal.id, { properties: props })
            // Sync content
            if (markdownContent.trim()) {
                await sidecarApi.updateNotionPageContent(goal.id, markdownContent)
            }

            onSave()
        } catch (err) {
            console.error('Failed to update goal:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Permanently remove this goal?')) return
        setDeleting(true)
        try {
            await sidecarApi.deleteNotionPage(goal.id)
            onDelete(goal.id)
        } catch (err) {
            console.error('Failed to delete goal:', err)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-6xl h-[85vh] bg-background border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-300 flex overflow-hidden">
                {/* Left: Properties Sidebar */}
                <div className="w-[360px] border-r border-border bg-muted/20 p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Target size={18} className="text-muted-foreground" />
                            <h3 className="text-lg font-bold text-foreground">Goal Details</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Goal title..."
                                    className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Priority</label>
                                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                        {['High', 'Medium', 'Low', 'None'].map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Scope</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                        {['Weekly Goal', 'Monthly Goal', 'Quarterly Goal', 'Yearly Goal', 'Lifetime Goal'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Area</label>
                                    <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                        {['Personal', 'Academic', 'Financial', 'Fitness', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Quarter</label>
                                    <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                        {['First Quarter', 'Second Quarter', 'Third Quarter', 'Fourth Quarter', 'Pre-Launch'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {type !== 'Lifetime Goal' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Year</label>
                                        <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full bg-background border border-border p-2.5 rounded-lg text-foreground text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                            {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                )}
                                {(type === 'Monthly Goal' || type === 'Weekly Goal') && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Month</label>
                                        <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full bg-background border border-border p-2.5 rounded-lg text-foreground text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                )}
                                {type === 'Weekly Goal' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Week</label>
                                        <select value={week} onChange={(e) => setWeek(e.target.value)} className="w-full bg-background border border-border p-2.5 rounded-lg text-foreground text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                                            {['W1', 'W2', 'W3', 'W4', 'Pre'].map(w => <option key={w} value={w}>{w}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button onClick={handleDelete} disabled={deleting} className="w-full py-2.5 text-muted-foreground hover:text-red-500 text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                            <Trash2 size={12} /> Remove Goal
                        </button>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="flex-1 py-2.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:text-foreground transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex-[2] py-2.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
                                {saving ? <RefreshCw className="animate-spin" size={12} /> : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Full Page Content */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <span className="text-xs font-medium text-muted-foreground">Notes & Details</span>
                        {loadingContent && <RefreshCw size={12} className="animate-spin text-muted-foreground" />}
                    </div>

                    <div className="flex-1 p-6 relative overflow-hidden">
                        {loadingContent ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <RefreshCw className="animate-spin text-muted-foreground" size={20} />
                                    <span className="text-xs text-muted-foreground">Loading...</span>
                                </div>
                            </div>
                        ) : null}
                        <textarea
                            value={markdownContent}
                            onChange={(e) => setMarkdownContent(e.target.value)}
                            placeholder="Add details, sub-goals, and context..."
                            className="w-full h-full bg-transparent text-foreground text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/30 scrollbar-hide"
                        />
                        <div className="absolute bottom-4 right-6 text-[10px] text-muted-foreground/40 pointer-events-none flex items-center gap-4">
                            <span>Markdown Support Active</span>
                            <span>{markdownContent.length} characters</span>
                        </div>
                    </div>

                    <div className="px-6 py-3 border-t border-border flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Changes sync on save</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function GoalCreator({ onClose, onCreated }: { onClose: () => void, onCreated: (g?: Goal) => void }) {
    const [title, setTitle] = useState('')
    const [priority, setPriority] = useState('Medium')
    const [type, setType] = useState('Weekly Goal')
    const [area, setArea] = useState('Personal')
    const [quarter, setQuarter] = useState('First Quarter')
    const [week, setWeek] = useState('Week 1')
    const [year, setYear] = useState('2025')
    const [month, setMonth] = useState('January')
    const [saving, setSaving] = useState(false)

    const handleCreate = async () => {
        if (!title.trim()) return
        setSaving(true)
        try {
            const properties: any = {
                Name: { title: [{ text: { content: title } }] },
                Priority: { select: { name: priority } },
                "Type of Goal": { select: { name: type } },
                "Area": { select: { name: area } },
                "Yearly Quarter": { select: { name: quarter } },
                "Week": { select: { name: week } },
                "Year": { select: { name: year } },
                "Month": { select: { name: month } }
            }
            await sidecarApi.createNotionPage(GOALS_DB_ID, properties)
            onCreated()
        } catch (err) {
            console.error('Failed to create goal:', err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-background border border-border rounded-xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Plus size={18} className="text-muted-foreground" />
                        <h3 className="text-lg font-bold text-foreground">New Strategic Goal</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Title</label>
                            <input
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Goal title..."
                                className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['High', 'Medium', 'Low', 'None'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Scope</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['Weekly Goal', 'Monthly Goal', 'Quarterly Goal', 'Yearly Goal', 'Lifetime Goal'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Focus Area</label>
                                <select
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['Personal', 'Academic', 'Financial', 'Fitness', 'Other'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Quarter</label>
                                <select
                                    value={quarter}
                                    onChange={(e) => setQuarter(e.target.value)}
                                    className="w-full bg-background border border-border p-3 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['First Quarter', 'Second Quarter', 'Third Quarter', 'Fourth Quarter', 'Pre-Launch'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Year</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-full bg-background border border-border p-2.5 rounded-lg text-foreground text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['2025', '2026', '2027'].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Month</label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="w-full bg-background border border-border p-2.5 rounded-lg text-foreground text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Week</label>
                                <select
                                    value={week}
                                    onChange={(e) => setWeek(e.target.value)}
                                    className="w-full bg-background border border-border p-2.5 rounded-lg text-foreground text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    {['W1', 'W2', 'W3', 'W4', 'Pre'].map(w => (
                                        <option key={w} value={w}>{w}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="flex-1 py-2.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:text-foreground transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="flex-[2] py-2.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                        >
                            {saving ? <RefreshCw className="animate-spin" size={14} /> : 'Create Goal'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PlanEditor({ onClose }: { onClose: () => void }) {
    const { config, saveConfig } = useConfig()
    const [planText, setPlanText] = useState(config?.profileMasterPlan || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            await saveConfig({ profileMasterPlan: planText })
            onClose()
        } catch (err) {
            console.error('Failed to save plan:', err)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl h-[80vh] bg-background border border-border rounded-xl p-8 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <ScrollText size={18} className="text-muted-foreground" />
                        <h3 className="text-lg font-bold text-foreground">Master Plan Configuration</h3>
                    </div>
                </div>

                <div className="flex-1 relative mb-6">
                    <textarea
                        value={planText}
                        onChange={(e) => setPlanText(e.target.value)}
                        className="w-full h-full bg-muted/20 border border-border p-6 rounded-lg text-foreground font-mono text-sm leading-relaxed outline-none focus:ring-1 focus:ring-primary/20 resize-none transition-all placeholder:text-muted-foreground/30"
                        placeholder="Define your ground truth here..."
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:text-foreground transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={14} /> : 'Save Master Plan'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function ReviewWizard({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => void }) {
    const [step, setStep] = useState(1)
    const [data, setData] = useState({
        completionRate: 50,
        friction: '',
        momentum: '',
        waste: ''
    })

    const steps = [
        { title: 'Quantitative Audit', description: 'Measure your execution %' },
        { title: 'Qualitative Analysis', description: 'Identify friction and wins' },
        { title: 'Strategic Review', description: 'Finalize assessment' }
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground">Performance Review</h3>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Step {step} of 3: {steps[step - 1].title}</p>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(s => (
                                <div key={s} className={cn("h-1 w-6 rounded-full transition-all", s <= step ? "bg-primary" : "bg-muted")} />
                            ))}
                        </div>
                    </div>

                    <div className="min-h-[280px] py-2">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <label className="block text-sm font-semibold text-foreground">Completion Rate: {data.completionRate}%</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={data.completionRate}
                                        onChange={(e) => setData({ ...data, completionRate: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                        <span>Recovery</span>
                                        <span>On Track</span>
                                        <span>Acceleration</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground leading-relaxed">
                                    "The Strategist uses this data to calibrate future recommendations and identify execution patterns."
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Friction & Hurdles</label>
                                    <textarea
                                        autoFocus
                                        value={data.friction}
                                        onChange={(e) => setData({ ...data, friction: e.target.value })}
                                        className="w-full h-24 bg-background border border-border p-4 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 resize-none transition-all placeholder:text-muted-foreground/30"
                                        placeholder="What blocked your execution?"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Wins & Momentum</label>
                                    <textarea
                                        value={data.momentum}
                                        onChange={(e) => setData({ ...data, momentum: e.target.value })}
                                        className="w-full h-24 bg-background border border-border p-4 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 resize-none transition-all placeholder:text-muted-foreground/30"
                                        placeholder="Where did you find leverage?"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Efficiency Leakage</label>
                                    <textarea
                                        autoFocus
                                        value={data.waste}
                                        onChange={(e) => setData({ ...data, waste: e.target.value })}
                                        className="w-full h-32 bg-background border border-border p-4 rounded-lg text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 resize-none transition-all placeholder:text-muted-foreground/30"
                                        placeholder="Quantify time or effort lost..."
                                    />
                                </div>
                                <div className="p-4 bg-muted/20 border border-border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Audit Summary</span>
                                        <span className="text-lg font-bold text-foreground">{data.completionRate}%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                                        Assessment complete. Proceed to finalize this strategic review.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:text-foreground transition-all">
                            Cancel
                        </button>
                        <div className="flex-1 flex gap-3">
                            {step > 1 && (
                                <button onClick={() => setStep(step - 1)} className="flex-1 py-2.5 bg-muted border border-border text-muted-foreground text-xs font-medium rounded-lg transition-all">
                                    Previous
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (step < 3) setStep(step + 1)
                                    else onSubmit(data)
                                }}
                                className="flex-[2] py-2.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-90 transition-all shadow-md"
                            >
                                {step < 3 ? 'Proceed' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PlanAIEditor({ onClose }: { onClose: () => void }) {
    const { config, saveConfig } = useConfig()
    const [messages, setMessages] = useState<Message[]>([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)

    const handleApply = async (content: string) => {
        try {
            await saveConfig({ ...config, profileMasterPlan: content })
            onClose()
        } catch (err) {
            console.error('Failed to apply plan changes:', err)
        }
    }

    const handleSend = async () => {
        if (!query.trim() || loading) return
        const userMsg: Message = { role: 'user', content: query }
        setMessages(prev => [...prev, userMsg])
        setQuery('')
        setLoading(true)

        try {
            const context = `CURRENT MASTER PLAN:\n${config?.profileMasterPlan}\n\nUSER REQUEST: ${query}\n\nTask: Propose changes to the Master Plan based on the request. Use the same structure.`
            const sliderFragment = slidersToPromptFragment(config?.strategistSliders || '')
            const fullSystemPrompt = [config?.strategistPrompt, sliderFragment].filter(Boolean).join('\n\n')
            const res = await sidecarApi.brainstorm(query, context, fullSystemPrompt || undefined)
            const aiMsg: Message = { role: 'model', content: res.response }
            setMessages(prev => [...prev, aiMsg])
        } catch (err) {
            console.error('AI Plan Edit failed:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-all">
                        <ArrowLeft size={18} className="text-muted-foreground" />
                    </button>
                    <h3 className="text-base font-bold text-foreground">AI Strategy Architect</h3>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <BrainCircuit size={40} className="text-primary" />
                        <div className="max-w-xs">
                            <p className="text-xs font-bold text-foreground uppercase tracking-widest">Architect Mode Active</p>
                            <p className="text-[10px] text-muted-foreground mt-2">Describe strategic shifts or goal adjustments to receive AI-driven propositions.</p>
                        </div>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={cn("max-w-[85%] p-5 rounded-xl relative group", msg.role === 'user' ? "ml-auto bg-muted text-foreground border border-border" : "mr-auto bg-primary/5 border border-primary/20 text-foreground")}>
                        <div className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">{msg.role === 'user' ? 'REQUEST' : 'PROPOSAL'}</div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                        {msg.role === 'model' && (
                            <button
                                onClick={() => handleApply(msg.content)}
                                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <CheckSquare size={12} />
                                Apply to Plan
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div className="p-6 border-t border-border bg-background">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Define your strategic shift..."
                        className="flex-1 bg-muted/20 border border-border p-4 rounded-xl text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                    />
                    <button onClick={handleSend} className="p-4 bg-foreground text-background rounded-xl hover:opacity-90 transition-all shadow-md">
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

function GoalRemover({ goals, onClose, onDeleted }: { goals: Goal[], onClose: () => void, onDeleted: () => void }) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [deleting, setDeleting] = useState(false)

    const toggle = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} goals permanently?`)) return
        setDeleting(true)
        try {
            for (const id of selectedIds) {
                await sidecarApi.deleteNotionPage(id)
            }
            onDeleted()
        } catch (err) {
            console.error('Batch delete failed:', err)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl p-8 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Trash2 size={18} className="text-red-500" />
                        <h3 className="text-lg font-bold text-foreground">Archive Operations</h3>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-hide">
                    <div className="grid gap-2">
                        {goals.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-sm">No goals to remove.</div>
                        ) : (
                            goals.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => toggle(g.id)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border transition-all text-left",
                                        selectedIds.includes(g.id)
                                            ? "bg-red-500/5 border-red-500/30 ring-1 ring-red-500/10"
                                            : "bg-muted/20 border-border hover:border-foreground/10"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-foreground">{g.title}</div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{g.type} • {g.area}</div>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                        selectedIds.includes(g.id) ? "bg-red-500 border-red-500 text-white" : "border-border"
                                    )}>
                                        {selectedIds.includes(g.id) && <CheckSquare size={12} />}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:text-foreground transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting || selectedIds.length === 0}
                        className="flex-[2] py-3 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 transition-all flex items-center justify-center gap-1.5"
                    >
                        {deleting ? <RefreshCw className="animate-spin" size={12} /> : `Remove ${selectedIds.length} Selected`}
                    </button>
                </div>
            </div>
        </div>
    )
}

function PriorityManager({ goals, onClose, onUpdated }: { goals: Goal[], onClose: () => void, onUpdated: () => void }) {
    const priorities = ['High', 'Medium', 'Low', 'None']
    const [movingId, setMovingId] = useState<string | null>(null)

    const move = async (id: string, newPriority: string) => {
        setMovingId(id)
        try {
            await sidecarApi.updateNotionPage(id, {
                properties: { Priority: { select: { name: newPriority } } }
            })
            onUpdated()
        } catch (err) {
            console.error('Priority shift failed:', err)
        } finally {
            setMovingId(null)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
            <div className="p-8 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-3 hover:bg-muted rounded-2xl transition-all">
                        <ArrowLeft size={24} className="text-muted-foreground hover:text-foreground" />
                    </button>
                    <div>
                        <h3 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">Strategic Gravity Control</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Recalibrate operational priorities</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto p-8 scrollbar-hide">
                <div className="flex gap-6 min-w-max h-full">
                    {priorities.map(p => (
                        <div key={p} className="w-80 flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full",
                                        p === 'High' ? "bg-red-500" :
                                            p === 'Medium' ? "bg-amber-500" :
                                                p === 'Low' ? "bg-emerald-500" : "bg-muted-foreground/30"
                                    )} />
                                    <span className="text-sm font-black text-foreground uppercase tracking-widest">{p} Priority</span>
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground/60">{goals.filter(g => g.priority === p).length}</span>
                            </div>

                            <div className="flex-1 bg-muted/30 border border-border rounded-[2rem] p-4 space-y-3 overflow-y-auto">
                                {goals.filter(g => g.priority === p).map(g => (
                                    <div key={g.id} className="p-5 bg-card border border-border rounded-2xl shadow-xl group hover:border-primary/20 transition-all">
                                        <div className="text-xs font-black text-foreground uppercase tracking-tight mb-4">{g.title}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {priorities.filter(px => px !== p).map(px => (
                                                <button
                                                    key={px}
                                                    disabled={movingId === g.id}
                                                    onClick={() => move(g.id, px)}
                                                    className="px-3 py-1.5 bg-muted text-[8px] font-black text-muted-foreground uppercase rounded-lg hover:text-foreground hover:bg-accent transition-all"
                                                >
                                                    Move to {px}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StartDateEditor({ onClose }: { onClose: () => void }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [updating, setUpdating] = useState(false)

    const handleUpdate = async () => {
        setUpdating(true)
        // Mock update for start date
        await new Promise(r => setTimeout(r, 1000))
        setUpdating(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-card border border-border rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
                <div className="text-center space-y-6">
                    <div className="inline-flex p-4 bg-amber-500/10 text-amber-500 rounded-3xl mb-2">
                        <Calendar size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Temporal Alignment</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Adjust Campaign Start Date</p>
                    </div>

                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-background border border-border p-6 rounded-3xl text-foreground font-bold outline-none focus:border-amber-500/30 text-center text-xl transition-all"
                    />

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 text-muted-foreground font-bold uppercase text-xs hover:text-foreground transition-colors">
                            Discard
                        </button>
                        <button onClick={handleUpdate} className="flex-[2] py-4 bg-foreground text-background font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all">
                            {updating ? 'Aligning...' : 'Sync Timeline'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CrisisWizard({ goals, onClose, onSubmit }: { goals: Goal[], onClose: () => void, onSubmit: (data: any) => void }) {
    const [step, setStep] = useState(1)
    const [selectedGoals, setSelectedGoals] = useState<string[]>([])
    const [reason, setReason] = useState('')

    const activeGoals = goals.filter(g => !g.completed)

    const toggle = (id: string) => {
        setSelectedGoals(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-card border-2 border-red-500/20 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(239,68,68,0.1)] animate-in zoom-in-95">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-foreground italic tracking-tighter uppercase flex items-center gap-3">
                                <AlertTriangle className="text-red-500" /> CRISIS MANAGEMENT
                            </h3>
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Emergency Tactical Re-routing</p>
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <p className="text-sm font-bold text-muted-foreground leading-relaxed uppercase tracking-tight">Identify the goals that are currently under siege or in total stagnation:</p>
                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar focus:outline-none">
                                {activeGoals.map(g => (
                                    <div key={g.id}
                                        onClick={() => toggle(g.id)}
                                        className={cn("p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                                            selectedGoals.includes(g.id) ? "bg-red-500/10 border-red-500/50" : "bg-muted border-border hover:border-primary/20")}
                                    >
                                        <span className={cn("text-xs font-bold", selectedGoals.includes(g.id) ? "text-foreground" : "text-muted-foreground")}>{g.title}</span>
                                        {selectedGoals.includes(g.id) && <Check size={14} className="text-red-500" />}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                disabled={selectedGoals.length === 0}
                                className="w-full py-4 bg-red-600 text-white font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                Next Step
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">The Core Friction</label>
                                <textarea
                                    autoFocus
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="What happened? burnout? environment shift? resource failure?"
                                    className="w-full bg-muted border border-border p-6 rounded-3xl text-foreground font-bold outline-none focus:border-red-500/30 transition-all h-32"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 py-4 text-muted-foreground font-bold uppercase text-xs">Back</button>
                                <button
                                    onClick={() => onSubmit({ selectedGoals, reason })}
                                    className="flex-[2] py-4 bg-red-600 text-white font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                                >
                                    Confirm Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function DeloadWizard({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => void }) {
    const [fatigue, setFatigue] = useState(5)
    const [type, setType] = useState('Active Recovery')

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] p-12 animate-in zoom-in-95">
                <div className="space-y-8 text-center">
                    <div className="inline-flex p-4 bg-blue-500/10 text-blue-500 rounded-3xl">
                        <Battery size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-foreground italic tracking-tighter uppercase">Deload Sequence</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Planned Strategic Restoration</p>
                    </div>

                    <div className="space-y-6 text-left">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fatigue Level ({fatigue}/10)</label>
                            <input type="range" min="1" max="10" value={fatigue} onChange={(e) => setFatigue(parseInt(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Restoration Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Total Shutdown', 'Active Recovery', 'Cognitive Deload', 'Social Deload'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setType(m)}
                                        className={cn("p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all",
                                            type === m ? "bg-blue-500/10 border-blue-500/50 text-foreground" : "bg-background border-border text-muted-foreground hover:border-primary/20")}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 py-4 text-muted-foreground font-bold uppercase text-xs">Abort</button>
                        <button
                            onClick={() => onSubmit({ fatigue, type })}
                            className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                        >
                            Confirm Mobilization
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LifePivotWizard({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: any) => void }) {
    const [area, setArea] = useState('New Professional Direction')
    const [intensity, setIntensity] = useState('Substantial Shift')

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-card border border-border rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95">
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-foreground italic tracking-tighter uppercase leading-none">Life Pivot Sequence</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Fundamental System Upgrade</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Pivot Direction</label>
                            <textarea
                                autoFocus
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                className="w-full bg-background border border-border p-6 rounded-3xl text-foreground font-bold outline-none focus:border-purple-500/30 transition-all h-32"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Shift Intensity</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Subtle Tune', 'Substantial Shift', 'Complete Identity Rebuild'].map(i => (
                                    <button
                                        key={i}
                                        onClick={() => setIntensity(i)}
                                        className={cn("p-4 rounded-xl border text-[8px] font-black uppercase transition-all tracking-tighter",
                                            intensity === i ? "bg-purple-500/10 border-purple-500/50 text-foreground" : "bg-background border-border text-muted-foreground hover:bg-muted")}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 py-4 text-muted-foreground font-bold uppercase text-xs">Abandon</button>
                        <button
                            onClick={() => onSubmit({ area, intensity })}
                            className="flex-[2] py-4 bg-purple-600 text-white font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/20"
                        >
                            Initiate Life Pivot
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

