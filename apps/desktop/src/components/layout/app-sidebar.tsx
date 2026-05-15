import { NavLink, useLocation } from 'react-router-dom'
import { FileText, Users, Settings, GraduationCap, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeSwitch } from '@/components/theme-switch'

export function AppSidebar() {
  const location = useLocation()
  const isOnboarding = location.pathname === '/onboarding'

  return (
    <aside className="w-12 bg-background border-r border-border flex flex-col items-center py-6 shrink-0 z-50 h-full">
        {/* Navigation Links */}
        <div className="flex flex-col gap-6 flex-1 items-center">
            <NavLink 
                to="/academic"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-none transition-none",
                  isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"
                )} 
                title="Academic Dashboard"
            >
              <GraduationCap className="size-5" strokeWidth={2} />
            </NavLink>
            <NavLink 
                to="/obsidian"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-none transition-none",
                  isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"
                )} 
                title="Knowledge Base"
            >
              <FileText className="size-5" strokeWidth={2} />
            </NavLink>
            <NavLink 
                to="/agents"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-none transition-none",
                  isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"
                )} 
                title="AI Agents"
            >
              <Users className="size-5" strokeWidth={2} />
            </NavLink>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-6 mt-auto items-center mb-6 w-full">
            <ThemeSwitch />
            {!isOnboarding && (
              <NavLink 
                  to="/onboarding"
                  className={({ isActive }) => cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-none transition-none",
                    isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"
                  )} 
                  title="System Setup"
              >
                <Zap className="size-5" strokeWidth={2} />
              </NavLink>
            )}
            <NavLink 
                to="/settings"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-none transition-none",
                  isActive ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"
                )} 
                title="Settings"
            >
              <Settings className="size-5" strokeWidth={2} />
            </NavLink>
        </div>
    </aside>
  )
}
