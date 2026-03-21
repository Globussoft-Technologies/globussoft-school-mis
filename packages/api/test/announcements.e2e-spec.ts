const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Announcements (e2e)', () => {
  let token: string;
  let schoolId: string;
  let classId: string;
  let createdAnnouncementId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });
    classId = cls!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /announcements', () => {
    it('should create an announcement and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Announcement: Annual Sports Day',
          content: 'Annual Sports Day will be held on April 15th. All students must participate.',
          type: 'GENERAL',
          audience: 'ALL',
          schoolId,
          priority: 'HIGH',
          isPublished: false,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Announcement: Annual Sports Day');
      expect(res.body.type).toBe('GENERAL');
      expect(res.body.audience).toBe('ALL');

      createdAnnouncementId = res.body.id;
    });

    it('should create a class-specific announcement', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Class Announcement: Test Rescheduled',
          content: 'The math test scheduled for tomorrow has been rescheduled to next week.',
          type: 'ACADEMIC',
          audience: 'CLASS',
          classId,
          schoolId,
          priority: 'NORMAL',
          isPublished: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.classId).toBe(classId);
      expect(res.body.isPublished).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/announcements')
        .send({ title: 'No auth', content: 'Test', type: 'GENERAL', audience: 'ALL', schoolId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /announcements', () => {
    it('should list all announcements and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/announcements')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/announcements?type=GENERAL')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by audience', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/announcements?audience=ALL')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by isPublished status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/announcements?isPublished=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/announcements');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /announcements/active', () => {
    it('should return active announcements for a school', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/announcements/active?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/announcements/active?schoolId=${schoolId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /announcements/:id', () => {
    it('should return a specific announcement by id', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/announcements/${createdAnnouncementId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdAnnouncementId);
      expect(res.body.title).toBe('E2E Test Announcement: Annual Sports Day');
    });

    it('should return 404 for non-existent announcement', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/announcements/nonexistent-announcement-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /announcements/:id/publish', () => {
    it('should publish an announcement and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/announcements/${createdAnnouncementId}/publish`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdAnnouncementId);
      expect(res.body.isPublished).toBe(true);
    });
  });

  describe('PATCH /announcements/:id', () => {
    it('should update an announcement and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/announcements/${createdAnnouncementId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'E2E Test Announcement: Updated Sports Day', priority: 'URGENT' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdAnnouncementId);
      expect(res.body.title).toBe('E2E Test Announcement: Updated Sports Day');
    });
  });

  describe('DELETE /announcements/:id', () => {
    it('should delete an announcement and return 200', async () => {
      // Create a throwaway announcement to delete
      const createRes = await request(getApp().getHttpServer())
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Announcement To Delete',
          content: 'This will be deleted',
          type: 'GENERAL',
          audience: 'ALL',
          schoolId,
        });
      const deleteId = createRes.body.id;

      const res = await request(getApp().getHttpServer())
        .delete(`/api/v1/announcements/${deleteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
