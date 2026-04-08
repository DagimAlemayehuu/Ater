import React, { useState, useEffect } from 'react'
import { ArrowLeft, RefreshCw, Plus, Search, Trash, Settings } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

import { EditableCell } from '@/components/obsidian/EditableCell'
import { ObsidianPagePanel } from '@/components/obsidian/ObsidianPagePanel'

interface ObsidianDatabaseViewProps {
    database: {
        id: string
        name: string
        schema: Record<string, string>
    }
    onBack: () => void
    onNavigate: (pageName: string) => void
    initialSelectedRowId?: string | null
}

export default function ObsidianDatabaseView({ database, onBack, onNavigate, initialSelectedRowId }: ObsidianDatabaseViewProps) {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRowId, setSelectedRowId] = useState<string | null>(initialSelectedRowId || null)
    
    // Architect Panel State
    const [architectMode, setArchitectMode] = useState<'idle' | 'add_row' | 'add_column' | 'edit_column'>('idle')
    const [architectData, setArchitectData] = useState({
        name: '',
        type: 'str',
        source: '',
        oldName: ''
    })

    useEffect(() => {
        if (initialSelectedRowId) {
            setSelectedRowId(initialSelectedRowId);
        }
    }, [initialSelectedRowId])

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

        // Phase 3: Real-Time Sync via SSE
        const eventSource = new EventSource('http://127.0.0.1:8765/api/vault/events');
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Only react if the event is for the current database
                if (data.data?.db_name === database.id) {
                    console.log("[VaultSync] Real-time event received:", data);
                    // Instead of full refetch on every keystroke, we just trigger a debounced fetch
                    fetchRows();
                }
            } catch (e) {
                console.error("Failed to parse SSE event", e);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [database.id])

    const handleUpdate = async (fileName: string, propertyName: string, value: any) => {
        // Optimistic update
        setRows(prev => prev.map(r => r.id === fileName ? {
            ...r,
            properties: { ...r.properties, [propertyName]: value }
        } : r))
        
        try {
            await sidecarApi.updateVaultRow(database.id, fileName, { [propertyName]: value })
        } catch (e) {
            console.error(e)
            fetchRows() // Revert on failure
        }
    }

    const handleAddRow = async () => {
        if (!architectData.name.trim()) return;
        
        const initialProps: Record<string, any> = {};
        Object.keys(database.schema).forEach(key => {
            const meta = (database.schema as any)[key];
            const typeStr = typeof meta === 'string' ? meta : (meta?.type || 'str');
            if (typeStr === 'list') initialProps[key] = [];
            else if (typeStr === 'bool') initialProps[key] = false;
            else initialProps[key] = "";
        });

        try {
            await sidecarApi.createVaultRow(database.id, architectData.name, initialProps)
            setArchitectMode('idle');
            setArchitectData(prev => ({ ...prev, name: '' }));
            fetchRows();
        } catch (e) {
            console.error(e)
            alert("Failed to create row");
        }
    }

    const handleDeleteRow = async (fileName: string) => {
        if (!confirm(`Delete ${fileName}?`)) return;
        try {
            await sidecarApi.deleteVaultRow(database.id, fileName)
            fetchRows()
        } catch (e) {
            console.error(e)
            alert("Failed to delete row");
        }
    }

    const handleAddColumn = async () => {
        const { name, type, source } = architectData;
        if (!name.trim()) return;
        
        const newSchema = { 
            ...database.schema, 
            [name]: type === 'select' || type === 'relation' 
                ? { type, source: source || `3-Database/${database.id}/_properties/${name}` } 
                : { type } 
        } as any;
        
        try {
            await sidecarApi.updateVaultDatabaseSchema(database.id, newSchema);
            // Update local schema prop if possible (optimistic)
            (database.schema as any)[name] = newSchema[name];
            setArchitectMode('idle');
            setArchitectData(prev => ({ ...prev, name: '', source: '' }));
            fetchRows();
        } catch (err) {
            console.error(err);
            alert("Failed to add column");
        }
    }

    const handleEditColumn = async () => {
        const { name, type, source, oldName } = architectData;
        if (!name.trim()) return;
        
        const newSchema = { ...database.schema } as any;
        delete newSchema[oldName];
        newSchema[name] = type === 'select' || type === 'relation' 
            ? { type, source: source || `3-Database/${database.id}/_properties/${name}` } 
            : { type };
        
        try {
            await sidecarApi.updateVaultDatabaseSchema(
                database.id, 
                newSchema, 
                oldName !== name ? oldName : undefined, 
                oldName !== name ? name : undefined
            );
            (database.schema as any)[name] = newSchema[name];
            if (oldName !== name) delete (database.schema as any)[oldName];
            
            setArchitectMode('idle');
            setArchitectData(prev => ({ ...prev, name: '', source: '', oldName: '' }));
            fetchRows();
        } catch (err) {
            console.error(err);
            alert("Failed to update column");
        }
    }

    const handleDeleteColumn = async (colName: string) => {
        if (!confirm(`Remove column "${colName}"?`)) return;
        const newSchema = { ...database.schema } as any;
        delete newSchema[colName];
        try {
            await sidecarApi.updateVaultDatabaseSchema(database.id, newSchema);
            delete (database.schema as any)[colName];
            fetchRows();
        } catch (err) {
            console.error(err);
            alert("Failed to remove column");
        }
    }

    const columns = ['title', ...Object.keys(database.schema).sort()]
    
    const filteredRows = rows.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(r.properties).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-border/20">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground/50 hover:text-foreground"><ArrowLeft size={14} /></button>
                    <div className="flex items-center gap-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">{database.name}</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/30" />
                        <input
                            type="text"
                            placeholder="Filter rows"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-6 text-[10px] w-32 bg-secondary/10 border-none rounded focus:outline-none focus:ring-1 focus:ring-border/40 tracking-tight"
                        />
                    </div>
                    <button onClick={fetchRows} disabled={loading} className="p-1.5 opacity-20 hover:opacity-100 transition-opacity"><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /></button>
                    <button 
                        onClick={() => {
                            setArchitectMode('add_column');
                            setArchitectData({ name: '', type: 'str', source: '', oldName: '' });
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-widest rounded hover:bg-secondary/80 transition-colors"
                    >
                        <Plus size={10} /> Add Column
                    </button>
                    <button 
                        onClick={() => {
                            setArchitectMode('add_row');
                            setArchitectData({ name: '', type: '', source: '', oldName: '' });
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={12} /> New Row
                    </button>
                </div>
            </div>

            {/* Architect Panel */}
            {architectMode !== 'idle' && (
                <div className="p-4 border border-border/40 rounded bg-secondary/5 mb-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest">
                            {architectMode === 'add_row' && 'Create New Row'}
                            {architectMode === 'add_column' && 'Add New Column'}
                            {architectMode === 'edit_column' && `Edit Property: ${architectData.oldName}`}
                        </h3>
                        <button onClick={() => setArchitectMode('idle')} className="text-[9px] font-bold uppercase opacity-30 hover:opacity-100 transition-opacity">Cancel</button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[8px] font-black uppercase opacity-30 mb-1">Name / Title</label>
                            <input
                                autoFocus
                                type="text"
                                value={architectData.name}
                                onChange={(e) => setArchitectData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full h-8 bg-background border border-border/40 px-2 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary/50"
                                placeholder={architectMode === 'add_row' ? "Page Title" : "Property Name"}
                            />
                        </div>

                        {(architectMode === 'add_column' || architectMode === 'edit_column') && (
                            <>
                                <div className="w-[120px]">
                                    <label className="block text-[8px] font-black uppercase opacity-30 mb-1">Type</label>
                                    <select 
                                        value={architectData.type}
                                        onChange={(e) => setArchitectData(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full h-8 bg-background border border-border/40 px-2 text-xs rounded focus:outline-none"
                                    >
                                        <option value="str">Text</option>
                                        <option value="number">Number</option>
                                        <option value="bool">Checkbox</option>
                                        <option value="date">Date</option>
                                        <option value="list">List</option>
                                        <option value="select">Select</option>
                                        <option value="relation">Relation</option>
                                    </select>
                                </div>

                                {(architectData.type === 'select' || architectData.type === 'relation') && (
                                    <div className="flex-1 min-w-[300px]">
                                        <label className="block text-[8px] font-black uppercase opacity-30 mb-1">Source Folder</label>
                                        <input
                                            type="text"
                                            value={architectData.source}
                                            onChange={(e) => setArchitectData(prev => ({ ...prev, source: e.target.value }))}
                                            className="w-full h-8 bg-background border border-border/40 px-2 text-xs rounded focus:outline-none"
                                            placeholder={`3-Database/${database.id}/_properties/${architectData.name}`}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex items-end">
                            <button 
                                onClick={() => {
                                    if (architectMode === 'add_row') handleAddRow();
                                    else if (architectMode === 'add_column') handleAddColumn();
                                    else if (architectMode === 'edit_column') handleEditColumn();
                                }}
                                className="h-8 px-6 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                {architectMode === 'edit_column' ? 'Save Changes' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar pb-10">
                <div className="rounded-md border border-border/40">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-secondary/20 sticky top-0 z-10 backdrop-blur-sm border-b border-border/40">
                            <tr>
                                 {columns.map(col => (
                                    <th key={col} className="px-3 py-2 font-black uppercase tracking-wider text-[9px] text-muted-foreground whitespace-nowrap group/th relative border-r border-border/10 last:border-r-0">
                                        <div className="flex items-center justify-between gap-4">
                                            <div 
                                                className={cn(
                                                    "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
                                                    col === 'title' && "cursor-default hover:text-muted-foreground"
                                                )}
                                                onClick={() => {
                                                    if (col === 'title') return;
                                                    const meta = (database.schema as any)[col];
                                                    setArchitectMode('edit_column');
                                                    setArchitectData({
                                                        name: col,
                                                        oldName: col,
                                                        type: typeof meta === 'string' ? meta : (meta?.type || 'str'),
                                                        source: typeof meta === 'string' ? '' : (meta?.source || '')
                                                    });
                                                }}
                                            >
                                                <span>{col}</span>
                                                {col !== 'title' && <Settings size={8} className="opacity-0 group-hover/th:opacity-100 transition-opacity" />}
                                            </div>
                                            {col !== 'title' && (
                                                <button 
                                                    onClick={() => handleDeleteColumn(col)}
                                                    className="opacity-0 group-hover/th:opacity-40 hover:!opacity-100 text-destructive transition-opacity"
                                                >
                                                    <Trash size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {filteredRows.map(row => (
                                <tr key={row.id} className="hover:bg-secondary/10 group">
                                    <td 
                                        className="px-3 py-2 whitespace-nowrap font-bold max-w-[200px] truncate cursor-pointer text-primary hover:underline" 
                                        title={row.title}
                                        onClick={() => setSelectedRowId(row.id)}
                                    >
                                        {row.title}
                                    </td>
                                    {columns.slice(1).map(col => {
                                        const val = row.properties[col]
                                        const type = database.schema[col]
                                        
                                        return (
                                            <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                                                <EditableCell 
                                                    initialValue={val} 
                                                    type={type} 
                                                    onSave={(newValue) => handleUpdate(row.id, col, newValue)} 
                                                    onNavigate={onNavigate}
                                                />
                                            </td>
                                        )
                                    })}
                                    <td className="px-3 py-2 text-right">
                                        <button onClick={() => handleDeleteRow(row.id)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 text-destructive transition-opacity">
                                            <Trash size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={columns.length + 1} className="px-3 py-8 text-center text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest">
                                        No rows found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                    onUpdateProperty={(prop, val) => handleUpdate(selectedRowId, prop, val)}
                    onNavigate={onNavigate}
                    onDelete={() => handleDeleteRow(selectedRowId)}
                />
            )}
        </div>
    )
}
