import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './config.js';
import { Officer, Application } from '../types';
import { recordAuditLog } from './audit';

import * as turf from '@turf/turf';

/**
 * Automatically assigns an application to an eligible officer.
 * In a production environment, this logic MUST be moved to a Firebase Cloud Function.
 */
export async function autoAllocateApplication(appId: string, district: string, category: string, appLat?: number, appLng?: number) {
  // 1. Find eligible officers in the same district, who are approved and available
  const officersRef = collection(db, 'officers');
  const q = query(
    officersRef, 
    where('jurisdiction.district', '==', district),
    where('verificationStatus', '==', 'approved'),
    where('available', '==', true)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // No eligible officer found
    await updateDoc(doc(db, 'applications', appId), {
      assignmentStatus: 'unassigned'
    });
    return null;
  }

  const officers = snapshot.docs.map(d => d.data() as Officer);

  // 2. Filter by instrument category support
  const eligibleOfficers = officers.filter(off => 
    off.instrumentCategories.includes('weighing_instruments') || 
    off.instrumentCategories.includes('measuring_instruments') // Simplify for MVP
  );

  if (eligibleOfficers.length === 0) {
    await updateDoc(doc(db, 'applications', appId), {
      assignmentStatus: 'unassigned'
    });
    return null;
  }

  // 3. Sort by workload, then distance (tie-breaker)
  eligibleOfficers.sort((a, b) => {
    if (a.workload !== b.workload) {
      return a.workload - b.workload;
    }
    // If workloads are equal and coordinates are available, use distance as a tie-breaker
    if (appLat !== undefined && appLng !== undefined && a.location && b.location) {
      const appPoint = turf.point([appLng, appLat]);
      const distA = turf.distance(appPoint, turf.point([a.location.longitude, a.location.latitude]));
      const distB = turf.distance(appPoint, turf.point([b.location.longitude, b.location.latitude]));
      return distA - distB;
    }
    return 0;
  });
  const selectedOfficer = eligibleOfficers[0];

  // 4. Assign the application and increment officer's workload using a batch
  const batch = writeBatch(db);
  
  batch.update(doc(db, 'applications', appId), {
    assignedOfficerId: selectedOfficer.uid,
    assignedOfficerName: selectedOfficer.name,
    assignedAt: new Date().toISOString(),
    assignmentStatus: 'assigned'
  });

  batch.update(doc(db, 'officers', selectedOfficer.uid), {
    workload: selectedOfficer.workload + 1
  });

  await batch.commit();

  await recordAuditLog('officer_assigned', 'system', appId, {
    newValue: selectedOfficer.uid,
    metadata: { officerName: selectedOfficer.name, district }
  });

  return selectedOfficer;
}
