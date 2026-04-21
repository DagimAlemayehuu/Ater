import React, { useState, useEffect } from 'react'
import { sidecarApi } from '@/lib/sidecarApi'
import { Zap, Play, Box, ChevronRight, Activity, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Automata() {
  const [queueStatus, setQueueStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await sidecarApi.okaQueueStatus()
        setQueueStatus(res)
      } catch (e) {} finally {
        setIsLoading(false)
      }
    }
    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 flex flex-col p-6 space-y-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <span className="label-sm">System</span>
        <h1 className="display-md uppercase">Intelligence<br/><span className="text-muted-foreground/30 text-3xl">Automata</span></h1>
      </div>

      {/* Main Status Card */}
      <div className={cn(
        "p-8 rounded-md border-2 transition-all duration-1000 relative overflow-hidden",
        queueStatus?.status === 'idle' ? "bg-accent/10 border-border/10" : "bg-primary/5 border-primary/20"
      )}>
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                queueStatus?.status === 'idle' ? "bg-muted-foreground/30" : "bg-primary animate-pulse"
              )} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                {queueStatus?.status === 'idle' ? 'System Idle' : 'Unit Processing'}
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-3xl font-black tracking-tighter">
                {queueStatus?.current_batch || 0}/{queueStatus?.total_batches || 0}
              </p>
              <p className="label-sm">Active Deployment Loop</p>
            </div>
          </div>
          
          <Zap size={32} className={cn(
            "transition-all duration-500",
            queueStatus?.status === 'idle' ? "text-muted-foreground/10" : "text-primary animate-pulse"
          )} />
        </div>

        {/* Progress Bar */}
        <div className="mt-8 h-1 w-full bg-border/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-700" 
            style={{ width: `${((queueStatus?.current_batch || 0) / (queueStatus?.total_batches || 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => sidecarApi.okaWatcherToggle()}
          className="flex flex-col items-center justify-center p-6 bg-foreground text-background rounded-md space-y-2 active:scale-95 transition-all"
        >
          <Play size={20} fill="currentColor" />
          <span className="text-[9px] font-black uppercase tracking-widest">Process Inbox</span>
        </button>
        <button className="flex flex-col items-center justify-center p-6 bg-accent/20 border border-border/10 rounded-md space-y-2 active:scale-95 transition-all">
          <Activity size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">View Stream</span>
        </button>
      </div>

      {/* Deployment History */}
      <div className="space-y-6">
        <h3 className="label-sm flex items-center gap-2">
          <Clock size={12} /> Deployment History
        </h3>
        
        <div className="space-y-px bg-border/10 rounded-md overflow-hidden border border-border/10">
          {(queueStatus?.processed_notes || []).length === 0 ? (
            <div className="p-8 text-center bg-background">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">No active history</p>
            </div>
          ) : (
            queueStatus.processed_notes.map((note: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-background hover:bg-accent/5 transition-all border-b border-border/5 last:border-0">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase truncate max-w-[200px]">{note.title}</p>
                  <p className="text-[8px] font-black text-muted-foreground/40 uppercase">Modular Deployment · Success</p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/20" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
