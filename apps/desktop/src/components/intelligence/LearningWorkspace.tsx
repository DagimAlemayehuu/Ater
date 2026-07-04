import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Circle, Loader2, Map, FileText, Info } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { getSimpleLessonPath } from '@/lib/lessonRoadmap'
import { AterMarkdown, ProvingGroundsPractice } from '@/components/obsidian/MarkdownViewer'
import type { Question } from '@/types/practice'
import { parseHubTree, type NavNode } from '@/components/obsidian/HubConnectionsNav'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface LessonPreview {
  title: string
  lessonPath: string
  notePath?: string
  hubPath?: string
  previewUrl: string
}

interface LearningWorkspaceProps {
  preview: LessonPreview
  tutorSession: any | null
  onTutorSessionChange: (session: any) => void
  onPreviewChange: (preview: LessonPreview | null) => void
  onClose: () => void
  isGenerating?: boolean
  generatingStatus?: string | null
}

const titleFromPath = (path?: string) => {
  const raw = (path || '').split(/[/\\]/).pop()?.replace(/\.md$/i, '') || 'Lesson'
  return raw.replace(/^\d+[_\s-]*/, '').replace(/[_-]/g, ' ')
}

const isTemporaryLessonPath = (path?: string | null) => {
  return typeof path === 'string' && path.includes('remediation_temp')
}

