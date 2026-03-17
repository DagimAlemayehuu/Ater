import { useParams, useNavigate } from 'react-router-dom'
import { automationsData } from './automations'
import { ArrowLeft, Play, Settings2, History, AlertCircle, Terminal, Clock, Activity, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AutomationDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [running, setRunning] = useState(false)
    const [briefing, setBriefing] = useState<string | null>(null)
    const [logs, setLogs] = useState<string[]>(['# Establishing connection to orchestration layer...', `# Fetching telemetry data for ${id}...`])
    
    const auto = automationsData.find((a: Record<string, unknown>) => a.id === id)
    
    if (!auto) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <h2 className="text-xl font-bold">Automation Not Found</h2>
                <button onClick={() => navigate('/automations')} className="text-sm font-semibold underline text-muted-foreground">Go Back</button>
            </div>
        )
    }

    const Icon = auto.icon
    const isActive = auto.status === 'active'

    const handleRun = async () => {
        if (running) return
        setRunning(true)
        setLogs(prev => [...prev, `[USER] Manual trigger initiated.`, `[SYSTEM] Spawning worker process...`])
        
        try {
            if (id === 'daily-briefing') {
                const res = await sidecarApi.runDailyBriefing()
                setBriefing(res.briefing)
                setLogs(prev => [...prev, `[SYSTEM] Briefing generated successfully.`, `[WORKER] Process exited with code 0.`])
            } else if (id === 'notion-cleanup') {
                const res = await sidecarApi.runCleanup()
                setLogs(prev => [...prev, `[SYSTEM] Notion Cleanup complete.`, `[WORKER] Archived ${res.archived_count} items.`, `[WORKER] Process exited with code 0.`])
            } else if (id === 'expense-categorizer') {
                const res = await sidecarApi.runCategorizer()
                setLogs(prev => [...prev, `[SYSTEM] Expense Categorization complete.`, `[WORKER] Categorized ${res.categorized_count} expenses.`, `[WORKER] Process exited with code 0.`])
            } else if (id === 'habit-streak') {
                const res = await sidecarApi.runHabits()
                setLogs(prev => [...prev, `[SYSTEM] Habit Streak calculation complete.`, `[WORKER] Validated ${res.habits_validated} habits.`, `[WORKER] Process exited with code 0.`])
            } else if (id === 'academic-fetcher') {
                await sidecarApi.runAcademics()
                setLogs(prev => [...prev, `[SYSTEM] Academic data fetch complete.`, `[WORKER] Process exited with code 0.`])
            } else {
                // Mock for others
                await new Promise(r => setTimeout(r, 1500))
                setLogs(prev => [...prev, `[SYSTEM] Automation logic for ${id} is still in development.`, `[WORKER] Process exited with code 0.`])
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setLogs(prev => [...prev, `[ERROR] ${error.message}`])
        } finally {
            setRunning(false)
        }
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 p-4 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/automations')} className="p-2 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight leading-none">{auto.name}</h1>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{auto.type}</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <button 
                        onClick={handleRun}
                        disabled={running}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {id === 'daily-briefing' ? 'Generate Briefing' : 'Run Once'}
                    </button>
                    <button className="p-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-all">
                        <Settings2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="p-5 bg-card border border-border rounded-xl flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</div>
                        <div className={cn("text-sm font-semibold capitalize", isActive ? "text-emerald-500" : "text-amber-500")}>
                            {auto.status}
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-xl flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-500/10 text-purple-500">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Last Run</div>
                        <div className="text-sm font-semibold text-foreground">
                            {auto.lastRun}
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-card border border-border rounded-xl flex items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Schedule</div>
                        <div className="text-sm font-semibold text-foreground">
                            {isActive ? 'Cron Job Active' : 'Manual Trigger Only'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <Terminal className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Execution Logs</span>
                </div>
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar bg-black/5 dark:bg-black/20">
                    {logs.map((log, i) => (
                        <div key={i} className={cn("mb-1", 
                            log.startsWith('#') ? "text-muted-foreground opacity-50" : 
                            log.startsWith('[SYSTEM]') ? "text-emerald-500/80" : 
                            log.startsWith('[ERROR]') ? "text-destructive" : 
                            "text-foreground/80")}>
                            {log}
                        </div>
                    ))}

                    {briefing && (
                        <div className="mt-6 p-6 font-sans text-sm bg-background border border-border rounded-xl animate-in zoom-in duration-300">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Today's Intelligence Briefing
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {briefing}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {isActive && logs.length === 2 && (
                        <>
                            <div className="text-emerald-500/80 mb-1">[SYSTEM] Watcher process hooked successfully.</div>
                            <div className="text-emerald-500/80 mb-1">[SYSTEM] Listening for events in background...</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}