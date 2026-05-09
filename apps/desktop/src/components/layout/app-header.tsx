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
      const search = new URLSearchParams(location.search)
      const tab = search.get('tab')
      if (tab) subPath = tab.charAt(0) + tab.slice(1).toLowerCase()
    } else if (path.startsWith('/practice')) {
      module = 'Practice Hub'
      const search = new URLSearchParams(location.search)
      const view = search.get('view')
      if (view) subPath = view.charAt(0) + view.slice(1).toLowerCase()
    } else if (path.startsWith('/agents')) {
      module = 'Agent Orchestrator'
    } else if (path.startsWith('/settings')) {
      module = 'System Settings'
      const search = new URLSearchParams(location.search)
      const tab = search.get('tab')
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
    <header className="relative h-12 w-full bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center shrink-0 z-40 sticky top-0 px-4 select-none">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2.5 shrink-0 z-10">
        <button 
          onClick={goBack}
          disabled={!canGoBack}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-md border border-border/40 transition-all",
            canGoBack ? "text-foreground bg-background hover:border-foreground/40 shadow-sm" : "text-foreground/5 opacity-20 cursor-not-allowed"
          )}
          title="Go Back"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          onClick={goForward}
          disabled={!canGoForward}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-md border border-border/40 transition-all",
            canGoForward ? "text-foreground bg-background hover:border-foreground/40 shadow-sm" : "text-foreground/5 opacity-20 cursor-not-allowed"
          )}
          title="Go Forward"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Center: Breadcrumbs & Meta - Absolute Centered relative to window */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-40">
        <div className="max-w-full flex flex-col items-center overflow-hidden pointer-events-auto">
          {renderBreadcrumbs()}
          {centerContent && <div className="mt-0.5 truncate max-w-full">{centerContent}</div>}
        </div>
      </div>

      {/* Spacer to keep flex layout valid for right content */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 z-10">
        {rightContent}
      </div>
    </header>
  )
}
