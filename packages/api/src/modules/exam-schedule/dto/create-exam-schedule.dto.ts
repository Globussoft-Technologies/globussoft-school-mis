export class CreateExamScheduleEntryDto {
  subjectId: string;
  date: string;       // ISO date string YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  room?: string;
  invigilatorId?: string;
}

export class CreateExamScheduleDto {
  name: string;
  type: string;            // MID_TERM | FINAL_EXAM | UNIT_TEST | MONTHLY_TEST
  classId: string;
  academicSessionId: string;
  startDate: string;       // ISO date string
  endDate: string;         // ISO date string
  status?: string;         // UPCOMING | ONGOING | COMPLETED
  entries?: CreateExamScheduleEntryDto[];
}
