import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from './config.js';
import { OfficerRegistration } from '../types';

export async function uploadIdCard(uid: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const storageRef = ref(storage, `officer-id-cards/${uid}/id_card_${Date.now()}.${fileExt}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

export async function submitOfficerRegistration(
  uid: string,
  registrationData: Omit<OfficerRegistration, 'uid' | 'verificationStatus' | 'submittedAt'>
) {
  const data: OfficerRegistration = {
    ...registrationData,
    uid,
    verificationStatus: 'pending',
    submittedAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'officerRegistrations', uid), data);
}
