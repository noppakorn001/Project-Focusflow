'use client';

import { useStore } from '@/lib/store';
import { Play, Pause, CheckCircle2, Clock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDuration } from '@/lib/utils/format-duration';

export default function Dashboard() {
  const { tasks, timer, setTimer } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');

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

  const totalFocusSeconds = tasks.reduce((acc, t) => acc + t.timeSpent, 0);
  const completionRate = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  if (!mounted) return null;

  const priorityColor: Record<string, string> = {
    high: '#ff5b4f',
    medium: '#de1d8d',
    low: '#0a72ef',
  };

  const priorityBg: Record<string, string> = {
    high: '#fff0ef',
    medium: '#fdf0f8',
    low: '#ebf5ff',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: "'Geist', Arial, sans-serif",
            fontSize: '40px',
            fontWeight: 600,
            letterSpacing: '-2.4px',
            lineHeight: 1.1,
            color: '#171717',
            margin: 0,
          }}
        >
          {getGreeting()}
        </h1>
        <p
          style={{
            fontFamily: "'Geist', Arial, sans-serif",
            fontSize: '18px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: '#4d4d4d',
            marginTop: '8px',
          }}
        >
          Here&apos;s your productivity overview for today.
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Total Tasks */}
        <div
          style={{
            background: '#ffffff',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
            borderRadius: '8px',
            padding: '24px',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#666666', letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Geist Mono', monospace" }}>
              TOTAL TASKS
            </span>
            <CheckCircle2 style={{ width: '16px', height: '16px', color: '#808080' }} />
          </div>
          <div
            style={{
              fontFamily: "'Geist', Arial, sans-serif",
              fontSize: '48px',
              fontWeight: 600,
              letterSpacing: '-2.4px',
              lineHeight: 1.0,
              color: '#171717',
            }}
          >
            {tasks.length}
          </div>
          <p style={{ fontSize: '13px', color: '#666666', marginTop: '6px' }}>
            {completedTasks.length} completed
          </p>
        </div>

        {/* Focus Time */}
        <div
          style={{
            background: '#ffffff',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
            borderRadius: '8px',
            padding: '24px',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#666666', letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Geist Mono', monospace" }}>
              FOCUS TIME
            </span>
            <Clock style={{ width: '16px', height: '16px', color: '#808080' }} />
          </div>
          <div
            style={{
              fontFamily: "'Geist', Arial, sans-serif",
              fontSize: '40px',
              fontWeight: 600,
              letterSpacing: '-2.0px',
              lineHeight: 1.0,
              color: '#171717',
            }}
          >
            {formatDuration(totalFocusSeconds)}
          </div>
          <p style={{ fontSize: '13px', color: '#666666', marginTop: '6px' }}>
            Total logged
          </p>
        </div>

        {/* Completion Rate */}
        <div
          style={{
            background: '#ffffff',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
            borderRadius: '8px',
            padding: '24px',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#666666', letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Geist Mono', monospace" }}>
              COMPLETION
            </span>
            <Zap style={{ width: '16px', height: '16px', color: '#808080' }} />
          </div>
          <div
            style={{
              fontFamily: "'Geist', Arial, sans-serif",
              fontSize: '48px',
              fontWeight: 600,
              letterSpacing: '-2.4px',
              lineHeight: 1.0,
              color: '#171717',
            }}
          >
            {completionRate}%
          </div>
          <p style={{ fontSize: '13px', color: '#666666', marginTop: '6px' }}>
            Task completion rate
          </p>
        </div>

        {/* Active Tasks */}
        <div
          style={{
            background: '#ffffff',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
            borderRadius: '8px',
            padding: '24px',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#666666', letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Geist Mono', monospace" }}>
              IN PROGRESS
            </span>
            <Play style={{ width: '16px', height: '16px', color: '#808080' }} />
          </div>
          <div
            style={{
              fontFamily: "'Geist', Arial, sans-serif",
              fontSize: '48px',
              fontWeight: 600,
              letterSpacing: '-2.4px',
              lineHeight: 1.0,
              color: '#171717',
            }}
          >
            {inProgressTasks.length}
          </div>
          <p style={{ fontSize: '13px', color: '#666666', marginTop: '6px' }}>
            Tasks in progress
          </p>
        </div>
      </div>

      {/* Main Grid: Timer + Recent Tasks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
        className="dashboard-grid"
      >
        {/* Current Focus Timer */}
        <div
          style={{
            background: '#ffffff',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
            borderRadius: '8px',
            padding: '32px',
            border: 'none',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontFamily: "'Geist', Arial, sans-serif",
                fontSize: '18px',
                fontWeight: 600,
                letterSpacing: '-0.36px',
                color: '#171717',
                margin: 0,
              }}
            >
              Current Focus
            </h2>
            <p style={{ fontSize: '13px', color: '#666666', marginTop: '4px' }}>
              Quick timer control
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 0',
            }}
          >
            {/* Timer digits */}
            <div
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '72px',
                fontWeight: 600,
                letterSpacing: '-2px',
                lineHeight: 1.0,
                color: timer.isActive ? '#171717' : '#808080',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.3s ease',
              }}
            >
              {formatTime(timer.timeLeft)}
            </div>

            {/* Mode label */}
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: timer.isActive
                    ? '#0a72ef'
                    : timer.mode === 'short-break'
                    ? '#666666'
                    : timer.mode === 'long-break'
                    ? '#666666'
                    : '#cccccc',
                  transition: 'background 0.3s ease',
                }}
              />
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#808080',
                }}
              >
                {timer.mode.replace('-', ' ')}
              </span>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button
                onClick={toggleTimer}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#171717',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: "'Geist', Arial, sans-serif",
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                  minWidth: '120px',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '0.85')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '1')}
              >
                {timer.isActive ? (
                  <><Pause style={{ width: '14px', height: '14px' }} /> Pause</>
                ) : (
                  <><Play style={{ width: '14px', height: '14px' }} /> Start</>
                )}
              </button>

              <Link
                href="/timer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  color: '#171717',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: "'Geist', Arial, sans-serif",
                  boxShadow: 'rgb(235,235,235) 0px 0px 0px 1px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ffffff')}
              >
                Full Timer <ArrowRight style={{ width: '12px', height: '12px' }} />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div
          style={{
            background: '#ffffff',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
            borderRadius: '8px',
            padding: '32px',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2
                style={{
                  fontFamily: "'Geist', Arial, sans-serif",
                  fontSize: '18px',
                  fontWeight: 600,
                  letterSpacing: '-0.36px',
                  color: '#171717',
                  margin: 0,
                }}
              >
                Active Tasks
              </h2>
              <p style={{ fontSize: '13px', color: '#666666', marginTop: '4px' }}>
                {activeTasks.length} remaining
              </p>
            </div>
            <Link
              href="/tasks"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0072f5',
                textDecoration: 'none',
              }}
            >
              View all <ArrowRight style={{ width: '12px', height: '12px' }} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {activeTasks.slice(0, 6).map((task, idx) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: idx < Math.min(activeTasks.length, 6) - 1 ? '1px solid #ebebeb' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: priorityBg[task.priority] || '#fafafa',
                      color: priorityColor[task.priority] || '#666666',
                      borderRadius: '9999px',
                      padding: '1px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      flexShrink: 0,
                      fontFamily: "'Geist Mono', monospace",
                      textTransform: 'uppercase',
                    }}
                  >
                    {task.priority}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Geist', Arial, sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#171717',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.title}
                  </span>
                </div>
                <Link href="/tasks">
                  <ArrowRight style={{ width: '14px', height: '14px', color: '#808080', flexShrink: 0 }} />
                </Link>
              </div>
            ))}

            {activeTasks.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#fafafa',
                    boxShadow: 'rgb(235,235,235) 0px 0px 0px 1px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <CheckCircle2 style={{ width: '18px', height: '18px', color: '#0a72ef' }} />
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#171717', margin: 0 }}>All clear</p>
                <p style={{ fontSize: '13px', color: '#666666', marginTop: '4px' }}>No active tasks right now.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
