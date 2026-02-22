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
  LineChart,
  Line,
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
      value: Math.round(timeSpent / 60), // minutes
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Visualize your productivity trends.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Task Status Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Completion Bar Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Tasks Completed This Week</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#8884d8" name="Tasks Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Focus Time by Category */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Focus Time by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryFocusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryFocusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} mins`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Rate (On Time vs Late) */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {completionRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionRateData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" /> {/* On Time - Green */}
                    <Cell fill="#ef4444" /> {/* Late - Red */}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No completed tasks with deadlines yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Focus Time by Priority */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Focus Time by Priority</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip formatter={(value) => `${value} mins`} />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Minutes" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
