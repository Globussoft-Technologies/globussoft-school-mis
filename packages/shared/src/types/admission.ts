import { AdmissionStatus } from '../constants/status';
import { Address, Guardian } from './student';

export interface AdmissionEnquiry {
  id: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  classAppliedFor: string;
  status: AdmissionStatus;
  source: 'WALK_IN' | 'WEBSITE' | 'REFERRAL' | 'ADVERTISEMENT';
  notes?: string;
  assignedTo?: string;
  academicSessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdmissionApplication {
  id: string;
  enquiryId: string;
  formNumber: string;
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  classAppliedFor: string;
  previousSchool?: string;
  address: Address;
  guardians: Omit<Guardian, 'id'>[];
  documents: AdmissionDocument[];
  status: AdmissionStatus;
  academicSessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdmissionDocument {
  id: string;
  type: 'BIRTH_CERTIFICATE' | 'TRANSFER_CERTIFICATE' | 'REPORT_CARD' | 'PHOTO' | 'AADHAAR' | 'OTHER';
  fileName: string;
  fileUrl: string;
  verified: boolean;
}

export interface CreateEnquiryDto {
  studentName: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  classAppliedFor: string;
  source: 'WALK_IN' | 'WEBSITE' | 'REFERRAL' | 'ADVERTISEMENT';
  notes?: string;
  academicSessionId: string;
}
