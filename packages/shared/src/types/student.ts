export interface Student {
  id: string;
  admissionNo: string;
  userId: string;
  classId: string;
  sectionId: string;
  rollNo?: number;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address: Address;
  guardians: Guardian[];
  medicalInfo?: MedicalInfo;
  isActive: boolean;
  academicSessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Guardian {
  id: string;
  relation: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  name: string;
  phone: string;
  email?: string;
  occupation?: string;
  userId?: string;
}

export interface MedicalInfo {
  allergies?: string[];
  conditions?: string[];
  emergencyContact: string;
}

export interface CreateStudentDto {
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string;
  classId: string;
  sectionId: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address: Address;
  guardians: Omit<Guardian, 'id'>[];
  medicalInfo?: MedicalInfo;
  academicSessionId: string;
}
