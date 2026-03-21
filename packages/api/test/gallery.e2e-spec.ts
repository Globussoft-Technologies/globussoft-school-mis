import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Gallery Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let schoolId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
    const ids = await getTestIds();
    schoolId = ids.schoolId;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /gallery/albums', () => {
    it('should create a gallery album (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/gallery/albums')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Annual Day 2026 Test',
          description: 'Photos from the annual day celebration',
          category: 'CULTURAL',
          eventDate: '2026-03-20',
          schoolId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Annual Day 2026 Test');
      expect(res.body.category).toBe('CULTURAL');
    });
  });

  describe('GET /gallery/albums', () => {
    it('should list all gallery albums (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gallery/albums')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
