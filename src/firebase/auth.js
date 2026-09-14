import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config.js';

/**
 * Create a new user account and store their profile (role, name) in Firestore.
 * @param {string} email
 * @param {string} password
 * @param {'business' | 'officer'} role
 * @param {string} name
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signup(email, password, role, name) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // Write user profile to Firestore
  await setDoc(doc(db, 'users', uid), {
    email,
    role,
    name,
    createdAt: new Date().toISOString(),
  });

  return userCredential;
}

/**
 * Sign in an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 */
export async function logout() {
  return signOut(auth);
}

/**
 * Retrieve a user's role and name from Firestore.
 * @param {string} uid
 * @returns {Promise<{ role: 'business' | 'officer'; name: string } | null>}
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { role: data.role, name: data.name };
}
