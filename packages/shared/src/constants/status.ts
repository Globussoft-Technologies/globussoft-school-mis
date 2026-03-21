export const AdmissionStatus = {
  ENQUIRY: 'ENQUIRY',
  APPLICATION: 'APPLICATION',
  ENTRANCE_TEST: 'ENTRANCE_TEST',
  INTERVIEW: 'INTERVIEW',
  OFFER: 'OFFER',
  ACCEPTED: 'ACCEPTED',
  ENROLLED: 'ENROLLED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type AdmissionStatus =
  (typeof AdmissionStatus)[keyof typeof AdmissionStatus];

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  EXCUSED: 'EXCUSED',
} as const;

export type AttendanceStatus =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const AcademicSessionStatus = {
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;

export type AcademicSessionStatus =
  (typeof AcademicSessionStatus)[keyof typeof AcademicSessionStatus];
