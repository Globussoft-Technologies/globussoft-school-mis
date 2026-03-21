const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Fees (e2e)', () => {
  let token: string;
  let classId: string;
  let sessionId: string;
  let studentId: string;
  let createdFeeHeadId: string;
  let receiptCounter = Date.now();

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const class10 = await prisma.class.findFirst({ where: { grade: 10 } });
    const student = await prisma.student.findFirst();

    classId = class10!.id;
    studentId = student!.id;
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
          name: 'E2E Tuition Fee',
          description: 'Monthly tuition fee for testing',
          amount: 5000,
          classId,
          academicSessionId: sessionId,
          isRecurring: true,
          frequency: 'MONTHLY',
          dueDay: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Tuition Fee');
      expect(res.body.amount).toBe(5000);
      expect(res.body.classId).toBe(classId);

      createdFeeHeadId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/fees/heads')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Incomplete Fee' });

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

    it('should filter fee heads by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/fees/heads?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter fee heads by academicSessionId', async () => {
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

  describe('POST /fees/payments', () => {
    it('should record a payment and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/fees/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          feeHeadId: createdFeeHeadId,
          amount: 5000,
          paidAmount: 5000,
          method: 'CASH',
          receiptNo: `RCPT-E2E-${receiptCounter++}`,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.feeHeadId).toBe(createdFeeHeadId);
      expect(res.body.paidAmount).toBe(5000);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/fees/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/fees/payments')
        .send({
          studentId,
          feeHeadId: createdFeeHeadId,
          amount: 5000,
          paidAmount: 5000,
          receiptNo: `RCPT-E2E-${receiptCounter++}`,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /fees/payments/:studentId', () => {
    it('should return payments for a student', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/fees/payments/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/fees/payments/${studentId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /fees/defaulters', () => {
    it('should return defaulters list and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/fees/defaulters')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter defaulters by status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/fees/defaulters?status=PENDING')
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
