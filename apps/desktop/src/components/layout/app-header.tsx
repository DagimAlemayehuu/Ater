import React from 'react'
import { ChevronLeft, ChevronRight, Activity, Search, PanelLeft, Minimize2, Maximize2, Save, X, Edit2, RefreshCw, Heart } from 'lucide-react'
import { useNavigation } from '@/context/navigation-context'
import { useHeader } from '@/context/header-context'
import { cn } from '@/lib/utils'
import { useLocation } from 'react-router-dom'

export function AppHeader() {
  const { goBack, goForward, canGoBack, canGoForward, history, currentIndex } = useNavigation()
  const { centerContent, rightContent } = useHeader()
  const location = useLocation()

  // Dynamic Breadcrumb Logic
  const renderBreadcrumbs = () => {
    const path = location.pathname
    const entry = history[currentIndex]
    
    let module = 'LifeOS'
    let subPath = ''

    if (path.startsWith('/obsidian') || path.startsWith('/note/')) {
      module = 'Knowledge Base'
      if (entry && entry.type === 'file') {
        subPath = entry.path.replace(/\.md$/, '').replace(/_/g, ' ')
      }
    } else if (path.startsWith('/academic')) {
      module = 'Academic Dashboard'
      const parts = path.split('/').filter(Boolean)
      if (parts.length > 1) subPath = parts.slice(1).join(' / ')
    } else if (path.startsWith('/practice')) {
      module = 'Practice Hub'
    } else if (path.startsWith('/agents')) {
      module = 'Agent Orchestrator'
    } else if (path.startsWith('/settings')) {
      module = 'System Settings'
    }

    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{module}</span>
          {subPath && <span className="text-[9px] text-muted-foreground/20 font-bold">/</span>}
        </div>
        {subPath && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground truncate max-w-[500px] font-mono leading-none">
            {subPath}
          </span>
        )}
      </div>
    )
  }

  return (
    <header className="h-12 w-full bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center shrink-0 z-40 sticky top-0 px-4 select-none gap-4">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-lg border border-border/50">
          <button 
            onClick={goBack}
            disabled={!canGoBack}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-md transition-all",
              canGoBack ? "text-foreground/60 hover:text-foreground hover:bg-background hover:shadow-sm" : "text-foreground/10 cursor-not-allowed"
            )}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={goForward}
            disabled={!canGoForward}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-md transition-all",
              canGoForward ? "text-foreground/60 hover:text-foreground hover:bg-background hover:shadow-sm" : "text-foreground/10 cursor-not-allowed"
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Center: Breadcrumbs & Meta - Flexible and scrollable/truncated */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        <div className="max-w-full flex flex-col items-center overflow-hidden">
          {renderBreadcrumbs()}
          {centerContent && <div className="mt-0.5 truncate max-w-full">{centerContent}</div>}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-1.5 shrink-0">
        {rightContent}
      </div>
    </header>
  )
}
