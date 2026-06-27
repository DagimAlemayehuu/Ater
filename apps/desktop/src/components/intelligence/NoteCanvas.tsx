import React, { useState, useEffect, useRef } from 'react'
import { AterMarkdown } from '@/components/obsidian/MarkdownViewer'
import { FileText, Eye, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, Dumbbell, BookOpen } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { toast } from 'sonner'
import MiniPracticeUI from '@/components/MiniPracticeUI'

interface NoteCanvasProps {
  notePath: string | null;
  onNavigate?: (page: string) => void;
  onClose?: () => void;
}

export function NoteCanvas({ notePath, onNavigate, onClose }: NoteCanvasProps) {
  const [content, setContent] = useState<string>('')
  const [questions, setQuestions] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'markdown' | 'practice'>('markdown')
  const [navigationSequence, setNavigationSequence] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!notePath) {
      setContent('')
      setQuestions([])
      setNavigationSequence([])
      setCurrentIndex(-1)
      setViewMode('markdown')
      return
    }

    // If it's a full URL or .html, it shouldn't be loaded directly as Markdown
    if (notePath.startsWith('http') || notePath.toLowerCase().endsWith('.html')) {
      setContent('')
      setQuestions([])
      setNavigationSequence([])
      setCurrentIndex(-1)
      setViewMode('markdown')
      setLoading(false)
      setError(null)
      return
    }

    const loadNote = async () => {
      setLoading(true)
      setError(null)
      setQuestions([])
      setViewMode('markdown')
      
      try {
        let resolvedPath = notePath
        if (!notePath.toLowerCase().endsWith('.md') && !notePath.toLowerCase().endsWith('.html') && !notePath.startsWith('http')) {
          const searchRes = await sidecarApi.findVaultPage(notePath)
          if (searchRes.found && searchRes.path) {
            resolvedPath = searchRes.path
          } else {
            throw new Error(`Note "${notePath}" could not be found in the vault.`)
          }
        }
        
        const res = await sidecarApi.readObsidianNote(resolvedPath)
        const noteText = res.content || ''
        setContent(noteText)
        
        const metadata = res.metadata || {}
        
        // Parse interactive-quiz block
        const quizMatch = noteText.match(/```interactive-quiz\s*([\s\S]*?)```/);
        if (quizMatch) {
          try {
            const parsedQs = JSON.parse(quizMatch[1].trim());
            if (Array.isArray(parsedQs)) {
              setQuestions(parsedQs);
            }
          } catch (e) {
            console.warn('Failed to parse quiz questions:', e);
          }
        }
        
        // Resolve parent folder path
        const parts = resolvedPath.split(/[/\\]/);
        parts.pop();
        const parentDir = parts.join('/');
        
        // Build navigation sequence
        let sequence: string[] = [];
        const hubName = metadata.hub ? String(metadata.hub).replace(/[\[\]]/g, '').trim() : null;
        if (hubName) {
          try {
            const hubRes = await sidecarApi.findVaultPage(hubName);
            if (hubRes.found && hubRes.path) {
              const hubNote = await sidecarApi.readObsidianNote(hubRes.path);
              const wikilinkRegex = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
              let match;
              const links: string[] = [];
              while ((match = wikilinkRegex.exec(hubNote.content || '')) !== null) {
                links.push(match[1].trim());
              }
              sequence = links.filter(link => {
                const isHub = link.toLowerCase() === hubName.toLowerCase();
                return !isHub;
              });
            }
          } catch (hubErr) {
            console.warn('Failed to load curriculum sequence from hub:', hubErr);
          }
        }
        
        // Fallback to sorted sibling files
        if (sequence.length === 0) {
          try {
            const filesRes = await sidecarApi.listObsidianFiles();
            const siblings = filesRes.files
              .filter((f: any) => {
                if (f.is_dir) return false;
                const fPath = f.path.replace(/\\/g, '/');
                const fParent = fPath.split('/').slice(0, -1).join('/');
                return fParent === parentDir && f.name.endsWith('.md');
              })
              .sort((a: any, b: any) => {
                const aIsChapter = a.name.toLowerCase().startsWith('chapter');
                const bIsChapter = b.name.toLowerCase().startsWith('chapter');
                if (aIsChapter && !bIsChapter) return -1;
                if (!aIsChapter && bIsChapter) return 1;
                return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
              })
              .map((f: any) => f.path);
            
            sequence = siblings;
          } catch (filesErr) {
            console.warn('Failed to load sibling fallback sequence:', filesErr);
          }
        }
        
        setNavigationSequence(sequence);
        
        // Determine active index in sequence
        const activeName = resolvedPath.split(/[/\\]/).pop()?.replace(/\.(md|html)$/i, '') || '';
        const normActive = activeName.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').trim();
        
        const idx = sequence.findIndex(link => {
          const linkName = link.split(/[/\\]/).pop()?.replace(/\.(md|html)$/i, '') || link;
          const normLink = linkName.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').trim();
          return normLink === normActive;
        });
        setCurrentIndex(idx);

      } catch (err: any) {
        setError(err.message || 'Failed to read note')
      } finally {
        setLoading(false)
      }
    }

    loadNote()
  }, [notePath])

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < navigationSequence.length - 1) {
      const nextPage = navigationSequence[currentIndex + 1];
      if (onNavigate) {
        onNavigate(nextPage);
      }
    } else if (currentIndex === navigationSequence.length - 1) {
      toast.success("Curriculum completed successfully!");
      if (onClose) {
        onClose();
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevPage = navigationSequence[currentIndex - 1];
      if (onNavigate) {
        onNavigate(prevPage);
      }
    }
  };

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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bento-panel border border-border/40 rounded-[12px] shadow-sm text-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-muted/20 border-t-muted-foreground animate-spin mb-4" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Note...</span>
      </div>
    )
  }

  if (error) {
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
  const displayTitle = noteTitle.charAt(0).toUpperCase() + noteTitle.slice(1);

  // Clean frontmatter and interactive-quiz block
  const cleanedContent = content
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/```interactive-quiz[\s\S]*?```/g, '')
    .trim();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bento-panel border border-border/40 rounded-[12px] shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="h-14 border-b border-border/40 px-6 flex items-center justify-between shrink-0 bg-bento-card">
        <div className="flex items-center gap-3 min-w-0">
          {viewMode === 'practice' && (
            <button
              onClick={() => setViewMode('markdown')}
              className="size-8 flex items-center justify-center rounded-[6px] border border-border/40 bg-muted/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Back to lesson"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            {viewMode === 'practice' ? (
              <Dumbbell size={16} className="text-primary shrink-0" />
            ) : (
              <BookOpen size={16} className="text-muted-foreground/60 shrink-0" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground truncate">
              {viewMode === 'practice' ? `Practice: ${displayTitle}` : displayTitle}
            </span>
          </div>
        </div>

        {viewMode === 'markdown' && questions.length > 0 && (
          <button
            onClick={() => setViewMode('practice')}
            className="h-8 px-4 flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-[8px] text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <Dumbbell size={12} />
            Start Practice
          </button>
        )}
      </div>

      {/* Body */}
      {viewMode === 'practice' && questions.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6">
          <MiniPracticeUI
            question={questions}
            notePath={notePath}
            onComplete={() => setViewMode('markdown')}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <AterMarkdown content={cleanedContent} path={notePath} onNavigate={onNavigate} />
            </div>
            
            {questions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border/40">
                <button
                  onClick={() => setViewMode('practice')}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-[8px] hover:bg-primary/90 transition-colors shadow-md shadow-primary/10"
                >
                  <Dumbbell size={14} />
                  Start Practice Challenge — {questions.length} Question{questions.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          {navigationSequence.length > 0 && currentIndex !== -1 && (
            <div className="h-14 border-t border-border/40 px-6 flex items-center justify-between shrink-0 bg-bento-card">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-[6px] border border-border/40 hover:bg-muted/30 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={12} />
                Back
              </button>
              
              <span className="text-[9px] font-mono font-bold text-muted-foreground/50 uppercase tracking-[0.25em]">
                Step {currentIndex + 1} of {navigationSequence.length}
              </span>
              
              {currentIndex === navigationSequence.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-[6px] border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 animate-pulse"
                >
                  <CheckCircle2 size={12} />
                  Complete
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-[6px] border border-border/40 hover:bg-muted/30 text-foreground"
                >
                  Next
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
