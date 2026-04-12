'use client';

import { useStore, FocusReflection, Task } from '@/lib/store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getHours, getDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { FocusHeatmap } from '@/components/focus-heatmap';
import { formatDuration } from '@/lib/utils/format-duration';

// Vercel workflow palette + neutral grays for charts
const COLORS = ['#0a72ef', '#de1d8d', '#ff5b4f', '#0068d6', '#666666', '#808080'];

const HOUR_LABELS: Record<number, string> = {
  0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM', 5: '5 AM',
  6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
  12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
  18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM',
};

const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Vercel chart tooltip style
const ChartTooltipStyle = {
  background: 'var(--card)',
  boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 16px',
  border: 'none',
  borderRadius: '8px',
  fontSize: '13px',
  fontFamily: "'Geist', Arial, sans-serif",
  color: 'var(--foreground)',
};

export default function AnalyticsPage() {
  const { tasks, categories, sessionReflections } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const statusData = [
    { name: 'To Do', value: tasks.filter((t) => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length },
  ].filter((d) => d.value > 0);

  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const weeklyData = days.map((day) => ({
    name: format(day, 'EEE'),
    tasks: tasks.filter((t) => t.completedAt && isSameDay(new Date(t.completedAt), day)).length,
  }));

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').reduce((acc, t) => acc + t.timeSpent, 0) },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').reduce((acc, t) => acc + t.timeSpent, 0) },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').reduce((acc, t) => acc + t.timeSpent, 0) },
  ].filter(d => d.value > 0).map(d => ({ ...d, value: Math.round(d.value / 60) }));

  const categoryFocusData = categories.map(cat => {
    const timeSpent = tasks
      .filter(t => t.categoryId === cat.id)
      .reduce((acc, t) => acc + t.timeSpent, 0);
    return { name: cat.name, value: Math.round(timeSpent / 60), color: cat.color };
  }).filter(d => d.value > 0);

  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
  const onTimeCount = completedTasks.filter(t => !t.deadline || (t.completedAt! <= t.deadline)).length;
  const lateCount = completedTasks.filter(t => t.deadline && (t.completedAt! > t.deadline)).length;
  const completionRateData = [
    { name: 'On Time', value: onTimeCount },
    { name: 'Late', value: lateCount },
  ].filter(d => d.value > 0);

  const totalFocusSeconds = tasks.reduce((acc, t) => acc + t.timeSpent, 0);

  const cardStyle = {
    background: 'var(--card)',
    boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
    borderRadius: '8px',
    padding: '24px',
    border: 'none',
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
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Analytics
        </h1>
        <p
          style={{
            fontFamily: "'Geist', Arial, sans-serif",
            fontSize: '18px',
            fontWeight: 400,
            color: 'var(--muted-foreground)',
            marginTop: '8px',
          }}
        >
          Visualize your productivity trends.
        </p>
      </div>

      {/* Heatmap */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground)',
            }}
          >
            FOCUS ACTIVITY — LAST 12 MONTHS
          </span>
        </div>
        <FocusHeatmap tasks={tasks} />
      </div>

      {/* Smart Insights */}
      <SmartInsights tasks={tasks} sessionReflections={sessionReflections} totalFocusSeconds={totalFocusSeconds} />

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginTop: '16px' }}>
        {/* Task Status Pie */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              TASK STATUS
            </span>
          </div>
          <div style={{ height: '240px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius="40%" outerRadius="65%" paddingAngle={3} dataKey="value">
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={ChartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontFamily: "'Geist', Arial, sans-serif", color: 'var(--muted-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No tasks yet." />
            )}
          </div>
        </div>

        {/* Weekly Completion Bar */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              TASKS COMPLETED THIS WEEK
            </span>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666666', fontFamily: "'Geist', sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#666666', fontFamily: "'Geist', sans-serif" }} width={28} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ChartTooltipStyle} cursor={{ fill: '#fafafa' }} />
                <Bar dataKey="tasks" fill="#0a72ef" name="Tasks Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
        {/* Focus by Category */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              BY CATEGORY
            </span>
          </div>
          <div style={{ height: '220px' }}>
            {categoryFocusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryFocusData} cx="50%" cy="50%" innerRadius="35%" outerRadius="60%" paddingAngle={3} dataKey="value">
                    {categoryFocusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={ChartTooltipStyle} formatter={(value) => `${formatDuration(Number(value) * 60)}`} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: "'Geist', Arial, sans-serif", color: 'var(--muted-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No focus time recorded yet." />
            )}
          </div>
        </div>

        {/* Completion Rate */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              COMPLETION RATE
            </span>
          </div>
          <div style={{ height: '220px' }}>
            {completionRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={completionRateData} cx="50%" cy="50%" outerRadius="60%" dataKey="value">
                    <Cell fill="#0a72ef" />
                    <Cell fill="#ff5b4f" />
                  </Pie>
                  <Tooltip contentStyle={ChartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: "'Geist', Arial, sans-serif" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No completed tasks with deadlines yet." />
            )}
          </div>
        </div>

        {/* Focus by Priority */}
        <div style={cardStyle}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
              BY PRIORITY
            </span>
          </div>
          <div style={{ height: '220px' }}>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#666666', fontFamily: "'Geist', sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={55} tick={{ fontSize: 11, fill: '#666666', fontFamily: "'Geist', sans-serif" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={ChartTooltipStyle} formatter={(value) => `${value} mins`} />
                  <Bar dataKey="value" fill="#de1d8d" name="Minutes" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No focus time recorded yet." />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .analytics-grid-1 { grid-template-columns: 1fr !important; }
          .analytics-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontFamily: "'Geist', Arial, sans-serif" }}>{message}</p>
    </div>
  );
}

