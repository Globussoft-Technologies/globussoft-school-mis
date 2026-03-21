const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Feedback (e2e)', () => {
  let token: string;
  let classId: string;
  let subjectId: string;
  let sessionId: string;
  let teacherUserId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });
    const subject = await prisma.subject.findFirst({ where: { classId: cls!.id } });
    const teacher = await prisma.user.findFirst({ where: { role: 'SUBJECT_TEACHER' } });
    const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    classId = cls!.id;
    subjectId = subject!.id;
    teacherUserId = (teacher ?? admin)!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /feedback', () => {
    it('should create subject feedback and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'SUBJECT',
          subjectId,
          classId,
          rating: 4,
          comment: 'The subject is well-taught with clear explanations',
          isAnonymous: false,
          academicSessionId: sessionId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('SUBJECT');
      expect(res.body.rating).toBe(4);
    });

    it('should create teacher feedback and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'TEACHER',
          toUserId: teacherUserId,
          classId,
          rating: 5,
          comment: 'Excellent teaching methodology and very approachable',
          isAnonymous: true,
          academicSessionId: sessionId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('TEACHER');
      expect(res.body.rating).toBe(5);
    });

    it('should create general feedback and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'GENERAL',
          rating: 3,
          comment: 'School facilities need improvement',
          isAnonymous: false,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('GENERAL');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/feedback')
        .send({ type: 'GENERAL', rating: 3, comment: 'No auth feedback' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /feedback', () => {
    it('should list all feedback and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/feedback')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/feedback?type=SUBJECT')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/feedback?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by toUserId (teacher)', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/feedback?toUserId=${teacherUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/feedback?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/feedback');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /feedback/summary', () => {
    it('should return feedback summary and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/feedback/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(typeof res.body).toBe('object');
    });

    it('should return summary filtered by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/feedback/summary?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/feedback/summary');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /feedback/teacher/:teacherId', () => {
    it('should return ratings for a specific teacher', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/feedback/teacher/${teacherUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /feedback/subject/:subjectId', () => {
    it('should return feedback for a specific subject', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/feedback/subject/${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
