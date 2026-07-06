import React, { useState, useMemo, useEffect } from 'react'
import { Search, Trash2, BookOpen, Plus, ChevronRight, Upload, Play, BookOpenCheck, Send, ArrowLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { differenceInDays, startOfDay } from 'date-fns'
import { stripWL, getVal, gradeColorClass, getDaysUntil, wrapWL, cleanTitle, calcGPA } from './utils'
import { SectionHeader, EmptyState, StatCard, EditableTitle, CreateBanner, CountdownBadge } from './SharedComponents'
import type { TabProps } from './types'
import { sidecarApi } from '@/lib/sidecarApi'
import { open } from '@tauri-apps/plugin-dialog'
import { toast } from 'sonner'
import { AterMarkdown } from '@/components/obsidian/MarkdownViewer'
import { LearningWorkspace } from '@/components/intelligence/LearningWorkspace'

export default function CoursesTab({ data, onUpdate, onCreate, onDelete, onOpenNote, navigateTo, onRefresh, initialSelectedId, onClearSelection }: TabProps) {
  const [selectedId,    setSelectedId]    = useState<string | null>(initialSelectedId || null)
  const [statusFilter,  setStatusFilter]  = useState<'Active' | 'All' | 'Completed'>('Active')
  const [search,        setSearch]        = useState('')
  const [addingCourse,  setAddingCourse]  = useState(false)
  const [prevInitId,    setPrevInitId]    = useState<string | null>(initialSelectedId || null)
  const [chapterName,   setChapterName]   = useState('')
  const [chapterBusy,   setChapterBusy]   = useState(false)
  const [roadmapInput,  setRoadmapInput]  = useState('')
  const [activeRoadmap, setActiveRoadmap] = useState<any | null>(null)
  const [activePreview, setActivePreview] = useState<any | null>(null)
  const [activeTutorSession, setActiveTutorSession] = useState<any | null>(null)
  const [showAddHubModal, setShowAddHubModal] = useState(false)
  const [vaultFiles, setVaultFiles] = useState<any[]>([])
  const [loaderType, setLoaderType] = useState<'roadmap' | 'lesson'>('roadmap')

  const getRoadmapTitles = (sourceJob: any) => {
    const chapterNotes = Array.isArray(sourceJob?.chapters)
      ? sourceJob.chapters.flatMap((chapter: any) => Array.isArray(chapter.atomic_notes) ? chapter.atomic_notes : [])
      : []
    const notes = chapterNotes.length > 0 ? chapterNotes : (sourceJob?.roadmap || [])
    return notes.map((item: any) => item?.title).filter(Boolean)
  }

  const applyRoadmapTitles = (sourceJob: any, titles: string[]) => {
    let idx = 0
    const roadmap = (sourceJob?.roadmap || []).map((item: any) => ({
      ...item,
      title: titles[idx++] || item.title,
    }))
    idx = 0
    const chapters = Array.isArray(sourceJob?.chapters)
      ? sourceJob.chapters.map((chapter: any) => ({
          ...chapter,
          atomic_notes: (chapter.atomic_notes || []).map((note: any) => ({
            ...note,
            title: titles[idx++] || note.title,
          })),
        }))
      : sourceJob?.chapters
    return { ...sourceJob, roadmap, chapters }
  }

  useEffect(() => {
    sidecarApi.listObsidianFiles()
      .then(res => setVaultFiles(res?.files || []))
      .catch(() => {})
  }, [data])

  const buildRoadmapMarkdown = (sourceJob: any, hubTitle: string) => {
    const placement = sourceJob.placement || {}
    const courseName = placement.course || sourceJob.domain || 'Academic'
    const titles = getRoadmapTitles(sourceJob)
    const chapters = Array.isArray(sourceJob.chapters) ? sourceJob.chapters : []
    const coverage = sourceJob.coverage || {}
    const covered = coverage.covered_source_items || 0
    const total = coverage.total_source_items || 0
    let markdown = `## ${courseName} - ${hubTitle.replace(/[_-]/g, ' ')} - Learning Roadmap\n\n`
    markdown += `${sourceJob.audit?.page_count || sourceJob.page_count || 0} pages · ${chapters.length || 1} chapters · ${titles.length} atomic notes planned`
    if (total > 0) markdown += ` · ${covered}/${total} source items covered`
    markdown += `.\n\n`
    if (sourceJob.warnings?.length) {
      markdown += `Warnings:\n\n${sourceJob.warnings.map((w: any) => `- ${w.severity}: ${w.description}`).join('\n')}\n\n`
    }
    markdown += `---\n\n`
    markdown += `**Chapter Roadmap**\n\n`
    if (chapters.length > 0) {
      markdown += chapters.map((chapter: any) => {
        const pages = Array.isArray(chapter.source_pages) && chapter.source_pages.length
          ? ` · pages ${chapter.source_pages.join(', ')}`
          : ''
        const notes = (chapter.atomic_notes || []).map((note: any) => {
          const notePages = Array.isArray(note.source_pages) && note.source_pages.length
            ? ` _(pages ${note.source_pages.join(', ')})_`
            : ''
          return `  - [ ] ${String(note.title || '').replace(/[_-]/g, ' ')}${notePages}`
        }).join('\n')
        return `### ${chapter.title || 'Chapter'}${pages}\n${notes}`
      }).join('\n\n')
    } else {
      markdown += titles.length > 0
        ? titles.map((title: string) => `- [ ] ${title.replace(/[_-]/g, ' ')}`).join('\n')
        : 'No teachable concepts were returned for this source yet.'
    }
    markdown += `\n\n---\n\nConfirm the roadmap to open the first lesson.`
    return markdown
  }

  // Sync external navigation
  if (initialSelectedId && initialSelectedId !== prevInitId) {
    setSelectedId(initialSelectedId); setPrevInitId(initialSelectedId)
  }
  useEffect(() => { if (initialSelectedId && onClearSelection) onClearSelection() }, [initialSelectedId, onClearSelection])

  const allCourses    = data.courses     || []
  const assignments   = data.assignments || []
  const exams         = data.exams       || []
  const hubs          = data.study_sessions || []
  const now           = startOfDay(new Date())

  const activeSemTitles = (data.semesters || [])
    .filter(s => stripWL(getVal(s, 'Status', 'status')).toLowerCase() === 'active')
    .map(s => String(s.title || '').toLowerCase())

  const filtered = useMemo(() => {
    let cs = allCourses
    if (statusFilter === 'Active') {
      cs = cs.filter(c => {
        const done  = stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet')
        const cSem  = stripWL(getVal(c, 'Semester', 'semester')).toLowerCase()
        const inAct = activeSemTitles.length === 0 || activeSemTitles.some(s => cSem.includes(s))
        return !done && inAct
      })
    } else if (statusFilter === 'Completed') {
      cs = cs.filter(c => stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet'))
    }
    if (search.trim()) cs = cs.filter(c => String(c.title || '').toLowerCase().includes(search.toLowerCase()))
    return cs
  }, [allCourses, statusFilter, search, activeSemTitles])

  // ─────────────────────────────────────────────────────────────────────────
  // COURSE DETAIL
  // ─────────────────────────────────────────────────────────────────────────
  const course = useMemo(() => allCourses.find(c => c.id === selectedId), [allCourses, selectedId])

  useEffect(() => {
    if (selectedId && !course && allCourses.length > 0) {
      setSelectedId(null)
    }
  }, [selectedId, course, allCourses, setSelectedId])

  if (selectedId && course) {
    const grade      = stripWL(getVal(course, 'Grade', 'grade'))
    const credits    = getVal(course, 'Credits', 'credits')
    const professor  = stripWL(getVal(course, 'Professor', 'professor'))
    const semester   = stripWL(getVal(course, 'Semester', 'semester'))

    const courseTitleNorm = String(course.title || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const courseAssignments = assignments.filter(a => {
      const aCourse = stripWL(getVal(a, 'Course', 'course')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      return aCourse && (aCourse.includes(courseTitleNorm) || courseTitleNorm.includes(aCourse));
    });
    const pending = courseAssignments.filter(a => !a.done && a.done !== 'true')
    const done    = courseAssignments.filter(a => a.done === true || a.done === 'true')

    const courseExams    = exams.filter(e => {
      const eCourse = stripWL(getVal(e, 'Course', 'course')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      return eCourse && (eCourse.includes(courseTitleNorm) || courseTitleNorm.includes(eCourse));
    });
    const upcomingExams  = courseExams.filter(e => e.date && new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const nextExam       = upcomingExams[0]

    const getUnitNumber = (item: any): number => {
      const titleStr = String(item.unit || item.title || item.id || '');
      const match = titleStr.match(/\d+/);
      return match ? parseInt(match[0], 10) : 99999;
    };

    const courseHubs  = hubs.filter(h => {
      const hCourse = stripWL(getVal(h, 'course', 'Course')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      return hCourse && (hCourse.includes(courseTitleNorm) || courseTitleNorm.includes(hCourse));
    });
    const sortedCourseHubs = [...courseHubs].sort((a, b) => {
      const numA = getUnitNumber(a);
      const numB = getUnitNumber(b);
      if (numA !== numB) return numA - numB;
      return String(a.title || a.id).localeCompare(String(b.title || b.id));
    });
    const doneHubs    = courseHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length
    const courseNotes = courseTitleNorm
      ? vaultFiles.filter(f => !f.is_dir && f.path.toLowerCase().endsWith('.md') && f.path.toLowerCase().replace(/_/g, ' ').includes(courseTitleNorm))
      : []

    const startAcademicChapter = async () => {
      const name = chapterName.trim()
      if (!name) {
        toast.error('Enter a chapter name')
        return
      }
      setLoaderType('roadmap')
      setChapterBusy(true)
      try {
        const hub = await sidecarApi.createAcademicChapterHub({
          chapter_title: name,
          semester: semester || 'General',
          course: cleanTitle(course.title),
        })
        const selected = await open({
          multiple: false,
          filters: [{ name: 'PDF', extensions: ['pdf'] }],
        })
        if (!selected || Array.isArray(selected)) {
          setChapterName('')
          toast.success('Hub created')
          onRefresh()
          setShowAddHubModal(false)
          return
        }
        const fileName = selected.split(/[\\/]/).pop() || `${name}.pdf`
        const uploadRes = await sidecarApi.aterInboxUpload(selected, fileName, 'academic')
        const sourceJob = await sidecarApi.createSourceLearningJob({
          file_path: uploadRes.path,
          learning_scope: 'academic',
          semester: semester || 'General',
          course: cleanTitle(course.title),
          unit: name,
          chapter_title: name,
          parent_hub_path: hub.path,
        })
        setChapterName('')
        toast.success('Roadmap ready')
        setActiveRoadmap({
          sourceJob,
          hubTitle: name,
          titles: getRoadmapTitles(sourceJob),
        })
        setShowAddHubModal(false)
      } catch (err: any) {
        toast.error(err.message || 'Chapter setup failed')
      } finally {
        setChapterBusy(false)
      }
    }

    const continueHub = async (hub: any) => {
      const jobId = stripWL(getVal(hub, 'source_job_id', 'Source Job ID', 'sourceJobId'))
      if (jobId) {
        await openSourceLesson(jobId, true)
        return
      }
      const hubPath = hub.path || `database/study planner/${hub.id}.md`
      const session = await sidecarApi.getTutorSessionByHub(hubPath)
      if (session?.source_job_id) {
        await openSourceLesson(session.source_job_id, true)
      } else if (session?.session_id) {
        setActivePreview({
          title: cleanTitle(hub.title || hub.id),
          lessonPath: session.hub_path || hubPath,
          notePath: session.current_note_path,
          hubPath: session.hub_path || hubPath,
          previewUrl: '',
        })
        setActiveTutorSession(session)
      } else {
        onOpenNote(hubPath)
      }
    }

    const updateRoadmapTitle = (index: number, value: string) => {
      setActiveRoadmap((current: any) => {
        if (!current) return current
        const titles = [...current.titles]
        titles[index] = value
        return { ...current, titles }
      })
    }

    const openSourceLesson = async (jobId?: string, resume = false) => {
      const targetJobId = jobId || activeRoadmap?.sourceJob?.job_id
      if (!targetJobId) return
      setLoaderType('lesson')
      setChapterBusy(true)
      try {
        let sourceJob = activeRoadmap?.sourceJob
        let tutor: any = null
        if (resume) {
          try {
            tutor = await sidecarApi.getTutorStatus(`source_tutor_${targetJobId}`)
            sourceJob = await sidecarApi.getSourceLearningJob(targetJobId)
          } catch {
            tutor = null
          }
        }
        if (activeRoadmap?.titles?.length) {
          sourceJob = await sidecarApi.updateSourceLearningJobRoadmap(targetJobId, activeRoadmap.titles)
        }
        if (!tutor) {
          const started = await sidecarApi.startSourceLearningJob(targetJobId)
          sourceJob = started.source_job || sourceJob || {}
          tutor = started.tutor_session || {}
        }
        const currentNote = tutor.current_note || {}
        const notePath = tutor.current_note_path || `${currentNote.note_title || sourceJob.topic || 'Source_Lesson'}.md`
        const hubPath = tutor.hub_path || sourceJob.hub_path || activeRoadmap?.sourceJob?.hub_path || ''
        setActivePreview({
          title: sourceJob.topic || activeRoadmap?.hubTitle || 'Lesson',
          lessonPath: hubPath,
          notePath,
          hubPath,
          previewUrl: '',
        })
        setActiveTutorSession({
          session_id: tutor.session_id,
          source_job_id: targetJobId,
          source_job: sourceJob,
          hub_path: hubPath,
          current_note_path: notePath,
          current_concept_node_id: tutor.current_concept_node_id,
          completed_notes: tutor.completed_notes || [],
          wagers: {},
          score: 0,
          status: 'active',
          updated_at: new Date().toISOString(),
          active_note_unlocks: tutor.active_note_unlocks || [notePath],
          curriculum: tutor.curriculum || (sourceJob.roadmap || []).map((item: any) => item.path).filter(Boolean),
          coverage: sourceJob.coverage,
          roadmap: tutor.roadmap || sourceJob.roadmap,
          warnings: sourceJob.warnings || [],
        })
        setActiveRoadmap(null)
        onRefresh()
      } catch (err: any) {
        toast.error(err.message || 'Failed to open lesson')
      } finally {
        setChapterBusy(false)
      }
    }

    const handleRoadmapSend = async () => {
      const text = roadmapInput.trim()
      if (!text) return
      if (/^(confirm|start|start lesson|confirm roadmap)$/i.test(text)) {
        setRoadmapInput('')
        await openSourceLesson()
        return
      }

      setLoaderType('roadmap')
      setChapterBusy(true)
      try {
        const jobId = activeRoadmap?.sourceJob?.job_id
        if (!jobId) return
        const updatedJob = await sidecarApi.refineSourceLearningJobRoadmap(jobId, text, activeRoadmap.titles)
        setRoadmapInput('')
        setActiveRoadmap((current: any) => {
          if (!current) return current
          return {
            ...current,
            sourceJob: updatedJob,
            titles: getRoadmapTitles(updatedJob),
          }
        })
        toast.success('Roadmap updated')
      } catch (err: any) {
        console.error('[Roadmap Refinement] Error refining roadmap:', err)
        const renameMatch = text.match(/^rename\s+(\d+)\s+(?:to\s+)?(.+)$/i)
        const addMatch = text.match(/^add\s+(.+)$/i)
        const removeMatch = text.match(/^remove\s+(\d+)$/i)
        if (renameMatch) {
          const index = Number(renameMatch[1]) - 1
          updateRoadmapTitle(index, renameMatch[2])
          setRoadmapInput('')
        } else if (addMatch) {
          setActiveRoadmap((current: any) => current ? { ...current, titles: [...current.titles, addMatch[1]] } : current)
          setRoadmapInput('')
        } else if (removeMatch) {
          const index = Number(removeMatch[1]) - 1
          setActiveRoadmap((current: any) => current ? { ...current, titles: current.titles.filter((_: string, idx: number) => idx !== index) } : current)
          setRoadmapInput('')
        } else {
          toast.error(err.message || 'Failed to update roadmap')
        }
      } finally {
        setChapterBusy(false)
      }
    }

    if (activePreview) {
      return (
        <div className="h-full overflow-hidden relative">
          {chapterBusy && <AterAILoader type={loaderType} />}
          <LearningWorkspace
            preview={activePreview}
            tutorSession={activeTutorSession}
            onTutorSessionChange={setActiveTutorSession}
            onPreviewChange={setActivePreview}
            onClose={() => {
              setActivePreview(null)
              setActiveTutorSession(null)
              onRefresh()
            }}
          />
        </div>
      )
    }

    if (activeRoadmap) {
      const sourceJob = applyRoadmapTitles(activeRoadmap.sourceJob, activeRoadmap.titles)
      return (
        <div className="h-full flex flex-col overflow-hidden bg-background relative">
          {chapterBusy && <AterAILoader type={loaderType} />}
          <div className="shrink-0 border-b border-border px-6 py-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveRoadmap(null)}
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={13} /> Course
            </button>
            <button
              onClick={() => openSourceLesson()}
              disabled={chapterBusy}
              className="h-9 px-5 bg-muted/30 text-foreground border border-border/60 font-bold text-[10px] uppercase tracking-wider rounded-[6px] hover:bg-muted/50 disabled:opacity-50 flex items-center gap-2"
            >
              <BookOpenCheck size={12} /> {chapterBusy ? 'Opening...' : 'Confirm Roadmap'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8">
            <div className="max-w-4xl mx-auto border border-border bg-bento-card px-6 py-5 text-[13px] rounded-[12px] text-foreground flex flex-col gap-5">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <AterMarkdown content={buildRoadmapMarkdown(sourceJob, activeRoadmap.hubTitle)} />
              </div>
              <div className="border-t border-border/30 pt-4 mt-2 flex justify-end">
                <button
                  onClick={() => void openSourceLesson()}
                  disabled={chapterBusy}
                  className="px-5 py-2.5 bg-bento-item border border-border text-foreground hover:bg-bento-item/80 font-bold text-[10px] uppercase tracking-widest rounded-[6px] flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <BookOpenCheck size={14} />
                  {chapterBusy ? 'Starting lesson...' : 'Confirm and Start First Lesson'}
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-background/95 px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-end gap-2">
              <textarea
                value={roadmapInput}
                onChange={event => setRoadmapInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleRoadmapSend()
                  }
                }}
                placeholder="Talk to the AI to refine your roadmap (e.g. 'rename 2 to New Title', 'remove 3', 'add Concept', or ask for custom adjustments)..."
                className="min-h-[42px] max-h-28 flex-1 resize-none bg-bento-card border border-border rounded-[8px] px-3 py-3 text-[12px] font-bold focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground/40"
              />
              <button
                onClick={() => void handleRoadmapSend()}
                disabled={chapterBusy}
                className="h-[42px] w-[42px] flex items-center justify-center border border-border bg-bento-item/60 rounded-[8px] text-foreground hover:bg-bento-item disabled:opacity-50"
                title="Send"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div data-tour="course-detail-view" className="h-full overflow-y-auto custom-scrollbar p-10 space-y-10 pb-24 relative">
        {chapterBusy && <AterAILoader type={loaderType} />}
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button onClick={() => setSelectedId(null)} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">← Courses</button>
            <EditableTitle value={cleanTitle(course.title)} className="text-2xl font-black uppercase tracking-tight"
              onSave={v => { onUpdate('courses', course.id, { title: v }); setSelectedId(v) }} />
            <div className="flex items-center gap-3 mt-1">
              {professor && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{professor}</span>}
              {semester  && <span className="text-[9px] font-black uppercase text-foreground/40">· {semester}</span>}
              {grade     && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase border', gradeColorClass(grade))}>{grade}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { onDelete('courses', selectedId); setSelectedId(null) }} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Countdown */}
        {nextExam && (
          <div className="p-5 bg-bento-card border border-border rounded-[8px] flex items-center justify-between">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Next Exam</span>
              <p className="text-[14px] font-black uppercase mt-0.5 text-foreground">{cleanTitle(nextExam.title)}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-foreground">{nextExam.date ? differenceInDays(new Date(nextExam.date), now) : '--'}</span>
              <p className="text-[8px] font-black uppercase text-muted-foreground">days</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard label="Credits"     value={credits || '--'} />
          <StatCard label="Assignments" value={`${done.length}/${courseAssignments.length}`} sub="completed" />
          <StatCard label="Exams"       value={courseExams.length} />
          <StatCard label="Hubs"        value={`${doneHubs}/${courseHubs.length}`} sub="studied" />
          <StatCard label="Atomic Notes" value={courseNotes.length} />
        </div>

        {/* Hub progress */}
        <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeader title="Study Hubs" count={courseHubs.length} />
              <button onClick={() => navigateTo('PLANNER')} className="text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">View All →</button>
            </div>
            {courseHubs.length === 0 ? (
              <EmptyState message="No study hubs yet." />
            ) : (
              <>
            <div className="w-full bg-muted/20 h-1.5 mb-2">
              <div className="h-full bg-foreground/70" style={{ width: `${courseHubs.length > 0 ? (doneHubs / courseHubs.length) * 100 : 0}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sortedCourseHubs.slice(0, 6).map((hub, idx) => {
                const isDone = stripWL(getVal(hub, 'status', 'Status')).toLowerCase().includes('complet')
                const sourceJobId = stripWL(getVal(hub, 'source_job_id', 'Source Job ID', 'sourceJobId'))
                return (
                  <div key={idx}
                    className={cn('p-3 border rounded-[6px] flex flex-col gap-3 transition-colors',
                      isDone ? 'border-border bg-bento-card opacity-60' : 'border-border bg-bento-card hover:bg-bento-item/30')}>
                    <button
                      onClick={() => onOpenNote(hub.path || `database/study planner/${hub.id}.md`)}
                      className="flex items-center gap-3 text-left min-w-0"
                    >
                      <div className={cn('w-3 h-3 border rounded-[2px] shrink-0', isDone ? 'bg-foreground border-foreground' : 'border-border')} />
                      <span className={cn('text-[10px] font-black uppercase truncate', isDone ? 'text-muted-foreground line-through' : 'text-foreground')}>
                        {cleanTitle(hub.title || hub.id)}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          void continueHub(hub)
                        }}
                        className="flex-1 h-8 flex items-center justify-center gap-1.5 border border-border rounded-[5px] text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-bento-item"
                      >
                        <Play size={10} /> {sourceJobId ? 'Continue Lesson' : 'Open Hub'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
              </>
            )}
          </section>

        {/* Pending Assignments */}
        {pending.length > 0 && (
          <section className="space-y-3">
            <SectionHeader title={`Pending Assignments`} count={pending.length}
              onAction={() => onCreate('assignments', 'New Assignment', { Course: wrapWL(course.title) })} />
            <div className="flex flex-col gap-2">
              {pending.map((a, idx) => (
                <div key={idx} onClick={() => onOpenNote(a.path || `database/assignments/${a.id}.md`)}
                  className="flex items-center gap-3 p-3 border border-border bg-bento-card rounded-[6px] cursor-pointer hover:bg-bento-item/50 transition-colors">
                  <div className="w-3.5 h-3.5 border border-border rounded-[2px] shrink-0" />
                  <span className="text-[11px] font-black uppercase flex-1 text-foreground">{cleanTitle(a.title)}</span>
                  {a.due_date && <CountdownBadge days={getDaysUntil(a.due_date)} />}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-start pt-2">
          <button
            onClick={() => {
              setChapterName('')
              setShowAddHubModal(true)
            }}
            className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans"
          >
            + ADD STUDY HUB
          </button>
        </div>

        {showAddHubModal && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-bento-panel border border-border/40 rounded-[10px] shadow-2xl flex flex-col overflow-hidden">
              <div className="h-12 shrink-0 border-b border-border/40 flex items-center justify-between px-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Create Study Hub</h3>
                <button
                  onClick={() => setShowAddHubModal(false)}
                  className="size-8 border border-border/40 hover:border-foreground/20 hover:bg-bento-item rounded-[6px] flex items-center justify-center transition-all"
                  aria-label="Close"
                >
                  <X size={14} className="text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Chapter Name</label>
                  <input
                    value={chapterName}
                    onChange={e => setChapterName(e.target.value)}
                    placeholder="e.g. Chapter 3: Dynamic Routing"
                    className="w-full bg-background/40 border border-border rounded-[6px] px-3 py-2.5 text-[12px] font-bold focus:outline-none focus:border-foreground/30 text-foreground"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && chapterName.trim() && !chapterBusy) {
                        e.preventDefault();
                        void startAcademicChapter();
                      }
                    }}
                    autoFocus
                  />
                </div>
                
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => void startAcademicChapter()}
                    disabled={!chapterName.trim() || chapterBusy}
                    className="w-full h-10 flex items-center justify-center gap-1.5 border border-border bg-bento-item/50 rounded-[6px] text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-bento-item disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Upload size={12} />
                    {chapterBusy ? 'Creating Hub...' : 'Upload PDF & Generate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COURSE LIST
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {chapterBusy && <AterAILoader type={loaderType} />}
      {/* Filter bar */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5 bg-bento-card p-1 border border-border rounded-[6px]">
          {(['Active', 'All', 'Completed'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn('px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-[4px] transition-colors',
                statusFilter === f ? 'bg-bento-item text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 bg-bento-card border border-border rounded-[6px] px-3 py-2">
          <Search size={11} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
            className="flex-1 bg-transparent text-[11px] font-bold focus:outline-none text-foreground placeholder:text-muted-foreground/30" />
        </div>
        <button onClick={() => setAddingCourse(true)}
          data-tour="course-add"
          className="px-2 py-0.5 border border-border/50 bg-bento-card hover:bg-bento-item/20 text-[7.5px] font-black uppercase tracking-wider rounded-[4px] text-foreground transition-all flex items-center justify-center h-5 font-sans">
          + ADD
        </button>
      </div>

      {addingCourse && (
        <div className="px-6 pt-3 shrink-0">
          <CreateBanner label="Course" placeholder="e.g. Calculus II"
            onConfirm={name => { onCreate('courses', name, { Status: wrapWL('Active') }); setAddingCourse(false) }}
            onCancel={() => setAddingCourse(false)} />
        </div>
      )}

      {/* Summary stats */}
      <div className="px-6 py-2 border-b border-border flex items-center gap-5 text-[8px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
        <span>{allCourses.length} total</span>
        <span>{filtered.length} shown</span>
        <span>{allCourses.filter(c => !stripWL(getVal(c, 'Status', 'status')).toLowerCase().includes('complet')).length} active</span>
        <span className="ml-auto text-foreground">{calcGPA(allCourses.filter(c => getVal(c, 'Grade', 'grade')))} GPA</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
        {filtered.length === 0 && !addingCourse && <EmptyState message="No courses found." />}
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((course, idx) => {
            const grade       = stripWL(getVal(course, 'Grade', 'grade'))
            const credits     = getVal(course, 'Credits', 'credits')
            const professor   = stripWL(getVal(course, 'Professor', 'professor'))
            const semester    = stripWL(getVal(course, 'Semester', 'semester'))
            const courseTitleNorm = String(course.title || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
            const cAssign     = assignments.filter(a => {
              const aCourse = stripWL(getVal(a, 'Course', 'course')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
              return aCourse && (aCourse.includes(courseTitleNorm) || courseTitleNorm.includes(aCourse));
            });
            const pendingCt   = cAssign.filter(a => !a.done).length
            const cExams      = exams.filter(e => {
              const eCourse = stripWL(getVal(e, 'Course', 'course')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
              return eCourse && (eCourse.includes(courseTitleNorm) || courseTitleNorm.includes(eCourse));
            });
            const nextEx      = cExams.filter(e => e.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
            const daysToExam  = nextEx?.date ? differenceInDays(new Date(nextEx.date), now) : null
            const cHubs       = hubs.filter(h => {
              const hCourse = stripWL(getVal(h, 'course', 'Course')).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
              return hCourse && (hCourse.includes(courseTitleNorm) || courseTitleNorm.includes(hCourse));
            });
            const doneH       = cHubs.filter(h => stripWL(getVal(h, 'status', 'Status')).toLowerCase().includes('complet')).length

            return (
              <div key={idx} onClick={() => setSelectedId(course.id)}
                data-tour={`course-card-${course.id}`}
                className="p-5 border border-border bg-bento-card rounded-[8px] cursor-pointer hover:bg-bento-item/30 transition-all flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-black uppercase leading-tight text-foreground">{cleanTitle(course.title)}</h3>
                  {grade && <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase border shrink-0', gradeColorClass(grade))}>{grade}</span>}
                </div>
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground/65">
                  {professor && <span>{professor}</span>}
                  {semester  && <span>· {semester}</span>}
                  {credits   && <span>· {credits} CR</span>}
                </div>
                {cHubs.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] font-black uppercase text-muted-foreground/65">
                      <span>Study Progress</span><span>{doneH}/{cHubs.length}</span>
                    </div>
                    <div className="h-0.5 bg-[#242426] rounded-full overflow-hidden">
                      <div className="h-full bg-foreground/70" style={{ width: `${cHubs.length > 0 ? (doneH / cHubs.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest border-t border-border pt-2">
                  {pendingCt > 0 && <span className="text-foreground">{pendingCt} due</span>}
                  {daysToExam !== null && daysToExam >= 0 && (
                    <span className={daysToExam <= 7 ? 'text-foreground font-black' : 'text-muted-foreground/65'}>exam in {daysToExam}d</span>
                  )}
                  {pendingCt === 0 && daysToExam === null && <span className="text-muted-foreground/30">All clear</span>}
                  <ChevronRight size={10} className="ml-auto text-muted-foreground/40" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const ROADMAP_STAGES = [
  'Reading document...',
  'Analyzing topics...',
  'Creating study plan...',
  'Finalizing roadmap...'
]

const LESSON_STAGES = [
  'Preparing lesson...',
  'Writing notes...',
  'Generating quiz...',
  'Saving to vault...'
]

interface AterAILoaderProps {
  type: 'roadmap' | 'lesson'
}

function AterAILoader({ type }: AterAILoaderProps) {
  const stages = type === 'roadmap' ? ROADMAP_STAGES : LESSON_STAGES
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    let active = true
    const run = async () => {
      for (let i = 0; i < stages.length; i++) {
        if (!active) break
        setCurrentIdx(i)
        // Allocate time budget for each simple step (~40-50 seconds total)
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 5000 : 9000))
      }
    }
    void run()
    return () => {
      active = false
    }
  }, [type, stages])

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-3">
        {/* Minimal rotating circle */}
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-border border-t-foreground/80" />
        {/* Simple English status text */}
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 font-sans select-none animate-pulse">
          {stages[currentIdx]}
        </span>
      </div>
    </div>
  )
}
