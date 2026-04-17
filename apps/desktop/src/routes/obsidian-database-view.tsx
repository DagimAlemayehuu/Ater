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
                isLocked: updates.isLocked !== undefined ? updates.isLocked : isLocked
            }));
            return newViews;
        });
    };

    const handleSelectView = (viewId: string) => {
        const view = savedViews.find(v => v.id === viewId);
        if (!view) return;
        setActiveViewId(view.id);
        setActiveTab(view.activeTab || 'table');
        setHiddenProperties(view.hiddenProperties || []);
        setSortConfigs(view.sortConfigs || []);
        setFilters(view.filters || []);
        setFilterGroupId(view.filterGroupId || 'AND');
        setGroupBy(view.groupBy || null);
        localStorage.setItem(`lifeos_db_views_${database.id}`, JSON.stringify({ views: savedViews, activeId: viewId, isLocked }));
    };

    const handleAddView = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newView = {
            id: newId,
            name: `View ${savedViews.length + 1}`,
            activeTab: 'table',
            hiddenProperties: [],
            sortConfigs: [],
            filters: [],
            filterGroupId: 'AND',
            groupBy: null
        };
        setSavedViews([...savedViews, newView]);
        handleSelectView(newId);
    };

    const handleDuplicateView = (viewId: string) => {
        const view = savedViews.find(v => v.id === viewId);
        if (!view) return;
        const newId = Math.random().toString(36).substr(2, 9);
        const newView = { ...view, id: newId, name: `${view.name} (Copy)` };
        setSavedViews([...savedViews, newView]);
        setViewMenuOpenId(null);
        handleSelectView(newId);
    };

    const handleDeleteView = (viewId: string) => {
        if (savedViews.length === 1) return; // Cannot delete last view
        const newViews = savedViews.filter(v => v.id !== viewId);
        setSavedViews(newViews);
        setViewMenuOpenId(null);
        if (activeViewId === viewId) handleSelectView(newViews[0].id);
    };

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
        // Load Templates
        sidecarApi.listObsidianFiles().then(res => {
            const templates = res.files.filter((f: any) => 
                f.name.toLowerCase().includes('template') || 
                f.path.toLowerCase().includes('template')
            );
            setAvailableTemplates(templates);
        }).catch(err => console.error("Template load failed", err));

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
        if (propertyName === 'title') {
            try {
                await sidecarApi.renameVaultFile(database.id, fileName, value)
                fetchRows()
            } catch (e) {
                console.error("Rename failed", e)
                fetchRows()
            }
            return
        }

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

    const handleAddRowWithTemplate = async (templatePath: string) => {
        const name = prompt("Enter new entry name:");
        if (!name?.trim()) return;

        try {
            // First read the template
            const tpl = await sidecarApi.readObsidianNote(templatePath);
            
            // Merge Initial Schema with Template Metadata
            const mergedProps: Record<string, any> = { ...tpl.metadata };
            Object.keys(database.schema).forEach(key => {
                const meta = database.schema[key];
                const typeStr = typeof meta === 'string' ? meta : (meta?.type || 'str');
                if (mergedProps[key] === undefined) {
                    if (typeStr === 'list') mergedProps[key] = [];
                    else if (typeStr === 'bool') mergedProps[key] = false;
                    else mergedProps[key] = "";
                }
            });

            const res = await sidecarApi.createVaultRow(database.id, name, mergedProps);

            // Inject template markdown content if it had any
            if (tpl.content && tpl.content.trim()) {
                await sidecarApi.updateObsidianNote(`${database.id}/${res.id}`, tpl.content);
            }
            
            setIsTemplateMenuOpen(false);
            fetchRows();
        } catch (e) {
            console.error("Template creation failed:", e);
        }
    }

    const filteredRows = useMemo(() => {
        let result = rows.filter(r => 
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            Object.values(r.properties).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase())) ||
            (r.content && r.content.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        // Apply advanced filters
        if (filters.length > 0) {
            result = result.filter(row => {
                const results = filters.map(f => {
                    const val = f.col === 'title' ? row.title : row.properties[f.col];
                    const target = String(val || "").toLowerCase();
                    const filterVal = String(f.val || "").toLowerCase();

                    switch (f.op) {
                        case 'eq': return target === filterVal;
                        case 'con': return target.includes(filterVal);
                        case 'emp': return !val || (Array.isArray(val) && val.length === 0);
                        case 'not_emp': return !!val && (!Array.isArray(val) || val.length > 0);
                        case 'not_con': return !target.includes(filterVal);
                        default: return true;
                    }
                });

                return filterGroupId === 'OR' ? results.some(r => r) : results.every(r => r);
            });
        }

        if (sortConfigs && sortConfigs.length > 0) {
            result = [...result].sort((a, b) => {
                for (const sortConfig of sortConfigs) {
                    const valA = sortConfig.col === 'title' ? a.title : a.properties[sortConfig.col];
                    const valB = sortConfig.col === 'title' ? b.title : b.properties[sortConfig.col];
                    
                    const strA = String(valA || "").toLowerCase();
                    const strB = String(valB || "").toLowerCase();
                    
                    if (strA < strB) return sortConfig.dir === 'asc' ? -1 : 1;
                    if (strA > strB) return sortConfig.dir === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return result;
    }, [rows, searchQuery, sortConfigs, filters])

    const columns = useMemo(() => {
        const all = ['title', ...Object.keys(database.schema).sort()];
        return all.filter(col => col === 'title' || !hiddenProperties.includes(col));
    }, [database.schema, hiddenProperties])

    return (
        <div className="flex flex-col h-full w-full select-none bg-white font-sans text-[#111827]">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col px-4 pt-4 pb-0 shrink-0 border-b border-[#E5E5E5]">
                <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-[12px] font-medium text-gray-400">
                            <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors" title="Back to Databases">
                                <ArrowLeft size={16} />
                            </button>
                            <span>Vault Databases</span>
                            <div className="w-px h-3 bg-gray-200" />
                            <span className="text-gray-900 font-black tracking-tighter uppercase text-[10px]">{database.name}</span>
                        </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                if (rows.length === 0) return;
                                const headers = ["Title", ...columns.slice(1)];
                                const csvContent = [
                                    headers.join(","),
                                    ...filteredRows.map(row => {
                                        const vals = [row.title];
                                        columns.slice(1).forEach(col => {
                                            const val = row.properties[col];
                                            const cleanVal = Array.isArray(val) ? val.join(";") : String(val || "");
                                            vals.push(`"${String(cleanVal).replace(/"/g, '""')}"`);
                                        });
                                        return vals.join(",");
                                    })
                                ].join("\n");
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${database.id}_export.csv`;
                                a.click();
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-[#111827] hover:bg-gray-100"
                        >
                            <Download size={14} className="mr-2" /> Export
                        </Button>
                        {!isLocked && (
                            <button 
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.csv';
                                    input.onchange = async (e: any) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = async (event) => {
                                            const text = event.target?.result as string;
                                            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                                            const headers = lines[0].split(',').map(h => h.trim());
                                            const data = lines.slice(1).map(l => l.split(',').map(v => v.trim()));
                                            
                                            setLoading(true);
                                            for (const row of data) {
                                                const props: Record<string, any> = {};
                                                headers.forEach((h, i) => { props[h] = row[i]; });
                                                // Title is usually first column
                                                const title = row[0] || 'Imported Note';
                                                await sidecarApi.createVaultRow(database.id, title, props);
                                            }
                                            fetchRows();
                                        };
                                        reader.readAsText(file);
                                    };
                                    input.click();
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest text-[#111827] transition-all"
                            >
                                <Plus size={14} /> Import
                            </button>
                        )}

                        <div className="relative flex items-center">
                            <Search className="absolute left-2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-[12px] px-2 py-1.5 pl-7 rounded focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-400 transition-shadow"
                            />
                        </div>
                        <button onClick={fetchRows} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        
                        {/* More Menu / Settings Trigger */}
                        <button 
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className={cn(
                                "flex items-center justify-center p-1.5 hover:bg-gray-100 rounded transition-colors",
                                settingsOpen ? "text-[#111827] bg-gray-100" : "text-gray-400"
                            )}
                        >
                            <MoreVertical size={14} />
                        </button>

                        {!isLocked && (
                            <div className="relative group/new flex">
                                <button 
                                    onClick={() => setIsCreatingRow(true)}
                                    className="flex items-center justify-center gap-1.5 pl-3 pr-2 py-1.5 bg-[#111827] text-white text-[12px] font-medium rounded-l hover:bg-black transition-colors ml-1 border-r border-gray-700 h-7"
                                >
                                    <Plus size={14} /> New
                                </button>
                                <button 
                                    onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                                    className="flex items-center justify-center px-1.5 bg-[#111827] text-white text-[12px] font-medium rounded-r hover:bg-black transition-colors h-7"
                                >
                                    <ChevronDown size={14} />
                                </button>

                                {/* Template Dropdown */}
                                {isTemplateMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsTemplateMenuOpen(false)} />
                                        <div className="absolute top-9 right-0 z-50 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 max-h-64 overflow-y-auto">
                                            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                                DB Templates
                                            </div>
                                            {availableTemplates.length === 0 ? (
                                                <div className="px-3 py-4 text-center text-[10px] text-gray-500">No templates found in vault.</div>
                                            ) : (
                                                availableTemplates.map(tpl => (
                                                    <button 
                                                        key={tpl.path}
                                                        onClick={() => handleAddRowWithTemplate(tpl.path)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors group"
                                                    >
                                                        <FileText size={12} className="text-gray-400 group-hover:text-black" />
                                                        <span className="text-[11px] text-[#111827] truncate font-medium">{tpl.name.replace('.md','')}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 text-[13px] font-medium text-gray-500 overflow-x-auto custom-scrollbar pb-[-1px] relative">
                    {savedViews.map(view => {
                        const Icon = view.activeTab === 'table' ? Table : 
                                    view.activeTab === 'board' ? Kanban : 
                                    view.activeTab === 'calendar' ? Calendar : 
                                    view.activeTab === 'chart' || view.activeTab === 'timeline' ? LayoutGrid : 
                                    view.activeTab === 'list' ? List : LayoutGrid;
                        return (
                            <div key={view.id} className="relative flex items-center group/tab">
                                <button 
                                    onClick={() => handleSelectView(view.id)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setViewMenuOpenId(viewMenuOpenId === view.id ? null : view.id);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 border-b-2 transition-all cursor-pointer hover:text-black shrink-0",
                                        activeViewId === view.id ? "border-[#111827] text-black font-bold" : "border-transparent text-gray-500"
                                    )}
                                >
                                    <Icon size={14} /> {view.name}
                                </button>

                                {/* Dropdown Trigger (visible on active or hover) */}
                                {(activeViewId === view.id || viewMenuOpenId === view.id) && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setViewMenuOpenId(viewMenuOpenId === view.id ? null : view.id); }}
                                        className="absolute right-1 p-1 hover:bg-gray-100 rounded text-gray-400 opacity-0 group-hover/tab:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical size={12} />
                                    </button>
                                )}

                                {/* View Settings Menu */}
                                {viewMenuOpenId === view.id && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setViewMenuOpenId(null)} />
                                        <div className="absolute top-10 left-0 z-50 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1">
                                            <button 
                                                onClick={() => {
                                                    const newName = prompt("Rename View:", view.name);
                                                    if (newName) saveCurrentView({ name: newName });
                                                    setViewMenuOpenId(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 text-gray-700"
                                            >
                                                Rename View
                                            </button>
                                            <button 
                                                onClick={() => handleDuplicateView(view.id)}
                                                className="w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 text-gray-700 font-bold"
                                            >
                                                Duplicate View
                                            </button>
                                            {savedViews.length > 1 && (
                                                <>
                                                    <div className="border-t border-gray-100 my-1"></div>
                                                    <button 
                                                        onClick={() => handleDeleteView(view.id)}
                                                        className="w-full text-left px-4 py-2 text-[12px] hover:bg-red-50 text-red-600 font-medium"
                                                    >
                                                        Delete View
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                    <button 
                        onClick={() => {
                            const id = Math.random().toString(36).substr(2, 9);
                            const newView = {
                                id,
                                name: `View ${savedViews.length + 1}`,
                                activeTab: 'table',
                                hiddenProperties: [],
                                sortConfigs: [],
                                filters: [],
                                groupBy: null
                            };
                            const nv = [...savedViews, newView];
                            setSavedViews(nv);
                            localStorage.setItem(`lifeos_db_views_${database.id}`, JSON.stringify({ views: nv, activeId: id }));
                            handleSelectView(id);
                        }}
                        className="px-3 py-2 text-gray-300 hover:text-black transition-colors"
                        title="Add View"
                    >
                        <Plus size={16} />
                    </button>
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
                    setHiddenProperties(prev => {
                        const next = prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name];
                        saveCurrentView({ hiddenProperties: next });
                        return next;
                    })
                }}
                sortConfigs={sortConfigs}
                onSortConfigsChange={(c) => { setSortConfigs(c); saveCurrentView({ sortConfigs: c }); }}
                filters={filters}
                filterGroupId={filterGroupId}
                onFiltersChange={(f, op) => { 
                    setFilters(f); 
                    if (op) setFilterGroupId(op);
                    saveCurrentView({ filters: f, filterGroupId: op || filterGroupId }); 
                }}
                groupBy={groupBy}
                onGroupByChange={(g) => { setGroupBy(g); saveCurrentView({ groupBy: g }); }}
                onUpdateSchema={() => {
                    fetchRows();
                    onRefresh();
                }}
                onLayoutChange={(lyr) => { setActiveTab(lyr); saveCurrentView({ activeTab: lyr }); }}
                isLocked={isLocked}
                onLockToggle={() => {
                    const next = !isLocked;
                    setIsLocked(next);
                    saveCurrentView({ isLocked: next });
                }}
            />

            {/* Dynamic View Content */}
            <div className="flex-1 overflow-auto bg-gray-50 relative custom-scrollbar">
                {/* Add Row Overlay */}
                {isCreatingRow && !isLocked && (
                    <div className="absolute inset-x-0 top-0 z-[60] bg-white border-b border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-900">Create New Entry</h3>
                            <button onClick={() => setIsCreatingRow(false)} className="text-[12px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
                        </div>
                        <div className="flex gap-4 items-end max-w-2xl">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Entry Title</label>
                                <input 
                                    autoFocus 
                                    className="w-full h-10 bg-white border border-gray-200 px-4 rounded text-sm focus:ring-1 focus:ring-gray-300 focus:outline-none"
                                    placeholder="Untitled Note"
                                    value={newRowName}
                                    onChange={(e) => setNewRowName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddRow()}
                                />
                            </div>
                            <button 
                                onClick={handleAddRow}
                                className="h-10 px-6 bg-[#111827] text-white text-[12px] font-medium rounded hover:bg-black transition-colors shrink-0"
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
                            readonly={isLocked}
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
                    {activeTab === 'calendar' && (
                        <CalendarView 
                            rows={filteredRows} 
                            schema={database.schema} 
                            onSelectRow={setSelectedRowId}
                        />
                    )}
                    {activeTab === 'chart' && (
                    <ChartView rows={filteredRows} schema={database.schema} />
                )}

                {activeTab === 'timeline' && (
                    <TimelineView 
                        rows={filteredRows} 
                        schema={database.schema} 
                        onSelectRow={setSelectedRowId} 
                    />
                )}

                {activeTab === 'list' && (
                        <ListView 
                            rows={filteredRows} 
                            columns={columns}
                            schema={database.schema} 
                            onUpdate={handleUpdate}
                            onSelectRow={setSelectedRowId}
                            onNavigate={onNavigate}
                            loading={loading}
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

function ChevronRight({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
}
