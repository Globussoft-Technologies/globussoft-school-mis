const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Communication (e2e)', () => {
  let token: string;
  let classId: string;
  let sessionId: string;
  let schoolId: string;
  let loggedInUserId: string;
  let createdSlotId: string;
  let createdConversationId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid, sessionId: sesId } = await getTestIds();
    schoolId = sid;
    sessionId = sesId;

    const prisma = getPrisma();
    const class10 = await prisma.class.findFirst({ where: { grade: 10 } });
    classId = class10!.id;

    // Decode userId from token payload (base64 middle segment)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    loggedInUserId = payload.sub;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /communication/ptm/slots', () => {
    it('should create a PTM slot and return 201', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(getApp().getHttpServer())
        .post('/api/v1/communication/ptm/slots')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: futureDateStr,
          startTime: '09:00',
          endTime: '09:30',
          classId,
          maxBookings: 1,
          academicSessionId: sessionId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.classId).toBe(classId);
      expect(res.body.startTime).toBe('09:00');
      expect(res.body.endTime).toBe('09:30');
      expect(res.body.maxBookings).toBe(1);

      createdSlotId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/communication/ptm/slots')
        .set('Authorization', `Bearer ${token}`)
        .send({ classId });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const futureDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(getApp().getHttpServer())
        .post('/api/v1/communication/ptm/slots')
        .send({
          date: futureDateStr,
          startTime: '10:00',
          endTime: '10:30',
          classId,
          maxBookings: 1,
          academicSessionId: sessionId,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /communication/ptm/slots', () => {
    it('should return PTM slots and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/communication/ptm/slots')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/communication/ptm/slots?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by academicSessionId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/communication/ptm/slots?academicSessionId=${sessionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/communication/ptm/slots');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /communication/conversations', () => {
    it('should create a conversation and return 201', async () => {
      const prisma = getPrisma();
      const anotherUser = await prisma.user.findFirst({
        where: { id: { not: loggedInUserId } },
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/v1/communication/conversations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          participantIds: [loggedInUserId, anotherUser!.id],
          type: 'PARENT_TEACHER',
          schoolId,
          initialMessage: 'Hello, this is an e2e test conversation',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('PARENT_TEACHER');
      expect(res.body.schoolId).toBe(schoolId);

      createdConversationId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/communication/conversations')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'PARENT_TEACHER' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/communication/conversations')
        .send({
          participantIds: [loggedInUserId],
          type: 'ANNOUNCEMENT',
          schoolId,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /communication/conversations', () => {
    it('should return conversations for the logged-in user', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/communication/conversations')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by schoolId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/communication/conversations?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/communication/conversations');

      expect(res.status).toBe(401);
    });
  });
});
