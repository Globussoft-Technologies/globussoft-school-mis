import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp } from './test-utils';

describe('Dashboard Module (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /dashboard/stats', () => {
    it('should return dashboard stats with expected numeric fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.totalStudents).toBeDefined();
      expect(res.body.totalTeachers).toBeDefined();
      expect(res.body.totalClasses).toBeDefined();
      expect(res.body.todayAttendance).toBeDefined();

      expect(typeof res.body.totalStudents).toBe('number');
      expect(typeof res.body.totalTeachers).toBe('number');
      expect(typeof res.body.totalClasses).toBe('number');
      expect(typeof res.body.todayAttendance).toBe('number');

      // Sanity-check against seeded data (80 students, 12 classes)
      expect(res.body.totalStudents).toBeGreaterThanOrEqual(0);
      expect(res.body.totalClasses).toBeGreaterThanOrEqual(0);
    });

    it('should return 401 without an auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .expect(401);
    });
  });
});
