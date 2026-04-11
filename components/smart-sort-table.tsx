'use client';

import { useState, useMemo, useRef } from 'react';
import { Task, TaskPriority } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDuration } from '@/lib/utils/format-duration';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowUpDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortKey = 'smartScore' | 'deadline' | 'priority' | 'status';
type SortDir = 'asc' | 'desc';

const PRIORITY_SCORE: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const STATUS_ORDER: Record<string, number> = {
  'in-progress': 0,
  'todo': 1,
  'completed': 2,
};

function calcSmartScore(task: Task, now: number): number {
  const priorityScore = PRIORITY_SCORE[task.priority];
  const focusMinutes = task.timeSpent / 60;

  let remainingDays: number;
  if (task.deadline) {
    const msRemaining = task.deadline - now;
    remainingDays = Math.max(0.1, msRemaining / (1000 * 60 * 60 * 24));
  } else {
    // No deadline: treat as very low urgency so it sorts below deadline tasks
    remainingDays = 999;
  }

  // Higher priority + fewer remaining days + more focus invested = higher score
  return priorityScore * (1 / remainingDays) * (1 + focusMinutes);
}

function SortIcon({ sortKey, current, dir }: { sortKey: SortKey; current: SortKey; dir: SortDir }) {
  if (current !== sortKey) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === 'asc'
    ? <ArrowUp className="h-3 w-3" />
    : <ArrowDown className="h-3 w-3" />;
}

interface SmartSortTableProps {
  tasks: Task[];
}

export function SmartSortTable({ tasks }: SmartSortTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('smartScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // eslint-disable-next-line react-hooks/purity
  const nowRef = useRef<number>(Date.now());
  const now = nowRef.current;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'deadline' ? 'asc' : 'desc');
    }
  };

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'smartScore': {
          const scoreA = calcSmartScore(a, now);
          const scoreB = calcSmartScore(b, now);
          comparison = scoreB - scoreA;
          break;
        }
        case 'deadline': {
          const dA = a.deadline ?? Infinity;
          const dB = b.deadline ?? Infinity;
          comparison = dA - dB;
          break;
        }
        case 'priority': {
          comparison = PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
          break;
        }
        case 'status': {
          comparison = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
          break;
        }
      }

      return sortDir === 'asc' ? -comparison : comparison;
    });
  }, [tasks, sortKey, sortDir, now]);

  if (tasks.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        No tasks to display.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Project</th>
            <th className="px-3 py-3 text-left font-medium text-muted-foreground">
              <button
                onClick={() => handleSort('priority')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Priority
                <SortIcon sortKey="priority" current={sortKey} dir={sortDir} />
              </button>
            </th>
            <th className="px-3 py-3 text-left font-medium text-muted-foreground">
              <button
                onClick={() => handleSort('deadline')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Deadline
                <SortIcon sortKey="deadline" current={sortKey} dir={sortDir} />
              </button>
            </th>
            <th className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell">
              Focus Time
            </th>
            <th className="px-3 py-3 text-left font-medium text-muted-foreground">
              <button
                onClick={() => handleSort('status')}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Status
                <SortIcon sortKey="status" current={sortKey} dir={sortDir} />
              </button>
            </th>
            <th className="px-3 py-3 text-right font-medium text-muted-foreground">
              <button
                onClick={() => handleSort('smartScore')}
                className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors"
              >
                Smart Score
                <SortIcon sortKey="smartScore" current={sortKey} dir={sortDir} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task, i) => {
            const score = calcSmartScore(task, now);
            const remainingDays = task.deadline
              ? Math.max(0, Math.ceil((task.deadline - now) / (1000 * 60 * 60 * 24)))
              : null;
            const focusMinutes = Math.round(task.timeSpent / 60);
            const isOverdue = task.deadline && task.deadline < now && task.status !== 'completed';

            return (
              <tr
                key={task.id}
                className={cn(
                  'border-b transition-colors last:border-0',
                  i % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                  'hover:bg-muted/40'
                )}
              >
                {/* Title */}
                <td className="px-4 py-3 font-medium max-w-[180px] truncate">
                  <span className={cn(task.status === 'completed' && 'line-through text-muted-foreground')}>
                    {task.title}
                  </span>
                </td>

                {/* Project */}
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {task.project || <span className="opacity-40">—</span>}
                </td>

                {/* Priority */}
                <td className="px-3 py-3">
                  <Badge
                    variant={
                      task.priority === 'high'
                        ? 'destructive'
                        : task.priority === 'medium'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={cn(
                      'capitalize text-xs',
                      task.priority === 'medium' &&
                        'bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-200'
                    )}
                  >
                    {task.priority}
                  </Badge>
                </td>

                {/* Deadline */}
                <td className="px-3 py-3 text-xs">
                  {task.deadline ? (
                    <span className={cn(isOverdue && 'text-destructive font-medium')}>
                      {format(task.deadline, 'MMM d')}
                      {remainingDays !== null && remainingDays <= 3 && task.status !== 'completed' && (
                        <span className="ml-1 text-muted-foreground">
                          ({remainingDays === 0 ? 'today' : `${remainingDays}d`})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="opacity-40">—</span>
                  )}
                </td>

                {/* Focus Time */}
                <td className="hidden px-3 py-3 text-xs text-muted-foreground md:table-cell">
                  {task.timeSpent > 0 ? formatDuration(task.timeSpent) : <span className="opacity-40">—</span>}
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      task.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : task.status === 'in-progress'
                        ? 'bg-blue-500/15 text-blue-600'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                  </span>
                </td>

                {/* Smart Score with tooltip */}
                <td className="px-3 py-3 text-right">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-end gap-1 cursor-default tabular-nums font-mono text-xs">
                        {score.toFixed(3)}
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[220px] text-xs space-y-1">
                      <p className="font-semibold">Smart Score Breakdown</p>
                      <p>Priority: {PRIORITY_SCORE[task.priority]} ({task.priority})</p>
                      <p>
                        Urgency: 1 / {remainingDays !== null ? `${remainingDays.toFixed(1)} days` : '999 (no deadline)'}
                      </p>
                      <p>Focus invested: {focusMinutes} min</p>
                      <p className="text-muted-foreground pt-1 border-t border-border mt-1">
                        Formula: Priority x (1 / Remaining Days) x (1 + Focus Minutes)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
