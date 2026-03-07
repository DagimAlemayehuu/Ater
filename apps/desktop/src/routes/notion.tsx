import { useState, useEffect } from 'react'
import { Database, Table, List, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

export default function Notion() {
    const [databases, setDatabases] = useState<any[]>([])
    const [selectedDb, setSelectedDb] = useState<string | null>(null)
    const [dbResults, setDbResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingDb, setLoadingDb] = useState(false)

    useEffect(() => {
        fetchDatabases()
    }, [])

    const fetchDatabases = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.listNotionDatabases()
            setDatabases(res.databases)
        } catch (err) {
            console.error('Failed to fetch databases:', err)
        } finally {
            setLoading(false)
        }
    }

    const selectDatabase = async (id: string) => {
        setSelectedDb(id)
        setLoadingDb(true)
        try {
            const res = await sidecarApi.queryNotionDatabase(id)
            setDbResults(res.results)
        } catch (err) {
            console.error('Failed to query database:', err)
        } finally {
            setLoadingDb(false)
        }
    }

    const getTitle = (db: any) => {
        return db.title?.[0]?.plain_text || 'Untitled'
    }

    const getPageTitle = (page: any) => {
        // Notion database title logic is tricky, usually it's under 'Name' or 'Title' property
        const props = page.properties
        const titleProp = Object.values(props).find((p: any) => p.type === 'title') as any
        return titleProp?.title?.[0]?.plain_text || 'Untitled'
    }

    const getProperties = (db: any) => {
        if (!db?.properties) return []
        return Object.entries(db.properties).map(([name, val]: [string, any]) => ({
            name,
            type: val.type
        }))
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                        Notion Workspace
                    </h2>
                    <p className="text-muted-foreground/80 font-medium">
                        Direct connection to your Notion databases and knowledge.
                    </p>
                </div>
                <button
                    onClick={fetchDatabases}
                    disabled={loading}
                    className="p-2.5 rounded-2xl bg-muted/50 hover:bg-muted border border-border/50 transition-all disabled:opacity-50 group active:scale-95"
                >
                    <RefreshCw className={cn("w-5 h-5 group-hover:rotate-180 transition-transform duration-500", loading && "animate-spin")} />
                </button>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Databases List */}
                <div className="w-[320px] flex flex-col gap-4 border-r pr-6 border-border/50">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">Your Databases</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">{databases.length}</span>
                    </div>
                    <div className="flex-1 overflow-auto space-y-1.5 custom-scrollbar pr-2">
                        {loading && databases.length === 0 && (
                            <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading workspace...</div>
                        )}
                        {databases.map((db) => (
                            <button
                                key={db.id}
                                onClick={() => selectDatabase(db.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all border",
                                    selectedDb === db.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02] z-10"
                                        : "bg-card/50 hover:bg-muted border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Database className={cn("w-4 h-4 flex-shrink-0", selectedDb === db.id ? "text-primary-foreground" : "text-primary")} />
                                <span className="truncate flex-1 text-left font-bold tracking-tight">{getTitle(db)}</span>
                                <ChevronRight className={cn("w-4 h-4 opacity-30 transition-transform", selectedDb === db.id ? "rotate-90 opacity-100" : "")} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Database Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {!selectedDb ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/20 border-2 border-dashed rounded-[2.5rem] gap-4 bg-muted/10">
                            <div className="p-6 rounded-[2rem] bg-muted/50 border border-border/50">
                                <Table className="w-16 h-16" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-muted-foreground/40">Select a database</p>
                                <p className="text-xs">View records and structure of your workspace.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full gap-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <h3 className="text-2xl font-bold flex items-center gap-2.5 tracking-tight uppercase">
                                        <List className="w-6 h-6 text-primary" />
                                        {getTitle(databases.find(d => d.id === selectedDb))}
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {getProperties(databases.find(d => d.id === selectedDb)).map((prop: any) => (
                                            <span
                                                key={prop.name}
                                                className="px-2 py-0.5 rounded-lg bg-muted text-[9px] font-bold tracking-widest uppercase border border-border/50 text-muted-foreground/80"
                                            >
                                                {prop.name}: <span className="text-primary/70">{prop.type}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <a
                                    href={`https://notion.so/${selectedDb.replace(/-/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted text-[10px] font-bold uppercase tracking-widest border border-border/50 transition-all hover:scale-105 active:scale-95 text-muted-foreground hover:text-foreground"
                                >
                                    OPEN IN NOTION <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>

                            <div className="flex-1 overflow-hidden border rounded-[2rem] bg-card/50 backdrop-blur-sm shadow-inner">
                                {loadingDb ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground/50">
                                        <div className="relative">
                                            <RefreshCw className="w-12 h-12 animate-spin-slow opacity-20" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold tracking-widest uppercase animate-pulse">Synchronizing Records...</span>
                                    </div>
                                ) : (
                                    <div className="h-full overflow-auto space-y-px custom-scrollbar">
                                        {dbResults.map((page) => (
                                            <div
                                                key={page.id}
                                                className="group flex flex-col gap-1.5 p-6 hover:bg-muted/30 transition-all border-b border-border/10 last:border-none"
                                            >
                                                <div className="flex items-center justify-between gap-6">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                                        <span className="text-lg font-bold tracking-tight truncate">{getPageTitle(page)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <a
                                                            href={page.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-primary hover:text-primary-foreground text-[10px] font-bold uppercase tracking-widest transition-all scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100"
                                                        >
                                                            VIEW <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground/40 font-mono tracking-tighter">
                                                    <span className="uppercase font-bold text-muted-foreground/20">UUID</span>
                                                    {page.id}
                                                </div>
                                            </div>
                                        ))}
                                        {dbResults.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-3">
                                                <List className="w-12 h-12 opacity-10" />
                                                <p className="text-sm font-medium">No records found in this database.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
