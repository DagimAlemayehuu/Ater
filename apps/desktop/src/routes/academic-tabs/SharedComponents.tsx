import React, {useState, useEffect, useMemo, useCallback} from 'react'
import {Check, Edit3, Plus, ChevronRight, X} from 'lucide-react'
import {format, parseISO} from 'date-fns'
import {cn} from '@/lib/utils'
import {sidecarApi} from '@/lib/sidecarApi'
import {stripWL, statusColorClass, getYearOrder, wrapWL, cleanTitle} from './utils'
import type {VaultDatabase} from './types'

// ─── Tab Button ────────────────────────────────────────────────────────────────
export function TabButton({active, onClick, icon, label}: {
 active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
 return (
 <button onClick={onClick} className={cn(
 'relative flex-none flex items-center gap-1.5 pb-2.5 pt-2 px-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2',
 active
 ? 'text-foreground border-foreground'
 : 'text-muted-foreground/40 border-transparent hover:text-foreground hover:border-border'
 )}>
 {icon}<span>{label}</span>
 </button>
 )
}

// ─── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({title, count, onAction, actionLabel}: {
 title: string; count?: number; onAction?: () => void; actionLabel?: string
}) {
 return (
 <div className="flex items-center gap-3">
 <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 shrink-0">{title}</h2>
 {count !== undefined && <span className="text-[8px] font-black text-muted-foreground/30">{count}</span>}
 <div className="h-px flex-1 bg-border/10" />
 {onAction && (
 <button onClick={onAction} className="flex items-center gap-1 px-2 py-1 text-foreground border border-border bg-background text-[8px] font-black uppercase tracking-widest rounded hover:border-foreground/50 transition-all">
 <Plus size={8} />{actionLabel || 'Add'}
 </button>
 )}
 </div>
 )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({message, icon}: {message: string; icon?: React.ReactNode}) {
 return (
 <div className="py-16 text-center border border-border/10 rounded-2xl w-full bg-muted/5 flex flex-col items-center gap-3">
 {icon && <div className="text-muted-foreground/20">{icon}</div>}
 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">{message}</p>
 </div>
 )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({label, value, accent, onClick}: {label: string; value: string | number; accent?: boolean; onClick?: () => void}) {
 return (
 <div onClick={onClick} className={cn('p-6 border border-border/10 rounded-2xl bg-muted/5 flex flex-col gap-2 transition-all', onClick && 'cursor-pointer hover:bg-muted/10 hover:border-foreground/10')}>
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{label}</span>
 <span className={cn('text-xl font-black tracking-tighter truncate', accent ? 'text-primary' : 'text-foreground')}>{value}</span>
 </div>
 )
}

// ─── Big Property Card ────────────────────────────────────────────────────────
export function BigPropertyCard({label, value, schema, onUpdate}: {
 label: string; value: any; schema?: any; onUpdate: (val: any) => void
}) {
 const cardId = useMemo(() => Math.random().toString(36).substr(2, 9), [])
 const [isEditing, setIsEditing] = useState(false)

 useEffect(() => {
 const handler = (e: any) => {
 if (e.detail?.id !== cardId) setIsEditing(false)
}
 window.addEventListener('ACADEMIC_CLOSE_MENUS', handler)
 return () => window.removeEventListener('ACADEMIC_CLOSE_MENUS', handler)
}, [cardId])

 const startEditing = (e?: React.MouseEvent) => {
 if (e) e.stopPropagation()
 window.dispatchEvent(new CustomEvent('ACADEMIC_CLOSE_MENUS', {detail: {id: cardId}}))
 setIsEditing(true)
}
 const [editValue, setEditValue] = useState(String(value || ''))
 const type = schema?.type || 'str'
 const isEmpty = value === undefined || value === null || value === ''

 const handleSave = (val?: any) => {
 onUpdate(val !== undefined ? val : editValue)
 setIsEditing(false)
}

 const displayLabel = label.replace(/_/g, ' ')

 if (type === 'bool') {
 const isChecked = value === true || value === 'true'
 return (
 <div className="p-6 border border-border/10 rounded-2xl bg-muted/5 flex flex-col justify-between gap-6 hover:border-foreground/10 transition-all">
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{displayLabel}</span>
 <div className="flex items-center justify-between">
 <span className="text-xl font-black uppercase tracking-tight">{isChecked ? 'Yes' : 'No'}</span>
 <button onClick={() => handleSave(!isChecked)} className={cn('w-8 h-8 flex items-center justify-center rounded-xl transition-all', isChecked ? 'text-foreground border border-foreground bg-muted/5' : 'bg-muted/5 border border-border/20 hover:bg-muted/10')}>
 <Check size={16} strokeWidth={4} />
 </button>
 </div>
 </div>
 )
}

 return (
 <div className="p-6 border border-border/10 rounded-2xl bg-muted/5 flex flex-col gap-3 group/bigprop relative hover:bg-muted/10 hover:border-foreground/20 transition-all cursor-pointer"
 onClick={startEditing}>
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{displayLabel}</span>
 <div className="flex items-center gap-2">
 {isEditing && <span className="text-[8px] font-black text-primary uppercase animate-pulse">Editing</span>}
 <Edit3 size={11} className="text-muted-foreground/0 group-hover/bigprop:text-muted-foreground/20 transition-all" />
 </div>
 </div>

 {isEditing ? (
 type === 'select' || type === 'relation' ? (
 <div className="relative">
 <span className="text-2xl font-black tracking-tighter text-primary">Select {displayLabel}</span>
 <SelectPropertyEditor value={String(value || '')} source={schema?.source} label={displayLabel} onSave={handleSave} onCancel={() => setIsEditing(false)} />
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <input
 autoFocus
 value={editValue}
 onChange={e => setEditValue(e.target.value)}
 onBlur={() => handleSave()}
 onKeyDown={e => e.key === 'Enter' && handleSave()}
 className="w-full bg-muted/10 px-2 py-1 rounded text-xl font-black uppercase outline-none focus:ring-1 focus:ring-primary/30 transition-all border-none"
 />
 </div>
 )
 ) : (
 <span className={cn('text-xl font-black tracking-tighter truncate leading-none', isEmpty ? 'text-muted-foreground/10 italic' : 'text-foreground')}>
 {isEmpty ? 'None' : (
 type === 'select' || type === 'relation' ? cleanTitle(stripWL(String(value)).split('/').pop() || '') :
 type === 'date' && value ? (() => {try {return format(parseISO(String(value)), 'MMM dd, yyyy')} catch {return String(value)}})() :
 cleanTitle(String(value))
 )}
 </span>
 )}
 </div>
 )
}

// ─── Inline Title Editor ──────────────────────────────────────────────────────
export function EditableTitle({value, onSave, className}: {
 value: string; onSave: (next: string) => void; className?: string
}) {
 const [isEditing, setIsEditing] = useState(false)
 const [editValue, setEditValue] = useState(value)

 useEffect(() => {
 setEditValue(value)
}, [value])

 if (isEditing) {
 return (
 <input
 autoFocus
 value={editValue}
 onChange={e => setEditValue(e.target.value)}
 onBlur={() => {
 if (editValue.trim() && editValue !== value) onSave(editValue.trim())
 setIsEditing(false)
}}
 onKeyDown={e => {
 if (e.key === 'Enter') {
 if (editValue.trim() && editValue !== value) onSave(editValue.trim())
 setIsEditing(false)
}
 if (e.key === 'Escape') {
 setEditValue(value)
 setIsEditing(false)
}
}}
 className={cn('bg-muted/10 px-2 rounded outline-none w-full border-none focus:ring-1 focus:ring-primary/30 transition-all', className)}
 />
 )
}

 return (
 <div className={cn('cursor-pointer hover:text-primary transition-colors block group/title relative outline-none', className)}
 onClick={() => setIsEditing(true)}>
 {value}
 <Edit3 size={12} className="inline-block ml-2 opacity-0 group-hover/title:opacity-10 transition-all" />
 </div>
 )
}

// ─── Badge Pill ────────────────────────────────────────────────────────────────
export function BadgePill({label, colorClass}: {label: string; colorClass: string}) {
 return (
 <span className={cn('px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border', colorClass)}>
 {label}
 </span>
 )
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({value}: {value: string}) {
 const display = stripWL(value)
 if (!display) return null
 return <BadgePill label={display} colorClass={statusColorClass(display)} />
}

// ─── Progress Ring ─────────────────────────────────────────────────────────────
export function ProgressRing({done, total, size = 32}: {done: number; total: number; size?: number}) {
 const pct = total > 0 ? done / total : 0
 const r = (size - 6) / 2
 const circ = 2 * Math.PI * r
 const dash = circ * pct
 return (
 <svg width={size} height={size} style={{transform: 'rotate(-90deg)'}}>
 <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={3} opacity={0.2} />
 <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--foreground))" strokeWidth={3}
 strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition: 'stroke-dasharray 0.5s ease'}} />
 </svg>
 )
}

