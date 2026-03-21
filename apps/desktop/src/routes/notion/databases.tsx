import { useState, useEffect } from 'react'
import { Database, Search, ExternalLink, RefreshCw, Layers, Folder } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import DatabaseView from './database-view'

interface NotionDatabase {
    id: string
    title: any[]
    url: string
    icon?: any
    description?: any[]
    last_edited_time: string
}

const MACRO_CATEGORIES = [
    {
        name: 'Personal',
        groups: [
            { name: 'Planning', keywords: ['calendar', 'goals', 'projects', 'tasks', 'time block'] },
            { name: 'Finance', keywords: ['bank', 'expense', 'budget', 'income', 'transfer', 'finance'] },
            { name: 'Library', keywords: ['notes archive', 'summary archive', 'prompt library', 'library'] },
            { name: 'Fitness', keywords: ['muscle', 'exercises', 'workouts', 'workout logger', 'body measurements', 'fitness'] },
            { name: 'Kitchen', keywords: ['food', 'meals', 'ingredient', 'nutrition', 'shopping', 'groceries', 'daily tracker', 'journal', 'meal plan', 'kitchen'] },
        ]
    },
    {
        name: 'Intellectual',
        groups: [
            { name: 'Academic', keywords: ['courses', 'study planner', 'exams', 'assignments', 'crm', 'semesters', 'academic'] },
            { name: 'Skills', keywords: ['skills'] }
        ]
    }
]

export default function Databases() {
    const [databases, setDatabases] = useState<NotionDatabase[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDb, setSelectedDb] = useState<NotionDatabase | null>(null)

    const fetchDatabases = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await sidecarApi.listNotionDatabases()
            setDatabases(res.databases || [])
        } catch (err: any) {
            console.error('Failed to fetch databases:', err)
            setError(err.message || 'Failed to connect to Notion API')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDatabases()
    }, [])

    const getTitle = (db: NotionDatabase) => {
        if (!db.title || db.title.length === 0) return 'Untitled Database'
        return db.title.map(t => t.plain_text).join('') || 'Untitled Database'
    }

    const getDescription = (db: NotionDatabase) => {
        if (!db.description || db.description.length === 0) return ''
        return db.description.map(t => t.plain_text).join('')
    }

    const getIcon = (db: NotionDatabase) => {
        if (db.icon?.type === 'emoji') return db.icon.emoji
        if (db.icon?.type === 'external') return <img src={db.icon.external.url} className="w-4 h-4 object-contain" alt="" />
        if (db.icon?.type === 'file') return <img src={db.icon.file.url} className="w-4 h-4 object-contain" alt="" />
        return <Database size={16} className="text-muted-foreground" />
    }

    const filteredDatabases = databases.filter(db => 
        getTitle(db).toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Categorization logic
    const categorized = {
        Personal: {} as Record<string, NotionDatabase[]>,
        Intellectual: {} as Record<string, NotionDatabase[]>,
        Uncategorized: [] as NotionDatabase[]
    }

    // Initialize group arrays
    MACRO_CATEGORIES.forEach(macro => {
        macro.groups.forEach(g => {
            if (macro.name === 'Personal') categorized.Personal[g.name] = []
            if (macro.name === 'Intellectual') categorized.Intellectual[g.name] = []
        })
    })

    filteredDatabases.forEach(db => {
        const title = getTitle(db).toLowerCase()
        let placed = false

        for (const macro of MACRO_CATEGORIES) {
            for (const group of macro.groups) {
                if (group.keywords.some(kw => title.includes(kw))) {
                    if (macro.name === 'Personal') {
                        categorized.Personal[group.name].push(db)
                        placed = true
                        break
                    } else if (macro.name === 'Intellectual') {
                        categorized.Intellectual[group.name].push(db)
                        placed = true
                        break
                    }
                }
            }
            if (placed) break
        }

        if (!placed) categorized.Uncategorized.push(db)
    })

    if (selectedDb) {
        return <DatabaseView database={selectedDb} onBack={() => setSelectedDb(null)} />
    }

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 animate-in fade-in">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm">Fetching your Notion databases...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-destructive gap-3 animate-in fade-in">
                <Database className="w-8 h-8 opacity-50" />
                <p className="text-sm font-medium">Error loading databases</p>
                <p className="text-xs opacity-70 max-w-[300px] text-center">{error}</p>
                <button onClick={fetchDatabases} className="mt-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-xs hover:bg-secondary/80">
                    Try Again
                </button>
            </div>
        )
    }

    const renderDbCard = (db: NotionDatabase) => (
        <div 
            key={db.id} 
            onClick={() => setSelectedDb(db)}
            className="group flex flex-col p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                        {getIcon(db)}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate" title={getTitle(db)}>
                            {getTitle(db)}
                        </h3>
                    </div>
                </div>
                <a 
                    href={db.url} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Open in Notion"
                >
                    <ExternalLink size={14} />
                </a>
            </div>
            
            {getDescription(db) && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-3">
                    {getDescription(db)}
                </p>
            )}
            
            <div className="mt-auto pt-3 flex items-center justify-between text-[10px] text-muted-foreground border-t">
                <span>Updated: {new Date(db.last_edited_time).toLocaleDateString()}</span>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(db.id);
                        alert(`Copied ID: ${db.id}`);
                    }}
                    className="hover:text-foreground transition-colors"
                >
                    Copy ID
                </button>
            </div>
        </div>
    )

    const renderMacroCategory = (title: string, groups: Record<string, NotionDatabase[]>) => {
        const hasContent = Object.values(groups).some(arr => arr.length > 0)
        if (!hasContent) return null

        return (
            <div className="mb-10 animate-in slide-in-from-bottom-2">
                <h2 className="text-xl font-bold tracking-tight mb-6 bg-muted/50 p-3 rounded-lg border inline-block pr-8">{title}</h2>
                <div className="space-y-8 pl-2 border-l-2 border-muted ml-2">
                    {Object.entries(groups).map(([groupName, dbs]) => {
                        if (dbs.length === 0) return null
                        return (
                            <div key={groupName} className="relative">
                                <div className="absolute -left-[17px] top-2 w-3 h-3 bg-background border-2 border-primary rounded-full" />
                                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4 ml-4 uppercase tracking-wider">
                                    <Folder size={14} /> {groupName}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                                    {dbs.map(renderDbCard)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search databases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
                <button
                    onClick={fetchDatabases}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary/50 rounded-md hover:bg-secondary transition-colors"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-4 custom-scrollbar pb-10">
                {filteredDatabases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                        <Layers className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No databases found matching your search.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {renderMacroCategory('Personal', categorized.Personal)}
                        {renderMacroCategory('Intellectual', categorized.Intellectual)}

                        {categorized.Uncategorized.length > 0 && (
                            <div className="mb-10 animate-in slide-in-from-bottom-2">
                                <h2 className="text-xl font-bold tracking-tight mb-6 bg-muted/50 p-3 rounded-lg border inline-block pr-8">Uncategorized</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categorized.Uncategorized.map(renderDbCard)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
