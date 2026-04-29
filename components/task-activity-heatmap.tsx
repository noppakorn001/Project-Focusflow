'use client';

import { useMemo } from 'react';
import type { Checkpoint } from '@/lib/store';

interface Props {
  checkpoints: Checkpoint[];
}

const DAYS = 30;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function TaskActivityHeatmap({ checkpoints }: Props) {
  // Build an array of the last DAYS calendar days (oldest first)
  const days = useMemo(() => {
    const today = startOfDay(Date.now());
    return Array.from({ length: DAYS }, (_, i) => today - (DAYS - 1 - i) * 86_400_000);
  }, []);

  // Aggregate duration per day (seconds)
  const durationByDay = useMemo(() => {
    const map = new Map<number, number>();
    for (const cp of checkpoints) {
      const day = startOfDay(cp.timestamp);
      map.set(day, (map.get(day) ?? 0) + cp.duration);
    }
    return map;
  }, [checkpoints]);

  // Color based on minutes logged that day
  function cellColor(seconds: number): string {
    const minutes = seconds / 60;
    if (minutes === 0)  return 'var(--muted)';          // none
    if (minutes < 25)   return '#404040';               // light activity
    if (minutes < 50)   return '#6e6e6e';               // medium
    if (minutes < 75)   return '#9e9e9e';               // good
    return '#d4d4d4';                                   // 75m+ — max
  }

  const totalSessions = checkpoints.length;
  const totalMinutes  = Math.floor(checkpoints.reduce((s, c) => s + c.duration, 0) / 60);

  if (checkpoints.length === 0) {
    return (
      <div style={{
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          {days.map((day) => (
            <div
              key={day}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: 'var(--muted)',
                boxShadow: 'var(--shadow-border-light)',
              }}
            />
          ))}
        </div>
        <p style={{
          fontSize: '11px',
          fontFamily: "'Geist Mono', monospace",
          color: 'var(--muted-foreground)',
          margin: 0,
          letterSpacing: '0.02em',
        }}>
          NO ACTIVITY — START A FOCUS SESSION TO LOG PROGRESS
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Grid */}
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'wrap' }}>
        {days.map((day) => {
          const seconds = durationByDay.get(day) ?? 0;
          const minutes = Math.round(seconds / 60);
          const d = new Date(day);
          return (
            <div
              key={day}
              title={`${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${minutes}m`}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: cellColor(seconds),
                boxShadow: seconds > 0 ? 'none' : 'var(--shadow-border-light)',
                transition: 'transform 0.1s ease',
                cursor: seconds > 0 ? 'default' : 'default',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.4)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            />
          );
        })}
      </div>

      {/* Legend + stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontFamily: "'Geist Mono', monospace", color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}>
            LESS
          </span>
          {['var(--muted)', '#404040', '#6e6e6e', '#9e9e9e', '#d4d4d4'].map((c, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '2px', background: c, boxShadow: i === 0 ? 'var(--shadow-border-light)' : 'none' }} />
          ))}
          <span style={{ fontSize: '10px', fontFamily: "'Geist Mono', monospace", color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}>
            MORE
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '11px', fontFamily: "'Geist Mono', monospace", color: 'var(--muted-foreground)', letterSpacing: '0.02em' }}>
            {totalSessions} SESSION{totalSessions !== 1 ? 'S' : ''}
          </span>
          <span style={{ fontSize: '11px', fontFamily: "'Geist Mono', monospace", color: 'var(--muted-foreground)', letterSpacing: '0.02em' }}>
            {totalMinutes}m TOTAL
          </span>
        </div>
      </div>
    </div>
  );
}
