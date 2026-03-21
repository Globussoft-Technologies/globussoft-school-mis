const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Concessions (e2e)', () => {
  let token: string;
  let studentId: string;
  let feeHeadId: string;
  let createdConcessionId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const student = await prisma.student.findFirst();
    const feeHead = await prisma.feeHead.findFirst();

    studentId = student!.id;
    feeHeadId = feeHead!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /concessions', () => {
    it('should create a concession request and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/concessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          feeHeadId,
          type: 'MERIT',
          reason: 'Top scorer in class — e2e test concession',
          discountPercent: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.type).toBe('MERIT');
      expect(res.body).toHaveProperty('status');

      createdConcessionId = res.body.id;
    });

    it('should create a fixed amount concession', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/concessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          feeHeadId,
          type: 'SIBLING',
          reason: 'Sibling discount — e2e test',
          discountAmount: 500,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('SIBLING');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/concessions')
        .send({ studentId, feeHeadId, type: 'MERIT', reason: 'No auth', discountPercent: 10 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /concessions', () => {
    it('should list all concessions and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/concessions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by studentId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/concessions?studentId=${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by type', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/concessions?type=MERIT')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/concessions?status=PENDING')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/concessions');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /concessions/:id/approve', () => {
    it('should approve a concession and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/concessions/${createdConcessionId}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdConcessionId);
      expect(res.body.status).toBe('APPROVED');
    });
  });

  describe('GET /concessions/student/:studentId', () => {
    it('should return all concessions for a student', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/concessions/student/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /concessions/calculate', () => {
    it('should calculate effective fee after concessions', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/concessions/calculate?studentId=${studentId}&feeHeadId=${feeHeadId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('originalAmount');
      expect(res.body).toHaveProperty('effectiveAmount');
    });
  });
});
