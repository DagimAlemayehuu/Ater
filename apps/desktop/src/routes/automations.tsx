import { Zap, Archive, GraduationCap, Sun, Layers, Camera, Link as LinkIcon, Flame, Tags, Moon, Play, Pause, Plus, Settings2, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

// eslint-disable-next-line react-refresh/only-export-components
export const automationsData = [
    { id: 'obsidian-sync', name: 'Obsidian Sync Watcher', status: 'active', lastRun: '2 mins ago', type: 'System', icon: Zap },
    { id: 'notion-cleanup', name: 'Notion Weekly Cleanup', status: 'active', lastRun: '1 hour ago', type: 'Notion', icon: Archive },
    { id: 'academic-fetcher', name: 'Academic Fetcher', status: 'idling', lastRun: 'Never', type: 'Academic', icon: GraduationCap },
    { id: 'daily-briefing', name: 'Daily Briefing Generator', status: 'active', lastRun: '6:00 AM', type: 'Report', icon: Sun },
    { id: 'flashcard-extractor', name: 'Flashcard Extractor', status: 'idling', lastRun: 'Yesterday', type: 'Learning', icon: Layers },
    { id: 'master-plan-snapshot', name: 'Master Plan Snapshot', status: 'active', lastRun: 'Sunday', type: 'Backup', icon: Camera },
    { id: 'orphan-linker', name: 'Orphan Note Linker', status: 'idling', lastRun: '3 days ago', type: 'Obsidian', icon: LinkIcon },
    { id: 'habit-streak', name: 'Habit Streak Calculator', status: 'active', lastRun: '10 mins ago', type: 'Notion', icon: Flame },
    { id: 'expense-categorizer', name: 'Expense Categorizer', status: 'idling', lastRun: 'Never', type: 'Finance', icon: Tags },
    { id: 'eod-shutdown', name: 'End of Day Shutdown', status: 'active', lastRun: '10:00 PM', type: 'System', icon: Moon },
]

export default function Automations() {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 p-4 lg:p-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Automations</h2>
                </div>
                <p className="text-muted-foreground">Manage background tasks and periodic sync workflows.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {automationsData.map((auto) => {
                    const Icon = auto.icon
                    const isActive = auto.status === 'active'
                    return (
                        <div key={auto.id} onClick={() => navigate(`/automations/${auto.id}`)} className="p-5 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 transition-all group cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 rounded-lg bg-muted border border-border text-muted-foreground group-hover:text-primary transition-colors">
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border",
                                    isActive ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" : "bg-muted text-muted-foreground border-transparent"
                                )}>
                                    {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
                                    {auto.status}
                                </div>
                            </div>
                            <div className="space-y-1 mb-6">
                                <h3 className="font-bold text-foreground">{auto.name}</h3>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <span>{auto.type}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><History className="w-3 h-3" /> {auto.lastRun}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                                <button onClick={(e) => { e.stopPropagation(); }} className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-all">
                                    {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    {isActive ? 'Pause' : 'Start'}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/automations/${auto.id}`) }} className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all">
                                    <Settings2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )
                })}

                <button className="p-5 border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all group">
                    <div className="p-3 rounded-full bg-muted border border-border group-hover:bg-primary/10 group-hover:border-primary/50 transition-all">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold">New Automation</span>
                </button>
            </div>
        </div>
    )
}