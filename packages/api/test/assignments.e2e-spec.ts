const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Assignments (e2e)', () => {
  let token: string;
  let classId: string;
  let sessionId: string;
  let subjectId: string;
  let createdAssignmentId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const classObj = await prisma.class.findFirst();
    classId = classObj!.id;

    const subject = await prisma.subject.findFirst({ where: { classId } });
    subjectId = subject!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /assignments', () => {
    it('should create an assignment and return 201', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const res = await request(getApp().getHttpServer())
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `E2E Assignment ${Date.now()}`,
          instructions: 'Complete all questions as part of e2e testing',
          type: 'TEXT_RESPONSE',
          subjectId,
          classId,
          dueDate: dueDate.toISOString(),
          totalMarks: 20,
          allowLate: false,
          academicSessionId: sessionId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('TEXT_RESPONSE');
      expect(res.body.totalMarks).toBe(20);
      expect(res.body.classId).toBe(classId);

      createdAssignmentId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Incomplete Assignment' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const res = await request(getApp().getHttpServer())
        .post('/api/v1/assignments')
        .send({
          title: 'No Auth Assignment',
          type: 'TEXT_RESPONSE',
          subjectId,
          classId,
          dueDate: dueDate.toISOString(),
          totalMarks: 10,
          academicSessionId: sessionId,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /assignments', () => {
    it('should list all assignments and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/assignments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/assignments?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/assignments?subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/assignments?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/assignments');

      expect(res.status).toBe(401);
    });
  });
});
