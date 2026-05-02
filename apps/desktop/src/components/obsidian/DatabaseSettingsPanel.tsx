import React, { useState } from 'react'
import { 
    X, 
    Layout, 
    Eye, 
    Filter, 
    ArrowUpDown, 
    Layers, 
    Plus, 
    ChevronRight,
    Type,
    Hash,
    Calendar,
    CheckSquare,
    Link as LinkIcon,
    Trash2,
    ChevronLeft,
    List,
    ChevronDown,
    Settings as SettingsIcon,
    Sigma,
    Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'

interface DatabaseSettingsPanelProps {
    isOpen: boolean
    onClose: () => void
    database: {
        id: string
        name: string
        schema: Record<string, any>
    }
    currentView: {
        activeTab?: 'table' | 'board' | 'gallery' | 'calendar' | 'list' | 'chart' | 'timeline'
        hiddenProperties: string[]
        sortConfigs: { col: string, dir: 'asc' | 'desc' }[]
        filters: any[]
        filterGroupId: 'AND' | 'OR'
        groupBy: string | null
        isLocked: boolean
    }
    onUpdateView: (updates: any) => void
    onUpdateSchema?: () => void
}

type SettingsPage = 'main' | 'properties' | 'add_property' | 'edit_property' | 'visibility' | 'sort' | 'filter' | 'group'

export function DatabaseSettingsPanel({ 
    isOpen, 
    onClose, 
    database, 
    currentView,
    onUpdateView,
    onUpdateSchema
}: DatabaseSettingsPanelProps) {
    const [page, setPage] = useState<SettingsPage>('main')
    const [editingProp, setEditingProp] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', type: 'str', source: '' })
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    // Destructure current view with defaults
    const {
        activeTab = 'table',
        hiddenProperties = [],
        sortConfigs = [],
        filters = [],
        filterGroupId = 'AND',
        groupBy = null,
        isLocked = false
    } = currentView || {};

    const handleAddProperty = () => {
        if (!formData.name.trim()) return
        const propData = ['select', 'relation', 'formula'].includes(formData.type) 
            ? { type: formData.type, source: formData.source || "" } 
            : { type: formData.type }
        const newSchema = { ...database.schema, [formData.name]: propData }
        setPage('properties')
        setFormData({ name: '', type: 'str', source: '' })
        sidecarApi.updateVaultDatabaseSchema(database.id, newSchema).then(() => onUpdateSchema?.())
    }

    const handleUpdateProperty = () => {
        if (!editingProp || !formData.name.trim()) return
        const updatedSchema = { ...database.schema }
        const isRename = editingProp !== formData.name
        if (isRename) delete updatedSchema[editingProp]
        const propData = ['select', 'relation', 'formula'].includes(formData.type) 
            ? { type: formData.type, source: formData.source || "" } 
            : { type: formData.type }
        updatedSchema[formData.name] = propData
        setPage('properties')
        sidecarApi.updateVaultDatabaseSchema(database.id, updatedSchema, isRename ? editingProp : undefined, isRename ? formData.name : undefined).then(() => onUpdateSchema?.())
    }

    const handleDeleteProperty = async (name: string) => {
        try {
            const newSchema = { ...database.schema }
            delete newSchema[name]
            setPage('properties')
            sidecarApi.updateVaultDatabaseSchema(database.id, newSchema).then(() => onUpdateSchema?.())
        } catch (e) {
            console.error(e)
        }
    }

    const getIcon = (type: string) => {
        const size = 12;
        const className = "text-muted-foreground";
        switch(type) {
            case 'number': case 'int': case 'float': return <Hash size={size} className={className} />
            case 'date': return <Calendar size={size} className={className} />
            case 'bool': return <CheckSquare size={size} className={className} />
            case 'formula': return <Sigma size={size} className={className} />
            case 'list': return <List size={size} className={className} />
            case 'select': case 'relation': return <LinkIcon size={size} className={className} />
            case 'status': return <Clock size={size} className={className} />
            case 'multi-select': return <Layers size={size} className={className} />
            case 'rollup': return <ChevronDown size={size} className={className} />
            case 'id': return <span className="text-[9px] font-bold text-muted-foreground">ID</span>
            case 'url': return <LinkIcon size={size} className={className} />
            case 'email': return <span className="text-[9px] font-bold text-muted-foreground">@</span>
            case 'phone': return <span className="text-[9px] font-bold text-muted-foreground">#</span>
            case 'created_time': case 'last_edited_time': return <Clock size={size} className={className} />
            case 'created_by': case 'last_edited_by': return <Type size={size} className={className} />
            default: return <Type size={size} className={className} />
        }
    }

    return (
        <div className="absolute top-10 right-4 w-[280px] bg-background border border-border pb-2 shadow-xl rounded-lg z-[100] overflow-hidden flex flex-col max-h-[600px] animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20 text-foreground">
                <div className="flex items-center gap-2">
                    {page !== 'main' && (
                        <button onClick={() => setPage('main')} className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground">
                            <ChevronLeft size={16} />
                        </button>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {page === 'main' ? 'View Settings' : 
                         page === 'properties' ? 'Edit Properties' : 
                         page === 'add_property' ? 'New Property' : 
                         page === 'filter' ? 'Filters' :
                         page === 'group' ? 'Grouping' :
                         page === 'sort' ? 'Sort' :
                         page === 'visibility' ? 'Visibility' :
                         'Edit Property'}
                    </span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {page === 'main' && (
                    <div className="space-y-0.5">
                        <div className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 rounded transition-all group/item">
                            <div className="flex items-center gap-3">
                                <SettingsIcon size={14} className="text-muted-foreground group-hover/item:text-foreground" />
                                <span className="text-[11px] font-medium text-foreground">Lock database</span>
                            </div>
                            <button 
                                onClick={() => onUpdateView({ isLocked: !isLocked })}
                                className={cn(
                                    "w-8 h-4 rounded-full relative transition-colors duration-200",
                                    isLocked ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <div className={cn("absolute top-0.5 left-0.5 size-3 bg-background rounded-full transition-transform duration-200 shadow-sm border border-border/50", isLocked && "translate-x-4")} />
                            </button>
                        </div>
                        <div className="h-px bg-border/50 my-1 mx-2" />
                        <SettingItem 
                            icon={<Layout size={14} />} 
                            label="Layout" 
                            value={activeTab} 
                            onClick={() => {
                                const layouts: any[] = ['table', 'board', 'gallery', 'calendar', 'list', 'chart', 'timeline'];
                                const idx = layouts.indexOf(activeTab);
                                const next = layouts[(idx + 1) % layouts.length];
                                onUpdateView({ activeTab: next });
                            }} 
                            showChevron 
                        />
                        <SettingItem icon={<Eye size={14} />} label="Property visibility" value={String(Object.keys(database.schema).length - hiddenProperties.length)} onClick={() => setPage('visibility')} showChevron />
                        <SettingItem icon={<Filter size={14} />} label="Filter" value={filters.length > 0 ? `${filters.length} active` : 'None'} onClick={() => setPage('filter')} showChevron />
                        <SettingItem icon={<ArrowUpDown size={14} />} label="Sort" value={sortConfigs.length > 0 ? `${sortConfigs.length} active` : 'None'} onClick={() => setPage('sort')} showChevron />
                        <SettingItem icon={<Layers size={14} />} label="Group" value={groupBy || 'None'} onClick={() => setPage('group')} showChevron />
                        <div className="h-px bg-border/50 my-2 mx-2" />
                        <SettingItem icon={<SettingsIcon size={14} />} label="Edit properties" onClick={() => setPage('properties')} showChevron />
                    </div>
                )}

                {page === 'filter' && (
                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex bg-muted p-0.5 rounded-lg">
                                <button 
                                    onClick={() => onUpdateView({ filterGroupId: 'AND' })}
                                    className={cn("px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all", filterGroupId === 'AND' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                                >
                                    And
                                </button>
                                <button 
                                    onClick={() => onUpdateView({ filterGroupId: 'OR' })}
                                    className={cn("px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all", filterGroupId === 'OR' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                                >
                                    Or
                                </button>
                            </div>
                            <button onClick={() => onUpdateView({ filters: [...filters, { col: 'title', op: 'con', val: '' }] })} className="text-[10px] font-bold text-foreground hover:underline">Add Filter</button>
                        </div>
                        <div className="space-y-3">
                            {filters.map((f, i) => (
                                <div key={i} className="p-3 bg-muted/20 border border-border/50 rounded-md space-y-2 relative group/filter">
                                    <button onClick={() => onUpdateView({ filters: filters.filter((_, idx) => idx !== i) })} className="absolute -top-2 -right-2 size-5 bg-background border border-border rounded shadow-sm flex items-center justify-center opacity-0 group-hover/filter:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-muted cursor-pointer z-10">
                                        <X size={10} />
                                    </button>
                                    <select className="w-full h-8 bg-background border border-border text-[10px] font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring rounded px-2 text-foreground" value={f.col}
                                        onChange={e => { const nf = [...filters]; nf[i].col = e.target.value; onUpdateView({ filters: nf }); }}>
                                        <option value="title">Title</option>
                                        {Object.keys(database.schema).sort().map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <select className="h-8 bg-background border border-border px-2 rounded text-[9px] font-bold uppercase tracking-wider text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring" value={f.op}
                                            onChange={e => { const nf = [...filters]; nf[i].op = e.target.value; onUpdateView({ filters: nf }); }}>
                                            <option value="con">Contains</option>
                                            <option value="not_con">Not Contain</option>
                                            <option value="eq">Equal</option>
                                            <option value="emp">Is Empty</option>
                                            <option value="not_emp">Not Empty</option>
                                        </select>
                                        {!['emp', 'not_emp'].includes(f.op) && <input className="flex-1 h-8 bg-background border border-border px-2 rounded text-[10px] font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground" value={f.val}
                                            onChange={e => { const nf = [...filters]; nf[i].val = e.target.value; onUpdateView({ filters: nf }); }} placeholder="Value..." />}
                                    </div>
                                </div>
                            ))}
                            {filters.length === 0 && <div className="text-center py-8 text-[10px] font-bold text-muted-foreground">No active filters</div>}
                        </div>
                    </div>
                )}

                {page === 'group' && (
                    <div className="space-y-0.5">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Group By Property</div>
                        <button onClick={() => onUpdateView({ groupBy: null })} className={cn("w-full flex items-center justify-between px-4 py-2 hover:bg-muted/50 rounded transition-all group", !groupBy && "bg-muted")}>
                            <span className="text-[11px] font-bold text-muted-foreground">None</span>
                        </button>
                        {Object.keys(database.schema).sort().map(name => {
                            const isActive = groupBy === name;
                            return (
                                <button key={name} onClick={() => onUpdateView({ groupBy: name })} className={cn("w-full flex items-center justify-between px-4 py-2 hover:bg-muted/50 rounded transition-all group", isActive && "bg-muted")}>
                                    <span className={cn("text-[11px] font-medium truncate", isActive ? "text-foreground font-bold" : "text-muted-foreground")}>{name}</span>
                                    {isActive && <ChevronRight size={12} className="text-foreground" />}
                                </button>
                            )
                        })}
                    </div>
                )}

                {page === 'sort' && (
                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Sorts</span>
                            <button onClick={() => onUpdateView({ sortConfigs: [...sortConfigs, { col: 'title', dir: 'asc' }] })} className="text-[10px] font-bold text-foreground hover:underline">Add Sort</button>
                        </div>
                        <div className="space-y-3">
                            {sortConfigs.map((s, i) => (
                                <div key={i} className="flex gap-2 relative group/sort p-3 bg-muted/20 border border-border/50 rounded-md">
                                    <button onClick={() => onUpdateView({ sortConfigs: sortConfigs.filter((_, idx) => idx !== i) })} className="absolute -top-2 -right-2 size-5 bg-background border border-border rounded shadow-sm flex items-center justify-center opacity-0 group-hover/sort:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-muted cursor-pointer z-10">
                                        <X size={10} />
                                    </button>
                                    <select className="flex-1 h-8 bg-background border border-border text-[10px] font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring rounded px-2 text-foreground" value={s.col}
                                        onChange={e => { const nc = [...sortConfigs]; nc[i].col = e.target.value; onUpdateView({ sortConfigs: nc }); }}>
                                        <option value="title">Title</option>
                                        {Object.keys(database.schema).sort().map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <select className="h-8 bg-background border border-border px-2 rounded text-[9px] font-bold uppercase tracking-wider text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring" value={s.dir}
                                        onChange={e => { const nc = [...sortConfigs]; nc[i].dir = e.target.value as 'asc'|'desc'; onUpdateView({ sortConfigs: nc }); }}>
                                        <option value="asc">Asc</option>
                                        <option value="desc">Desc</option>
                                    </select>
                                </div>
                            ))}
                            {sortConfigs.length === 0 && <div className="text-center py-8 text-[10px] font-bold text-muted-foreground">No active sorts</div>}
                        </div>
                    </div>
                )}

                {page === 'visibility' && (
                    <div className="space-y-0.5">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visible Properties</div>
                        {Object.keys(database.schema).sort().map(name => {
                            const isHidden = hiddenProperties.includes(name);
                            return (
                                <button key={name} 
                                    onClick={() => {
                                        const next = isHidden 
                                            ? hiddenProperties.filter(p => p !== name)
                                            : [...hiddenProperties, name];
                                        onUpdateView({ hiddenProperties: next });
                                    }} 
                                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted/50 rounded transition-all group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn("size-3.5 rounded-sm border shrink-0 flex items-center justify-center transition-colors", isHidden ? "border-border bg-background" : "border-primary bg-primary")}>
                                            {!isHidden && <X size={8} className="text-primary-foreground rotate-45" />}
                                        </div>
                                        <span className={cn("text-[11px] font-medium truncate", isHidden ? "text-muted-foreground/60" : "text-foreground")}>{name}</span>
                                    </div>
                                    {!isHidden ? <Eye size={12} className="text-muted-foreground shrink-0" /> : <Eye size={12} className="text-transparent shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                {page === 'properties' && (
                    <div className="space-y-0.5">
                        {Object.entries(database.schema).sort().map(([name, meta]) => (
                            <button key={name} onClick={() => { setEditingProp(name); const typeStr = typeof meta === 'string' ? meta : meta.type; setFormData({ name, type: typeStr, source: meta.source || "" }); setPage('edit_property'); }}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 rounded transition-all group text-left">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="shrink-0">{getIcon(typeof meta === 'string' ? meta : meta.type)}</div>
                                    <span className="text-[11px] font-medium text-foreground truncate">{name}</span>
                                </div>
                                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0" />
                            </button>
                        ))}
                        <button onClick={() => { setFormData({ name: '', type: 'str', source: '' }); setPage('add_property'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-foreground rounded transition-all mt-2 border border-dashed border-border/50">
                            <Plus size={14} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Add Property</span>
                        </button>
                    </div>
                )}

                {(page === 'add_property' || page === 'edit_property') && (
                    <div className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Label</label>
                            <input autoFocus className="w-full h-8 bg-background border border-border px-3 rounded text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-ring focus:outline-none transition-all shadow-sm"
                                value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Property Name..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</label>
                            <div className="relative group/select">
                                <select className="w-full h-8 bg-background border border-border px-3 rounded text-[11px] focus:border-primary focus:ring-1 focus:ring-ring focus:outline-none appearance-none transition-all shadow-sm text-foreground"
                                    value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                                    <option value="str">Text</option>
                                    <option value="number">Number</option>
                                    <option value="progress">Progress Bar</option>
                                    <option value="select">Select</option>
                                    <option value="multi-select">Multi-select</option>
                                    <option value="status">Status</option>
                                    <option value="relation">Relation</option>
                                    <option value="rollup">Rollup</option>
                                    <option value="date">Date</option>
                                    <option value="bool">Checkbox</option>
                                    <option value="button">Button (Action)</option>
                                    <option value="formula">Formula</option>
                                    <option value="id">Unique ID</option>
                                    <option value="url">URL</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="created_time">Created time</option>
                                    <option value="created_by">Created by</option>
                                    <option value="last_edited_time">Last edited time</option>
                                    <option value="last_edited_by">Last edited by</option>
                                    <option value="list">List</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        {['select', 'relation', 'formula', 'button'].includes(formData.type) && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {formData.type === 'formula' ? 'Expression (e.g. prop("Price") * 2)' : 
                                     formData.type === 'button' ? 'Action (e.g. SET(Status, \'Done\'))' : 'Link Source'}
                                </label>
                                <input className="w-full h-8 bg-background border border-border px-3 rounded text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-ring focus:outline-none transition-all shadow-sm font-mono"
                                    value={formData.source} onChange={e => setFormData(p => ({ ...p, source: e.target.value }))} 
                                    placeholder={formData.type === 'formula' ? 'prop("Col") * 5 ...' : 
                                                 formData.type === 'button' ? 'SET(Prop, Val); SET(...)' : 'Folder or Note path...'} />
                            </div>
                        )}
                        <div className="flex gap-2 pt-4">
                            <button onClick={page === 'add_property' ? handleAddProperty : handleUpdateProperty} disabled={loading}
                                className="flex-1 h-8 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all">
                                {loading ? 'Saving...' : 'Confirm'}
                            </button>
                            {page === 'edit_property' && (
                                <button onClick={() => handleDeleteProperty(editingProp!)} className="px-3 bg-destructive/10 border border-destructive/20 text-destructive rounded hover:bg-destructive/20 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SettingItem({ icon, label, value, onClick, showChevron }: { icon: any, label: string, value?: string, onClick?: () => void, showChevron?: boolean }) {
    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 rounded transition-all group/item text-left"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-muted-foreground group-hover/item:text-foreground transition-colors shrink-0">{icon}</span>
                <span className="text-[11px] font-medium text-foreground truncate">{label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {value && <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{value}</span>}
                {showChevron && <ChevronRight size={14} className="text-muted-foreground/50 group-hover/item:text-muted-foreground transition-colors" />}
            </div>
        </button>
    )
}
