import { NavLink } from 'react-router-dom'
import { Settings, User, GraduationCap, Book, Library, BookOpenCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppSidebar() {

  const linkClass = (isActive: boolean) => cn(
    "relative p-2.5 transition-all rounded-[8px] flex items-center justify-center size-10",
    isActive 
      ? "text-foreground" 
      : "text-muted-foreground hover:text-foreground hover:bg-bento-item"
  );

  return (
    <aside 
      onMouseEnter={() => window.focus()}
      className="w-16 bg-bento-panel rounded-[12px] border border-border/40 flex flex-col items-center py-6 justify-between shrink-0 z-50 h-full shadow-sm"
    >
        <div className="flex flex-col gap-8 items-center w-full">
            {/* Empty Branding Space */}
            <div className="size-10 mb-2" />

            {/* Navigation Links */}
            <div className="flex flex-col gap-4 items-center w-full">
                <NavLink to="/agents" className={({ isActive }) => linkClass(isActive)} title="Ater" data-tour="sidebar-ater">
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-[-12px] top-0 w-[2px] h-10 bg-foreground" />}
                      <User className="size-5" strokeWidth={2.5} />
                    </>
                  )}
                </NavLink>
                <NavLink to="/academic" className={({ isActive }) => linkClass(isActive)} title="Academic Dashboard" data-tour="sidebar-academic">
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-[-12px] top-0 w-[2px] h-10 bg-foreground" />}
                      <GraduationCap className="size-5" strokeWidth={2.5} />
                    </>
                  )}
                </NavLink>
                <NavLink to="/teacher" className={({ isActive }) => linkClass(isActive)} title="Teacher" data-tour="sidebar-teacher">
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-[-12px] top-0 w-[2px] h-10 bg-foreground" />}
                      <BookOpenCheck className="size-5" strokeWidth={2.5} />
                    </>
                  )}
                </NavLink>
                <NavLink to="/obsidian" className={({ isActive }) => linkClass(isActive)} title="Knowledge Base" data-tour="sidebar-knowledge">
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-[-12px] top-0 w-[2px] h-10 bg-foreground" />}
                      <Book className="size-5" strokeWidth={2.5} />
                    </>
                  )}
                </NavLink>
                <NavLink to="/notebooks" className={({ isActive }) => linkClass(isActive)} title="NotebookLM" data-tour="sidebar-notebooks">
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-[-12px] top-0 w-[2px] h-10 bg-foreground" />}
                      <Library className="size-5" strokeWidth={2.5} />
                    </>
                  )}
                </NavLink>
            </div>
        </div>

        <div className="flex flex-col gap-4 items-center w-full">
            <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)} title="Settings" data-tour="sidebar-settings">
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-[-12px] top-0 w-[2px] h-10 bg-foreground" />}
                  <Settings className="size-5" strokeWidth={2.5} />
                </>
              )}
            </NavLink>
        </div>
    </aside>
  )
}
