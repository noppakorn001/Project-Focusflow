'use client';

import { useStore, TimerMode } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Pause, RotateCcw, Coffee, Brain, Armchair, Info, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';

// SVG Circular Progress Ring
function CircularProgress({
  progress,
  isActive,
  mode,
}: {
  progress: number;
  isActive: boolean;
  mode: TimerMode;
}) {
  const size = 280;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const modeStroke: Record<TimerMode, string> = {
    focus: '#0a72ef',
    'short-break': '#4d4d4d',
    'long-break': '#808080',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 -rotate-90"
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#ebebeb"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        stroke={modeStroke[mode]}
        style={{
          transition: 'stroke-dashoffset 1s linear',
          filter: isActive ? `drop-shadow(0 0 4px ${modeStroke[mode]}88)` : 'none',
        }}
      />
    </svg>
  );
}

const modeConfig = {
  focus: { label: 'Focus', icon: Brain, color: '#0a72ef', bgActive: '#171717', textActive: '#ffffff' },
  'short-break': { label: 'Short Break', icon: Coffee, color: 'var(--muted-foreground)', bgActive: '#171717', textActive: '#ffffff' },
  'long-break': { label: 'Long Break', icon: Armchair, color: 'var(--muted-foreground)', bgActive: '#171717', textActive: '#ffffff' },
};

