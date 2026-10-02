import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, Firestore, Unsubscribe } from 'firebase/firestore';
import { DayBedsData, BedData } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBtvOvdBa-CaH4GZq7bGrufhQ7TpgZ2A1A",
  authDomain: "icu-dashboard-5046c.firebaseapp.com",
  projectId: "icu-dashboard-5046c",
  storageBucket: "icu-dashboard-5046c.firebasestorage.app",
  messagingSenderId: "102667173452",
  appId: "1:102667173452:web:f135dff7c140d068fafee9",
  measurementId: "G-0C1QLVVRCD"
};

const APP_DOC_ID = 'icu-dashboard-produksi';

let auth: Auth | null = null;
let db: Firestore | null = null;
let isInitialized = false;

try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isInitialized = true;
} catch (err) {
  console.warn("Firebase initialization skipped or failed, falling back to local storage:", err);
}

export async function initFirebaseAuth(): Promise<boolean> {
  if (!isInitialized || !auth) return false;
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    return true;
  } catch (err) {
    console.warn("Firebase anonymous sign-in error:", err);
    return false;
  }
}

export function subscribeToDateRecords(
  dateStr: string,
  onDataUpdate: (beds: DayBedsData | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe | null {
  if (!db || !auth?.currentUser) {
    return null;
  }

  try {
    const docRef = doc(db, 'artifacts', APP_DOC_ID, 'public', 'data', 'daily_records', dateStr);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onDataUpdate((data?.beds as DayBedsData) || {});
        } else {
          onDataUpdate(null);
        }
      },
      (error) => {
        console.warn("Firestore snapshot error:", error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to date records:", err);
    return null;
  }
}

export async function saveBedsToRemote(
  dateStr: string,
  dataToSave: Partial<DayBedsData>
): Promise<boolean> {
  // Always update local cache first
  saveToLocalStorage(dateStr, dataToSave);

  if (!db || !auth?.currentUser) {
    return false;
  }

  try {
    const docRef = doc(db, 'artifacts', APP_DOC_ID, 'public', 'data', 'daily_records', dateStr);
    await setDoc(docRef, { beds: dataToSave }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Failed to save to Firestore:", err);
    return false;
  }
}

export async function getBedsForDate(dateStr: string): Promise<DayBedsData | null> {
  // Check remote first if available
  if (db && auth?.currentUser) {
    try {
      const docRef = doc(db, 'artifacts', APP_DOC_ID, 'public', 'data', 'daily_records', dateStr);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return (data?.beds as DayBedsData) || null;
      }
    } catch (err) {
      console.warn("Failed to fetch from Firestore:", err);
    }
  }

  // Fallback to local storage
  return getFromLocalStorage(dateStr);
}

// Local Storage helpers
const STORAGE_KEY = 'med_fluid_app_data';

export function getFromLocalStorage(dateStr: string): DayBedsData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[dateStr] || null;
  } catch {
    return null;
  }
}

export function saveToLocalStorage(dateStr: string, dataToSave: Partial<DayBedsData>): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    if (!all[dateStr]) {
      all[dateStr] = {};
    }
    all[dateStr] = {
      ...all[dateStr],
      ...dataToSave
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn("LocalStorage save error:", err);
  }
}

export function getCustomBeds(): string[] {
  try {
    const raw = localStorage.getItem('custom_beds');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomBeds(beds: string[]): void {
  try {
    localStorage.setItem('custom_beds', JSON.stringify(beds));
  } catch (err) {
    console.warn("LocalStorage custom beds error:", err);
  }
}

export function getCustomDoctors(): string[] {
  try {
    const raw = localStorage.getItem('custom_doctors');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomDoctor(name: string): void {
  const clean = name.trim();
  if (!clean) return;
  try {
    const doctors = getCustomDoctors();
    if (!doctors.includes(clean)) {
      doctors.push(clean);
      localStorage.setItem('custom_doctors', JSON.stringify(doctors));
    }
  } catch (err) {
    console.warn("LocalStorage custom doctor error:", err);
  }
}
