import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getPrisma, closeTestApp } from './test-utils';

describe('ID Cards Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let testUserId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const user = await prisma.user.findFirst({ where: { role: 'CLASS_TEACHER' } });
    if (user) testUserId = user.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /id-cards', () => {
    it('should generate an ID card (201)', async () => {
      expect(testUserId).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/api/v1/id-cards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: testUserId,
          type: 'TEACHER',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.userId).toBe(testUserId);
      expect(res.body.type).toBe('TEACHER');
      expect(res.body.cardNumber).toBeDefined();
    });
  });

  describe('GET /id-cards', () => {
    it('should list all ID cards (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/id-cards')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
