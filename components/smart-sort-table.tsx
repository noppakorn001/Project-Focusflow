'use client';

import { useState, useMemo, useRef } from 'react';
import { Task, TaskPriority } from '@/lib/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDuration } from '@/lib/utils/format-duration';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowUpDown, Info } from 'lucide-react';

type SortKey = 'smartScore' | 'deadline' | 'priority' | 'status';
type SortDir = 'asc' | 'desc';

const PRIORITY_SCORE: Record<TaskPriority, number> = {
  high: 3, medium: 2, low: 1,
};

const STATUS_ORDER: Record<string, number> = {
  'in-progress': 0, 'todo': 1, 'completed': 2,
};

function calcSmartScore(task: Task, now: number): number {
  const priorityScore = PRIORITY_SCORE[task.priority];
  const focusMinutes = task.timeSpent / 60;
  let remainingDays: number;
  if (task.deadline) {
    const msRemaining = task.deadline - now;
    remainingDays = Math.max(0.1, msRemaining / (1000 * 60 * 60 * 24));
  } else {
    remainingDays = 999;
  }
  return priorityScore * (1 / remainingDays) * (1 + focusMinutes);
}

function SortIcon({ sortKey, current, dir }: { sortKey: SortKey; current: SortKey; dir: SortDir }) {
  const style = { width: '10px', height: '10px', color: current === sortKey ? '#0a72ef' : '#808080' };
  if (current !== sortKey) return <ArrowUpDown style={style} />;
  return dir === 'asc' ? <ArrowUp style={style} /> : <ArrowDown style={style} />;
}

