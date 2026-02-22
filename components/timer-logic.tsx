'use client';

import { useStore } from '@/lib/store';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function TimerLogic() {
  const { timer, tickTimer, switchMode, settings, setTimer } = useStore();
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer.isActive && timer.timeLeft > 0) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    } else if (timer.isActive && timer.timeLeft === 0) {
      // Timer finished
      playBeep();
      toast.success(`${timer.mode === 'focus' ? 'Focus Session' : 'Break'} Completed!`);
      
      // Auto-switch logic
      if (timer.mode === 'focus') {
        if (settings.autoStartBreaks) {
           switchMode('short-break');
           setTimer({ isActive: true });
        } else {
           switchMode('short-break');
        }
      } else {
        if (settings.autoStartPomodoros) {
          switchMode('focus');
          setTimer({ isActive: true });
        } else {
          switchMode('focus');
        }
      }
    }

    return () => clearInterval(interval);
  }, [timer.isActive, timer.timeLeft, timer.mode, settings, tickTimer, switchMode, setTimer]);

  return null;
}
