import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, writeBatch, onSnapshot, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

let unsubTasks: (() => void) | null = null;
let unsubDoc: (() => void) | null = null;

const pushTaskToFirestore = (uid: string | null, task: Task) => {
  if (!uid) return;
  const taskRef = doc(db, `users/${uid}/tasks`, task.id);
  const { checkpoints, ...taskData } = task;
  setDoc(taskRef, taskData).catch(console.error);
  for (const cp of checkpoints || []) {
    const cpRef = doc(db, `users/${uid}/tasks/${task.id}/checkpoints`, cp.id);
    setDoc(cpRef, cp).catch(console.error);
  }
};

const pushUserDocToFirestore = (uid: string | null, state: AppState) => {
  if (!uid) return;
  const userRef = doc(db, 'users', uid, 'data', 'focusflow');
  setDoc(userRef, {
    categories: state.categories,
    settings: state.settings,
    sessionReflections: state.sessionReflections,
    lastSynced: Date.now()
  }, { merge: true }).catch(console.error);
};

export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Checkpoint {
  id: string;
  timestamp: number;
  note: string;
  duration: number; // seconds spent in that session
  parentId?: string; // ID of the checkpoint this was resumed from
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
  project?: string | null;
  checkpoints: Checkpoint[];
}

export interface FocusReflection {
  sessionId: string;
  taskId: string;
  taskName: string;
  madeProgress: boolean | null;
  focusQuality: number; // 1-5
  observation: string;
  completedAt: number;
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
  darkMode: boolean;
  timer: {
    timeLeft: number;
    isActive: boolean;
    mode: TimerMode;
    linkedTaskId: string | null;
    startedAt: number | null; // Date.now() when timer was started/resumed
    resumedCheckpointId: string | null; // ID of the checkpoint being resumed
  };
  settings: TimerSettings;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSynced: number | null;
  pendingReflection: { taskId: string; taskName: string; parentId?: string | null } | null;
  sessionReflections: FocusReflection[];
  activeContextNote: string | null;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'timeSpent'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  setTimer: (updates: Partial<AppState['timer']>) => void;
  updateSettings: (updates: Partial<TimerSettings>) => void;
  setDarkMode: (dark: boolean) => void;
  setSyncStatus: (status: AppState['syncStatus']) => void;
  setLastSynced: (time: number) => void;
  resetTimer: () => void;
  tickTimer: () => void;
  advanceTimer: (seconds: number) => void;
  switchMode: (mode: TimerMode) => void;
  setPendingReflection: (reflection: { taskId: string; taskName: string; parentId?: string | null } | null) => void;
  logReflection: (reflection: Omit<FocusReflection, 'sessionId'> & { parentId?: string | null }) => void;
  resumeFromContext: (taskId: string, note: string, checkpointId: string) => void;
  clearActiveContext: () => void;

  // For Firestore Sync
  currentUserUid: string | null;
  startSync: (uid: string, mode: 'merge' | 'replace') => Promise<void>;
  loadState: (state: Partial<AppState>) => void;
  /** Wipe all user-specific data from memory AND localStorage on sign-out. */
  clearUserData: () => void;
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
      darkMode: false,
      timer: {
        timeLeft: 25 * 60,
        isActive: false,
        mode: 'focus',
        linkedTaskId: null,
        startedAt: null,
        resumedCheckpointId: null,
      },
      settings: DEFAULT_SETTINGS,
      syncStatus: 'idle',
      lastSynced: null,
      pendingReflection: null,
      sessionReflections: [],
      activeContextNote: null,
      currentUserUid: null,

      addTask: (taskData) =>
        set((state) => {
          const newTask = {
            ...taskData,
            id: uuidv4(),
            createdAt: Date.now(),
            completedAt: null,
            timeSpent: 0,
            checkpoints: [],
          };
          pushTaskToFirestore(state.currentUserUid, newTask);
          return { tasks: [...state.tasks, newTask] };
        }),

