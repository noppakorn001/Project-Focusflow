'use client';

import { useStore, FocusReflection, Task } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const HOUR_LABELS: Record<number, string> = {
  0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM', 5: '5 AM',
  6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
  12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
  18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM',
};

const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AnalyticsPage() {
  const { tasks, categories, sessionReflections } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // 1. Task Status Distribution
  const statusData = [
    { name: 'To Do', value: tasks.filter((t) => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length },
    { name: 'Completed', value: tasks.filter((t) => t.status === 'completed').length },
  ].filter((d) => d.value > 0);

  // 2. Weekly Tasks Completed
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const weeklyData = days.map((day) => {
    const tasksCompletedOnDay = tasks.filter((t) =>
      t.completedAt && isSameDay(new Date(t.completedAt), day)
    ).length;

    return {
      name: format(day, 'EEE'),
      tasks: tasksCompletedOnDay,
    };
  });

  // 3. Focus Time by Priority (formatted)
  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').reduce((acc, t) => acc + t.timeSpent, 0) },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').reduce((acc, t) => acc + t.timeSpent, 0) },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').reduce((acc, t) => acc + t.timeSpent, 0) },
  ].filter(d => d.value > 0).map(d => ({ ...d, value: Math.round(d.value / 60) }));

  // 4. Focus Time by Category
  const categoryFocusData = categories.map(cat => {
    const timeSpent = tasks
      .filter(t => t.categoryId === cat.id)
      .reduce((acc, t) => acc + t.timeSpent, 0);
    return {
      name: cat.name,
      value: Math.round(timeSpent / 60),
      color: cat.color
    };
  }).filter(d => d.value > 0);

  // 5. On-Time vs Late Completion
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
  const onTimeCount = completedTasks.filter(t => !t.deadline || (t.completedAt! <= t.deadline)).length;
  const lateCount = completedTasks.filter(t => t.deadline && (t.completedAt! > t.deadline)).length;

  const completionRateData = [
    { name: 'On Time', value: onTimeCount },
    { name: 'Late', value: lateCount },
  ].filter(d => d.value > 0);

  // Total focus time formatted
  const totalFocusSeconds = tasks.reduce((acc, t) => acc + t.timeSpent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Visualize your productivity trends.</p>
      </div>

      {/* Focus Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Focus Activity — Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <FocusHeatmap tasks={tasks} />
        </CardContent>
      </Card>

      {/* Smart Insights */}
      <SmartInsights tasks={tasks} sessionReflections={sessionReflections} totalFocusSeconds={totalFocusSeconds} />

      {/* First row: Task Status + Weekly Completion */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Task Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="60%"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Completion Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tasks Completed This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#8884d8" name="Tasks Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Category + Completion Rate + Priority */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Focus Time by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Focus Time by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {categoryFocusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryFocusData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="60%"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryFocusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${formatDuration(Number(value) * 60)}`} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No focus time recorded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate (On Time vs Late) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {completionRateData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={completionRateData}
                      cx="50%"
                      cy="50%"
                      outerRadius="60%"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No completed tasks with deadlines yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Focus Time by Priority */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Focus Time by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={55} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `${value} mins`} />
                    <Bar dataKey="value" fill="#82ca9d" name="Minutes" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No focus time recorded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Smart Insights section
interface SmartInsightsProps {
  tasks: Task[];
  sessionReflections: FocusReflection[];
  totalFocusSeconds: number;
}

function SmartInsights({ tasks, sessionReflections, totalFocusSeconds }: SmartInsightsProps) {
  const insights = useMemo(() => {
    const completedWithTime = tasks.filter((t) => t.completedAt && t.timeSpent > 0);
    const results: string[] = [];

    // Insight 1: Most productive hour window
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
        results.push(
          `You complete the most tasks between ${HOUR_LABELS[h]} and ${HOUR_LABELS[nextH]}.`
        );
      }
    } else {
      results.push('Complete more tasks to discover your peak productivity window.');
    }

    // Insight 2: Most productive day of week
    if (completedWithTime.length >= 3) {
      const dowCounts: Record<number, number> = {};
      for (const t of completedWithTime) {
        const d = getDay(new Date(t.completedAt!));
        dowCounts[d] = (dowCounts[d] ?? 0) + 1;
      }
      const peakDow = Object.entries(dowCounts).sort(([, a], [, b]) => b - a)[0];
      if (peakDow) {
        results.push(
          `${DOW_LABELS[Number(peakDow[0])]} is your most productive day of the week.`
        );
      }
    } else {
      results.push('Log activity on multiple days to see your most productive day.');
    }

    // Insight 3: Reflection-based or focus total
    if (sessionReflections.length >= 3) {
      const avgQuality =
        sessionReflections.reduce((acc, r) => acc + r.focusQuality, 0) /
        sessionReflections.length;
      const progressCount = sessionReflections.filter((r) => r.madeProgress === true).length;
      const progressPct = Math.round((progressCount / sessionReflections.length) * 100);
      results.push(
        `Across ${sessionReflections.length} sessions, your average focus quality is ${avgQuality.toFixed(1)}/5 and you made progress ${progressPct}% of the time.`
      );
    } else if (totalFocusSeconds > 0) {
      results.push(
        `You have logged ${formatDuration(totalFocusSeconds)} of total focus time. Keep building the habit.`
      );
    } else {
      results.push('Start your first focus session to begin tracking insights.');
    }

    return results;
  }, [tasks, sessionReflections, totalFocusSeconds]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Smart Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="text-muted-foreground">{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
