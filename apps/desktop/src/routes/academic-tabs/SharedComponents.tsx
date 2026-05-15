import React, {useState, useEffect, useMemo, useCallback} from 'react'
import {Check, Edit3, Plus, X} from 'lucide-react'
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
 'relative flex-none flex items-center gap-1.5 pb-2.5 pt-2 px-4 text-[9px] font-black uppercase tracking-widest  whitespace-nowrap border-b-2 focus-visible:ring-1 focus-visible:ring-primary outline-none',
 active
 ? 'text-foreground border-foreground'
 : 'text-foreground/50 border-transparent  hover:border-border'
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
 <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/60 shrink-0">{title}</h2>
 {count !== undefined && <span className="text-[8px] font-black text-muted-foreground">{count}</span>}
 <div className="h-px flex-1 bg-border" />
 {onAction && (
 <button onClick={onAction} className="flex items-center gap-1 px-2 py-1 text-foreground border border-border bg-background text-[8px] font-black uppercase tracking-widest rounded hover:border-foreground/50 ">
 <Plus size={8} />{actionLabel || 'Add'}
 </button>
 )}
 </div>
 )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({message, icon}: {message: string; icon?: React.ReactNode}) {
 return (
 <div className="py-16 text-center border border-border rounded-none w-full bg-muted/5 flex flex-col items-center gap-3">
 {icon && <div className="text-muted-foreground">{icon}</div>}
 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{message}</p>
 </div>
 )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({label, value, accent, onClick}: {label: string; value: string | number; accent?: boolean; onClick?: () => void}) {
 return (
 <div onClick={onClick} className={cn('p-6 border border-border rounded-none bg-muted/5 flex flex-col gap-2 ', onClick && 'cursor-pointer hover:bg-muted/10 hover:border-foreground/70')}>
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50">{label}</span>
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
 <div className="p-6 border border-border rounded-none bg-muted/5 flex flex-col justify-between gap-6 hover:border-foreground/70 ">
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50">{displayLabel}</span>
 <div className="flex items-center justify-between">
 <span className="text-xl font-black uppercase tracking-tight">{isChecked ? 'Yes' : 'No'}</span>
 <button onClick={() => handleSave(!isChecked)} className={cn('w-8 h-8 flex items-center justify-center rounded-none ', isChecked ? 'text-foreground border border-foreground bg-muted/5' : 'bg-muted/5 border border-border hover:bg-muted/10')}>
 <Check size={16} strokeWidth={4} />
 </button>
 </div>
 </div>
 )
}

 return (
 <div className="p-6 border border-border rounded-none bg-muted/5 flex flex-col gap-3 group/bigprop relative hover:bg-muted/10 hover:border-foreground/70  cursor-pointer"
 onClick={startEditing}>
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/50">{displayLabel}</span>
 <div className="flex items-center gap-2">
 {isEditing && <span className="text-[8px] font-black text-primary uppercase ">Editing</span>}
 <Edit3 size={11} className="text-muted-foreground/0 group-hover/bigprop:text-muted-foreground " />
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
 className="w-full bg-muted/10 px-2 py-1 rounded text-xl font-black uppercase outline-none focus:ring-1 focus:ring-primary/30  border-none"
 />
 </div>
 )
 ) : (
 <span className={cn('text-xl font-black tracking-tighter truncate leading-none', isEmpty ? 'text-muted-foreground italic' : 'text-foreground')}>
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
 className={cn('bg-muted/10 px-2 rounded outline-none w-full border-none focus:ring-1 focus:ring-primary/30 ', className)}
 />
 )
}

 return (
 <div className={cn('cursor-pointer text-foreground  block group/title relative outline-none', className)}
 onClick={() => setIsEditing(true)}>
 {value}
 <Edit3 size={12} className="inline-block ml-2 opacity-0 group-hover/title:opacity-10 " />
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
 <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-border/20" />
 <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-foreground"
 strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)'}} />
 </svg>
 )
}

// ─── Inline Create Banner ──────────────────────────────────────────────────────
export function CreateBanner({label, onConfirm, onCancel}: {
 label: string; onConfirm: (name: string) => void; onCancel: () => void
}) {
 const [name, setName] = useState('')
 return (
 <div className="mx-6 lg:mx-10 mb-4 p-3 bg-muted/5 border border-border rounded-none flex items-center gap-3 ">
 <Plus size={12} className="text-primary shrink-0" />
 <input
 autoFocus value={name} onChange={e => setName(e.target.value)}
 placeholder={`New ${label} name...`}
 className="flex-1 bg-transparent border-b border-primary/30 focus:border-primary text-sm font-bold focus:outline-none  pb-0.5"
 onKeyDown={e => {if (e.key === 'Enter') onConfirm(name); if (e.key === 'Escape') onCancel()}}
 />
 <button onClick={() => onConfirm(name)} disabled={!name.trim()} className="px-3 py-1.5 text-foreground border border-border bg-background text-[9px] font-black uppercase rounded hover:border-foreground/50 disabled:opacity-20 ">Deploy</button>
 <button onClick={onCancel} className="p-1.5 text-muted-foreground  "><X size={12} /></button>
 </div>
 )
}

