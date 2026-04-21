import React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: string
  path: string
}

const navItems: NavItem[] = [
  { label: 'Vault', icon: 'database', path: '/obsidian' },
  { label: 'Mirror', icon: 'layers', path: '/vault-sync' },
  { label: 'Agents', icon: 'smart_toy', path: '/agents' },
  { label: 'Practice', icon: 'exercise', path: '/practice' },
  { label: 'System', icon: 'settings', path: '/settings' },
]

export function MobileNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe px-2 bg-background border-t border-border/10 z-[100] flat-ui-no-elevation">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-2 px-2 transition-all duration-300 flex-1",
              isActive 
                ? "bg-accent border-l-2 border-primary text-primary opacity-100 font-bold" 
                : "text-secondary hover:text-primary opacity-60"
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined mb-1 text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
                {item.icon}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
