import React, { useEffect, useCallback, useRef } from 'react';
import { usePomodoroStore } from '@/lib/pomodoroStore';
import { useConfig } from '@/lib/ConfigContext';
import { toast } from 'sonner';
import PomodoroTimer from '@/components/intelligence/PomodoroTimer';
import PomodoroStats from '@/components/intelligence/PomodoroStats';
import { Play, Pause, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PomodoroController() {
  const { config } = useConfig();
  const { 
    timeLeft, isActive, mode, sessionCount, isMuted, showOverlay, showStats, currentHub,
    setTimeLeft, setMode, setSessionCount, setIsActive, addHistory, setShowOverlay
  } = usePomodoroStore();

  const settings = {
    focus: (config?.pomodoroWorkDuration || 25) * 60,
    shortBreak: (config?.pomodoroShortBreakDuration || 5) * 60,
    longBreak: (config?.pomodoroLongBreakDuration || 15) * 60,
    sessionsBeforeLong: config?.pomodoroSessionsBeforeLongBreak || 4
  };

  // Web Audio API Synthesizer - 100% self-contained, offline-compatible, and zero-dependency
  const playSound = useCallback((type: 'work' | 'break') => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const playBeep = (freq: number, startTime: number, duration: number, volume: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, startTime);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.01);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      if (type === 'work') {
        // High-fidelity ascending focus double chime (C5 to E5)
        playBeep(523.25, now, 0.22, 0.15);
        playBeep(659.25, now + 0.12, 0.32, 0.15);
      } else {
        // Relaxing descending break triple chime (D5 to B4 to G4)
        playBeep(587.33, now, 0.20, 0.12);
        playBeep(493.88, now + 0.12, 0.20, 0.12);
        playBeep(392.00, now + 0.24, 0.40, 0.12);
      }
    } catch (e) {
      console.warn('Web Audio playback failed', e);
    }
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

  // Synchronize timeLeft with new settings when timer is inactive and settings duration changes
  const prevSettingsTimeRef = useRef(settings.focus);
  useEffect(() => {
    const currentSettingsTime = mode === 'focus' ? settings.focus : (mode === 'short_break' ? settings.shortBreak : settings.longBreak);
    const prevSettingsTime = mode === 'focus' ? prevSettingsTimeRef.current : (mode === 'short_break' ? settings.shortBreak : settings.longBreak);
    
    if (!isActive && currentSettingsTime !== timeLeft && currentSettingsTime !== prevSettingsTime) {
      setTimeLeft(currentSettingsTime);
    }
    prevSettingsTimeRef.current = settings.focus;
  }, [settings.focus, settings.shortBreak, settings.longBreak, isActive, mode, setTimeLeft, timeLeft]);

  // Timestamp-based drift-free sync to support OS background sleep, browser suspension and timer accuracy
  const expectedEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      const now = Date.now();
      const currentExpected = expectedEndTimeRef.current;
      if (!currentExpected) {
        expectedEndTimeRef.current = now + timeLeft * 1000;
      } else {
        const remaining = Math.max(0, Math.ceil((currentExpected - now) / 1000));
        // If drift is significant (e.g. from manual skip, reset or settings changes), synchronize Ref with new value
        if (Math.abs(remaining - timeLeft) > 1) {
          expectedEndTimeRef.current = now + timeLeft * 1000;
        }
      }
    } else {
      expectedEndTimeRef.current = null;
    }
  }, [isActive, timeLeft]);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        const now = Date.now();
        if (expectedEndTimeRef.current) {
          const remaining = Math.max(0, Math.ceil((expectedEndTimeRef.current - now) / 1000));
          if (remaining !== timeLeft) {
            setTimeLeft(remaining);
          }
          if (remaining === 0) {
            clearInterval(interval);
            expectedEndTimeRef.current = null;
            switchMode();
          }
        }
      }, 200); // 5Hz polling guarantees high precision and responsive UI updates
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, setTimeLeft, switchMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isBreak = mode === 'short_break' || mode === 'long_break';

  return (
    <>
      {/* Centered Timer Modal Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-[150] bg-bento-bg/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOverlay(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
          >
            <PomodoroTimer />
          </div>
        </div>
      )}

      {/* Statistics Modal Overlay */}
      {showStats && (
        <div
          className="fixed inset-0 z-[160] bg-bento-bg/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) usePomodoroStore.getState().setShowStats(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
          >
            <PomodoroStats />
          </div>
        </div>
      )}

      {/* Full Screen Break Overlay (Theme Compatible) */}
      {isBreak && (
        <div
          className="fixed inset-0 z-[200] bg-[#0e0e0f] flex flex-col items-center justify-center select-none"
        >
          <div 
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
                  <div 
                    key={i} 
                    className={cn(
                      "w-4 h-4 rounded-none",
                      i < (sessionCount % settings.sessionsBeforeLong || (sessionCount > 0 ? settings.sessionsBeforeLong : 0)) 
                        ? 'bg-foreground opacity-60 scale-125' 
                        : 'bg-muted-foreground opacity-10'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

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
        </div>
      )}
    </>
  );
}
