import { useState, useMemo, useEffect } from 'react'
import {
    Send,
    BrainCircuit,
    Sparkles,
    ScrollText,
    History,
    Target,
    LayoutDashboard,
    MessageSquare,
    RefreshCw,
    ClipboardCheck,
    CheckSquare,
    Clock,
    ExternalLink,
    Check,
    Zap,
    X,
    Trash2,
    Calendar,
    ArrowLeft,
    AlertTriangle,
    Battery,
    Plus
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { useConfig } from '@/lib/ConfigContext'
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
                profile: config?.profilePersonal,
                masterPlanStatus: hasMasterPlan ? "Active" : "Missing",
            })

            const res = await sidecarApi.brainstorm(text, context, config?.strategistPrompt)
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
            await sidecarApi.updateNotionPage(goal.id, { Completed: { checkbox: !goal.completed } })
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
            <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] gap-10 animate-in fade-in duration-700">
                <div className="relative">
                    <div className="absolute -inset-8 bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 shadow-2xl relative">
                        <Sparkles size={64} className="text-purple-400" />
                    </div>
                </div>
                <div className="text-center max-w-lg space-y-4">
                    <h2 className="text-4xl font-black italic tracking-tightest text-white leading-none">STRATEGIC VACUUM</h2>
                    <p className="text-zinc-500 font-medium leading-relaxed">
                        The Strategist cannot operate without "Ground Truth." You must define your Master Strategic Plan to enable tactical orchestration.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <button
                        onClick={startOnboarding}
                        className="flex-1 px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                    >
                        Initiate Sequence
                    </button>
                    <Link
                        to="/profiles"
                        className="flex-1 px-8 py-4 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:text-white transition-all text-center"
                    >
                        Configure Plan
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6 transition-all duration-300">
            {/* Header & Nav */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Strategic Orchestrator Active</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter text-zinc-100 uppercase">The Strategist</h2>
                </div>

                <nav className="flex items-center bg-zinc-900/50 border border-zinc-800 p-1 rounded-2xl backdrop-blur-xl">
                    <NavButton active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setCurrentMenu('HOME'); }} icon={LayoutDashboard} label="Dashboard" />
                    <NavButton active={activeView === 'goals'} onClick={() => { setActiveView('goals'); fetchGoals(); }} icon={Target} label="Goals" />
                    <NavButton active={activeView === 'chat'} onClick={() => setActiveView('chat')} icon={MessageSquare} label="Advisory" />
                </nav>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                {activeView === 'dashboard' && (
                    <div className="h-full overflow-y-auto pr-2 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentMenu === 'HOME' && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Status Intelligence</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <StatCard
                                            title="Master Plan Status"
                                            value={hasMasterPlan ? "Active" : "Not Created"}
                                            subValue={hasMasterPlan ? "Precision Execution" : "Strategic Vacuum"}
                                            icon={ScrollText}
                                            color="text-purple-400"
                                        />
                                        <StatCard
                                            title="Active Quarter"
                                            value="Q1"
                                            subValue="The Mobilization"
                                            icon={Target}
                                            color="text-amber-400"
                                        />
                                        <StatCard
                                            title="Active Goals"
                                            value={goalsLoading ? "..." : String(goals.filter(g => !g.completed).length)}
                                            subValue={goalsLoading ? "Scanning Network" : "Tactical Deployments"}
                                            icon={Target}
                                            color="text-emerald-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em]">Weekly Focal Points</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {goals.filter(g => !g.completed && g.type === 'Weekly Goal').slice(0, 4).map(g => (
                                            <div key={g.id} className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all cursor-pointer" onClick={() => setEditingGoal(g)}>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{g.area || 'Objective'}</span>
                                                    <span className="text-sm font-bold text-white leading-none">{g.title}</span>
                                                </div>
                                                <div className={cn("px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter",
                                                    g.priority === 'High' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                        g.priority === 'Medium' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                                            "bg-zinc-800 text-zinc-500 border border-zinc-700/50"
                                                )}>
                                                    {g.priority}
                                                </div>
                                            </div>
                                        ))}
                                        {goals.filter(g => !g.completed && g.type === 'Weekly Goal').length === 0 && (
                                            <div className="md:col-span-2 p-8 border border-dashed border-zinc-800 rounded-3xl text-center">
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">No goals defined for this cycle</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Command Center</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            label="Perform Review & Re-routing"
                                            description="Weekly, Monthly & Quarterly calibration"
                                            onClick={() => setCurrentMenu('REPORT_REROUTING')}
                                            icon={ClipboardCheck}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentMenu === 'MANAGE_PLAN' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-4 mb-2">
                                    <button onClick={() => setCurrentMenu('HOME')} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
                                        <History size={18} className="text-zinc-500" />
                                    </button>
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Manage Master Plan</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <MenuOption number="1" label="View Active Plan Summary" onClick={() => setCurrentMenu('SUMMARY')} />
                                    <MenuOption number="2" label="Add a New Goal" onClick={() => setIsAddingGoal(true)} />
                                    <MenuOption number="3" label="Remove Selected Goals" onClick={() => setIsRemovingGoals(true)} />
                                    <MenuOption number="4" label="Refine Details of a Goal" onClick={() => { setActiveView('goals'); fetchGoals(); }} />
                                    <MenuOption number="5" label="Adjust Priority Matrix" onClick={() => setIsManagingPriority(true)} />
                                    <MenuOption number="6" label="Edit Master Plan (AI)" onClick={() => setIsEditingPlanAI(true)} />
                                    <MenuOption number="7" label="Update Start Date" onClick={() => setIsUpdatingStartDate(true)} />
                                    <button onClick={() => setCurrentMenu('HOME')} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">
                                        8. Return to Dashboard
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentMenu === 'VIEW_BREAKDOWN' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setCurrentMenu('HOME')} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
                                            <History size={18} className="text-zinc-500" />
                                        </button>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Plan Breakdown</h3>
                                    </div>
                                    <button onClick={() => { setActiveView('goals'); setGoalFilter('All'); fetchGoals(); }} className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] hover:text-emerald-400 transition-all">
                                        View All Goals →
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['Yearly Goal', 'Quarterly Goal', 'Monthly Goal', 'Weekly Goal'].map(type => (
                                        <div key={type} className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-4 bg-purple-500 rounded-full" />
                                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{type}s</h4>
                                            </div>
                                            <div className="space-y-2">
                                                {goals.filter(g => g.type === type).slice(0, 3).map(g => (
                                                    <div key={g.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all cursor-pointer" onClick={() => setEditingGoal(g)}>
                                                        <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{g.title}</span>
                                                        <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded border uppercase",
                                                            g.completed ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-zinc-700 text-zinc-500")}>
                                                            {g.completed ? 'DONE' : 'ACTIVE'}
                                                        </span>
                                                    </div>
                                                ))}
                                                {goals.filter(g => g.type === type).length === 0 && (
                                                    <div className="p-4 border border-dashed border-zinc-800 rounded-2xl text-center">
                                                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">No mapping found</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentMenu === 'REPORT_REROUTING' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-4 mb-2">
                                    <button onClick={() => setCurrentMenu('HOME')} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
                                        <History size={18} className="text-zinc-500" />
                                    </button>
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Review & Control</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                                    <MenuOption number="1" label="Launch Performance Review" onClick={() => setIsReviewing(true)} />
                                    <MenuOption number="2" label="Crisis Management Mode" onClick={() => setIsCrisisWizard(true)} />
                                    <MenuOption number="3" label="Deload Week Planning" onClick={() => setIsDeloadWizard(true)} />
                                    <MenuOption number="4" label="Life Pivot / System Upgrade" onClick={() => setIsLifePivotWizard(true)} />
                                    <button onClick={() => setCurrentMenu('HOME')} className="sm:col-span-2 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">
                                        5. Return to Dashboard
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentMenu === 'SUMMARY' && (
                            <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold text-zinc-100 italic">ACTIVE PLAN SUMMARY</h3>
                                    <button onClick={() => setCurrentMenu('MANAGE_PLAN')} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-2 transition-all">
                                        BACK TO OPTIONS <History size={14} />
                                    </button>
                                </div>
                                <div className="flex-1 bg-[#09090b] border border-zinc-800 rounded-3xl p-8 overflow-y-auto custom-scrollbar shadow-2xl relative">
                                    <div className="prose prose-invert prose-purple max-w-none prose-p:leading-relaxed prose-headings:italic prose-headings:tracking-tighter">
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
                    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 p-1 bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-md">
                                {['All', 'Weekly', 'Monthly', 'Quarterly'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setGoalFilter(f)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            goalFilter === f ? "bg-zinc-100 text-zinc-900 shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={fetchGoals}
                                    disabled={goalsLoading}
                                    className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={cn("w-4 h-4", goalsLoading && "animate-spin")} />
                                </button>
                                <a
                                    href={`https://notion.so/${GOALS_DB_ID.replace(/-/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 py-3 rounded-2xl bg-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                                >
                                    NOTION <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                            {goalsLoading && goals.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-black italic">
                                    <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                                    Synchronizing Goals...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                    {filteredGoals.map(goal => (
                                        <div
                                            key={goal.id}
                                            onClick={() => setEditingGoal(goal)}
                                            className={cn(
                                                "group flex flex-col p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl transition-all duration-300 hover:border-zinc-500/30 hover:bg-zinc-900/80 cursor-pointer",
                                                goal.completed && "opacity-40 grayscale"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest",
                                                    goal.priority === 'High' ? "text-rose-400 border-rose-500/20 bg-rose-500/10" :
                                                        goal.priority === 'Medium' ? "text-amber-400 border-amber-500/20 bg-amber-500/10" :
                                                            "text-zinc-500 border-zinc-500/20 bg-zinc-500/10"
                                                )}>
                                                    {goal.priority}
                                                </span>
                                                <button
                                                    onClick={() => toggleGoal(goal)}
                                                    disabled={updatingGoalId === goal.id}
                                                    className={cn(
                                                        "w-7 h-7 rounded-lg border flex items-center justify-center transition-all",
                                                        goal.completed ? "bg-white border-white text-black" : "bg-zinc-950 border-zinc-800 text-zinc-700 hover:border-zinc-500"
                                                    )}
                                                >
                                                    {updatingGoalId === goal.id ? (
                                                        <RefreshCw size={12} className="animate-spin" />
                                                    ) : (
                                                        <CheckSquare size={14} />
                                                    )}
                                                </button>
                                            </div>
                                            <h4 className={cn(
                                                "text-sm font-bold text-zinc-100 leading-tight mb-4 group-hover:text-white transition-colors",
                                                goal.completed && "line-through"
                                            )}>
                                                {goal.title}
                                            </h4>
                                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-zinc-800/50">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                                    <Clock size={10} />
                                                    {goal.remainingDays || 'TACTICAL'}
                                                </div>
                                                <div className="px-2 py-0.5 rounded-md bg-zinc-800 text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                                                    {goal.type.split(' ')[0]}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!goalsLoading && filteredGoals.length === 0 && (
                                <div className="h-64 flex flex-col items-center justify-center text-zinc-700 font-black italic uppercase tracking-widest text-xs">
                                    No tactical goals in range
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
                    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
                        <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500/30 border-2 border-dashed border-zinc-800 rounded-3xl gap-3">
                                    <BrainCircuit className="w-12 h-12" />
                                    <p className="text-sm">Initiate intelligence sequence for tactical advice.</p>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn(
                                    "flex flex-col gap-2 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    msg.role === 'user' ? "ml-auto" : "mr-auto"
                                )}>
                                    <div className={cn(
                                        "p-6 rounded-[2rem] text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-zinc-100 text-zinc-900 font-bold rounded-tr-sm shadow-xl shadow-white/5"
                                            : "bg-zinc-900/80 border border-zinc-800 text-zinc-300 rounded-tl-sm backdrop-blur-md shadow-2xl"
                                    )}>
                                        <div className="prose prose-invert prose-purple max-w-none prose-p:leading-relaxed prose-headings:italic prose-headings:tracking-tighter prose-strong:text-zinc-100 prose-ul:list-disc prose-li:my-1">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-4 italic">
                                        {msg.role === 'user' ? 'OPERATOR' : 'STRATEGIST'}
                                    </span>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex items-center gap-3 text-zinc-500 animate-pulse pl-4">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm font-bold tracking-widest uppercase italic">Synthesizing...</span>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="relative group p-1 bg-zinc-900 border border-zinc-800 rounded-[2rem] focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/50 transition-all shadow-2xl">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Consult the strategist..."
                                className="w-full bg-transparent border-none rounded-3xl pl-6 pr-14 py-4 text-zinc-100 outline-none placeholder:text-zinc-600"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={loading || !query.trim()}
                                className="absolute right-2 top-2 h-12 w-12 flex items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: React.ElementType, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                active
                    ? "bg-zinc-100 text-zinc-900 shadow-xl"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
        >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    )
}

function StatCard({ title, value, subValue, icon: Icon, color }: { title: string, value: string, subValue: string, icon: React.ElementType, color: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-3xl group hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{title}</span>
                <div className={cn("p-2 rounded-xl bg-zinc-800/50", color)}>
                    <Icon size={18} />
                </div>
            </div>
            <div className="text-3xl font-black text-white">{value}</div>
            <div className="text-xs font-bold text-zinc-600 mt-1 uppercase tracking-tighter">{subValue}</div>
        </div>
    )
}

function MenuButton({ number, label, description, onClick, icon: Icon }: { number: string, label: string, description: string, onClick: () => void, icon: any }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col text-left p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-zinc-500/30 hover:bg-zinc-800/30 transition-all group relative"
        >
            <div className="absolute top-6 right-6 text-2xl font-black text-zinc-800 italic group-hover:text-zinc-700 transition-colors">{number}</div>
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-400/30 transition-all mb-4 w-fit">
                <Icon size={20} />
            </div>
            <div className="text-sm font-black text-white uppercase tracking-tighter mb-1 leading-none">{label}</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{description}</div>
        </button>
    )
}

function MenuOption({ number, label, onClick }: { number: string, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-6 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-zinc-500/30 hover:bg-zinc-800/30 transition-all group text-left"
        >
            <div className="text-2xl font-black text-zinc-800 italic group-hover:text-zinc-700 transition-colors w-6">{number}</div>
            <div className="text-sm font-black text-zinc-200 uppercase tracking-widest group-hover:text-white transition-colors">{label}</div>
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
                    .map((block: any) => {
                        if (block.type === 'paragraph') {
                            return block.paragraph.rich_text.map((t: any) => t.plain_text).join('')
                        }
                        return ''
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
            // Sync properties
            await sidecarApi.updateNotionPage(goal.id, { properties })
            // Sync content
            await sidecarApi.updateNotionPageContent(goal.id, markdownContent)

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
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-6xl h-[85vh] bg-zinc-950 border border-zinc-900 rounded-[3rem] shadow-4xl animate-in zoom-in-95 duration-300 flex overflow-hidden">
                {/* Left: Properties Sidebar */}
                <div className="w-[380px] border-r border-zinc-900 bg-zinc-900/30 p-10 flex flex-col justify-between">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                <Target size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Goal Intel</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Title</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter goal objective..."
                                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-emerald-500/50 transition-all font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer text-sm"
                                    >
                                        {['High', 'Medium', 'Low', 'None'].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Scope</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer text-xs"
                                    >
                                        {['Weekly Goal', 'Monthly Goal', 'Quarterly Goal', 'Yearly Goal', 'Lifetime Goal'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Focus Area</label>
                                    <select
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer text-sm"
                                    >
                                        {['Personal', 'Academic', 'Financial', 'Fitness', 'Other'].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Quarter</label>
                                    <select
                                        value={quarter}
                                        onChange={(e) => setQuarter(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer text-xs"
                                    >
                                        {['First Quarter', 'Second Quarter', 'Third Quarter', 'Fourth Quarter', 'Pre-Launch'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Year</label>
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-zinc-100 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer text-[10px]"
                                    >
                                        {['2025', '2026', '2027'].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Month</label>
                                    <select
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-zinc-100 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer text-[10px]"
                                    >
                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Week</label>
                                    <select
                                        value={week}
                                        onChange={(e) => setWeek(e.target.value)}
                                        className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-zinc-100 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer text-[10px]"
                                    >
                                        {['W1', 'W2', 'W3', 'W4', 'Pre'].map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full py-4 text-zinc-600 hover:text-red-400 font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={14} /> Remove Operation
                        </button>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="flex-1 py-4 bg-zinc-900 text-zinc-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-white transition-all">
                                Close
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <RefreshCw className="animate-spin" size={14} /> : 'Sync Notion'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Full Page Content */}
                <div className="flex-1 flex flex-col bg-black/20">
                    <div className="flex items-center justify-between p-8 border-b border-zinc-900 bg-zinc-900/10">
                        <div className="flex items-center gap-2 text-zinc-500 uppercase font-black text-[10px] tracking-widest">
                            <span className="opacity-50">Operational Notes</span>
                            <span className="text-zinc-800">/</span>
                            <span className="text-emerald-500/50">Details</span>
                        </div>
                        {loadingContent && <RefreshCw size={14} className="animate-spin text-emerald-500/50" />}
                    </div>

                    <div className="flex-1 p-10 relative overflow-hidden group">
                        {loadingContent ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center gap-4">
                                    <RefreshCw className="animate-spin text-emerald-500" size={32} />
                                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Reading Workspace...</div>
                                </div>
                            </div>
                        ) : null}
                        <textarea
                            value={markdownContent}
                            onChange={(e) => setMarkdownContent(e.target.value)}
                            placeholder="Type details, sub-goals, and strategic context here. Every word counts."
                            className="w-full h-full bg-transparent text-zinc-200 text-lg font-medium leading-relaxed outline-none resize-none placeholder:text-zinc-800 placeholder:italic scrollbar-hide"
                        />

                        <div className="absolute bottom-6 right-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest pointer-events-none">
                            {markdownContent.length} chars
                        </div>
                    </div>

                    <div className="px-10 py-6 border-t border-zinc-900/50 bg-zinc-900/5 flex items-center justify-between">
                        <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest italic flex items-center gap-2">
                            Full synchronization active • Changes updated in real-time on sync request
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50" />
                        </div>
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-4xl animate-in zoom-in-95 duration-300">
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-white/5 text-white">
                            <Plus size={20} />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Initialize New Goal</h3>
                    </div>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Goal Objective</label>
                            <input
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g. Achieve 3.5+ CGPA"
                                className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-zinc-500/50 transition-all font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-zinc-500/50 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    {['High', 'Medium', 'Low', 'None'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Scope</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-zinc-500/50 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    {['Weekly Goal', 'Monthly Goal', 'Quarterly Goal', 'Yearly Goal', 'Lifetime Goal'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Focus Area</label>
                                <select
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-zinc-500/50 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    {['Personal', 'Academic', 'Financial', 'Fitness', 'Other'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quarter</label>
                                <select
                                    value={quarter}
                                    onChange={(e) => setQuarter(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-zinc-500/50 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    {['First Quarter', 'Second Quarter', 'Third Quarter', 'Fourth Quarter', 'Pre-Launch'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Year</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-zinc-500/50 transition-all font-bold appearance-none cursor-pointer text-xs"
                                >
                                    {['2025', '2026', '2027'].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Month</label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-zinc-500/50 transition-all font-bold appearance-none cursor-pointer text-xs"
                                >
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Week</label>
                                <select
                                    value={week}
                                    onChange={(e) => setWeek(e.target.value)}
                                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-zinc-100 outline-none focus:border-zinc-500/50 transition-all font-bold appearance-none cursor-pointer text-xs"
                                >
                                    {['W1', 'W2', 'W3', 'W4', 'Pre'].map(w => (
                                        <option key={w} value={w}>{w}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black uppercase text-xs rounded-2xl hover:text-white transition-all">
                            Discard
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="flex-[2] py-4 bg-white text-black font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                        >
                            {saving ? <RefreshCw className="animate-spin" size={16} /> : 'Establish Goal'}
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl h-[80vh] bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-3xl flex flex-col animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <ScrollText size={20} />
                        </div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Modify Master Plan</h3>
                    </div>
                </div>

                <div className="flex-1 relative mb-8">
                    <textarea
                        value={planText}
                        onChange={(e) => setPlanText(e.target.value)}
                        className="w-full h-full bg-zinc-950 border border-zinc-800 p-8 rounded-3xl text-zinc-300 font-mono text-sm leading-relaxed outline-none focus:border-amber-500/30 resize-none transition-all"
                        placeholder="Define your ground truth here..."
                    />
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="px-8 py-4 bg-zinc-800 text-zinc-400 font-black uppercase text-xs rounded-2xl hover:text-white transition-all">
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-4 bg-amber-600 text-white font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={16} /> : 'Save Ground Truth'}
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-3xl animate-in zoom-in-95 duration-300">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Performance Audit</h3>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Step {step} of 3: {steps[step - 1].title}</p>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(s => (
                                <div key={s} className={cn("h-1 w-6 rounded-full transition-all", s <= step ? "bg-emerald-500" : "bg-zinc-800")} />
                            ))}
                        </div>
                    </div>

                    <div className="min-h-[300px] py-4">
                        {step === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-zinc-300">What was your goal completion rate? ({data.completionRate}%)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={data.completionRate}
                                        onChange={(e) => setData({ ...data, completionRate: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                        <span>Failing</span>
                                        <span>On Track</span>
                                        <span>Overdrive</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs text-emerald-400 font-medium leading-relaxed italic">
                                    "The Strategist enforces a 70% threshold. Below this, we re-route. Above 90%, we intensify."
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Friction & Hurdles</label>
                                    <textarea
                                        autoFocus
                                        value={data.friction}
                                        onChange={(e) => setData({ ...data, friction: e.target.value })}
                                        className="w-full h-24 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-zinc-300 font-bold outline-none focus:border-emerald-500/30 resize-none transition-all"
                                        placeholder="What blocked your execution?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Wins & Momentum</label>
                                    <textarea
                                        value={data.momentum}
                                        onChange={(e) => setData({ ...data, momentum: e.target.value })}
                                        className="w-full h-24 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-zinc-300 font-bold outline-none focus:border-emerald-500/30 resize-none transition-all"
                                        placeholder="Where did you find significant leverage?"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Time Waste / Wander</label>
                                    <textarea
                                        autoFocus
                                        value={data.waste}
                                        onChange={(e) => setData({ ...data, waste: e.target.value })}
                                        className="w-full h-32 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-zinc-300 font-bold outline-none focus:border-emerald-500/30 resize-none transition-all"
                                        placeholder="Quantify the leakage..."
                                    />
                                </div>
                                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Audit Summary</span>
                                        <span className="text-xl font-black text-white italic">{data.completionRate}%</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                                        Your input will be processed to determine the shortest path to recovery or expansion.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-4 bg-zinc-800 text-zinc-400 font-black uppercase text-xs rounded-2xl hover:text-white transition-all">
                            Cancel
                        </button>
                        <div className="flex-1 flex gap-4">
                            {step > 1 && (
                                <button onClick={() => setStep(step - 1)} className="flex-1 py-4 bg-zinc-900 border border-zinc-800 text-zinc-300 font-black uppercase text-xs rounded-2xl transition-all">
                                    Previous
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (step < 3) setStep(step + 1)
                                    else onSubmit(data)
                                }}
                                className="flex-[2] py-4 bg-emerald-600 text-white font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                            >
                                {step < 3 ? 'Proceed' : 'Submit Audit'}
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
            const res = await sidecarApi.brainstorm(query, context, config?.strategistPrompt)
            const aiMsg: Message = { role: 'model', content: res.response }
            setMessages(prev => [...prev, aiMsg])
        } catch (err) {
            console.error('AI Plan Edit failed:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-all">
                        <ArrowLeft size={20} className="text-zinc-400" />
                    </button>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">AI Strategy Architect</h3>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <BrainCircuit size={48} className="text-purple-500" />
                        <div className="max-w-xs">
                            <p className="text-sm font-black text-white uppercase tracking-widest">Architect Mode Active</p>
                            <p className="text-xs text-zinc-400 mt-2 lowercase">Tell the AI what you want to change in your strategy. It will suggest precise updates.</p>
                        </div>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={cn("max-w-[80%] p-6 rounded-[2rem] relative group", msg.role === 'user' ? "ml-auto bg-zinc-900 text-white" : "mr-auto bg-purple-500/10 border border-purple-500/20 text-zinc-200")}>
                        <div className="text-[10px] font-black text-zinc-500 mb-2 uppercase tracking-widest">{msg.role === 'user' ? 'REQUEST' : 'PROPOSAL'}</div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</div>
                        {msg.role === 'model' && (
                            <button
                                onClick={() => handleApply(msg.content)}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <CheckSquare size={14} />
                                Apply to Master Plan
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div className="p-6 border-t border-zinc-900 bg-zinc-950/50 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Define your strategic shift..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-white outline-none focus:border-purple-500/30 transition-all font-bold"
                    />
                    <button onClick={handleSend} className="p-6 bg-purple-600 text-white rounded-3xl hover:scale-105 active:scale-95 transition-all">
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
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
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-10 shadow-3xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Operational Purge</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select goals for deactivation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar scrollbar-hide">
                    {goals.map(g => (
                        <button
                            key={g.id}
                            onClick={() => toggle(g.id)}
                            className={cn(
                                "w-full p-6 flex items-center gap-6 rounded-3xl border transition-all text-left group",
                                selectedIds.includes(g.id)
                                    ? "bg-red-500/5 border-red-500/30"
                                    : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                selectedIds.includes(g.id) ? "bg-red-500 border-red-500" : "border-zinc-700 group-hover:border-zinc-500"
                            )}>
                                {selectedIds.includes(g.id) && <Check size={14} className="text-white" />}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-black text-white uppercase tracking-tight">{g.title}</div>
                                <div className="flex gap-4 mt-1">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{g.type}</span>
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{g.priority} Priority</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-5 bg-zinc-900 text-zinc-400 font-black uppercase text-xs rounded-3xl hover:text-white transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={selectedIds.length === 0 || deleting}
                        className="flex-[2] py-5 bg-red-600 text-white font-black uppercase text-xs rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {deleting ? <RefreshCw className="animate-spin" size={16} /> : `Delete ${selectedIds.length} Selected Goals`}
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
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950">
            <div className="p-8 border-b border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-3 hover:bg-zinc-800 rounded-2xl transition-all">
                        <ArrowLeft size={24} className="text-zinc-500 hover:text-white" />
                    </button>
                    <div>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Strategic Gravity Control</h3>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Recalibrate operational priorities</p>
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
                                                p === 'Low' ? "bg-emerald-500" : "bg-zinc-700"
                                    )} />
                                    <span className="text-sm font-black text-white uppercase tracking-widest">{p} Priority</span>
                                </div>
                                <span className="text-[10px] font-black text-zinc-600">{goals.filter(g => g.priority === p).length}</span>
                            </div>

                            <div className="flex-1 bg-zinc-900/30 border border-zinc-900 rounded-[2rem] p-4 space-y-3 overflow-y-auto">
                                {goals.filter(g => g.priority === p).map(g => (
                                    <div key={g.id} className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl group hover:border-zinc-700 transition-all">
                                        <div className="text-xs font-black text-white uppercase tracking-tight mb-4">{g.title}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {priorities.filter(px => px !== p).map(px => (
                                                <button
                                                    key={px}
                                                    disabled={movingId === g.id}
                                                    onClick={() => move(g.id, px)}
                                                    className="px-3 py-1.5 bg-zinc-900 text-[8px] font-black text-zinc-500 uppercase rounded-lg hover:text-white hover:bg-zinc-800 transition-all"
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
            <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95">
                <div className="text-center space-y-6">
                    <div className="inline-flex p-4 bg-amber-500/10 text-amber-500 rounded-3xl mb-2">
                        <Calendar size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Temporal Alignment</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Adjust Campaign Start Date</p>
                    </div>

                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 p-6 rounded-3xl text-white font-bold outline-none focus:border-amber-500/30 text-center text-xl transition-all"
                    />

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 text-zinc-500 font-bold uppercase text-xs hover:text-white transition-colors">
                            Discard
                        </button>
                        <button onClick={handleUpdate} className="flex-[2] py-4 bg-white text-black font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all">
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
            <div className="relative w-full max-w-2xl bg-zinc-950 border-2 border-red-500/20 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(239,68,68,0.1)] animate-in zoom-in-95">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                                <AlertTriangle className="text-red-500" /> CRISIS MANAGEMENT
                            </h3>
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Emergency Tactical Re-routing</p>
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <p className="text-sm font-bold text-zinc-400 leading-relaxed uppercase tracking-tight">Identify the goals that are currently under siege or in total stagnation:</p>
                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar focus:outline-none">
                                {activeGoals.map(g => (
                                    <div key={g.id}
                                        onClick={() => toggle(g.id)}
                                        className={cn("p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between",
                                            selectedGoals.includes(g.id) ? "bg-red-500/10 border-red-500/50" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700")}
                                    >
                                        <span className={cn("text-xs font-bold", selectedGoals.includes(g.id) ? "text-white" : "text-zinc-400")}>{g.title}</span>
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
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">The Core Friction</label>
                                <textarea
                                    autoFocus
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="What happened? burnout? environment shift? resource failure?"
                                    className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-zinc-100 font-bold outline-none focus:border-red-500/30 transition-all h-32"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 py-4 text-zinc-500 font-bold uppercase text-xs">Back</button>
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
            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 animate-in zoom-in-95">
                <div className="space-y-8 text-center">
                    <div className="inline-flex p-4 bg-blue-500/10 text-blue-500 rounded-3xl">
                        <Battery size={32} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Deload Sequence</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Planned Strategic Restoration</p>
                    </div>

                    <div className="space-y-6 text-left">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fatigue Level ({fatigue}/10)</label>
                            <input type="range" min="1" max="10" value={fatigue} onChange={(e) => setFatigue(parseInt(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Restoration Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Total Shutdown', 'Active Recovery', 'Cognitive Deload', 'Social Deload'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setType(m)}
                                        className={cn("p-4 rounded-2xl border-2 text-[10px] font-black uppercase transition-all",
                                            type === m ? "bg-blue-500/10 border-blue-500/50 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700")}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 py-4 text-zinc-500 font-bold uppercase text-xs">Abort</button>
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
            <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 shadow-3xl animate-in zoom-in-95">
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Life Pivot Sequence</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Fundamental System Upgrade</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pivot Direction</label>
                            <textarea
                                autoFocus
                                value={area}
                                onChange={(e) => setArea(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 p-6 rounded-3xl text-white font-bold outline-none focus:border-purple-500/30 transition-all h-32"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Shift Intensity</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Subtle Tune', 'Substantial Shift', 'Complete Identity Rebuild'].map(i => (
                                    <button
                                        key={i}
                                        onClick={() => setIntensity(i)}
                                        className={cn("p-4 rounded-xl border text-[8px] font-black uppercase transition-all tracking-tighter",
                                            intensity === i ? "bg-purple-500/10 border-purple-500/50 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900")}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={onClose} className="flex-1 py-4 text-zinc-500 font-bold uppercase text-xs">Abandon</button>
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
