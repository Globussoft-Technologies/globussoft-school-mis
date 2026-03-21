import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getPrisma, closeTestApp } from './test-utils';

describe('Diary Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let classId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst();
    if (cls) classId = cls.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /diary', () => {
    it('should create a diary entry (201)', async () => {
      expect(classId).toBeDefined();

      const today = new Date().toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/diary')
        .set('Authorization', `Bearer ${token}`)
        .send({
          classId,
          date: today,
          type: 'HOMEWORK',
          subject: 'Mathematics',
          content: 'Complete exercises 3.1 to 3.5 from Chapter 3.',
          isPublished: true,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.classId).toBe(classId);
      expect(res.body.type).toBe('HOMEWORK');
    });
  });

  describe('GET /diary', () => {
    it('should list diary entries for today (200)', async () => {
      expect(classId).toBeDefined();

      const today = new Date().toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .get(`/api/v1/diary?classId=${classId}&date=${today}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
