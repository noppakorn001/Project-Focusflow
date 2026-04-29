/**
 * firestore-sync.ts
 *
 * Thin wrapper around Firestore for reading/writing the user's FocusFlow data.
 * All data lives in a single document:
 *   /users/{uid}/data/focusflow
 */

import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, Category, TimerSettings, FocusReflection } from './store';

export interface FirestorePayload {
  tasks: Task[];
  categories: Category[];
  settings: TimerSettings;
  sessionReflections: FocusReflection[];
  lastSynced: number;
}

function userDocRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'focusflow');
}

/** Load the user's data from Firestore. Returns null if no data yet. */
export async function loadFromFirestore(uid: string): Promise<FirestorePayload | null> {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as FirestorePayload;
}

/** Save the user's data to Firestore (full overwrite of the single document). */
export async function saveToFirestore(uid: string, payload: FirestorePayload): Promise<void> {
  await setDoc(userDocRef(uid), payload, { merge: true });
}
