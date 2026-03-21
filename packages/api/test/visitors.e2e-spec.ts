import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Visitors Module (e2e)', () => {
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

  describe('POST /visitors/check-in', () => {
    it('should check in a visitor (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/visitors/check-in')
        .set('Authorization', `Bearer ${token}`)
        .send({
          visitorName: 'Ramesh Kumar',
          phone: '9876543210',
          purpose: 'PARENT_VISIT',
          visitingWhom: 'Class Teacher',
          schoolId,
          loggedBy: 'reception',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.visitorName).toBe('Ramesh Kumar');
      expect(res.body.purpose).toBe('PARENT_VISIT');
    });
  });

  describe('GET /visitors/today', () => {
    it("should list today's visitors (200)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/visitors/today?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
