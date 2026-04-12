'use client';

import { useMemo } from 'react';
import { Task } from '@/lib/store';

interface ProjectProgressViewProps {
  tasks: Task[];
}

export function ProjectProgressView({ tasks }: ProjectProgressViewProps) {
  const projectGroups = useMemo(() => {
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

    return Object.entries(groups)
      .filter(([, data]) => data.total > 0)
      .sort(([a], [b]) => {
        if (a === 'No Project') return 1;
        if (b === 'No Project') return -1;
        return a.localeCompare(b);
      });
  }, [tasks]);

  if (projectGroups.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '120px',
          background: 'var(--muted)',
          boxShadow: 'rgba(0,0,0,0.06) 0px 0px 0px 1px',
          borderRadius: '8px',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <p
          style={{
            fontFamily: "'Geist', Arial, sans-serif",
            fontSize: '13px',
            color: 'var(--muted-foreground)',
          }}
        >
          No projects defined. Add a Project field to your tasks to see progress here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {projectGroups.map(([projectName, data]) => {
        const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        const isComplete = percentage === 100;

        return (
          <div key={projectName}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "'Geist', Arial, sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '-0.14px',
                    color: 'var(--foreground)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {projectName}
                </span>
                {isComplete && (
                  <span
                    style={{
                      display: 'inline-flex',
                      background: '#ebf5ff',
                      color: '#0068d6',
                      borderRadius: '9999px',
                      padding: '1px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      fontFamily: "'Geist Mono', monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}
                  >
                    DONE
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {data.completed}/{data.total}
                </span>
                <span
                  style={{
                    fontFamily: "'Geist', Arial, sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isComplete ? '#0a72ef' : '#171717',
                    minWidth: '36px',
                    textAlign: 'right',
                  }}
                >
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Progress track */}
            <div
              style={{
                height: '4px',
                background: '#ebebeb',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${percentage}%`,
                  background: isComplete ? '#0a72ef' : '#171717',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
