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
    <div className="flex flex-col items-center justify-between p-8 bg-[#151517] border border-[#242426] shadow-2xl w-[400px] h-[400px] relative overflow-hidden text-foreground rounded-[12px]">
      {/* Header */}
      <div className="w-full flex items-center justify-between z-10">
        <button onClick={() => setShowOverlay(false)} className="p-2 hover:bg-[#232326] rounded-[8px] transition-none border border-transparent hover:border-[#242426]">
          <X size={20} className="text-muted-foreground/30" />
        </button>
        <div className="flex items-center gap-1.5">
           <button 
             onClick={() => {
               setIsActive(false);
               setTimeLeft(currentSettingsTime);
             }}
             className="p-2 hover:bg-[#232326] rounded-[8px] border border-transparent hover:border-[#242426] transition-none text-muted-foreground/30 hover:text-foreground"
             title="Reset"
           >
             <RefreshCw size={20} />
           </button>
           <button 
             onClick={() => setShowStats(true)}
             className="p-2 hover:bg-[#232326] rounded-[8px] border border-transparent hover:border-[#242426] transition-none text-muted-foreground/30 hover:text-foreground"
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
                <div 
                  key={i} 
                  className={cn(
                    "rounded-none transition-none",
                    isActiveSession ? "w-6 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] opacity-100" : (isCompleted ? "w-2 h-2 bg-foreground rounded-full opacity-20" : "w-2 h-2 bg-foreground rounded-full opacity-40")
                  )}
                />
              );
            })}
          </div>

          {/* Circular Play/Pause Button */}
          <button 
            onClick={() => setIsActive(!isActive)}
            className="w-20 h-20 rounded-full bg-[#232326] border border-[#242426] text-foreground flex items-center justify-center shadow-xl hover:bg-[#232326]/80 transition-none z-10"
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
            className="p-3 bg-[#232326] border border-[#242426] rounded-[8px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-none shadow-xl"
            title="Skip"
          >
            <SkipForward size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
