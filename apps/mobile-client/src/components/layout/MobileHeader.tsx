import React from 'react'
import { Search, Menu, Bell, User, Zap } from 'lucide-react'
import { ThemeSwitch } from '@/components/theme-switch'

export function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-background/80 backdrop-blur-xl border-b border-border/10 z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Zap className="w-4 h-4 text-primary fill-current" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">LIFE_OS</span>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeSwitch />
        <div className="w-7 h-7 rounded-full border border-border/20 flex items-center justify-center bg-muted/30">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}

