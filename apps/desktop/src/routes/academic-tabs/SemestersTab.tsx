import React, { useState, useMemo } from 'react'
import { Trash2, Plus, Search, Layers, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stripWL, getVal, wrapWL, cleanTitle } from './utils'
import { EmptyState, BigPropertyCard, EditableTitle, CreateBanner, SectionHeader } from './SharedComponents'
import type { TabProps } from './types'

export default function SemestersTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo }: TabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)

  const allSemesters = data.semesters || []
  const years = data.years || []

  const filtered = useMemo(() => {
    let items = allSemesters
    if (search.trim()) {
      items = items.filter(s => String(s.title || s.id || '').toLowerCase().includes(search.toLowerCase()))
    }
    return [...items].sort((a, b) => {
      return String(a.title || a.id).localeCompare(String(b.title || b.id))
    })
  }, [allSemesters, search])

  const semester = useMemo(() => allSemesters.find(s => s.id === selectedId), [allSemesters, selectedId])

  React.useEffect(() => {
    if (selectedId && !semester && allSemesters.length > 0) {
      setSelectedId(null)
    }
  }, [selectedId, semester, allSemesters, setSelectedId])

  // DETAIL VIEW
  if (selectedId && semester) {
    const status = stripWL(getVal(semester, 'Status', 'status'))
    const parentYear = stripWL(getVal(semester, 'Year', 'year'))

    const semesterCourses = (data.courses || []).filter(c => {
      const cSem = stripWL(getVal(c, 'Semester', 'semester')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      const sName = String(semester.title || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      return cSem && (cSem.includes(sName) || sName.includes(cSem));
    });

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">← Semesters</button>
            <EditableTitle value={cleanTitle(semester.title)} className="text-2xl font-black uppercase tracking-tight"
              onSave={v => onUpdate('semesters', semester.id, { title: v })} />
            <div className="flex items-center gap-3 mt-1">
              {parentYear && <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Year: {parentYear}</span>}
            </div>
          </div>
          <button onClick={() => { onDelete('semesters', selectedId); setSelectedId(null) }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[4px] transition-colors cursor-pointer border-none bg-transparent"><Trash2 size={14} /></button>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-4 gap-4">
          <BigPropertyCard 
            label="Status" 
            value={status} 
            schema={{ type: 'select', source: 'database/semesters/status' }} 
            onUpdate={v => onUpdate('semesters', semester.id, { Status: v })} 
          />

          <BigPropertyCard 
            label="Academic Year" 
            value={parentYear} 
            schema={{ type: 'relation', source: 'database/years' }} 
            onUpdate={v => onUpdate('semesters', semester.id, { Year: v })} 
          />

          <BigPropertyCard 
            label="Total Courses" 
            value={semesterCourses.length} 
            onUpdate={() => {}}
          />

          <BigPropertyCard 
            label="Year GPA" 
            value={stripWL(getVal((data.years || []).find(y => {
              const yTitle = String(y.title || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
              const pYear = String(parentYear || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
              return yTitle && (yTitle.includes(pYear) || pYear.includes(yTitle));
            }) || {}, 'Cumulative GPA', 'cumulative_gpa')) || '0.00'} 
            onUpdate={() => {}}
          />
        </div>

        {/* Courses list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SectionHeader title="Courses" count={semesterCourses.length} />
              <button
                onClick={() => onCreate('courses', 'New Course', { Semester: wrapWL(semester.title) })}
                className="px-3 py-1.5 border border-border bg-bento-card hover:bg-bento-item text-[9px] font-black uppercase tracking-wider rounded-[6px] text-foreground transition-all flex items-center justify-center h-7 font-sans shrink-0 cursor-pointer"
              >
                Create Course
              </button>
            </div>
          </div>
          {semesterCourses.length === 0 ? (
          <EmptyState
            message="No courses yet."
            icon={<BookOpen size={24} className="text-muted-foreground/30" />}
          />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {semesterCourses.map((c, idx) => {
                const credits = stripWL(getVal(c, 'Credits', 'credits'));
                return (
                  <div key={idx} onClick={() => navigateTo('COURSES', c.id)}
                    className="p-4 border border-border bg-bento-card hover:bg-bento-item/30 rounded-[8px] cursor-pointer flex flex-col gap-2 transition-colors">
                    <h4 className="text-[11px] font-black uppercase text-foreground">{cleanTitle(c.title)}</h4>
                    <div className="flex items-center gap-3 text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                      <span>Credits: {credits || '--'}</span>
                    </div>
                  </div>
                )
              })}
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
            placeholder="Search Semesters..."
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
            label="Semester" 
            placeholder="e.g. Winter 2026"
            onConfirm={async (name) => {
              if (!name.trim()) return
              const defaultYear = years[0]?.title || 'Year I'
              const newId = await onCreate('semesters', name.trim(), {
                Status: wrapWL('Planned'),
                Year: wrapWL(defaultYear)
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
            message="No academic semesters found." 
            icon={<Layers size={24} className="text-muted-foreground/30" />}
          />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((s) => {
              const status = stripWL(getVal(s, 'Status', 'status')) || 'Planned'
              const parentYear = stripWL(getVal(s, 'Year', 'year')) || '--'
              return (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedId(s.id)}
                  className="p-5 border border-border bg-bento-card hover:bg-bento-item/30 rounded-[8px] cursor-pointer flex flex-col gap-3 hover:border-foreground/40 transition-all select-none"
                >
                  <div>
                    <h3 className="text-[13px] font-black uppercase leading-tight text-foreground">{cleanTitle(s.title)}</h3>
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/65 mt-1">Status: {status}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-[9px] font-black uppercase text-muted-foreground">
                    <span>Year: {parentYear}</span>
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
