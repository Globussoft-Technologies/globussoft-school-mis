const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp } from './test-utils';

describe('Settings (e2e)', () => {
  let token: string;
  let schoolId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /settings', () => {
    it('should list all settings and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/settings?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Settings returns an object grouped by category or an array
      expect(res.body).toBeDefined();
    });

    it('should return 200 even without schoolId filter', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/settings');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /settings/seed-defaults', () => {
    it('should seed default settings and return 200 or 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/settings/seed-defaults?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/settings/seed-defaults?schoolId=${schoolId}`);

      expect(res.status).toBe(401);
    });
  });
});
