import { Bot, Target, BrainCircuit, Sparkles, MessageSquare, ShieldCheck, Activity, FileCheck2, Wallet, Dumbbell, PenTool, Globe, LayoutTemplate } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// eslint-disable-next-line react-refresh/only-export-components
export const agentsData = [
    { 
        id: 'strategist', 
        name: 'The Strategist', 
        role: 'Life Planner', 
        status: 'online', 
        description: 'Maintains your Master Plan and aligns daily tasks with long-term goals.',
        icon: Target
    },
    { 
        id: 'oka', 
        name: 'OKA Engine', 
        role: 'Academic Assistant', 
        status: 'online', 
        description: 'Specializes in course planning, note generation, and academic synthesis.',
        icon: BrainCircuit
    },
    { 
        id: 'librarian', 
        name: 'Librarian', 
        role: 'Knowledge RAG', 
        status: 'online', 
        description: 'Semantic search and retrieval across your Obsidian vault and Notion databases.',
        icon: Sparkles
    },
    { 
        id: 'debugger', 
        name: 'The Debugger', 
        role: 'Root-Cause Analyst', 
        status: 'online', 
        description: 'Logic-driven agent for breaking down complex problems using diagnostic frameworks.',
        icon: Activity
    },
    { 
        id: 'auditor', 
        name: 'The Auditor', 
        role: 'Performance Reviewer', 
        status: 'standby', 
        description: 'Analyzes weekly goal completion rates to generate a Performance Audit report.',
        icon: FileCheck2
    },
    { 
        id: 'financer', 
        name: 'The Financer', 
        role: 'Wealth Manager', 
        status: 'standby', 
        description: 'Reads your financial profile and expense trackers to monitor budgets.',
        icon: Wallet
    },
    { 
        id: 'coach', 
        name: 'The Coach', 
        role: 'Health & Fitness', 
        status: 'standby', 
        description: 'Tracks workout logs, calculates progressive overload, and plans deload weeks.',
        icon: Dumbbell
    },
    { 
        id: 'scribe', 
        name: 'The Scribe', 
        role: 'Journaling & Formatting', 
        status: 'standby', 
        description: 'Formats rough brain-dumps into perfectly tagged, cross-linked Obsidian notes.',
        icon: PenTool
    },
    { 
        id: 'scout', 
        name: 'The Scout', 
        role: 'Web Researcher', 
        status: 'standby', 
        description: 'Fetches web documentation and research papers, injecting summaries into your vault.',
        icon: Globe
    },
    { 
        id: 'architect', 
        name: 'The Architect', 
        role: 'System Builder', 
        status: 'standby', 
        description: 'Designs and deploys new Notion database schemas or complex Obsidian templates.',
        icon: LayoutTemplate
    }
]

export default function Agents() {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500 p-4 lg:p-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">AI Agents</h2>
                </div>
                <p className="text-muted-foreground">Orchestrate and monitor your specialized AI workers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {agentsData.map((agent) => {
                    const Icon = agent.icon
                    const isOnline = agent.status === 'online'
                    return (
                        <div key={agent.id} className="p-6 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 transition-all group flex flex-col h-full">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-muted border border-border group-hover:bg-primary/5 transition-colors">
                                        <Icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground">{agent.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="px-2 py-0.5 rounded-full bg-muted border font-medium">{agent.role}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${isOnline ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' : 'text-amber-500 bg-amber-500/5 border-amber-500/10'}`}>
                                    {isOnline && <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
                                    {agent.status}
                                </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                                {agent.description}
                            </p>

                            <div className="flex items-center gap-2 pt-6 border-t border-border/50">
                                <button onClick={() => navigate(`/agents/${agent.id}`)} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all">
                                    <MessageSquare className="w-4 h-4" />
                                    Open Console
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-muted border border-border text-xs font-bold hover:bg-muted/80 text-foreground transition-all">
                                    <ShieldCheck className="w-4 h-4" />
                                    Permissions
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}