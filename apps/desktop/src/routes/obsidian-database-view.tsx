import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
    Search, Plus, RefreshCw, LayoutGrid, List, Calendar, Table, 
    ChevronLeft, Download
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
        if (!confirm('Are you sure you want to delete this row?')) return
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
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">{database.name}</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">{rows.length} ITEMS</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                        <input 
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-muted/30 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
                        />
                    </div>
                    
                    <button 
                        onClick={fetchRows}
                        disabled={loading}
                        className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                    </button>
                    
                    <button 
                        onClick={handleAddRow}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold tracking-tight hover:opacity-90 active:scale-95 transition-all"
                    >
                        <Plus size={16} />
                        ADD
                    </button>
                </div>
            </div>

            {/* View Selector & Controls */}
            <div className="flex items-center justify-between px-6 py-2 bg-muted/20 border-b border-border/50">
                <div className="flex items-center gap-1">
                    {database.views?.map((view: any) => (
                        <button
                            key={view.id}
                            onClick={() => setSelectedView(view)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all",
                                selectedView?.id === view.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {view.type === 'table' && <Table size={14} />}
                            {view.type === 'list' && <List size={14} />}
                            {view.type === 'calendar' && <Calendar size={14} />}
                            {view.type === 'board' && <LayoutGrid size={14} />}
                            {view.type === 'gallery' && <LayoutGrid size={14} />}
                            {view.name.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Group</span>
                        <select 
                            value={groupBy || ''} 
                            onChange={(e) => setGroupBy(e.target.value || null)}
                            className="bg-transparent border-none text-[11px] font-bold uppercase tracking-tight focus:ring-0 cursor-pointer"
                        >
                            <option value="">None</option>
                            {Object.entries(database.schema || {}).map(([key, _]: [string, any]) => (
                                <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* View Content */}
            <div className="flex-1 overflow-hidden relative">
                {loading && rows.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                        <RefreshCw className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="h-full overflow-auto custom-scrollbar">
                        {renderView()}
                    </div>
                )}
            </div>

            {/* Side Panel for Selected Row */}
            {selectedRowId && (
                <ObsidianPagePanel 
                    isOpen={!!selectedRowId}
                    onClose={() => setSelectedRowId(null)}
                    fullPath={`3-Database/${database.id}/${selectedRowId}`}
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
