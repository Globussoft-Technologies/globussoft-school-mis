const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Learning Paths (e2e)', () => {
  let token: string;
  let schoolId: string;
  let classId: string;
  let subjectId: string;
  let studentId: string;
  let createdPathId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });
    const subject = await prisma.subject.findFirst({ where: { classId: cls!.id } });
    const student = await prisma.student.findFirst();

    classId = cls!.id;
    subjectId = subject!.id;
    studentId = student!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /learning-paths', () => {
    it('should create a learning path with steps and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/learning-paths')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Learning Path: Algebra Mastery',
          description: 'A comprehensive path to master algebra',
          classId,
          subjectId,
          schoolId,
          difficulty: 'INTERMEDIATE',
          estimatedHours: 10,
          steps: [
            {
              title: 'Step 1: Introduction to Variables',
              type: 'CONTENT',
              resourceUrl: 'https://example.com/algebra-intro',
              orderIndex: 1,
              isOptional: false,
              estimatedMinutes: 30,
            },
            {
              title: 'Step 2: Practice Problems',
              type: 'ASSESSMENT',
              description: 'Complete 10 practice problems',
              orderIndex: 2,
              isOptional: false,
              estimatedMinutes: 60,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Learning Path: Algebra Mastery');
      expect(res.body.schoolId).toBe(schoolId);
      expect(Array.isArray(res.body.steps)).toBe(true);
      expect(res.body.steps.length).toBe(2);

      createdPathId = res.body.id;
    });

    it('should create a learning path without steps and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/learning-paths')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Empty Learning Path',
          schoolId,
          classId,
          difficulty: 'BEGINNER',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Empty Learning Path');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/learning-paths')
        .send({ title: 'No auth path', schoolId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /learning-paths', () => {
    it('should list all learning paths and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/learning-paths')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter paths by schoolId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/learning-paths?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter paths by classId and subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/learning-paths?classId=${classId}&subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/learning-paths');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /learning-paths/:id', () => {
    it('should return a specific learning path by id', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/learning-paths/${createdPathId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdPathId);
      expect(res.body.title).toBe('E2E Test Learning Path: Algebra Mastery');
      expect(Array.isArray(res.body.steps)).toBe(true);
    });

    it('should return 404 for non-existent path', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/learning-paths/nonexistent-path-id-9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /learning-paths/:id/enroll', () => {
    it('should enroll a student in a learning path and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/learning-paths/${createdPathId}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.pathId).toBe(createdPathId);
      expect(res.body.studentId).toBe(studentId);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/learning-paths/${createdPathId}/enroll`)
        .send({ studentId });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /learning-paths/:id/publish', () => {
    it('should publish a learning path and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/learning-paths/${createdPathId}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isPublished: true });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdPathId);
      expect(res.body.isPublished).toBe(true);
    });

    it('should unpublish a learning path', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/learning-paths/${createdPathId}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isPublished: false });

      expect(res.status).toBe(200);
      expect(res.body.isPublished).toBe(false);
    });
  });
});
