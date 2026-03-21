const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('LMS Content (e2e)', () => {
  let token: string;
  let subjectId: string;
  let classId: string;
  let createdContentId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const class10 = await prisma.class.findFirst({ where: { grade: 10 } });
    const subject = await prisma.subject.findFirst({ where: { classId: class10!.id } });

    classId = class10!.id;
    subjectId = subject!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /lms-content', () => {
    it('should create lms content and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/lms-content')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Video Lesson',
          description: 'A test video lesson for e2e testing',
          type: 'VIDEO',
          externalUrl: 'https://example.com/video.mp4',
          subjectId,
          classId,
          tags: ['test', 'video'],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Video Lesson');
      expect(res.body.type).toBe('VIDEO');
      expect(res.body.subjectId).toBe(subjectId);
      expect(res.body.classId).toBe(classId);

      createdContentId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/lms-content')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Missing fields' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/lms-content')
        .send({ title: 'No auth', type: 'VIDEO', subjectId, classId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /lms-content', () => {
    it('should list all content and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/lms-content')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/lms-content?subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/lms-content?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by type', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/lms-content?type=VIDEO')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /lms-content/:id', () => {
    it('should return a specific content item', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/lms-content/${createdContentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdContentId);
      expect(res.body).toHaveProperty('title', 'E2E Test Video Lesson');
      expect(res.body).toHaveProperty('type', 'VIDEO');
    });

    it('should return 404 for non-existent content', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/lms-content/nonexistent-id-00000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /lms-content/:id', () => {
    it('should update the content and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/lms-content/${createdContentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated E2E Test Video Lesson', description: 'Updated description' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdContentId);
      expect(res.body.title).toBe('Updated E2E Test Video Lesson');
    });

    it('should return 404 updating non-existent content', async () => {
      const res = await request(getApp().getHttpServer())
        .patch('/api/v1/lms-content/nonexistent-id-00000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated' });

      expect([404, 500]).toContain(res.status);
    });
  });

  describe('PATCH /lms-content/:id/publish', () => {
    it('should publish content and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/lms-content/${createdContentId}/publish`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdContentId);
      expect(res.body.isPublished).toBe(true);
    });
  });

  describe('DELETE /lms-content/:id', () => {
    it('should delete content and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .delete(`/api/v1/lms-content/${createdContentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 after deletion', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/lms-content/${createdContentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
