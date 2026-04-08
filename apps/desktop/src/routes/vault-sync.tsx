import React, { useState, useEffect } from 'react'
import { Search, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import ObsidianDatabaseView from './obsidian-database-view'
import { ObsidianPagePanel } from '@/components/obsidian/ObsidianPagePanel'

interface VaultDatabase {
    id: string
    name: string
    schema: Record<string, any>
    type: string
    area?: string
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
    
    // Architect Modal State
    const [isCreating, setIsCreating] = useState(false)
    const [newDbName, setNewDbName] = useState('')
    const [areas, setAreas] = useState<string[]>([])
    const [selectedArea, setSelectedArea] = useState('Other')

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
                }
            } else {
                alert(`Page "${pageName}" not found in your vault.`)
            }
        } catch (err) {
            console.error("Navigation failed", err)
        }
    }

    const handleCreateDatabase = async () => {
        if (!newDbName.trim()) return;
        try {
            setLoading(true);
            await sidecarApi.createVaultDatabase(newDbName.trim(), selectedArea);
            setNewDbName('');
            setIsCreating(false);
            await fetchDatabases();
        } catch (err) {
            console.error(err);
            alert("Failed to create database");
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteDatabase = async (dbName: string) => {
        if (!confirm(`Are you sure you want to delete "${dbName}"?`)) return;
        try {
            setLoading(true);
            await sidecarApi.deleteVaultDatabase(dbName);
            await fetchDatabases();
        } catch (err) {
            console.error(err);
            alert("Failed to delete database");
        } finally {
            setLoading(false);
        }
    }

    const fetchDatabases = async () => {
        setLoading(true);
        try {
            const [dbRes, areaRes] = await Promise.all([
                sidecarApi.listVaultDatabases(),
                sidecarApi.fetchVaultAreas()
            ]);
            setDatabases(dbRes.databases || [])
            setAreas(areaRes.areas || [])
            if (areaRes.areas?.length > 0 && !areaRes.areas.includes(selectedArea)) {
                setSelectedArea(areaRes.areas[0]);
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDatabases(); }, [])

    const filteredDatabases = databases.filter(db => db.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const categorized: Record<string, VaultDatabase[]> = {}
    areas.forEach(area => { categorized[area] = []; })
    
    filteredDatabases.forEach(db => {
        const dbArea = db.area || 'Other';
        if (!categorized[dbArea]) categorized[dbArea] = [];
        categorized[dbArea].push(db);
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
                    database={selectedDb as any} 
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
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        Create Database
                    </button>
                </div>
            </div>

            {/* Creation UI */}
            {isCreating && (
                <div className="p-4 border border-border/40 rounded bg-secondary/5 mb-8 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-3">Create New Database</h3>
                    <div className="flex gap-2">
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. 15 - My New Database"
                            value={newDbName}
                            onChange={(e) => setNewDbName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateDatabase()}
                            className="flex-1 h-9 bg-background border border-border/40 px-3 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <div className="w-[180px]">
                            <select 
                                value={selectedArea}
                                onChange={(e) => setSelectedArea(e.target.value)}
                                className="w-full h-9 bg-background border border-border/40 px-3 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary/50"
                            >
                                {areas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={handleCreateDatabase}
                            className="px-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded h-9 transition-all active:scale-95"
                        >
                            Confirm
                        </button>
                        <button 
                            onClick={() => setIsCreating(false)}
                            className="px-4 bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-widest rounded h-9"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-20 space-y-12 pr-4">
                {Object.entries(categorized).map(([areaName, dbs]) => {
                    if (dbs.length === 0) return null;
                    return (
                        <div key={areaName} className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 border-b border-border/20 pb-2">{areaName}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {dbs.map(db => (
                                    <div 
                                        key={db.id} 
                                        onClick={() => setSelectedDb(db)} 
                                        className="p-3 border transition-all cursor-pointer group rounded bg-secondary/5 border-transparent hover:border-border/40 relative"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 group-hover:text-primary transition-colors">{db.area || 'Other'}</span>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteDatabase(db.id);
                                                }}
                                                className="p-1 opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity text-destructive"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                        <h3 className="text-xs font-bold tracking-tight mb-1">{db.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black opacity-30 uppercase">{Object.keys(db.schema).length} Fields</span>
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Synced</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
