import { NavLink } from 'react-router-dom'
import { FileText, Users, Settings, GraduationCap, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeSwitch } from '@/components/theme-switch'

export function AppSidebar() {
  return (
    <aside className="w-12 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 shrink-0 z-50 h-full shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        {/* Navigation Links */}
        <div className="flex flex-col gap-5 flex-1">
            <NavLink 
                to="/academic"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300",
                  isActive ? "text-primary bg-primary/10 shadow-sm ring-1 ring-primary/20" : "text-foreground/30 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="Academic Dashboard"
            >
              <GraduationCap className="w-5 h-5" strokeWidth={2.2} />
              <div className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-l-full scale-y-0 transition-transform active:scale-y-100" />
            </NavLink>
            <NavLink 
                to="/obsidian"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300",
                  isActive ? "text-primary bg-primary/10 shadow-sm ring-1 ring-primary/20" : "text-foreground/30 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="Knowledge Base"
            >
              <FileText className="w-5 h-5" strokeWidth={2.2} />
            </NavLink>
            <NavLink 
                to="/agents"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300",
                  isActive ? "text-primary bg-primary/10 shadow-sm ring-1 ring-primary/20" : "text-foreground/30 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="AI Agents"
            >
              <Users className="w-5 h-5" strokeWidth={2.2} />
            </NavLink>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-5 mt-auto px-1 items-center mb-2 w-full">
            <ThemeSwitch />
            <NavLink 
                to="/onboarding"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300",
                  isActive ? "text-primary bg-primary/10 shadow-sm ring-1 ring-primary/20" : "text-foreground/30 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="System Setup"
            >
              <Zap className="w-5 h-5" strokeWidth={2.2} />
            </NavLink>
            <NavLink 
                to="/settings"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300",
                  isActive ? "text-primary bg-primary/10 shadow-sm ring-1 ring-primary/20" : "text-foreground/30 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="Settings"
            >
              <Settings className="w-5 h-5" strokeWidth={2.2} />
            </NavLink>
        </div>
    </aside>
  )
}
