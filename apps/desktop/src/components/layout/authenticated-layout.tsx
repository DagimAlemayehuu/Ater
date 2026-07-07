import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutProvider, useLayout } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { AppSidebar } from '@/components/layout/app-sidebar'
import React, { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen, Sun, Moon, ChevronLeft, ChevronRight, Calendar, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarContentProvider } from '@/context/sidebar-content-context'
import { useHeader } from '@/context/header-context'
import { useSecurityStore } from '@/context/securityStore'
import { useTheme } from '@/context/theme-provider'
import { useNavigation } from '@/context/navigation-context'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { isBetaMode } from '@/lib/appMode'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

function AuthenticatedLayoutContent({ children }: AuthenticatedLayoutProps) {
  const { isFullscreen } = useLayout()
  const { centerContent, rightContent } = useHeader()
  const creditBalance = useSecurityStore(state => state.creditBalance)
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { goBack, goForward, canGoBack, canGoForward } = useNavigation()
  const { timeLeft, setShowOverlay, isActive: pomodoroActive } = usePomodoroStore()

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
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans p-3 gap-3 relative">
      {!isFullscreen && (
        <header className="h-14 bg-bento-panel border border-border/40 rounded-[12px] shadow-sm flex items-center justify-between px-4 py-3 shrink-0">
          {/* Left Section: Sidebar Collapse Toggle, Global Nav & Pomodoro */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-bento-item text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Hide Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            {/* Global History Navigation (Back/Forward) */}
            <div className="flex items-center gap-0.5 border-l border-border/20 pl-3">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-[6px] transition-all",
                  canGoBack
                    ? "text-muted-foreground hover:text-foreground hover:bg-bento-item/50 cursor-pointer"
                    : "text-muted-foreground/20 cursor-not-allowed"
                )}
                title="Back"
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              <button
                onClick={goForward}
                disabled={!canGoForward}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-[6px] transition-all",
                  canGoForward
                    ? "text-muted-foreground hover:text-foreground hover:bg-bento-item/50 cursor-pointer"
                    : "text-muted-foreground/20 cursor-not-allowed"
                )}
                title="Forward"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Pomodoro Focus Timer Display */}
            <button
              onClick={() => setShowOverlay(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-[6px] border border-border/40 px-2 h-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-bento-item transition-all font-sans cursor-pointer",
                pomodoroActive && "border-foreground/20 text-foreground bg-bento-item"
              )}
              title="Focus Session Timer"
            >
              <Timer size={12} className={cn("text-muted-foreground/40 shrink-0", pomodoroActive && "text-foreground")} />
              <span className="tabular-nums font-mono">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </button>
            
            {/* Center Content Slot */}
            {centerContent && (
              <div className="hidden md:flex items-center gap-2 border-l border-border/20 pl-3">
                {centerContent}
              </div>
            )}
          </div>

          {/* Right Section: Page Header Actions, Calendar, Theme Switcher & Minimal Credits */}
          <div className="flex items-center gap-4">
            {/* Right Content Slot */}
            {rightContent && (
              <div className="flex items-center gap-2 border-r border-border/20 pr-3">
                {rightContent}
              </div>
            )}

            {/* Calendar Button */}
            <button
              onClick={() => navigate('/calendar')}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-[6px] transition-all cursor-pointer",
                location.pathname === '/calendar'
                  ? "bg-bento-item text-foreground border border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-bento-item/50"
              )}
              title="Academic Calendar"
            >
              <Calendar size={16} strokeWidth={2} />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-bento-item text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            
            {/* Minimal Credits Display */}
            <div className="text-[11px] font-bold select-none text-muted-foreground pr-1">
              Credits: <span className="font-extrabold text-foreground">{isBetaMode() ? '∞' : (creditBalance >= 99999999 ? 'UNLIMITED' : creditBalance)}</span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Layout */}
      <div className={cn(
        "flex-1 flex w-full overflow-hidden",
        isSidebarCollapsed || isFullscreen ? "gap-0" : "gap-3"
      )}>
        {!isFullscreen && <AppSidebar />}
        <main id="content" className="flex-1 flex flex-col overflow-hidden relative gap-3">
          <div className="flex-1 overflow-hidden relative">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
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
