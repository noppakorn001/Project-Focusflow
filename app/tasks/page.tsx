'use client';

import { useState, useEffect } from 'react';
import { useStore, Task, TaskStatus, TaskPriority } from '@/lib/store';
import { Button } from '@/components/ui/button';
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
import { Plus, Search, Filter, Trash2, Edit, CheckCircle2, Circle, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function TasksPage() {
  const { tasks, updateTask, deleteTask, categories } = useStore();
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [mounted, setMounted] = useState(false);

  const [now, setNow] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setNow(Date.now());
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || task.categoryId === filterCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
      toast.success('Task deleted');
    }
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask(id, { status });
    toast.success(`Task marked as ${status}`);
  };

  const getCategory = (id?: string | null) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and priorities.</p>
        </div>
        <div className="flex gap-2">
          <CategoryManager />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTask(null)}>
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              </DialogHeader>
              <TaskForm
                task={editingTask || undefined}
                onSuccess={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as TaskStatus | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterPriority}
            onValueChange={(v) => setFilterPriority(v as TaskPriority | 'all')}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterCategory}
            onValueChange={(v) => setFilterCategory(v)}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
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

      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <div className="rounded-full bg-muted p-4">
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
            <p className="text-muted-foreground">
              Create a new task to get started.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const category = getCategory(task.categoryId);
            return (
              <div
                key={task.id}
                className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'mt-1 h-6 w-6 rounded-full border-2 p-0 hover:bg-transparent',
                      task.status === 'completed'
                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                        : 'border-muted-foreground text-transparent hover:border-primary'
                    )}
                    onClick={() =>
                      handleStatusChange(
                        task.id,
                        task.status === 'completed' ? 'todo' : 'completed'
                      )
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          'font-semibold leading-none',
                          task.status === 'completed' && 'text-muted-foreground line-through'
                        )}
                      >
                        {task.title}
                      </h3>
                      {category && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 gap-1" style={{ borderColor: category.color, color: category.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                          {category.name}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge
                        variant={
                          task.priority === 'high'
                            ? 'destructive'
                            : task.priority === 'medium'
                            ? 'secondary'
                            : 'outline'
                        }
                        className={cn(
                          task.priority === 'medium' && 'bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-200'
                        )}
                      >
                        {task.priority}
                      </Badge>
                      {task.deadline && (
                        <Badge variant="outline" className={cn("flex items-center gap-1", 
                          task.deadline < now && task.status !== 'completed' ? "text-destructive border-destructive" : ""
                        )}>
                          <CalendarIcon className="h-3 w-3" />
                          {format(task.deadline, 'MMM d')}
                        </Badge>
                      )}
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.timeSpent > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(task.timeSpent / 60)}m
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:self-start">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTask(task);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CheckSquare({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
