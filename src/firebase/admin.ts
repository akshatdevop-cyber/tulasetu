import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './config.js';
import { OfficerRegistration, Officer } from '../types';
import { recordAuditLog } from './audit';

function getRegistrationsRef() {
  if (!db) throw new Error('Firebase is not configured.');
  return collection(db, 'officerRegistrations');
}

function getOfficialRecordsRef() {
  if (!db) throw new Error('Firebase is not configured.');
  return collection(db, 'officialOfficerRecords');
}

export async function getPendingRegistrations(): Promise<OfficerRegistration[]> {
  const q = query(getRegistrationsRef(), where('verificationStatus', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data() } as OfficerRegistration));
}

export async function getOfficialRecord(officerId: string) {
  const q = query(getOfficialRecordsRef(), where('officerId', '==', officerId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function approveOfficerRegistration(uid: string, adminUid: string) {
  if (!db) throw new Error('Firebase is not configured.');
  const regDocRef = doc(db, 'officerRegistrations', uid);
  const regDocSnap = await getDoc(regDocRef);
  if (!regDocSnap.exists()) throw new Error("Registration not found");

  const regData = regDocSnap.data() as OfficerRegistration;
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  batch.update(regDocRef, {
    verificationStatus: 'approved',
    reviewedBy: adminUid,
    reviewedAt: now
  });

  batch.update(doc(db, 'users', uid), {
    role: 'officer',
    verificationStatus: 'approved'
  });

  const newOfficer: Officer = {
    uid: regData.uid,
    name: regData.name,
    officerId: regData.officerId,
    jurisdiction: {
      district: regData.district,
      state: regData.state,
    },
    instrumentCategories: ["weighing_instruments", "measuring_instruments"],
    available: true,
    workload: 0,
    verificationStatus: 'approved'
  };
  
  batch.set(doc(db, 'officers', uid), newOfficer);
  await batch.commit();

  await recordAuditLog('officer_registration_approved', adminUid, uid, {
    newValue: 'approved',
    metadata: { officerName: regData.name, officerId: regData.officerId }
  });
}

export async function rejectOfficerRegistration(uid: string, adminUid: string, reason: string) {
  if (!db) throw new Error('Firebase is not configured.');
  const regDocRef = doc(db, 'officerRegistrations', uid);
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  batch.update(regDocRef, {
    verificationStatus: 'rejected',
    reviewedBy: adminUid,
    reviewedAt: now,
    rejectionReason: reason
  });

  batch.update(doc(db, 'users', uid), {
    verificationStatus: 'rejected'
  });

  await batch.commit();

  await recordAuditLog('officer_registration_rejected', adminUid, uid, {
    newValue: 'rejected',
    metadata: { reason }
  });
}
