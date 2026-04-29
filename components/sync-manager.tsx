'use client';

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { loadFromFirestore, saveToFirestore } from '@/lib/firestore-sync';
import { useStore } from '@/lib/store';

export function SyncManager() {
  const { tasks, categories, settings, sessionReflections, loadState, setSyncStatus, clearUserData } = useStore();
  const isLoadedRef  = useRef(false);
  const currentUidRef = useRef<string | null>(null);

  // ── Initial Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const previousUid = currentUidRef.current;
      currentUidRef.current = user?.uid ?? null;

      if (!user) {
        // User signed out — clear all data from memory and localStorage
        if (previousUid !== null) {
          clearUserData();
        }
        isLoadedRef.current = true;
        setSyncStatus('idle');
        return;
      }

      setSyncStatus('syncing');
      try {
        const data = await loadFromFirestore(user.uid);
        if (data?.tasks) {
          loadState(data);
          toast.success('Data loaded from cloud');
        }
      } catch (err) {
        console.error('Load error:', err);
        toast.error('Failed to load data from cloud');
      } finally {
        setSyncStatus('idle');
        isLoadedRef.current = true;
      }
    });

    return () => unsubscribe();
  }, [loadState, setSyncStatus, clearUserData]);

  // ── Auto-Save (debounced 5 s after any state change) ────────────────────────
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const uid = currentUidRef.current;
    if (!uid) return;

    const timer = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await saveToFirestore(uid, {
          tasks,
          categories,
          settings,
          sessionReflections,
          lastSynced: Date.now(),
        });
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (err) {
        console.error('Sync error:', err);
        setSyncStatus('error');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [tasks, categories, settings, sessionReflections, setSyncStatus]);

  return null;
}
