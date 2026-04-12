import React, { useState, useEffect } from 'react'
import { Search, ExternalLink, RefreshCw, Trash2 } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { ObsidianPagePanel } from '@/components/obsidian/ObsidianPagePanel'
import ObsidianDatabaseView from './obsidian-database-view'

interface VaultDatabase {
    id: string
    name: string
    schema: Record<string, any>
    type: string
    area?: string
    views?: any[]
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
                    onRefresh={fetchDatabases}
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
        <div className="h-full flex-1 flex flex-col w-full mx-auto animate-in fade-in zoom-in-95 duration-500 pr-2">
            {/* Global Note Panel */}
            {globalNotePath && (
                <ObsidianPagePanel
                    isOpen={!!globalNotePath}
                    onClose={() => setGlobalNotePath(null)}
                    fullPath={globalNotePath}
                    onNavigate={handleNavigate}
                />
            )}

            {/* Header with Search & Add Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between py-6 mb-4 gap-6">
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/20" />
                        <input
                            type="text"
                            placeholder="FIND SYSTEM..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 text-[10px] w-64 bg-secondary/10 border border-transparent rounded-full focus:outline-none focus:border-primary/20 focus:bg-secondary/20 transition-all font-black uppercase tracking-widest placeholder:opacity-20"
                        />
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchDatabases} 
                        className={cn(
                            "p-2.5 rounded-full bg-secondary/10 border border-border/10 hover:bg-secondary/20 transition-all text-muted-foreground hover:text-foreground",
                            loading && "animate-spin"
                        )}
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                        New Database
                    </button>
                </div>
            </div>

            {/* Creation UI Bar */}
            {isCreating && (
                <div className="p-6 border border-primary/20 rounded-2xl bg-primary/5 mb-10 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
                    <div className="relative z-10">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 text-primary">Initialize New Database</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                autoFocus
                                type="text"
                                placeholder="DATABASE NAME..."
                                value={newDbName}
                                onChange={(e) => setNewDbName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateDatabase()}
                                className="flex-1 h-12 bg-background border border-border/20 px-4 text-xs font-bold rounded-xl focus:outline-none focus:border-primary/50 shadow-inner"
                            />
                            <div className="sm:w-[220px]">
                                <select 
                                    value={selectedArea}
                                    onChange={(e) => setSelectedArea(e.target.value)}
                                    className="w-full h-12 bg-background border border-border/20 px-4 text-xs font-bold rounded-xl focus:outline-none focus:border-primary/50 appearance-none"
                                >
                                    {areas.map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleCreateDatabase}
                                    className="flex-1 sm:flex-none px-8 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    Deploy
                                </button>
                                <button 
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 bg-secondary/40 text-secondary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-secondary/60 transition-all"
                                >
                                    Abort
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-32 space-y-16">
                {Object.entries(categorized).map(([areaName, dbs]) => {
                    if (dbs.length === 0) return null;
                    return (
                        <div key={areaName} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-foreground/80">{areaName}</h2>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-border/40 to-transparent" />
                                <span className="text-[10px] font-black opacity-20">{dbs.length} MODULES</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {dbs.map(db => (
                                    <div 
                                        key={db.id} 
                                        onClick={() => setSelectedDb(db)} 
                                        className="group relative p-6 border border-border/20 rounded-2xl bg-secondary/5 hover:border-primary/40 hover:bg-secondary/10 transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteDatabase(db.id);
                                                }}
                                                className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        <div className="flex flex-col h-full justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="size-1.5 bg-primary/20 rounded-full" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">{db.area}</span>
                                                </div>
                                                <h3 className="text-sm font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{db.name}</h3>
                                            </div>
                                            
                                            <div className="mt-6 pt-4 border-t border-border/5 flex items-center justify-between">
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-muted-foreground/20 uppercase">Fields</span>
                                                        <span className="text-[10px] font-black">{Object.keys(db.schema).length}</span>
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1 rounded bg-emerald-500/5 border border-emerald-500/10">
                                                    <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Active</span>
                                                </div>
                                            </div>
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
