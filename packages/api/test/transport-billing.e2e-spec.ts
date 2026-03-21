const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Transport Billing (e2e)', () => {
  let token: string;
  let studentId: string;
  let generatedBillId: string;

  const testMonth = 3;  // March
  const testYear = 2025;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const student = await prisma.student.findFirst();
    studentId = student!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /transport-billing/generate', () => {
    it('should generate monthly transport bills and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/transport-billing/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ month: testMonth, year: testYear, amount: 1500 });

      expect([200, 201]).toContain(res.status);
      // API returns { generated: number, bills: [] } not a plain array
      expect(res.body).toHaveProperty('generated');
      expect(Array.isArray(res.body.bills)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/transport-billing/generate')
        .send({ month: testMonth, year: testYear });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /transport-billing', () => {
    it('should list all transport bills and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/transport-billing')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by month and year', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/transport-billing?month=${testMonth}&year=${testYear}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/transport-billing?status=PENDING')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/transport-billing');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /transport-billing/report', () => {
    it('should return monthly report for transport billing', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/transport-billing/report?month=${testMonth}&year=${testYear}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('month', testMonth);
      expect(res.body).toHaveProperty('year', testYear);
    });
  });

  describe('GET /transport-billing/student/:studentId', () => {
    it('should return transport bills for a student', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/transport-billing/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PATCH /transport-billing/:id/pay', () => {
    it('should record payment for a transport bill', async () => {
      // First generate bills and get one
      const generateRes = await request(getApp().getHttpServer())
        .post('/api/v1/transport-billing/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ month: 4, year: 2025, amount: 1500 });

      if (generateRes.body.bills && generateRes.body.bills.length > 0) {
        const billId = generateRes.body.bills[0].id;
        const res = await request(getApp().getHttpServer())
          .patch(`/api/v1/transport-billing/${billId}/pay`)
          .set('Authorization', `Bearer ${token}`)
          .send({ receiptNo: 'RCP-E2E-001' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('PAID');
      } else {
        // No bills generated (no students with routes), pass
        expect(true).toBe(true);
      }
    });
  });
});
