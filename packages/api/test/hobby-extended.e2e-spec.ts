const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Hobby Extended (e2e)', () => {
  let token: string;
  let schoolId: string;
  let coordinatorUserId: string;
  let createdHobbyId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;

    const prisma = getPrisma();
    const coordinator = await prisma.user.findFirst({ where: { role: 'ACADEMIC_COORDINATOR' } });
    const fallbackUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    coordinatorUserId = coordinator?.id ?? fallbackUser!.id;
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
          name: `Extended E2E Dance Club ${Date.now()}`,
          category: 'PERFORMING_ARTS',
          description: 'An extended e2e dance club',
          maxCapacity: 25,
          coordinatorId: coordinatorUserId,
          isActive: true,
          schoolId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.category).toBe('PERFORMING_ARTS');
      expect(res.body.maxCapacity).toBe(25);

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
          name: 'No Auth',
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
        .get('/api/v1/hobby?category=PERFORMING_ARTS')
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
});
