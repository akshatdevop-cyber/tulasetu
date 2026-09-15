import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

/**
 * Vite only statically replaces import.meta.env.VITE_* when the key is a
 * literal identifier. Do not read import.meta.env[dynamicKey] — those values
 * are undefined in production builds (including Vercel).
 */
const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function asNonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

const ENV_LABELS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

export function getMissingFirebaseEnvNames() {
  return Object.entries(ENV_LABELS)
    .filter(([field]) => !asNonEmptyString(firebaseWebConfig[field]))
    .map(([, envName]) => envName);
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
    'Add them in Vercel → Project Settings → Environment Variables for Production (and Preview), then Redeploy so they are available at build time.';
  console.error('[Tulasetu]', firebaseConfigError);
} else {
  try {
    const app = initializeApp({
      apiKey: asNonEmptyString(firebaseWebConfig.apiKey),
      authDomain: asNonEmptyString(firebaseWebConfig.authDomain),
      projectId: asNonEmptyString(firebaseWebConfig.projectId),
      storageBucket: asNonEmptyString(firebaseWebConfig.storageBucket),
      messagingSenderId: asNonEmptyString(firebaseWebConfig.messagingSenderId),
      appId: asNonEmptyString(firebaseWebConfig.appId),
      measurementId: asNonEmptyString(firebaseWebConfig.measurementId) || undefined,
    });
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    firebaseReady = true;
    try {
      if (typeof window !== 'undefined' && asNonEmptyString(firebaseWebConfig.measurementId)) {
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
