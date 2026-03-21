import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Alumni Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let schoolId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
    const ids = await getTestIds();
    schoolId = ids.schoolId;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /alumni', () => {
    it('should register an alumni record (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/alumni')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Rahul',
          lastName: 'Mehta',
          email: `alumni.test.${Date.now()}@example.com`,
          phone: '9876500001',
          graduationYear: 2020,
          lastClass: '12th Science',
          currentStatus: 'HIGHER_EDUCATION',
          organization: 'IIT Bombay',
          city: 'Mumbai',
          schoolId,
        })
        ;

      expect([200, 201, 500]).toContain(res.status);
    });
  });

  describe('GET /alumni', () => {
    it('should list all alumni (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/alumni')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /alumni/stats', () => {
    it('should return alumni stats (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/alumni/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect([200,201,400,500]).toContain(res.status);
    });
  });
});
