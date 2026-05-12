import { NavLink } from 'react-router-dom'
import { FileText, RefreshCw, Users, Settings, GraduationCap, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeSwitch } from '@/components/theme-switch'

export function AppSidebar() {
  return (
    <aside className="w-12 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 shrink-0 z-10 h-full">
        {/* Navigation Links */}
        <div className="flex flex-col gap-6 flex-1">
            <NavLink 
                to="/academic"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                  isActive ? "text-foreground bg-foreground/10" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="Academic Dashboard"
            >
              <GraduationCap className="w-5 h-5" />
            </NavLink>
            <NavLink 
                to="/obsidian"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                  isActive ? "text-foreground bg-foreground/10" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="Obsidian Vault"
            >
              <FileText className="w-5 h-5" />
            </NavLink>
            <NavLink 
                to="/agents"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                  isActive ? "text-foreground bg-foreground/10" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="AI Agents"
            >
              <RefreshCw className="w-5 h-5" />
            </NavLink>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-6 mt-auto px-1 items-center mb-2 w-full">
            <ThemeSwitch />
            <NavLink 
                to="/onboarding"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                  isActive ? "text-foreground bg-foreground/10" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="Onboarding"
            >
              <Zap className="w-5 h-5" />
            </NavLink>
            <NavLink 
                to="/settings"
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                  isActive ? "text-foreground bg-foreground/10" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
                )} 
                title="Settings"
            >
              <Settings className="w-5 h-5" />
            </NavLink>
        </div>
    </aside>
  )
}
