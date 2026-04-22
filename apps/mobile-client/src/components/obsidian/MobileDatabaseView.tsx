import React, { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, RefreshCw, Plus, Search, Table, Kanban, LayoutGrid, Settings, ChevronDown, FileText, X } from 'lucide-react'
import { sidecarApi } from '../../lib/sidecarApi'
import { cn } from '../../lib/utils'
import { MobileTableView } from './views/MobileTableView'
import { MobileBoardView } from './views/MobileBoardView'
import { MobileGalleryView } from './views/MobileGalleryView'

interface MobileDatabaseViewProps {
    database: {
        id: string
        name: string
        schema: Record<string, any>
    }
    onBack: () => void
    onNavigate: (path: string) => void
}

export function MobileDatabaseView({ database, onBack, onNavigate }: MobileDatabaseViewProps) {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'table' | 'board' | 'gallery'>('table')
    const [isCreating, setIsCreating] = useState(false)
    const [newRowTitle, setNewRowTitle] = useState('')
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

    const fetchRows = async () => {
        setLoading(true)
        try {
            const res = await sidecarApi.listVaultDatabaseRows(database.id)
            setRows(res.results || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchTemplates = async () => {
        try {
            const res = await sidecarApi.listVaultTemplates()
            setTemplates(res.templates || [])
        } catch (err) {}
    }

    useEffect(() => {
        fetchRows()
        fetchTemplates()
    }, [database.id])

    const handleCreateRow = async () => {
        if (!newRowTitle.trim()) return
        try {
            setLoading(true)
            await sidecarApi.createVaultRow(database.id, newRowTitle.trim(), { template: selectedTemplate })
            setNewRowTitle('')
            setIsCreating(false)
            setSelectedTemplate(null)
            await fetchRows()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredRows = useMemo(() => {
        if (!searchQuery) return rows
        return rows.filter(row => 
            JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [rows, searchQuery])

    return (
        <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 active:scale-90 transition-transform">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-[15px] font-black tracking-tight leading-none">{database.name}</h1>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Database</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchRows} className={cn("p-2 active:rotate-180 transition-all duration-500", loading && "animate-spin")}>
                        <RefreshCw size={18} className="text-muted-foreground" />
                    </button>
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center justify-center size-8 bg-primary text-primary-foreground rounded-full active:scale-90 transition-transform shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Search & Tabs */}
            <div className="px-4 py-3 flex flex-col gap-4 border-b border-white/5 bg-black/10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                    />
                </div>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                    {[
                        { id: 'table', icon: Table, label: 'Table' },
                        { id: 'board', icon: Kanban, label: 'Board' },
                        { id: 'gallery', icon: LayoutGrid, label: 'Gallery' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all",
                                activeTab === tab.id 
                                    ? "bg-white/10 text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'table' && (
                    <MobileTableView 
                        rows={filteredRows} 
                        schema={database.schema} 
                        onSelect={(row) => onNavigate(`3-Database/${database.id}/${row.id}`)}
                        onUpdate={(rowId, updates) => sidecarApi.updateVaultRow(database.id, rowId, updates).then(fetchRows)}
                    />
                )}
                {activeTab === 'board' && (
                    <MobileBoardView 
                        rows={filteredRows} 
                        schema={database.schema} 
                        onSelect={(row) => onNavigate(`3-Database/${database.id}/${row.id}`)}
                    />
                )}
                {activeTab === 'gallery' && (
                    <MobileGalleryView 
                        rows={filteredRows} 
                        schema={database.schema} 
                        onSelect={(row) => onNavigate(`3-Database/${database.id}/${row.id}`)}
                    />
                )}

                {loading && rows.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-20">
                        <div className="size-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing</span>
                    </div>
                )}
            </div>

            {/* Create Modal Overlay */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black tracking-tight">New Record</h2>
                                <button onClick={() => setIsCreating(false)} className="p-2 bg-white/5 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</label>
                                    <input 
                                        autoFocus
                                        type="text"
                                        placeholder="Identifier name..."
                                        value={newRowTitle}
                                        onChange={(e) => setNewRowTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Template</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setSelectedTemplate(null)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                                                selectedTemplate === null 
                                                    ? "bg-primary/10 border-primary text-primary" 
                                                    : "bg-white/5 border-white/5 text-muted-foreground"
                                            )}
                                        >
                                            <FileText size={16} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">Empty</span>
                                        </button>
                                        {templates.slice(0, 3).map(t => (
                                            <button 
                                                key={t.path}
                                                onClick={() => setSelectedTemplate(t.path)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left truncate",
                                                    selectedTemplate === t.path 
                                                        ? "bg-primary/10 border-primary text-primary" 
                                                        : "bg-white/5 border-white/5 text-muted-foreground"
                                                )}
                                            >
                                                <FileText size={16} className="shrink-0" />
                                                <span className="text-[11px] font-bold uppercase tracking-wider truncate">{t.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleCreateRow}
                                disabled={!newRowTitle.trim() || loading}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? 'Initializing...' : 'Initialize Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
