import React, { useEffect, useRef, useState } from 'react'
import { BookOpenCheck, PanelRightOpen, Send, Trash2, X } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { cn } from '@/lib/utils'
import { AterMarkdown } from '@/components/obsidian/MarkdownViewer'
import { toast } from 'sonner'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type LessonPreview = {
  title: string
  lessonPath: string
  previewUrl: string
}

function resolvePreviewUrl(url: string): string {
  if (!url) return ''
  if (/^(https?:|data:|blob:)/.test(url)) return url
  return `http://127.0.0.1:8765${url.startsWith('/') ? url : `/${url}`}`
}

export default function Teacher() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('ater_teacher_chat_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [preview, setPreview] = useState<LessonPreview | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [panelWidth, setPanelWidth] = useState(520)
  const [isResizing, setIsResizing] = useState(false)

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.max(380, Math.min(window.innerWidth * 0.7, window.innerWidth - e.clientX))
      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    localStorage.setItem('ater_teacher_chat_history', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
  }, [input])

  const clearHistory = () => {
    setMessages([])
    setPreview(null)
    setPanelOpen(false)
    toast.success('Teacher history cleared.')
  }

  const handleSend = async (customText?: string) => {
    const text = (customText ?? input).trim()
    if (!text || isLoading) return

    if (!customText) {
      setInput('')
    }
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setIsLoading(true)
    setActiveStatus('Starting Teacher...')

    try {
      const response = await sidecarApi.teacherChatStream({ history: nextMessages })
      if (!response.ok) throw new Error(`HTTP error ${response.status}`)

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Response body has no reader.')

      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let assistantContent = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const parsed = JSON.parse(trimmed.slice(6))
          if (parsed.type === 'status') {
            setActiveStatus(parsed.message)
          } else if (parsed.type === 'chunk') {
            setActiveStatus(null)
            assistantContent += parsed.content
            setMessages(prev => {
              const updated = [...prev]
              const lastIndex = updated.length - 1
              if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                updated[lastIndex] = { ...updated[lastIndex], content: assistantContent }
              }
              return updated
            })
          } else if (parsed.type === 'lesson_created') {
            setPreview({
              title: parsed.title || 'Teacher Lesson',
              lessonPath: parsed.lesson_path || '',
              previewUrl: resolvePreviewUrl(parsed.preview_url || ''),
            })
            setPanelOpen(true)
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message || 'Teacher failed.')
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Teacher request failed.'
      toast.error(message)
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${message}` }])
    } finally {
      setIsLoading(false)
      setActiveStatus(null)
    }
  }

  return (
    <div className="h-full bg-bento-panel rounded-[12px] border border-border/40 shadow-sm overflow-hidden flex min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-[8px] border border-border bg-muted/20 flex items-center justify-center">
              <BookOpenCheck size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-foreground">Teacher</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Mission-driven lessons in your vault</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearHistory}
            className="size-9 rounded-[8px] border border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/30 flex items-center justify-center"
            title="Clear history"
            aria-label="Clear Teacher history"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center -mt-12 text-center">
              <h2 className="text-[32px] font-black uppercase tracking-tighter text-foreground">What should we learn?</h2>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                Ask Teacher to teach a topic. It will create a Lessons workspace in your vault and open the generated interactive lesson here.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1
                const hasRoadmap = message.content.includes('```mermaid') || message.content.includes('graph TD') || message.content.includes('graph LR')
                const showStartButton = message.role === 'assistant' && isLastMessage && hasRoadmap

                return (
                  <div key={index} className={cn('flex w-full', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'user' ? (
                      <div className="max-w-[80%] bg-muted/20 border border-border px-4 py-3 text-[13px] rounded-[12px] text-foreground leading-relaxed">
                        {message.content}
                      </div>
                    ) : (
                      message.content && (
                        <div className="max-w-full w-full border border-border bg-bento-card px-6 py-5 text-[13px] rounded-[12px] text-foreground overflow-x-auto flex flex-col gap-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <AterMarkdown content={message.content} />
                          </div>
                          {showStartButton && (
                            <div className="mt-2 pt-4 border-t border-border/40 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleSend('Start Lesson')}
                                disabled={isLoading}
                                className="h-9 px-5 bg-foreground text-background font-bold text-[10px] uppercase tracking-wider rounded-[6px] hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                              >
                                <BookOpenCheck size={12} />
                                Start Lesson
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )
              })}
              {isLoading && (
                <div className="flex justify-start w-full animate-pulse">
                  <div className="border border-border bg-bento-card px-5 py-4 rounded-[12px] flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{activeStatus || 'Thinking...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/40 bg-muted/10 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-bento-bg border border-border focus-within:border-foreground/30 rounded-[12px] transition-all overflow-hidden">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask Teacher..."
                className="flex-1 min-h-[44px] max-h-[120px] bg-transparent border-none p-3 text-sm focus:outline-none resize-none placeholder:text-muted-foreground/30 font-sans leading-relaxed text-foreground"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="button"
                aria-label="Send"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className={cn(
                  'h-9 px-4 mr-1.5 flex items-center justify-center rounded-[8px] transition-all duration-150',
                  input.trim() && !isLoading
                    ? 'bg-muted/50 text-foreground hover:bg-bento-item border border-border/40'
                    : 'text-muted-foreground/30 cursor-not-allowed',
                )}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && panelOpen && (
        <aside 
          style={{ width: `${panelWidth}px` }}
          className="relative min-w-[380px] max-w-[70%] border-l border-border/40 bg-bento-bg flex flex-col shrink-0 select-none"
        >
          {/* Resize Handle */}
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-foreground/20 transition-colors",
              isResizing ? "bg-foreground w-1" : "bg-transparent"
            )}
            onMouseDown={startResizing}
          />
          <div className="h-12 shrink-0 border-b border-border/40 px-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase tracking-widest text-foreground">{preview.title}</p>
              <p className="truncate text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">{preview.lessonPath}</p>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="size-8 rounded-[6px] border border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground flex items-center justify-center"
              aria-label="Close lesson preview"
            >
              <X size={14} />
            </button>
          </div>
          <iframe
            title={preview.title}
            src={preview.previewUrl}
            sandbox="allow-scripts allow-forms"
            className="flex-1 w-full bg-background"
            style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
          />
        </aside>
      )}

      {preview && !panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="fixed right-5 top-24 z-50 flex h-9 items-center gap-2 rounded-[6px] border border-border bg-muted px-3 text-[10px] font-black uppercase tracking-widest text-foreground shadow-lg hover:bg-accent"
          title="Open lesson preview"
        >
          <PanelRightOpen size={14} />
          Lesson
        </button>
      )}
    </div>
  )
}
