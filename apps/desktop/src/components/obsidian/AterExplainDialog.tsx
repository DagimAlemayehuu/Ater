import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, RotateCcw, Copy, Check } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { AterMarkdown } from './MarkdownViewer'

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
      className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-foreground transition-none w-full justify-end"
    >
      {copied ? <Check size={10} className="text-primary" /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
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
  // Track which trigger opened this dialog so we only fire once per open.
  const fetchKeyRef = useRef('')

  /* ── Open: fetch initial explanation ────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return
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

  /* ── Close: wipe state ──────────────────────────────────────────────── */
  const handleClose = () => {
    setMessages([])
    setInput('')
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

      {/* Dialog — centered, no border-radius to match Ater design system */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[760px] max-w-[95vw] h-[78vh] max-h-[780px] bg-background border border-border flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground italic">
              AI Tutor
            </span>
            {subLabel && (
              <span className="text-[9px] text-muted-foreground/30 font-medium truncate max-w-[260px]">
                {subLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={runInitial}
              title="Restart explanation"
              className="p-1.5 text-muted-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-none"
            >
              <RotateCcw size={12} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-muted-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-none"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Context chip */}
        {contextLabel && (
          <div className="px-5 py-3 border-b border-border/20 bg-muted/5 shrink-0">
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-1">Context</div>
            <div className="text-[11px] text-foreground/50 leading-relaxed line-clamp-2 italic">
              &ldquo;{contextLabel}&rdquo;
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'user' ? (
                <div className="max-w-[80%] bg-muted/20 border border-border px-4 py-3 text-[13px] rounded-[12px] text-foreground leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full border border-border bg-bento-card px-6 py-5 text-[13px] rounded-[12px] text-foreground overflow-x-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <AterMarkdown content={msg.content} />
                  </div>
                  <CopyButton text={msg.content} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="border border-border bg-bento-card px-5 py-4 rounded-[12px] flex items-center gap-3">
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

        {/* Input */}
        <div className="px-5 pb-5 pt-3 border-t border-border/30 shrink-0">
          <div className="relative flex items-center bg-bento-bg border border-border focus-within:border-foreground/30 rounded-[12px] transition-all overflow-hidden">
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
                'h-9 px-4 mr-1.5 flex items-center justify-center rounded-[8px] transition-all duration-150',
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
    })
    return res.lesson
  }

  // Follow-up uses aterChat with the question as the "selection" anchor
  const followUpFetcher: FollowUpFetcher = async (messages) => {
    const res = await sidecarApi.aterChat({
      path: '',
      selection: params.question,
      messages,
      scope: 'selection',
    })
    return res.answer
  }

  return { initialFetcher, followUpFetcher }
}
