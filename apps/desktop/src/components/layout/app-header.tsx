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
      className="relative h-14 bg-bento-bg flex items-center px-4 justify-between shrink-0 z-40 sticky top-0 select-none border-b border-border/40"
    >
      {/* Left: Navigation */}
      <div className="flex items-center gap-3 shrink-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={goBack}
            disabled={!canGoBack}
            title="Back (Cmd+[)"
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors",
              canGoBack 
                ? "text-[#a1a1aa] hover:text-white hover:bg-bento-item" 
                : "text-[#a1a1aa]/20 cursor-not-allowed"
            )}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>

          <button 
            onClick={() => goForward()}
            disabled={!canGoForward}
            title="Forward (Cmd+])"
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors",
              canGoForward 
                ? "text-[#a1a1aa] hover:text-white hover:bg-bento-item" 
                : "text-[#a1a1aa]/20 cursor-not-allowed"
            )}
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Timer Display (Academic Style) */}
        <button 
          onClick={() => setShowOverlay(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-[8px] border border-[#242426] px-3 py-1 text-xs font-medium text-white bg-bento-item shadow-sm h-8",
            pomodoroActive && "border-white/20"
          )}
        >
          <Timer size={14} className={cn("text-[#a1a1aa] shrink-0", pomodoroActive && "text-white")} />
          <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
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
      <div className="flex items-center justify-end gap-2 shrink-0 z-10">
        {rightContent}
      </div>
    </header>
  )
}
