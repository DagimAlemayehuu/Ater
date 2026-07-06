import React, { useState, useEffect, useMemo } from 'react'
import { Check, BookOpen, Plus, Search, Clock, Trash2, ChevronRight, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal, getNumVal, wrapWL, cleanTitle, groupBy, statusColorClass } from './utils'
import { SectionHeader, EmptyState, BigPropertyCard, EditableTitle, StatCard, CreateBanner } from './SharedComponents'
import type { TabProps } from './types'
import { sidecarApi } from '@/lib/sidecarApi'

const INTERNAL = ['id', 'title', 'path', 'last_synced', 'links']

// NOTE: folder = "study planner" (2 n's) — matches Rust backend "study planner"
const DB_ID = 'study planner'

type GroupMode = 'course' | 'status' | 'none'

export default function StudyPlannerTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, initialSelectedId, onClearSelection }: TabProps) {
  const [groupMode,  setGroupMode]  = useState<GroupMode>('course')
  const [filter,     setFilter]     = useState<'Active' | 'All' | 'Completed'>('Active')
  const [search,     setSearch]     = useState('')
  const [adding,     setAdding]     = useState(false)
  const [vaultFiles, setVaultFiles] = useState<any[]>([])

  useEffect(() => {
    sidecarApi.listObsidianFiles()
      .then(res => setVaultFiles(res?.files || []))
      .catch(err => console.error("Error loading obsidian files in StudyPlannerTab:", err))
  }, [])

  // study_sessions maps to "study planner" folder
  const allHubs    = data.study_sessions || []
  const courses    = data.courses        || []
  const exams      = data.exams          || []
  const schema     = databases.find(d => d.id === DB_ID)?.schema || {}

  // Sync external navigation - directly open the hub page in Obsidian
  useEffect(() => {
    if (initialSelectedId) {
      const targetHub = allHubs.find(h => h.id === initialSelectedId)
      if (targetHub) {
        onOpenNote(targetHub.path || `database/study planner/${targetHub.id}.md`)
      }
      if (onClearSelection) onClearSelection()
    }
  }, [initialSelectedId, allHubs, onOpenNote, onClearSelection])

  const filtered = useMemo(() => {
    let items = allHubs
    if (filter === 'Active')    items = items.filter(h => !stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet'))
    if (filter === 'Completed') items = items.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet'))
    if (search.trim()) items = items.filter(h => String(h.title || h.id || '').toLowerCase().includes(search.toLowerCase()))
    return items
  }, [allHubs, filter, search])

  const getUnitNumber = (item: any): number => {
    const titleStr = String(item.unit || item.title || item.id || '');
    const match = titleStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 99999;
  };

  const sortHubsByUnit = (hubsList: any[]) => {
    return [...hubsList].sort((a, b) => {
      const numA = getUnitNumber(a);
      const numB = getUnitNumber(b);
      if (numA !== numB) return numA - numB;
      return String(a.title || a.id).localeCompare(String(b.title || b.id));
    });
  };

  const groups = useMemo(() => {
    let result: Record<string, any[]> = {}
    if (groupMode === 'none') {
      result = { All: filtered }
    } else if (groupMode === 'course') {
      result = groupBy(filtered, h => cleanTitle(stripWL(getVal(h, 'course', 'Course'))) || 'Uncategorized')
    } else if (groupMode === 'status') {
      result = groupBy(filtered, h => cleanTitle(stripWL(getVal(h, 'status', 'Status'))) || 'No Status')
    } else {
      result = { All: filtered }
    }

    const sortedResult: Record<string, any[]> = {}
    for (const [key, list] of Object.entries(result)) {
      sortedResult[key] = sortHubsByUnit(list)
    }
    return sortedResult
  }, [filtered, groupMode])

  const totalDone    = allHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length
  const totalStudyMs = allHubs.reduce((acc, h) => acc + (getNumVal(h, 'total_time', 'study_time') || 0), 0)

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter & controls */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-1 bg-bento-card border border-border p-1 rounded-[6px]">
          {(['Active', 'All', 'Completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-[4px] transition-colors',
                filter === f ? 'bg-bento-item text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {f}
            </button>
          ))}
        </div>

        {/* Group mode */}
        <div className="flex items-center gap-1 bg-bento-card border border-border p-1 rounded-[6px]">
          {(['course', 'status', 'none'] as GroupMode[]).map(g => (
            <button key={g} onClick={() => setGroupMode(g)}
              className={cn('px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-[4px] transition-colors',
                groupMode === g ? 'bg-bento-item text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {g === 'none' ? 'Flat' : `By ${g}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 bg-bento-card border border-border rounded-[6px] px-3 py-2">
          <Search size={11} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hubs..."
            className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none text-foreground placeholder:text-muted-foreground/30" />
        </div>
        <button onClick={() => setAdding(true)}
          data-tour="planner-add"
          className="flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-foreground border border-border bg-bento-item/50 rounded-[6px] text-[8px] font-black uppercase hover:bg-bento-item transition-colors">
          <Plus size={10} /> Add
        </button>
      </div>

      {adding && (
        <div className="px-6 pt-3 shrink-0">
          <CreateBanner label="Hub" placeholder="e.g. Chapter 3 - Derivatives"
            onConfirm={name => {
              onCreate(DB_ID, name, { status: wrapWL('Active') })
              setAdding(false)
            }}
            onCancel={() => setAdding(false)} />
        </div>
      )}

      {/* Stats */}
      <div className="px-6 py-2 border-b border-border flex items-center gap-5 text-[8px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
        <span>{allHubs.length} hubs</span>
        <span>{totalDone} done</span>
        <span className="flex items-center gap-1"><Clock size={9} />{totalStudyMs > 0 ? `${Math.round(totalStudyMs / 3600)}h total` : '--'}</span>
        <span className="ml-auto">{allHubs.length > 0 ? Math.round((totalDone / allHubs.length) * 100) : 0}% complete</span>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 space-y-8">
        {Object.entries(groups).map(([groupName, items]) => (
          <section key={groupName} className="space-y-3">
            {groupMode !== 'none' && <SectionHeader title={groupName} count={items.length} />}
            {items.length === 0 && <EmptyState message="No hubs." />}
            <div className="grid grid-cols-3 gap-4">
              {items.map((hub, idx) => {
                const isDone   = stripWL(getVal(hub, 'status', 'Status')).toLowerCase().includes('complet')
                const course   = stripWL(getVal(hub, 'course', 'Course'))
                const time     = getNumVal(hub, 'total_time', 'study_time')
                const score    = getNumVal(hub, 'practice_score', 'score')
                const total    = getNumVal(hub, 'practice_total', 'total_questions')
                const accuracy = total > 0 ? Math.round((score / total) * 100) : null

                return (
                  <div key={idx} onClick={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
                    data-tour={`planner-card-${hub.id}`}
                    className={cn('p-5 border cursor-pointer rounded-[8px] flex flex-col gap-3 hover:border-foreground/40 transition-colors',
                      isDone ? 'border-border bg-bento-card/50 opacity-60' : 'border-border bg-bento-card hover:bg-bento-item/30')}>
                    <div className="flex items-start gap-2">
                      <div className={cn('w-3.5 h-3.5 border rounded-[3px] shrink-0 mt-0.5 flex items-center justify-center',
                        isDone ? 'bg-foreground border-foreground' : 'border-border')}
                        onClick={e => { e.stopPropagation(); onUpdate(DB_ID, hub.id, { status: wrapWL(isDone ? 'Active' : 'Completed') }) }}>
                        {isDone && <Check size={8} strokeWidth={4} className="text-background" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn('text-[12px] font-black uppercase truncate leading-tight',
                          isDone ? 'line-through text-muted-foreground' : 'text-foreground')}>
                          {cleanTitle(hub.title || hub.id)}
                        </h3>
                        {course && <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/65 mt-0.5">{course}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest border-t border-border pt-2">
                      {time > 0 && <span className="text-muted-foreground flex items-center gap-1"><Clock size={8} />{Math.round(time / 60)}m</span>}
                      {accuracy !== null && <span className="text-muted-foreground">{accuracy}%</span>}
                      {!isDone && (
                        <button onClick={e => { e.stopPropagation(); onUpdate(DB_ID, hub.id, { status: wrapWL('Completed') }) }}
                          className="ml-auto text-muted-foreground/50 hover:text-foreground">
                          <Check size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
        {Object.values(groups).every(g => g.length === 0) && !adding && <EmptyState message="No hubs. Create one to start organizing your studies." />}
      </div>
    </div>
  )
}
