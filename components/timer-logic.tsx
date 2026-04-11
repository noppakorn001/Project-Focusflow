'use client';

import { useStore } from '@/lib/store';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function TimerLogic() {
  const { timer, tickTimer, advanceTimer, switchMode, settings, setTimer, setPendingReflection, tasks } = useStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const playCompletionSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Play a pleasant 3-note chime sequence
      const notes = [
        { freq: 523.25, time: 0 },      // C5
        { freq: 659.25, time: 0.15 },    // E5
        { freq: 783.99, time: 0.3 },     // G5
        { freq: 1046.50, time: 0.5 },    // C6 (resolving high note)
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        gain.gain.setValueAtTime(0, ctx.currentTime + time);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.6);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.6);
      });

      // Second chime burst after a brief pause (repeat for emphasis)
      setTimeout(() => {
        if (!audioContextRef.current) return;
        const ctx2 = audioContextRef.current;

        notes.forEach(({ freq, time }) => {
          const osc = ctx2.createOscillator();
          const gain = ctx2.createGain();

          osc.connect(gain);
          gain.connect(ctx2.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx2.currentTime + time);

          gain.gain.setValueAtTime(0, ctx2.currentTime + time);
          gain.gain.linearRampToValueAtTime(0.12, ctx2.currentTime + time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + time + 0.5);

          osc.start(ctx2.currentTime + time);
          osc.stop(ctx2.currentTime + time + 0.5);
        });
      }, 800);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, []);

  // Visibility change handler: catch up timer when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const { timer: currentTimer } = useStore.getState();
        if (currentTimer.isActive && currentTimer.startedAt && currentTimer.timeLeft > 0) {
          const now = Date.now();
          const totalElapsed = Math.floor((now - currentTimer.startedAt) / 1000);

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
            advanceTimer(drift);
          }

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
      if (timer.isActive && timer.timeLeft === 0) {
        playCompletionSound();
        toast.success(`${timer.mode === 'focus' ? 'Focus Session' : 'Break'} Completed!`);

        if (timer.mode === 'focus') {
          // Trigger reflection modal if a task was linked
          if (timer.linkedTaskId) {
            const linkedTask = tasks.find((t) => t.id === timer.linkedTaskId);
            if (linkedTask) {
              setPendingReflection({ taskId: linkedTask.id, taskName: linkedTask.title });
            }
          }

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

        if (secondsElapsed > 1) {
          advanceTimer(secondsElapsed);
        } else {
          tickTimer();
        }
      }
    }, 250);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isActive, timer.timeLeft === 0, timer.mode, settings, tickTimer, advanceTimer, switchMode, setTimer, setPendingReflection, tasks, playCompletionSound]);

  return null;
}
