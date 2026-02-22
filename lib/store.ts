import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  createdAt: number;
  completedAt: number | null;
  timeSpent: number; // in seconds
  deadline?: number | null;
  categoryId?: string | null;
  calendarEventId?: string | null;
}

export type TimerMode = 'focus' | 'short-break' | 'long-break';

export interface TimerSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface AppState {
  tasks: Task[];
  categories: Category[];
  timer: {
    timeLeft: number;
    isActive: boolean;
    mode: TimerMode;
    linkedTaskId: string | null;
    startedAt: number | null; // Date.now() when timer was started/resumed
  };
  settings: TimerSettings;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSynced: number | null;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'timeSpent'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  setTimer: (updates: Partial<AppState['timer']>) => void;
  updateSettings: (updates: Partial<TimerSettings>) => void;
  setSyncStatus: (status: AppState['syncStatus']) => void;
  setLastSynced: (time: number) => void;
  resetTimer: () => void;
  tickTimer: () => void;
  advanceTimer: (seconds: number) => void;
  switchMode: (mode: TimerMode) => void;

  // For Drive Sync
  loadState: (state: Partial<AppState>) => void;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', icon: 'Briefcase', color: '#3b82f6' },
  { id: 'personal', name: 'Personal', icon: 'User', color: '#10b981' },
  { id: 'study', name: 'Study', icon: 'BookOpen', color: '#8b5cf6' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: DEFAULT_CATEGORIES,
      timer: {
        timeLeft: 25 * 60,
        isActive: false,
        mode: 'focus',
        linkedTaskId: null,
        startedAt: null,
      },
      settings: DEFAULT_SETTINGS,
      syncStatus: 'idle',
      lastSynced: null,

      addTask: (taskData) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...taskData,
              id: uuidv4(),
              createdAt: Date.now(),
              completedAt: null,
              timeSpent: 0,
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      addCategory: (categoryData) =>
        set((state) => ({
          categories: [
            ...state.categories,
            { ...categoryData, id: uuidv4() },
          ],
        })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          // Optional: Remove categoryId from tasks that had this category
          tasks: state.tasks.map((t) =>
            t.categoryId === id ? { ...t, categoryId: null } : t
          ),
        })),

      setTimer: (updates) =>
        set((state) => {
          const newTimer = { ...state.timer, ...updates };
          // Record startedAt when activating, clear when deactivating
          if (updates.isActive === true && !state.timer.isActive) {
            newTimer.startedAt = Date.now();
          } else if (updates.isActive === false) {
            newTimer.startedAt = null;
          }
          return { timer: newTimer };
        }),

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      setSyncStatus: (status) => set({ syncStatus: status }),
      setLastSynced: (time) => set({ lastSynced: time }),

      resetTimer: () => {
        const { settings, timer } = get();
        let duration = settings.focusDuration;
        if (timer.mode === 'short-break') duration = settings.shortBreakDuration;
        if (timer.mode === 'long-break') duration = settings.longBreakDuration;

        set({
          timer: {
            ...timer,
            timeLeft: duration * 60,
            isActive: false,
            startedAt: null,
          },
        });
      },

      tickTimer: () => {
        const { timer, tasks } = get();
        if (timer.isActive && timer.timeLeft > 0) {
          // If linked to a task, increment timeSpent
          let newTasks = tasks;
          if (timer.linkedTaskId && timer.mode === 'focus') {
            newTasks = tasks.map((t) =>
              t.id === timer.linkedTaskId
                ? { ...t, timeSpent: t.timeSpent + 1 }
                : t
            );
          }

          set({
            timer: { ...timer, timeLeft: timer.timeLeft - 1 },
            tasks: newTasks,
          });
        } else if (timer.isActive && timer.timeLeft === 0) {
          set({
            timer: { ...timer, isActive: false },
          });
          // Play sound here or trigger effect
        }
      },

      switchMode: (mode) => {
        const { settings } = get();
        let duration = settings.focusDuration;
        if (mode === 'short-break') duration = settings.shortBreakDuration;
        if (mode === 'long-break') duration = settings.longBreakDuration;

        set((state) => ({
          timer: {
            ...state.timer,
            mode,
            timeLeft: duration * 60,
            isActive: false,
            startedAt: null,
          },
        }));
      },

      // Bulk advance timer by N seconds (used for background tab catch-up)
      advanceTimer: (seconds) => {
        const { timer, tasks } = get();
        if (!timer.isActive || seconds <= 0) return;

        const actualSeconds = Math.min(seconds, timer.timeLeft);
        const newTimeLeft = timer.timeLeft - actualSeconds;

        // Update linked task timeSpent in bulk
        let newTasks = tasks;
        if (timer.linkedTaskId && timer.mode === 'focus') {
          newTasks = tasks.map((t) =>
            t.id === timer.linkedTaskId
              ? { ...t, timeSpent: t.timeSpent + actualSeconds }
              : t
          );
        }

        set({
          timer: { ...timer, timeLeft: newTimeLeft },
          tasks: newTasks,
        });
      },

      loadState: (loadedState) => {
        // Merge loaded state carefully
        set((state) => ({
          ...state,
          ...loadedState,
          // Restore categories from Drive if available, otherwise keep current
          categories: loadedState.categories && loadedState.categories.length > 0
            ? loadedState.categories
            : state.categories,
          timer: { ...state.timer, ...loadedState.timer, isActive: false }, // Don't auto-start loaded timer
        }));
      },
    }),
    {
      name: 'focus-flow-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
        settings: state.settings,
        lastSynced: state.lastSynced,
      }), // Persist tasks, categories, settings, lastSynced to localStorage
    }
  )
);
