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
  
  const settings = {
    focus: (config?.pomodoroWorkDuration || 25) * 60,
    shortBreak: (config?.pomodoroShortBreakDuration || 5) * 60,
    longBreak: (config?.pomodoroLongBreakDuration || 15) * 60,
    sessionsBeforeLong: config?.pomodoroSessionsBeforeLongBreak || 4
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSettingsTime = mode === 'focus' ? settings.focus : (mode === 'short_break' ? settings.shortBreak : settings.longBreak);

  return (
    <div className="flex flex-col items-center justify-between p-8 bg-background border border-border shadow-[0_40px_120px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_120px_rgba(0,0,0,1)] w-[400px] h-[400px] relative overflow-hidden text-foreground rounded-2xl">
      {/* Header */}
      <div className="w-full flex items-center justify-between z-10">
        <button onClick={() => setShowOverlay(false)} className="p-2 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border">
          <X size={20} className="text-muted-foreground/30" />
        </button>
        <div className="flex items-center gap-1.5">
           <button 
             onClick={() => {
               setIsActive(false);
               setTimeLeft(currentSettingsTime);
             }}
             className="p-2 hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all text-muted-foreground/30 hover:text-foreground"
             title="Reset"
           >
             <RefreshCw size={20} />
           </button>
           <button 
             onClick={() => setShowStats(true)}
             className="p-2 hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all text-muted-foreground/30 hover:text-foreground"
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

          {/* Decorative element under timer */}
          <div className="w-10 h-1.5 bg-foreground rounded-full mb-10" />

          {/* Circular Play/Pause Button */}
          <button 
            onClick={() => setIsActive(!isActive)}
            className="w-20 h-20 rounded-full bg-foreground text-background flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] dark:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all z-10"
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
        </div>
      </div>

      {/* Progress Circles (Dots) */}
      <div className="flex gap-3 mb-8">
        {Array.from({ length: settings.sessionsBeforeLong }).map((_, i) => (
          <motion.div 
            key={i} 
            initial={false}
            animate={{ 
              scale: i < (sessionCount % settings.sessionsBeforeLong || (sessionCount > 0 ? settings.sessionsBeforeLong : 0)) ? 1.2 : 1,
              backgroundColor: i < (sessionCount % settings.sessionsBeforeLong || (sessionCount > 0 ? settings.sessionsBeforeLong : 0)) 
                ? 'var(--foreground)' 
                : 'var(--muted-foreground)',
              opacity: i < (sessionCount % settings.sessionsBeforeLong || (sessionCount > 0 ? settings.sessionsBeforeLong : 0)) ? 1 : 0.1
            }}
            className="w-2 h-2 rounded-full"
          />
        ))}
      </div>

      {/* Skip Break Control - Floating skip icon */}
      {isActive && mode !== 'focus' && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4">
          <button 
            onClick={() => setTimeLeft(0)}
            className="p-3 bg-background border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all shadow-xl"
            title="Skip"
          >
            <SkipForward size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
