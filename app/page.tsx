'use client';

import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { tasks, timer, setTimer } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setTimer({ isActive: !timer.isActive });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch by rendering nothing on server/initial client
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}</h1>
          <p className="text-muted-foreground">Here&apos;s your productivity overview for today.</p>
        </div>
        <div className="flex gap-2">
           {/* Add quick actions if needed */}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks.length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(tasks.reduce((acc, t) => acc + t.timeSpent, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total time spent
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Current Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-6xl font-bold tabular-nums tracking-tighter">
                {formatTime(timer.timeLeft)}
              </div>
              <p className="mt-2 text-muted-foreground capitalize">{timer.mode.replace('-', ' ')}</p>
              
              <div className="mt-8 flex gap-4">
                <Button size="lg" className="w-32" onClick={toggleTimer}>
                  {timer.isActive ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" /> Start
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/timer">Full Timer</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="font-medium">{task.title}</span>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/tasks">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
              {activeTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No active tasks.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
