import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Events Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let schoolId: string;
  let createdEventId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
    const ids = await getTestIds();
    schoolId = ids.schoolId;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /events', () => {
    it('should create a school event (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Annual Science Exhibition',
          description: 'Students showcase their science projects',
          type: 'WORKSHOP',
          startDate: '2026-05-15T10:00:00.000Z',
          endDate: '2026-05-15T16:00:00.000Z',
          venue: 'School Auditorium',
          organizer: 'Science Department',
          budget: 20000,
          maxParticipants: 200,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Annual Science Exhibition');
      expect(res.body.type).toBe('WORKSHOP');
      createdEventId = res.body.id;
    });
  });

  describe('GET /events', () => {
    it('should list all events (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/events')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /events/upcoming', () => {
    it('should list upcoming events (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/events/upcoming')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /events/:id/register', () => {
    it('should register for an event (201)', async () => {
      expect(createdEventId).toBeDefined();

      const res = await request(app.getHttpServer())
        .post(`/api/v1/events/${createdEventId}/register`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'PARTICIPANT' })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.eventId).toBe(createdEventId);
    });
  });
});
