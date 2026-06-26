import React from 'react'
import { Lock, RefreshCw } from 'lucide-react'

interface LockoutScreenProps {
  title: string
  description: string
  slug?: string
  onVerify?: () => void
  isSyncing?: boolean
  fullScreen?: boolean
}

export function LockoutScreen({
  title,
  description,
  slug,
  onVerify,
  isSyncing = false,
  fullScreen = false
}: LockoutScreenProps) {
  const content = (
    <div className="w-full max-w-[500px] border border-border/80 p-12 bg-card space-y-8 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
      <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
      
      {/* Centered Lock Icon */}
      <div className="size-16 rounded-full border border-border/80 flex items-center justify-center bg-accent/20">
        <Lock className="size-6 text-foreground" />
      </div>

      <div className="space-y-4 w-full">
        <div className="text-[12px] font-black tracking-widest text-destructive uppercase">
          [RESTRICTED CLEARANCE]
        </div>
        <h2 className="text-[20px] font-black uppercase tracking-[0.2em] text-foreground leading-snug">
          {title}
        </h2>
        <div className="h-px w-16 bg-muted-foreground/30 mx-auto" />
      </div>

      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.12em] leading-relaxed max-w-[380px]">
        {description}
      </p>

      {slug && (
        <div className="w-full space-y-3 pt-4 border-t border-border/50 text-[9px] uppercase tracking-widest text-muted-foreground">
          <div className="flex justify-between px-2">
            <span>DOMAIN SLUG:</span>
            <span className="text-foreground select-text">[{slug}]</span>
          </div>
          <div className="flex justify-between px-2">
            <span>STATUS:</span>
            <span className="text-destructive font-black">LOCKED_BY_CONTROLLER</span>
          </div>
        </div>
      )}

      {onVerify && (
        <div className="pt-2">
          <button
            onClick={onVerify}
            disabled={isSyncing}
            className="border border-border bg-transparent text-foreground hover:bg-accent/40 hover:text-background transition-none uppercase text-[9px] font-black tracking-widest px-4 py-2.5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'VERIFYING...' : 'RE-VERIFY CLEARANCE'}
          </button>
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background text-foreground select-none font-mono">
        {content}
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[450px] flex items-center justify-center bg-background p-8 border border-border/40 font-mono select-none">
      {content}
    </div>
  )
}
