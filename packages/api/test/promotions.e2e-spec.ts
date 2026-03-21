const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Promotions (e2e)', () => {
  let token: string;
  let classId: string;
  let sessionId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });
    classId = cls!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /promotions', () => {
    it('should list all promotions and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/promotions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/promotions?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/promotions?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/promotions?status=PENDING')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/promotions');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /promotions/generate', () => {
    it('should generate promotions for a class and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/promotions/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ classId, academicSessionId: sessionId });

      // Returns { message, created, skipped } or 400 if no students found
      expect([200, 201, 400]).toContain(res.status);
      if (res.status !== 400) {
        expect(res.body).toHaveProperty('message');
        expect(typeof res.body.created).toBe('number');
        expect(typeof res.body.skipped).toBe('number');
      }
    });
  });

  describe('POST /promotions/bulk-process', () => {
    it('should bulk process promotions for a class', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/promotions/bulk-process')
        .set('Authorization', `Bearer ${token}`)
        .send({ classId, academicSessionId: sessionId });

      expect([200, 201]).toContain(res.status);
    });
  });
});
