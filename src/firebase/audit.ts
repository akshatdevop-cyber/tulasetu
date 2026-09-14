import { collection, addDoc } from 'firebase/firestore';
import { db } from './config.js';

export type AuditAction =
  | 'application_submitted'
  | 'officer_registration_submitted'
  | 'officer_registration_approved'
  | 'officer_registration_rejected'
  | 'officer_assigned'
  | 'officer_reassigned'
  | 'inspection_recorded'
  | 'application_approved'
  | 'application_rejected'
  | 'certificate_issued'
  | 'certificate_revoked';

interface AuditLogEntry {
  action: AuditAction;
  performedBy: string;
  targetId: string;
  previousValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, any>;
  timestamp: string;
}

const auditLogsRef = collection(db, 'auditLogs');

/**
 * Record an audit log entry for important actions.
 */
export async function recordAuditLog(
  action: AuditAction,
  performedBy: string,
  targetId: string,
  options?: {
    previousValue?: string | null;
    newValue?: string | null;
    metadata?: Record<string, any>;
  }
) {
  const entry: AuditLogEntry = {
    action,
    performedBy,
    targetId,
    previousValue: options?.previousValue ?? null,
    newValue: options?.newValue ?? null,
    metadata: options?.metadata ?? {},
    timestamp: new Date().toISOString()
  };

  try {
    await addDoc(auditLogsRef, entry);
  } catch (err) {
    console.error('Failed to record audit log:', err);
    // Non-blocking: audit failures should not break the main workflow
  }
}
