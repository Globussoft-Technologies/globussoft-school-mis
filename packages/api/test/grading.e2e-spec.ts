const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Grading (e2e)', () => {
  let token: string;
  let subjectId: string;
  let classId: string;
  let studentId: string;
  let sessionId: string;
  let createdGradeId: string;
  let createdReportCardId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const class10 = await prisma.class.findFirst({ where: { grade: 10 } });
    const subject = await prisma.subject.findFirst({ where: { classId: class10!.id } });
    const student = await prisma.student.findFirst();

    classId = class10!.id;
    subjectId = subject!.id;
    studentId = student!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /grading', () => {
    it('should create a grade and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/grading')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          subjectId,
          type: 'CLASSWORK',
          marksObtained: 85,
          maxMarks: 100,
          remarks: 'Good performance in classwork',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.subjectId).toBe(subjectId);
      expect(res.body.marksObtained).toBe(85);
      expect(res.body.maxMarks).toBe(100);

      createdGradeId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/grading')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/grading')
        .send({ studentId, subjectId, type: 'CLASSWORK', marksObtained: 80, maxMarks: 100 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /grading/student/:studentId', () => {
    it('should return grades for a student', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/grading/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/grading/student/${studentId}?subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/grading/student/${studentId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /grading/class', () => {
    it('should return class grades filtered by classId and subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/grading/class?classId=${classId}&subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/grading/class?classId=${classId}&subjectId=${subjectId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /report-cards/generate', () => {
    it('should generate a report card and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/report-cards/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          classId,
          academicSessionId: sessionId,
          term: 'TERM_1',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.classId).toBe(classId);
      expect(res.body.term).toBe('TERM_1');

      createdReportCardId = res.body.id;
    });

    it('should return 400 or 500 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/report-cards/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId });

      expect([400, 500]).toContain(res.status);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/report-cards/generate')
        .send({ studentId, classId, academicSessionId: sessionId, term: 'TERM_1' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /report-cards/student/:studentId', () => {
    it('should return report cards for a student', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/report-cards/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/report-cards/student/${studentId}`);

      expect(res.status).toBe(401);
    });
  });
});
