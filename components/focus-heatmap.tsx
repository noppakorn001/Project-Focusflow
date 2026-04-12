'use client';

import { useMemo, useState } from 'react';
import { Task } from '@/lib/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, subDays, startOfDay, getDay } from 'date-fns';

interface FocusHeatmapProps {
  tasks: Task[];
}

// Vercel-inspired blue gradient: empty = #fafafa → full = #0a72ef
function getColor(minutes: number): string {
  if (minutes === 0) return '#ebebeb';
  if (minutes <= 20) return '#c8dff9';
  if (minutes <= 45) return '#7bb6f4';
  if (minutes <= 90) return '#2e8ef0';
  return '#0a72ef';
}

export function FocusHeatmap({ tasks }: FocusHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const focusByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of tasks) {
      if (task.completedAt && task.timeSpent > 0) {
        const dateKey = format(new Date(task.completedAt), 'yyyy-MM-dd');
        map[dateKey] = (map[dateKey] ?? 0) + Math.round(task.timeSpent / 60);
      }
    }
    return map;
  }, [tasks]);

  const today = startOfDay(new Date());
  const DAYS = 365;
  const COLS = Math.ceil(DAYS / 7);
  const startDate = subDays(today, DAYS - 1);
  const startDow = getDay(startDate);

  const grid: Array<Array<{ date: Date; dateKey: string; minutes: number } | null>> = [];
  for (let col = 0; col < COLS; col++) {
    const colCells: Array<{ date: Date; dateKey: string; minutes: number } | null> = [];
    for (let row = 0; row < 7; row++) {
      const dayIndex = col * 7 + row - startDow;
      if (dayIndex < 0 || dayIndex >= DAYS) {
        colCells.push(null);
      } else {
        const date = subDays(today, DAYS - 1 - dayIndex);
        const dateKey = format(date, 'yyyy-MM-dd');
        colCells.push({ date, dateKey, minutes: focusByDay[dateKey] ?? 0 });
      }
    }
    grid.push(colCells);
  }

  const monthLabels: Array<{ label: string; col: number }> = [];
  let lastMonth = -1;
  for (let col = 0; col < COLS; col++) {
    const firstValidCell = grid[col].find((c) => c !== null);
    if (firstValidCell) {
      const month = firstValidCell.date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: format(firstValidCell.date, 'MMM').toUpperCase(), col });
        lastMonth = month;
      }
    }
  }

  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const SHOW_DOW = [1, 3, 5];

  const CELL = 12;
  const GAP = 3;
  const LABEL_COL_W = 26;
  const ROW_H = CELL + GAP;
  const COL_W = CELL + GAP;
  const HEADER_H = 20;

  const svgWidth = LABEL_COL_W + COLS * COL_W;
  const svgHeight = HEADER_H + 7 * ROW_H;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        role="img"
        aria-label="Focus activity heatmap for the last 12 months"
      >
        {/* Month labels — Geist Mono uppercase */}
        {monthLabels.map(({ label, col }) => (
          <text
            key={`month-${col}`}
            x={LABEL_COL_W + col * COL_W}
            y={13}
            fontSize={9}
            fontFamily="'Geist Mono', monospace"
            fontWeight={500}
            fill="#808080"
            letterSpacing="0.04em"
          >
            {label}
          </text>
        ))}

        {/* Day-of-week labels */}
        {SHOW_DOW.map((dow) => (
          <text
            key={`dow-${dow}`}
            x={LABEL_COL_W - 4}
            y={HEADER_H + dow * ROW_H + CELL - 2}
            fontSize={8}
            fontFamily="'Geist Mono', monospace"
            fontWeight={500}
            textAnchor="end"
            fill="#808080"
          >
            {DOW_LABELS[dow].slice(0, 1)}
          </text>
        ))}

        {/* Heatmap cells */}
        {grid.map((colCells, colIdx) =>
          colCells.map((cell, rowIdx) => {
            if (!cell) return null;
            const x = LABEL_COL_W + colIdx * COL_W;
            const y = HEADER_H + rowIdx * ROW_H;
            const isHovered = hoveredDay === cell.dateKey;

            return (
              <g key={`cell-${colIdx}-${rowIdx}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <rect
                      x={x}
                      y={y}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      fill={getColor(cell.minutes)}
                      opacity={isHovered ? 0.75 : 1}
                      style={{ cursor: 'default', transition: 'opacity 0.1s ease' }}
                      onMouseEnter={() => setHoveredDay(cell.dateKey)}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    style={{
                      background: 'var(--card)',
                      boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <span style={{ fontFamily: "'Geist', Arial, sans-serif", fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', display: 'block' }}>
                      {format(cell.date, 'EEEE, MMM d, yyyy')}
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: 'var(--muted-foreground)' }}>
                      {cell.minutes > 0 ? `${cell.minutes} min focused` : 'No focus time'}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </g>
            );
          })
        )}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px',
        }}
      >
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '10px',
            color: 'var(--muted-foreground)',
            letterSpacing: '0.04em',
          }}
        >
          LESS
        </span>
        <svg width={72} height={12}>
          {[0, 20, 45, 75, 100].map((mins, i) => (
            <rect key={mins} x={i * 15} y={0} width={12} height={12} rx={2} fill={getColor(mins)} />
          ))}
        </svg>
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '10px',
            color: 'var(--muted-foreground)',
            letterSpacing: '0.04em',
          }}
        >
          MORE
        </span>
      </div>
    </div>
  );
}
