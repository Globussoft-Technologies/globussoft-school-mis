const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Discussions (e2e)', () => {
  let token: string;
  let classId: string;
  let subjectId: string;
  let studentId: string;
  let createdForumId: string;
  let createdPostId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });
    const subject = await prisma.subject.findFirst({ where: { classId: cls!.id } });
    const student = await prisma.student.findFirst();

    classId = cls!.id;
    subjectId = subject!.id;
    studentId = student!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /discussions', () => {
    it('should create a discussion forum and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/discussions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Forum: Chapter 1 Discussion',
          description: 'Discuss chapter 1 topics here',
          classId,
          subjectId,
          type: 'GENERAL',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Forum: Chapter 1 Discussion');
      expect(res.body.classId).toBe(classId);

      createdForumId = res.body.id;
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/discussions')
        .send({ title: 'No auth', classId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /discussions', () => {
    it('should list forums by classId and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discussions?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter forums by subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discussions?classId=${classId}&subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discussions?classId=${classId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /discussions/:id', () => {
    it('should return a specific forum by id', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discussions/${createdForumId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdForumId);
      expect(res.body.title).toBe('E2E Test Forum: Chapter 1 Discussion');
    });

    it('should return 404 for non-existent forum', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discussions/nonexistent-forum-id-9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /discussions/:id/posts', () => {
    it('should create a post in a forum and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/discussions/${createdForumId}/posts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'This is my first post in the e2e test forum!',
          authorId: studentId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('This is my first post in the e2e test forum!');
      expect(res.body.forumId).toBe(createdForumId);

      createdPostId = res.body.id;
    });

    it('should create a reply to an existing post', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/discussions/${createdForumId}/posts`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'This is a reply to the first post.',
          authorId: studentId,
          parentId: createdPostId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      // API stores parentId (not parentPostId)
      expect(res.body.parentId).toBe(createdPostId);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/discussions/${createdForumId}/posts`)
        .send({ content: 'No auth post', authorId: studentId });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /discussions/posts/:id/like', () => {
    it('should like a post and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/discussions/posts/${createdPostId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdPostId);
      expect(typeof res.body.likes).toBe('number');
      expect(res.body.likes).toBeGreaterThan(0);
    });

    it('should increment likes on repeated likes', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/discussions/posts/${createdPostId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.likes).toBeGreaterThan(1);
    });
  });

  describe('GET /discussions/:id/participation', () => {
    it('should return forum participation stats', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discussions/${createdForumId}/participation`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPosts');
      // API returns 'participants' array (not 'uniqueParticipants' count)
      expect(res.body).toHaveProperty('participants');
      expect(Array.isArray(res.body.participants)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discussions/${createdForumId}/participation`);

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /discussions/:id/lock', () => {
    it('should lock the forum', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/discussions/${createdForumId}/lock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isLocked: true });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdForumId);
      expect(res.body.isLocked).toBe(true);
    });
  });
});
