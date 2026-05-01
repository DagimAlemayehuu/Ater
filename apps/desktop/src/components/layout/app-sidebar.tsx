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
                to="/obsidian"
                className={({ isActive }) => cn("cursor-pointer", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground")} 
                title="Obsidian Vault"
            >
                <FileText className="w-6 h-6" />
            </NavLink>
            <NavLink 
                to="/vault-sync"
                className={({ isActive }) => cn("cursor-pointer", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground")} 
                title="Vault Sync"
            >
                <RefreshCw className="w-6 h-6" />
            </NavLink>
            <NavLink 
                to="/agents"
                className={({ isActive }) => cn("cursor-pointer", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground")} 
                title="Agents"
            >
                <Users className="w-6 h-6" />
            </NavLink>
            <NavLink 
                to="/academic"
                className={({ isActive }) => cn("cursor-pointer", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground")} 
                title="Academic Mastery"
            >
                <GraduationCap className="w-6 h-6" />
            </NavLink>
            <NavLink 
                to="/practice"
                className={({ isActive }) => cn("cursor-pointer", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground")} 
                title="Practice"
            >
                <Zap className="w-6 h-6" />
            </NavLink>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-6 mt-auto px-1 items-center">
            <ThemeSwitch />
            <NavLink 
                to="/settings"
                className={({ isActive }) => cn("cursor-pointer", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 hover:text-sidebar-foreground")} 
                title="Settings"
            >
                <Settings className="w-6 h-6" />
            </NavLink>
        </div>
    </aside>
  )
}
