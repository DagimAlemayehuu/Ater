import { useState, useEffect } from 'react'
import { NavLink, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import {
  User, GraduationCap, Book, Library, BookOpenCheck,
  Plus, ChevronLeft, ChevronRight, Timer,
  Calendar, Settings, Sun, Moon, Zap
} from 'lucide-react'
import { useNavigation } from '@/context/navigation-context'
import { usePomodoroStore } from '@/lib/pomodoroStore'
import { ThemeSwitch } from '@/components/theme-switch'
import { useSecurityStore } from '@/context/securityStore'
import { useTheme } from '@/context/theme-provider'
import { cn } from '@/lib/utils'
import { useSidebarContent } from '@/context/sidebar-content-context'

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { goBack, goForward, canGoBack, canGoForward } = useNavigation();
  const { timeLeft, setShowOverlay, isActive: pomodoroActive } = usePomodoroStore();
  const creditBalance = useSecurityStore(state => state.creditBalance);
  const { theme, setTheme } = useTheme();
  const { sidebarContent } = useSidebarContent();

  // Collapsed state synced with localStorage and global event
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
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
        setIsCollapsed(saved ? JSON.parse(saved) : false);
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ater-sidebar-toggle', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ater-sidebar-toggle', handleStorageChange);
    };
  }, []);

  const handleNewChatClick = () => {
    navigate('/agents?tab=ater');
    setTimeout(() => {
      window.dispatchEvent(new Event('ater-new-chat'));
    }, 50);
  };

  const handleHistoryClick = () => {
    navigate('/agents?tab=ater');
    setTimeout(() => {
      window.dispatchEvent(new Event('ater-toggle-history'));
    }, 50);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Determine active states for query-param dependent links
  const isAgentsActive = location.pathname === '/agents';
  const isChatActive = isAgentsActive && (searchParams.get('tab') !== 'pipeline');
  const isPipelineActive = isAgentsActive && searchParams.get('tab') === 'pipeline';

  const wideLinkClass = (isActive: boolean) => cn(
    "w-full flex items-center gap-3 px-3 py-2 rounded-[8px] transition-all text-[11px] font-bold text-left select-none",
    isActive
      ? "bg-bento-item text-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-bento-item/30"
  );

  return (
    <aside
      onMouseEnter={() => window.focus()}
      className={cn(
        "bg-bento-panel rounded-[12px] flex flex-col justify-between shrink-0 z-40 h-full shadow-sm overflow-hidden transition-[width,padding,border-color] duration-75 ease-out",
        isCollapsed
          ? "w-0 p-0 border-0 pointer-events-none"
          : "w-60 py-4 px-3 border border-border/40 pointer-events-auto"
      )}
    >
      <div className="flex flex-col w-full min-h-0 flex-1">
        {/* Header controls (Toggle & Back/Forward Navigation & Calendar & Pomodoro Timer) */}
        <div className="flex items-center justify-between px-1 h-10 w-full mb-4 shrink-0">
          <div className="flex items-center gap-1 pl-9">
            <div className="flex items-center gap-0.5">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-[6px] transition-all",
                  canGoBack
                    ? "text-muted-foreground hover:text-foreground hover:bg-bento-item/50"
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
                    ? "text-muted-foreground hover:text-foreground hover:bg-bento-item/50"
                    : "text-muted-foreground/20 cursor-not-allowed"
                )}
                title="Forward"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>

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
          </div>

          {/* Pomodoro Timer Display */}
          <button
            onClick={() => setShowOverlay(true)}
            className={cn(
              "flex items-center gap-1 rounded-[6px] border border-border/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-bento-item transition-all h-8 font-sans",
              pomodoroActive && "border-foreground/20 text-foreground bg-bento-item"
            )}
            title="Focus Session Timer"
          >
            <Timer size={12} className={cn("text-muted-foreground/40 shrink-0", pomodoroActive && "text-foreground")} />
            <span className="tabular-nums">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
          </button>
        </div>

        {/* CTA Button: + New Conversation */}
        <button
          onClick={handleNewChatClick}
          className="w-full h-9 border border-border/60 rounded-[8px] hover:border-foreground/30 hover:bg-bento-item/30 flex items-center justify-center gap-2 text-[11px] font-bold tracking-wide transition-all text-foreground shrink-0 mb-4"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Conversation
        </button>

        {/* Primary Page Navigation list - always visible, never scrolls away */}
        <div className="flex flex-col gap-1 w-full shrink-0 pr-1">

          {/* Ater Chat Route */}
          <div className="flex flex-col w-full">
            <NavLink
              to="/agents"
              className={({ isActive }) => wideLinkClass(isActive && !isPipelineActive)}
            >
              <User size={15} className="shrink-0 text-muted-foreground" />
              <span>Ater</span>
            </NavLink>
          </div>

          <NavLink
            to="/academic"
            className={({ isActive }) => wideLinkClass(isActive)}
          >
            <GraduationCap size={15} className="shrink-0 text-muted-foreground" />
            <span>Academic Dashboard</span>
          </NavLink>



          <NavLink
            to="/obsidian"
            className={({ isActive }) => wideLinkClass(isActive)}
          >
            <Book size={15} className="shrink-0 text-muted-foreground" />
            <span>Knowledge Base</span>
          </NavLink>

          <NavLink
            to="/notebooks"
            className={({ isActive }) => wideLinkClass(isActive)}
          >
            <Library size={15} className="shrink-0 text-muted-foreground" />
            <span>NotebookLM</span>
          </NavLink>

          <NavLink
            to="/practice"
            className={({ isActive }) => wideLinkClass(isActive)}
          >
            <BookOpenCheck size={15} className="shrink-0 text-muted-foreground" />
            <span>Practice Hub</span>
          </NavLink>
        </div>

        {sidebarContent && (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-border/20 pt-3 pr-1">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* Footer Area with Credit System, Theme Toggle, and Settings */}
      <div className="flex flex-col gap-1 w-full shrink-0 border-t border-border/20 pt-3 mt-auto">
        {/* Credits */}
        <div className="w-full px-3 py-2 text-[11px] font-bold text-left select-none text-muted-foreground">
          <span>Credits: <span className="font-extrabold text-foreground">{creditBalance >= 99999999 ? 'UNLIMITED' : creditBalance}</span></span>
        </div>

        {/* Theme Toggle (Row design) */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[8px] transition-all text-[11px] font-bold text-left select-none text-muted-foreground hover:text-foreground hover:bg-bento-item/30"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="size-4 shrink-0 text-muted-foreground" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="size-4 shrink-0 text-muted-foreground" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Settings Link */}
        <NavLink
          to="/settings"
          className={({ isActive }) => wideLinkClass(isActive)}
        >
          <Settings className="size-4 shrink-0 text-muted-foreground" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
