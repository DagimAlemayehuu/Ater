import React from 'react'
import { Search, Menu, Bell, User, Zap } from 'lucide-react'
import { useTheme } from '@/context/theme-provider'
import { ThemeSwitch } from '@/components/theme-switch'

export function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-foreground flex items-center justify-center rounded-sm">
            <Zap className="w-5 h-5 text-background fill-background" />
        </div>
        <span className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">LIFE OS</span>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeSwitch />
        <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-muted">
            <User className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
