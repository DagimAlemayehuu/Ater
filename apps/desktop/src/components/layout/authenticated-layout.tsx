import { Outlet } from 'react-router-dom'
import { LayoutProvider, useLayout } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { AppSidebar } from '@/components/layout/app-sidebar'
import React, { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarContentProvider } from '@/context/sidebar-content-context'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

function AuthenticatedLayoutContent({ children }: AuthenticatedLayoutProps) {
  const { isFullscreen } = useLayout()

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

  return (
    <div className={cn(
      "flex h-screen w-full bg-background overflow-hidden font-sans p-3 relative",
      isSidebarCollapsed || isFullscreen ? "gap-0" : "gap-3"
    )}>
      {!isFullscreen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-[28px] left-[28px] z-[60] w-8 h-8 flex items-center justify-center rounded-[6px] bg-bento-panel border border-border/40 text-muted-foreground hover:text-foreground hover:bg-bento-item shadow-sm transition-colors duration-75"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Hide Sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      )}
      {!isFullscreen && <AppSidebar />}
      <main id="content" className="flex-1 flex flex-col overflow-hidden relative gap-3">
        <div className="flex-1 overflow-hidden relative">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarContentProvider>
          <AuthenticatedLayoutContent>
            {children}
          </AuthenticatedLayoutContent>
        </SidebarContentProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
