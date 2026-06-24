import React, { useState, useEffect, useRef } from 'react'
import { AterMarkdown } from '@/components/obsidian/MarkdownViewer'
import { FileText, Eye, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { sidecarApi } from '@/lib/sidecarApi'
import { toast } from 'sonner'
import { parseFrontmatter } from '@/lib/markdownHelper'

interface NoteCanvasProps {
  notePath: string | null;
  onNavigate?: (page: string) => void;
  onClose?: () => void;
}

export function NoteCanvas({ notePath, onNavigate, onClose }: NoteCanvasProps) {
  const [content, setContent] = useState<string>('')
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'lesson' | 'markdown'>('markdown')
  const [hasCompanionHtml, setHasCompanionHtml] = useState<boolean>(false)
  const [navigationSequence, setNavigationSequence] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!notePath) {
      setContent('')
      setHtmlContent(null)
      setHasCompanionHtml(false)
      setNavigationSequence([])
      setCurrentIndex(-1)
      setViewMode('markdown')
      return
    }

    // If it's a full URL (lesson preview) or a .html path, render via iframe — don't fetch as text
    if (notePath.startsWith('http') || notePath.toLowerCase().endsWith('.html')) {
      setContent('')
      setHtmlContent(null)
      setHasCompanionHtml(false)
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
      setHtmlContent(null)
      setHasCompanionHtml(false)
      setViewMode('markdown')
      
      try {
        let resolvedPath = notePath
        // Resolve pageName to full relative path if it doesn't end with a typical extension and isn't a URL
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
        
        // Resolve parent folder path
        const parts = resolvedPath.split(/[/\\]/);
        parts.pop();
        const parentDir = parts.join('/');
        
        // Check for companion html
        const simple = metadata.simple || metadata.lesson_variants?.simple;
        const deep = metadata.deep || metadata.lesson_variants?.deep;
        const cram = metadata.cram || metadata.lesson_variants?.cram;
        const exam = metadata.exam || metadata.lesson_variants?.exam;
        
        const relativeHtmlPath = simple || deep || cram || exam;
        if (typeof relativeHtmlPath === 'string') {
          const htmlPath = parentDir ? `${parentDir}/${relativeHtmlPath}` : relativeHtmlPath;
          try {
            const htmlRes = await sidecarApi.readObsidianNote(htmlPath);
            if (htmlRes && htmlRes.content) {
              setHtmlContent(htmlRes.content);
              setHasCompanionHtml(true);
              setViewMode('lesson');
            }
          } catch (htmlErr) {
            console.warn('Failed to load companion HTML, defaulting to Markdown:', htmlErr);
          }
        }
        
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
        
        // Fallback to sorted sibling files if no hub was found or loaded
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

  // Keep latest handlers fresh for the message listener
  const nextHandlerRef = useRef(handleNext);
  useEffect(() => {
    nextHandlerRef.current = handleNext;
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEXT_NOTE') {
        nextHandlerRef.current();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

  if (isHtml) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full relative">
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
        
        {hasCompanionHtml && (
          <div className="flex items-center bg-muted/10 border border-border/30 rounded-lg p-0.5 select-none text-[9px] font-black uppercase tracking-widest">
            <button
              onClick={() => setViewMode('lesson')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'lesson'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Interactive Lesson
            </button>
            <button
              onClick={() => setViewMode('markdown')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'markdown'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Markdown
            </button>
          </div>
        )}
      </div>

      {viewMode === 'lesson' && htmlContent ? (
        <div className="flex-1 min-h-0 overflow-hidden relative bg-bento-panel">
          <iframe
            title={noteTitle}
            srcDoc={htmlContent}
            sandbox="allow-scripts allow-forms"
            className="w-full h-full border-none bg-transparent"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <AterMarkdown content={content} path={notePath} onNavigate={onNavigate} />
        </div>
      )}

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
  )
}

