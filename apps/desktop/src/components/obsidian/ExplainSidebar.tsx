import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, RotateCcw } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ExplainSidebarProps {
  isOpen: boolean
  onClose: () => void
  selection: string
  path?: string
  page?: number
}

export function ExplainSidebar({ isOpen, onClose, selection, path, page }: ExplainSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prevSelectionRef = useRef('')

  useEffect(() => {
    if (isOpen && selection && selection !== prevSelectionRef.current) {
      prevSelectionRef.current = selection
      setMessages([])
      setInput('')
      triggerInitialExplain(selection)
    }
  }, [isOpen, selection])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 320)
  }, [isOpen])

  // Initial explain: uses /api/ater/explain which reads the actual document
  // for context — efficient because it only fetches the relevant page/section.
  const triggerInitialExplain = async (sel: string) => {
    setLoading(true)
    const initMsg: Message = { role: 'user', content: `Explain: "${sel}"` }
    setMessages([initMsg])
    try {
      const res = await sidecarApi.aterExplain({
        path: path || '',
        selection: sel,
        page: page ?? 1,
        question: '',
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `**Error:** ${e.message || 'Failed to explain. Check your API key in Settings.'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Follow-ups use /api/ater/chat — sends the full conversation history
  // with the original selection as context anchor.
  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await sidecarApi.aterChat({
        path: path || '',
        selection,
        page,
        messages: next,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }])
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `**Error:** ${e.message || 'Request failed.'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-[400px] max-w-[90vw] bg-background border-l border-border flex flex-col z-50 shadow-2xl"
        style={{ animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground italic">
              AI Tutor
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { prevSelectionRef.current = ''; triggerInitialExplain(selection) }}
              title="Restart explanation"
              className="p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              <RotateCcw size={12} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Selection chip */}
        {selection && (
          <div className="px-5 py-3 border-b border-border/20 bg-muted/5 shrink-0">
            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-1">
              Selection
            </div>
            <div className="text-[11px] text-foreground/50 leading-relaxed line-clamp-2 italic">
              &ldquo;{selection}&rdquo;
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[95%] rounded-xl px-4 py-3 text-[12px] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-foreground/10 border border-border/30 text-foreground'
                    : 'bg-muted/30 border border-border/20 text-foreground/80'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 prose-pre:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="bg-muted/5 border border-border/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 size={11} className="animate-spin text-primary/40" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                  Thinking…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-6 pt-3 border-t border-border/20 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask follow-up..."
              rows={1}
              className="flex-1 bg-muted/40 border-border/40 rounded-xl px-4 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-foreground/20 resize-none leading-relaxed custom-scrollbar"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-foreground/10 hover:bg-foreground/20 text-foreground border border-border/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