// ─── Inline Create Banner ──────────────────────────────────────────────────────
export function CreateBanner({label, onConfirm, onCancel}: {
 label: string; onConfirm: (name: string) => void; onCancel: () => void
}) {
 const [name, setName] = useState('')
 return (
 <div className="mx-6 lg:mx-10 mb-4 p-3 bg-muted/5 border border-primary/20 rounded-xl flex items-center gap-3 ">
 <Plus size={12} className="text-primary shrink-0" />
 <input
 autoFocus value={name} onChange={e => setName(e.target.value)}
 placeholder={`New ${label} name...`}
 className="flex-1 bg-transparent border-b border-primary/30 focus:border-primary text-sm font-bold focus:outline-none transition-colors pb-0.5"
 onKeyDown={e => {if (e.key === 'Enter') onConfirm(name); if (e.key === 'Escape') onCancel()}}
 />
 <button onClick={() => onConfirm(name)} disabled={!name.trim()} className="px-3 py-1.5 text-foreground border border-border bg-background text-[9px] font-black uppercase rounded hover:border-foreground/50 disabled:opacity-20 transition-all">Deploy</button>
 <button onClick={onCancel} className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-all"><X size={12} /></button>
 </div>
 )
}

// ─── Academic Roadmap (Year Timeline) ──────────────────────────────────────────
export function AcademicRoadmap({items, activeId, onSelect}: {
 items: any[]; activeId: string | null; onSelect: (id: string) => void
}) {
 const sorted = [...items].sort((a, b) => getYearOrder(a.title) - getYearOrder(b.title))
 const completedCount = sorted.filter(i => stripWL(i.Status || i.properties?.Status || '').toLowerCase().includes('complet')).length
 const progressPct = sorted.length > 1 ? ((completedCount - 1) / (sorted.length - 1)) * 100 : 0

 return (
 <div className="roadmap-container pl-2">
 <div className="roadmap-line opacity-5" />
 <div className="roadmap-line roadmap-line-solid transition-all " style={{height: `${Math.max(0, progressPct)}%`, opacity: progressPct > 0 ? 1 : 0}} />
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
 <span className={cn('text-[11px] font-black uppercase', isActive ? 'text-foreground' : isCompleted ? 'text-muted-foreground/20' : 'text-muted-foreground/40 group-hover:text-foreground/60')}>{cleanTitle(item.title)}</span>
 </div>
 </div>
 )
})}
 </div>
 )
}


