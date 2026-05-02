import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Check, Edit3, Plus, ChevronRight, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { sidecarApi } from '@/lib/sidecarApi'
import { stripWL, statusColorClass, getYearOrder } from './utils'
import type { VaultDatabase } from './types'

// ─── Tab Button ────────────────────────────────────────────────────────────────
export function TabButton({ active, onClick, icon, label }: {
    active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
    return (
        <button onClick={onClick} className={cn(
            'flex-none flex items-center gap-2 py-2.5 px-5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
            active ? 'bg-background text-foreground shadow-sm border border-border/40' : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/10'
        )}>
            {icon}<span>{label}</span>
        </button>
    )
}

// ─── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, count, onAction, actionLabel }: {
    title: string; count?: number; onAction?: () => void; actionLabel?: string
}) {
    return (
        <div className="flex items-center gap-3">
            <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 shrink-0">{title}</h2>
            {count !== undefined && <span className="text-[8px] font-black text-muted-foreground/30">{count}</span>}
            <div className="h-px flex-1 bg-border/10" />
            {onAction && (
                <button onClick={onAction} className="flex items-center gap-1 px-2 py-1 bg-foreground text-background text-[8px] font-black uppercase tracking-widest rounded hover:opacity-80 transition-all">
                    <Plus size={8} />{actionLabel || 'Add'}
                </button>
            )}
        </div>
    )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
    return (
        <div className="py-16 text-center border border-border/10 rounded-2xl w-full bg-muted/5 flex flex-col items-center gap-3">
            {icon && <div className="text-muted-foreground/20">{icon}</div>}
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">{message}</p>
        </div>
    )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
    return (
        <div className="p-5 border border-border/10 rounded-xl bg-muted/5 flex flex-col gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{label}</span>
            <span className={cn('text-2xl font-black tracking-tighter', accent ? 'text-primary' : 'text-foreground')}>{value}</span>
        </div>
    )
}

// ─── Badge Pill ────────────────────────────────────────────────────────────────
export function BadgePill({ label, colorClass }: { label: string; colorClass: string }) {
    return (
        <span className={cn('px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border', colorClass)}>
            {label}
        </span>
    )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ value }: { value: string }) {
    const display = stripWL(value)
    if (!display) return null
    return <BadgePill label={display} colorClass={statusColorClass(display)} />
}

// ─── Progress Ring ─────────────────────────────────────────────────────────────
export function ProgressRing({ done, total, size = 32 }: { done: number; total: number; size?: number }) {
    const pct = total > 0 ? done / total : 0
    const r = (size - 6) / 2
    const circ = 2 * Math.PI * r
    const dash = circ * pct
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={3} opacity={0.2} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--foreground))" strokeWidth={3}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
    )
}

// ─── Inline Create Banner ──────────────────────────────────────────────────────
export function CreateBanner({ label, onConfirm, onCancel }: {
    label: string; onConfirm: (name: string) => void; onCancel: () => void
}) {
    const [name, setName] = useState('')
    return (
        <div className="mx-6 lg:mx-10 mb-4 p-3 bg-muted/5 border border-primary/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <Plus size={12} className="text-primary shrink-0" />
            <input
                autoFocus value={name} onChange={e => setName(e.target.value)}
                placeholder={`New ${label} name...`}
                className="flex-1 bg-transparent border-b border-primary/30 focus:border-primary text-sm font-bold focus:outline-none transition-colors pb-0.5"
                onKeyDown={e => { if (e.key === 'Enter') onConfirm(name); if (e.key === 'Escape') onCancel() }}
            />
            <button onClick={() => onConfirm(name)} disabled={!name.trim()} className="px-3 py-1.5 bg-foreground text-background text-[9px] font-black uppercase rounded hover:opacity-90 disabled:opacity-20 transition-all">Deploy</button>
            <button onClick={onCancel} className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-all"><X size={12} /></button>
        </div>
    )
}

