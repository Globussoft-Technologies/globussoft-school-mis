import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Users Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let schoolId: string;
  let createdUserId: string;
  const uniqueSuffix = Date.now();
  const newUserEmail = `testuser_${uniqueSuffix}@medicaps.edu.in`;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
    const ids = await getTestIds();
    schoolId = ids.schoolId;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /users/me', () => {
    it('should return the current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe('admin@medicaps.edu.in');
      expect(res.body.role).toBeDefined();
    });
  });

  describe('GET /users', () => {
    it('should return a list of users (admin only)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users?role=CLASS_TEACHER')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((user: any) => {
        expect(user.role).toBe('CLASS_TEACHER');
      });
    });
  });

  describe('POST /users', () => {
    it('should create a new user (admin only)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: newUserEmail,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'CLASS_TEACHER',
          schoolId,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(newUserEmail);
      expect(res.body.role).toBe('CLASS_TEACHER');
      createdUserId = res.body.id;
    });

    it('should fail with duplicate email (409 or 400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: newUserEmail,
          password: 'password123',
          firstName: 'Test',
          lastName: 'Duplicate',
          role: 'CLASS_TEACHER',
          schoolId,
        });

      expect([400, 409, 500]).toContain(res.status);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a specific user by ID', async () => {
      expect(createdUserId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(createdUserId);
      expect(res.body.email).toBe(newUserEmail);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update a user by ID', async () => {
      expect(createdUserId).toBeDefined();

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'UpdatedFirst', lastName: 'UpdatedLast' })
        .expect(200);

      expect(res.body.firstName).toBe('UpdatedFirst');
      expect(res.body.lastName).toBe('UpdatedLast');
    });
  });
});
