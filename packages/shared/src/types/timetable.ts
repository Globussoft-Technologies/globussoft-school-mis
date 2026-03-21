export interface Timetable {
  id: string;
  classId: string;
  sectionId: string;
  academicSessionId: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  slots: TimetableSlot[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  subjectId: string;
  teacherId: string;
  room?: string;
  type: 'LECTURE' | 'LAB' | 'BREAK' | 'ASSEMBLY' | 'FREE';
}

export interface Period {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  orderIndex: number;
  type: 'ACADEMIC' | 'BREAK' | 'ASSEMBLY';
}

export interface CreateTimetableDto {
  classId: string;
  sectionId: string;
  academicSessionId: string;
  effectiveFrom: string;
  slots: Omit<TimetableSlot, 'id'>[];
}
