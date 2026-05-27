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
    <div className="flex flex-col items-center justify-between p-8 bg-bento-panel border border-border/40 shadow-2xl w-[400px] h-[400px] relative overflow-hidden text-foreground rounded-[12px] font-sans">
      {/* Header */}
      <div className="w-full flex items-center justify-between z-10">
        <button onClick={() => setShowOverlay(false)} className="h-9 w-9 flex items-center justify-center bg-muted/20 hover:bg-bento-item rounded-[8px] transition-all border border-border/40 hover:border-foreground/30 text-muted-foreground/60 hover:text-foreground">
          <X size={18} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => {
               setIsActive(false);
               setTimeLeft(currentSettingsTime);
             }}
             className="h-9 w-9 flex items-center justify-center bg-muted/20 hover:bg-bento-item rounded-[8px] border border-border/40 hover:border-foreground/30 transition-all text-muted-foreground/60 hover:text-foreground"
             title="Reset"
           >
             <RefreshCw size={16} strokeWidth={2.5} />
           </button>
           <button 
             onClick={() => setShowStats(true)}
             className="h-9 w-9 flex items-center justify-center bg-muted/20 hover:bg-bento-item rounded-[8px] border border-border/40 hover:border-foreground/30 transition-all text-muted-foreground/60 hover:text-foreground"
             title="Statistics"
           >
             <BarChart2 size={16} strokeWidth={2.5} />
           </button>
        </div>
      </div>

      {/* Main Content - Time occupies most space */}
      <div className="flex flex-col items-center flex-1 justify-center w-full relative">
        <div className="flex flex-col items-center w-full text-center">
          <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-4 w-full font-sans">
            {currentHub || 'FOCUS SESSION'}
          </span>
          <div className="text-[110px] font-black tabular-nums tracking-[-0.06em] leading-none mb-4 text-foreground font-sans">
            {formatTime(timeLeft)}
          </div>

          {/* Dynamic Session Progress Indicator */}
          <div className="flex items-center gap-2 mb-10 h-2">
            {Array.from({ length: sessionsBeforeLong }).map((_, i) => {
              const currentSessionIndex = sessionCount % sessionsBeforeLong;
              const isCompleted = i < currentSessionIndex;
              const isActiveSession = i === currentSessionIndex;
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    isActiveSession ? "w-6 bg-foreground shadow-[0_0_10px_rgba(255,255,255,0.1)]" : (isCompleted ? "w-1.5 bg-foreground/20" : "w-1.5 bg-foreground/40")
                  )}
                />
              );
            })}
          </div>

          {/* Circular Play/Pause Button - Smaller, non-extreme gray */}
          <button 
            onClick={() => setIsActive(!isActive)}
            className="w-14 h-14 rounded-full bg-muted/50 border border-border/40 text-foreground flex items-center justify-center shadow-xl hover:bg-bento-item transition-all z-10"
          >
            {isActive ? <Pause size={24} strokeWidth={2.5} /> : <Play size={24} strokeWidth={2.5} className="ml-1" />}
          </button>
        </div>
      </div>

      {/* Skip Break Control - Floating skip icon */}
      {isActive && mode !== 'focus' && (
        <div className="absolute top-1/2 -translate-y-1/2 right-4">
          <button 
            onClick={() => setTimeLeft(0)}
            className="h-12 w-12 flex items-center justify-center bg-bento-item border border-border/40 rounded-[8px] text-foreground hover:border-foreground/30 transition-all shadow-xl"
            title="Skip"
          >
            <SkipForward size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
