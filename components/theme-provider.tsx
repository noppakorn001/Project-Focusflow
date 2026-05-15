'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * ThemeProvider — reads darkMode from the persisted Zustand store
 * and applies / removes the `.dark` class on <html> on every render.
 *
 * To prevent a flash of light-mode content (FOUC), an inline script
 * is injected via the layout head that runs synchronously before paint
 * and reads from localStorage directly.
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

/**
 * Anti-flash script — must be rendered as a blocking <script> tag
 * in the <head> BEFORE any stylesheets. Reads Zustand persisted state
 * from localStorage and applies `.dark` immediately, preventing FOUC.
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('focusflow-store');
        if (stored) {
          var data = JSON.parse(stored);
          if (data && data.state && data.state.darkMode === true) {
            document.documentElement.classList.add('dark');
          }
        }
      } catch(e) {}
    })();
  `;
  // dangerouslySetInnerHTML is required here for a synchronous inline script
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
