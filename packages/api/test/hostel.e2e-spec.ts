import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp } from './test-utils';

describe('Hostel Module (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /hostel/rooms', () => {
    it('should add a hostel room (201)', async () => {
      const uniqueRoom = `R-E2E-${Date.now()}`;

      const res = await request(app.getHttpServer())
        .post('/api/v1/hostel/rooms')
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomNumber: uniqueRoom,
          floor: 2,
          block: 'A',
          capacity: 4,
          type: 'DORMITORY',
          amenities: ['WiFi', 'AC'],
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.roomNumber).toBe(uniqueRoom);
      expect(res.body.block).toBe('A');
      expect(res.body.floor).toBe(2);
    });
  });

  describe('GET /hostel/rooms', () => {
    it('should list all hostel rooms (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/hostel/rooms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