// ─── Academic Roadmap (Year Timeline) ──────────────────────────────────────────
export function AcademicRoadmap({ items, activeId, onSelect }: {
    items: any[]; activeId: string | null; onSelect: (id: string) => void
}) {
    const sorted = [...items].sort((a, b) => getYearOrder(a.title) - getYearOrder(b.title))
    const completedCount = sorted.filter(i => stripWL(i.Status || i.properties?.Status || '').toLowerCase().includes('complet')).length
    const progressPct = sorted.length > 1 ? ((completedCount - 1) / (sorted.length - 1)) * 100 : 0

    return (
        <div className="roadmap-container pl-2">
            <div className="roadmap-line opacity-5" />
            <div className="roadmap-line roadmap-line-solid transition-all duration-700" style={{ height: `${Math.max(0, progressPct)}%`, opacity: progressPct > 0 ? 1 : 0 }} />
            {sorted.map((item, idx) => {
                const status = stripWL(item.Status || item.properties?.Status || '').toLowerCase()
                const isCompleted = status.includes('complet')
                const isActive = item['Current Year'] === true || item['Current Year'] === 'true' || item.properties?.['Current Year'] === true
                return (
                    <div key={idx} className="roadmap-node group cursor-pointer" onClick={() => onSelect(item.id)}>
                        <div className={cn('roadmap-dot', isCompleted ? 'roadmap-dot-completed' : isActive ? 'roadmap-dot-active pulse-node' : 'roadmap-dot-planned', activeId === item.id && 'ring-2 ring-primary/40')}>
                            {isCompleted ? <Check size={10} strokeWidth={4} /> : (idx + 1)}
                        </div>
                        <div className="roadmap-content">
                            <span className={cn('text-[11px] font-black uppercase', isActive ? 'text-foreground' : isCompleted ? 'text-muted-foreground/20' : 'text-muted-foreground/40 group-hover:text-foreground/60')}>{item.title}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Course Property Grid ──────────────────────────────────────────────────────
export function CoursePropertyGrid({ item, schema, onUpdate }: {
    item: any; schema: Record<string, any>; onUpdate: (key: string, value: any) => void
}) {
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    const allKeys = useMemo(() => {
        const internal = ['id', 'title', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by']
        const keys = new Set([...Object.keys(schema || {}), ...Object.keys(item || {})])
        return Array.from(keys).filter(k => !internal.includes(k)).sort()
    }, [schema, item])

    const handleSave = (key: string, val?: any) => {
        onUpdate(key, val !== undefined ? val : editValue)
        setEditingKey(null)
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allKeys.map(key => {
                const value = item?.[key]
                const propSchema = schema?.[key] || {}
                const propType = propSchema.type || 'str'
                const isEmpty = value === undefined || value === null || value === ''

                if (propType === 'bool') {
                    const isChecked = value === true || value === 'true'
                    return (
                        <div key={key} className="p-3 bg-muted/5 border border-border/10 rounded-xl flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">{key.replace(/_/g, ' ')}</span>
                            <button onClick={() => handleSave(key, !isChecked)} className={cn('w-4 h-4 flex items-center justify-center rounded transition-all', isChecked ? 'bg-primary text-primary-foreground' : 'border border-border/40')}>
                                <Check size={9} strokeWidth={4} />
                            </button>
                        </div>
                    )
                }

                return (
                    <div key={key} className="p-3 bg-muted/5 border border-border/10 rounded-xl flex flex-col gap-1.5 group/prop relative hover:bg-muted/10 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">{key.replace(/_/g, ' ')}</span>
                            <Edit3 size={9} className="text-muted-foreground/0 group-hover/prop:text-muted-foreground/30 transition-all" />
                        </div>
                        {editingKey === key ? (
                            propType === 'select' || propType === 'relation' ? (
                                <SelectPropertyEditor value={String(value || '')} source={propSchema.source} onSave={(v) => handleSave(key, v)} onCancel={() => setEditingKey(null)} />
                            ) : (
                                <div className="flex items-center gap-1">
                                    <input autoFocus type={propType === 'date' ? 'date' : propType === 'number' ? 'number' : 'text'} value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSave(key); if (e.key === 'Escape') setEditingKey(null) }}
                                        className="flex-1 bg-transparent border-b border-primary text-[11px] font-bold focus:outline-none" />
                                    <button onMouseDown={e => { e.preventDefault(); handleSave(key) }} className="text-primary"><Check size={11} /></button>
                                </div>
                            )
                        ) : (
                            <div className={cn('text-[11px] font-bold cursor-text truncate min-h-[16px]', isEmpty ? 'text-muted-foreground/20 italic' : 'text-foreground')}
                                onClick={() => { setEditingKey(key); setEditValue(String(value || '')) }}>
                                {isEmpty ? 'Empty' : (
                                    propType === 'select' || propType === 'relation' ? stripWL(String(value)).split('/').pop() :
                                    propType === 'date' && value ? (() => { try { return format(parseISO(String(value)), 'MMM dd, yyyy') } catch { return String(value) } })() :
                                    String(value)
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─── Select Property Editor ────────────────────────────────────────────────────
export function SelectPropertyEditor({ value, source, onSave, onCancel }: {
    value: string; source?: string; onSave: (val: string) => void; onCancel: () => void
}) {
    const [options, setOptions] = useState<string[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (source) {
            sidecarApi.getVaultOptions(source).then(r => setOptions(r.options || [])).catch(() => {})
        }
    }, [source])

    const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    const rawValue = stripWL(value)

    return (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] bg-background border border-border/20 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95">
            <input autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-muted/5 text-[10px] font-black uppercase px-3 py-2 rounded-lg mb-2 focus:outline-none" />
            <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5">
                {filtered.map(opt => (
                    <button key={opt} onClick={() => onSave(`[[${opt}]]`)} className={cn(
                        'px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-left transition-all',
                        rawValue === opt ? 'bg-primary/10 text-primary' : 'hover:bg-muted/10 text-foreground/70'
                    )}>{opt}</button>
                ))}
                {filtered.length === 0 && <p className="px-3 py-2 text-[9px] text-muted-foreground/30 font-black uppercase">No options</p>}
            </div>
        </div>
    )
}

// ─── Program Setup Form ────────────────────────────────────────────────────────
export function ProgramSetupForm({ onScaffold }: {
    onScaffold: (name: string, years: number, level: string, currentYearIdx: number) => void
}) {
    const [name, setName] = useState('')
    const [years, setYears] = useState(4)
    const [currentYear, setCurrentYear] = useState(1)
    const [level, setLevel] = useState('Undergraduate')

    return (
        <div className="p-10 border border-border/10 rounded-2xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight">Initialize Program</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Works for High School, Undergrad, Masters, or PhD</p>
            </div>
            <div className="w-full max-w-sm space-y-4 text-left">
                <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Program Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BSc Computer Science"
                        className="w-full bg-background border border-border/20 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Level</label>
                        <select value={level} onChange={e => setLevel(e.target.value)}
                            className="bg-background border border-border/20 px-3 py-3 rounded-xl text-[10px] font-black uppercase outline-none">
                            <option>High School</option>
                            <option>Undergraduate</option>
                            <option>Master's</option>
                            <option>PhD</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Duration</label>
                        <input type="number" value={years} onChange={e => setYears(parseInt(e.target.value))}
                            className="bg-background border border-border/20 px-3 py-3 rounded-xl text-sm font-bold outline-none" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Current Yr</label>
                        <input type="number" min={1} max={years} value={currentYear} onChange={e => setCurrentYear(parseInt(e.target.value))}
                            className="bg-background border border-border/20 px-3 py-3 rounded-xl text-sm font-bold outline-none" />
                    </div>
                </div>
                <button onClick={() => onScaffold(name, years, level, currentYear - 1)} disabled={!name.trim()}
                    className="w-full py-3.5 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-20 transition-all">
                    Deploy Roadmap
                </button>
            </div>
        </div>
    )
}
