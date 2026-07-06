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
            to="/practice"
            className={({ isActive }) => wideLinkClass(isActive)}
          >
            <BookOpenCheck size={15} className="shrink-0 text-muted-foreground" />
            <span>Practice</span>
          </NavLink>
        </div>

        {sidebarContent && (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-border/20 pt-3 pr-1">
            {sidebarContent}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 w-full shrink-0 border-t border-border/20 pt-3 mt-auto">
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
