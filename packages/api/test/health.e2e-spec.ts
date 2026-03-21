import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getPrisma, closeTestApp } from './test-utils';

describe('Health Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let studentId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const student = await prisma.student.findFirst({ where: { isActive: true } });
    if (student) studentId = student.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /health/records', () => {
    it('should create or upsert a health record (201 or 200)', async () => {
      expect(studentId).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/api/v1/health/records')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          bloodGroup: 'B+',
          height: 162,
          weight: 54,
          allergies: ['Dust', 'Pollen'],
          conditions: ['Mild asthma'],
          emergencyContact: 'Suresh Kumar',
          emergencyPhone: '9988776655',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body).toBeDefined();
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.bloodGroup).toBe('B+');
    });
  });

  describe('GET /health/allergies', () => {
    it('should list students with allergies (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health/allergies')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
