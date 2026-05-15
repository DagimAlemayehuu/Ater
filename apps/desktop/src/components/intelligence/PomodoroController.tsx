import React, { useEffect, useCallback } from 'react';
import { usePomodoroStore } from '@/lib/pomodoroStore';
import { useConfig } from '@/lib/ConfigContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import PomodoroTimer from '@/components/intelligence/PomodoroTimer';
import PomodoroStats from '@/components/intelligence/PomodoroStats';
import { Play, Pause, SkipForward } from 'lucide-react';

export default function PomodoroController() {
  const { config } = useConfig();
  const { 
    timeLeft, isActive, mode, sessionCount, isMuted, showOverlay, showStats, currentHub,
    tick, setTimeLeft, setMode, setSessionCount, setIsActive, addHistory, setShowOverlay
  } = usePomodoroStore();

  const settings = {
    focus: (config?.pomodoroWorkDuration || 25) * 60,
    shortBreak: (config?.pomodoroShortBreakDuration || 5) * 60,
    longBreak: (config?.pomodoroLongBreakDuration || 15) * 60,
    sessionsBeforeLong: config?.pomodoroSessionsBeforeLongBreak || 4
  };

  const playSound = useCallback((type: 'work' | 'break') => {
    if (isMuted) return;
    const audio = new Audio(type === 'work' ? '/sounds/work.mp3' : '/sounds/break.mp3');
    audio.play().catch(e => console.log('Audio playback failed', e));
  }, [isMuted]);

  const switchMode = useCallback(() => {
    if (mode === 'focus') {
      if (sessionCount % settings.sessionsBeforeLong === 0) {
        setMode('long_break');
        setTimeLeft(settings.longBreak);
      } else {
        setMode('short_break');
        setTimeLeft(settings.shortBreak);
      }
      addHistory({ hub: currentHub || 'Flow', duration: settings.focus / 60 });
      setSessionCount(prev => prev + 1);
      playSound('break');
    } else {
      setMode('focus');
      setTimeLeft(settings.focus);
      setIsActive(false);
      playSound('work');
    }
  }, [mode, sessionCount, settings, setMode, setTimeLeft, setSessionCount, playSound, currentHub, addHistory, setIsActive]);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      switchMode();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, tick, switchMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isBreak = mode === 'short_break' || mode === 'long_break';

  return (
    <>
      {/* Centered Timer Modal Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-background/60 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowOverlay(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PomodoroTimer />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Modal Overlay */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-background/60 backdrop-blur-2xl flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) usePomodoroStore.getState().setShowStats(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <PomodoroStats />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Break Overlay (Theme Compatible) */}
      <AnimatePresence>
        {isBreak && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-background backdrop-blur-3xl flex flex-col items-center justify-center select-none"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center text-center space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-sm font-black text-muted-foreground/30 uppercase tracking-[0.5em] ml-[0.5em]">Break</h2>
                <div className="text-[160px] font-bold tabular-nums tracking-tighter leading-none text-foreground">
                  {formatTime(timeLeft)}
                </div>
                
                {/* Focus Circles on Break Screen */}
                <div className="flex justify-center gap-4 mt-8">
                  {Array.from({ length: settings.sessionsBeforeLong }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ 
                        scale: i < (sessionCount % settings.sessionsBeforeLong || (sessionCount > 0 ? settings.sessionsBeforeLong : 0)) ? 1.4 : 1,
                        backgroundColor: i < (sessionCount % settings.sessionsBeforeLong || (sessionCount > 0 ? settings.sessionsBeforeLong : 0)) 
                          ? 'var(--foreground)' 
                          : 'var(--muted-foreground)',
                        opacity: i < (sessionCount % settings.sessionsBeforeLong || (sessionCount > 0 ? settings.sessionsBeforeLong : 0)) ? 0.6 : 0.1
                      }}
                      className="w-4 h-4 rounded-none"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="flex items-center gap-3 mt-24">
              <button
                onClick={() => setIsActive(!isActive)}
                className="flex items-center gap-3 px-10 py-4 rounded-none bg-muted/20 hover:bg-muted/40 border border-border transition-none  text-[10px] font-black uppercase tracking-[0.2em] text-foreground"
              >
                {isActive ? <Pause size={14} /> : <Play size={14} />}
                {isActive ? 'PAUSE' : 'RESUME'}
              </button>
              <button
                onClick={() => setTimeLeft(0)}
                className="flex items-center gap-3 px-10 py-4 rounded-none bg-muted/10 hover:bg-muted/30 border border-border transition-none  text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                <SkipForward size={14} />
                SKIP
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
