import React, {useState, useMemo, useEffect} from 'react'
import {Hash, ChevronRight, Plus, Check, BookOpen, Trash2} from 'lucide-react'
import {format, parseISO, differenceInDays, isBefore, startOfDay} from 'date-fns'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'
import {stripWL, getVal, cleanTitle, wrapWL} from './utils'
import {SectionHeader, EmptyState, StatCard, BigPropertyCard, EditableTitle} from './SharedComponents'
import type {TabProps} from './types'

export default function ExamsTab({data, databases, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, initialSelectedId, onClearSelection}: TabProps) {
 const [statusFilter, setStatusFilter] = useState<'Active' | 'All'>('Active')
 const [courseFilter, setCourseFilter] = useState<string>('All')
 const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null)
 const [editingScore, setEditingScore] = useState<string | null>(null)
 const [scoreInput, setScoreInput] = useState('')

 useEffect(() => {
 if (initialSelectedId) {
 setSelectedId(initialSelectedId)
 if (onClearSelection) onClearSelection()
}
}, [initialSelectedId, onClearSelection])

 const allCourses = data.courses || []
 const allExams = data.exams || []
 const hubs = data.study_sessions || []

 const activeSemesters = (data.semesters || []).filter(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase() === 'active').map(s => (s.title || '').toLowerCase())

 const courses = useMemo(() => {
  if (statusFilter === 'All') return allCourses
  return allCourses.filter(c => {
   const isCompleted = stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet')
   const courseSem = stripWL(getVal(c, 'Semester', 'semester')).toLowerCase()
   const inActiveSemester = activeSemesters.length === 0 || activeSemesters.some(s => courseSem.includes(s))
   return !isCompleted && inActiveSemester
  })
 }, [allCourses, statusFilter, activeSemesters])

 const now = startOfDay(new Date())

 const filtered = useMemo(() => {
  let baseExams = allExams
  if (statusFilter === 'Active') {
    baseExams = allExams.filter(e => {
      const cName = getVal(e, 'Course', 'course')
      return courses.find(c => cleanTitle(c.title).toLowerCase() === cleanTitle(cName).toLowerCase()) || cName === ''
    })
  }
  if (courseFilter === 'All') return baseExams
  const cName = courses.find(c => c.id === courseFilter)?.title || ''
  return baseExams.filter(e => {
  const examCourse = getVal(e, 'Course', 'course').toLowerCase()
  return examCourse === cName.toLowerCase() && examCourse !== ''
 })
 }, [allExams, courseFilter, courses, statusFilter])

 const upcoming = filtered.filter(e => {
 const d = getVal(e, 'date', 'Exam Date')
 return d && !isBefore(parseISO(d), now)
}).sort((a, b) => {
 const da = getVal(a, 'date', 'Exam Date')
 const db = getVal(b, 'date', 'Exam Date')
 return new Date(da).getTime() - new Date(db).getTime()
})
 const past = filtered.filter(e => {
 const d = getVal(e, 'date', 'Exam Date')
 return !d || isBefore(parseISO(d), now)
}).sort((a, b) => {
 const da = getVal(a, 'date', 'Exam Date')
 const db = getVal(b, 'date', 'Exam Date')
 return new Date(db).getTime() - new Date(da).getTime()
})

 const nextExam = upcoming[0]
 const nextDate = nextExam ? getVal(nextExam, 'date', 'Exam Date') : null
 const daysToNext = nextDate ? differenceInDays(parseISO(nextDate), now) : null

 const handleAddScore = async (exam: any) => {
 if (!scoreInput.trim()) return
 try {
 await onUpdate('04 - Exams', exam.id, {score: scoreInput.trim()})
 toast.success('Score saved')
 setEditingScore(null)
 setScoreInput('')
} catch {toast.error('Update failed')}
}

 // Selected exam detail
 if (selectedId) {
 const exam = allExams.find(e => e.id === selectedId)
 if (!exam) {setSelectedId(null); return null}
 const schema = databases.find(d => d.id === '04 - Exams')?.schema || {}
 const examCourse = stripWL(getVal(exam, 'Course', 'course'))
 const relatedHubs = hubs.filter(h => {
 const hubCourse = getVal(h, 'course', 'Course').toLowerCase()
 return hubCourse === examCourse.toLowerCase() && hubCourse !== ''
})
 const doneHubs = relatedHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length

 return (
 <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">Exam Detail</span>
 <EditableTitle
 value={exam.title}
 className="text-2xl font-black uppercase"
 onSave={(next) => {
 onUpdate('04 - Exams', exam.id, {title: next})
 setSelectedId(next)
}}
 />
 <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">{cleanTitle(examCourse)}</span>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={() => {onDelete('04 - Exams', selectedId); setSelectedId(null)}}
 className="p-2 text-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-none ">
 <Trash2 size={13} />
 </button>
 <button onClick={() => setSelectedId(null)} className="px-3 py-1.5 bg-muted/10 border border-border rounded-none text-[9px] font-black uppercase hover:bg-muted/20 ">Back</button>
 </div>
 </div>

 {/* Quick Info */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <StatCard label="Preparation Progress" value={`${doneHubs} / ${relatedHubs.length} Hubs`} accent />
 {getVal(exam, 'date', 'Exam Date') && !isBefore(parseISO(getVal(exam, 'date', 'Exam Date')), now) && (
 <StatCard label="Countdown" value={`${differenceInDays(parseISO(getVal(exam, 'date', 'Exam Date')), now)} Days Left`} />
 )}
 </div>

 {/* Properties */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {(() => {
 const internal = ['id', 'last_synced', 'links', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by']
 const keys = new Set([...Object.keys(schema || {}), ...Object.keys(exam || {})])
 return Array.from(keys)
 .filter(k => !internal.includes(k))
 .sort((a, b) => {
 const priority = ['date', 'score', 'Course', 'Type']
 const ai = priority.indexOf(a)
 const bi = priority.indexOf(b)
 if (ai !== -1 && bi !== -1) return ai - bi
 if (ai !== -1) return -1
 if (bi !== -1) return 1
 return a.localeCompare(b)
})
 .map(key => (
 <BigPropertyCard
 key={key}
 label={key}
 value={exam[key]}
 schema={schema[key]}
 onUpdate={(v) => onUpdate('04 - Exams', exam.id, {[key]: v})}
 />
 ))
})()}
 </div>

 {relatedHubs.length > 0 && (
 <section className="space-y-4">
 <SectionHeader title="Study Material Prep" count={relatedHubs.length} />
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {relatedHubs.map((hub, idx) => {
 const hubStatus = stripWL(getVal(hub, 'status', 'Status'))
 const isDone = hubStatus.toLowerCase().includes('complet')
 return (
 <div key={idx} className={cn('p-3 border border-border rounded-none flex items-center gap-3', isDone ? 'bg-muted/5 opacity-60' : 'bg-background')}>
 <div className={cn('w-4 h-4 rounded-none border flex items-center justify-center shrink-0', isDone ? 'bg-primary border-primary' : 'border-border')}>
 {isDone && <Check size={9} strokeWidth={4} className="text-primary-foreground" />}
 </div>
 <div className="flex-1 min-w-0">
 <span className={cn('text-[10px] font-black uppercase truncate block', isDone ? 'text-foreground/40' : 'text-foreground')}>
 {cleanTitle(hub.title || hub.id)}
 </span>
 <span className="text-[7px] font-black text-foreground/50 uppercase">Unit {getVal(hub, 'unit', 'Unit') || '?'}</span>
 </div>
 </div>
 )
})}
 </div>
 </section>
 )}
 </div>
 )
}

 return (
 <div className="h-full flex flex-col overflow-hidden">
 {/* Next Exam Hero */}
 {nextExam && (
 <div className="mx-6 mt-6 mb-2 shrink-0">
 <div className="p-6 sm:p-8 border border-border bg-muted/5 rounded-none flex items-center justify-between gap-6">
 <div className="space-y-1">
 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/50">Next Exam</span>
 <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">{cleanTitle(nextExam.title)}</h2>
 <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
 {cleanTitle(stripWL(getVal(nextExam, 'Course', 'course')))} · {getVal(nextExam, 'date', 'Exam Date') ? format(parseISO(getVal(nextExam, 'date', 'Exam Date')), 'MMM dd, yyyy') : '--'}
 </p>
 </div>
 <div className="text-right shrink-0">
 <div className="text-3xl font-black tracking-tighter text-foreground">
 {daysToNext ?? '--'}
 </div>
 <div className="text-[9px] font-black uppercase tracking-widest text-foreground/50">Days Left</div>
 </div>
 </div>
 </div>
 )}

  {/* Filter + Add bar */}
  <div className="px-6 py-4 border-b border-border flex flex-col gap-4 shrink-0">
  <div className="flex items-center justify-between w-full">
   {/* Stats */}
   <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
   {upcoming.length > 0 && <span className="text-foreground">{upcoming.length} <span className="text-foreground/50">upcoming</span></span>}
   {past.length > 0 && <span className="text-foreground/40">{past.length} past</span>}
   </div>
   
   {/* Filters */}
   <div className="flex items-center gap-2">
    <div className="flex bg-muted/5 p-1 rounded-none border border-border">
     <button onClick={() => setStatusFilter('Active')} className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-none ", statusFilter === 'Active' ? "bg-muted/20 text-foreground border border-border" : "text-foreground/50  hover:bg-muted/5")}>Active</button>
     <button onClick={() => setStatusFilter('All')} className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-none ", statusFilter === 'All' ? "bg-muted/20 text-foreground border border-border" : "text-foreground/50  hover:bg-muted/5")}>All</button>
    </div>
   </div>
  </div>
  
  <div className="flex items-center gap-2 w-full">
  {/* Course filter pills */}
  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1">
  {['All', ...courses.map(c => c.id)].map(id => {
  const label = id === 'All' ? 'All' : cleanTitle(courses.find(c => c.id === id)?.title || id)
  return (
  <button key={id} onClick={() => setCourseFilter(id)}
  className={cn(
  'px-3 py-1 rounded-none text-[8px] font-black uppercase tracking-wide whitespace-nowrap ',
  courseFilter === id ? 'text-foreground border border-foreground bg-muted/5' : 'border border-transparent bg-muted/5 text-foreground/50  hover:border-border'
  )}>{label}</button>
  )
 })}
  </div>
   <button onClick={() => {
   const title = window.prompt('Enter Exam Title', 'New Exam') || 'New Exam'
   const cleanAsgnTitle = cleanTitle(title)
   const props = courseFilter !== 'All' ? {Course: wrapWL(courses.find(c => c.id === courseFilter)?.title)} : {}
   onCreate('04 - Exams', cleanAsgnTitle, props)
 }}
   className="flex items-center gap-1.5 px-3 py-1.5 text-foreground bg-background border border-border text-[8px] font-black uppercase rounded-none hover:border-foreground/70  shrink-0">
   <Plus size={10} /> Add
   </button>
  </div>
  </div>

 {/* Exam lists */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10 pb-24">
 {/* Upcoming */}
 <section className="space-y-3">
 <SectionHeader title={`Upcoming — ${upcoming.length}`} />
 {upcoming.length === 0 && <EmptyState message="No upcoming exams." />}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {upcoming.map((exam, idx) => {
 const edate = getVal(exam, 'date', 'Exam Date')
 const days = edate ? differenceInDays(parseISO(edate), now) : 0
 const examCourse = stripWL(getVal(exam, 'Course', 'course')).toLowerCase()
 const relatedHubs = hubs.filter(h => {
 const hubCourse = stripWL(getVal(h, 'course', 'Course')).toLowerCase()
 return hubCourse === examCourse && hubCourse !== ''
})
 const doneHubs = relatedHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length
 const prepPct = relatedHubs.length > 0 ? Math.round((doneHubs / relatedHubs.length) * 100) : null

 return (
 <div key={idx} onClick={() => setSelectedId(exam.id)}
 className={cn('p-5 border border-border rounded-none cursor-pointer bg-background ')}>
 <div className="flex items-start justify-between gap-3 mb-3">
 <div className="flex-1 min-w-0">
 <span className="text-[13px] font-black uppercase block truncate">{cleanTitle(exam.title)}</span>
 <span className="text-[8px] font-black uppercase tracking-widest text-foreground/50">{cleanTitle(examCourse)}</span>
 </div>
 <div className="text-right shrink-0">
 <div className={cn('text-xl font-black')}>{days}</div>
 <div className="text-[7px] font-black uppercase text-foreground/50">days</div>
 </div>
 </div>
 <div className="text-[8px] font-black uppercase tracking-widest text-foreground/40 mb-2">
 {getVal(exam, 'date', 'Exam Date') ? format(parseISO(getVal(exam, 'date', 'Exam Date')), 'EEE, MMM dd') : 'No Date'}
 </div>
 {prepPct !== null && (
 <div className="space-y-1">
 <div className="flex justify-between items-center">
 <span className="text-[7px] font-black uppercase tracking-widest text-foreground/50">Prep</span>
 <span className="text-[7px] font-black text-foreground/50">{doneHubs}/{relatedHubs.length} hubs</span>
 </div>
 <div className="h-1 bg-muted/20 rounded-none overflow-hidden">
 <div className="h-full bg-foreground/70 " style={{width: `${prepPct}%`}} />
 </div>
 </div>
 )}
 </div>
 )
})}
 </div>
 </section>

 {/* Past */}
 {past.length > 0 && (
 <section className="space-y-3 opacity-60">
 <SectionHeader title={`Past — ${past.length}`} />
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {past.map((exam, idx) => {
 const isEditing = editingScore === exam.id
 const score = getVal(exam, 'score', 'Score')
 return (
 <div key={idx} onClick={() => !isEditing && setSelectedId(exam.id)}
 className="p-5 border border-border rounded-none bg-background cursor-pointer ">
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <span className="text-[13px] font-black uppercase block truncate">{cleanTitle(exam.title)}</span>
 <span className="text-[8px] font-black uppercase tracking-widest text-foreground/40">
 {cleanTitle(stripWL(getVal(exam, 'Course', 'course')))} · {getVal(exam, 'date', 'Exam Date') ? format(parseISO(getVal(exam, 'date', 'Exam Date')), 'MMM dd') : '--'}
 </span>
 </div>
 <div onClick={e => e.stopPropagation()}>
 {score ? (
 <span className="px-2 py-1 bg-foreground/5 border border-border text-[10px] font-black text-foreground">{score}</span>
 ) : isEditing ? (
 <div className="flex items-center gap-1">
 <input autoFocus value={scoreInput} onChange={e => setScoreInput(e.target.value)} placeholder="Score"
 className="w-20 bg-background border border-border px-2 py-1 text-[10px] font-black focus:outline-none"
 onKeyDown={e => {if (e.key === 'Enter') handleAddScore(exam); if (e.key === 'Escape') setEditingScore(null)}} />
 <button onClick={() => handleAddScore(exam)} className="p-1 text-primary"><Check size={11} /></button>
 </div>
 ) : (
 <button onClick={() => {setEditingScore(exam.id); setScoreInput('')}}
 className="px-2 py-1 text-[8px] font-black uppercase tracking-wide text-foreground/50 border border-border  ">
 + Score
 </button>
 )}
 </div>
 </div>
 </div>
 )
})}
 </div>
 </section>
 )}
 </div>
 </div>
 )
}
