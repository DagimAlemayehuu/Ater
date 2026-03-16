import { useParams, useNavigate } from 'react-router-dom'
import { automationsData } from './automations'
import { ArrowLeft, Play, Pause, Settings2, History, AlertCircle, Terminal, Clock, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AutomationDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    const auto = automationsData.find((a: any) => a.id === id)
    
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
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all">
                        {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isActive ? 'Pause Automation' : 'Start Automation'}
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
                    <div className="text-muted-foreground opacity-50 mb-2"># Establishing connection to orchestration layer...</div>
                    <div className="text-muted-foreground opacity-50 mb-2"># Fetching telemetry data for {auto.id}...</div>
                    {isActive ? (
                        <>
                            <div className="text-emerald-500/80 mb-1">[SYSTEM] Watcher process hooked successfully.</div>
                            <div className="text-emerald-500/80 mb-1">[SYSTEM] Listening for events in background...</div>
                            {auto.id === 'obsidian-sync' && (
                                <div className="text-foreground/80 mt-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Polling local vault directory...
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-amber-500/80 mt-4">[SYSTEM] Automation is currently idling. No recent activity detected.</div>
                    )}
                </div>
            </div>
        </div>
    )
}