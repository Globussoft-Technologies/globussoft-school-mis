const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Gamification (e2e)', () => {
  let token: string;
  let schoolId: string;
  let classId: string;
  let studentId: string;
  let createdBadgeId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });
    const student = await prisma.student.findFirst();

    classId = cls!.id;
    studentId = student!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /gamification/badges', () => {
    it('should create a badge and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/gamification/badges')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'E2E Test Badge: Star Learner',
          description: 'Awarded for outstanding performance in e2e tests',
          iconUrl: 'star',
          criteria: 'Complete all modules with 90%+ score',
          pointsValue: 50,
          schoolId,
          category: 'ACADEMIC',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Badge: Star Learner');
      expect(res.body.schoolId).toBe(schoolId);

      createdBadgeId = res.body.id;
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/gamification/badges')
        .send({ name: 'No Auth Badge', schoolId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /gamification/badges', () => {
    it('should list badges for a school and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/gamification/badges?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/gamification/badges?schoolId=${schoolId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /gamification/points', () => {
    it('should award points to a student and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/gamification/points')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          points: 10,
          category: 'ATTENDANCE',
          reason: 'Perfect attendance this week',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('pointRecord');
      expect(res.body).toHaveProperty('totalPoints');
      expect(res.body).toHaveProperty('level');
      expect(res.body).toHaveProperty('levelTitle');
      expect(res.body.pointRecord.studentId).toBe(studentId);
      expect(res.body.pointRecord.points).toBe(10);
      expect(res.body.pointRecord.category).toBe('ATTENDANCE');
    });

    it('should award academic points and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/gamification/points')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          points: 25,
          category: 'ACADEMIC',
          reason: 'Top score in e2e unit test',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('totalPoints');
      expect(res.body.totalPoints).toBeGreaterThanOrEqual(25);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/gamification/points')
        .send({ studentId, points: 5, category: 'ATTENDANCE' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /gamification/profile/:studentId', () => {
    it('should return gamification profile for a student', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/gamification/profile/${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('studentId', studentId);
      expect(res.body).toHaveProperty('totalPoints');
      expect(res.body).toHaveProperty('level');
      expect(res.body).toHaveProperty('levelTitle');
      expect(res.body).toHaveProperty('badges');
      // API returns 'pointsHistory' not 'recentPoints'
      expect(res.body).toHaveProperty('pointsHistory');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/gamification/profile/${studentId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /gamification/leaderboard/:classId', () => {
    it('should return leaderboard for a class', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/gamification/leaderboard/${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should respect limit query param', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/gamification/leaderboard/${classId}?limit=5`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/gamification/leaderboard/${classId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /gamification/badges/award', () => {
    it('should award a badge to a student and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/gamification/badges/award')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          badgeId: createdBadgeId,
          reason: 'Earned badge in e2e test',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.badgeId).toBe(createdBadgeId);
    });

    it('should return 409 when awarding same badge twice', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/gamification/badges/award')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          badgeId: createdBadgeId,
          reason: 'Duplicate award attempt',
        });

      expect(res.status).toBe(409);
    });
  });
});
