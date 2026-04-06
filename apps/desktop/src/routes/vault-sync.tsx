import React, { useState, useEffect } from 'react'
import { Search, ExternalLink, RefreshCw } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import ObsidianDatabaseView from './obsidian-database-view'
import { ObsidianPagePanel } from '@/components/obsidian/ObsidianPagePanel'

interface VaultDatabase {
    id: string
    name: string
    schema: Record<string, string>
    type: string
}

const MACRO_CATEGORIES = [
    {
        name: 'Execution',
        groups: [
            { name: 'Core', keywords: ['tasks', 'projects', 'goals'] }
        ]
    },
    {
        name: 'Intellectual',
        groups: [
            { name: 'Academic', keywords: ['courses', 'assignments', 'exams', 'study planner', 'semesters', 'years'] }
        ]
    }
]

export default function VaultSync() {
    const [databases, setDatabases] = useState<VaultDatabase[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDb, setSelectedDb] = useState<VaultDatabase | null>(null)
    const [preOpenRowId, setPreOpenRowId] = useState<string | null>(null)
    
    // For opening notes that aren't in a database
    const [globalNotePath, setGlobalNotePath] = useState<string | null>(null)

    const handleNavigate = async (pageName: string) => {
        try {
            const res = await sidecarApi.findVaultPage(pageName)
            if (res.found) {
                if (res.type === 'database' && res.db_id) {
                    const targetDb = databases.find(db => db.id === res.db_id)
                    if (targetDb) {
                        setSelectedDb(targetDb)
                        setPreOpenRowId(res.file_name || null)
                        setGlobalNotePath(null)
                    }
                } else if (res.type === 'note' && res.path) {
                    setGlobalNotePath(res.path)
                    // If we were in a DB view, stay there but overlay the global note? 
                    // Actually, let's just open the panel.
                }
            } else {
                alert(`Page "${pageName}" not found in your vault.`)
            }
        } catch (err) {
            console.error("Navigation failed", err)
        }
    }

    const fetchDatabases = async () => {
        setLoading(true);
        try {
            const res = await sidecarApi.listVaultDatabases()
            setDatabases(res.databases || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDatabases(); }, [])

    const filteredDatabases = databases.filter(db => db.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const categorized: Record<string, Record<string, VaultDatabase[]>> = {}
    MACRO_CATEGORIES.forEach(macro => {
        categorized[macro.name] = {}
        macro.groups.forEach(g => { categorized[macro.name][g.name] = []; })
    })
    const uncategorized: VaultDatabase[] = []

    filteredDatabases.forEach(db => {
        const title = db.name.toLowerCase()
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

    if (selectedDb) {
        return (
            <div className="h-full flex-1 flex flex-col w-full relative">
                {globalNotePath && (
                    <ObsidianPagePanel
                        isOpen={!!globalNotePath}
                        onClose={() => setGlobalNotePath(null)}
                        fullPath={globalNotePath}
                        onNavigate={handleNavigate}
                    />
                )}
                <ObsidianDatabaseView 
                    database={selectedDb} 
                    onBack={() => {
                        setSelectedDb(null)
                        setPreOpenRowId(null)
                        setGlobalNotePath(null)
                    }} 
                    onNavigate={handleNavigate}
                    initialSelectedRowId={preOpenRowId}
                />
            </div>
        )
    }

    if (loading) return (
        <div className="h-full flex items-center justify-center opacity-20 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
    )

    return (
        <div className="h-full flex-1 flex flex-col space-y-4 w-full mx-auto animate-in fade-in duration-300">
            {/* Global Note Panel */}
            {globalNotePath && (
                <ObsidianPagePanel
                    isOpen={!!globalNotePath}
                    onClose={() => setGlobalNotePath(null)}
                    fullPath={globalNotePath}
                    onNavigate={handleNavigate}
                />
            )}

            <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div>
                    <h2 className="text-xl font-black tracking-tighter uppercase">Vault Sync Status</h2>
                    <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                        Obsidian Local Headless CMS
                    </p>
                </div>
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
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-20 space-y-12 pr-4">
                {Object.entries(categorized).map(([macroName, groups]) => {
                    if (!Object.values(groups).some(arr => arr.length > 0)) return null;
                    return (
                        <div key={macroName} className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 border-b border-border/20 pb-2">{macroName}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {Object.entries(groups).map(([groupName, dbs]) => dbs.map(db => {
                                    return (
                                        <div 
                                            key={db.id} 
                                            onClick={() => setSelectedDb(db)} 
                                            className="p-3 border transition-all cursor-pointer group rounded bg-secondary/5 border-transparent hover:border-border/40"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-[11px] tracking-tight truncate flex-1">{db.name}</h3>
                                                <ExternalLink size={10} className="opacity-0 group-hover:opacity-20 ml-2 shrink-0" />
                                            </div>
                                            <div className="flex items-center justify-between opacity-50 text-[8px] font-black uppercase tracking-tighter">
                                                <span>{groupName}</span>
                                                <span className="text-green-500 font-bold">Synced</span>
                                            </div>
                                        </div>
                                    )
                                }))}
                            </div>
                        </div>
                    )
                })}

                {uncategorized.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 border-b border-border/20 pb-2">Uncategorized</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {uncategorized.map(db => {
                                return (
                                    <div 
                                        key={db.id} 
                                        onClick={() => setSelectedDb(db)} 
                                        className="p-3 border transition-all cursor-pointer group rounded bg-secondary/5 border-transparent hover:border-border/40"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-[11px] tracking-tight truncate flex-1">{db.name}</h3>
                                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-20 ml-2 shrink-0" />
                                        </div>
                                        <div className="flex items-center justify-between opacity-50 text-[8px] font-black uppercase tracking-tighter">
                                            <span>Other</span>
                                            <span className="text-green-500 font-bold">Synced</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
