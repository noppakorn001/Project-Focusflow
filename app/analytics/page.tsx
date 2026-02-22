'use client';

import { useStore } from '@/lib/store';
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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { useEffect, useState } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
  const { tasks, categories } = useStore();
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

  // 3. Focus Time by Priority
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Visualize your productivity trends.</p>
      </div>

      {/* First row: Task Status + Weekly Completion — stack on mobile */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Task Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
              <ResponsiveContainer width="100%" height="100%">
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

      {/* Second row: Category + Completion Rate + Priority — stack on mobile */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Focus Time by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Focus Time by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {categoryFocusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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
                    <Tooltip formatter={(value) => `${value} mins`} />
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionRateData}
                      cx="50%"
                      cy="50%"
                      outerRadius="60%"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" /> {/* On Time - Green */}
                      <Cell fill="#ef4444" /> {/* Late - Red */}
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
                <ResponsiveContainer width="100%" height="100%">
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
