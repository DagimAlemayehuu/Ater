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
    activeTab: 'table' | 'board' | 'gallery' | 'calendar' | 'list' | 'chart' | 'timeline'
    hiddenProperties: string[]
    onToggleVisibility: (name: string) => void
    sortConfigs: { col: string, dir: 'asc' | 'desc' }[]
    onSortConfigsChange: (configs: { col: string, dir: 'asc' | 'desc' }[]) => void
    filters: any[]
    filterGroupId: 'AND' | 'OR'
    onFiltersChange: (filters: any[], operator?: 'AND' | 'OR') => void
    groupBy: string | null
    onGroupByChange: (groupBy: string | null) => void
    onUpdateSchema: () => void
    onLayoutChange: (layout: 'table' | 'board' | 'gallery' | 'calendar' | 'list' | 'chart' | 'timeline') => void
    isLocked: boolean
    onLockToggle: () => void
}

type SettingsPage = 'main' | 'properties' | 'add_property' | 'edit_property' | 'visibility' | 'sort' | 'filter' | 'group'

export function DatabaseSettingsPanel({ 
    isOpen, 
    onClose, 
    database, 
    activeTab, 
    hiddenProperties,
    onToggleVisibility,
    sortConfigs,
    onSortConfigsChange,
    filters,
    onFiltersChange,
    filterGroupId,
    groupBy,
    onGroupByChange,
    onUpdateSchema, 
    onLayoutChange,
    isLocked,
    onLockToggle
}: DatabaseSettingsPanelProps) {
    const [page, setPage] = useState<SettingsPage>('main')
    const [editingProp, setEditingProp] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', type: 'str', source: '' })
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleAddProperty = () => {
        if (!formData.name.trim()) return
        const propData = ['select', 'relation', 'formula'].includes(formData.type) 
            ? { type: formData.type, source: formData.source || "" } 
            : { type: formData.type }
        const newSchema = { ...database.schema, [formData.name]: propData }
        database.schema[formData.name] = propData 
        setPage('properties')
        setFormData({ name: '', type: 'str', source: '' })
        sidecarApi.updateVaultDatabaseSchema(database.id, newSchema).then(() => onUpdateSchema())
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
        sidecarApi.updateVaultDatabaseSchema(database.id, updatedSchema, isRename ? editingProp : undefined, isRename ? formData.name : undefined).then(() => onUpdateSchema())
    }

    const handleDeleteProperty = (name: string) => {
        if (!confirm(`Delete property "${name}"?`)) return
        const newSchema = { ...database.schema }
        delete newSchema[name]
        setPage('properties')
        sidecarApi.updateVaultDatabaseSchema(database.id, newSchema).then(() => onUpdateSchema())
    }

    const getIcon = (type: string) => {
        const size = 12;
        const className = "text-gray-400";
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
            case 'id': return <span className="text-[9px] font-bold text-gray-400">ID</span>
            case 'url': return <LinkIcon size={size} className={className} />
            case 'email': return <span className="text-[9px] font-bold text-gray-400">@</span>
            case 'phone': return <span className="text-[9px] font-bold text-gray-400">#</span>
            case 'created_time': case 'last_edited_time': return <Clock size={size} className={className} />
            case 'created_by': case 'last_edited_by': return <Type size={size} className={className} />
            default: return <Type size={size} className={className} />
        }
    }

    return (
        <div className="absolute top-10 right-4 w-[280px] bg-white border border-[#E5E5E5] pb-2 shadow-xl rounded-lg z-[100] overflow-hidden flex flex-col max-h-[600px] animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 text-[#111827]">
                <div className="flex items-center gap-2">
                    {page !== 'main' && (
                        <button onClick={() => setPage('main')} className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500 hover:text-gray-900">
                            <ChevronLeft size={16} />
                        </button>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-900">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {page === 'main' && (
                    <div className="space-y-0.5">
                        <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded transition-all group/item">
                            <div className="flex items-center gap-3">
                                <SettingsIcon size={14} className="text-gray-400 group-hover/item:text-black" />
                                <span className="text-[11px] font-medium text-gray-700">Lock database</span>
                            </div>
                            <button 
                                onClick={onLockToggle}
                                className={cn(
                                    "w-8 h-4 rounded-full relative transition-colors duration-200",
                                    isLocked ? "bg-[#111827]" : "bg-gray-200"
                                )}
                            >
                                <div className={cn("absolute top-0.5 left-0.5 size-3 bg-white rounded-full transition-transform duration-200", isLocked && "translate-x-4")} />
                            </button>
                        </div>
                        <div className="h-px bg-gray-100 my-1 mx-2" />
                        <SettingItem icon={<Layout size={14} />} label="Layout" value={activeTab} onClick={() => onLayoutChange(activeTab === 'table' ? 'board' : activeTab === 'board' ? 'gallery' : activeTab === 'gallery' ? 'calendar' : activeTab === 'calendar' ? 'list' : activeTab === 'list' ? 'chart' : activeTab === 'chart' ? 'timeline' : 'table')} showChevron />
                        <SettingItem icon={<Eye size={14} />} label="Property visibility" value={String(Object.keys(database.schema).length - hiddenProperties.length)} onClick={() => setPage('visibility')} showChevron />
                        <SettingItem icon={<Filter size={14} />} label="Filter" value={filters.length > 0 ? `${filters.length} active` : 'None'} onClick={() => setPage('filter')} showChevron />
                        <SettingItem icon={<ArrowUpDown size={14} />} label="Sort" value={sortConfigs.length > 0 ? `${sortConfigs.length} active` : 'None'} onClick={() => setPage('sort')} showChevron />
                        <SettingItem icon={<Layers size={14} />} label="Group" value={groupBy || 'None'} onClick={() => setPage('group')} showChevron />
                        <div className="h-px bg-gray-100 my-2 mx-2" />
                        <SettingItem icon={<SettingsIcon size={14} />} label="Edit properties" onClick={() => setPage('properties')} showChevron />
                    </div>
                )}

                {page === 'filter' && (
                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                <button 
                                    onClick={() => onFiltersChange(filters, 'AND')}
                                    className={cn("px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all", filterGroupId === 'AND' ? "bg-white shadow-sm text-black" : "text-gray-400")}
                                >
                                    And
                                </button>
                                <button 
                                    onClick={() => onFiltersChange(filters, 'OR')}
                                    className={cn("px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all", filterGroupId === 'OR' ? "bg-white shadow-sm text-black" : "text-gray-400")}
                                >
                                    Or
                                </button>
                            </div>
                            <button onClick={() => onFiltersChange([...filters, { col: 'title', op: 'con', val: '' }])} className="text-[10px] font-bold text-[#111827] hover:underline">Add Filter</button>
                        </div>
                        <div className="space-y-3">
                            {filters.map((f, i) => (
                                <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2 relative group/filter">
                                    <button onClick={() => onFiltersChange(filters.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 size-5 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center opacity-0 group-hover/filter:opacity-100 transition-opacity text-gray-500 hover:text-black hover:bg-gray-50 cursor-pointer z-10">
                                        <X size={10} />
                                    </button>
                                    <select className="w-full h-8 bg-white border border-gray-200 text-[10px] font-bold focus:outline-none rounded px-2" value={f.col}
                                        onChange={e => { const nf = [...filters]; nf[i].col = e.target.value; onFiltersChange(nf); }}>
                                        <option value="title">Title</option>
                                        {Object.keys(database.schema).sort().map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <select className="h-8 bg-white border border-gray-200 px-2 rounded text-[9px] font-bold uppercase tracking-wider text-gray-600 focus:outline-none" value={f.op}
                                            onChange={e => { const nf = [...filters]; nf[i].op = e.target.value; onFiltersChange(nf); }}>
                                            <option value="con">Contains</option>
                                            <option value="not_con">Not Contain</option>
                                            <option value="eq">Equal</option>
                                            <option value="emp">Is Empty</option>
                                            <option value="not_emp">Not Empty</option>
                                        </select>
                                        {!['emp', 'not_emp'].includes(f.op) && <input className="flex-1 h-8 bg-white border border-gray-200 px-2 rounded text-[10px] font-medium focus:outline-none focus:border-gray-400" value={f.val}
                                            onChange={e => { const nf = [...filters]; nf[i].val = e.target.value; onFiltersChange(nf); }} placeholder="Value..." />}
                                    </div>
                                </div>
                            ))}
                            {filters.length === 0 && <div className="text-center py-8 text-[10px] font-bold text-gray-400">No active filters</div>}
                        </div>
                    </div>
                )}

                {page === 'group' && (
                    <div className="space-y-0.5">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Group By Property</div>
                        <button onClick={() => onGroupByChange(null)} className={cn("w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded transition-all group", !groupBy && "bg-gray-100")}>
                            <span className="text-[11px] font-bold text-gray-500">None</span>
                        </button>
                        {Object.keys(database.schema).sort().map(name => {
                            const isActive = groupBy === name;
                            return (
                                <button key={name} onClick={() => onGroupByChange(name)} className={cn("w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded transition-all group", isActive && "bg-gray-100")}>
                                    <span className={cn("text-[11px] font-medium truncate", isActive ? "text-[#111827] font-bold" : "text-gray-600")}>{name}</span>
                                    {isActive && <ChevronRight size={12} className="text-[#111827]" />}
                                </button>
                            )
                        })}
                    </div>
                )}

                {page === 'sort' && (
                    <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Sorts</span>
                            <button onClick={() => onSortConfigsChange([...sortConfigs, { col: 'title', dir: 'asc' }])} className="text-[10px] font-bold text-[#111827] hover:underline">Add Sort</button>
                        </div>
                        <div className="space-y-3">
                            {sortConfigs.map((s, i) => (
                                <div key={i} className="flex gap-2 relative group/sort p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <button onClick={() => onSortConfigsChange(sortConfigs.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 size-5 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center opacity-0 group-hover/sort:opacity-100 transition-opacity text-gray-500 hover:text-black hover:bg-gray-50 cursor-pointer z-10">
                                        <X size={10} />
                                    </button>
                                    <select className="flex-1 h-8 bg-white border border-gray-200 text-[10px] font-bold focus:outline-none rounded px-2" value={s.col}
                                        onChange={e => { const nc = [...sortConfigs]; nc[i].col = e.target.value; onSortConfigsChange(nc); }}>
                                        <option value="title">Title</option>
                                        {Object.keys(database.schema).sort().map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                    <select className="h-8 bg-white border border-gray-200 px-2 rounded text-[9px] font-bold uppercase tracking-wider text-gray-600 focus:outline-none" value={s.dir}
                                        onChange={e => { const nc = [...sortConfigs]; nc[i].dir = e.target.value as 'asc'|'desc'; onSortConfigsChange(nc); }}>
                                        <option value="asc">Asc</option>
                                        <option value="desc">Desc</option>
                                    </select>
                                </div>
                            ))}
                            {sortConfigs.length === 0 && <div className="text-center py-8 text-[10px] font-bold text-gray-400">No active sorts</div>}
                        </div>
                    </div>
                )}

                {page === 'visibility' && (
                    <div className="space-y-0.5">
                        <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Visible Properties</div>
                        {Object.keys(database.schema).sort().map(name => {
                            const isHidden = hiddenProperties.includes(name);
                            return (
                                <button key={name} onClick={() => onToggleVisibility(name)} className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded transition-all group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn("size-3.5 rounded-sm border shrink-0 flex items-center justify-center transition-colors", isHidden ? "border-gray-200 bg-white" : "border-[#111827] bg-[#111827]")}>
                                            {!isHidden && <X size={8} className="text-white rotate-45" />}
                                        </div>
                                        <span className={cn("text-[11px] font-medium truncate", isHidden ? "text-gray-400" : "text-gray-800")}>{name}</span>
                                    </div>
                                    {!isHidden ? <Eye size={12} className="text-gray-400 shrink-0" /> : <Eye size={12} className="text-transparent shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                {page === 'properties' && (
                    <div className="space-y-0.5">
                        {Object.entries(database.schema).sort().map(([name, meta]) => (
                            <button key={name} onClick={() => { setEditingProp(name); const typeStr = typeof meta === 'string' ? meta : meta.type; setFormData({ name, type: typeStr, source: meta.source || "" }); setPage('edit_property'); }}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded transition-all group text-left">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="shrink-0">{getIcon(typeof meta === 'string' ? meta : meta.type)}</div>
                                    <span className="text-[11px] font-medium text-gray-700 truncate">{name}</span>
                                </div>
                                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 shrink-0" />
                            </button>
                        ))}
                        <button onClick={() => { setFormData({ name: '', type: 'str', source: '' }); setPage('add_property'); }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 text-[#111827] rounded transition-all mt-2 border border-dashed border-gray-200">
                            <Plus size={14} className="text-gray-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Add Property</span>
                        </button>
                    </div>
                )}

                {(page === 'add_property' || page === 'edit_property') && (
                    <div className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Label</label>
                            <input autoFocus className="w-full h-8 bg-white border border-gray-200 px-3 rounded text-[11px] placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none transition-all shadow-sm"
                                value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Property Name..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Type</label>
                            <div className="relative group/select">
                                <select className="w-full h-8 bg-white border border-gray-200 px-3 rounded text-[11px] focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none appearance-none transition-all shadow-sm text-gray-700"
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
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        {['select', 'relation', 'formula', 'button'].includes(formData.type) && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {formData.type === 'formula' ? 'Expression (e.g. prop("Price") * 2)' : 
                                     formData.type === 'button' ? 'Action (e.g. SET(Status, \'Done\'))' : 'Link Source'}
                                </label>
                                <input className="w-full h-8 bg-white border border-gray-200 px-3 rounded text-[11px] placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300 focus:outline-none transition-all shadow-sm font-mono"
                                    value={formData.source} onChange={e => setFormData(p => ({ ...p, source: e.target.value }))} 
                                    placeholder={formData.type === 'formula' ? 'prop("Col") * 5 ...' : 
                                                 formData.type === 'button' ? 'SET(Prop, Val); SET(...)' : 'Folder or Note path...'} />
                            </div>
                        )}
                        <div className="flex gap-2 pt-4">
                            <button onClick={page === 'add_property' ? handleAddProperty : handleUpdateProperty} disabled={loading}
                                className="flex-1 h-8 bg-[#111827] text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-black transition-all">
                                {loading ? 'Saving...' : 'Confirm'}
                            </button>
                            {page === 'edit_property' && (
                                <button onClick={() => handleDeleteProperty(editingProp!)} className="px-3 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 transition-all">
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
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 rounded transition-all group/item text-left"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-gray-400 group-hover/item:text-[#111827] transition-colors shrink-0">{icon}</span>
                <span className="text-[11px] font-medium text-gray-700 truncate">{label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {value && <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{value}</span>}
                {showChevron && <ChevronRight size={14} className="text-gray-300 group-hover/item:text-gray-500 transition-colors" />}
            </div>
        </button>
    )
}
