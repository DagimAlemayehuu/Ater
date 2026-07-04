import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, RotateCcw, Copy, Check } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { AterMarkdown } from './MarkdownViewer'
import { dispatchWalkthroughTrigger } from '@/components/layout/InteractiveTour'
import { extractArtifacts, stripArtifactMarkup } from '@/lib/artifacts/parser'
import { useArtifactStore } from '@/lib/artifacts/store'
import { UnifiedSandboxViewer } from './UnifiedSandboxViewer'

const last = <T,>(items: T[]): T | undefined => items[items.length - 1]

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Called once to get the initial explanation. Must resolve to the first
// assistant message string.
type InitialFetcher = () => Promise<string>

// Called for every follow-up message. Receives full message history.
// Must resolve to the next assistant message string.
type FollowUpFetcher = (messages: Message[]) => Promise<string>

function getActiveArtifactPayload() {
  const state = useArtifactStore.getState()
  const artifact = state.artifacts.find((item) => item.id === state.activeArtifactId)
  if (!artifact) return null
  const versionNumber = state.activeVersionByArtifact[artifact.id] || last(artifact.versions)?.version || 1
  const version = artifact.versions.find((item) => item.version === versionNumber) || last(artifact.versions)
  const code = version?.chapters.find((chapter) => chapter.sandbox)?.sandbox || version?.raw || ''
  if (!code) return null
  return {
    title: artifact.title,
    version: version?.version || 1,
    code,
  }
}

export interface AterExplainDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Short label shown at the top (e.g. selection text or question) */
  contextLabel?: string
  /** Optional sub-label (e.g. note title / "PDF page 3") */
  subLabel?: string
  /** Fetches the initial explanation */
  initialFetcher: InitialFetcher
  /** Fetches follow-up replies */
  followUpFetcher: FollowUpFetcher
}

