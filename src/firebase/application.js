import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './config.js';
import { calculateExpiryDate } from '../constants/legalMetrologyRules.js';
import { recordAuditLog } from './audit.ts';

function getApplicationsRef() {
  if (!db) throw new Error('Firebase is not configured.');
  return collection(db, 'applications');
}

/**
 * Submit a new verification application.
 * @param {object} data - Form data (instrumentName, instrumentType, serialNumber, ownerName, ownerContact, address)
 * @param {string} uid - The authenticated user's UID
 * @returns {Promise<string>} The Firestore document ID of the new application
 */
export async function submitApplication(data, uid) {
  const docRef = await addDoc(getApplicationsRef(), {
    ...data,
    ownerId: uid,
    status: 'Pending',
    submittedAt: new Date().toISOString(),
  });
  return docRef.id;
}

/**
 * Get all pending applications (for officer dashboard).
 * @returns {Promise<Array>} Array of application objects with `id` set to Firestore doc ID
 */
export async function getPendingApplications() {
  const q = query(
    getApplicationsRef(),
    where('status', '==', 'Pending'),
    orderBy('submittedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribe to all applications for the officer dashboard (real-time).
 * @param {function} callback - Called with the array of applications whenever data changes
 * @returns {function} Unsubscribe function
 */
export function onAllApplicationsSnapshot(callback) {
  if (!db) {
    console.error('[Tulasetu] Cannot subscribe to applications: Firebase is not configured.');
    callback([]);
    return () => {};
  }
  const q = query(getApplicationsRef(), orderBy('submittedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(apps);
    },
    (error) => {
      console.error('[Tulasetu] Applications listener failed:', error?.code || error?.message || error);
      callback([]);
    }
  );
}

/**
 * Subscribe to applications owned by a specific user (real-time for business dashboard).
 * @param {string} uid - The user's UID
 * @param {function} callback - Called with the array of applications whenever data changes
 * @returns {function} Unsubscribe function
 */
export function getUserApplications(uid, callback) {
  if (!db) {
    console.error('[Tulasetu] Cannot subscribe to applications: Firebase is not configured.');
    callback([]);
    return () => {};
  }
  const q = query(
    getApplicationsRef(),
    where('ownerId', '==', uid),
    orderBy('submittedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(apps);
    },
    (error) => {
      console.error('[Tulasetu] User applications listener failed:', error?.code || error?.message || error);
      callback([]);
    }
  );
}

/**
 * Fetch a single application by its Firestore document ID.
 * @param {string} appId - Firestore document ID
 * @returns {Promise<object | null>} The application object or null if not found
 */
export async function getApplicationById(appId) {
  if (!db) throw new Error('Firebase is not configured.');
  const snap = await getDoc(doc(db, 'applications', appId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Approve an application: set status to Approved, generate certificateId, compute expiry.
 * @param {string} appId - Firestore document ID
 * @param {string} instrumentType - Must match a key in INSTRUMENT_CATEGORIES
 * @param {string} officerName - Name/designation of the approving officer
 * @param {string} remarks - Inspection remarks
 * @returns {Promise<{ certificateId: string; issueDate: string; expiryDate: string }>}
 */
export async function approveApplication(appId, instrumentType, officerName, remarks) {
  const applicationDoc = await getApplicationById(appId);
  if (!applicationDoc) throw new Error("Application not found");

  // Prevent generating duplicate certificates if already approved
  let certificateId = applicationDoc.certificateId;
  let issueDate = applicationDoc.issueDate;
  let expiryDate = applicationDoc.expiryDate;

  if (applicationDoc.status !== 'Approved' || !certificateId) {
    certificateId = `CERT-LM${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    issueDate = now.toISOString();
    expiryDate = calculateExpiryDate(now, instrumentType).toISOString();
  }

  if (!db) throw new Error('Firebase is not configured.');
  const batch = writeBatch(db);

  // 1. Update the original application document
  batch.update(doc(db, 'applications', appId), {
    status: 'Approved',
    inspectionResult: 'Pass',
    remarks: remarks.trim(),
    verifiedBy: officerName.trim(),
    certificateId,
    issueDate,
    expiryDate,
  });

  // 2. Create/Update public certificate document in 'certificates' collection
  // Document ID is the certificateId to allow direct lookup via getDoc
  batch.set(doc(db, 'certificates', certificateId), {
    certificateId,
    applicationId: appId,
    instrumentName: applicationDoc.instrumentName,
    instrumentType: applicationDoc.instrumentType,
    serialNumber: applicationDoc.serialNumber,
    ownerName: applicationDoc.ownerName,
    address: applicationDoc.address,
    issueDate,
    expiryDate,
    status: 'Approved',
    verifiedBy: officerName.trim()
  });

  await batch.commit();

  // Record audit log
  await recordAuditLog('application_approved', officerName.trim(), appId, {
    newValue: certificateId,
    metadata: { instrumentType, issueDate, expiryDate }
  });
  await recordAuditLog('certificate_issued', officerName.trim(), certificateId, {
    metadata: { applicationId: appId }
  });

  return { certificateId, issueDate, expiryDate };
}

/**
 * Reject an application: set status to Rejected with remarks.
 * @param {string} appId - Firestore document ID
 * @param {string} remarks - Rejection reasons
 * @param {string} officerName - Name/designation of the rejecting officer
 * @returns {Promise<void>}
 */
export async function rejectApplication(appId, remarks, officerName) {
  if (!db) throw new Error('Firebase is not configured.');
  await updateDoc(doc(db, 'applications', appId), {
    status: 'Rejected',
    inspectionResult: 'Fail',
    remarks: remarks.trim(),
    verifiedBy: (officerName || 'Inspector Legal Metrology').trim(),
  });

  // Record audit log
  await recordAuditLog('application_rejected', (officerName || 'Inspector Legal Metrology').trim(), appId, {
    metadata: { remarks: remarks.trim() }
  });
}

/**
 * Verify a certificate by its certificate ID (public — no auth required).
 * @param {string} certificateId - e.g. "CERT-LM748291"
 * @returns {Promise<object | null>} The matching application or null
 */
export async function verifyCertificate(certificateId) {
  if (!db) throw new Error('Firebase is not configured.');
  const clean = certificateId.trim().toUpperCase();
  const certDoc = await getDoc(doc(db, 'certificates', clean));
  if (!certDoc.exists()) return null;
  return { id: certDoc.id, ...certDoc.data() };
}
