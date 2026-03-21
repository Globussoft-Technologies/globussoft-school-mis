const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Notifications (e2e)', () => {
  let token: string;
  let targetUserId: string;
  let createdNotificationId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    // Decode the logged-in userId from JWT for self-targeting
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    targetUserId = payload.sub;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /notifications', () => {
    it('should create a notification and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: targetUserId,
          title: 'E2E Test Notification',
          message: 'This is a test notification created during e2e testing',
          type: 'GENERAL',
          channel: 'PUSH',
          metadata: { source: 'e2e-test', priority: 'low' },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.userId).toBe(targetUserId);
      expect(res.body.title).toBe('E2E Test Notification');
      expect(res.body.type).toBe('GENERAL');
      expect(res.body.channel).toBe('PUSH');

      createdNotificationId = res.body.id;
    });

    it('should create a notification with different types', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: targetUserId,
          title: 'Fee Due Reminder',
          message: 'Your fee is due this month',
          type: 'FEE_DUE',
          channel: 'EMAIL',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('FEE_DUE');
      expect(res.body.channel).toBe('EMAIL');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Incomplete notification' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when invalid type is provided', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: targetUserId,
          title: 'Invalid type',
          message: 'Test',
          type: 'INVALID_TYPE',
          channel: 'PUSH',
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/notifications')
        .send({
          userId: targetUserId,
          title: 'No auth notification',
          message: 'Test',
          type: 'GENERAL',
          channel: 'PUSH',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /notifications', () => {
    it('should return notifications for the current user', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      // Response may be paginated object or array
      const notifications = Array.isArray(res.body) ? res.body : res.body.data ?? res.body.notifications ?? res.body;
      expect(notifications).toBeDefined();
    });

    it('should filter notifications by type', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/notifications?type=GENERAL')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should filter notifications by channel', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/notifications?channel=PUSH')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should support pagination', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/notifications');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark a notification as read and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/notifications/${createdNotificationId}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdNotificationId);
      expect(res.body.status).toBe('READ');
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await request(getApp().getHttpServer())
        .patch('/api/v1/notifications/nonexistent-id-00000000/read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/notifications/${createdNotificationId}/read`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should return the unread notification count', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
      expect(typeof res.body.count).toBe('number');
      expect(res.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/notifications/unread-count');

      expect(res.status).toBe(401);
    });
  });
});
