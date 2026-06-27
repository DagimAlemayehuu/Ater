import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Check, Circle, Lock, Send, X } from 'lucide-react'
import { AterMarkdown } from '@/components/obsidian/MarkdownViewer'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { buildLessonRoadmap, type LessonRoadmapItem } from '@/lib/lessonRoadmap'
import { toast } from 'sonner'

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
}

const cleanMarkdown = (content: string) => content
  .replace(/^---[\s\S]*?---\n?/, '')
  .replace(/```interactive-quiz[\s\S]*?```/g, '')
  .trim()

const titleFromPath = (path?: string) => {
  const raw = (path || '').split(/[/\\]/).pop()?.replace(/\.md$/i, '') || 'Lesson'
  return raw.replace(/^\d+[_\s-]*/, '').replace(/[_-]/g, ' ')
}

function getAnswerValue(answer: any): string {
  if (Array.isArray(answer)) return answer.join(', ')
  if (answer === null || answer === undefined) return ''
  return String(answer)
}

function AdaptiveProvingGrounds({
  sessionId,
  notePath,
  onPassed,
}: {
  sessionId: string
  notePath: string
  onPassed: () => Promise<void>
}) {
  const [question, setQuestion] = useState<any | null>(null)
  const [answer, setAnswer] = useState<any>('')
  const [history, setHistory] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  const loadQuestion = useCallback(async () => {
    if (!sessionId || !notePath) return
    setLoading(true)
    setFeedback(null)
    setAnswer('')
    try {
      const res = await sidecarApi.getAdaptiveTutorQuestion({ session_id: sessionId, note_path: notePath, history })
      setQuestion(res.question)
    } catch (err: any) {
      toast.error(`Failed to load Proving Grounds: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }, [history, notePath, sessionId])

  useEffect(() => {
    setHistory([])
    setQuestion(null)
    setAnswer('')
    setFeedback(null)
  }, [notePath])

  useEffect(() => {
    if (!question && !loading) {
      void loadQuestion()
    }
  }, [loadQuestion, loading, question])

  const submit = async () => {
    if (!question || checking || getAnswerValue(answer).trim().length === 0) return
    setChecking(true)
    try {
      const res = await sidecarApi.checkAdaptiveTutorAnswer({
        session_id: sessionId,
        note_path: notePath,
        question,
        user_answer: answer,
        history,
      })
      const nextHistory = [
        ...history,
        {
          question_id: question.id,
          type: question.type,
          user_answer: answer,
          is_correct: res.is_correct,
        },
      ]
      setHistory(nextHistory)
      setFeedback(res)
      if (res.is_correct) {
        toast.success('Correct. Moving to the next lesson.')
        await onPassed()
      } else if (res.next_question) {
        setQuestion(res.next_question)
        setAnswer('')
      }
    } catch (err: any) {
      toast.error(`Failed to check answer: ${err.message || err}`)
    } finally {
      setChecking(false)
    }
  }

  const renderAnswerControl = () => {
    const type = String(question?.type || 'writing').toLowerCase()
    if (type === 'mcq' || type === 'multiple-choice') {
      const options = question?.options || {}
      return (
        <div className="grid gap-2">
          {Object.entries(options).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAnswer(key)}
              className={cn(
                'flex items-start gap-3 rounded-[6px] border px-3 py-2 text-left text-[12px] transition-colors',
                answer === key ? 'border-foreground/50 bg-foreground/10 text-foreground' : 'border-border/50 bg-bento-card text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="font-mono text-[10px] font-black">{key}</span>
              <span>{String(value)}</span>
            </button>
          ))}
        </div>
      )
    }
    if (type === 'true_false' || type === 'true-false') {
      return (
        <div className="grid grid-cols-2 gap-2">
          {['True', 'False'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAnswer(value)}
              className={cn(
                'h-10 rounded-[6px] border text-[10px] font-black uppercase tracking-widest transition-colors',
                answer === value ? 'border-foreground/50 bg-foreground/10 text-foreground' : 'border-border/50 bg-bento-card text-muted-foreground hover:text-foreground',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      )
    }
    return (
      <textarea
        value={getAnswerValue(answer)}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Write your answer..."
        className="min-h-[120px] w-full resize-none rounded-[6px] border border-border/50 bg-bento-card p-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 focus:border-foreground/30"
      />
    )
  }

  return (
    <section className="border-t border-border/40 bg-bento-bg px-8 py-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground/50">Proving Grounds</p>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Check Your Understanding</h2>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
            {history.length} checked
          </span>
        </div>

        <div className="rounded-[8px] border border-border/50 bg-bento-panel p-4">
          {loading || !question ? (
            <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading question</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{question.type || 'writing'}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{question.difficulty || 'L1'}</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <AterMarkdown content={question.question || ''} />
              </div>
              {renderAnswerControl()}
              <button
                type="button"
                onClick={submit}
                disabled={checking || getAnswerValue(answer).trim().length === 0}
                className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-border/60 bg-muted/30 px-4 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={12} />
                Check
              </button>
            </div>
          )}
        </div>

        {feedback && (
          <div className={cn(
            'rounded-[8px] border p-4',
            feedback.is_correct ? 'border-foreground/30 bg-foreground/5' : 'border-border/60 bg-bento-panel',
          )}>
            <div className="mb-2 flex items-center gap-2">
              {feedback.is_correct ? <Check size={14} /> : <X size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                {feedback.is_correct ? 'Correct' : 'Try The Follow-Up'}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">{feedback.feedback}</p>
            {!feedback.is_correct && feedback.hint && (
              <p className="mt-3 text-[12px] leading-relaxed text-foreground">{feedback.hint}</p>
            )}
            {!feedback.is_correct && feedback.lesson && (
              <div className="prose prose-sm dark:prose-invert mt-4 max-w-none border-t border-border/40 pt-4">
                <AterMarkdown content={feedback.lesson} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export function LearningWorkspace({
  preview,
  tutorSession,
  onTutorSessionChange,
  onPreviewChange,
  onClose,
}: LearningWorkspaceProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const notePath = preview.notePath || tutorSession?.current_note_path || ''
  const lessonRoadmap = useMemo(() => buildLessonRoadmap(tutorSession), [tutorSession])

  useEffect(() => {
    if (!notePath) return
    setLoading(true)
    sidecarApi.readObsidianNote(notePath)
      .then((res: any) => setContent(res.content || ''))
      .catch((err: any) => toast.error(`Failed to load lesson note: ${err.message || err}`))
      .finally(() => setLoading(false))
  }, [notePath])

  const openItem = (item: LessonRoadmapItem) => {
    if (item.status === 'locked') return
    onPreviewChange({
      title: item.title,
      lessonPath: item.lessonPath,
      notePath: item.path,
      hubPath: preview.hubPath || tutorSession?.hub_path || '',
      previewUrl: '',
    })
  }

  const completeCurrentNote = async () => {
    if (!tutorSession?.session_id) return
    const updated = await sidecarApi.advanceTutorSession({ session_id: tutorSession.session_id })
    onTutorSessionChange(updated)
    if (updated?.current_note_path) {
      onPreviewChange({
        title: titleFromPath(updated.current_note_path),
        lessonPath: updated.current_note_path,
        notePath: updated.current_note_path,
        hubPath: updated.hub_path || preview.hubPath || '',
        previewUrl: '',
      })
    } else {
      toast.success('Learning path completed.')
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 bg-bento-bg">
      <aside className="hidden w-[300px] shrink-0 border-r border-border/40 bg-bento-panel lg:flex lg:flex-col">
        <div className="h-14 shrink-0 border-b border-border/40 px-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-black uppercase tracking-widest text-foreground">Lesson Map</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Atomic Notes</p>
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
        <div className="min-h-0 flex-1 overflow-y-auto p-3 custom-scrollbar">
          {lessonRoadmap.length > 0 ? (
            <div className="space-y-4">
              {lessonRoadmap.map((chapter) => (
                <section key={chapter.id} className="space-y-1.5">
                  <h3 className="px-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{chapter.title}</h3>
                  {chapter.items.map((item) => {
                    const active = item.status === 'active'
                    const completed = item.status === 'completed'
                    const locked = item.status === 'locked'
                    return (
                      <button
                        key={item.path}
                        type="button"
                        disabled={locked}
                        onClick={() => openItem(item)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-[6px] border px-2.5 py-2 text-left transition-colors',
                          'border-border/40 bg-bento-bg text-muted-foreground hover:text-foreground',
                          active && 'border-foreground/40 bg-foreground/10 text-foreground',
                          completed && 'text-foreground/70',
                          locked && 'cursor-not-allowed opacity-35 hover:text-muted-foreground',
                        )}
                      >
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-border/60">
                          {completed ? <Check size={10} /> : locked ? <Lock size={10} /> : active ? <Circle size={8} className="fill-current" /> : null}
                        </span>
                        <span className={cn('min-w-0 flex-1 truncate text-[11px] font-semibold', completed && 'line-through opacity-60')}>{item.title}</span>
                      </button>
                    )
                  })}
                </section>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading map</div>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto custom-scrollbar">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/40 bg-bento-bg/95 px-6 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen size={16} className="text-muted-foreground/60" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase tracking-widest text-foreground">{titleFromPath(notePath)}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Markdown Lesson</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-[6px] border border-border/50 bg-muted/20 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Chat
          </button>
        </header>

        <article className="mx-auto max-w-3xl px-8 py-8">
          {loading ? (
            <div className="py-24 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading lesson</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <AterMarkdown content={cleanMarkdown(content)} path={notePath} />
            </div>
          )}
        </article>

        {tutorSession?.session_id && notePath && (
          <AdaptiveProvingGrounds
            key={`${tutorSession.session_id}:${notePath}`}
            sessionId={tutorSession.session_id}
            notePath={notePath}
            onPassed={completeCurrentNote}
          />
        )}
      </main>
    </div>
  )
}
