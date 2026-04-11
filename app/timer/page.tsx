'use client';

import { useStore, TimerMode } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Coffee, Brain, Armchair, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

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
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const modeColors: Record<TimerMode, string> = {
    'focus': 'stroke-primary',
    'short-break': 'stroke-emerald-500',
    'long-break': 'stroke-blue-500',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 -rotate-90"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/20"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className={cn(
          modeColors[mode],
          'transition-[stroke-dashoffset] duration-1000 ease-linear',
          isActive && 'drop-shadow-[0_0_6px_currentColor]'
        )}
      />
    </svg>
  );
}

export default function TimerPage() {
  const { timer, tasks, settings, setTimer, resetTimer, switchMode } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Calculate total duration for progress ring
  const getTotalDuration = () => {
    switch (timer.mode) {
      case 'focus': return settings.focusDuration * 60;
      case 'short-break': return settings.shortBreakDuration * 60;
      case 'long-break': return settings.longBreakDuration * 60;
    }
  };

  const totalDuration = getTotalDuration();
  const progress = totalDuration > 0 ? (totalDuration - timer.timeLeft) / totalDuration : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isFocusMode = timer.mode === 'focus';
  const hasLinkedTask = timer.linkedTaskId !== null;

  // In focus mode, a task must be selected before starting
  const canStart = !isFocusMode || hasLinkedTask;

  const toggleTimer = () => {
    if (!canStart) {
      toast.warning('Select a task before starting a focus session.');
      return;
    }
    setTimer({ isActive: !timer.isActive });
  };

  const handleModeChange = (mode: TimerMode) => {
    switchMode(mode);
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

  if (!mounted) {
    return null;
  }

  const modeLabel = timer.mode === 'focus' ? 'Focus' : timer.mode === 'short-break' ? 'Short Break' : 'Long Break';

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Focus Timer</h1>
        <p className="text-muted-foreground">Stay focused and track your productivity.</p>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant={timer.mode === 'focus' ? 'default' : 'outline'}
          onClick={() => handleModeChange('focus')}
          className="gap-2"
          size="sm"
        >
          <Brain className="h-4 w-4" /> Focus
        </Button>
        <Button
          variant={timer.mode === 'short-break' ? 'default' : 'outline'}
          onClick={() => handleModeChange('short-break')}
          className="gap-2"
          size="sm"
        >
          <Coffee className="h-4 w-4" /> Short Break
        </Button>
        <Button
          variant={timer.mode === 'long-break' ? 'default' : 'outline'}
          onClick={() => handleModeChange('long-break')}
          className="gap-2"
          size="sm"
        >
          <Armchair className="h-4 w-4" /> Long Break
        </Button>
      </div>

      {/* Timer Display with Circular Progress */}
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
          {/* Circular Timer Container */}
          <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
            <CircularProgress progress={progress} isActive={timer.isActive} mode={timer.mode} />

            {/* Time Display */}
            <div className="z-10 flex flex-col items-center">
              <div
                className={cn(
                  'text-6xl sm:text-7xl font-bold tabular-nums tracking-tighter transition-colors duration-500',
                  timer.isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {formatTime(timer.timeLeft)}
              </div>
              <p className={cn(
                'mt-1 text-sm font-medium capitalize transition-colors',
                timer.isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {modeLabel}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex w-full max-w-xs flex-col gap-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className={cn(
                  'h-14 w-32 rounded-full text-lg transition-all duration-200',
                  timer.isActive && 'shadow-lg shadow-primary/25',
                  isFocusMode && !hasLinkedTask && 'opacity-50 cursor-not-allowed'
                )}
                onClick={toggleTimer}
                disabled={isFocusMode && !hasLinkedTask}
              >
                {timer.isActive ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" /> Start
                  </>
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-14 w-14 rounded-full"
                onClick={resetTimer}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {/* Task Link */}
            <div className="mt-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {isFocusMode ? 'Select Task (Required for Focus)' : 'Link to Task (Optional)'}
              </label>
              <Select
                value={timer.linkedTaskId || 'none'}
                onValueChange={handleTaskLink}
              >
                <SelectTrigger>
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

              {/* Inline alert when required */}
              {isFocusMode && !hasLinkedTask && (
                <div className="flex items-start gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    A task must be selected to start a focus session. This links your focus time directly to the task.
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
