import React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Settings, Archive, Zap, GraduationCap, Database } from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
}

const navItems: NavItem[] = [
  { label: 'VAULT', icon: Archive, path: '/obsidian' },
  { label: 'REGISTRY', icon: Database, path: '/registry' },
  { label: 'OKA', icon: Zap, path: '/oka' },
  { label: 'PRACTICE', icon: GraduationCap, path: '/practice' },
  { label: 'SYSTEM', icon: Settings, path: '/settings' },
]

export function MobileNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe px-2 bg-background/80 backdrop-blur-xl border-t border-border/40 z-[100]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-2 px-1 transition-all duration-500 flex-1 gap-1.5 relative",
              isActive 
                ? "text-primary scale-110" 
                : "text-muted-foreground opacity-50 hover:opacity-100"
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} className={cn(isActive && "fill-current")} />
              <span className="text-[8px] font-black uppercase tracking-[0.2em]">{item.label}</span>
              {isActive && (
                  <div className="absolute -bottom-1.5 w-1 h-1 bg-primary rounded-full animate-in zoom-in" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
