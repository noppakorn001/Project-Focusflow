'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * ThemeProvider — reads darkMode from the persisted Zustand store
 * and applies / removes the `.dark` class on <html> on every render.
 * Must be a Client Component rendered inside the layout body.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useStore((s) => s.darkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return <>{children}</>;
}
