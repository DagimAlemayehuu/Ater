import React, { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, RefreshCw, Plus, Search, Table, Kanban, LayoutGrid, Filter, ArrowUpDown, MoreVertical } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

import { TableView } from '@/components/obsidian/views/TableView'
import { BoardView } from '@/components/obsidian/views/BoardView'
import { GalleryView } from '@/components/obsidian/views/GalleryView'
import { ObsidianPagePanel } from '@/components/obsidian/ObsidianPagePanel'
import { DatabaseSettingsPanel } from '@/components/obsidian/DatabaseSettingsPanel'

interface ObsidianDatabaseViewProps {
    database: {
        id: string
        name: string
        schema: Record<string, any>
        views?: any[]
    }
    onBack: () => void
    onNavigate: (pageName: string) => void
    onRefresh: () => void
    initialSelectedRowId?: string | null
}

export default function ObsidianDatabaseView({ database, onBack, onNavigate, onRefresh, initialSelectedRowId }: ObsidianDatabaseViewProps) {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRowId, setSelectedRowId] = useState<string | null>(initialSelectedRowId || null)
    const [activeTab, setActiveTab] = useState<'table' | 'board' | 'gallery'>('table')
    
    // Settings State
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [isCreatingRow, setIsCreatingRow] = useState(false)
    const [newRowName, setNewRowName] = useState('')
    
    // View Customization State
    const [hiddenProperties, setHiddenProperties] = useState<string[]>([])
    const [sortConfig, setSortConfig] = useState<{ col: string, dir: 'asc' | 'desc' } | null>(null)
    const [filters, setFilters] = useState<any[]>([])
    const [groupBy, setGroupBy] = useState<string | null>(null)

    const fetchRows = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.queryVaultDatabase(database.id)
            setRows(res.results || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRows()
        // SSE Logic
        const eventSource = new EventSource('http://127.0.0.1:8765/api/vault/events');
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.data?.db_name === database.id) fetchRows();
            } catch (e) {
                console.error("SSE error", e);
            }
        };
        return () => eventSource.close();
    }, [database.id])

    const handleUpdate = async (fileName: string, propertyName: string, value: any) => {
        setRows(prev => prev.map(r => r.id === fileName ? {
            ...r,
            properties: { ...r.properties, [propertyName]: value }
        } : r))
        
        try {
            await sidecarApi.updateVaultRow(database.id, fileName, { [propertyName]: value })
        } catch (e) {
            console.error(e)
            fetchRows()
        }
    }

    const handleAddRow = async () => {
        if (!newRowName.trim()) return;
        const initialProps: Record<string, any> = {};
        Object.keys(database.schema).forEach(key => {
            const meta = database.schema[key];
            const typeStr = typeof meta === 'string' ? meta : (meta?.type || 'str');
            if (typeStr === 'list') initialProps[key] = [];
            else if (typeStr === 'bool') initialProps[key] = false;
            else initialProps[key] = "";
        });

        try {
            await sidecarApi.createVaultRow(database.id, newRowName, initialProps)
            setIsCreatingRow(false);
            setNewRowName('');
            fetchRows();
        } catch (e) { console.error(e); }
    }

    const filteredRows = useMemo(() => {
        let result = rows.filter(r => 
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            Object.values(r.properties).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
        );

        // Apply advanced filters
        if (filters.length > 0) {
            result = result.filter(row => {
                return filters.every(f => {
                    const val = f.col === 'title' ? row.title : row.properties[f.col];
                    const target = String(val || "").toLowerCase();
                    const filterVal = String(f.val || "").toLowerCase();

                    switch (f.op) {
                        case 'eq': return target === filterVal;
                        case 'con': return target.includes(filterVal);
                        case 'emp': return !val || (Array.isArray(val) && val.length === 0);
                        default: return true;
                    }
                });
            });
        }

        if (sortConfig) {
            result = [...result].sort((a, b) => {
                const valA = sortConfig.col === 'title' ? a.title : a.properties[sortConfig.col];
                const valB = sortConfig.col === 'title' ? b.title : b.properties[sortConfig.col];
                
                const strA = String(valA || "").toLowerCase();
                const strB = String(valB || "").toLowerCase();
                
                if (strA < strB) return sortConfig.dir === 'asc' ? -1 : 1;
                if (strA > strB) return sortConfig.dir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return result;
    }, [rows, searchQuery, sortConfig])

    const columns = useMemo(() => {
        const all = ['title', ...Object.keys(database.schema).sort()];
        return all.filter(col => col === 'title' || !hiddenProperties.includes(col));
    }, [database.schema, hiddenProperties])

    return (
        <div className="h-full flex flex-col space-y-0 animate-in fade-in duration-500 relative">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col px-4 pt-2 pb-0 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                    <button onClick={onBack} className="p-1.5 hover:bg-secondary rounded-full transition-all text-muted-foreground/40 hover:text-foreground">
                        <ArrowLeft size={14} />
                    </button>
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
                        <span>Vault</span>
                        <span className="opacity-20">/</span>
                        <span>Databases</span>
                        <span className="opacity-20">/</span>
                        <span className="text-foreground opacity-100">{database.name}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-border/10">
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setActiveTab('table')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                                activeTab === 'table' ? "border-primary text-foreground" : "border-transparent text-muted-foreground/40 hover:text-muted-foreground"
                            )}
                        >
                            <Table size={12} /> Table
                        </button>
                        <button 
                            onClick={() => setActiveTab('board')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                                activeTab === 'board' ? "border-primary text-foreground" : "border-transparent text-muted-foreground/40 hover:text-muted-foreground"
                            )}
                        >
                            <Kanban size={12} /> Board
                        </button>
                        <button 
                            onClick={() => setActiveTab('gallery')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                                activeTab === 'gallery' ? "border-primary text-foreground" : "border-transparent text-muted-foreground/40 hover:text-muted-foreground"
                            )}
                        >
                            <LayoutGrid size={12} /> Gallery
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/30 group-focus-within:text-primary/50 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 h-7 text-[10px] w-40 bg-secondary/10 border-none rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all focus:w-56 tracking-tight bg-[#0f0f0f]"
                            />
                        </div>
                        <button onClick={fetchRows} className="p-2 opacity-30 hover:opacity-100 transition-opacity"><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /></button>
                        <div className="w-px h-4 bg-border/20 mx-1" />
                        
                        {/* More Menu / Settings Trigger */}
                        <button 
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className={cn(
                                "flex items-center justify-center p-1.5 hover:bg-secondary rounded-md transition-all",
                                settingsOpen ? "bg-secondary text-primary" : "text-muted-foreground/40 dark:text-muted-foreground/60"
                            )}
                        >
                            <MoreVertical size={14} />
                        </button>

                        <button 
                            onClick={() => setIsCreatingRow(true)}
                            className="flex items-center gap-1.5 px-4 h-7 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-[0.1em] rounded-md hover:opacity-90 transition-all shadow-md shadow-primary/10 ml-2"
                        >
                            <Plus size={12} /> New
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Overlay */}
            <DatabaseSettingsPanel 
                isOpen={settingsOpen} 
                onClose={() => setSettingsOpen(false)} 
                database={database}
                activeTab={activeTab}
                hiddenProperties={hiddenProperties}
                onToggleVisibility={(name) => {
                    setHiddenProperties(prev => 
                        prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
                    )
                }}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
                filters={filters}
                onFiltersChange={setFilters}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                onUpdateSchema={() => {
                    fetchRows();
                    onRefresh();
                }}
                onLayoutChange={setActiveTab}
            />

            {/* Dynamic View Content */}
            <div className="flex-1 min-h-0 bg-background/50 relative">
                {/* Add Row Overlay */}
                {isCreatingRow && (
                    <div className="absolute inset-x-0 top-0 z-[60] p-6 bg-background/95 backdrop-blur-md border-b border-border/40 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Create New Entry</h3>
                            <button onClick={() => setIsCreatingRow(false)} className="text-[10px] font-bold uppercase opacity-30 hover:opacity-100 transition-opacity">Cancel</button>
                        </div>
                        <div className="flex gap-4 items-end max-w-2xl">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[9px] font-black uppercase opacity-20 tracking-wider">Entry Title</label>
                                <input 
                                    autoFocus 
                                    className="w-full h-10 bg-secondary/10 border border-border/20 px-4 rounded-xl focus:ring-1 focus:ring-primary/40 focus:outline-none text-sm font-bold"
                                    placeholder="Untitled Note"
                                    value={newRowName}
                                    onChange={(e) => setNewRowName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddRow()}
                                />
                            </div>
                            <button 
                                onClick={handleAddRow}
                                className="h-10 px-8 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                )}

                <div className="h-full p-4 overflow-hidden">
                    {activeTab === 'table' && (
                        <TableView 
                            rows={filteredRows} 
                            columns={columns} 
                            schema={database.schema} 
                            loading={loading}
                            onUpdate={handleUpdate}
                            onSelectRow={setSelectedRowId}
                            onDeleteRow={(id) => sidecarApi.deleteVaultRow(database.id, id).then(fetchRows)}
                            onNavigate={onNavigate}
                            groupBy={groupBy}
                        />
                    )}
                    {activeTab === 'board' && (
                        <BoardView 
                            rows={filteredRows} 
                            schema={database.schema} 
                            onUpdate={handleUpdate}
                            onSelectRow={setSelectedRowId}
                            onNavigate={onNavigate}
                            groupBy={groupBy || undefined}
                        />
                    )}
                    {activeTab === 'gallery' && (
                        <GalleryView 
                            rows={filteredRows} 
                            schema={database.schema} 
                            onSelectRow={setSelectedRowId}
                        />
                    )}
                </div>
            </div>

            {selectedRowId && (
                <ObsidianPagePanel
                    isOpen={!!selectedRowId}
                    onClose={() => setSelectedRowId(null)}
                    databaseId={database.id}
                    rowId={selectedRowId}
                    schema={database.schema}
                    properties={rows.find(r => r.id === selectedRowId)?.properties || {}}
                    onUpdateProperty={(prop, val) => handleUpdate(selectedRowId!, prop, val)}
                    onNavigate={onNavigate}
                    onDelete={() => sidecarApi.deleteVaultRow(database.id, selectedRowId).then(() => { setSelectedRowId(null); fetchRows(); })}
                />
            )}
        </div>
    )
}
