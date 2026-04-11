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

// Color scale based on minutes focused
function getColor(minutes: number): string {
  if (minutes === 0) return 'hsl(220, 10%, 18%)';
  if (minutes <= 30) return 'hsl(220, 60%, 32%)';
  if (minutes <= 60) return 'hsl(225, 70%, 45%)';
  if (minutes <= 90) return 'hsl(240, 75%, 55%)';
  return 'hsl(270, 80%, 62%)';
}

export function FocusHeatmap({ tasks }: FocusHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Build a map: dateString (YYYY-MM-DD) -> minutes focused
  const focusByDay = useMemo(() => {
    const map: Record<string, number> = {};

    for (const task of tasks) {
      // Use completedAt as the proxy for when focus happened
      if (task.completedAt && task.timeSpent > 0) {
        const dateKey = format(new Date(task.completedAt), 'yyyy-MM-dd');
        map[dateKey] = (map[dateKey] ?? 0) + Math.round(task.timeSpent / 60);
      }
    }

    return map;
  }, [tasks]);

  // Build the 52-week grid (364 days back + today = 365 cells)
  const today = startOfDay(new Date());
  const DAYS = 365;
  const COLS = Math.ceil(DAYS / 7); // 53 cols

  // Start from exactly (DAYS-1) days ago
  const startDate = subDays(today, DAYS - 1);
  // Offset so column 0 starts on a Sunday
  const startDow = getDay(startDate); // 0=Sun, 6=Sat

  // Build cells: [colIndex][rowIndex] = { date, minutes }
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

  // Month label positions: which column does each month start in?
  const monthLabels: Array<{ label: string; col: number }> = [];
  let lastMonth = -1;
  for (let col = 0; col < COLS; col++) {
    const firstValidCell = grid[col].find((c) => c !== null);
    if (firstValidCell) {
      const month = firstValidCell.date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: format(firstValidCell.date, 'MMM'), col });
        lastMonth = month;
      }
    }
  }

  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const SHOW_DOW = [1, 3, 5]; // Mon, Wed, Fri

  const CELL = 13;
  const GAP = 2;
  const LABEL_COL_W = 28;
  const ROW_H = CELL + GAP;
  const COL_W = CELL + GAP;
  const HEADER_H = 20;

  const svgWidth = LABEL_COL_W + COLS * COL_W;
  const svgHeight = HEADER_H + 7 * ROW_H;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        className="text-muted-foreground"
        role="img"
        aria-label="Focus activity heatmap for the last 12 months"
      >
        {/* Month labels */}
        {monthLabels.map(({ label, col }) => (
          <text
            key={`month-${col}`}
            x={LABEL_COL_W + col * COL_W}
            y={14}
            fontSize={10}
            fill="currentColor"
            opacity={0.6}
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
            fontSize={9}
            textAnchor="end"
            fill="currentColor"
            opacity={0.5}
          >
            {DOW_LABELS[dow].slice(0, 1)}
          </text>
        ))}

        {/* Cells */}
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
                      opacity={isHovered ? 0.85 : 1}
                      style={{ cursor: 'default', transition: 'opacity 0.1s' }}
                      onMouseEnter={() => setHoveredDay(cell.dateKey)}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <span className="font-medium">{format(cell.date, 'EEEE, MMM d, yyyy')}</span>
                    <br />
                    {cell.minutes > 0 ? `${cell.minutes} min focused` : 'No focus time recorded'}
                  </TooltipContent>
                </Tooltip>
              </g>
            );
          })
        )}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <svg width={70} height={12}>
          {[0, 20, 45, 75, 100].map((mins, i) => (
            <rect key={mins} x={i * 14} y={0} width={11} height={11} rx={2} fill={getColor(mins)} />
          ))}
        </svg>
        <span>More</span>
      </div>
    </div>
  );
}
