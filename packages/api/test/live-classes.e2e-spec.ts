const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Live Classes (e2e)', () => {
  let token: string;
  let schoolId: string;
  let classId: string;
  let subjectId: string;
  let teacherId: string;
  let studentId: string;
  let createdLiveClassId: string;
  let liveClassToStartId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });
    const subject = await prisma.subject.findFirst({ where: { classId: cls!.id } });
    const student = await prisma.student.findFirst();
    // Use admin user as teacher
    const user = await prisma.user.findFirst({ where: { role: 'SUBJECT_TEACHER' } });
    const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    classId = cls!.id;
    subjectId = subject!.id;
    studentId = student!.id;
    teacherId = (user ?? adminUser)!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /live-classes', () => {
    it('should schedule a live class and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/live-classes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Live Class: Algebra Review',
          description: 'Live session to review algebra concepts',
          classId,
          subjectId,
          teacherId,
          schoolId,
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          meetingUrl: 'https://meet.example.com/algebra-review',
          maxParticipants: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Live Class: Algebra Review');
      expect(res.body.classId).toBe(classId);
      expect(res.body.status).toBe('SCHEDULED');

      createdLiveClassId = res.body.id;
    });

    it('should schedule another live class for start/end testing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/live-classes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Live Class for Start/End Test',
          classId,
          subjectId,
          teacherId,
          schoolId,
          scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 45,
        });

      expect(res.status).toBe(201);
      liveClassToStartId = res.body.id;
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/live-classes')
        .send({ title: 'No auth class', classId, teacherId, schoolId, scheduledAt: new Date().toISOString(), duration: 30 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /live-classes', () => {
    it('should list all live classes and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/live-classes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by schoolId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/live-classes?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/live-classes?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/live-classes?status=SCHEDULED')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/live-classes');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /live-classes/upcoming', () => {
    it('should return upcoming live classes for a school', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/live-classes/upcoming?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/live-classes/upcoming?schoolId=${schoolId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /live-classes/:id', () => {
    it('should return a specific live class by id', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/live-classes/${createdLiveClassId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdLiveClassId);
      expect(res.body.title).toBe('E2E Test Live Class: Algebra Review');
    });

    it('should return 404 for non-existent live class', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/live-classes/nonexistent-live-class-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /live-classes/:id/start', () => {
    it('should start a scheduled live class and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/live-classes/${liveClassToStartId}/start`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', liveClassToStartId);
      expect(res.body.status).toBe('LIVE');
    });

    it('should return 400 when trying to start a non-scheduled class', async () => {
      // Class is already LIVE, cannot start again
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/live-classes/${liveClassToStartId}/start`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /live-classes/:id/end', () => {
    it('should end a live class and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/live-classes/${liveClassToStartId}/end`)
        .set('Authorization', `Bearer ${token}`)
        .send({ recordingUrl: 'https://recordings.example.com/algebra-review.mp4' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', liveClassToStartId);
      // Service sets status to 'COMPLETED' when ending a live class
      expect(res.body.status).toBe('COMPLETED');
    });
  });
});