interface SmartInsightsProps {
  tasks: Task[];
  sessionReflections: FocusReflection[];
  totalFocusSeconds: number;
}

function SmartInsights({ tasks, sessionReflections, totalFocusSeconds }: SmartInsightsProps) {
  const insights = useMemo(() => {
    const completedWithTime = tasks.filter((t) => t.completedAt && t.timeSpent > 0);
    const results: string[] = [];

    if (completedWithTime.length >= 2) {
      const hourCounts: Record<number, number> = {};
      for (const t of completedWithTime) {
        const h = getHours(new Date(t.completedAt!));
        hourCounts[h] = (hourCounts[h] ?? 0) + 1;
      }
      const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
      if (peakHour) {
        const h = Number(peakHour[0]);
        const nextH = (h + 2) % 24;
        results.push(`You complete the most tasks between ${HOUR_LABELS[h]} and ${HOUR_LABELS[nextH]}.`);
      }
    } else {
      results.push('Complete more tasks to discover your peak productivity window.');
    }

    if (completedWithTime.length >= 3) {
      const dowCounts: Record<number, number> = {};
      for (const t of completedWithTime) {
        const d = getDay(new Date(t.completedAt!));
        dowCounts[d] = (dowCounts[d] ?? 0) + 1;
      }
      const peakDow = Object.entries(dowCounts).sort(([, a], [, b]) => b - a)[0];
      if (peakDow) {
        results.push(`${DOW_LABELS[Number(peakDow[0])]} is your most productive day of the week.`);
      }
    } else {
      results.push('Log activity on multiple days to see your most productive day.');
    }

    if (sessionReflections.length >= 3) {
      const avgQuality = sessionReflections.reduce((acc, r) => acc + r.focusQuality, 0) / sessionReflections.length;
      const progressCount = sessionReflections.filter((r) => r.madeProgress === true).length;
      const progressPct = Math.round((progressCount / sessionReflections.length) * 100);
      results.push(
        `Across ${sessionReflections.length} sessions, avg focus quality is ${avgQuality.toFixed(1)}/5 and you made progress ${progressPct}% of the time.`
      );
    } else if (totalFocusSeconds > 0) {
      results.push(`You have logged ${formatDuration(totalFocusSeconds)} of total focus time. Keep building the habit.`);
    } else {
      results.push('Start your first focus session to begin tracking insights.');
    }

    return results;
  }, [tasks, sessionReflections, totalFocusSeconds]);

  return (
    <div
      style={{
        background: 'var(--card)',
        boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
        borderRadius: '8px',
        padding: '24px',
        border: 'none',
        marginBottom: '0',
        marginTop: '16px',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          SMART INSIGHTS
        </span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((insight, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span
              style={{
                flexShrink: 0,
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#0a72ef',
                marginTop: '7px',
              }}
            />
            <span
              style={{
                fontFamily: "'Geist', Arial, sans-serif",
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--muted-foreground)',
              }}
            >
              {insight}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
