const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Fees Extended (e2e)', () => {
  let token: string;
  let classId: string;
  let sessionId: string;
  let createdFeeHeadId: string;

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

  describe('POST /fees/heads', () => {
    it('should create a fee head and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/fees/heads')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Extended E2E Tuition Fee ${Date.now()}`,
          description: 'Extended e2e test fee head',
          amount: 7500,
          classId,
          academicSessionId: sessionId,
          isRecurring: true,
          frequency: 'MONTHLY',
          dueDay: 15,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.amount).toBe(7500);
      expect(res.body.classId).toBe(classId);

      createdFeeHeadId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/fees/heads')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/fees/heads')
        .send({ name: 'No Auth Fee', amount: 1000, classId, academicSessionId: sessionId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /fees/heads', () => {
    it('should list all fee heads and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/fees/heads')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/fees/heads?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/fees/heads?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/fees/heads');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /fees/defaulters', () => {
    it('should list defaulters and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/fees/defaulters')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter defaulters by status=ACTIVE', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/fees/defaulters?status=ACTIVE')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter defaulters by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/fees/defaulters?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/fees/defaulters');

      expect(res.status).toBe(401);
    });
  });
});