// ─── Academic Roadmap (Year Timeline) ──────────────────────────────────────────
export function AcademicRoadmap({items, semesters = [], activeId, onSelect}: {
 items: any[]; semesters?: any[]; activeId: string | null; onSelect: (id: string) => void
}) {
 const sorted = [...items].sort((a, b) => getYearOrder(a.title) - getYearOrder(b.title))

 return (
 <div className="space-y-6">
 {sorted.map((item, idx) => {
 const status = stripWL(item.Status || item.properties?.Status || '').toLowerCase()
 const isCompleted = status.includes('complet')
 const isActive = item['Current Year'] === true || item['Current Year'] === 'true' || item.properties?.['Current Year'] === true
 const isSelected = activeId === item.id
 
 const yearSemesters = semesters.filter(s => {
    const semYear = stripWL(getVal(s, 'Year', 'year')).toLowerCase().trim()
    const targetYear = (item.title || '').toLowerCase().trim()
    return semYear === targetYear && targetYear !== ''
 }).sort((a, b) => {
    const order = ['Autumn', 'Fall', 'Winter', 'Spring', 'Summer']
    const ai = order.findIndex(o => a.title?.includes(o))
    const bi = order.findIndex(o => b.title?.includes(o))
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
 })

 return (
 <div key={idx} className="space-y-2">
 <div 
 onClick={() => onSelect(item.id)}
 className={cn(
    "group flex items-center justify-between p-3 rounded-none border  cursor-pointer",
    isSelected ? "border-foreground bg-foreground/5 shadow-[0_0_15px_rgba(255,255,255,0.02)]" : "border-border/40 hover:border-foreground/70 hover:bg-muted/5"
 )}>
 <div className="flex flex-col">
 <span className={cn("text-[10px] font-black uppercase tracking-widest ", isSelected ? "text-foreground" : "text-muted-foreground")}>{item.title}</span>
 <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground">{status}</span>
 </div>
 {isActive && <div className="w-1.5 h-1.5 rounded-none bg-foreground " />}
 </div>

 {yearSemesters.length > 0 && (
    <div className="pl-4 flex flex-col gap-1.5 border-l border-border/20 ml-2">
        {yearSemesters.map(s => {
            const sStatus = stripWL(getVal(s, 'Status', 'status')).toLowerCase()
            const sActive = sStatus.includes('active')
            return (
                <div key={s.id} className="flex items-center justify-between group/sem">
                    <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest ",
                        sActive ? "text-foreground" : "text-muted-foreground group-hover/sem:text-muted-foreground"
                    )}>{cleanTitle(s.title)}</span>
                    {sActive && <div className="w-1 h-1 rounded-none bg-foreground/70" />}
                </div>
            )
        })}
    </div>
 )}
 </div>
 )
})}
 </div>
 )
}

function getVal(obj: any, key: string, fallback?: string): string {
    if (!obj) return ''
    const val = obj[key] || (obj.properties && obj.properties[key])
    if (val !== undefined && val !== null) return String(val)
    if (fallback && obj[fallback]) return String(obj[fallback])
    return ''
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
 <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] bg-background border border-border rounded-none z-50 p-2 -95"
 onClick={e => e.stopPropagation()}>
 <input autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
 className="w-full bg-muted/5 text-[10px] font-black uppercase px-3 py-2 rounded-none mb-2 focus:outline-none" />
 <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5">
 {filtered.map(opt => (
 <button key={opt} onClick={(e) => {e.stopPropagation(); onSave(wrapWL(opt))}} className={cn(
 'px-3 py-1.5 rounded-none text-[10px] font-black uppercase text-left ',
 rawValue === opt ? 'bg-primary/10 text-primary' : 'hover:bg-muted/10 text-foreground'
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
}} className="w-full mt-2 py-2 border border-dashed border-border rounded-none text-[8px] font-black uppercase text-muted-foreground  hover:bg-muted/10  flex items-center justify-center gap-2">
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
 <div className="p-10 border border-border rounded-none bg-muted/5 flex flex-col items-center justify-center text-center space-y-8 -95">
 <div className="space-y-2">
 <h3 className="text-lg font-black uppercase tracking-tight">Initialize Program</h3>
 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Works for High School, Undergrad, Masters, or PhD</p>
 </div>
 <div className="w-full max-w-sm space-y-4 text-left">
 <div className="flex flex-col gap-1">
 <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Program Name</label>
 <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BSc Computer Science"
 className="w-full bg-background border border-border px-4 py-3 rounded-none text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20" />
 </div>
 <div className="grid grid-cols-3 gap-3">
 <div className="flex flex-col gap-1">
 <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Level</label>
 <select value={level} onChange={e => setLevel(e.target.value)}
 className="bg-background border border-border px-3 py-3 rounded-none text-[10px] font-black uppercase outline-none">
 <option>High School</option>
 <option>Undergraduate</option>
 <option>Master's</option>
 <option>PhD</option>
 </select>
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Duration</label>
 <input type="number" value={years} onChange={e => setYears(parseInt(e.target.value))}
 className="bg-background border border-border/20 px-3 py-3 rounded-none text-sm font-bold outline-none" />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Current Yr</label>
 <input type="number" min={1} max={years} value={currentYear} onChange={e => setCurrentYear(parseInt(e.target.value))}
 className="bg-background border border-border/20 px-3 py-3 rounded-none text-sm font-bold outline-none" />
 </div>
 </div>
 <button onClick={() => onScaffold(name, years, level, currentYear - 1)} disabled={!name.trim()}
 className="w-full py-3.5 text-foreground border border-border bg-background text-[10px] font-black uppercase tracking-widest rounded-none hover:border-foreground/50 disabled:opacity-20 ">
 Deploy Roadmap
 </button>
 </div>
 </div>
 )
 }
