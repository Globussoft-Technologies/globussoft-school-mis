import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getPrisma, closeTestApp } from './test-utils';

describe('Attendance Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let classId: string;
  let sectionId: string;
  let studentId: string;
  const attendanceDate = '2024-06-10';

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();

    // Fetch a class with at least one section and one student
    const cls = await prisma.class.findFirst({
      include: {
        sections: true,
      },
    });

    if (cls) {
      classId = cls.id;
      if (cls.sections && cls.sections.length > 0) {
        sectionId = cls.sections[0].id;
      }
    }

    // Fetch a student enrolled in that class
    const student = await prisma.student.findFirst({
      where: { classId, isActive: true },
    });
    if (student) {
      studentId = student.id;
    }
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /attendance/bulk', () => {
    it('should mark bulk attendance for a class', async () => {
      expect(classId).toBeDefined();
      expect(sectionId).toBeDefined();
      expect(studentId).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          classId,
          sectionId,
          date: attendanceDate,
          records: [
            { studentId, status: 'PRESENT' },
          ],
        })
        .expect(201);

      expect(res.body).toBeDefined();
    });
  });

  describe('GET /attendance/class', () => {
    it('should return class attendance for a given date', async () => {
      expect(classId).toBeDefined();
      expect(sectionId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/class?classId=${classId}&sectionId=${sectionId}&date=${attendanceDate}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /attendance/student/:studentId/summary', () => {
    it('should return attendance summary for a student', async () => {
      expect(studentId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/student/${studentId}/summary?startDate=2024-06-01&endDate=2024-06-30`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.totalDays).toBeDefined();
      expect(res.body.present).toBeDefined();
    });
  });
});
