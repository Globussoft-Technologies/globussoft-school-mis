import { AttendanceStatus } from '../constants/status';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  sectionId: string;
  date: Date;
  status: AttendanceStatus;
  markedBy: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkAttendanceDto {
  classId: string;
  sectionId: string;
  date: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}

export interface AttendanceSummary {
  studentId: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  excused: number;
  percentage: number;
}
