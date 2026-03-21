const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Hobby (e2e)', () => {
  let token: string;
  let schoolId: string;
  let sessionId: string;
  let studentId: string;
  let coordinatorUserId: string;
  let createdHobbyId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid, sessionId: sesId } = await getTestIds();
    schoolId = sid;
    sessionId = sesId;

    const prisma = getPrisma();
    const student = await prisma.student.findFirst();
    const user = await prisma.user.findFirst({ where: { role: 'ACADEMIC_COORDINATOR' } });

    studentId = student!.id;
    coordinatorUserId = user?.id ?? student!.userId;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /hobby', () => {
    it('should create a hobby and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/hobby')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'E2E Test Painting Club',
          category: 'VISUAL_ARTS',
          description: 'A painting hobby club for e2e testing',
          maxCapacity: 20,
          coordinatorId: coordinatorUserId,
          isActive: true,
          schoolId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Painting Club');
      expect(res.body.category).toBe('VISUAL_ARTS');
      expect(res.body.maxCapacity).toBe(20);
      expect(res.body.schoolId).toBe(schoolId);

      createdHobbyId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/hobby')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Incomplete Hobby' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/hobby')
        .send({
          name: 'No Auth Hobby',
          category: 'SPORTS',
          maxCapacity: 10,
          coordinatorId: coordinatorUserId,
          schoolId,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /hobby', () => {
    it('should list all hobbies and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/hobby')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by schoolId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/hobby?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by category', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/hobby?category=VISUAL_ARTS')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by active status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/hobby?isActive=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/hobby');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /hobby/:id/enroll', () => {
    it('should enroll a student in a hobby and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/hobby/${createdHobbyId}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          academicSessionId: sessionId,
          level: 'BEGINNER',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.hobbyId).toBe(createdHobbyId);
      expect(res.body.level).toBe('BEGINNER');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/hobby/${createdHobbyId}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/hobby/${createdHobbyId}/enroll`)
        .send({ studentId, academicSessionId: sessionId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /hobby/portfolio/:studentId', () => {
    it('should return student hobby portfolio', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/hobby/portfolio/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/hobby/portfolio/${studentId}`);

      expect(res.status).toBe(401);
    });
  });
});
