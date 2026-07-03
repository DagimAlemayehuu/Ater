import React, { useState, useEffect } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import { useNavigation } from '@/context/navigation-context'
import { useHeader } from '@/context/header-context'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { history, currentIndex } = useNavigation()
  const { centerContent, rightContent } = useHeader()

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('ater_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('ater_sidebar_collapsed');
        setIsSidebarCollapsed(saved ? JSON.parse(saved) : false);
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ater-sidebar-toggle', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ater-sidebar-toggle', handleStorageChange);
    };
  }, []);

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    localStorage.setItem('ater_sidebar_collapsed', JSON.stringify(next));
    setIsSidebarCollapsed(next);
    window.dispatchEvent(new Event('ater-sidebar-toggle'));
  };

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
        const parts = entryPath.split(/[/\\]/)
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
    } else if (entryPath.startsWith('/notebooks')) {
      module = 'NotebookLM'
      const id = searchParams.get('id')
      if (id) subPath = 'Notebook Workspace'
    } else if (entryPath.startsWith('/agents')) {
      module = 'Ater'
    } else if (entryPath.startsWith('/settings')) {
      module = 'System Settings'
      const tab = searchParams.get('tab')
      if (tab) subPath = tab.charAt(0) + tab.slice(1).toLowerCase()
    }

    return (
      <div className="flex flex-col items-center gap-0.5 font-sans">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{module}</span>
          {subPath && <span className="text-[9px] text-muted-foreground font-bold">/</span>}
        </div>
        {subPath && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground truncate max-w-[500px] leading-none">
            {subPath}
          </span>
        )}
      </div>
    )
  }

  return (
    <header 
      onMouseEnter={() => window.focus()}
      className="relative h-14 bg-bento-panel rounded-[12px] border border-border/40 flex items-center px-4 justify-between shrink-0 z-40 select-none shadow-sm"
    >
      {/* Left: Navigation */}
      <div className="flex items-center gap-3 shrink-0 z-10">
        {isSidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-bento-item transition-colors"
            title="Expand Sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
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
