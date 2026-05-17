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

export default function StudyPlannerTab({ data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo }: TabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [groupMode,  setGroupMode]  = useState<GroupMode>('course')
  const [filter,     setFilter]     = useState<'Active' | 'All' | 'Completed'>('Active')
  const [search,     setSearch]     = useState('')
  const [adding,     setAdding]     = useState(false)

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

  const groups = useMemo(() => {
    if (groupMode === 'none') return { All: filtered }
    if (groupMode === 'course') return groupBy(filtered, h => cleanTitle(stripWL(getVal(h, 'course', 'Course'))) || 'Uncategorized')
    if (groupMode === 'status') return groupBy(filtered, h => cleanTitle(stripWL(getVal(h, 'status', 'Status'))) || 'No Status')
    return { All: filtered }
  }, [filtered, groupMode])

  const totalDone    = allHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length
  const totalStudyMs = allHubs.reduce((acc, h) => acc + (getNumVal(h, 'total_time', 'study_time') || 0), 0)

  // ─────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedId) {
    const hub = allHubs.find(h => h.id === selectedId)
    if (!hub) { setSelectedId(null); return null }

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
      <div className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24">
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

        <div className="grid grid-cols-4 gap-4">
          <BigPropertyCard label="Status" value={getVal(hub, 'status', 'Status') || 'Active'}
            schema={{ type: 'select' }} onUpdate={v => onUpdate(DB_ID, hub.id, { status: v })} />
          <BigPropertyCard label="Course" value={getVal(hub, 'course', 'Course')}
            schema={{ type: 'select', source: 'courses' }} onUpdate={v => onUpdate(DB_ID, hub.id, { course: v })} />
          <StatCard label="Study Time" value={studyTime > 0 ? `${Math.round(studyTime / 60)}m` : '--'} />
          <StatCard label="Practice Accuracy" value={accuracy !== null ? `${accuracy}%` : '--'} />
        </div>

        {linkedExam && examItem && (
          <div className="p-4 border border-border bg-muted/5 flex items-center justify-between">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Linked Exam</span>
              <p className="text-[13px] font-black uppercase mt-0.5">{cleanTitle(examItem.title)}</p>
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
            className="flex-1 px-4 py-3 border border-border text-[10px] font-black uppercase tracking-widest text-foreground hover:border-foreground/50 hover:bg-muted/5">
            Practice This Hub →
          </button>
          <button onClick={() => navigateTo('CALENDAR')}
            className="flex-1 px-4 py-3 border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/30">
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
        <div className="flex items-center gap-1 bg-muted/5 border border-border p-1">
          {(['Active', 'All', 'Completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 text-[8px] font-black uppercase tracking-widest',
                filter === f ? 'bg-muted/20 text-foreground border border-border' : 'text-muted-foreground hover:bg-muted/5')}>
              {f}
            </button>
          ))}
        </div>

        {/* Group mode */}
        <div className="flex items-center gap-1 bg-muted/5 border border-border p-1">
          {(['course', 'status', 'none'] as GroupMode[]).map(g => (
            <button key={g} onClick={() => setGroupMode(g)}
              className={cn('px-3 py-1.5 text-[8px] font-black uppercase tracking-widest',
                groupMode === g ? 'bg-muted/20 text-foreground border border-border' : 'text-muted-foreground hover:bg-muted/5')}>
              {g === 'none' ? 'Flat' : `By ${g}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 bg-muted/5 border border-border px-3 py-2">
          <Search size={11} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hubs..."
            className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none" />
        </div>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-foreground border border-border bg-background text-[8px] font-black uppercase hover:border-foreground/50">
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
                    className={cn('p-5 border cursor-pointer flex flex-col gap-3 hover:border-foreground/40',
                      isDone ? 'border-border/20 bg-muted/3 opacity-60' : 'border-border bg-background hover:bg-muted/5')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn('w-3 h-3 border shrink-0 mt-0.5 flex items-center justify-center',
                        isDone ? 'bg-foreground border-foreground' : 'border-border')}>
                        {isDone && <Check size={8} strokeWidth={4} className="text-background" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn('text-[12px] font-black uppercase truncate leading-tight',
                          isDone ? 'line-through text-muted-foreground' : 'text-foreground')}>
                          {cleanTitle(hub.title || hub.id)}
                        </h3>
                        {course && <p className="text-[8px] font-black uppercase tracking-widest text-foreground/40 mt-0.5">{course}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest border-t border-border/40 pt-2">
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
