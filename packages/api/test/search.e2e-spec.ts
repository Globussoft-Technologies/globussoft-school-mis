const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp } from './test-utils';

describe('Search (e2e)', () => {
  let token: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /search', () => {
    it('should return search results for "admin" and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/search?q=admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      // Results should contain at least one of the known categories
      expect(res.body).toHaveProperty('students');
      expect(res.body).toHaveProperty('users');
    });

    it('should return admin users in results', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/search?q=admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // admin@medicaps.edu.in should be found
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('should return empty results for nonexistent query and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/search?q=nonexistent_query_xyz_12345')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      // All result arrays should be empty or have length 0
      const total =
        (res.body.students?.length ?? 0) +
        (res.body.users?.length ?? 0) +
        (res.body.subjects?.length ?? 0) +
        (res.body.enquiries?.length ?? 0);
      expect(total).toBe(0);
    });

    it('should support limit parameter', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/search?q=a&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/search?q=admin');

      expect(res.status).toBe(401);
    });
  });
});
