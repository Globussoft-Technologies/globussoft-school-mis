const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Compliance (e2e)', () => {
  let token: string;
  let classId: string;
  let sessionId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const class10 = await prisma.class.findFirst({ where: { grade: 10 } });
    classId = class10!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /compliance/deliveries', () => {
    it('should return deliveries list with status 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/compliance/deliveries')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter deliveries by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/compliance/deliveries?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/compliance/deliveries');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /compliance/report', () => {
    it('should return compliance report for classId and academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/compliance/report?classId=${classId}&academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/compliance/report?classId=${classId}&academicSessionId=${sessionId}`);

      expect(res.status).toBe(401);
    });
  });
});
