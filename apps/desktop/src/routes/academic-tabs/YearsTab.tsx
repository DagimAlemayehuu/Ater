import React, { useState, useMemo } from 'react'
import { Trash2, Plus, Search, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stripWL, getVal, getBoolVal, wrapWL, cleanTitle } from './utils'
import { EmptyState, BigPropertyCard, EditableTitle, CreateBanner, SectionHeader } from './SharedComponents'
import type { TabProps } from './types'

export default function YearsTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo }: TabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)

  const allYears = data.years || []

  const filtered = useMemo(() => {
    let items = allYears
    if (search.trim()) {
      items = items.filter(y => String(y.title || y.id || '').toLowerCase().includes(search.toLowerCase()))
    }
    return [...items].sort((a, b) => {
      return String(a.title || a.id).localeCompare(String(b.title || b.id))
    })
  }, [allYears, search])

  const year = useMemo(() => allYears.find(y => y.id === selectedId), [allYears, selectedId])

  React.useEffect(() => {
    if (selectedId && !year && allYears.length > 0) {
      setSelectedId(null)
    }
  }, [selectedId, year, allYears, setSelectedId])

  // DETAIL VIEW
  if (selectedId && year) {
    const status = stripWL(getVal(year, 'Status', 'status'))
    const isCurrent = getBoolVal(year, 'Current Year', 'current_year')
    const targetCredits = getVal(year, 'Target Credits', 'target_credits')
    const earnedCredits = getVal(year, 'Earned Credits', 'earned_credits')
    const gpa = getVal(year, 'Cumulative GPA', 'cumulative_gpa')
    const program = stripWL(getVal(year, 'Program', 'program'))

    const yearSemesters = (data.semesters || []).filter(s => {
      const sYear = stripWL(getVal(s, 'Year', 'year')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      const yName = String(year.title || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      return sYear && (sYear.includes(yName) || yName.includes(sYear));
    });

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">← Years</button>
            <EditableTitle value={cleanTitle(year.title)} className="text-2xl font-black uppercase tracking-tight"
              onSave={v => onUpdate('years', year.id, { title: v })} />
            <div className="flex items-center gap-3 mt-1">
              {program && <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{program}</span>}
              {isCurrent && <span className="px-2 py-0.5 text-[8px] font-black uppercase border border-foreground bg-bento-item">Current Year</span>}
            </div>
          </div>
          <button onClick={() => { onDelete('years', selectedId); setSelectedId(null) }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[4px] transition-colors cursor-pointer border-none bg-transparent"><Trash2 size={14} /></button>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-5 gap-4">
          <BigPropertyCard 
            label="Status" 
            value={status} 
            schema={{ type: 'select', source: 'database/years/status' }} 
            onUpdate={v => onUpdate('years', year.id, { Status: v })} 
          />

          <BigPropertyCard 
            label="Current Year" 
            value={isCurrent} 
            schema={{ type: 'bool' }} 
            onUpdate={v => onUpdate('years', year.id, { 'Current Year': v })} 
          />

          <BigPropertyCard 
            label="GPA" 
            value={gpa} 
            onUpdate={v => onUpdate('years', year.id, { 'Cumulative GPA': parseFloat(v) || 0.0 })} 
          />

          <BigPropertyCard 
            label="Target Credits" 
            value={targetCredits} 
            onUpdate={v => onUpdate('years', year.id, { 'Target Credits': parseInt(v) || 0 })} 
          />

          <BigPropertyCard 
            label="Earned Credits" 
            value={earnedCredits} 
            onUpdate={v => onUpdate('years', year.id, { 'Earned Credits': parseInt(v) || 0 })} 
          />
        </div>

        {/* Semesters list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SectionHeader title="Semesters" count={yearSemesters.length} />
              <button
                onClick={() => onCreate('semesters', 'New Semester', { Year: wrapWL(year.title) })}
                className="px-3 py-1.5 border border-border bg-bento-card hover:bg-bento-item text-[9px] font-black uppercase tracking-wider rounded-[6px] text-foreground transition-all flex items-center justify-center h-7 font-sans shrink-0 cursor-pointer"
              >
                Create Semester
              </button>
            </div>
          </div>
          {yearSemesters.length === 0 ? (
            <EmptyState message="No semesters yet." />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {yearSemesters.map((s, idx) => (
                <div key={idx} onClick={() => navigateTo('SEMESTERS', s.id)}
                  className="p-4 border border-border bg-bento-card hover:bg-bento-item/30 rounded-[8px] cursor-pointer flex flex-col gap-2 transition-colors">
                  <h4 className="text-[11px] font-black uppercase text-foreground">{cleanTitle(s.title)}</h4>
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    Status: {stripWL(getVal(s, 'Status', 'status')) || 'Planned'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>


      </div>
    )
  }

  // LIST GRID VIEW
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Control / Filter Bar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0 flex-wrap bg-transparent">
        <div className="flex items-center gap-2 flex-1 bg-bento-card border border-border rounded-[6px] px-3 py-2">
          <Search size={11} className="text-muted-foreground" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search Years..."
            className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none text-foreground placeholder:text-muted-foreground/30 font-sans" 
          />
        </div>
        <button 
          onClick={() => setAdding(true)}
          className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans"
        >
          + ADD
        </button>
      </div>

      {adding && (
        <div className="px-6 pt-3 shrink-0">
          <CreateBanner 
            label="Year" 
            placeholder="e.g. Year V"
            onConfirm={async (name) => {
              if (!name.trim()) return
              const newId = await onCreate('years', name.trim(), {
                Status: wrapWL('Planned'),
                Program: wrapWL('Computer Science'),
                'Current Year': false,
                'Target Credits': 0,
                'Earned Credits': 0,
                'Cumulative GPA': 0
              })
              setAdding(false)
              if (newId) setSelectedId(newId)
            }}
            onCancel={() => setAdding(false)} 
          />
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
        {filtered.length === 0 && !adding ? (
          <EmptyState 
            message="No academic years found." 
            icon={<Award size={24} className="text-muted-foreground/30" />}
          />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((y) => {
              const isCurrent = getBoolVal(y, 'Current Year', 'current_year')
              const status = stripWL(getVal(y, 'Status', 'status')) || 'Planned'
              const gpa = getVal(y, 'Cumulative GPA', 'cumulative_gpa')
              const earned = getVal(y, 'Earned Credits', 'earned_credits') || 0
              const target = getVal(y, 'Target Credits', 'target_credits') || 0
              return (
                <div 
                  key={y.id} 
                  onClick={() => setSelectedId(y.id)}
                  className="p-5 border border-border bg-bento-card hover:bg-bento-item/30 rounded-[8px] cursor-pointer flex flex-col gap-3 hover:border-foreground/40 transition-all select-none"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-[13px] font-black uppercase leading-tight text-foreground">{cleanTitle(y.title)}</h3>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/65 mt-1">Status: {status}</p>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-[7px] font-black uppercase border border-foreground bg-bento-item rounded-[3px] shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-[9px] font-black uppercase text-muted-foreground">
                    <span>GPA: {gpa || '--'}</span>
                    <span>Credits: {earned} / {target} CR</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
