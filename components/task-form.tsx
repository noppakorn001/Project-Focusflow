'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore, Task } from '@/lib/store';
import { toast } from 'sonner';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.string().optional(), // Comma separated
  deadline: z.date().optional().nullable(),
  categoryId: z.string().optional(),
  project: z.string().optional(),
});

interface TaskFormProps {
  task?: Task;
  onSuccess?: () => void;
}

export function TaskForm({ task, onSuccess }: TaskFormProps) {
  const { addTask, updateTask, categories } = useStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: task?.priority || 'medium',
      tags: task?.tags.join(', ') || '',
      deadline: task?.deadline ? new Date(task.deadline) : undefined,
      categoryId: task?.categoryId || undefined,
      project: task?.project || '',
    },
  });

  const handleAddToCalendar = async (taskData: Task) => {
    if (!taskData.deadline) return;
    
    try {
      // This is a placeholder. In a real app, you'd call an API route
      // that uses the Google Calendar API to create an event.
      // For now, we'll just open a pre-filled Google Calendar link.
      
      const startTime = new Date(taskData.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "");
      const endTime = new Date(new Date(taskData.deadline).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
      
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(taskData.title)}&details=${encodeURIComponent(taskData.description || '')}&dates=${startTime}/${endTime}`;
      
      window.open(url, '_blank');
      toast.success('Opened Google Calendar');
    } catch (error) {
      console.error('Calendar error:', error);
      toast.error('Failed to open calendar');
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const tags = values.tags
      ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const taskData = {
      ...values,
      deadline: values.deadline ? values.deadline.getTime() : null,
      categoryId: values.categoryId || null,
      project: values.project?.trim() || null,
      tags,
    };

    if (task) {
      updateTask(task.id, taskData);
      toast.success('Task updated');
      if (values.deadline && !task.calendarEventId) {
         // Optionally prompt to add to calendar
      }
    } else {
      addTask({
        ...taskData,
        status: 'todo',
        checkpoints: [],
      });
      toast.success('Task created');
    }
    onSuccess?.();
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--foreground)',
    marginBottom: '6px',
    fontFamily: "'Geist', Arial, sans-serif",
  };

  const inputBaseStyle = {
    width: '100%',
    background: 'var(--card)',
    boxShadow: 'var(--shadow-border)',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    fontFamily: "'Geist', Arial, sans-serif",
    fontSize: '14px',
    color: 'var(--foreground)',
    outline: 'none',
    transition: 'box-shadow 0.15s ease',
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <label style={labelStyle}>Title</label>
              <FormControl>
                <input
                  placeholder="Task title"
                  {...field}
                  style={inputBaseStyle}
                  onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
                />
              </FormControl>
              <FormMessage style={{ fontSize: '12px', color: '#ff5b4f', marginTop: '4px' }} />
            </FormItem>
          )}
        />

        {/* Project */}
        <FormField
          control={form.control}
          name="project"
          render={({ field }) => (
            <FormItem>
              <label style={labelStyle}>
                Project <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(Optional)</span>
              </label>
              <FormControl>
                <input
                  placeholder="e.g. Website Redesign, Q2 Launch"
                  {...field}
                  style={inputBaseStyle}
                  onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Category + Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <label style={labelStyle}>Category</label>
                <div style={{ boxShadow: 'var(--shadow-border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-0 shadow-none bg-white" style={{ boxShadow: 'none', border: 'none' }}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: category.color, flexShrink: 0 }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <label style={labelStyle}>Priority</label>
                <div style={{ boxShadow: 'var(--shadow-border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-0 shadow-none bg-white" style={{ boxShadow: 'none', border: 'none' }}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Deadline */}
        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Deadline</label>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <button
                      type="button"
                      style={{
                        ...inputBaseStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        color: field.value ? '#171717' : '#808080',
                        cursor: 'pointer',
                      }}
                    >
                      {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                      <CalendarIcon style={{ width: '14px', height: '14px', color: 'var(--muted-foreground)', flexShrink: 0 }} />
                    </button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage style={{ fontSize: '12px', color: '#ff5b4f', marginTop: '4px' }} />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <label style={labelStyle}>Description</label>
              <FormControl>
                <textarea
                  placeholder="Task description"
                  rows={3}
                  {...field}
                  style={{ ...inputBaseStyle, resize: 'none' }}
                  onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <label style={labelStyle}>Tags <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(comma separated)</span></label>
              <FormControl>
                <input
                  placeholder="work, personal, urgent"
                  {...field}
                  style={inputBaseStyle}
                  onFocus={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border), 0 0 0 2px var(--focus-blue)'; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.boxShadow = 'var(--shadow-border)'; }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Geist', Arial, sans-serif",
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            {task ? 'Update Task' : 'Create Task'}
          </button>
          {task && task.deadline && (
            <button
              type="button"
              onClick={() => handleAddToCalendar(task)}
              style={{
                background: 'var(--card)',
                color: 'var(--foreground)',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: "'Geist', Arial, sans-serif",
                cursor: 'pointer',
                boxShadow: 'var(--shadow-border-light)',
                transition: 'background 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ffffff')}
            >
              Add to Calendar
            </button>
          )}
        </div>
      </form>
    </Form>
  );
}