/* ── Copy button ────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground/75 hover:text-foreground transition-none w-full justify-end"
    >
      {copied ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function AssistantCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/75 hover:text-foreground transition-none"
    >
      {copied ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function parseContentToMarkdown(content: string): string {
  const extracted = extractArtifacts(content)
  let cleanContent = stripArtifactMarkup(content)

  if (extracted.artifacts.length > 0) {
    let artifactMd = '\n\n'
    extracted.artifacts.forEach((artifact) => {
      const latestVersion = artifact.versions[artifact.versions.length - 1]
      if (!latestVersion) return

      latestVersion.chapters.forEach((chapter, idx) => {
        artifactMd += `## ${chapter.title.toUpperCase()}\n\n`
        if (chapter.content) {
          artifactMd += `${chapter.content}\n\n`
        }
      })
    })
    cleanContent = cleanContent.trim() + artifactMd
  }

  return cleanContent.trim()
}

/* ── Main Dialog ─────────────────────────────────────────────────────────── */
export function AterExplainDialog({
  isOpen,
  onClose,
  contextLabel,
  subLabel,
  initialFetcher,
  followUpFetcher,
}: AterExplainDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const generatedSpecRef = useRef<Set<string>>(new Set())
  const artifactState = useArtifactStore()
  // Track which trigger opened this dialog so we only fire once per open.
  const fetchKeyRef = useRef('')

  /* ── Open: fetch initial explanation ────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return
    dispatchWalkthroughTrigger('explain_dialog_open')
    // Build a key that represents this "session" — use the contextLabel.
    const key = contextLabel ?? '__open__'
    if (key === fetchKeyRef.current) return
    fetchKeyRef.current = key

    setMessages([])
    setInput('')
    runInitial()
  }, [isOpen, contextLabel])

  /* ── Auto-focus input after load ────────────────────────────────────── */
  useEffect(() => {
    if (isOpen && !loading) setTimeout(() => inputRef.current?.focus(), 120)
  }, [isOpen, loading])

  /* ── Scroll to BOTTOM on new messages ──────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    for (const [messageIndex, msg] of messages.entries()) {
      if (msg.role !== 'assistant') continue
      const extracted = extractArtifacts(msg.content)
      if (extracted.artifacts.length > 0) {
        const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        const mappedArtifacts = extracted.artifacts.map((artifact) => {
          const topicId = `explain-topic-${slugify(artifact.title)}`
          return {
            ...artifact,
            id: topicId,
            messageIndex,
            versions: artifact.versions.map((version) => ({
              ...version,
              messageIndex,
              chapters: version.chapters.map((chapter) => ({
                ...chapter,
                id: `${topicId}-${chapter.id}`,
              })),
            })),
          }
        })

        const stateBefore = useArtifactStore.getState()
        const previousCodesByArtifact: Record<string, string> = {}
        for (const artifact of mappedArtifacts) {
          const existingArtifact = stateBefore.artifacts.find(item => item.id === artifact.id)
          const activeVersionNumber = existingArtifact ? stateBefore.activeVersionByArtifact[existingArtifact.id] : undefined
          const activeVersion = existingArtifact?.versions.find(v => v.version === activeVersionNumber) || (existingArtifact ? existingArtifact.versions[existingArtifact.versions.length - 1] : undefined)
          const previousCode = activeVersion?.chapters.find(c => c.sandbox)?.sandbox || ''
          previousCodesByArtifact[artifact.id] = previousCode
        }

        useArtifactStore.getState().registerArtifacts(mappedArtifacts)

        for (const artifact of mappedArtifacts) {
          const version = artifact.versions[0]
          for (const [chapterIndex, chapter] of version.chapters.entries()) {
            if (!chapter.sandboxSpec) continue
            const key = `${messageIndex}:${artifact.id}:${chapter.id}:${chapter.sandboxSpec}`
            if (generatedSpecRef.current.has(key)) continue
            generatedSpecRef.current.add(key)

            const previousCode = previousCodesByArtifact[artifact.id] || ''

            const checkAndGenerate = async () => {
              const isOnline = navigator.onLine
              if (!isOnline) {
                useArtifactStore.getState().recordCompileError(artifact.id, "Browser is offline. Connect to the internet to compile.")
                return
              }
              try {
                const health = await sidecarApi.health()
                if (health.status !== 'ok') {
                  useArtifactStore.getState().recordCompileError(artifact.id, "FastAPI sidecar service is unhealthy.")
                  return
                }
              } catch {
                useArtifactStore.getState().recordCompileError(artifact.id, "FastAPI sidecar service is unreachable.")
                return
              }

              sidecarApi.generateArtifactCode({ 
                prompt: chapter.sandboxSpec!, 
                context: msg.content,
                previous_code: previousCode
              }).then((result) => {
                const code = result.code || result.answer || ''
                if (!code) {
                  useArtifactStore.getState().recordCompileError(artifact.id, "FastAPI sidecar generated empty code.")
                  return
                }
                const chapters = version.chapters.map((item) => (
                  item.id === chapter.id ? { ...item, sandbox: code } : item
                ))
                useArtifactStore.getState().recordCompileError(artifact.id, null)
                useArtifactStore.getState().addVersion(artifact.id, chapters, code, messageIndex)
              }).catch((err) => {
                useArtifactStore.getState().recordCompileError(artifact.id, err?.message || "Failed to generate sandbox code.")
              })
            }
            checkAndGenerate()
          }
        }
      }

      for (const spec of extracted.sandboxSpecs) {
        const key = `${messageIndex}:${spec.placeholderId}:${spec.prompt}`
        if (generatedSpecRef.current.has(key)) continue
        generatedSpecRef.current.add(key)
        const artifactId = `message-${messageIndex}-${spec.placeholderId}`
        useArtifactStore.getState().registerArtifacts([{
          id: artifactId,
          title: spec.prompt,
          versions: [{
            version: 1,
            messageIndex,
            raw: `<sandbox-spec>${spec.prompt}</sandbox-spec>`,
            chapters: [{
              id: `${artifactId}-chapter-1`,
              title: 'Generated Sandbox',
              content: '',
              sandboxSpec: spec.prompt,
              sandboxPlaceholderId: spec.placeholderId,
            }],
          }],
        }])
        const checkAndGenerateSpec = async () => {
          const isOnline = navigator.onLine
          if (!isOnline) {
            useArtifactStore.getState().recordCompileError(artifactId, "Browser is offline. Connect to the internet to compile.")
            return
          }
          try {
            const health = await sidecarApi.health()
            if (health.status !== 'ok') {
              useArtifactStore.getState().recordCompileError(artifactId, "FastAPI sidecar service is unhealthy.")
              return
            }
          } catch {
            useArtifactStore.getState().recordCompileError(artifactId, "FastAPI sidecar service is unreachable.")
            return
          }

          sidecarApi.generateArtifactCode({ prompt: spec.prompt, context: msg.content }).then((result) => {
            const code = result.code || result.answer || ''
            if (!code) {
              useArtifactStore.getState().recordCompileError(artifactId, "FastAPI sidecar generated empty code.")
              return
            }
            useArtifactStore.getState().recordCompileError(artifactId, null)
            useArtifactStore.getState().addVersion(artifactId, [{
              id: `${artifactId}-chapter-1-generated`,
              title: 'Generated Sandbox',
              content: '',
              sandbox: code,
            }], code, messageIndex)
          }).catch((err) => {
            useArtifactStore.getState().recordCompileError(artifactId, err?.message || "Failed to generate sandbox code.")
          })
        }
        checkAndGenerateSpec()
      }
    }
  }, [messages])

  /* ── Close: wipe state ──────────────────────────────────────────────── */
  const handleClose = () => {
    setMessages([])
    setInput('')
    useArtifactStore.getState().resetArtifacts()
    generatedSpecRef.current.clear()
    fetchKeyRef.current = ''
    onClose()
  }

  const runInitial = async () => {
    setLoading(true)
    try {
      const answer = await initialFetcher()
      setMessages([{ role: 'assistant', content: answer }])
    } catch (e: any) {
      setMessages([{ role: 'assistant', content: `**Error:** ${e.message || 'Failed to explain. Check your API key in Settings.'}` }])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const answer = await followUpFetcher(next)
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${e.message || 'Request failed.'}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog — centered, note document sizing and styling */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(960px,95vw)] h-[82vh] max-h-[850px] bg-background border border-border flex flex-col shadow-2xl rounded-[16px] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0 bg-muted/5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50">
              AI Tutor
            </span>
            {subLabel && (
              <span className="text-[11px] text-foreground/90 font-bold truncate max-w-[400px] mt-0.5">
                {subLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleClose}
              className="p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-[6px] transition-all"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Context chip */}
        {contextLabel && (
          <div className="px-6 py-3 border-b border-border/20 bg-muted/5 shrink-0">
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-0.5">Context</div>
            <div className="text-[11px] text-foreground/75 leading-relaxed line-clamp-1 italic">
              &ldquo;{contextLabel}&rdquo;
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-8">
            {/* Messages / Q&A Stream */}
            <div className="space-y-8">
              {messages.map((msg, i) => {
                const formattedMarkdown = msg.role === 'assistant' 
                  ? parseContentToMarkdown(msg.content) 
                  : msg.content

                // Don't render empty follow-up text bubbles if they only contained the artifact block
                if (msg.role === 'assistant' && !formattedMarkdown.trim()) return null

                return (
                  <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'user' ? (
                      <div className="max-w-[85%] bg-muted/20 border border-border px-4 py-3 text-[13px] rounded-[8px] text-foreground/90 leading-relaxed font-outfit">
                        {formattedMarkdown}
                      </div>
                    ) : (
                      <div className="w-full text-[14px] text-foreground/90 leading-relaxed font-outfit">
                        {/* Render active note header for the first explanation */}
                        {i === 0 && subLabel && (
                          <h1 className="text-2xl font-black uppercase tracking-wide mb-6 border-b border-border/40 pb-4">
                            {subLabel}
                          </h1>
                        )}
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wide">
                          <AterMarkdown content={formattedMarkdown} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="border border-border bg-bento-card px-5 py-4 rounded-[8px] flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border/30 shrink-0 bg-background py-4">
          <div className="max-w-3xl mx-auto w-full px-6">
            <div className="relative flex items-center bg-bento-bg border border-border focus-within:border-foreground/30 rounded-[8px] transition-all overflow-hidden">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up..."
                rows={1}
                disabled={loading}
                className="flex-1 min-h-[44px] max-h-[120px] bg-transparent border-none p-3 text-sm focus:outline-none resize-none placeholder:text-muted-foreground/20 font-sans leading-relaxed text-foreground"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={cn(
                  'h-9 px-4 mr-1.5 flex items-center justify-center rounded-[6px] transition-all duration-150',
                  input.trim() && !loading
                    ? 'bg-muted/50 text-foreground hover:bg-bento-item border border-border/40'
                    : 'text-muted-foreground/20 cursor-not-allowed'
                )}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Convenience factory: markdown / pdf viewers ────────────────────────── */
export function makeExplainSidebarFetchers(params: {
  path: string
  selection: string
  page?: number
  scope?: 'selection' | 'page' | 'note'
  sourceKind?: 'markdown' | 'pdf'
  selectionContext?: string
  noteMode?: string
  noteTitle?: string
  noteCourse?: string
}) {
  const initialFetcher: InitialFetcher = async () => {
    const res = await sidecarApi.aterExplain({
      path: params.path,
      selection: params.selection,
      page: params.page ?? 1,
      question: '',
      note_mode: params.noteMode,
      note_title: params.noteTitle,
      note_course: params.noteCourse,
      scope: params.scope,
      source_kind: params.sourceKind,
      selection_context: params.selectionContext,
    })
    return res.answer
  }

  const followUpFetcher: FollowUpFetcher = async (messages) => {
    const res = await sidecarApi.aterChat({
      path: params.path,
      selection: params.selection,
      page: params.page,
      messages,
      active_artifact: getActiveArtifactPayload(),
      scope: params.scope,
      source_kind: params.sourceKind,
      selection_context: params.selectionContext,
      note_mode: params.noteMode,
      note_title: params.noteTitle,
      note_course: params.noteCourse,
    })
    return res.answer
  }

  return { initialFetcher, followUpFetcher }
}

/* ── Convenience factory: practice question explain ─────────────────────── */
export function makePracticeExplainFetchers(params: {
  question: string
  type: string
  answer: any
  explanation?: string
  context?: string
  userAnswer?: string
  isCorrect?: boolean
  notePath?: string
}) {
  const formatAnswer = (a: any): string => {
    if (Array.isArray(a)) return a.join(', ')
    if (typeof a === 'object' && a !== null) return JSON.stringify(a)
    return String(a ?? '')
  }

  const initialFetcher: InitialFetcher = async () => {
    const res = await sidecarApi.explainQuestion({
      question: params.question,
      type: params.type,
      answer: formatAnswer(params.answer),
      explanation: params.explanation ?? '',
      context: params.context ?? '',
      userAnswer: params.userAnswer ?? '',
      is_correct: params.isCorrect,
      note_path: params.notePath,
    })
    return res.lesson || res.explanation
  }

  // Follow-up uses aterChat with the question as the "selection" anchor
  const followUpFetcher: FollowUpFetcher = async (messages) => {
    const res = await sidecarApi.aterChat({
      path: params.notePath || '',
      selection: params.question,
      messages,
      active_artifact: getActiveArtifactPayload(),
      scope: 'selection',
    })
    return res.answer
  }

  return { initialFetcher, followUpFetcher }
}
