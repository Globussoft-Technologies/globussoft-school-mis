import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp } from './test-utils';

describe('Grievances Module (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /grievances', () => {
    it('should submit a grievance (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/grievances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          category: 'ACADEMIC',
          subject: 'Exam result discrepancy in Mathematics',
          description: 'My marks in the Mathematics paper appear incorrect. I believe I deserve higher marks based on my answer sheet.',
          priority: 'HIGH',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.category).toBe('ACADEMIC');
      expect(res.body.subject).toBe('Exam result discrepancy in Mathematics');
    });
  });

  describe('GET /grievances', () => {
    it('should list all grievances (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grievances')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /grievances/stats', () => {
    it('should return grievance statistics (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/grievances/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });
});
