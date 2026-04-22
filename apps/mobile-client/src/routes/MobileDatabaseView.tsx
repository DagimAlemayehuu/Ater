import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, RefreshCw, Plus, Search, Table, Kanban, 
    LayoutGrid, Settings, ChevronDown, FileText, X, 
    Filter, ArrowUpDown, List, MoreVertical, Database as DatabaseIcon
} from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { safeStorage } from '@/lib/safeStorage'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from '@/components/ui/sheet'
import { MobileTableView } from '@/components/obsidian/views/MobileTableView'
import { MobileBoardView } from '@/components/obsidian/views/MobileBoardView'
import { MobileGalleryView } from '@/components/obsidian/views/MobileGalleryView'

export default function MobileDatabaseView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [database, setDatabase] = useState<any>(null)
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'table' | 'board' | 'gallery' | 'list'>('table')
    
    // View Settings State
    const [savedViews, setSavedViews] = useState<any[]>([])
    const [activeViewId, setActiveViewId] = useState<string>('default')
    const [hiddenProperties, setHiddenProperties] = useState<string[]>([])
    const [sortConfigs, setSortConfigs] = useState<{ col: string, dir: 'asc' | 'desc' }[]>([])
    const [filters, setFilters] = useState<any[]>([])
    const [filterGroupId, setFilterGroupId] = useState<'AND' | 'OR'>('AND')
    const [groupBy, setGroupBy] = useState<string | null>(null)
    
    // UI State
    const [isCreating, setIsCreating] = useState(false)
    const [newRowTitle, setNewRowTitle] = useState('')
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Load Database Metadata & Views
    useEffect(() => {
        const loadMetadata = async () => {
            if (!id) return
            try {
                // In mobile, we might need to fetch the database info from the list
                const dbsRes = await sidecarApi.listVaultDatabases()
                const db = dbsRes.databases.find(d => d.id === id)
                if (db) setDatabase(db)

                // Load Views from LocalStorage
                const stored = localStorage.getItem(`lifeos_mobile_db_views_${id}`);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (parsed.views && parsed.views.length > 0) {
                            setSavedViews(parsed.views);
                            const view = parsed.views.find((v: any) => v.id === parsed.activeId) || parsed.views[0];
                            setActiveViewId(view.id);
                            setActiveTab(view.activeTab || 'table');
                            setHiddenProperties(view.hiddenProperties || []);
                            setSortConfigs(view.sortConfigs || []);
                            setFilters(view.filters || []);
                            setFilterGroupId(view.filterGroupId || 'AND');
                            setGroupBy(view.groupBy || null);
                            return;
                        }
                    } catch (e) {}
                }
                
                // Default View
                const defaultView = {
                    id: 'default',
                    name: 'Default View',
                    activeTab: 'table',
                    hiddenProperties: [],
                    sortConfigs: [],
                    filters: [],
                    filterGroupId: 'AND',
                    groupBy: null
                };
                setSavedViews([defaultView]);
                setActiveViewId('default');
            } catch (err) {
                console.error("Failed to load DB metadata", err)
            }
        }
        loadMetadata()
    }, [id])

    // Load Rows
    const fetchRows = async () => {
        if (!id) return
        setLoading(true)
        try {
            const res = await sidecarApi.listVaultDatabaseRows(id)
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
        if (id) {
            fetchRows()
            fetchTemplates()
        }
    }, [id])

    // Save View Changes
    const saveCurrentView = (updates: any) => {
        setSavedViews(prev => {
            const newViews = prev.map(v => v.id === activeViewId ? { ...v, ...updates } : v);
            safeStorage.setItem(`lifeos_mobile_db_views_${id}`, JSON.stringify({
                views: newViews,
                activeId: activeViewId
            }));
            return newViews;
        });
    };

    const handleCreateRow = async () => {
        if (!newRowTitle.trim() || !id) return
        try {
            setLoading(true)
            await sidecarApi.createVaultRow(id, newRowTitle.trim(), { template: selectedTemplate })
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

    // Processing Rows (Search, Filter, Sort)
    const processedRows = useMemo(() => {
        let result = [...rows]

        // Search
        if (searchQuery) {
            result = result.filter(row => 
                JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Apply Filters (Parity with Desktop)
        if (filters.length > 0) {
            result = result.filter(row => {
                const results = filters.map(f => {
                    const val = row[f.col];
                    if (f.op === 'contains') return String(val || '').toLowerCase().includes(f.val.toLowerCase());
                    if (f.op === 'equals') return String(val || '').toLowerCase() === f.val.toLowerCase();
                    if (f.op === 'is_empty') return !val;
                    if (f.op === 'not_empty') return !!val;
                    return true;
                });
                return filterGroupId === 'AND' ? results.every(r => r) : results.some(r => r);
            });
        }

        // Apply Sorting
        if (sortConfigs.length > 0) {
            result.sort((a, b) => {
                for (const sort of sortConfigs) {
                    const valA = a[sort.col] || '';
                    const valB = b[sort.col] || '';
                    if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
                    if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result
    }, [rows, searchQuery, filters, filterGroupId, sortConfigs])

    const handleNavigateToNote = (path: string) => {
        navigate(`/note/${encodeURIComponent(path)}`)
    }

    if (!database) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <RefreshCw className="animate-spin text-primary/20" size={32} />
                <span className="label-sm opacity-40 uppercase tracking-widest">Accessing Module...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-500 overflow-hidden">
            {/* Header Toolbar */}
            <header className="h-16 border-b border-border/50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/obsidian')} className="active:scale-90 transition-transform">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-[13px] font-black uppercase tracking-tight truncate max-w-[150px]">
                            {database.name}
                        </h1>
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Database_Module</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={fetchRows} disabled={loading} className={cn(loading && "animate-spin")}>
                        <RefreshCw size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                        <Settings size={18} />
                    </Button>
                    <Button 
                        size="icon" 
                        onClick={() => setIsCreating(true)} 
                        className="bg-primary text-primary-foreground rounded-full size-8 ml-2 active:scale-90 transition-transform"
                    >
                        <Plus size={18} />
                    </Button>
                </div>
            </header>

            {/* View & Search Control */}
            <div className="px-4 py-3 flex flex-col gap-3 border-b border-border/10 bg-muted/5">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={12} />
                    <input 
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/10 border border-border/40 p-2.5 pl-9 text-[11px] font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all uppercase tracking-widest"
                    />
                </div>
                
                <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-xl">
                    {[
                        { id: 'table', icon: Table, label: 'Table' },
                        { id: 'board', icon: Kanban, label: 'Board' },
                        { id: 'gallery', icon: LayoutGrid, label: 'Gallery' },
                        { id: 'list', icon: List, label: 'List' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); saveCurrentView({ activeTab: tab.id }); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab.id 
                                    ? "bg-background text-primary shadow-sm" 
                                    : "text-muted-foreground/50"
                            )}
                        >
                            <tab.icon size={12} />
                            <span className="hidden xs:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 overflow-hidden relative">
                {activeTab === 'table' && (
                    <MobileTableView 
                        rows={processedRows} 
                        schema={database.schema} 
                        hiddenProperties={hiddenProperties}
                        onSelect={(row) => handleNavigateToNote(`3-Database/${database.id}/${row.id}`)}
                        onUpdate={(rowId, updates) => sidecarApi.updateVaultRow(database.id, rowId, updates).then(fetchRows)}
                    />
                )}
                {activeTab === 'board' && (
                    <MobileBoardView 
                        rows={processedRows} 
                        schema={database.schema} 
                        groupBy={groupBy}
                        hiddenProperties={hiddenProperties}
                        onSelect={(row) => handleNavigateToNote(`3-Database/${database.id}/${row.id}`)}
                    />
                )}
                {activeTab === 'gallery' && (
                    <MobileGalleryView 
                        rows={processedRows} 
                        schema={database.schema} 
                        hiddenProperties={hiddenProperties}
                        onSelect={(row) => handleNavigateToNote(`3-Database/${database.id}/${row.id}`)}
                    />
                )}
                {activeTab === 'list' && (
                    <ScrollArea className="h-full">
                        <div className="flex flex-col divide-y divide-border/5">
                            {processedRows.map(row => (
                                <button 
                                    key={row.id} 
                                    onClick={() => handleNavigateToNote(`3-Database/${database.id}/${row.id}`)}
                                    className="p-4 flex items-center gap-4 text-left hover:bg-muted/10 active:bg-muted/20 transition-all"
                                >
                                    <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary/40 shrink-0">
                                        <FileText size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-bold text-foreground truncate">{row.title || row.id}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest truncate">
                                                {Object.keys(database.schema).filter(k => row[k]).slice(0, 2).map(k => `${k}: ${row[k]}`).join(' · ')}
                                            </span>
                                        </div>
                                    </div>
                                    <DatabaseIcon size={14} className="text-muted-foreground/10" />
                                </button>
                            ))}
                        </div>
                        <div className="h-40" />
                    </ScrollArea>
                )}

                {loading && rows.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-20">
                        <div className="size-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing_Vault</span>
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                        <div className="p-8 flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black tracking-tight">Initialize Record</h2>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">Atomic_Ingestion</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="bg-white/5 rounded-full">
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Identifier</label>
                                    <input 
                                        autoFocus
                                        placeholder="Record name..."
                                        value={newRowTitle}
                                        onChange={(e) => setNewRowTitle(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/10"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Structural Template</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setSelectedTemplate(null)}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                                                selectedTemplate === null 
                                                    ? "bg-primary text-primary-foreground border-primary" 
                                                    : "bg-white/5 border-white/5 text-muted-foreground/40"
                                            )}
                                        >
                                            <FileText size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Empty</span>
                                        </button>
                                        {templates.slice(0, 3).map(t => (
                                            <button 
                                                key={t.path}
                                                onClick={() => setSelectedTemplate(t.path)}
                                                className={cn(
                                                    "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left truncate",
                                                    selectedTemplate === t.path 
                                                        ? "bg-primary text-primary-foreground border-primary" 
                                                        : "bg-white/5 border-white/5 text-muted-foreground/40"
                                                )}
                                            >
                                                <FileText size={16} className="shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-widest truncate">{t.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button 
                                onClick={handleCreateRow}
                                disabled={!newRowTitle.trim() || loading}
                                className="w-full py-8 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Deploy Record'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Drawer */}
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-[2.5rem] p-0 border-t-4 border-primary/20">
                    <SheetHeader className="p-8 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1 text-left">
                                <SheetTitle className="text-xl font-black tracking-tight uppercase">Module Settings</SheetTitle>
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">Configuration_Interface</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)} className="bg-muted/10 rounded-full">
                                <X size={20} />
                            </Button>
                        </div>
                    </SheetHeader>
                    
                    <ScrollArea className="h-full">
                        <div className="p-8 space-y-10">
                            {/* Views Section */}
                            <section className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Saved Views</label>
                                <div className="space-y-2">
                                    {savedViews.map(view => (
                                        <button 
                                            key={view.id}
                                            onClick={() => {
                                                setActiveViewId(view.id);
                                                setActiveTab(view.activeTab);
                                                setHiddenProperties(view.hiddenProperties || []);
                                                setSortConfigs(view.sortConfigs || []);
                                                setFilters(view.filters || []);
                                                setFilterGroupId(view.filterGroupId || 'AND');
                                                setGroupBy(view.groupBy || null);
                                                setIsSettingsOpen(false);
                                            }}
                                            className={cn(
                                                "w-full p-5 rounded-2xl flex items-center justify-between border transition-all",
                                                activeViewId === view.id 
                                                    ? "bg-primary/5 border-primary/20 text-primary" 
                                                    : "bg-muted/5 border-transparent text-muted-foreground/60"
                                            )}
                                        >
                                            <span className="text-[11px] font-black uppercase tracking-widest">{view.name}</span>
                                            {activeViewId === view.id && <div className="size-2 bg-primary rounded-full" />}
                                        </button>
                                    ))}
                                    <Button variant="ghost" className="w-full py-6 border-2 border-dashed border-border/40 rounded-2xl gap-3 text-muted-foreground/60">
                                        <Plus size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add View Template</span>
                                    </Button>
                                </div>
                            </section>

                            {/* Properties Section */}
                            <section className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Visible Properties</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.keys(database.schema).map(prop => (
                                        <button 
                                            key={prop}
                                            onClick={() => {
                                                const next = hiddenProperties.includes(prop) 
                                                    ? hiddenProperties.filter(p => p !== prop)
                                                    : [...hiddenProperties, prop];
                                                setHiddenProperties(next);
                                                saveCurrentView({ hiddenProperties: next });
                                            }}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                                !hiddenProperties.includes(prop) 
                                                    ? "bg-primary/5 border-primary/20 text-primary" 
                                                    : "bg-muted/5 border-transparent text-muted-foreground/20"
                                            )}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{prop}</span>
                                            <div className={cn(
                                                "size-5 rounded-md flex items-center justify-center transition-all",
                                                !hiddenProperties.includes(prop) ? "bg-primary text-primary-foreground" : "bg-muted/10"
                                            )}>
                                                {!hiddenProperties.includes(prop) && <Plus size={12} className="rotate-45" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Grouping Section */}
                            <section className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Grouping</label>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => { setGroupBy(null); saveCurrentView({ groupBy: null }); }}
                                        className={cn(
                                            "px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
                                            groupBy === null ? "bg-primary text-primary-foreground border-primary" : "bg-muted/5 border-border/40 text-muted-foreground/40"
                                        )}
                                    >
                                        None
                                    </button>
                                    {Object.keys(database.schema).map(prop => (
                                        <button 
                                            key={prop}
                                            onClick={() => { setGroupBy(prop); saveCurrentView({ groupBy: prop }); }}
                                            className={cn(
                                                "px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
                                                groupBy === prop ? "bg-primary text-primary-foreground border-primary" : "bg-muted/5 border-border/40 text-muted-foreground/40"
                                            )}
                                        >
                                            {prop}
                                        </button>
                                    ))}
                                </div>
                            </section>
                            
                            {/* Sorting Section */}
                            <section className="space-y-4">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Sorting</label>
                                <div className="space-y-2">
                                    {sortConfigs.map((sort, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted/10 p-4 rounded-2xl flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{sort.col}</span>
                                                <button 
                                                    onClick={() => {
                                                        const next = [...sortConfigs];
                                                        next[i].dir = next[i].dir === 'asc' ? 'desc' : 'asc';
                                                        setSortConfigs(next);
                                                        saveCurrentView({ sortConfigs: next });
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-primary"
                                                >
                                                    <ArrowUpDown size={10} />
                                                    <span className="text-[8px] font-black uppercase">{sort.dir}</span>
                                                </button>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => {
                                                    const next = sortConfigs.filter((_, idx) => idx !== i);
                                                    setSortConfigs(next);
                                                    saveCurrentView({ sortConfigs: next });
                                                }}
                                                className="text-destructive/40"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {Object.keys(database.schema).filter(p => !sortConfigs.find(s => s.col === p)).map(prop => (
                                            <button 
                                                key={prop}
                                                onClick={() => {
                                                    const next: {col: string, dir: 'asc' | 'desc'}[] = [...sortConfigs, { col: prop, dir: 'asc' as const }];
                                                    setSortConfigs(next);
                                                    saveCurrentView({ sortConfigs: next });
                                                }}
                                                className="px-4 py-2 rounded-full border border-border/40 text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 hover:border-primary/20 hover:text-primary transition-all"
                                            >
                                                + {prop}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <div className="h-40" />
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    )
}
