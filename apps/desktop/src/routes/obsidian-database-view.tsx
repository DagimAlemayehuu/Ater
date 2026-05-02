import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
    Search, Plus, RefreshCw, LayoutGrid, List, Calendar, Table, 
    ChevronLeft, Download, Filter, Settings2
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { TableView } from '@/components/obsidian/views/TableView'
import { ListView } from '@/components/obsidian/views/ListView'
import { CalendarView } from '@/components/obsidian/views/CalendarView'
import { BoardView } from '@/components/obsidian/views/BoardView'
import { GalleryView } from '@/components/obsidian/views/GalleryView'
import { ObsidianPagePanel } from '@/components/obsidian/ObsidianPagePanel'

interface ObsidianDatabaseViewProps {
    database: any
    onBack: () => void
    onNavigate: (pageName: string) => void
    onRefresh: () => void
    initialSelectedRowId?: string | null
}

export default function ObsidianDatabaseView({ database, onBack, onNavigate, initialSelectedRowId }: ObsidianDatabaseViewProps) {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedView, setSelectedView] = useState<any>(null)
    const [selectedRowId, setSelectedRowId] = useState<string | null>(initialSelectedRowId || null)
    const [groupBy, setGroupBy] = useState<string | null>(null)

    const fetchRows = useCallback(async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.listVaultDatabaseRows(database.id)
            setRows(res.results || [])
        } catch (err) {
            console.error("Fetch rows failed", err)
        } finally {
            setLoading(false)
        }
    }, [database.id])

    useEffect(() => {
        fetchRows()
    }, [fetchRows])

    useEffect(() => {
        if (database.views && database.views.length > 0 && !selectedView) {
            setSelectedView(database.views[0])
        }
    }, [database.views, selectedView])

    useEffect(() => {
        if (initialSelectedRowId) {
            setSelectedRowId(initialSelectedRowId)
        }
    }, [initialSelectedRowId])

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            const searchStr = searchQuery.toLowerCase()
            return Object.values(row.properties).some((val: any) => 
                String(val).toLowerCase().includes(searchStr)
            )
        })
    }, [rows, searchQuery])

    const handleUpdateRow = async (rowId: string, updates: any) => {
        try {
            await sidecarApi.updateVaultRow(database.id, rowId, updates)
            await fetchRows()
        } catch (err) {
            console.error("Update row failed", err)
        }
    }

    const handleDeleteRow = async (rowId: string) => {
        try {
            await sidecarApi.deleteVaultRow(database.id, rowId)
            await fetchRows()
            if (selectedRowId === rowId) setSelectedRowId(null)
        } catch (err) {
            console.error("Delete row failed", err)
        }
    }

    const handleAddRow = async () => {
        try {
            const title = `New Record ${new Date().getTime()}`
            const res = await sidecarApi.createVaultRow(database.id, title, {})
            await fetchRows()
            setSelectedRowId(res.id)
        } catch (err) {
            console.error("Add row failed", err)
        }
    }

    const renderView = () => {
        const viewType = selectedView?.type || 'table'
        
        const commonProps = {
            rows: filteredRows,
            schema: database.schema,
            onSelectRow: (rowOrId: any) => {
                if (typeof rowOrId === 'string') setSelectedRowId(rowOrId)
                else if (rowOrId?.id) setSelectedRowId(rowOrId.id)
            },
            onUpdateRow: handleUpdateRow,
            onDeleteRow: handleDeleteRow,
            onNavigate: onNavigate,
            loading: loading
        }

        switch (viewType) {
            case 'table': return <TableView {...commonProps} />
            case 'list': return <ListView {...commonProps} />
            case 'calendar': return <CalendarView {...commonProps} dateProperty={groupBy || 'date'} />
            case 'board': return <BoardView {...commonProps} groupBy={groupBy || 'status'} />
            case 'gallery': return <GalleryView {...commonProps} />
            default: return <TableView {...commonProps} />
        }
    }

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            {/* High-Fidelity Header */}
            <div className="flex items-center justify-between px-10 py-8 border-b border-border/10 bg-muted/[0.02]">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-3 hover:bg-muted rounded-xl transition-all border border-border/40 text-muted-foreground/40 hover:text-foreground">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">Module Registry</span>
                        <h1 className="text-xl font-black tracking-tighter uppercase text-foreground/80">{database.name}</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/20 group-focus-within:text-foreground transition-all" size={14} />
                        <input 
                            type="text"
                            placeholder="FILTER REGISTRY..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-muted/10 border border-border/40 rounded-xl pl-10 pr-6 py-2.5 text-[10px] font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all w-80 placeholder:text-muted-foreground/10"
                        />
                    </div>
                    
                    <button 
                        onClick={fetchRows}
                        disabled={loading}
                        className="p-3 hover:bg-muted rounded-xl transition-all border border-border/40 text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
                    >
                        <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                    </button>
                    
                    <button 
                        onClick={handleAddRow}
                        className="flex items-center gap-3 bg-foreground text-background px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.3em] uppercase hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-foreground/5"
                    >
                        <Plus size={16} />
                        Append
                    </button>
                </div>
            </div>

            {/* View Selector & Controls */}
            <div className="flex items-center justify-between px-10 py-3 bg-muted/[0.01] border-b border-border/10">
                <div className="flex items-center gap-1.5 p-1 bg-muted/10 rounded-lg border border-border/5">
                    {database.views?.map((view: any) => (
                        <button
                            key={view.id}
                            onClick={() => setSelectedView(view)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                                selectedView?.id === view.id 
                                    ? "bg-background text-foreground shadow-sm border border-border/20" 
                                    : "text-muted-foreground/30 hover:text-muted-foreground"
                            )}
                        >
                            {view.type === 'table' && <Table size={12} />}
                            {view.type === 'list' && <List size={12} />}
                            {view.type === 'calendar' && <Calendar size={12} />}
                            {view.type === 'board' && <LayoutGrid size={12} />}
                            {view.type === 'gallery' && <LayoutGrid size={12} />}
                            <span className="hidden sm:inline">{view.name}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">Grouping</span>
                        <div className="flex items-center gap-2 bg-muted/10 px-3 py-1.5 rounded-md border border-border/5">
                            <Settings2 size={12} className="text-muted-foreground/30" />
                            <select 
                                value={groupBy || ''} 
                                onChange={(e) => setGroupBy(e.target.value || null)}
                                className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 focus:ring-0 cursor-pointer p-0"
                            >
                                <option value="">Auto</option>
                                {Object.entries(database.schema || {}).map(([key, _]: [string, any]) => (
                                    <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-muted rounded-md text-muted-foreground/20 hover:text-foreground transition-all">
                        <Download size={14} />
                    </button>
                </div>
            </div>

            {/* View Content */}
            <div className="flex-1 overflow-hidden relative p-10">
                {loading && rows.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                        <RefreshCw className="animate-spin text-muted-foreground/20" size={32} />
                    </div>
                ) : (
                    <div className="h-full overflow-hidden border border-border/10 rounded-2xl shadow-2xl shadow-foreground/[0.02]">
                        {renderView()}
                    </div>
                )}
            </div>

            {/* Side Panel for Selected Row */}
            {selectedRowId && (
                <ObsidianPagePanel 
                    isOpen={!!selectedRowId}
                    onClose={() => setSelectedRowId(null)}
                    fullPath={`3-Database/${database.id}/${selectedRowId}.md`}
                    onNavigate={onNavigate}
                    onDeleted={async () => {
                        setSelectedRowId(null);
                        await fetchRows();
                    }}
                />
            )}
        </div>
    )
}
