import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, closeTestApp } from './test-utils';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;
  let refreshToken: string;
  let accessToken: string;

  beforeAll(async () => {
    app = await setupTestApp();

    // Obtain a valid refresh token for later tests
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@medicaps.edu.in', password: 'admin123' });

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@medicaps.edu.in', password: 'admin123' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@medicaps.edu.in');
    });

    it('should fail with wrong password (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@medicaps.edu.in', password: 'wrongpassword' })
        .expect(401);
    });

    it('should fail with invalid email format (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'admin123' })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new tokens with a valid refresh token', async () => {
      // Get a fresh refresh token first so we don't consume the shared one
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@medicaps.edu.in', password: 'admin123' });

      const tokenToRefresh = loginRes.body.refreshToken;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: tokenToRefresh })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should fail with an invalid refresh token (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token-that-does-not-exist' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with a valid Bearer token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
    });

    it('should fail without an auth token (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });
});
