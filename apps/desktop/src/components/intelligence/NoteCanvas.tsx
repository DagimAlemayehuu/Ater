import React, { useState, useEffect } from 'react'
import { AterMarkdown } from '@/components/obsidian/MarkdownViewer'
import { FileText, Eye, AlertCircle } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'

interface NoteCanvasProps {
  notePath: string | null;
  onNavigate?: (page: string) => void;
}

export function NoteCanvas({ notePath, onNavigate }: NoteCanvasProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!notePath) {
      setContent('')
      return
    }

    // If it's a full URL (lesson preview) or a .html path, render via iframe — don't fetch as text
    if (notePath.startsWith('http') || notePath.toLowerCase().endsWith('.html')) {
      setContent('')
      setLoading(false)
      setError(null)
      return
    }

    const loadNote = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await sidecarApi.readObsidianNote(notePath)
        setContent(res.content || '')
      } catch (err: any) {
        setError(err.message || 'Failed to read note')
      } finally {
        setLoading(false)
      }
    }

    loadNote()
  }, [notePath])

  if (!notePath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bento-panel border border-border/40 rounded-[12px] shadow-sm text-center h-full">
        <div className="p-4 bg-muted/20 rounded-full mb-4 border border-border/30">
          <FileText size={32} className="text-muted-foreground/40" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Note Active</h3>
        <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mt-1 max-w-[240px]">
          Start a curriculum in Oracle or open a note to read it here.
        </p>
      </div>
    )
  }

  // Treat full http URLs and .html paths as visual lesson frames
  const isHtml = notePath.startsWith('http') || notePath.toLowerCase().endsWith('.html')

  if (loading && !isHtml) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bento-panel border border-border/40 rounded-[12px] shadow-sm text-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-muted/20 border-t-muted-foreground animate-spin mb-4" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Note...</span>
      </div>
    )
  }

  if (error && !isHtml) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bento-panel border border-border/40 rounded-[12px] shadow-sm text-center h-full">
        <div className="p-4 bg-destructive/10 rounded-full mb-4 border border-destructive/20 text-destructive">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-destructive">Error Loading Note</h3>
        <p className="text-[10px] font-sans text-destructive/80 mt-1 max-w-sm">{error}</p>
      </div>
    )
  }

  const noteTitle = notePath.split('/').pop()?.replace(/\.(md|html)$/i, '').replace(/-/g, ' ').replace(/^\d+\s*/, '') || 'Note'

  // For HTML lessons: render completely borderless and seamless, blending with the panel
  if (isHtml) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full relative">
        {/* Minimal floating label — transparent, sits on top of the iframe */}
        <div className="absolute top-0 left-0 right-0 z-10 h-10 px-5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <Eye size={12} className="text-muted-foreground/40" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 truncate">{noteTitle}</span>
          </div>
        </div>
        <iframe
          title={noteTitle}
          src={notePath}
          sandbox="allow-scripts allow-forms"
          className="flex-1 w-full h-full border-none"
          style={{ background: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bento-panel border border-border/40 rounded-[12px] shadow-sm overflow-hidden h-full">
      <div className="h-14 border-b border-border/40 px-6 flex items-center justify-between shrink-0 bg-bento-card">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-muted-foreground/60" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{noteTitle}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        <AterMarkdown content={content} path={notePath} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
