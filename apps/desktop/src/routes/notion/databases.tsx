import React, { useState, useEffect } from 'react'
import { Database, Search, ExternalLink, RefreshCw, Folder } from 'lucide-react'
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
        name: 'Execution',
        groups: [
            { name: 'Core', keywords: ['tasks', 'projects', 'goals', 'calendar', 'time block', 'daily tracker'] }
        ]
    },
    {
        name: 'Intellectual',
        groups: [
            { name: 'Academic', keywords: ['courses', 'assignments', 'exams', 'study planner', 'semesters'] },
            { name: 'Archive', keywords: ['notes archive', 'summary archive', 'prompt library', 'journal'] }
        ]
    },
    {
        name: 'Health',
        groups: [
            { name: 'Forge', keywords: ['workouts', 'exercises', 'workout logger', 'muscle groups', 'body measurements'] },
            { name: 'Nutrition', keywords: ['meals', 'food reference', 'nutrition targets', 'ingredient', 'meal plan', 'groceries', 'shopping cart'] }
        ]
    },
    {
        name: 'Wealth',
        groups: [
            { name: 'Ledger', keywords: ['bank accounts', 'income', 'expense', 'transfer', 'budget'] },
            { name: 'CRM', keywords: ['crm'] }
        ]
    }
]

export default function Databases() {
    const [databases, setDatabases] = useState<NotionDatabase[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDb, setSelectedDb] = useState<NotionDatabase | null>(null)

    const fetchDatabases = async () => {
        setLoading(true);
        try {
            const res = await sidecarApi.listNotionDatabases()
            const uniqueDbs = (Array.isArray(res) ? res : []).filter((db, idx, self) => 
                idx === self.findIndex((t) => t.id.replace(/-/g, '') === db.id.replace(/-/g, ''))
            );
            setDatabases(uniqueDbs)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDatabases(); }, [])

    const getTitle = (db: any) => {
        if (!db.title) return 'Untitled'
        if (typeof db.title === 'string') return db.title
        return db.title.map((t: any) => t.plain_text).join('') || 'Untitled'
    }

    const filteredDatabases = databases.filter(db => getTitle(db).toLowerCase().includes(searchQuery.toLowerCase()))

    const categorized: Record<string, Record<string, NotionDatabase[]>> = {}
    MACRO_CATEGORIES.forEach(macro => {
        categorized[macro.name] = {}
        macro.groups.forEach(g => { categorized[macro.name][g.name] = []; })
    })
    const uncategorized: NotionDatabase[] = []

    filteredDatabases.forEach(db => {
        const title = getTitle(db).toLowerCase()
        let placed = false
        for (const macro of MACRO_CATEGORIES) {
            for (const group of macro.groups) {
                if (group.keywords.some(kw => title.includes(kw))) {
                    categorized[macro.name][group.name].push(db)
                    placed = true
                    break
                }
            }
            if (placed) break
        }
        if (!placed) uncategorized.push(db)
    })

    if (selectedDb) return <DatabaseView database={selectedDb} onBack={() => setSelectedDb(null)} />

    if (loading) return (
        <div className="h-full flex items-center justify-center opacity-20 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/30" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-[10px] w-48 bg-secondary/10 border-none rounded focus:outline-none focus:ring-1 focus:ring-border/40 tracking-tight"
                    />
                </div>
                <button onClick={fetchDatabases} className="p-2 opacity-20 hover:opacity-100 transition-opacity"><RefreshCw size={12} /></button>
            </div>

            <div className="space-y-12 pb-20">
                {Object.entries(categorized).map(([macroName, groups]) => {
                    if (!Object.values(groups).some(arr => arr.length > 0)) return null;
                    return (
                        <div key={macroName} className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 border-b border-border/20 pb-2">{macroName}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {Object.entries(groups).map(([groupName, dbs]) => dbs.map(db => (
                                    <div key={db.id} onClick={() => setSelectedDb(db)} className="p-3 bg-secondary/5 border border-transparent hover:border-border/40 transition-all cursor-pointer group rounded">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-[11px] tracking-tight truncate flex-1">{getTitle(db)}</h3>
                                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-20 ml-2 shrink-0" />
                                        </div>
                                        <div className="flex items-center justify-between opacity-20 text-[8px] font-black uppercase tracking-tighter">
                                            <span>{groupName}</span>
                                            <span onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(db.id); }} className="hover:opacity-100">Copy ID</span>
                                        </div>
                                    </div>
                                )))}
                            </div>
                        </div>
                    )
                })}

                {uncategorized.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 border-b border-border/20 pb-2">Uncategorized</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {uncategorized.map(db => (
                                <div key={db.id} onClick={() => setSelectedDb(db)} className="p-3 bg-secondary/5 border border-transparent hover:border-border/40 transition-all cursor-pointer group rounded">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-[11px] tracking-tight truncate flex-1">{getTitle(db)}</h3>
                                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-20 ml-2" />
                                    </div>
                                    <div className="flex items-center justify-between opacity-20 text-[8px] font-black uppercase tracking-tighter">
                                        <span>Other</span>
                                        <span onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(db.id); }} className="hover:opacity-100">Copy ID</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
