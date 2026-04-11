'use client';

import { useMemo } from 'react';
import { Task } from '@/lib/store';
import { Progress } from '@/components/ui/progress';

interface ProjectProgressViewProps {
  tasks: Task[];
}

export function ProjectProgressView({ tasks }: ProjectProgressViewProps) {
  const projectGroups = useMemo(() => {
    // Group all tasks (including completed) by project
    const groups: Record<string, { total: number; completed: number }> = {};

    for (const task of tasks) {
      const projectKey = task.project?.trim() || 'No Project';
      if (!groups[projectKey]) {
        groups[projectKey] = { total: 0, completed: 0 };
      }
      groups[projectKey].total += 1;
      if (task.status === 'completed') {
        groups[projectKey].completed += 1;
      }
    }

    // Filter out empty projects (safety check) and sort by name
    return Object.entries(groups)
      .filter(([, data]) => data.total > 0)
      .sort(([a], [b]) => {
        // Put "No Project" last
        if (a === 'No Project') return 1;
        if (b === 'No Project') return -1;
        return a.localeCompare(b);
      });
  }, [tasks]);

  if (projectGroups.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        No projects defined. Add a Project field to your tasks to see progress here.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {projectGroups.map(([projectName, data]) => {
        const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        return (
          <div key={projectName} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate max-w-[60%]">{projectName}</span>
              <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                <span className="text-xs">
                  {data.completed}/{data.total} tasks
                </span>
                <span className="font-semibold tabular-nums text-foreground w-10 text-right">
                  {percentage}%
                </span>
              </div>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        );
      })}
    </div>
  );
}