export default function TimerPage() {
  const { timer, tasks, settings, setTimer, resetTimer, switchMode, activeContextNote, clearActiveContext, setPendingReflection } = useStore();
  const [mounted, setMounted] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks the total duration the ring should measure against.
  // Defaults to settings value; updated on custom time input or mode switch.
  const [sessionTotal, setSessionTotal] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const getSettingsDuration = () => {
    switch (timer.mode) {
      case 'focus': return settings.focusDuration * 60;
      case 'short-break': return settings.shortBreakDuration * 60;
      case 'long-break': return settings.longBreakDuration * 60;
    }
  };

  // getTotalDuration is still used for stop/reset, always returns settings-based value
  const getTotalDuration = getSettingsDuration;

  // Progress ring always uses sessionTotal (the actual duration we set), falling back to settings
  const ringTotal = sessionTotal ?? getSettingsDuration();
  const progress = ringTotal > 0 ? Math.max(0, Math.min(1, (ringTotal - timer.timeLeft) / ringTotal)) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isFocusMode = timer.mode === 'focus';
  const hasLinkedTask = timer.linkedTaskId !== null;
  const canStart = !isFocusMode || hasLinkedTask;

  const toggleTimer = () => {
    if (!canStart) {
      toast.warning('Select a task before starting a focus session.');
      return;
    }
    setTimer({ isActive: !timer.isActive });
  };

  const stopTimer = () => {
    const defaultDuration = getTotalDuration();
    const timeSpent = (sessionTotal ?? defaultDuration) - timer.timeLeft;

    if (timer.mode === 'focus' && timer.linkedTaskId && timeSpent > 0) {
      const task = tasks.find((t) => t.id === timer.linkedTaskId);
      if (task) {
        setPendingReflection({ taskId: task.id, taskName: task.title, parentId: timer.resumedCheckpointId });
        toast.info('Session stopped. Process saved.');
      }
    } else {
      toast.info('Timer stopped');
    }

    setTimer({ isActive: false, timeLeft: defaultDuration, startedAt: null });
    setSessionTotal(null); // ring resets to 0%
  };

  const handleTimeClick = () => {
    if (timer.isActive) return; // can't edit while running
    setCustomInput(String(Math.ceil(timer.timeLeft / 60)));
    setIsEditingTime(true);
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const commitCustomTime = () => {
    const mins = parseInt(customInput, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 999) {
      const secs = mins * 60;
      setTimer({ timeLeft: secs, isActive: false });
      setSessionTotal(secs); // ring now measures against this custom total
      toast.success(`Timer set to ${mins}m`);
    }
    setIsEditingTime(false);
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitCustomTime();
    if (e.key === 'Escape') setIsEditingTime(false);
  };

  const handleModeChange = (mode: TimerMode) => {
    switchMode(mode);
    setSessionTotal(null); // reset ring to use settings duration for the new mode
    toast.success(`Switched to ${mode.replace('-', ' ')} mode`);
  };

  const handleTaskLink = (taskId: string) => {
    setTimer({ linkedTaskId: taskId === 'none' ? null : taskId });
    if (taskId !== 'none') {
      const task = tasks.find((t) => t.id === taskId);
      toast.success(`Linked to task: ${task?.title}`);
    } else {
      toast.info('Unlinked from task');
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  if (!mounted) return null;

  const currentMode = modeConfig[timer.mode];

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: "'Geist', Arial, sans-serif",
            fontSize: '40px',
            fontWeight: 600,
            letterSpacing: '-2.4px',
            lineHeight: 1.1,
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Focus Timer
        </h1>
        <p
          style={{
            fontFamily: "'Geist', Arial, sans-serif",
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: 'var(--muted-foreground)',
            marginTop: '8px',
          }}
        >
          Stay focused. Track your sessions.
        </p>
      </div>

      {/* Mode Selector — Large pill buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '40px',
          padding: '4px',
          background: 'var(--muted)',
          boxShadow: 'var(--shadow-border-light)',
          borderRadius: '64px',
          width: 'fit-content',
          margin: '0 auto 40px auto',
        }}
      >
        {(Object.keys(modeConfig) as TimerMode[]).map((mode) => {
          const cfg = modeConfig[mode];
          const Icon = cfg.icon;
          const isActive = timer.mode === mode;
          return (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                background: isActive ? '#171717' : 'transparent',
                color: isActive ? '#ffffff' : '#666666',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                fontFamily: "'Geist', Arial, sans-serif",
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: isActive ? '-0.14px' : 'normal',
              }}
            >
              <Icon style={{ width: '14px', height: '14px' }} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Timer Card */}
      <div
        style={{
          background: 'var(--card)',
          boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
          borderRadius: '12px',
          padding: '48px 32px',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {activeContextNote && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#171717',
            padding: '4px 12px',
            borderRadius: '4px',
          }}>
            <span style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}>
              Resuming:
            </span>
            <span style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '10px',
              color: '#a3a3a3',
              maxWidth: '200px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }} title={activeContextNote}>
              {activeContextNote}
            </span>
          </div>
        )}

        {/* Circular Timer */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '280px',
            height: '280px',
          }}
        >
          <CircularProgress progress={progress} isActive={timer.isActive} mode={timer.mode} />

          {/* Time display — click to set custom duration */}
          <div style={{ zIndex: 10, textAlign: 'center' }}>
            {isEditingTime ? (
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={999}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onBlur={commitCustomTime}
                  onKeyDown={handleTimeKeyDown}
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '64px',
                    fontWeight: 600,
                    letterSpacing: '-2px',
                    lineHeight: 1.0,
                    color: '#171717',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '2px solid #0a72ef',
                    outline: 'none',
                    width: '120px',
                    textAlign: 'center',
                    appearance: 'textfield',
                    MozAppearance: 'textfield',
                  }}
                  autoFocus
                />
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '20px', color: '#808080', fontWeight: 500 }}>min</span>
              </div>
            ) : (
              <div
                onClick={handleTimeClick}
                title={timer.isActive ? undefined : 'Click to set custom time'}
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '64px',
                  fontWeight: 600,
                  letterSpacing: '-2px',
                  lineHeight: 1.0,
                  color: timer.isActive ? 'var(--foreground)' : '#4d4d4d',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.3s ease',
                  cursor: timer.isActive ? 'default' : 'text',
                  userSelect: 'none',
                }}
              >
                {formatTime(timer.timeLeft)}
              </div>
            )}
            <div
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: timer.isActive ? currentMode.color : '#808080',
                marginTop: '8px',
                transition: 'color 0.3s ease',
              }}
            >
              {isEditingTime ? 'SET DURATION' : timer.mode.replace('-', ' ')}
            </div>
            {!timer.isActive && !isEditingTime && (
              <div style={{ fontSize: '11px', color: '#b0b0b0', marginTop: '4px', fontFamily: "'Geist', sans-serif" }}>
                click to edit
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Play / Pause */}
          <button
            onClick={toggleTimer}
            disabled={isFocusMode && !hasLinkedTask}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isFocusMode && !hasLinkedTask ? '#cccccc' : '#171717',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '9999px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: "'Geist', Arial, sans-serif",
              cursor: isFocusMode && !hasLinkedTask ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s ease',
              letterSpacing: '-0.16px',
            }}
          >
            {timer.isActive ? (
              <><Pause style={{ width: '16px', height: '16px' }} /> Pause</>
            ) : (
              <><Play style={{ width: '16px', height: '16px' }} /> Start</>
            )}
          </button>

          {/* Stop — reset to full duration */}
          <button
            onClick={stopTimer}
            title="Stop and reset timer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: timer.isActive ? '#fff0ef' : 'var(--muted)',
              boxShadow: timer.isActive ? 'rgba(255,91,79,0.25) 0px 0px 0px 1px' : 'var(--shadow-border-light)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#fff0ef';
              (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(255,91,79,0.25) 0px 0px 0px 1px';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = timer.isActive ? '#fff0ef' : 'var(--muted)';
              (e.currentTarget as HTMLElement).style.boxShadow = timer.isActive ? 'rgba(255,91,79,0.25) 0px 0px 0px 1px' : 'var(--shadow-border-light)';
            }}
          >
            <Square style={{ width: '15px', height: '15px', color: timer.isActive ? '#ff5b4f' : 'var(--muted-foreground)', fill: timer.isActive ? '#ff5b4f' : 'var(--muted-foreground)' }} />
          </button>

          {/* Reset to default */}
          <button
            onClick={resetTimer}
            title="Reset to default duration"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--card)',
              boxShadow: 'var(--shadow-border-light)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--muted)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--card)')}
          >
            <RotateCcw style={{ width: '16px', height: '16px', color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        {/* Task selector */}
        <div style={{ width: '100%', maxWidth: '360px', marginTop: '32px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--muted-foreground)',
              marginBottom: '8px',
              fontFamily: "'Geist Mono', monospace",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {isFocusMode ? 'TASK REQUIRED' : 'LINKED TASK'}
          </label>

          <div style={{ boxShadow: 'var(--shadow-border)', borderRadius: '6px', overflow: 'hidden' }}>
            <Select
              value={timer.linkedTaskId || 'none'}
              onValueChange={handleTaskLink}
            >
              <SelectTrigger
                className={cn('border-0 shadow-none bg-white')}
                style={{ boxShadow: 'none', border: 'none' }}
              >
                <SelectValue placeholder="Select a task..." />
              </SelectTrigger>
              <SelectContent>
                {!isFocusMode && <SelectItem value="none">None</SelectItem>}
                {activeTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
                {activeTasks.length === 0 && (
                  <SelectItem value="none" disabled>
                    No active tasks available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Required task warning */}
          {isFocusMode && !hasLinkedTask && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginTop: '10px',
                padding: '10px 12px',
                background: 'var(--muted)',
                boxShadow: 'rgba(0,0,0,0.06) 0px 0px 0px 1px',
                borderRadius: '6px',
              }}
            >
              <Info style={{ width: '13px', height: '13px', color: '#0a72ef', flexShrink: 0, marginTop: '1px' }} />
              <span
                style={{
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: 'var(--muted-foreground)',
                  fontFamily: "'Geist', Arial, sans-serif",
                }}
              >
                A task must be selected to start a focus session.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
