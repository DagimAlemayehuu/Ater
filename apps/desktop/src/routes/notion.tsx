import { useState, useEffect } from 'react'
import { Database, Table, List, ExternalLink, RefreshCw } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'

export default function Notion() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [databases, setDatabases] = useState<any[]>([])
    const [selectedDb, setSelectedDb] = useState<string | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTitle = (db: any) => {
        return db.title?.[0]?.plain_text || 'Untitled'
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPageTitle = (page: any) => {
        // Notion database title logic is tricky, usually it's under 'Name' or 'Title' property
        const props = page.properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const titleProp = Object.values(props).find((p: any) => p.type === 'title') as any
        return titleProp?.title?.[0]?.plain_text || 'Untitled'
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getProperties = (db: any) => {
        if (!db?.properties) return []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Object.entries(db.properties).map(([name, val]: [string, any]) => ({
            name,
            type: val.type
        }))
    }

    return (
        <>
            <Header>
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                </div>
            </Header>

            <Main>
                <div className="h-full flex-1 flex flex-col space-y-6 md:flex max-w-[1400px] w-full mx-auto animate-in fade-in duration-300">
                    <div className="flex items-center justify-between space-y-2 border-b border-border pb-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Notion Workspace</h2>
                            <p className="text-muted-foreground">
                                Direct connection to your Notion databases and knowledge.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={fetchDatabases}
                                disabled={loading}
                                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-6 flex-1 min-h-0">
                        {/* Databases List */}
                        <div className="w-[300px] flex flex-col gap-4 border-r border-border pr-6">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-semibold tracking-tight text-foreground">Your Databases</h3>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted border text-muted-foreground">{databases.length}</span>
                            </div>
                            <div className="flex-1 overflow-auto space-y-1 custom-scrollbar pr-2">
                                {loading && databases.length === 0 && (
                                    <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">Loading workspace...</div>
                                )}
                                {databases.map((db) => (
                                    <button
                                        key={db.id}
                                        onClick={() => selectDatabase(db.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 min-h-9 rounded-md text-sm font-medium transition-colors",
                                            selectedDb === db.id
                                                ? "bg-muted text-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Database className={cn("w-4 h-4 shrink-0", selectedDb === db.id ? "text-primary" : "opacity-70")} />
                                            <span className="truncate">{getTitle(db)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Database Content */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {!selectedDb ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/60 border-2 border-dashed border-border rounded-xl gap-4 bg-muted/10">
                                    <div className="p-4 rounded-full bg-muted border border-border">
                                        <Table className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-foreground">Select a database</p>
                                        <p className="text-sm text-muted-foreground">View records and structure of your workspace.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full gap-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
                                                <List className="w-5 h-5 text-muted-foreground" />
                                                {getTitle(databases.find(d => d.id === selectedDb))}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {getProperties(databases.find(d => d.id === selectedDb)).map((prop: any) => (
                                                    <span
                                                        key={prop.name}
                                                        className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium border text-muted-foreground flex items-center gap-1"
                                                    >
                                                        {prop.name}
                                                        <span className="opacity-50">·</span>
                                                        <span className="opacity-70">{prop.type}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <a
                                            href={`https://notion.so/${selectedDb.replace(/-/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        >
                                            Open in Notion <ExternalLink className="ml-2 w-3.5 h-3.5" />
                                        </a>
                                    </div>

                                    <div className="flex-1 overflow-hidden border rounded-xl bg-card shadow-sm">
                                        {loadingDb ? (
                                            <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                                <RefreshCw className="w-8 h-8 animate-spin opacity-50" />
                                                <span className="text-sm font-medium">Synchronizing Records...</span>
                                            </div>
                                        ) : (
                                            <div className="h-full overflow-auto space-y-px bg-muted/30">
                                                {dbResults.map((page) => (
                                                    <div
                                                        key={page.id}
                                                        className="group flex flex-col gap-1.5 p-4 bg-card border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-sm font-medium truncate">{getPageTitle(page)}</span>
                                                            </div>
                                                            <a
                                                                href={page.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex h-7 items-center justify-center rounded-md border border-transparent hover:border-border bg-transparent hover:bg-background px-2 text-xs font-medium shadow-none transition-colors opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                            >
                                                                View <ExternalLink className="ml-1.5 w-3 h-3" />
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                                            <span className="opacity-50">ID:</span>
                                                            {page.id}
                                                        </div>
                                                    </div>
                                                ))}
                                                {dbResults.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 pt-10">
                                                        <div className="p-3 rounded-full bg-muted border border-border">
                                                            <List className="w-6 h-6 opacity-50" />
                                                        </div>
                                                        <p className="text-sm font-medium mt-2">No records found in this database.</p>
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
            </Main>
        </>
    )
}
