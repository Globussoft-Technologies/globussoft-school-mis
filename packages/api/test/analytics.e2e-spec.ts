const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Analytics (e2e)', () => {
  let token: string;
  let classId: string;
  let studentId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const class10 = await prisma.class.findFirst({ where: { grade: 10 } });
    const student = await prisma.student.findFirst();

    classId = class10!.id;
    studentId = student!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /analytics/student/:studentId', () => {
    it('should return student performance analytics with status 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/analytics/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/analytics/student/${studentId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /analytics/class/:classId', () => {
    it('should return class analytics with status 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/analytics/class/${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should accept subjectId filter', async () => {
      const prisma = getPrisma();
      const subject = await prisma.subject.findFirst({ where: { classId } });

      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/analytics/class/${classId}?subjectId=${subject!.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/analytics/class/${classId}`);

      expect(res.status).toBe(401);
    });
  });
});
