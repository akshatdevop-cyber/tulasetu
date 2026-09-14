export type UserRole = 'business' | 'officer' | 'pending_officer' | 'admin' | null;

export type ApplicationStatus = 'submitted' | 'under_review' | 'inspection_scheduled' | 'Approved' | 'Rejected' | 'Revoked' | 'Pending';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Location {
  address: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface OfficerRegistration {
  uid: string;
  name: string;
  email: string;
  officerId: string;
  department: string;
  designation: string;
  district: string;
  state: string;
  idCardImageUrl: string;
  verificationStatus: VerificationStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface Officer {
  uid: string;
  name: string;
  officerId: string;
  jurisdiction: {
    district: string;
    state: string;
  };
  instrumentCategories: string[];
  available: boolean;
  workload: number;
  verificationStatus: VerificationStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Application {
  id: string;
  ownerId?: string;
  instrumentName: string;
  instrumentType: string;
  serialNumber: string;
  ownerName: string;
  ownerContact: string;
  address: string;
  location?: Location;
  status: ApplicationStatus;
  submittedAt: string; // ISO string
  inspectionResult?: 'Pass' | 'Fail';
  remarks?: string;
  verifiedBy?: string;
  certificateId?: string;
  issueDate?: string; // ISO string
  expiryDate?: string; // ISO string
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedAt?: string;
  assignmentStatus?: 'unassigned' | 'assigned' | 'reassigned';
}
