import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Check, Edit3, Plus, X, ChevronRight, AlertTriangle, Trash2, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { stripWL, statusColorClass, getYearOrder, wrapWL, cleanTitle, getVal, getBoolVal } from './utils'
import type { VaultDatabase } from './types'

// ─── Tab Button ────────────────────────────────────────────────────────────────
export function TabButton({ active, onClick, icon, label, 'data-tour': dataTour }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; 'data-tour'?: string
}) {
  return (
    <button onClick={onClick} 
      data-tour={dataTour ?? `tab-${label.toLowerCase()}`}
      className={cn(
        'relative flex-none h-full flex items-center gap-1.5 px-4 text-[9px] font-black uppercase tracking-widest whitespace-nowrap focus-visible:ring-1 focus-visible:ring-primary outline-none transition-all',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
      )}
    >
      {icon}<span>{label}</span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />}
    </button>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, count, onAction, actionLabel }: {
  title: string; count?: number; onAction?: () => void; actionLabel?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 shrink-0">{title}</h2>
      {count !== undefined && <span className="text-[9px] font-black text-muted-foreground/30">{count}</span>}
      <div className="h-px flex-1 bg-border/40" />
      {onAction && (
        <button 
          onClick={onAction} 
          className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans"
        >
          + {String(actionLabel || 'ADD').toUpperCase()}
        </button>
      )}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="py-16 text-center border border-border w-full bg-bento-card rounded-[8px] flex flex-col items-center gap-3">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{message}</p>
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, accent, onClick, sub }: {
  label: string; value: string | number; accent?: boolean; onClick?: () => void; sub?: string
}) {
  return (
    <div onClick={onClick} className={cn(
      'p-2.5 px-3.5 border border-border/30 bg-muted/10 rounded-[6px] flex flex-col gap-0.5 transition-all',
      onClick && 'cursor-pointer hover:bg-muted/20 hover:border-foreground/20'
    )}>
      <span className="text-[7.5px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">{label}</span>
      <span className={cn('text-xs font-black tracking-tight truncate', accent ? 'text-foreground' : 'text-foreground/95')}>{value}</span>
      {sub && <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/30">{sub}</span>}
    </div>
  )
}

// ─── Editable Title ────────────────────────────────────────────────────────────
export function EditableTitle({ value, onSave, className }: {
  value: string; onSave: (next: string) => void | Promise<void>; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState(value)
  useEffect(() => { setDraft(value) }, [value])

  if (editing) {
    const handleSave = async () => {
      if (draft.trim() && draft !== value) {
        setIsSaving(true)
        try {
          await onSave(draft.trim())
        } finally {
          setIsSaving(false)
        }
      }
      setEditing(false)
    }

    return (
      <input autoFocus value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className={cn('bg-muted/10 px-2 outline-none w-full border-none focus:ring-1 focus:ring-primary/30', className)}
      />
    )
  }
  return (
    <div className={cn('cursor-pointer text-foreground flex items-center group/title relative outline-none', className, isSaving && 'opacity-50')}
      onClick={() => !isSaving && setEditing(true)}>
      <span>{cleanTitle(value)}</span>
      {isSaving ? (
        <RefreshCw size={11} className="ml-2 animate-spin text-muted-foreground" />
      ) : (
        <Edit3 size={11} className="ml-2 opacity-0 group-hover/title:opacity-20" />
      )}
    </div>
  )
}

// ─── Badge Pill ────────────────────────────────────────────────────────────────
export function BadgePill({ label, colorClass }: { label: string; colorClass: string }) {
  return <span className={cn('px-2 py-0.5 text-[7px] font-black uppercase tracking-widest border', colorClass)}>{label}</span>
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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-border/20" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-foreground transition-none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  )
}

// ─── Inline Create Banner ──────────────────────────────────────────────────────
export function CreateBanner({ label, onConfirm, onCancel, placeholder }: {
  label: string; onConfirm: (name: string) => void; onCancel: () => void; placeholder?: string
}) {
  const [name, setName] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="p-3 bg-bento-card border border-border rounded-[8px] flex items-center gap-3">
      <Plus size={12} className="text-muted-foreground shrink-0" />
      <input ref={ref} value={name} onChange={e => setName(e.target.value)}
        placeholder={placeholder || `New ${label} name...`}
        className="flex-1 bg-transparent border-b border-border focus:border-muted-foreground text-sm font-bold focus:outline-none pb-0.5 text-foreground placeholder:text-muted-foreground/30"
        onKeyDown={e => { if (e.key === 'Enter') onConfirm(name); if (e.key === 'Escape') onCancel() }}
      />
      <button onClick={() => onConfirm(name)} disabled={!name.trim()}
        className="h-8 px-4 text-background bg-foreground rounded-[8px] text-[9px] font-black uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-20 transition-all">
        Add
      </button>
      <button onClick={onCancel} className="p-1.5 text-muted-foreground"><X size={12} /></button>
    </div>
  )
}

// ─── Big Property Card ─────────────────────────────────────────────────────────
export function BigPropertyCard({ label, value, schema, onUpdate }: {
  label: string; value: any; schema?: any; onUpdate: (val: any) => void | Promise<void>
}) {
  const cardId = useMemo(() => crypto.randomUUID(), [])
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editVal, setEditVal] = useState(stripWL(value ?? ''))

  useEffect(() => { setEditVal(stripWL(value ?? '')) }, [value])

  useEffect(() => {
    const handler = (e: any) => { if (e.detail?.id !== cardId) setEditing(false) }
    window.addEventListener('ACADEMIC_CLOSE_MENUS', handler)
    return () => window.removeEventListener('ACADEMIC_CLOSE_MENUS', handler)
  }, [cardId])

  const startEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    window.dispatchEvent(new CustomEvent('ACADEMIC_CLOSE_MENUS', { detail: { id: cardId } }))
    setEditing(true)
  }

  const handleSave = async (v?: any) => {
    setIsSaving(true)
    try {
      await onUpdate(v !== undefined ? v : editVal)
    } finally {
      setIsSaving(false)
      setEditing(false)
    }
  }

  const type = (schema?.type) || (typeof value === 'boolean' ? 'bool' : 'str')
  const isEmpty = value === undefined || value === null || value === ''
  const displayLabel = label.replace(/_/g, ' ')
  // Display value — always strip wikilinks
  const displayVal = isEmpty ? '' : (
    type === 'date' && value
      ? (() => { try { return format(parseISO(String(value)), 'MMM dd, yyyy') } catch { return String(value) } })()
      : cleanTitle(String(value))
  )

  if (type === 'bool') {
    const checked = value === true || value === 'true'
    return (
      <div className="p-2.5 px-3.5 border border-border/80 bg-bento-card rounded-[6px] flex flex-col justify-between gap-1 hover:bg-bento-item/30 transition-colors cursor-pointer" onClick={() => handleSave(!checked)}>
        <span className="text-[7.5px] font-black uppercase tracking-[0.15em] text-muted-foreground">{displayLabel}</span>
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-foreground">{checked ? 'Yes' : 'No'}</span>
          <div className={cn('w-4 h-4 border flex items-center justify-center rounded-[4px]', checked ? 'border-foreground bg-bento-item' : 'border-border')}>
            {checked && <Check size={8} strokeWidth={3} className="text-foreground" />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-2.5 px-3.5 border border-border/80 bg-bento-card rounded-[6px] flex flex-col gap-1.5 group/bigprop relative hover:bg-bento-item/30 transition-colors cursor-pointer', isSaving && 'opacity-70')}
      onClick={() => !isSaving && startEdit()}>
      <div className="flex items-center justify-between">
        <span className="text-[7.5px] font-black uppercase tracking-[0.15em] text-muted-foreground">{displayLabel}</span>
        {isSaving ? (
          <RefreshCw size={8} className="animate-spin text-muted-foreground" />
        ) : (
          <Edit3 size={8} className="text-muted-foreground/0 group-hover/bigprop:text-muted-foreground/50" />
        )}
      </div>

      {editing ? (
        type === 'select' || type === 'relation' ? (
          <div className="relative">
            <span className="text-xs font-black tracking-tighter text-foreground">Select {displayLabel}</span>
            <SelectPropertyEditor value={String(value || '')} source={schema?.source}
              label={displayLabel} onSave={handleSave} onCancel={() => setEditing(false)} />
          </div>
        ) : type === 'date' ? (
          <input autoFocus type="date" value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={() => handleSave()}
            className="bg-transparent text-foreground px-1.5 py-0.5 text-[10px] font-black outline-none border border-border rounded-[4px] focus:border-muted-foreground w-full" />
        ) : (
          <input autoFocus value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="bg-transparent text-foreground px-1.5 py-0.5 text-[10px] font-black uppercase outline-none border border-border rounded-[4px] focus:border-muted-foreground w-full" />
        )
      ) : (
        <span className={cn('text-xs font-black tracking-tight truncate leading-none',
          isEmpty ? 'text-muted-foreground/30 italic text-[10px]' : 'text-foreground')}>
          {isEmpty ? 'None' : displayVal}
        </span>
      )}
    </div>
  )
}

import { sidecarApi } from '@/lib/sidecarApi'

// ─── Select Property Editor ────────────────────────────────────────────────────
export function SelectPropertyEditor({ value, source, onSave, onCancel, label }: {
  value: string; source?: string; onSave: (val: string) => void; onCancel: () => void; label?: string
}) {
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const rawValue = stripWL(value)

  useEffect(() => {
    let active = true
    const defaults: Record<string, string[]> = {
      status: ['Active', 'Completed', 'Planned', 'Upcoming', 'In Progress', 'On Hold'],
      priority: ['Low', 'Medium', 'High', 'Critical'],
      grade: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
      type: ['Quiz', 'Midterm', 'Final', 'Lab', 'Assignment', 'Project', 'Presentation'],
      difficulty: ['Easy', 'Medium', 'Hard', 'Very Hard'],
      confidence: ['Low', 'Medium', 'High', 'Expert'],
      'academic level': ['High School', 'Undergraduate', "Master's", 'PhD'],
      unit: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    }

    const loadOptions = async () => {
      if (source) {
        setLoading(true)
        try {
          const res = await sidecarApi.getVaultOptions(source)
          if (active && res && res.options && res.options.length > 0) {
            setOptions(res.options)
            setLoading(false)
            return
          }
        } catch (err) {
          console.error('[SelectPropertyEditor] Failed to load options:', err)
        } finally {
          if (active) setLoading(false)
        }
      }
      
      const key = (label || source || '').toLowerCase()
      for (const [k, v] of Object.entries(defaults)) {
        if (key.includes(k)) {
          if (active) setOptions(v)
          return
        }
      }
    }

    loadOptions()
    return () => {
      active = false
    }
  }, [source, label])

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = async (opt: string) => {
    onSave(wrapWL(opt))
  }

  const handleAddNew = async (newVal: string) => {
    if (source) {
      try {
        await sidecarApi.createVaultOption(source, newVal)
      } catch (err) {
        console.error('[SelectPropertyEditor] Failed to create option:', err)
      }
    }
    onSave(wrapWL(newVal))
  }

  return (
    <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-bento-panel border border-border rounded-[8px] shadow-2xl z-50 p-2"
      onClick={e => e.stopPropagation()}>
      <div className="relative">
        <input autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-bento-card text-[10px] font-black uppercase px-3 py-2 mb-2 border border-border rounded-[8px] focus:outline-none text-foreground" />
        {loading && <RefreshCw size={10} className="absolute right-3 top-2.5 animate-spin text-muted-foreground" />}
      </div>
      <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5">
        {filtered.map(opt => (
          <div key={opt} className={cn('flex items-center justify-between group hover:bg-muted/10', rawValue === opt ? 'bg-primary/5' : '')}>
            <button onClick={e => { e.stopPropagation(); handleSelect(opt) }}
              className={cn('flex-1 px-3 py-1.5 text-[10px] font-black uppercase text-left',
                rawValue === opt ? 'text-primary' : 'text-foreground')}>
              {opt}
            </button>
            {source && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await sidecarApi.deleteVaultOption(source, opt);
                    setOptions(prev => prev.filter(o => o !== opt));
                  } catch (err) {
                    console.error('[SelectPropertyEditor] Failed to delete option:', err);
                  }
                }}
                className="hidden group-hover:flex items-center justify-center px-2 py-1.5 hover:text-destructive text-muted-foreground transition-colors"
                title="Delete option"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && search && (
          <button onClick={e => { e.stopPropagation(); handleAddNew(search); }}
            className="px-3 py-1.5 text-[10px] font-black uppercase text-left text-primary hover:bg-primary/5">
            + Use "{search}"
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Academic Roadmap ──────────────────────────────────────────────────────────
export function AcademicRoadmap({ items, semesters = [], activeId, onSelect }: {
  items: any[]; semesters?: any[]; activeId: string | null; onSelect: (id: string) => void
}) {
  const sorted = [...items].sort((a, b) => getYearOrder(a.title) - getYearOrder(b.title))

  return (
    <div className="space-y-4">
      {sorted.map((item, idx) => {
        const status = String(stripWL(getVal(item, 'Status', 'status'))).toLowerCase()
        const isActive = getBoolVal(item, 'Current Year', 'current_year')
        const isSelected = activeId === item.id
        const yearSems = semesters.filter(s => {
          const semYear = String(stripWL(getVal(s, 'Year', 'year'))).toLowerCase().trim()
          return semYear === String(item.title || '').toLowerCase().trim() && semYear !== ''
        })

        return (
          <div key={idx} className="space-y-1.5">
            <div onClick={() => onSelect(item.id)} className={cn(
              'flex items-center justify-between p-3 border rounded-[8px] transition-colors',
              isSelected ? 'border-muted-foreground bg-bento-item' : 'border-border bg-bento-card hover:bg-bento-item/30'
            )}>
              <div className="flex flex-col">
                <span className={cn('text-[10px] font-black uppercase tracking-widest', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                  {cleanTitle(item.title)}
                </span>
                <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/50">{stripWL(getVal(item, 'Status', 'status'))}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 bg-foreground" />}
            </div>
            {yearSems.length > 0 && (
              <div className="pl-4 flex flex-col gap-1 border-l border-border/20 ml-2">
                {yearSems.map(s => {
                  const sActive = String(stripWL(getVal(s, 'Status', 'status'))).toLowerCase().includes('active')
                  return (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className={cn('text-[8px] font-black uppercase tracking-widest',
                        sActive ? 'text-foreground' : 'text-muted-foreground/50')}>
                        {cleanTitle(s.title)}
                      </span>
                      {sActive && <div className="w-1 h-1 bg-foreground/70" />}
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

// ─── Program Setup Form ────────────────────────────────────────────────────────
export function ProgramSetupForm({ onScaffold }: {
  onScaffold: (name: string, years: number, level: string, currentYearIdx: number) => void
}) {
  const [name, setName] = useState('')
  const [years, setYears] = useState(4)
  const [currentYear, setCurrentYear] = useState(1)
  const [level, setLevel] = useState('Undergraduate')

  return (
    <div className="p-10 border border-border bg-bento-card rounded-[8px] flex flex-col items-center justify-center text-center space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Initialize Program</h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Works for any academic level</p>
      </div>
      <div className="w-full max-w-sm space-y-4 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Program Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BSc Computer Science"
            className="w-full bg-bento-panel border border-border rounded-[8px] px-4 py-3 text-sm font-bold outline-none focus:border-muted-foreground text-foreground" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Level</label>
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="bg-bento-panel border border-border rounded-[8px] px-3 py-3 text-[10px] font-black uppercase outline-none text-foreground">
              <option>High School</option>
              <option>Undergraduate</option>
              <option>Master's</option>
              <option>PhD</option>
              <option>Diploma</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Duration (yrs)</label>
            <input type="number" min={1} max={10} value={years} onChange={e => setYears(parseInt(e.target.value) || 1)}
              className="bg-bento-panel border border-border rounded-[8px] px-3 py-3 text-sm font-bold outline-none text-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Current Yr</label>
            <input type="number" min={1} max={years} value={currentYear} onChange={e => setCurrentYear(parseInt(e.target.value) || 1)}
              className="bg-bento-panel border border-border rounded-[8px] px-3 py-3 text-sm font-bold outline-none text-foreground" />
          </div>
        </div>
        <button onClick={() => onScaffold(name, years, level, currentYear - 1)} disabled={!name.trim()}
          className="w-full h-11 text-background bg-foreground rounded-[8px] text-[10px] font-black uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-20 transition-all">
          Deploy Roadmap
        </button>
      </div>
    </div>
  )
}

// ─── Countdown Badge ──────────────────────────────────────────────────────────
export function CountdownBadge({ days }: { days: number | null }) {
  if (days === null) return null
  const urgent = days >= 0 && days <= 3
  const overdue = days < 0
  return (
    <span className={cn('text-[9px] font-black uppercase tracking-widest tabular-nums',
      overdue ? 'text-foreground font-black' :
      urgent ? 'text-foreground' : 'text-muted-foreground/60')}>
      {overdue ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
    </span>
  )
}
