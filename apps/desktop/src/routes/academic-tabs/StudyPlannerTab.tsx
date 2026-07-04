import React, { useState, useMemo } from 'react'
import { Check, BookOpen, Plus, Search, Clock, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { stripWL, getVal, getNumVal, wrapWL, cleanTitle, groupBy, statusColorClass } from './utils'
import { SectionHeader, EmptyState, BigPropertyCard, EditableTitle, StatCard, CreateBanner } from './SharedComponents'
import type { TabProps } from './types'

const INTERNAL = ['id', 'title', 'path', 'last_synced', 'links']

// NOTE: folder = "study planner" (2 n's) — matches Rust backend "study planner"
const DB_ID = 'study planner'

type GroupMode = 'course' | 'status' | 'none'

export default function StudyPlannerTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, initialSelectedId, onClearSelection }: TabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null)
  const [groupMode,  setGroupMode]  = useState<GroupMode>('course')
  const [filter,     setFilter]     = useState<'Active' | 'All' | 'Completed'>('Active')
  const [search,     setSearch]     = useState('')
  const [adding,     setAdding]     = useState(false)
  const [prevInitId,    setPrevInitId]    = useState<string | null>(initialSelectedId || null)

  // Sync external navigation
  if (initialSelectedId && initialSelectedId !== prevInitId) {
    setSelectedId(initialSelectedId); setPrevInitId(initialSelectedId)
  }
  React.useEffect(() => { if (initialSelectedId && onClearSelection) onClearSelection() }, [initialSelectedId, onClearSelection])

  // study_sessions maps to "study planner" folder
  const allHubs    = data.study_sessions || []
  const courses    = data.courses        || []
  const exams      = data.exams          || []
  const schema     = databases.find(d => d.id === DB_ID)?.schema || {}

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
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const hub = useMemo(() => allHubs.find(h => h.id === selectedId), [allHubs, selectedId])

  React.useEffect(() => {
    if (selectedId && !hub && allHubs.length > 0) {
      setSelectedId(null)
    }
  }, [selectedId, hub, allHubs, setSelectedId])

  if (selectedId && hub) {

    const isDone     = stripWL(getVal(hub, 'status', 'Status')).toLowerCase().includes('complet')
    const course     = stripWL(getVal(hub, 'course', 'Course'))
    const studyTime  = getNumVal(hub, 'total_time', 'study_time')
    const practiceScore = getNumVal(hub, 'practice_score', 'score')
    const practiceTotal = getNumVal(hub, 'practice_total', 'total_questions')
    const accuracy   = practiceTotal > 0 ? Math.round((practiceScore / practiceTotal) * 100) : null

    const linkedExam = stripWL(getVal(hub, 'exam', 'Exam', 'linked_exam'))
    const examItem   = exams.find(e => cleanTitle(e.title).toLowerCase() === linkedExam.toLowerCase())

    const extraKeys = Object.keys({ ...schema, ...hub }).filter(k =>
      !INTERNAL.includes(k) && !['status', 'Status', 'course', 'Course', 'exam', 'Exam', 'total_time', 'study_time', 'practice_score', 'practice_total'].includes(k))

    return (
      <div data-tour="planner-detail-view" className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">← Study Planner</button>
            <EditableTitle value={cleanTitle(hub.title || hub.id)} className="text-2xl font-black uppercase tracking-tight"
              onSave={v => onUpdate(DB_ID, hub.id, { title: v })} />
            <div className="flex items-center gap-3 mt-1">
              {course && <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{course}</span>}
              {linkedExam && <span className="text-[9px] font-black uppercase text-foreground/40">→ {linkedExam}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isDone && (
              <button onClick={() => onUpdate(DB_ID, hub.id, { status: wrapWL('Completed') })}
                className="px-3 py-2 border border-foreground text-foreground bg-background text-[8px] font-black uppercase hover:bg-muted/5">
                Mark Complete
              </button>
            )}
            <button onClick={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10"><BookOpen size={14} /></button>
            <button onClick={() => { onDelete(DB_ID, selectedId); setSelectedId(null) }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <BigPropertyCard label="Status" value={getVal(hub, 'status', 'Status') || 'Active'}
            schema={{ type: 'select' }} onUpdate={v => onUpdate(DB_ID, hub.id, { status: v })} />
          <BigPropertyCard label="Course" value={getVal(hub, 'course', 'Course')}
            schema={{ type: 'relation', source: 'database/courses' }} onUpdate={v => onUpdate(DB_ID, hub.id, { course: v })} />
          <BigPropertyCard label="Unit" value={getVal(hub, 'unit', 'Unit') || ''}
            schema={{ type: 'select' }} onUpdate={v => onUpdate(DB_ID, hub.id, { unit: v })} />
          <StatCard label="Study Time" value={studyTime > 0 ? `${Math.round(studyTime / 60)}m` : '--'} />
          <StatCard label="Practice Accuracy" value={accuracy !== null ? `${accuracy}%` : '--'} />
        </div>

        {linkedExam && examItem && (
          <div className="p-4 border border-border bg-bento-card rounded-[8px] flex items-center justify-between">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Linked Exam</span>
              <p className="text-[13px] font-black uppercase mt-0.5 text-foreground">{cleanTitle(examItem.title)}</p>
            </div>
            <button onClick={() => navigateTo('EXAMS', examItem.id)}
              className="text-[8px] font-black uppercase text-muted-foreground hover:text-foreground">View →</button>
          </div>
        )}

        {extraKeys.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {extraKeys.map(key => (
              <BigPropertyCard key={key} label={key} value={hub[key]} schema={schema[key]}
                onUpdate={v => onUpdate(DB_ID, hub.id, { [key]: v })} />
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigateTo('PRACTICE', hub.id)}
            className="flex-1 px-4 py-3 border border-border bg-bento-item/50 rounded-[6px] text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-bento-item transition-colors">
            Practice This Hub →
          </button>
          <button onClick={() => navigateTo('CALENDAR')}
            className="flex-1 px-4 py-3 border border-border bg-bento-item/30 rounded-[6px] text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            View in Calendar
          </button>
        </div>
      </div>
    )
  }

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
                  <div key={idx} onClick={() => setSelectedId(hub.id)}
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
