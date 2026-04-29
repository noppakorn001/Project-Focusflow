'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore, Task, TaskStatus, TaskPriority } from '@/lib/store';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { CategoryManager } from '@/components/category-manager';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { ProjectProgressView } from '@/components/project-progress-view';
import { SmartSortTable } from '@/components/smart-sort-table';
import { TaskActivityHeatmap } from '@/components/task-activity-heatmap';
import { CheckpointTimeline } from '@/components/checkpoint-timeline';
import { Plus, Search, Trash2, Edit, CheckCircle2, Clock, Calendar as CalendarIcon, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

export default function TasksPage() {
  const { tasks, updateTask, deleteTask, categories } = useStore();
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('todo');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'smart-sort' | 'by-project'>('list');
  const [mounted, setMounted] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();

  const nowRef = useRef<number>(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    const ts = Date.now();
    setNow(ts);
    nowRef.current = ts;
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || task.categoryId === filterCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  const handleDelete = (id: string) => {
    confirm({
      title: 'Delete Task',
      description: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'destructive',
      onConfirm: () => {
        deleteTask(id);
        toast.success('Task deleted');
      },
    });
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    // eslint-disable-next-line react-hooks/purity
    updateTask(id, { status, completedAt: status === 'completed' ? (nowRef.current || Date.now()) : null });
    toast.success(`Task marked as ${status}`);
  };

  const getCategory = (id?: string | null) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };

  if (!mounted) return null;

  const tabs = [
    { key: 'list' as const, label: 'List View' },
    { key: 'smart-sort' as const, label: 'Smart Sort' },
    { key: 'by-project' as const, label: 'By Project' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div>
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
            Tasks
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
            Manage your tasks and priorities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CategoryManager />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                onClick={() => setEditingTask(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: "'Geist', Arial, sans-serif",
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                <Plus style={{ width: '14px', height: '14px' }} />
                Add Task
              </button>
            </DialogTrigger>
            <DialogContent style={{ background: 'var(--card)', boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 8px 32px', borderRadius: '12px', border: 'none' }}>
              <DialogHeader>
                <DialogTitle
                  style={{
                    fontFamily: "'Geist', Arial, sans-serif",
                    fontSize: '24px',
                    fontWeight: 600,
                    letterSpacing: '-0.96px',
                    color: 'var(--foreground)',
                  }}
                >
                  {editingTask ? 'Edit Task' : 'Add New Task'}
                </DialogTitle>
              </DialogHeader>
              <TaskForm
                task={editingTask || undefined}
                onSuccess={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pill Tab Selector */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          padding: '4px',
          background: 'var(--muted)',
          boxShadow: 'var(--shadow-border-light)',
          borderRadius: '64px',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 20px',
              borderRadius: '9999px',
              border: 'none',
              background: activeTab === tab.key ? '#171717' : 'transparent',
              color: activeTab === tab.key ? '#ffffff' : '#666666',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontFamily: "'Geist', Arial, sans-serif",
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: activeTab === tab.key ? '-0.14px' : 'normal',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar — for list & smart-sort */}
      {(activeTab === 'list' || activeTab === 'smart-sort') && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '20px',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                color: 'var(--muted-foreground)',
              }}
            />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '32px',
                background: 'var(--card)',
                boxShadow: 'var(--shadow-border)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                color: 'var(--foreground)',
                height: '36px',
              }}
            />
          </div>

          {/* Status filter */}
          <div style={{ boxShadow: 'var(--shadow-border)', borderRadius: '6px', overflow: 'hidden' }}>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | 'all')}>
              <SelectTrigger className="border-0 shadow-none bg-white h-9 text-sm w-[140px]" style={{ boxShadow: 'none', border: 'none' }}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority filter */}
          <div style={{ boxShadow: 'var(--shadow-border)', borderRadius: '6px', overflow: 'hidden' }}>
            <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as TaskPriority | 'all')}>
              <SelectTrigger className="border-0 shadow-none bg-white h-9 text-sm w-[140px]" style={{ boxShadow: 'none', border: 'none' }}>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category filter */}
          <div style={{ boxShadow: 'var(--shadow-border)', borderRadius: '6px', overflow: 'hidden' }}>
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
              <SelectTrigger className="border-0 shadow-none bg-white h-9 text-sm w-[140px]" style={{ boxShadow: 'none', border: 'none' }}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTasks.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '240px',
                background: 'var(--card)',
                boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--muted)',
                  boxShadow: 'var(--shadow-border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <CheckCircle2 style={{ width: '20px', height: '20px', color: '#0a72ef' }} />
              </div>
              <h3
                style={{
                  fontFamily: "'Geist', Arial, sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  letterSpacing: '-0.32px',
                  color: 'var(--foreground)',
                  margin: '0 0 6px 0',
                }}
              >
                No tasks found
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
                Create a new task to get started.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const category = getCategory(task.categoryId);
              const isOverdue = task.deadline && task.deadline < now && task.status !== 'completed';
              const isExpanded = selectedTaskId === task.id;
              const checkpoints = task.checkpoints ?? [];
              return (
                <div key={task.id} style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: isExpanded ? 'rgba(0,0,0,0.12) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 8px' : 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px', transition: 'box-shadow 0.2s ease' }}>
                  {/* ── Main row ── */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      background: 'var(--card)',
                      padding: '16px 20px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedTaskId(isExpanded ? null : task.id)}
                  >
                    {/* Left: checkbox + info */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', minWidth: 0, flex: 1 }}>
                      {/* Checkbox — stop propagation so clicking it doesn't toggle panel */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, task.status === 'completed' ? 'todo' : 'completed'); }}
                        style={{
                          width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                          background: task.status === 'completed' ? '#0a72ef' : 'var(--card)',
                          boxShadow: task.status === 'completed' ? 'none' : 'rgba(0,0,0,0.2) 0px 0px 0px 1.5px',
                          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: '2px', transition: 'all 0.15s ease',
                        }}
                      >
                        {task.status === 'completed' && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      {/* Task details */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: "'Geist', Arial, sans-serif", fontSize: '15px', fontWeight: 600, letterSpacing: '-0.15px', color: task.status === 'completed' ? 'var(--muted-foreground)' : 'var(--foreground)', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                            {task.title}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', background: priorityBg[task.priority] || '#fafafa', color: priorityColor[task.priority] || '#666666', borderRadius: '9999px', padding: '1px 8px', fontSize: '11px', fontWeight: 500, fontFamily: "'Geist Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {task.priority}
                          </span>
                          {category && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '9999px', padding: '1px 8px', fontSize: '11px', fontWeight: 500, color: category.color, background: `${category.color}18` }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: category.color, flexShrink: 0 }} />
                              {category.name}
                            </span>
                          )}
                          {task.project && (
                            <span style={{ display: 'inline-flex', borderRadius: '9999px', padding: '1px 8px', fontSize: '11px', fontWeight: 500, background: 'var(--muted)', color: 'var(--muted-foreground)', boxShadow: 'var(--shadow-border-light)' }}>
                              {task.project}
                            </span>
                          )}
                          {checkpoints.length > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '9999px', padding: '1px 8px', fontSize: '11px', fontWeight: 500, background: 'var(--muted)', color: 'var(--muted-foreground)', boxShadow: 'var(--shadow-border-light)', fontFamily: "'Geist Mono', monospace" }}>
                              <Activity style={{ width: '9px', height: '9px' }} />
                              {checkpoints.length}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '2px 0 6px', lineHeight: 1.4 }}>{task.description}</p>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {task.deadline && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 500, background: isOverdue ? '#fff0ef' : 'var(--muted)', color: isOverdue ? '#ff5b4f' : 'var(--muted-foreground)', boxShadow: isOverdue ? 'rgba(255,91,79,0.2) 0px 0px 0px 1px' : 'var(--shadow-border-light)' }}>
                              <CalendarIcon style={{ width: '10px', height: '10px' }} />
                              {format(task.deadline, 'MMM d')}
                            </span>
                          )}
                          {task.tags.map((tag) => (
                            <span key={tag} style={{ display: 'inline-flex', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 500, background: 'var(--muted)', color: 'var(--muted-foreground)', boxShadow: 'var(--shadow-border-light)' }}>{tag}</span>
                          ))}
                          {task.timeSpent > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 500, background: '#ebf5ff', color: '#0068d6' }}>
                              <Clock style={{ width: '10px', height: '10px' }} />
                              {Math.floor(task.timeSpent / 60)}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: expand toggle + actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsDialogOpen(true); }}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s ease', color: 'var(--muted-foreground)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--muted)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s ease', color: 'var(--muted-foreground)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff0ef'; (e.currentTarget as HTMLElement).style.color = '#ff5b4f'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)'; }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                      <div style={{ color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronUp style={{ width: '14px', height: '14px' }} /> : <ChevronDown style={{ width: '14px', height: '14px' }} />}
                      </div>
                    </div>
                  </div>

                  {/* ── Expandable detail panel ── */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--muted)', background: 'var(--card)', padding: '20px 24px 24px' }}>
                      {/* Activity Heatmap */}
                      <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: 'var(--muted-foreground)', margin: '0 0 4px 0' }}>
                          ACTIVITY — LAST 30 DAYS
                        </p>
                        <TaskActivityHeatmap checkpoints={checkpoints} />
                      </div>

                      {/* Checkpoint Timeline */}
                      <div>
                        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: 'var(--muted-foreground)', margin: '0 0 16px 0' }}>
                          CHECKPOINT HISTORY
                        </p>
                        <CheckpointTimeline checkpoints={checkpoints} taskId={task.id} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Smart Sort tab */}
      {activeTab === 'smart-sort' && (
        <SmartSortTable tasks={filteredTasks} />
      )}

      {/* By Project tab */}
      {activeTab === 'by-project' && (
        <div
          style={{
            background: 'var(--card)',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px',
            borderRadius: '8px',
            padding: '28px',
            border: 'none',
          }}
        >
          <h2
            style={{
              fontFamily: "'Geist', Arial, sans-serif",
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '-0.36px',
              color: 'var(--foreground)',
              margin: '0 0 20px 0',
            }}
          >
            Project Progress
          </h2>
          <ProjectProgressView tasks={tasks} />
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
