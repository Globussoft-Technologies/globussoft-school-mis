export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
  description?: string;
  isElective: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Syllabus {
  id: string;
  subjectId: string;
  classId: string;
  academicSessionId: string;
  chapters: Chapter[];
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  topics: Topic[];
  estimatedHours: number;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  learningObjectives?: string[];
  estimatedMinutes: number;
}

export interface LessonPlan {
  id: string;
  syllabusId: string;
  chapterId: string;
  topicId: string;
  teacherId: string;
  classId: string;
  sectionId: string;
  scheduledDate: Date;
  objectives: string[];
  methodology: string;
  resources: string[];
  assessment?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DELIVERED';
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}
