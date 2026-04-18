import React, { useState, useEffect } from 'react'
import { Search, ExternalLink, RefreshCw, Trash2, Plus, Database, ChevronRight } from 'lucide-react'
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
            <div className="h-full flex-1 flex flex-col w-full relative bg-background font-sans text-foreground">
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

    return (
        <div className="h-full flex-1 flex flex-col w-full bg-background font-sans text-foreground">
            {globalNotePath && (
                <ObsidianPagePanel
                    isOpen={!!globalNotePath}
                    onClose={() => setGlobalNotePath(null)}
                    fullPath={globalNotePath}
                    onNavigate={handleNavigate}
                />
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto px-16 py-12">
                    <div className="flex flex-col mb-12">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-4">
                            <span>System</span>
                            <span className="material-symbols-outlined text-[12px]"><ChevronRight size={12}/></span>
                            <span className="text-muted-foreground">Vault Sync</span>
                        </div>
                        <h1 className="text-5xl font-extrabold text-foreground tracking-tight mb-4 leading-tight">Vault Modules</h1>
                        <p className="text-[16px] leading-relaxed text-muted-foreground">Synchronize high-fidelity knowledge clusters and manage autonomous ingestion sectors.</p>
                    </div>

                    {/* Header with Search & Add Button */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 mb-8 border-y border-border gap-6">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex items-center w-full md:w-80">
                                <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search databases..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-muted border border-border text-[13px] px-3 py-2 pl-9 rounded focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60 transition-shadow"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={fetchDatabases} 
                                className={cn(
                                    "flex items-center justify-center p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent",
                                    loading && "animate-spin"
                                )}
                                title="Refresh"
                            >
                                <RefreshCw size={16} />
                            </button>
                            <button 
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[12px] font-medium rounded hover:opacity-90 transition-all shadow-sm shadow-primary/10"
                            >
                                <Plus size={16} />
                                New Module
                            </button>
                        </div>
                    </div>

                    {/* Creation UI Bar */}
                    {isCreating && (
                        <div className="p-6 border border-border rounded-lg bg-muted/30 mb-10 overflow-hidden relative shadow-inner">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Initialize New Module</h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Module Name..."
                                        value={newDbName}
                                        onChange={(e) => setNewDbName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateDatabase()}
                                        className="flex-1 h-10 bg-background border border-border px-4 text-sm rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                    <div className="sm:w-[220px]">
                                        <select 
                                            value={selectedArea}
                                            onChange={(e) => setSelectedArea(e.target.value)}
                                            className="w-full h-10 bg-background border border-border px-4 text-sm rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                        >
                                            {areas.map(area => (
                                                <option key={area} value={area}>{area}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleCreateDatabase}
                                            className="px-6 bg-primary text-primary-foreground text-[12px] font-medium rounded hover:opacity-90 transition-colors"
                                        >
                                            Deploy
                                        </button>
                                        <button 
                                            onClick={() => setIsCreating(false)}
                                            className="px-6 bg-background border border-border text-foreground text-[12px] font-medium rounded hover:bg-muted transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-16">
                        {loading && databases.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">Loading modules...</div>
                        ) : Object.entries(categorized).map(([areaName, dbs]) => {
                            if (dbs.length === 0) return null;
                            return (
                                <div key={areaName} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-[12px] font-bold uppercase tracking-wider text-foreground">{areaName}</h2>
                                        <div className="h-[1px] flex-1 bg-border" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{dbs.length} MODULES</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {dbs.map(db => (
                                            <div 
                                                key={db.id} 
                                                onClick={() => setSelectedDb(db)} 
                                                className="group relative p-6 bg-background border border-border rounded-lg hover:border-muted-foreground/30 hover:shadow-md transition-all cursor-pointer flex flex-col h-[180px] shadow-sm"
                                            >
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteDatabase(db.id);
                                                        }}
                                                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                                                        title="Delete Module"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex flex-col h-full justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Database className="w-4 h-4 text-muted-foreground/60" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{db.area || 'Module'}</span>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-foreground tracking-tight leading-tight line-clamp-2">{db.name}</h3>
                                                    </div>
                                                    
                                                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Properties</span>
                                                            <span className="text-[13px] font-medium text-foreground">{Object.keys(db.schema).length}</span>
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
            </div>
        </div>
    )
}
