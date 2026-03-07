import { useEffect, useState } from 'react'
import { LayoutDashboard, FileText, Database, Package, Sparkles, Activity } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'

/**
 * Modern Dashboard Card
 */
const Card = ({ title, value, icon, sub, trend }: any) => (
    <div className="flex flex-col gap-4 p-6 rounded-3xl border bg-card shadow-sm hover:shadow-md transition-all animate-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-muted/50 text-primary">
                {icon}
            </div>
            {trend && (
                <div className="px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-500/10">
                    {trend}
                </div>
            )}
        </div>
        <div>
            <h3 className="text-muted-foreground text-sm font-medium tracking-tight uppercase leading-relaxed mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tighter tabular-nums">{value}</span>
                <span className="text-xs text-muted-foreground/60 font-medium ">{sub}</span>
            </div>
        </div>
    </div>
)

export default function Dashboard() {
    const [notionCount, setNotionCount] = useState<number | null>(null)
    const [obsidianCount, setObsidianCount] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [notion, obsidian] = await Promise.all([
                    sidecarApi.listNotionPages().catch(() => ({ pages: [] })),
                    sidecarApi.listObsidianFiles().catch(() => ({ files: [] }))
                ])
                setNotionCount(notion.pages.length)
                setObsidianCount(obsidian.files.length)
            } catch (err) {
                console.error('Failed to sync counts:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <div className="flex flex-col gap-8 transition-all duration-300">
            {/* Welcome Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                        System Overview
                    </h2>
                    <p className="text-muted-foreground/80 font-medium">
                        Synchronized with <span className="text-foreground">Obsidian</span> and <span className="text-foreground">Notion</span>.
                    </p>
                </div>
                <div className="flex items-center gap-2 p-1 pl-3 rounded-full border bg-muted/30">
                    <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mr-2">Core Heartbeat</span>
                    <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:scale-105 active:scale-95 transition-all">
                        FULL SYNC
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                    title="Notion Artifacts"
                    value={loading ? '...' : notionCount ?? '0'}
                    sub="Synchronized Pages"
                    icon={<Database className="w-6 h-6" />}
                    trend="+12%"
                />
                <Card
                    title="Obsidian Vault"
                    value={loading ? '...' : obsidianCount ?? '0'}
                    sub="Local Markdown Files"
                    icon={<FileText className="w-6 h-6" />}
                    trend="LIVE"
                />
                <Card
                    title="Neural Tokens"
                    value="14.2k"
                    sub="Gemini Usage (Estimated)"
                    icon={<Sparkles className="w-6 h-6" />}
                />
                <Card
                    title="Storage Cache"
                    value="48MB"
                    sub="Local Index Space"
                    icon={<Package className="w-6 h-6" />}
                />
            </div>

            {/* Featured Insight Section - Placeholder for Phase 3.4 */}
            <div className="group relative p-8 rounded-[2rem] border overflow-hidden bg-card transition-all hover:border-primary/50 shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-primary group-hover:scale-110 transition-transform">
                    <LayoutDashboard className="w-32 h-32" />
                </div>
                <div className="flex flex-col gap-4 max-w-2xl relative z-10">
                    <h3 className="text-2xl font-bold tracking-tight">Agentic Readiness</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Your Notion databases and Obsidian files are indexed. The life-strategist is ready to brainstorm on your existing knowledge base.
                    </p>
                    <div className="flex gap-2">
                        <button className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm tracking-tight transition-all hover:shadow-lg active:scale-95">
                            Launch Strategist
                        </button>
                        <button className="px-5 py-2.5 rounded-2xl bg-muted text-foreground border font-bold text-sm tracking-tight transition-all hover:bg-muted/80">
                            Manage Intelligence
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
