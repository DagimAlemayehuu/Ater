import { NavLink, useLocation } from 'react-router-dom'
import { FileText, Users, Settings, GraduationCap, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeSwitch } from '@/components/theme-switch'

export function AppSidebar() {
  const location = useLocation()
  const isOnboarding = location.pathname === '/onboarding'

  const linkClass = (isActive: boolean) => cn(
    "relative p-2.5 transition-all rounded-[4px] flex items-center justify-center size-10",
    isActive 
      ? "text-white bg-[#232326]" 
      : "text-[#a1a1aa] hover:text-white hover:bg-[#232326]"
  );

  return (
    <aside 
      onMouseEnter={() => window.focus()}
      className="w-16 bg-transparent flex flex-col items-center py-6 justify-between shrink-0 z-50 h-full"
    >
        {/* Navigation Links */}
        <div className="flex flex-col gap-4 items-center w-full">
            <NavLink to="/oracle" className={({ isActive }) => linkClass(isActive)} title="Ater">
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />}
                  <Zap className="size-5" strokeWidth={1.5} />
                </>
              )}
            </NavLink>
            <NavLink to="/academic" className={({ isActive }) => linkClass(isActive)} title="Academic Dashboard">
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />}
                  <GraduationCap className="size-5" strokeWidth={1.5} />
                </>
              )}
            </NavLink>
            <NavLink to="/obsidian" className={({ isActive }) => linkClass(isActive)} title="Knowledge Base">
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />}
                  <FileText className="size-5" strokeWidth={1.5} />
                </>
              )}
            </NavLink>
            <NavLink to="/agents" className={({ isActive }) => linkClass(isActive)} title="AI Agents">
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />}
                  <Users className="size-5" strokeWidth={1.5} />
                </>
              )}
            </NavLink>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-4 items-center w-full">
            <div className="p-2.5 text-[#a1a1aa] hover:text-white transition-all rounded-[4px] hover:bg-[#232326] cursor-pointer">
              <ThemeSwitch />
            </div>
            <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)} title="Settings">
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />}
                  <Settings className="size-5" strokeWidth={1.5} />
                </>
              )}
            </NavLink>
        </div>
    </aside>
  )
}
