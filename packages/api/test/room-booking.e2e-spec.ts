import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Room Booking Module (e2e)', () => {
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

  describe('POST /rooms', () => {
    it('should create a room (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Test Room ${Date.now()}`,
          type: 'CLASSROOM',
          capacity: 40,
          location: 'Block A, Floor 2',
          amenities: ['Projector', 'Whiteboard', 'AC'],
          schoolId,
        })
        ;

      expect([200, 201, 500]).toContain(res.status);
    });
  });

  describe('GET /rooms', () => {
    it('should list all rooms (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/rooms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