const priorityColor: Record<string, string> = { high: '#ff5b4f', medium: '#de1d8d', low: '#0a72ef' };
const priorityBg: Record<string, string> = { high: '#fff0ef', medium: '#fdf0f8', low: '#ebf5ff' };

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
          comparison = calcSmartScore(b, now) - calcSmartScore(a, now);
          break;
        }
        case 'deadline': {
          comparison = (a.deadline ?? Infinity) - (b.deadline ?? Infinity);
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '120px',
          background: '#fafafa',
          boxShadow: 'rgba(0,0,0,0.06) 0px 0px 0px 1px',
          borderRadius: '8px',
        }}
      >
        <p style={{ fontFamily: "'Geist', Arial, sans-serif", fontSize: '13px', color: '#808080' }}>
          No tasks to display.
        </p>
      </div>
    );
  }

  const thStyle = {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontFamily: "'Geist Mono', monospace",
    fontSize: '11px',
    fontWeight: 500,
    color: '#808080',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    background: '#fafafa',
    borderBottom: '1px solid #ebebeb',
    whiteSpace: 'nowrap' as const,
  };

  const tdStyle = {
    padding: '12px 14px',
    borderBottom: '1px solid #ebebeb',
    fontFamily: "'Geist', Arial, sans-serif",
    fontSize: '14px',
    verticalAlign: 'middle' as const,
  };

  return (
    <div
      style={{
        background: '#ffffff',
        boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: 'none',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={{ ...thStyle, display: 'none' }} className="sm-show">Project</th>
              <th style={thStyle}>
                <button
                  onClick={() => handleSort('priority')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', color: sortKey === 'priority' ? '#171717' : '#808080', letterSpacing: 'inherit', textTransform: 'inherit', padding: 0 }}
                >
                  Priority <SortIcon sortKey="priority" current={sortKey} dir={sortDir} />
                </button>
              </th>
              <th style={thStyle}>
                <button
                  onClick={() => handleSort('deadline')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', color: sortKey === 'deadline' ? '#171717' : '#808080', letterSpacing: 'inherit', textTransform: 'inherit', padding: 0 }}
                >
                  Deadline <SortIcon sortKey="deadline" current={sortKey} dir={sortDir} />
                </button>
              </th>
              <th style={thStyle}>
                <button
                  onClick={() => handleSort('status')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', color: sortKey === 'status' ? '#171717' : '#808080', letterSpacing: 'inherit', textTransform: 'inherit', padding: 0 }}
                >
                  Status <SortIcon sortKey="status" current={sortKey} dir={sortDir} />
                </button>
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }}>
                <button
                  onClick={() => handleSort('smartScore')}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', color: sortKey === 'smartScore' ? '#171717' : '#808080', letterSpacing: 'inherit', textTransform: 'inherit', padding: 0, marginLeft: 'auto' }}
                >
                  Smart Score <SortIcon sortKey="smartScore" current={sortKey} dir={sortDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => {
              const score = calcSmartScore(task, now);
              const remainingDays = task.deadline
                ? Math.max(0, Math.ceil((task.deadline - now) / (1000 * 60 * 60 * 24)))
                : null;
              const focusMinutes = Math.round(task.timeSpent / 60);
              const isOverdue = task.deadline && task.deadline < now && task.status !== 'completed';

              const statusConfig = {
                completed: { bg: '#ebf5ff', color: '#0068d6', label: 'Done' },
                'in-progress': { bg: '#fdf0f8', color: '#de1d8d', label: 'In Progress' },
                todo: { bg: '#fafafa', color: '#666666', label: 'To Do' },
              };
              const sc = statusConfig[task.status] || statusConfig.todo;

              return (
                <tr
                  key={task.id}
                  style={{ transition: 'background 0.1s ease' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ffffff')}
                >
                  {/* Title */}
                  <td style={{ ...tdStyle, maxWidth: '200px' }}>
                    <span
                      style={{
                        fontWeight: 500,
                        color: task.status === 'completed' ? '#808080' : '#171717',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.title}
                    </span>
                    {task.project && (
                      <span style={{ fontSize: '12px', color: '#808080', display: 'block', marginTop: '2px' }}>
                        {task.project}
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-flex',
                        background: priorityBg[task.priority] || '#fafafa',
                        color: priorityColor[task.priority] || '#666666',
                        borderRadius: '9999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        fontFamily: "'Geist Mono', monospace",
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {task.priority}
                    </span>
                  </td>

                  {/* Deadline */}
                  <td style={tdStyle}>
                    {task.deadline ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '12px',
                          color: isOverdue ? '#ff5b4f' : '#4d4d4d',
                          fontWeight: isOverdue ? 600 : 400,
                        }}
                      >
                        {format(task.deadline, 'MMM d')}
                        {remainingDays !== null && remainingDays <= 3 && task.status !== 'completed' && (
                          <span style={{ color: '#808080' }}>
                            ({remainingDays === 0 ? 'today' : `${remainingDays}d`})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: '#cccccc', fontFamily: "'Geist Mono', monospace", fontSize: '12px' }}>—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: sc.bg,
                        color: sc.color,
                        borderRadius: '9999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        fontFamily: "'Geist Mono', monospace",
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {sc.label}
                    </span>
                  </td>

                  {/* Smart Score */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                            cursor: 'default',
                            background: '#ebf5ff',
                            color: '#0068d6',
                            borderRadius: '9999px',
                            padding: '2px 8px',
                            fontSize: '12px',
                            fontWeight: 500,
                            fontFamily: "'Geist Mono', monospace",
                          }}
                        >
                          {score.toFixed(3)}
                          <Info style={{ width: '10px', height: '10px' }} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="left"
                        style={{
                          background: '#ffffff',
                          boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 16px',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          maxWidth: '220px',
                        }}
                      >
                        <p style={{ fontFamily: "'Geist', sans-serif", fontSize: '13px', fontWeight: 600, color: '#171717', margin: '0 0 8px 0' }}>
                          Smart Score
                        </p>
                        <p style={{ fontFamily: "'Geist', sans-serif", fontSize: '12px', color: '#4d4d4d', margin: '2px 0' }}>Priority: {PRIORITY_SCORE[task.priority]} ({task.priority})</p>
                        <p style={{ fontFamily: "'Geist', sans-serif", fontSize: '12px', color: '#4d4d4d', margin: '2px 0' }}>
                          Urgency: 1 / {remainingDays !== null ? `${remainingDays.toFixed(1)}d` : '999 (no deadline)'}
                        </p>
                        <p style={{ fontFamily: "'Geist', sans-serif", fontSize: '12px', color: '#4d4d4d', margin: '2px 0' }}>Focus: {focusMinutes} min</p>
                        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: '#808080', margin: '8px 0 0 0', paddingTop: '8px', borderTop: '1px solid #ebebeb' }}>
                          Priority × (1/Days) × (1+Focus)
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
    </div>
  );
}
