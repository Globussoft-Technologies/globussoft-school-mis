import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Payroll Module (e2e)', () => {
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

  describe('POST /payroll/structures', () => {
    it('should create a salary structure (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payroll/structures')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Test Salary Structure ${Date.now()}`,
          role: 'SUBJECT_TEACHER',
          basicSalary: 35000,
          allowances: { HRA: 8750, DA: 3500, TA: 2000 },
          deductions: { PF: 4200, TDS: 1500 },
          schoolId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.basicSalary).toBe(35000);
    });
  });

  describe('GET /payroll/structures', () => {
    it('should list all salary structures (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/payroll/structures')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
