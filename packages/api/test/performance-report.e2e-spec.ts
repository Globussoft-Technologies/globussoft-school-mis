const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Performance Report (e2e)', () => {
  let token: string;
  let studentId: string;
  let classId: string;
  let sessionId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const student = await prisma.student.findFirst();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });

    studentId = student!.id;
    classId = cls!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /performance-report/student/:studentId', () => {
    it('should generate a performance report for a student and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/performance-report/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Report is nested: { student: { id }, performance, attendance, ... }
      expect(res.body).toHaveProperty('student');
      expect(res.body.student).toHaveProperty('id', studentId);
    });

    it('should generate report filtered by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/performance-report/student/${studentId}?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('student');
      expect(res.body.student).toHaveProperty('id', studentId);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/performance-report/student/${studentId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /performance-report/class/:classId', () => {
    it('should generate a performance report for a class and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/performance-report/class/${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Report is nested: { class: { id }, totalStudents, students, ... }
      expect(res.body).toHaveProperty('class');
      expect(res.body.class).toHaveProperty('id', classId);
    });

    it('should generate class report filtered by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/performance-report/class/${classId}?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/performance-report/class/${classId}`);

      expect(res.status).toBe(401);
    });
  });
});
