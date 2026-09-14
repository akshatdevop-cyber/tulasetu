import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const REQUIRED_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

function readEnv(name) {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getMissingFirebaseEnvNames() {
  return REQUIRED_ENV.filter((name) => !readEnv(name));
}

export let db = null;
export let auth = null;
export let storage = null;
export let analytics = null;
export let firebaseReady = false;
/** User-facing message. Never includes secret values. */
export let firebaseConfigError = null;

const missing = getMissingFirebaseEnvNames();

if (missing.length > 0) {
  firebaseConfigError =
    `Missing required environment variables: ${missing.join(', ')}. ` +
    'Add them in Vercel → Project Settings → Environment Variables (then redeploy), or in a local .env file.';
  console.error('[Tulasetu]', firebaseConfigError);
} else {
  try {
    const app = initializeApp({
      apiKey: readEnv('VITE_FIREBASE_API_KEY'),
      authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: readEnv('VITE_FIREBASE_APP_ID'),
      measurementId: readEnv('VITE_FIREBASE_MEASUREMENT_ID') || undefined,
    });
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    firebaseReady = true;
    try {
      if (typeof window !== 'undefined' && readEnv('VITE_FIREBASE_MEASUREMENT_ID')) {
        analytics = getAnalytics(app);
      }
    } catch (analyticsErr) {
      console.warn('[Tulasetu] Analytics unavailable:', analyticsErr?.message || analyticsErr);
      analytics = null;
    }
  } catch (err) {
    firebaseReady = false;
    firebaseConfigError =
      'Firebase failed to initialize. Confirm the VITE_FIREBASE_* variables match your Firebase web app config.';
    console.error('[Tulasetu] Firebase initialization failed', err?.code || err?.message || err);
  }
}
