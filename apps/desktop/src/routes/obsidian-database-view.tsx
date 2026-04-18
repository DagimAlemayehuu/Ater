import React, { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, RefreshCw, Plus, Search, Table, Kanban, LayoutGrid, Filter, ArrowUpDown, MoreVertical, FileText, ChevronDown, Calendar, Settings, Download, List } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'

import { CalendarView } from '@/components/obsidian/views/CalendarView'
import { TableView } from '@/components/obsidian/views/TableView'
import { BoardView } from '@/components/obsidian/views/BoardView'
import { GalleryView } from '@/components/obsidian/views/GalleryView'
import { ListView } from '@/components/obsidian/views/ListView'
import { ChartView } from '@/components/obsidian/views/ChartView'
import { TimelineView } from '@/components/obsidian/views/TimelineView'
import { ObsidianPagePanel } from '@/components/obsidian/ObsidianPagePanel'
import { DatabaseSettingsPanel } from '@/components/obsidian/DatabaseSettingsPanel'
import { Button } from '@/components/ui/button'

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
    const [activeTab, setActiveTab] = useState<'table' | 'board' | 'gallery' | 'calendar' | 'list' | 'chart' | 'timeline'>('table')
    
    // Settings State
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [isCreatingRow, setIsCreatingRow] = useState(false)
    const [newRowName, setNewRowName] = useState('')
    
    // Templates State
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([])
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
    
    // Persistent Views State
    const [savedViews, setSavedViews] = useState<any[]>([])
    const [activeViewId, setActiveViewId] = useState<string>('default')
    const [viewMenuOpenId, setViewMenuOpenId] = useState<string | null>(null)
    
    // Current View State
    const [hiddenProperties, setHiddenProperties] = useState<string[]>([])
    const [sortConfigs, setSortConfigs] = useState<{ col: string, dir: 'asc' | 'desc' }[]>([])
    const [filterGroupId, setFilterGroupId] = useState<'AND' | 'OR'>('AND')
    const [filters, setFilters] = useState<any[]>([])
    const [groupBy, setGroupBy] = useState<string | null>(null)
    const [isLocked, setIsLocked] = useState(false)

    // Load Views from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem(`lifeos_db_views_${database.id}`);
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
                    setIsLocked(!!parsed.isLocked);
                    return;
                }
            } catch (e) {}
        }
        
        // Default View if none exists
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
        setIsLocked(false);
    }, [database.id]);

    // Save View Changes
    const saveCurrentView = (updates: any) => {
        setSavedViews(prev => {
            const newViews = prev.map(v => v.id === activeViewId ? { ...v, ...updates } : v);
            localStorage.setItem(`lifeos_db_views_${database.id}`, JSON.stringify({
                views: newViews,
                activeId: activeViewId,
                isLocked
            }));
            return newViews;
        });
    };

    const handleSwitchView = (id: string) => {
        const view = savedViews.find(v => v.id === id);
        if (!view) return;
        setActiveViewId(id);
        setActiveTab(view.activeTab || 'table');
        setHiddenProperties(view.hiddenProperties || []);
        setSortConfigs(view.sortConfigs || []);
        setFilters(view.filters || []);
        setFilterGroupId(view.filterGroupId || 'AND');
        setGroupBy(view.groupBy || null);
        
        localStorage.setItem(`lifeos_db_views_${database.id}`, JSON.stringify({
            views: savedViews,
            activeId: id,
            isLocked
        }));
    };

    const handleCreateView = () => {
        const newView = {
            id: Math.random().toString(36).slice(2, 9),
            name: `New View ${savedViews.length + 1}`,
            activeTab: 'table',
            hiddenProperties: [],
            sortConfigs: [],
            filters: [],
            filterGroupId: 'AND',
            groupBy: null
        };
        const newViews = [...savedViews, newView];
        setSavedViews(newViews);
        handleSwitchView(newView.id);
    };

    const handleDeleteView = (id: string) => {
        if (savedViews.length <= 1) return;
        const newViews = savedViews.filter(v => v.id !== id);
        setSavedViews(newViews);
        if (activeViewId === id) {
            handleSwitchView(newViews[0].id);
        }
    };

    const handleRenameView = (id: string, newName: string) => {
        const newViews = savedViews.map(v => v.id === id ? { ...v, name: newName } : v);
        setSavedViews(newViews);
        saveCurrentView({}); // just trigger save to storage
    };

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
            const res = await sidecarApi.listVaultTemplates();
            setAvailableTemplates(res.templates || []);
        } catch (err) {}
    }

    useEffect(() => {
        fetchRows();
        fetchTemplates();
    }, [database.id])

    const handleCreateRow = async (templatePath?: string) => {
        if (!newRowName.trim()) return;
        try {
            setLoading(true);
            await sidecarApi.createVaultDatabaseRow(database.id, newRowName.trim(), templatePath);
            setNewRowName('');
            setIsCreatingRow(false);
            setIsTemplateMenuOpen(false);
            await fetchRows();
        } catch (err) {
            console.error(err);
            alert("Failed to create record");
        } finally {
            setLoading(false);
        }
    }

    const handleRowClick = (rowId: string) => {
        setSelectedRowId(rowId)
    }

    const handleUpdateRow = async (rowId: string, updates: any) => {
        try {
            await sidecarApi.updateVaultDatabaseRow(database.id, rowId, updates);
            await fetchRows();
        } catch (err) {
            console.error(err);
        }
    }

    const handleDeleteRow = async (rowId: string) => {
        if (!confirm("Are you sure? This will delete the markdown file.")) return;
        try {
            await sidecarApi.deleteVaultDatabaseRow(database.id, rowId);
            await fetchRows();
        } catch (err) {
            console.error(err);
        }
    }

    const filteredRows = useMemo(() => {
        let result = rows.filter(row => {
            const content = JSON.stringify(row).toLowerCase()
            return content.includes(searchQuery.toLowerCase())
        });

        // Apply Filters
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

        return result;
    }, [rows, searchQuery, filters, filterGroupId, sortConfigs]);

    return (
        <div className="flex-1 flex flex-col h-full bg-background text-foreground overflow-hidden">
            {/* Database Header Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 bg-background/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[14px] font-bold tracking-tight">{database.name}</h2>
                            {isLocked && <div className="text-[10px] font-bold text-muted-foreground uppercase border border-border px-1.5 py-0.5 rounded">Locked</div>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                        <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-muted border border-border text-[12px] px-3 py-1.5 pl-8 rounded-md focus:outline-none focus:ring-1 focus:ring-ring w-48 transition-all focus:w-64 placeholder:text-muted-foreground/60"
                        />
                    </div>
                    
                    <button onClick={fetchRows} className={cn("p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-all", loading && "animate-spin")}>
                        <RefreshCw size={16} />
                    </button>
                    
                    <button onClick={() => setSettingsOpen(!settingsOpen)} className={cn("p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-all", settingsOpen && "bg-muted text-foreground")}>
                        <Settings size={16} />
                    </button>

                    <Button onClick={() => setIsCreatingRow(true)} size="sm" className="h-8 gap-2 px-3 text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:opacity-90">
                        <Plus size={14} /> New
                    </Button>
                </div>
            </div>

            {/* View Tabs Bar */}
            <div className="flex items-center justify-between px-6 border-b border-border bg-muted/20 shrink-0">
                <div className="flex items-center gap-1 -mb-[1px] overflow-x-auto no-scrollbar">
                    {savedViews.map(view => (
                        <div key={view.id} className="relative group flex items-center">
                            <button
                                onClick={() => handleSwitchView(view.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap",
                                    activeViewId === view.id 
                                        ? "border-primary text-foreground bg-background/50" 
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {view.activeTab === 'table' && <Table size={12} />}
                                {view.activeTab === 'board' && <Kanban size={12} />}
                                {view.activeTab === 'gallery' && <LayoutGrid size={12} />}
                                {view.activeTab === 'calendar' && <Calendar size={12} />}
                                {view.activeTab === 'list' && <List size={12} />}
                                {view.name}
                            </button>
                            {activeViewId === view.id && !isLocked && (
                                <button 
                                    onClick={() => setViewMenuOpenId(viewMenuOpenId === view.id ? null : view.id)}
                                    className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronDown size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                    {!isLocked && (
                        <button onClick={handleCreateView} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="New View">
                            <Plus size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4 py-1.5">
                    <div className="flex items-center gap-1.5 p-1 bg-background/50 rounded-lg border border-border shadow-sm">
                        {[
                            { id: 'table', icon: Table, label: 'Table' },
                            { id: 'board', icon: Kanban, label: 'Board' },
                            { id: 'gallery', icon: LayoutGrid, label: 'Gallery' },
                            { id: 'calendar', icon: Calendar, label: 'Calendar' },
                            { id: 'list', icon: List, label: 'List' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as any); saveCurrentView({ activeTab: tab.id }); }}
                                className={cn(
                                    "p-1.5 rounded-md transition-all flex items-center gap-2",
                                    activeTab === tab.id ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                                title={tab.label}
                            >
                                <tab.icon size={14} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                {isCreatingRow && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[500px] z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="bg-background border border-border rounded-xl shadow-2xl p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Initialize Record</h3>
                                <button onClick={() => { setIsCreatingRow(false); setIsTemplateMenuOpen(false); }} className="p-1 hover:bg-muted rounded text-muted-foreground">
                                    <Plus size={14} className="rotate-45" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-3">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Enter identifier..."
                                    value={newRowName}
                                    onChange={(e) => setNewRowName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRow()}
                                    className="w-full bg-muted border border-border px-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <button 
                                            onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                                            className="w-full flex items-center justify-between bg-muted border border-border px-4 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} />
                                                <span>Apply Template...</span>
                                            </div>
                                            <ChevronDown size={14} />
                                        </button>
                                        {isTemplateMenuOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto z-[60] p-1.5">
                                                <button onClick={() => handleCreateRow()} className="w-full text-left px-3 py-2 rounded text-sm hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-all mb-1">
                                                    Empty Page
                                                </button>
                                                {availableTemplates.map(t => (
                                                    <button key={t.path} onClick={() => handleCreateRow(t.path)} className="w-full text-left px-3 py-2 rounded text-sm hover:bg-muted text-foreground transition-all">
                                                        {t.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button onClick={() => handleCreateRow()} className="px-6 font-bold uppercase text-[10px] tracking-widest bg-primary text-primary-foreground hover:opacity-90">
                                        Deploy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-hidden">
                    {activeTab === 'table' && (
                        <TableView 
                            rows={filteredRows} 
                            columns={Object.keys(database.schema)}
                            schema={database.schema} 
                            hiddenProperties={hiddenProperties}
                            onRowClick={handleRowClick}
                            onSelectRow={handleRowClick}
                            onUpdateRow={handleUpdateRow}
                            onDeleteRow={handleDeleteRow}
                            onNavigate={onNavigate}
                            loading={loading}
                            groupBy={groupBy}
                        />
                    )}
                    {activeTab === 'board' && (
                        <BoardView 
                            rows={filteredRows} 
                            schema={database.schema}
                            groupBy={groupBy}
                            onSelectRow={handleRowClick}
                            onUpdateRow={handleUpdateRow}
                            onNavigate={onNavigate}
                        />
                    )}
                    {activeTab === 'gallery' && (
                        <GalleryView 
                            rows={filteredRows} 
                            schema={database.schema}
                            onSelectRow={handleRowClick}
                        />
                    )}
                    {activeTab === 'calendar' && (
                        <CalendarView 
                            rows={filteredRows} 
                            schema={database.schema}
                            onSelectRow={handleRowClick}
                            onUpdateRow={handleUpdateRow}
                            onNavigate={onNavigate}
                            dateProperty={groupBy} // or another logic for date property selection
                        />
                    )}
                    {activeTab === 'list' && (
                        <ListView 
                            rows={filteredRows} 
                            columns={Object.keys(database.schema)}
                            schema={database.schema}
                            onSelectRow={handleRowClick}
                            onUpdateRow={handleUpdateRow}
                            onDeleteRow={handleDeleteRow}
                            onNavigate={onNavigate}
                            loading={loading}
                        />
                    )}
                </div>
            </div>

            {/* Database Settings Panel */}
            <DatabaseSettingsPanel 
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                database={database as any}
                onUpdateSchema={onRefresh}
                currentView={{
                    activeTab,
                    hiddenProperties,
                    sortConfigs,
                    filters,
                    filterGroupId,
                    groupBy,
                    isLocked
                }}
                onUpdateView={(updates) => {
                    if (updates.activeTab !== undefined) setActiveTab(updates.activeTab);
                    if (updates.hiddenProperties !== undefined) setHiddenProperties(updates.hiddenProperties);
                    if (updates.sortConfigs !== undefined) setSortConfigs(updates.sortConfigs);
                    if (updates.filters !== undefined) setFilters(updates.filters);
                    if (updates.filterGroupId !== undefined) setFilterGroupId(updates.filterGroupId);
                    if (updates.groupBy !== undefined) setGroupBy(updates.groupBy);
                    if (updates.isLocked !== undefined) {
                        setIsLocked(updates.isLocked);
                        localStorage.setItem(`lifeos_db_views_${database.id}`, JSON.stringify({
                            views: savedViews,
                            activeId: activeViewId,
                            isLocked: updates.isLocked
                        }));
                    }
                    saveCurrentView(updates);
                }}
            />

            {/* Row Detail Side Panel */}
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
