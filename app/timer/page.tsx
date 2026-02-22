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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Coffee, Brain, Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export default function TimerPage() {
  const { timer, tasks, setTimer, resetTimer, switchMode } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
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

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Focus Timer</h1>
        <p className="text-muted-foreground">Stay focused and track your productivity.</p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant={timer.mode === 'focus' ? 'default' : 'outline'}
          onClick={() => handleModeChange('focus')}
          className="gap-2"
        >
          <Brain className="h-4 w-4" /> Focus
        </Button>
        <Button
          variant={timer.mode === 'short-break' ? 'default' : 'outline'}
          onClick={() => handleModeChange('short-break')}
          className="gap-2"
        >
          <Coffee className="h-4 w-4" /> Short Break
        </Button>
        <Button
          variant={timer.mode === 'long-break' ? 'default' : 'outline'}
          onClick={() => handleModeChange('long-break')}
          className="gap-2"
        >
          <Armchair className="h-4 w-4" /> Long Break
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className={cn(
            "text-8xl font-bold tabular-nums tracking-tighter transition-colors duration-500",
            timer.isActive ? "text-primary" : "text-muted-foreground"
          )}>
            {formatTime(timer.timeLeft)}
          </div>
          
          <div className="mt-8 flex w-full max-w-xs flex-col gap-4">
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="h-16 w-32 rounded-full text-xl" onClick={toggleTimer}>
                {timer.isActive ? (
                  <>
                    <Pause className="mr-2 h-6 w-6" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-6 w-6" /> Start
                  </>
                )}
              </Button>
              <Button size="icon" variant="outline" className="h-16 w-16 rounded-full" onClick={resetTimer}>
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Link to Task (Optional)
              </label>
              <Select
                value={timer.linkedTaskId || 'none'}
                onValueChange={handleTaskLink}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
