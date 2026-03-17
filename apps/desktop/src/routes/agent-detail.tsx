import { useParams, useNavigate } from 'react-router-dom'
import { agentsData } from './agents'
import { ArrowLeft, TerminalSquare, AlertCircle } from 'lucide-react'
import Debugger from './debugger'
import Strategist from './strategist'
import Oka from './oka'
import Coach from './coach'
import AgentConsole from '@/components/AgentConsole'

export default function AgentDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    // Explicitly casting because of the dynamic structure of agentsData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agent = agentsData.find((a: any) => a.id === id)
    
    if (!agent) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <h2 className="text-xl font-bold">Agent Not Found</h2>
                <button onClick={() => navigate('/agents')} className="text-sm font-semibold underline text-muted-foreground">Go Back</button>
            </div>
        )
    }

    // Route specific agent IDs to their fully functional counterparts
    if (agent.id === 'librarian' || agent.id === 'debugger') {
        return <Debugger />
    }
    
    if (agent.id === 'strategist') {
        return <Strategist />
    }
    
    if (agent.id === 'oka') {
        return <Oka />
    }

    if (agent.id === 'coach') {
        return <Coach />
    }

    // Use the generic AgentConsole for newly implemented agents
    const consoleAgents = ['financer', 'scout', 'scribe', 'architect', 'auditor']
    if (consoleAgents.includes(agent.id)) {
        return (
            <AgentConsole 
                agentId={agent.id}
                name={agent.name}
                role={agent.role}
                description={agent.description}
                icon={agent.icon}
                status={agent.status}
                suggestions={
                    agent.id === 'financer' ? ["Check my budget", "Review recent expenses", "Total wealth summary"] :
                    agent.id === 'scout' ? ["Research latest AI news", "Find papers on RAG", "Search for Life OS documentation"] :
                    agent.id === 'scribe' ? ["Format my recent thought", "Link these two notes", "Create a tag summary"] :
                    agent.id === 'architect' ? ["Show me my vault map", "Create new project template", "Design a fitness database"] :
                    agent.id === 'auditor' ? ["Run weekly performance audit", "Check goal completion rates", "Generate audit report"] :
                    undefined
                }
            />
        )
    }

    const Icon = agent.icon

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 p-4 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/agents')} className="p-2 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight leading-none">{agent.name}</h1>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{agent.role}</span>
                    </div>
                </div>
                <div className={`ml-auto px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${agent.status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {agent.status}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-card gap-6 max-w-3xl mx-auto w-full p-8 text-center">
                <div className="p-6 rounded-full bg-muted border border-border">
                    <TerminalSquare className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Backend Module In Development</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        {agent.name} is currently in <strong>{agent.status}</strong> mode. The Python logic for this specific agent is scheduled for the next development sprint.
                    </p>
                </div>
                <div className="p-4 bg-muted/50 border border-border rounded-xl text-xs font-mono text-muted-foreground w-full text-left">
                    <div className="text-foreground font-bold mb-2">Agent Context Directive:</div>
                    {agent.description}
                </div>
            </div>
        </div>
    )
}