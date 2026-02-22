'use client';

import { useStore } from '@/lib/store';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function SyncManager() {
  const { tasks, timer, settings, loadState, setSyncStatus } = useStore();
  const isLoadedRef = useRef(false);

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const authRes = await fetch('/api/auth/status');
        const { isAuthenticated } = await authRes.json();
        if (!isAuthenticated) {
          isLoadedRef.current = true; // Allow sync if not authenticated (local only)
          return;
        }

        setSyncStatus('syncing');
        const response = await fetch('/api/drive/sync');
        if (response.ok) {
          const data = await response.json();
          if (data && data.tasks) {
            loadState(data);
            toast.success('Data loaded from Drive');
          }
        }
      } catch (error) {
        console.error('Load error:', error);
        toast.error('Failed to load data from Drive');
      } finally {
        setSyncStatus('idle');
        isLoadedRef.current = true;
      }
    };
    loadData();
  }, [loadState, setSyncStatus]);

  // Auto-Sync
  useEffect(() => {
    if (!isLoadedRef.current) return;

    const syncData = async () => {
      setSyncStatus('syncing');
      try {
        const authRes = await fetch('/api/auth/status');
        const { isAuthenticated } = await authRes.json();
        
        if (!isAuthenticated) {
          setSyncStatus('idle');
          return;
        }

        const response = await fetch('/api/drive/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks, timer, settings, lastSynced: Date.now() }),
        });
        
        if (!response.ok) throw new Error('Sync failed');
        
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (error) {
        console.error('Sync error:', error);
        setSyncStatus('error');
      }
    };

    const timeoutId = setTimeout(syncData, 5000); // Debounce 5s
    return () => clearTimeout(timeoutId);
  }, [tasks, timer, settings, setSyncStatus]);

  return null;
}