export function LearningWorkspace({
  preview,
  tutorSession,
  onTutorSessionChange,
  onPreviewChange,
  onClose,
  isGenerating = false,
  generatingStatus = null,
}: LearningWorkspaceProps) {
  const [content, setContent] = useState<string>('')
  const [loadedContentPath, setLoadedContentPath] = useState<string | null>(null)
  const [noteMetadata, setNoteMetadata] = useState<Record<string, any>>({})
  const [showProperties, setShowProperties] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hubContent, setHubContent] = useState<string>('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [activePractice, setActivePractice] = useState<{ quizData: Question | Question[]; notePath?: string; initialQuestionIndex?: number } | null>(null)
  const [pendingReturnPractice, setPendingReturnPractice] = useState<{ quizData: Question | Question[]; notePath?: string; initialQuestionIndex?: number; originalPath?: string } | null>(null)
  const [remediationReloadNonce, setRemediationReloadNonce] = useState(0)
  const lessonScrollRef = React.useRef<HTMLDivElement | null>(null)
  const preservePracticeOnNextNoteChangeRef = React.useRef(false)
  const navigate = useNavigate()

  const notePath = preview.notePath || tutorSession?.current_note_path || ''
  const hubPath = tutorSession?.hub_path || preview.hubPath || ''
  const lessonTitle = useMemo(() => {
    const rawTitle = noteMetadata?.title || preview.title || titleFromPath(notePath)
    return String(rawTitle).replace(/\[\[(.*?)\]\]/g, '$1').replace(/[_-]/g, ' ').trim()
  }, [noteMetadata?.title, preview.title, notePath])

  useEffect(() => {
    if (preservePracticeOnNextNoteChangeRef.current) {
      preservePracticeOnNextNoteChangeRef.current = false
    } else {
      setActivePractice(null)
    }
    if (tutorSession?.session_id) {
      localStorage.setItem('ater_active_session_id', tutorSession.session_id);
    }
    if (notePath && !isTemporaryLessonPath(notePath)) {
      localStorage.setItem('ater_study_active_note_path', notePath)
      localStorage.setItem('ater_canonical_lesson_path', notePath)
      localStorage.setItem('ater_original_note_path', notePath)
    }
  }, [tutorSession?.session_id, notePath]);

  useEffect(() => {
    if (tutorSession || isGenerating) return

    let active = true
    const restoreSession = async () => {
      const activeSessionId = localStorage.getItem('ater_active_session_id')
      try {
        if (activeSessionId) {
          const session = await sidecarApi.getTutorStatus(activeSessionId)
          if (active && session) {
            onTutorSessionChange(session)
            return
          }
        }
        if (hubPath) {
          const session = await sidecarApi.getTutorSessionByHub(hubPath)
          if (active && session) {
            onTutorSessionChange(session)
          }
        }
      } catch (err) {
        console.error('Failed to restore tutor session in lesson workspace:', err)
      }
    }

    void restoreSession()
    return () => {
      active = false
    }
  }, [hubPath, isGenerating, onTutorSessionChange, tutorSession])

  useEffect(() => {
    if (!hubPath) {
      setHubContent('')
      return
    }
    let active = true
    const loadHub = async () => {
      try {
        const res = await sidecarApi.readObsidianNote(hubPath)
        if (active) {
          setHubContent(res.content || '')
        }
      } catch (err) {
        console.error('Failed to load hub note content:', err)
      }
    }
    void loadHub()
    return () => {
      active = false
    }
  }, [hubPath])

  const tree = useMemo(() => {
    const sourceJob = tutorSession?.source_job
    const roadmapItems = Array.isArray(tutorSession?.roadmap) ? tutorSession.roadmap : []
    const sourceNodes = Array.isArray(sourceJob?.concept_graph?.nodes) ? sourceJob.concept_graph.nodes : []

    const canonicalItems = roadmapItems.length > 0
      ? roadmapItems
      : sourceNodes.map((node: any) => ({
        id: node.id,
        title: node.title,
        path: node.path,
        status: node.id === tutorSession?.current_concept_node_id ? 'current' : 'locked',
      }))

    if (canonicalItems.length > 0) {
      return canonicalItems.map((item: any, index: number): NavNode => ({
        label: item.title || titleFromPath(item.path) || `Lesson ${index + 1}`,
        target: item.path || null,
        depth: 0,
        children: [],
        isChecked: item.status === 'completed',
      }))
    }

    return parseHubTree(hubContent)
  }, [hubContent, tutorSession?.current_concept_node_id, tutorSession?.roadmap, tutorSession?.source_job, tutorSession?.source_job_id])

  useEffect(() => {
    const expandAll = (nodes: NavNode[]) => {
      setExpandedNodes(prev => {
        const next = new Set(prev)
        let changed = false
        const traverse = (itemList: NavNode[]) => {
          for (const node of itemList) {
            if (!next.has(node.label)) {
              next.add(node.label)
              changed = true
            }
            if (node.children.length > 0) traverse(node.children)
          }
        }
        traverse(nodes)
        return changed ? next : prev
      })
    }
    if (tree.length > 0) {
      expandAll(tree)
    }
  }, [tree])

  const toggleNode = (label: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const getNoteStem = (p: string) => {
    return p.split(/[/\\]/).pop()?.replace(/\.(md|pdf)$/i, '')?.replace(/_/g, ' ')?.toLowerCase() || ''
  }

  const completedStems = useMemo(() => {
    return new Set(
      (Array.isArray(tutorSession?.completed_notes) ? tutorSession.completed_notes : [])
        .map((p: string) => getNoteStem(p))
    )
  }, [tutorSession?.completed_notes])

  const unlockedStems = useMemo(() => {
    return new Set(
      (Array.isArray(tutorSession?.active_note_unlocks) ? tutorSession.active_note_unlocks : [])
        .map((p: string) => getNoteStem(p))
    )
  }, [tutorSession?.active_note_unlocks])

  const currentStem = useMemo(() => {
    return getNoteStem(notePath)
  }, [notePath])

  const getNodeStatus = (target: string | null) => {
    if (!target) return 'locked'
    const stem = getNoteStem(target)

    // Check API roadmap first
    const apiItem = tutorSession?.roadmap?.find((r: any) => getNoteStem(r.path || r.title || '') === stem)
    if (apiItem) {
      return apiItem.status
    }

    if (completedStems.has(stem)) return 'completed'
    if (stem === currentStem) return 'current'
    if (unlockedStems.has(stem)) return 'unlocked'
    return 'locked'
  }

  const openItemByTarget = (target: string) => {
    const targetStem = getNoteStem(target)
    const matchPath = tutorSession?.curriculum?.find((p: string) => getNoteStem(p) === targetStem) || target
    if (matchPath) {
      if (tutorSession?.curriculum) {
        const status = getNodeStatus(matchPath)
        if (status === 'locked') {
          toast.error("This lesson is locked. Complete your current lesson first.")
          return
        }
      }
      setActivePractice(null)
      onPreviewChange({
        title: target.replace(/_/g, ' '),
        lessonPath: getSimpleLessonPath(matchPath),
        notePath: matchPath,
        hubPath: hubPath,
        previewUrl: '',
      })
    } else {
      console.warn(`Target not found in curriculum: ${target}`)
    }
  }

  useEffect(() => {
    const handleContinue = async (event: Event) => {
      const detail = (event as CustomEvent<{ notePath?: string }>).detail || {}
      const completedPath = detail.notePath || notePath
      if (!completedPath || !tutorSession?.session_id) return

      try {
        const res = await sidecarApi.advanceTutorSession({ session_id: tutorSession.session_id })
        if (res && res.can_advance) {
          onTutorSessionChange(res.session)
          const nextPath = res.session.current_note_path
          if (nextPath && nextPath !== completedPath) {
            onPreviewChange({
              title: titleFromPath(nextPath),
              lessonPath: getSimpleLessonPath(nextPath),
              notePath: nextPath,
              hubPath: preview.hubPath || res.session.hub_path || '',
              previewUrl: '',
            })
          }
        } else {
          toast.error(res?.message || 'Mastery gates (Recall and Transfer) must be cleared first before advancing.')
        }
      } catch (err: any) {
        console.error('Failed to advance progress:', err)
        toast.error('Failed to advance lesson map progress.')
      }
    }

    window.addEventListener('ater:practice-continue', handleContinue)
    return () => window.removeEventListener('ater:practice-continue', handleContinue)
  }, [notePath, onPreviewChange, onTutorSessionChange, preview.hubPath, tutorSession])

  // Listen for remediation lesson navigation
  useEffect(() => {
    const handleOpenRemediation = (event: Event) => {
      const detail = (event as CustomEvent<{
        tempPath: string
        originalPath?: string
        resumePractice?: boolean
        quizData?: Question | Question[]
        returnQuestionIndex?: number
      }>).detail || {};
      if (detail.tempPath) {
        const originalPath = detail.originalPath || (notePath && !isTemporaryLessonPath(notePath) ? notePath : localStorage.getItem('ater_original_note_path') || undefined);
        if (originalPath && !isTemporaryLessonPath(originalPath)) {
          localStorage.setItem('ater_original_note_path', originalPath);
          localStorage.setItem('ater_canonical_lesson_path', originalPath);
        }
        if (detail.resumePractice) {
          const resumeQuizData = detail.quizData || activePractice?.quizData;
          if (resumeQuizData) {
            setPendingReturnPractice({
              quizData: resumeQuizData,
              notePath: originalPath || activePractice?.notePath,
              initialQuestionIndex: detail.returnQuestionIndex ?? activePractice?.initialQuestionIndex ?? 0,
              originalPath,
            });
          }
        }
        setActivePractice(null);
        setRemediationReloadNonce((nonce) => nonce + 1);
        onPreviewChange({
          title: 'Remediation Lesson',
          lessonPath: detail.tempPath,
          notePath: detail.tempPath,
          hubPath: preview.hubPath || tutorSession?.hub_path || '',
          previewUrl: '',
        });
      }
    };

    const handleRestoreOriginal = (event: Event) => {
      const detail = (event as CustomEvent<{
        originalPath: string
        resumePractice?: boolean
        quizData?: Question | Question[]
        returnQuestionIndex?: number
      }>).detail || {};
      if (detail.originalPath) {
        localStorage.setItem('ater_study_active_note_path', detail.originalPath);
        localStorage.setItem('ater_canonical_lesson_path', detail.originalPath);
        const resumeQuizData = detail.resumePractice ? detail.quizData || pendingReturnPractice?.quizData : null;
        const resumePractice = resumeQuizData
          ? {
            quizData: resumeQuizData,
            notePath: detail.originalPath,
            initialQuestionIndex: detail.returnQuestionIndex ?? pendingReturnPractice?.initialQuestionIndex ?? 0,
          }
          : null;
        setActivePractice(resumePractice);
        if (resumePractice) {
          preservePracticeOnNextNoteChangeRef.current = true;
          setPendingReturnPractice(null);
          localStorage.removeItem('ater_pending_practice_resume');
        }
        onPreviewChange({
          title: titleFromPath(detail.originalPath),
          lessonPath: getSimpleLessonPath(detail.originalPath),
          notePath: detail.originalPath,
          hubPath: preview.hubPath || tutorSession?.hub_path || '',
          previewUrl: '',
        });
      }
    };

    window.addEventListener('ater:open-remediation-lesson', handleOpenRemediation);
    window.addEventListener('ater:restore-original-lesson', handleRestoreOriginal);

    return () => {
      window.removeEventListener('ater:open-remediation-lesson', handleOpenRemediation);
      window.removeEventListener('ater:restore-original-lesson', handleRestoreOriginal);
    };
  }, [activePractice, notePath, onPreviewChange, pendingReturnPractice, preview.hubPath, tutorSession]);

  // Clean up temporary note when the learning workspace unmounts
  useEffect(() => {
    return () => {
      void sidecarApi.deleteObsidianItem('database/learning paths/remediation_temp.md').catch(() => {});
    };
  }, []);

  // Load active note markdown content
  useEffect(() => {
    if (!notePath || isGenerating) {
      setContent('')
      setLoadedContentPath(null)
      setNoteMetadata({})
      return
    }

    let active = true
    const loadNote = async () => {
      setLoading(true)
      setLoadError(null)
      setContent('')
      setLoadedContentPath(null)
      setNoteMetadata({})

      try {
        const res = await sidecarApi.readObsidianNote(notePath)
        if (!active) return

        const noteText = res.content || ''
        setContent(noteText)
        setLoadedContentPath(notePath)
        setNoteMetadata(res.metadata || {})
      } catch (err: any) {
        console.error('Failed to load note content:', err)
        if (active) {
          setLoadError(`Failed to load lesson note: ${err?.message || err || 'Unknown error'}`)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadNote()
    return () => {
      active = false
    }
  }, [notePath, isGenerating, remediationReloadNonce])

  useEffect(() => {
    const scrollNode = lessonScrollRef.current;
    if (!scrollNode) return;
    if (typeof scrollNode.scrollTo === 'function') {
      scrollNode.scrollTo({ top: 0 });
    } else {
      scrollNode.scrollTop = 0;
    }
  }, [notePath, content, activePractice, remediationReloadNonce]);

  const renderNode = (node: NavNode, idx: number): React.ReactNode => {
    const status = getNodeStatus(node.target)
    const completed = status === 'completed'
    const active = status === 'active' || status === 'current'
    const unlocked = status === 'unlocked'
    const generated = status === 'generated'
    const locked = status === 'locked' || status === 'generated'
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodes.has(node.label)

    return (
      <div key={`${node.target ?? node.label}-${idx}`} className="flex flex-col">
        <div
          className={cn(
            "group flex items-center gap-1.5 py-1 px-3 rounded-[4px] relative mx-1 transition-all",
            active && "bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary/20",
            completed && !active && "text-muted-foreground/55",
            unlocked && !active && "hover:bg-foreground/[0.03] text-muted-foreground hover:text-foreground",
            !active && !completed && !unlocked && "text-muted-foreground/55",
            locked && "opacity-45 select-none"
          )}
        >
          {node.depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 flex" style={{width: node.depth * 14}}>
              {Array.from({length: node.depth}).map((_, i) => (
                <div key={i} className="w-[14px] border-r border-border/20 h-full" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 w-full" style={{marginLeft: node.depth * 14}}>
            <div
              className="w-4 h-4 shrink-0 flex items-center justify-center cursor-pointer"
              onClick={(e) => {e.stopPropagation(); toggleNode(node.label);}}
            >
              {hasChildren ? (
                <ChevronRight className={cn("w-3 h-3 text-muted-foreground/40 transition-transform", isExpanded ? "rotate-90" : "")} />
              ) : null}
            </div>

            <input
              type="checkbox"
              checked={completed}
              readOnly
              aria-label={`${completed ? 'Completed' : active ? 'Current' : locked ? 'Locked' : 'Upcoming'} lesson: ${node.label.replace(/_/g, ' ')}`}
              className={cn(
                "h-3.5 w-3.5 shrink-0 appearance-none border border-border bg-bento-card rounded-[4px] checked:bg-foreground/10 checked:border-foreground/20 relative after:content-[''] after:hidden checked:after:block after:absolute after:left-[4px] after:top-[0.5px] after:w-[3.5px] after:h-[7.5px] after:border-r-2 after:border-b-2 after:border-foreground/60 after:rotate-45 transition-all hover:border-foreground/20",
                completed && "opacity-80",
                active && "border-primary/70 bg-primary/10",
                locked && "cursor-not-allowed opacity-20"
              )}
            />

            {node.target ? (
              <button
                onClick={() => {
                  if (locked) {
                    toast.error('This lesson is locked. Master previous topics first!')
                    return
                  }
                  openItemByTarget(node.target!)
                }}
                className={cn(
                  "text-left text-[11px] leading-tight truncate flex-1 hover:text-foreground font-medium",
                  active && "text-foreground font-black",
                  completed && !active && "text-muted-foreground/50 font-medium line-through",
                  generated && "text-muted-foreground/40",
                  status === 'locked' && "text-muted-foreground/35",
                  unlocked && !active && !completed && "text-muted-foreground/70"
                )}
              >
                {node.label.replace(/_/g, ' ')}
              </button>
            ) : (
              <span
                onClick={() => toggleNode(node.label)}
                className="text-[9px] font-black uppercase tracking-widest opacity-35 flex-1 select-none cursor-pointer"
              >
                {node.label.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child, cidx) => renderNode(child, cidx))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 bg-bento-bg">
      {/* Main Area */}
      <main className="min-w-0 flex-1 flex flex-col min-h-0 bg-bento-bg">
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bento-panel select-none">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Generating Lesson</h3>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 max-w-md leading-relaxed">
              {generatingStatus || 'Writing curriculum stubs and compiling notes...'}
            </p>
          </div>
        ) : loading || (notePath && loadedContentPath !== notePath) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bento-panel select-none">
            <Loader2 size={24} className="text-muted-foreground/40 animate-spin mb-3" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Loading Lesson Content...</span>
          </div>
        ) : loadError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bento-panel">
            <div className="max-w-md rounded-[12px] border border-border bg-bento-card p-6">
              <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-[8px] border border-border bg-bento-panel text-muted-foreground">
                <Info size={18} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Lesson Could Not Load</h3>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{loadError}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 h-9 rounded-[8px] border border-border bg-bento-item px-4 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/50"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div ref={lessonScrollRef} className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-8">
            <div className={cn("mx-auto w-full space-y-6", activePractice ? "max-w-6xl" : "max-w-3xl")}>
              {!activePractice && showProperties && Object.keys(noteMetadata).length > 0 && (
                <div className="bg-bento-panel border border-border/50 rounded-[12px] p-4 text-xs space-y-2 select-none">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Properties</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(noteMetadata).map(([key, val]) => {
                      if (typeof val === 'object' && val !== null) {
                        return (
                          <div key={key} className="flex flex-col gap-0.5 bg-bento-card border border-border/40 rounded-[8px] p-2">
                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">{key.replace(/[_-]/g, ' ')}</span>
                            <span className="text-foreground font-medium truncate">{JSON.stringify(val)}</span>
                          </div>
                        )
                      }
                      return (
                        <div key={key} className="flex flex-col gap-0.5 bg-bento-card border border-border/40 rounded-[8px] p-2">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">{key.replace(/[_-]/g, ' ')}</span>
                          <span className="text-foreground font-medium truncate">{String(val)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {!activePractice && (
              <header className="border-b border-border/50 pb-5">
                <h1 className="break-words text-2xl font-black leading-tight tracking-normal text-foreground">
                  {lessonTitle}
                </h1>
              </header>
              )}
              {activePractice ? (
                <ProvingGroundsPractice
                  quizData={activePractice.quizData}
                  notePath={activePractice.notePath}
                  initialQuestionIndex={activePractice.initialQuestionIndex || 0}
                  initialStarted
                  onExit={() => setActivePractice(null)}
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <AterMarkdown content={content} path={notePath} onOpenPractice={setActivePractice} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sidebar: Lesson Map (on the right) */}
      {!isGenerating && (
        <aside className="hidden w-[300px] shrink-0 border-l border-border/40 bg-bento-panel lg:flex lg:flex-col select-none">
          <div className="h-14 shrink-0 border-b border-border/40 px-4 flex items-center justify-between">
            <div className="min-w-0 flex items-center gap-2 text-xs font-semibold tracking-[0.02em] text-muted-foreground uppercase bg-transparent">
              <Map size={16} strokeWidth={1.5} />
              MAP
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-[6px] border border-border/50 bg-bento-card text-muted-foreground hover:text-foreground flex items-center justify-center"
              aria-label="Back to chat"
            >
              <ArrowLeft size={14} />
            </button>
          </div>

          {/* Tools toolbar */}
          {((noteMetadata?.source_file || noteMetadata?.source) || Object.keys(noteMetadata).length > 0) && (
            <div className="px-4 py-2 border-b border-border/40 flex items-center justify-start gap-1.5 bg-muted/10 shrink-0">
              {/* Jump to PDF button */}
              {(noteMetadata?.source_file || noteMetadata?.source) && (
                <button
                  type="button"
                  onClick={async () => {
                    const src = noteMetadata.source_file || noteMetadata.source
                    if (!src) return;
                    let cleanPath = src
                    if (Array.isArray(src) && src.length > 0) {
                      cleanPath = src[0]
                    }
                    if (typeof cleanPath === 'string') {
                      cleanPath = cleanPath.replace(/^\[+/, '').replace(/\]+$/, '').split('|')[0]
                      if (cleanPath.includes('#')) {
                        cleanPath = cleanPath.split('#')[0]
                      }
                    }

                    const wps = Array.isArray(noteMetadata.source_pages)
                      ? noteMetadata.source_pages
                      : (noteMetadata.source_pages ? [noteMetadata.source_pages] : (noteMetadata.source_page ? [noteMetadata.source_page] : []))

                    const numericWaypoints = wps.map(Number).filter(n => !isNaN(n))
                    const firstPage = numericWaypoints.length > 0 ? numericWaypoints[0] : 1

                    let resolvedPath = cleanPath
                    try {
                      const searchRes = await sidecarApi.findVaultPage(cleanPath)
                      if (searchRes.found && searchRes.path) {
                        resolvedPath = searchRes.path
                      } else {
                        const parts = cleanPath.split(/[/\\]/)
                        const filename = parts[parts.length - 1]
                        if (filename) {
                          const searchRes2 = await sidecarApi.findVaultPage(filename)
                          if (searchRes2.found && searchRes2.path) {
                            resolvedPath = searchRes2.path
                          }
                        }
                      }
                    } catch (err) {
                      console.error("[Jump] Path resolution failed", err)
                    }
                    navigate(`/obsidian?path=${encodeURIComponent(resolvedPath)}&page=${firstPage}`)
                  }}
                  className="h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] border border-border bg-bento-card text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-wider transition-all"
                  title="Jump to Source PDF"
                >
                  <FileText size={12} />
                  Jump to PDF
                </button>
              )}

              {/* Toggle Properties Button */}
              {Object.keys(noteMetadata).length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowProperties(prev => !prev)}
                  className={cn(
                    "h-7 px-2.5 flex items-center gap-1.5 rounded-[6px] border text-[10px] font-bold uppercase tracking-wider transition-all",
                    showProperties
                      ? "bg-foreground/10 border-foreground/30 text-foreground"
                      : "bg-bento-card border-border text-muted-foreground hover:text-foreground"
                  )}
                  title="Toggle Properties"
                >
                  <Info size={12} />
                  Properties
                </button>
              )}
            </div>
          )}

          {/* Hub Topic context select block */}
          {(() => {
            const hubName = tutorSession?.hub_path || preview.hubPath || '';
            if (!hubName) return null;
            const clean = hubName.split(/[/\\]/).pop()?.replace(/\.md$/i, '') || '';
            return (
              <div className="p-4 pb-1 shrink-0">
                <div className="text-[11px] text-muted-foreground uppercase font-semibold mb-2 tracking-[0.02em]">Topic</div>
                <div className="w-full flex items-center justify-between bg-bento-item border border-border rounded-[12px] p-3 text-sm text-left">
                  <span className="truncate text-foreground font-medium">{clean.replace(/[_-]/g, ' ')}</span>
                </div>
              </div>
            );
          })()}

          {/* Sibling fallbacks / Connections list */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3 custom-scrollbar">
            {tree.length > 0 ? (
              <div className="flex flex-col space-y-0.5">
                {tree.map((node: NavNode, idx: number) => renderNode(node, idx))}
              </div>
            ) : (
              <div className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading map</div>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
