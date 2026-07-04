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
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null)
  const [groupMode,  setGroupMode]  = useState<GroupMode>('course')
  const [filter,     setFilter]     = useState<'Active' | 'All' | 'Completed'>('Active')
  const [search,     setSearch]     = useState('')
  const [adding,     setAdding]     = useState(false)
  const [prevInitId,    setPrevInitId]    = useState<string | null>(initialSelectedId || null)
  const [vaultFiles, setVaultFiles] = useState<any[]>([])

  useEffect(() => {
    sidecarApi.listObsidianFiles()
      .then(res => setVaultFiles(res?.files || []))
      .catch(err => console.error("Error loading obsidian files in StudyPlannerTab:", err))
  }, [])

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

    // ─── Filter Yaml Properties (Hiding internal fields & duplicate keys) ───
    const seenLower = new Set<string>()
    const extraKeys = Object.keys({ ...schema, ...hub }).filter(k => {
      const lower = k.toLowerCase()
      if (INTERNAL.includes(lower)) return false
      if (['status', 'course', 'exam', 'total_time', 'study_time', 'practice_score', 'practice_total', 'unit', 'linked_exam', 'created_time', 'last_edited_time'].includes(lower)) return false
      if (seenLower.has(lower)) return false
      seenLower.add(lower)
      return true
    })

    // ─── Atomic Notes & PDF Search ───
    const courseVal = String(getVal(hub, 'Course', 'course') || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
    const unitVal   = String(getVal(hub, 'Unit', 'unit') || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim()

    const hubNotes = (courseVal && unitVal) ? vaultFiles.filter(f => {
      if (f.is_dir) return false
      if (!f.path.toLowerCase().endsWith('.md')) return false
      const pathLower = f.path.toLowerCase()
      return pathLower.includes(courseVal) && pathLower.includes(unitVal)
    }) : []

    const hubPdfs = (courseVal && unitVal) ? vaultFiles.filter(f => {
      if (f.is_dir) return false
      if (!f.path.toLowerCase().endsWith('.pdf')) return false
      const pathLower = f.path.toLowerCase()
      return pathLower.includes(courseVal) && pathLower.includes(unitVal)
    }) : []

    const currentLessonPath = getVal(hub, 'Current Lesson Path', 'current_lesson_path')

    return (
      <div data-tour="planner-detail-view" className="h-full overflow-y-auto custom-scrollbar p-8 space-y-6 pb-20">
        
        {/* Header Block */}
        <div className="flex items-start justify-between border-b border-border/40 pb-4">
          <div>
            <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1 font-sans">
              ← Study Planner
            </button>
            <EditableTitle value={cleanTitle(hub.title || hub.id)} className="text-xl font-black uppercase tracking-tight text-foreground"
              onSave={v => onUpdate(DB_ID, hub.id, { title: v })} />
            <div className="flex items-center gap-3 mt-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">
              {course && <span>{course}</span>}
              {linkedExam && <span>→ {linkedExam}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isDone ? (
              <button onClick={() => onUpdate(DB_ID, hub.id, { status: wrapWL('Completed') })}
                className="px-2.5 py-1 bg-muted/20 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] transition-all font-sans">
                Mark Complete
              </button>
            ) : (
              <button onClick={() => onUpdate(DB_ID, hub.id, { status: wrapWL('In Progress') })}
                className="px-2.5 py-1 bg-muted/20 text-[8px] font-black uppercase tracking-widest border border-border hover:bg-muted/40 hover:text-foreground rounded-[4px] transition-all font-sans">
                Reopen Hub
              </button>
            )}
            <button onClick={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)} className="p-1.5 border border-border bg-bento-card hover:bg-bento-item/20 text-muted-foreground hover:text-foreground rounded-[4px] transition-colors"><BookOpen size={12} /></button>
            <button onClick={() => { onDelete(DB_ID, selectedId); setSelectedId(null) }} className="p-1.5 border border-border bg-bento-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-[4px] transition-colors"><Trash2 size={12} /></button>
          </div>
        </div>

        {/* 2-Column Grid Redesign */}
        <div className="grid grid-cols-3 gap-6 items-start">
          
          {/* Left Column (Details, Properties & Practice Actions) */}
          <div className="col-span-2 space-y-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-4 gap-3">
              <BigPropertyCard label="Status" value={getVal(hub, 'status', 'Status') || 'Active'}
                schema={{ type: 'select' }} onUpdate={v => onUpdate(DB_ID, hub.id, { status: v })} />
              <BigPropertyCard label="Course" value={getVal(hub, 'course', 'Course')}
                schema={{ type: 'relation', source: 'database/courses' }} onUpdate={v => onUpdate(DB_ID, hub.id, { course: v })} />
              <BigPropertyCard label="Unit" value={getVal(hub, 'unit', 'Unit') || ''}
                schema={{ type: 'select' }} onUpdate={v => onUpdate(DB_ID, hub.id, { unit: v })} />
              <StatCard label="Study Time" value={studyTime > 0 ? `${Math.round(studyTime / 60)}m` : '--'} />
            </div>

            {/* Linked Exam Card */}
            {linkedExam && examItem && (
              <div className="p-3 border border-border bg-bento-card rounded-[6px] flex items-center justify-between">
                <div>
                  <span className="text-[7.5px] font-black uppercase tracking-widest text-muted-foreground/60 font-sans">Linked Exam</span>
                  <p className="text-[11px] font-black uppercase mt-0.5 text-foreground">{cleanTitle(examItem.title)}</p>
                </div>
                <button onClick={() => navigateTo('EXAMS', examItem.id)}
                  className="text-[8px] font-black uppercase text-muted-foreground hover:text-foreground border border-border/40 hover:border-foreground/30 px-2 py-0.5 rounded-[4px] transition-colors font-sans">
                  View →
                </button>
              </div>
            )}

            {/* Yaml Properties Grid (Fixed duplicates & Internal metadata) */}
            {extraKeys.length > 0 && (
              <div className="space-y-2">
                <SectionHeader title="Yaml Properties" />
                <div className="grid grid-cols-2 gap-3">
                  {extraKeys.map(key => (
                    <BigPropertyCard key={key} label={key} value={hub[key]} schema={schema[key]}
                      onUpdate={v => onUpdate(DB_ID, hub.id, { [key]: v })} />
                  ))}
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="flex gap-3">
              {currentLessonPath ? (
                <button 
                  onClick={() => onOpenNote(currentLessonPath)}
                  className="flex-1 px-4 py-2.5 bg-foreground text-background border border-foreground rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center justify-center gap-1.5 font-sans"
                >
                  <Clock size={11} />
                  Continue Study
                </button>
              ) : (
                <button 
                  onClick={() => {
                    const firstNote = hubNotes[0]?.path || hub.path || `database/study planner/${hub.id}.md`
                    onOpenNote(firstNote)
                  }}
                  className="flex-1 px-4 py-2.5 bg-foreground text-background border border-foreground rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center justify-center gap-1.5 font-sans"
                >
                  <Clock size={11} />
                  Start Study
                </button>
              )}

              <button onClick={() => navigateTo('PRACTICE', hub.id)}
                className="flex-1 px-4 py-2.5 border border-border bg-bento-item/50 rounded-[6px] text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-bento-item transition-all flex items-center justify-center gap-1.5 font-sans">
                Practice This Hub →
              </button>
            </div>

          </div>

          {/* Right Column (Atomic Notes & PDF Resources) */}
          <div className="col-span-1 border-l border-border/30 pl-6 space-y-6">
            
            {/* Atomic Notes Section */}
            <div className="space-y-3">
              <SectionHeader title="Atomic Notes" count={hubNotes.length} />
              
              <div className="max-h-[220px] overflow-y-auto custom-scrollbar-mini pr-1 space-y-2">
                {hubNotes.length === 0 ? (
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No notes found for this unit</p>
                ) : (
                  hubNotes.map((note, idx) => {
                    const noteName = note.path.split('/').pop()?.replace('.md', '') || 'Untitled Note'
                    const pathFolder = note.path.split('/').slice(0, -1).join('/')
                    return (
                      <div 
                        key={idx}
                        onClick={() => onOpenNote(note.path)}
                        className="p-2.5 border border-border/80 bg-bento-card hover:bg-bento-item/20 rounded-[6px] transition-colors flex flex-col gap-1 cursor-pointer font-sans"
                      >
                        <span className="text-[10px] font-black uppercase truncate text-foreground leading-tight">{cleanTitle(noteName)}</span>
                        <span className="text-[7.5px] font-black uppercase text-muted-foreground/45 truncate leading-none">{pathFolder}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Reference PDFs Section */}
            <div className="space-y-3">
              <SectionHeader title="Reference PDFs" count={hubPdfs.length} />
              
              <div className="max-h-[150px] overflow-y-auto custom-scrollbar-mini pr-1 space-y-2">
                {hubPdfs.length === 0 ? (
                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 py-2 font-sans font-medium">No PDFs found for this unit</p>
                ) : (
                  hubPdfs.map((pdf, idx) => {
                    const pdfName = pdf.path.split('/').pop() || 'document.pdf'
                    return (
                      <div 
                        key={idx}
                        onClick={() => onOpenNote(pdf.path)}
                        className="p-2.5 border border-border/80 bg-bento-card hover:bg-bento-item/20 rounded-[6px] transition-colors flex items-center justify-between cursor-pointer font-sans"
                      >
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                          <span className="text-[10px] font-black uppercase truncate text-foreground leading-tight">{cleanTitle(pdfName)}</span>
                          <span className="text-[7px] font-black uppercase text-muted-foreground/45 leading-none">Document PDF</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onOpenNote(pdf.path) }}
                          className="px-2 py-1 text-[7px] font-black uppercase border border-border bg-bento-item text-foreground hover:bg-foreground hover:text-background rounded-[4px] transition-colors font-sans"
                        >
                          Open PDF
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>

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
