const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Course Modules (e2e)', () => {
  let token: string;
  let classId: string;
  let subjectId: string;
  let studentId: string;
  let createdModuleId: string;
  let createdItemId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

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

  describe('POST /course-modules', () => {
    it('should create a course module and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/course-modules')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Module: Introduction',
          description: 'First module for e2e testing',
          classId,
          subjectId,
          unlockType: 'ALWAYS',
          completionCriteria: 'VIEW_ALL',
          estimatedMinutes: 45,
          items: [
            {
              title: 'Lesson 1 Video',
              type: 'VIDEO',
              contentUrl: 'https://example.com/video1.mp4',
              orderIndex: 1,
              isRequired: true,
              estimatedMinutes: 20,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Module: Introduction');
      expect(res.body.classId).toBe(classId);
      expect(res.body.subjectId).toBe(subjectId);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBe(1);

      createdModuleId = res.body.id;
      createdItemId = res.body.items[0].id;
    });

    it('should create a module without items and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/course-modules')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Module Without Items',
          classId,
          subjectId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Module Without Items');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/course-modules')
        .send({ title: 'No auth', classId, subjectId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /course-modules', () => {
    it('should list modules for a class and subject', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/course-modules?classId=${classId}&subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return modules with completion stats', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/course-modules?classId=${classId}&subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty('completionStats');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/course-modules?classId=${classId}&subjectId=${subjectId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /course-modules/:id', () => {
    it('should return a specific module by id', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/course-modules/${createdModuleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdModuleId);
      expect(res.body.title).toBe('E2E Test Module: Introduction');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should return 404 for non-existent module', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/course-modules/nonexistent-module-id-999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /course-modules/items/:itemId/complete', () => {
    it('should mark an item as completed and return 200 or 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/course-modules/items/${createdItemId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, score: 85 });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toHaveProperty('completion');
      expect(res.body.completion.status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent item', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/course-modules/items/nonexistent-item-id/complete')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /course-modules/progress/:studentId', () => {
    it('should return student progress for a class', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/course-modules/progress/${studentId}?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('studentId', studentId);
      expect(res.body).toHaveProperty('classId', classId);
      expect(res.body).toHaveProperty('totalModules');
      expect(res.body).toHaveProperty('completedModules');
      expect(res.body).toHaveProperty('overallPercentage');
      expect(Array.isArray(res.body.modules)).toBe(true);
    });

    it('should return progress filtered by subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/course-modules/progress/${studentId}?classId=${classId}&subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('subjectId', subjectId);
    });
  });

  describe('PATCH /course-modules/:id/publish', () => {
    it('should publish a module and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/course-modules/${createdModuleId}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isPublished: true });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdModuleId);
      expect(res.body.isPublished).toBe(true);
    });

    it('should unpublish a module', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/course-modules/${createdModuleId}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isPublished: false });

      expect(res.status).toBe(200);
      expect(res.body.isPublished).toBe(false);
    });

    it('should return 404 for non-existent module', async () => {
      const res = await request(getApp().getHttpServer())
        .patch('/api/v1/course-modules/nonexistent-module-id/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ isPublished: true });

      expect(res.status).toBe(404);
    });
  });
});
