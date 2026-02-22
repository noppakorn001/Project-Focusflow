'use client';

import { useStore } from '@/lib/store';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function TimerLogic() {
  const { timer, tickTimer, advanceTimer, switchMode, settings, setTimer } = useStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const playBeep = useCallback(() => {
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
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  // Visibility change handler: catch up timer when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const { timer: currentTimer } = useStore.getState();
        if (currentTimer.isActive && currentTimer.startedAt && currentTimer.timeLeft > 0) {
          // Calculate how much time ACTUALLY passed since startedAt
          const now = Date.now();
          const totalElapsed = Math.floor((now - currentTimer.startedAt) / 1000);

          // Determine what timeLeft SHOULD be based on the mode's total duration
          const getDuration = () => {
            switch (currentTimer.mode) {
              case 'focus': return settings.focusDuration * 60;
              case 'short-break': return settings.shortBreakDuration * 60;
              case 'long-break': return settings.longBreakDuration * 60;
            }
          };
          const totalDuration = getDuration();
          const correctTimeLeft = Math.max(0, totalDuration - totalElapsed);
          const drift = currentTimer.timeLeft - correctTimeLeft;

          if (drift > 0) {
            // Advance timer by the drift amount to catch up
            advanceTimer(drift);
          }

          // Reset the tick anchor
          lastTickRef.current = now;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings, advanceTimer]);

  // Main timer loop with Date.now() anchoring
  useEffect(() => {
    if (!timer.isActive || timer.timeLeft <= 0) {
      // Handle timer completion
      if (timer.isActive && timer.timeLeft === 0) {
        playBeep();
        toast.success(`${timer.mode === 'focus' ? 'Focus Session' : 'Break'} Completed!`);

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
      return;
    }

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;

      if (elapsed >= 1000) {
        const secondsElapsed = Math.floor(elapsed / 1000);
        lastTickRef.current += secondsElapsed * 1000;

        // Use advanceTimer for multi-second catch-ups, tickTimer for single seconds
        if (secondsElapsed > 1) {
          advanceTimer(secondsElapsed);
        } else {
          tickTimer();
        }
      }
    }, 250);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isActive, timer.timeLeft === 0, timer.mode, settings, tickTimer, advanceTimer, switchMode, setTimer, playBeep]);

  return null;
}
