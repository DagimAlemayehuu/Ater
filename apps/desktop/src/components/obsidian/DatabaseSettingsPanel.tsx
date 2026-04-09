import React, { useState } from 'react'
import { 
    X, 
    Layout, 
    Eye, 
    Filter, 
    ArrowUpDown, 
    Layers, 
    Copy, 
    Database as DatabaseIcon, 
    Settings as SettingsIcon, 
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
    RefreshCw,
    ChevronDown
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
    activeTab: 'table' | 'board' | 'gallery'
    hiddenProperties: string[]
    onToggleVisibility: (name: string) => void
    sortConfig: { col: string, dir: 'asc' | 'desc' } | null
    onSortChange: (config: { col: string, dir: 'asc' | 'desc' } | null) => void
    onUpdateSchema: () => void
    onLayoutChange: (layout: 'table' | 'board' | 'gallery') => void
}

type SettingsPage = 'main' | 'properties' | 'add_property' | 'edit_property' | 'visibility' | 'sort'

export function DatabaseSettingsPanel({ 
    isOpen, 
    onClose, 
    database, 
    activeTab, 
    hiddenProperties,
    onToggleVisibility,
    sortConfig,
    onSortChange,
    onUpdateSchema, 
    onLayoutChange 
}: DatabaseSettingsPanelProps) {
    const [page, setPage] = useState<SettingsPage>('main')
    const [editingProp, setEditingProp] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', type: 'str', source: '' })
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleAddProperty = async () => {
        if (!formData.name.trim()) return
        setLoading(true)
        try {
            const newSchema = { 
                ...database.schema, 
                [formData.name]: ['select', 'relation'].includes(formData.type) 
                    ? { type: formData.type, source: formData.source || "" } 
                    : { type: formData.type } 
            }
            await sidecarApi.updateVaultDatabaseSchema(database.id, newSchema)
            onUpdateSchema()
            setPage('properties')
            setFormData({ name: '', type: 'str', source: '' })
        } catch (e) { console.error(e) }
        finally { setLoading(true) }
    }

    const handleUpdateProperty = async () => {
        if (!editingProp || !formData.name.trim()) return
        setLoading(true)
        try {
            const updatedSchema = { ...database.schema }
            const isRename = editingProp !== formData.name
            
            if (isRename) {
                delete updatedSchema[editingProp]
            }
            
            updatedSchema[formData.name] = ['select', 'relation'].includes(formData.type) 
                ? { type: formData.type, source: formData.source || "" } 
                : { type: formData.type }

            await sidecarApi.updateVaultDatabaseSchema(database.id, updatedSchema, isRename ? editingProp : undefined, isRename ? formData.name : undefined)
            onUpdateSchema()
            setPage('properties')
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleDeleteProperty = async (name: string) => {
        if (!confirm(`Delete property "${name}"? This will remove it from all records.`)) return
        setLoading(true)
        try {
            const newSchema = { ...database.schema }
            delete newSchema[name]
            await sidecarApi.updateVaultDatabaseSchema(database.id, newSchema)
            onUpdateSchema()
            setPage('properties')
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const getIcon = (type: string) => {
        switch(type) {
            case 'number':
            case 'int':
            case 'float': return <Hash size={12} className="opacity-40" />
            case 'date': return <Calendar size={12} className="opacity-40" />
            case 'bool': return <CheckSquare size={12} className="opacity-40" />
            case 'list': return <List size={12} className="opacity-40" />
            case 'select':
            case 'relation': return <LinkIcon size={12} className="opacity-40" />
            default: return <Type size={12} className="opacity-40" />
        }
    }

    return (
        <div className="absolute top-10 right-4 w-[280px] bg-background/95 backdrop-blur-md border border-border pb-2 shadow-2xl rounded-2xl z-[100] overflow-hidden flex flex-col max-h-[600px] animate-in slide-in-from-right-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 bg-secondary/5">
                <div className="flex items-center gap-2">
                    {page !== 'main' && (
                        <button onClick={() => setPage('main')} className="p-1 hover:bg-secondary rounded-full transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                        {page === 'main' ? 'View Settings' : 
                         page === 'properties' ? 'Edit Properties' : 
                         page === 'add_property' ? 'New Property' : 'Edit Property'}
                    </span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-full transition-colors opacity-20 hover:opacity-100">
                    <X size={16} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {page === 'main' && (
                    <div className="space-y-0.5">
                        <SettingItem 
                            icon={<Layout size={14} />} 
                            label="Layout" 
                            value={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
                            onClick={() => {
                                const next: any = activeTab === 'table' ? 'board' : activeTab === 'board' ? 'gallery' : 'table'
                                onLayoutChange(next)
                            }}
                            showChevron
                        />
                        <SettingItem 
                            icon={<Eye size={14} />} 
                            label="Property visibility" 
                            value={String(Object.keys(database.schema).length - hiddenProperties.length)} 
                            onClick={() => setPage('visibility')}
                            showChevron
                        />
                        <SettingItem icon={<Filter size={14} />} label="Filter" onClick={() => alert("Filter logic coming soon...")} />
                        <SettingItem 
                            icon={<ArrowUpDown size={14} />} 
                            label="Sort" 
                            value={sortConfig ? `${sortConfig.col} (${sortConfig.dir})` : 'Off'} 
                            onClick={() => setPage('sort')}
                            showChevron
                        />
                        <SettingItem icon={<Layers size={14} />} label="Group" onClick={() => alert("Group logic coming soon...")} />
                        
                        <div className="h-px bg-border/5 my-2 mx-2" />
                        
                        <SettingItem 
                            icon={<SettingsIcon size={14} />} 
                            label="Edit properties" 
                            onClick={() => setPage('properties')}
                            showChevron 
                        />
                    </div>
                )}

                {page === 'sort' && (
                    <div className="space-y-0.5">
                        <div className="px-4 py-2 text-[8px] font-black uppercase tracking-widest opacity-20">Sort By</div>
                        <button 
                            onClick={() => onSortChange(null)}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/10 rounded-xl transition-all group",
                                !sortConfig && "bg-secondary/5"
                            )}
                        >
                            <span className="text-xs font-bold tracking-tight opacity-40">None (Manual)</span>
                        </button>
                        
                        {['title', ...Object.keys(database.schema)].sort().map(name => {
                            const isActive = sortConfig?.col === name;
                            return (
                                <div key={name} className="space-y-0.5">
                                    <button 
                                        onClick={() => onSortChange({ col: name, dir: isActive && sortConfig.dir === 'asc' ? 'desc' : 'asc' })}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/10 rounded-xl transition-all group",
                                            isActive && "bg-secondary/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={cn("text-xs font-bold tracking-tight", isActive ? "text-primary" : "opacity-70")}>{name}</span>
                                        </div>
                                        {isActive && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                                                {sortConfig.dir}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                {page === 'visibility' && (
                    <div className="space-y-0.5">
                        <div className="px-4 py-2 text-[8px] font-black uppercase tracking-widest opacity-20">Visible Properties</div>
                        {Object.keys(database.schema).sort().map(name => {
                            const isHidden = hiddenProperties.includes(name);
                            return (
                                <button 
                                    key={name}
                                    onClick={() => onToggleVisibility(name)}
                                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-secondary/10 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "size-3 rounded border transition-all flex items-center justify-center",
                                            isHidden ? "border-border/20 bg-transparent" : "border-primary bg-primary"
                                        )}>
                                            {!isHidden && <X size={8} className="text-white rotate-45" />}
                                        </div>
                                        <span className={cn("text-xs font-bold tracking-tight", isHidden ? "opacity-30" : "opacity-100")}>{name}</span>
                                    </div>
                                    {!isHidden ? <Eye size={12} className="opacity-20" /> : <X size={12} className="opacity-20" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                {page === 'properties' && (
                    <div className="space-y-0.5">
                        {Object.entries(database.schema).sort().map(([name, meta]) => (
                            <button 
                                key={name}
                                onClick={() => {
                                    setEditingProp(name)
                                    const typeStr = typeof meta === 'string' ? meta : meta.type
                                    setFormData({ name, type: typeStr, source: meta.source || "" })
                                    setPage('edit_property')
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/50 rounded-lg transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    {getIcon(typeof meta === 'string' ? meta : meta.type)}
                                    <span className="text-xs font-bold tracking-tight">{name}</span>
                                </div>
                                <ChevronRight size={12} className="opacity-0 group-hover:opacity-20 transition-opacity" />
                            </button>
                        ))}
                        <button 
                            onClick={() => {
                                setFormData({ name: '', type: 'str', source: '' })
                                setPage('add_property')
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-primary/10 text-primary rounded-lg transition-all mt-2"
                        >
                            <Plus size={14} />
                            <span className="text-xs font-black uppercase tracking-widest">Add Property</span>
                        </button>
                    </div>
                )}

                {(page === 'add_property' || page === 'edit_property') && (
                    <div className="p-4 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Label</label>
                            <input 
                                autoFocus
                                className="w-full h-10 bg-secondary/5 border border-border/10 px-4 rounded-xl text-xs font-bold focus:border-primary/40 focus:outline-none transition-all shadow-inner"
                                value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                placeholder="Property Name..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Type</label>
                            <div className="relative group/select">
                                <select 
                                    className="w-full h-10 bg-secondary/5 border border-border/10 px-4 rounded-xl text-xs font-bold focus:border-primary/40 focus:outline-none appearance-none transition-all"
                                    value={formData.type}
                                    onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                                >
                                    <option value="str">Text</option>
                                    <option value="number">Number</option>
                                    <option value="select">Select</option>
                                    <option value="relation">Relation</option>
                                    <option value="date">Date</option>
                                    <option value="bool">Checkbox</option>
                                    <option value="list">List</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3 opacity-20 pointer-events-none group-focus-within/select:opacity-100" />
                            </div>
                        </div>

                        {['select', 'relation'].includes(formData.type) && (
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">Link Source</label>
                                <input 
                                    className="w-full h-10 bg-secondary/5 border border-border/10 px-4 rounded-xl text-xs font-bold focus:border-primary/40 focus:outline-none shadow-inner"
                                    value={formData.source}
                                    onChange={e => setFormData(p => ({ ...p, source: e.target.value }))}
                                    placeholder="Folder or Note path..."
                                />
                            </div>
                        )}

                        <div className="flex gap-2 pt-4">
                            <button 
                                onClick={page === 'add_property' ? handleAddProperty : handleUpdateProperty}
                                disabled={loading}
                                className="flex-1 h-10 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl shadow-primary/20"
                            >
                                {loading ? 'Saving...' : 'Confirm'}
                            </button>
                            {page === 'edit_property' && (
                                <button 
                                    onClick={() => handleDeleteProperty(editingProp!)}
                                    className="p-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-all"
                                >
                                    <Trash2 size={16} />
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
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/10 rounded-xl transition-all group/item"
        >
            <div className="flex items-center gap-3">
                <span className="opacity-20 group-hover/item:opacity-100 transition-opacity">{icon}</span>
                <span className="text-xs font-bold tracking-tight opacity-70 group-hover/item:opacity-100">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-[9px] font-black uppercase tracking-widest opacity-20">{value}</span>}
                {showChevron && <ChevronRight size={14} className="opacity-10" />}
            </div>
        </button>
    )
}
