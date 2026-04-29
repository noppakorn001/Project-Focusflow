'use client';

import type { Checkpoint } from '@/lib/store';
import { format } from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CornerDownRight } from 'lucide-react';

interface Props {
  checkpoints: Checkpoint[];
  taskId: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function CheckpointItem({ cp, idx, isLatest, isLast, taskId }: { cp: Checkpoint, idx: number, isLatest: boolean, isLast: boolean, taskId: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const resumeFromContext = useStore((s) => s.resumeFromContext);

  const handleResume = () => {
    resumeFromContext(taskId, cp.note || 'Resuming from checkpoint', cp.id);
    router.push('/timer');
  };

  return (
    <div
      data-checkpoint-id={cp.id}
      style={{ position: 'relative', paddingBottom: isLast ? 0 : '20px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content */}
      <div>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.06em',
            color: 'var(--muted-foreground)',
          }}>
            {format(cp.timestamp, 'MMM d, yyyy · HH:mm')}
          </span>
          <span style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.04em',
            color: 'var(--foreground)',
            background: 'var(--muted)',
            boxShadow: 'var(--shadow-border-light)',
            borderRadius: '4px',
            padding: '1px 6px',
          }}>
            {formatDuration(cp.duration)}
          </span>
          {isLatest && (
            <span style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.04em',
              background: 'var(--foreground)',
              color: 'var(--background)',
              borderRadius: '4px',
              padding: '1px 6px',
            }}>
              LATEST
            </span>
          )}

          {/* Resume Button */}
          {isHovered && (
            <button
              onClick={handleResume}
              title="Resume this context"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: "'Geist Mono', monospace",
                cursor: 'pointer',
                boxShadow: 'var(--shadow-border-light)',
                marginLeft: 'auto',
              }}
            >
              <CornerDownRight size={10} />
              CONTINUE
            </button>
          )}
        </div>

        {/* Note */}
        {cp.note ? (
          <p style={{
            fontFamily: "'Geist', Arial, sans-serif",
            fontSize: '13px',
            color: 'var(--foreground)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {cp.note}
          </p>
        ) : (
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '12px',
            color: 'var(--muted-foreground)',
            margin: 0,
            fontStyle: 'italic',
            letterSpacing: '0.02em',
          }}>
            — no note recorded —
          </p>
        )}
      </div>
    </div>
  );
}

export function CheckpointTimeline({ checkpoints, taskId }: Props) {
  if (checkpoints.length === 0) {
    return (
      <div style={{
        padding: '20px 0',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '12px',
          fontFamily: "'Geist Mono', monospace",
          color: 'var(--muted-foreground)',
          margin: 0,
          letterSpacing: '0.04em',
        }}>
          NO CHECKPOINTS YET — COMPLETE A FOCUS SESSION TO LOG ONE
        </p>
      </div>
    );
  }

  const sorted = [...checkpoints].sort((a, b) => b.timestamp - a.timestamp);

  // Calculate Git graph columns (Bottom-Up)
  // This ensures the original chronological path stays in column 0 (straight line),
  // and any resumed tasks explicitly branch out to new columns.
  const columns: number[] = new Array(sorted.length).fill(0);
  const colAssignment: Record<string, number> = {};
  const parentColumnClaimed: Record<string, boolean> = {};
  let currentMaxCol = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const cp = sorted[i];
    const parentId = cp.parentId || (i + 1 < sorted.length ? sorted[i + 1].id : null);

    if (!parentId) {
      colAssignment[cp.id] = 0;
    } else {
      const parentCol = colAssignment[parentId] ?? 0;
      if (!parentColumnClaimed[parentId]) {
        // First child claims the parent's column (straight line continuation)
        colAssignment[cp.id] = parentCol;
        parentColumnClaimed[parentId] = true;
      } else {
        // Parent's column is taken by an older child; this resume branches out!
        currentMaxCol++;
        colAssignment[cp.id] = currentMaxCol;
      }
    }
    columns[i] = colAssignment[cp.id];
  }

  const maxCols = Math.max(0, ...columns) + 1;
  const colWidth = 14;
  const graphWidth = maxCols * colWidth + 12;

  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const updatePositions = () => {
      const container = containerRef.current!;
      const containerRect = container.getBoundingClientRect();
      const newPos: Record<string, number> = {};
      const dots = container.querySelectorAll<HTMLDivElement>('[data-checkpoint-id]');

      dots.forEach((dot) => {
        const id = dot.getAttribute('data-checkpoint-id');
        if (id) {
          const rect = dot.getBoundingClientRect();
          newPos[id] = rect.top - containerRect.top + 12; // 12px for visual center of header text
        }
      });

      setPositions((prev) => {
        let changed = false;
        const keys = new Set([...Object.keys(prev), ...Object.keys(newPos)]);
        for (const k of keys) {
          if (Math.abs((prev[k] || 0) - (newPos[k] || 0)) > 1) {
            changed = true;
            break;
          }
        }
        return changed ? newPos : prev;
      });
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    const observer = new MutationObserver(updatePositions);
    observer.observe(containerRef.current, { childList: true, subtree: true, characterData: true });

    return () => {
      window.removeEventListener('resize', updatePositions);
      observer.disconnect();
    };
  }, [sorted]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

  const renderGraph = () => {
    const paths: React.ReactElement[] = [];
    const dots: React.ReactElement[] = [];

    sorted.forEach((cp, idx) => {
      const y1 = positions[cp.id];
      if (y1 === undefined) return;

      const col1 = columns[idx];
      const x1 = 10 + col1 * colWidth;
      const color = COLORS[col1 % COLORS.length];

      dots.push(
        <circle
          key={`dot-${cp.id}`}
          cx={x1}
          cy={y1}
          r={idx === 0 ? "4" : "3.5"}
          fill={idx === 0 ? 'var(--background)' : color}
          stroke={color}
          strokeWidth="2"
        />
      );

      const parentId = cp.parentId || (idx + 1 < sorted.length ? sorted[idx + 1].id : null);
      if (!parentId) return;

      const parentIdx = sorted.findIndex(c => c.id === parentId);
      if (parentIdx === -1) return;

      const y2 = positions[parentId];
      if (y2 === undefined) return;

      const col2 = columns[parentIdx];
      const x2 = 10 + col2 * colWidth;

      if (col1 === col2) {
        paths.push(
          <line
            key={`line-${cp.id}-${parentId}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="2"
          />
        );
      } else {
        const midY = y1 + (y2 - y1) / 2;
        paths.push(
          <path
            key={`line-${cp.id}-${parentId}`}
            d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        );
      }
    });

    return (
      <svg style={{ position: 'absolute', left: 0, top: 0, width: graphWidth, height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        {paths}
        {dots}
      </svg>
    );
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: `${graphWidth}px` }}>
      {renderGraph()}

      {sorted.map((cp, idx) => (
        <CheckpointItem 
          key={cp.id} 
          cp={cp} 
          idx={idx} 
          isLatest={idx === 0} 
          isLast={idx === sorted.length - 1} 
          taskId={taskId} 
        />
      ))}
    </div>
  );
}
