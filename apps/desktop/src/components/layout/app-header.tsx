import React from 'react'
import { ChevronLeft, ChevronRight, Activity, Search, PanelLeft, Minimize2, Maximize2, Save, X, RefreshCw, Heart } from 'lucide-react'
import { useNavigation } from '@/context/navigation-context'
import { useHeader } from '@/context/header-context'
import { cn } from '@/lib/utils'
import { useLocation } from 'react-router-dom'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { useConfig } from '@/lib/ConfigContext'
import { Timer } from 'lucide-react'

export function AppHeader() {
  const { goBack, goForward, canGoBack, canGoForward, history, currentIndex } = useNavigation()
  const { centerContent, rightContent } = useHeader()
  const { timeLeft, setShowOverlay, isActive: pomodoroActive } = usePomodoroStore()
  const { config } = useConfig()
  const location = useLocation()

  // Dynamic Breadcrumb Logic
  const renderBreadcrumbs = () => {
    const entry = history[currentIndex]
    if (!entry || typeof entry.path !== 'string') return null

    // Parse path and search from history entry
    const [entryPath, entrySearch] = entry.path.split('?')
    const searchParams = new URLSearchParams(entrySearch || '')
    
    let module = 'Ater'
    let subPath = ''

    if (entryPath.startsWith('/obsidian') || entryPath.startsWith('/note/') || entry.type === 'file') {
      module = 'Knowledge Base'
      if (entry.type === 'file') {
        const parts = entryPath.split('/')
        const fileName = parts[parts.length - 1]
        subPath = fileName.replace(/\.(md|pdf)$/, '').replace(/_/g, ' ')
      }
    } else if (entryPath.startsWith('/academic')) {
      module = 'Academic Dashboard'
      const tab = searchParams.get('tab')
      if (tab) subPath = tab.charAt(0) + tab.slice(1).toLowerCase()
    } else if (entryPath.startsWith('/practice')) {
      module = 'Practice Hub'
      const view = searchParams.get('view')
      if (view) subPath = view.charAt(0) + view.slice(1).toLowerCase()
    } else if (entryPath.startsWith('/agents')) {
      module = 'Agent Orchestrator'
    } else if (entryPath.startsWith('/settings')) {
      module = 'System Settings'
      const tab = searchParams.get('tab')
      if (tab) subPath = tab.charAt(0) + tab.slice(1).toLowerCase()
    }

    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{module}</span>
          {subPath && <span className="text-[9px] text-muted-foreground font-bold">/</span>}
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
    <header 
      onMouseEnter={() => window.focus()}
      className="relative h-12 w-full bg-background border-b border-border/40 flex items-center shrink-0 z-40 sticky top-0 px-4 select-none"
    >
      {/* Left: Navigation */}
      <div className="flex items-center gap-2 shrink-0 z-10">
        <div className="flex items-center gap-1 bg-muted/20 p-0.5 rounded-none border border-border/40 shadow-inner">
          <button 
            onClick={goBack}
            disabled={!canGoBack}
            title="Back (Cmd+[)"
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-none transition-none",
              canGoBack 
                ? "text-foreground bg-background hover:bg-foreground/5 hover:border-foreground/40 border-border shadow-sm" 
                : "text-muted-foreground/10 bg-transparent border-transparent cursor-default"
            )}
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <button 
            onClick={() => goForward()}
            disabled={!canGoForward}
            title="Forward (Cmd+])"
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-none transition-none",
              canGoForward 
                ? "text-foreground bg-background hover:bg-foreground/5 hover:border-foreground/40 border-border shadow-sm" 
                : "text-muted-foreground/10 bg-transparent border-transparent cursor-default"
            )}
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Timer Display (Academic Style) */}
        <button 
          onClick={() => setShowOverlay(true)}
          className={cn(
            "ml-3 px-3 h-8 flex items-center justify-center rounded-none border border-border/60 transition-none text-[10px] font-black tabular-nums shadow-sm bg-background/50",
            pomodoroActive ? "bg-primary/10 text-primary border-primary/20 ring-1 ring-primary/10" : "hover:border-foreground/40"
          )}
        >
          <Timer size={12} className={cn("mr-1.5 opacity-50", pomodoroActive && "text-primary opacity-100")} />
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </button>
      </div>

      {/* Center: Breadcrumbs & Meta - Absolute Centered relative to window */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-40">
        <div className="max-w-full flex flex-col items-center overflow-hidden pointer-events-auto select-none">
          {renderBreadcrumbs()}
          {centerContent && <div className="mt-0.5 truncate max-w-full">{centerContent}</div>}
        </div>
      </div>

      {/* Spacer to keep flex layout valid for right content */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-3 shrink-0 z-10">
        <div className="flex flex-col items-end mr-2">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 leading-none mb-0.5">Authorized User</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 leading-none">{config?.displayName || 'Ater User'}</span>
        </div>
        <div className="h-4 w-px bg-border/40 mx-1" />
        {rightContent}
      </div>
    </header>
  )
}