      updateTask: (id, updates) =>
        set((state) => {
          const newTasks = state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          );
          const updatedTask = newTasks.find(t => t.id === id);
          if (updatedTask) pushTaskToFirestore(state.currentUserUid, updatedTask);
          return { tasks: newTasks };
        }),

      deleteTask: (id) =>
        set((state) => {
          if (state.currentUserUid) {
            deleteDoc(doc(db, `users/${state.currentUserUid}/tasks`, id)).catch(console.error);
          }
          return { tasks: state.tasks.filter((t) => t.id !== id) };
        }),

      addCategory: (categoryData) =>
        set((state) => {
          const newState = {
            ...state,
            categories: [...state.categories, { ...categoryData, id: uuidv4() }],
          };
          pushUserDocToFirestore(state.currentUserUid, newState as unknown as AppState);
          return { categories: newState.categories };
        }),

      updateCategory: (id, updates) =>
        set((state) => {
          const newState = {
            ...state,
            categories: state.categories.map((c) => c.id === id ? { ...c, ...updates } : c),
          };
          pushUserDocToFirestore(state.currentUserUid, newState as unknown as AppState);
          return { categories: newState.categories };
        }),

      deleteCategory: (id) =>
        set((state) => {
          const newState = {
            ...state,
            categories: state.categories.filter((c) => c.id !== id),
            tasks: state.tasks.map((t) => t.categoryId === id ? { ...t, categoryId: null } : t),
          };
          pushUserDocToFirestore(state.currentUserUid, newState as unknown as AppState);
          return { categories: newState.categories, tasks: newState.tasks };
        }),

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
        set((state) => {
          const newState = {
            ...state,
            settings: { ...state.settings, ...updates },
          };
          pushUserDocToFirestore(state.currentUserUid, newState as unknown as AppState);
          return { settings: newState.settings };
        }),

      setDarkMode: (dark) => set({ darkMode: dark }),

      setSyncStatus: (status) => set({ syncStatus: status }),
      setLastSynced: (time) => set({ lastSynced: time }),

      clearUserData: () => {
        if (unsubTasks) unsubTasks();
        if (unsubDoc) unsubDoc();
        set({
          tasks: [],
          categories: DEFAULT_CATEGORIES,
          sessionReflections: [],
          lastSynced: null,
          pendingReflection: null,
          activeContextNote: null,
          syncStatus: 'idle',
          currentUserUid: null,
          timer: {
            timeLeft: DEFAULT_SETTINGS.focusDuration * 60,
            isActive: false,
            mode: 'focus',
            linkedTaskId: null,
            startedAt: null,
            resumedCheckpointId: null,
          },
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('focus-flow-storage');
        }
      },

      clearActiveContext: () => set({ activeContextNote: null }),

      resumeFromContext: (taskId, note, checkpointId) =>
        set((state) => ({
          activeContextNote: note,
          timer: {
            ...state.timer,
            linkedTaskId: taskId,
            mode: 'focus', // Force focus mode when resuming
            resumedCheckpointId: checkpointId,
          },
        })),

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
            resumedCheckpointId: null,
          },
          activeContextNote: null,
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
            resumedCheckpointId: null,
          },
          activeContextNote: null,
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

      setPendingReflection: (reflection) =>
        set({ pendingReflection: reflection }),

      logReflection: (reflectionData) =>
        set((state) => {
          // Append as a checkpoint on the linked task
          const updatedTasks = state.tasks.map((t) => {
            if (t.id !== reflectionData.taskId) return t;
            const checkpoint: Checkpoint = {
              id: uuidv4(),
              timestamp: reflectionData.completedAt,
              note: reflectionData.observation,
              // duration = time spent since last checkpoint (or total timeSpent if first)
              duration: (() => {
                const prev = [...(t.checkpoints ?? [])].sort((a, b) => b.timestamp - a.timestamp)[0];
                if (!prev) return t.timeSpent;
                // Estimate: sum of timeSpent minus sum of prior checkpoint durations
                const accounted = (t.checkpoints ?? []).reduce((s, c) => s + c.duration, 0);
                return Math.max(0, t.timeSpent - accounted);
              })(),
            };
            if (reflectionData.parentId) {
              checkpoint.parentId = reflectionData.parentId;
            }
            const newTask = { ...t, checkpoints: [...(t.checkpoints ?? []), checkpoint] };
            pushTaskToFirestore(state.currentUserUid, newTask);
            return newTask;
          });

          const newState = {
            ...state,
            sessionReflections: [
              ...state.sessionReflections,
              { ...reflectionData, sessionId: uuidv4() },
            ],
          };
          pushUserDocToFirestore(state.currentUserUid, newState as unknown as AppState);

          return {
            tasks: updatedTasks,
            sessionReflections: newState.sessionReflections,
            activeContextNote: null,
          };
        }),

      loadState: (loadedState) => {
        set((state) => ({
          ...state,
          ...loadedState,
          categories: loadedState.categories && loadedState.categories.length > 0
            ? loadedState.categories
            : state.categories,
          timer: { ...state.timer, ...loadedState.timer, isActive: false },
        }));
      },

      startSync: async (uid: string, mode: 'merge' | 'replace') => {
        const state = get();
        set({ currentUserUid: uid, syncStatus: 'syncing' });

        try {
          if (mode === 'merge') {
            const batch = writeBatch(db);
            const userRef = doc(db, 'users', uid, 'data', 'focusflow');
            batch.set(userRef, {
              categories: state.categories,
              settings: state.settings,
              sessionReflections: state.sessionReflections,
              lastSynced: Date.now()
            }, { merge: true });

            for (const task of state.tasks) {
              const taskRef = doc(db, `users/${uid}/tasks`, task.id);
              const { checkpoints, ...taskData } = task;
              batch.set(taskRef, taskData);

              for (const cp of checkpoints || []) {
                const cpRef = doc(db, `users/${uid}/tasks/${task.id}/checkpoints`, cp.id);
                batch.set(cpRef, cp);
              }
            }
            await batch.commit();
          }

          // Live Sync setup
          if (unsubDoc) unsubDoc();
          if (unsubTasks) unsubTasks();

          unsubDoc = onSnapshot(doc(db, 'users', uid, 'data', 'focusflow'), (snap) => {
            if (snap.metadata.hasPendingWrites) return;
            if (snap.exists()) {
              const data = snap.data();
              set({
                categories: data.categories || get().categories,
                settings: data.settings || get().settings,
                sessionReflections: data.sessionReflections || get().sessionReflections,
                lastSynced: data.lastSynced,
                syncStatus: 'success'
              });
            }
          });

          unsubTasks = onSnapshot(collection(db, `users/${uid}/tasks`), async (snap) => {
            if (snap.metadata.hasPendingWrites) return;

            // When tasks change from the server, we need to load them and their checkpoints
            // This is a naive full-fetch approach for simplicity when server state changes.
            const newTasks: Task[] = [];
            for (const docSnap of snap.docs) {
              const taskData = docSnap.data() as Omit<Task, 'checkpoints'>;
              // Fetch checkpoints subcollection
              const cpSnap = await getDocs(collection(db, `users/${uid}/tasks/${taskData.id}/checkpoints`));
              const checkpoints = cpSnap.docs.map(d => d.data() as Checkpoint);
              newTasks.push({ ...taskData, checkpoints } as Task);
            }
            set({ tasks: newTasks, syncStatus: 'success' });
          }, (err) => {
            console.error(err);
            set({ syncStatus: 'error' });
          });

        } catch (err) {
          console.error(err);
          set({ syncStatus: 'error' });
        }
      },
    }),
    {
      name: 'focus-flow-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
        settings: state.settings,
        darkMode: state.darkMode,
        lastSynced: state.lastSynced,
        sessionReflections: state.sessionReflections,
      }), // Persist tasks, categories, settings, darkMode, lastSynced, and reflections
    }
  )
);
