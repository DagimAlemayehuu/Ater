import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, RefreshCw, BarChart2, MoreVertical, X } from 'lucide-react';
import { useConfig } from '@/lib/ConfigContext';
import { usePomodoroStore } from '@/lib/pomodoroStore';
import { cn } from '@/lib/utils';

export default function PomodoroTimer() {
  const { config } = useConfig();
  const { 
    timeLeft, isActive, mode, sessionCount, currentHub,
    setIsActive, setTimeLeft, setShowOverlay, setShowStats
  } = usePomodoroStore();
  
  const sessionsBeforeLong = Number(config?.pomodoroSessionsBeforeLongBreak || 4);
  const settings = {
    focus: (config?.pomodoroWorkDuration || 25) * 60,
    shortBreak: (config?.pomodoroShortBreakDuration || 5) * 60,
    longBreak: (config?.pomodoroLongBreakDuration || 15) * 60,
    sessionsBeforeLong
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSettingsTime = mode === 'focus' ? settings.focus : (mode === 'short_break' ? settings.shortBreak : settings.longBreak);

  return (
    <div className="flex flex-col items-center justify-between p-8 bg-background border border-border shadow-[0_40px_120px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_120px_rgba(0,0,0,1)] w-[400px] h-[400px] relative overflow-hidden text-foreground rounded-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between z-10">
        <button onClick={() => setShowOverlay(false)} className="p-2 hover:bg-muted rounded-none transition-colors border border-transparent hover:border-border">
          <X size={20} className="text-muted-foreground/30" />
        </button>
        <div className="flex items-center gap-1.5">
           <button 
             onClick={() => {
               setIsActive(false);
               setTimeLeft(currentSettingsTime);
             }}
             className="p-2 hover:bg-muted rounded-none border border-transparent hover:border-border transition-none text-muted-foreground/30 hover:text-foreground"
             title="Reset"
           >
             <RefreshCw size={20} />
           </button>
           <button 
             onClick={() => setShowStats(true)}
             className="p-2 hover:bg-muted rounded-none border border-transparent hover:border-border transition-none text-muted-foreground/30 hover:text-foreground"
             title="Statistics"
           >
             <BarChart2 size={20} />
           </button>
        </div>
      </div>

      {/* Main Content - Time occupies most space */}
      <div className="flex flex-col items-center flex-1 justify-center w-full relative">
        <div className="flex flex-col items-center w-full">
          <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em] mb-4">
            {currentHub || 'FLOW'}
          </span>
          <div className="text-[110px] font-bold tabular-nums tracking-[-0.06em] leading-none mb-4">
            {formatTime(timeLeft)}
          </div>

          {/* Dynamic Session Progress Indicator */}
          <div className="flex items-center gap-2 mb-10 h-2">
            {Array.from({ length: sessionsBeforeLong }).map((_, i) => {
              const currentSessionIndex = sessionCount % sessionsBeforeLong;
              const isCompleted = i < currentSessionIndex;
              const isActiveSession = i === currentSessionIndex;
              
              return (
                <motion.div 
                  key={i} 
                  initial={false}
                  animate={{ 
                    width: isActiveSession ? 24 : 8,
                    height: 8,
                    opacity: isActiveSession ? 1 : (isCompleted ? 0.2 : 0.4),
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={cn(
                    "rounded-none transition-colors",
                    isActiveSession ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" : "bg-foreground"
                  )}
                />
              );
            })}
          </div>

          {/* Circular Play/Pause Button */}
          <button 
            onClick={() => setIsActive(!isActive)}
            className="w-20 h-20 rounded-none bg-muted/40 border border-border/50 text-foreground flex items-center justify-center shadow-xl hover:bg-muted/60  transition-none z-10"
          >
            {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>
        </div>
      </div>

      {/* Skip Break Control - Floating skip icon */}
      {isActive && mode !== 'focus' && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4">
          <button 
            onClick={() => setTimeLeft(0)}
            className="p-3 bg-background border border-border rounded-none text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-none shadow-xl"
            title="Skip"
          >
            <SkipForward size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