// ─── Select Property Editor ────────────────────────────────────────────────────
export function SelectPropertyEditor({value, source, onSave, onCancel, label: displayLabel}: {
 value: string; source?: string; onSave: (val: string) => void; onCancel: () => void; label?: string
}) {
 const [options, setOptions] = useState<string[]>([])
 const [search, setSearch] = useState('')

 useEffect(() => {
 if (source) {
 sidecarApi.getVaultOptions(source).then(r => {
 let opts = r.options || []
 if (displayLabel?.toLowerCase().includes('status')) {
 opts = ['Active', 'Completed', 'Upcoming']
}
 setOptions(opts)
}).catch(() => {})
}
}, [source, displayLabel])

 const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
 const rawValue = stripWL(value)

 return (
 <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] bg-background border border-border/20 rounded-xl shadow-xl z-50 p-2 -95"
 onClick={e => e.stopPropagation()}>
 <input autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
 className="w-full bg-muted/5 text-[10px] font-black uppercase px-3 py-2 rounded-lg mb-2 focus:outline-none" />
 <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5">
 {filtered.map(opt => (
 <button key={opt} onClick={(e) => {e.stopPropagation(); onSave(wrapWL(opt))}} className={cn(
 'px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-left transition-all',
 rawValue === opt ? 'bg-primary/10 text-primary' : 'hover:bg-muted/10 text-foreground/70'
 )}>{cleanTitle(opt)}</button>
 ))}
 </div>
 <button onClick={async (e) => {
 e.stopPropagation()
 const name = window.prompt(`Add new ${cleanTitle(displayLabel || '')} option`)
 if (name && source) {
 try {
 await sidecarApi.createVaultOption(source, name)
 setOptions(prev => [...prev, name].sort())
} catch {console.error('Failed to add option')}
}
}} className="w-full mt-2 py-2 border border-dashed border-border/40 rounded-lg text-[8px] font-black uppercase text-muted-foreground/40 hover:text-foreground hover:bg-muted/10 transition-all flex items-center justify-center gap-2">
 <Plus size={10} /> Add Option
 </button>
 </div>
 )
}

// ─── Program Setup Form ────────────────────────────────────────────────────────
export function ProgramSetupForm({onScaffold}: {
 onScaffold: (name: string, years: number, level: string, currentYearIdx: number) => void
}) {
 const [name, setName] = useState('')
 const [years, setYears] = useState(4)
 const [currentYear, setCurrentYear] = useState(1)
 const [level, setLevel] = useState('Undergraduate')

 return (
 <div className="p-10 border border-border/10 rounded-2xl bg-muted/5 flex flex-col items-center justify-center text-center space-y-8 -95">
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
 className="w-full py-3.5 text-foreground border border-border bg-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-foreground/50 disabled:opacity-20 transition-all">
 Deploy Roadmap
 </button>
 </div>
 </div>
 )
}
