const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Calendar (e2e)', () => {
  let token: string;
  let schoolId: string;
  let createdEventId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /calendar', () => {
    it('should create a calendar event and return 201', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);

      const res = await request(getApp().getHttpServer())
        .post('/api/v1/calendar')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `E2E Annual Sports Day ${Date.now()}`,
          description: 'Annual sports day event created in e2e testing',
          type: 'EVENT',
          startDate: startDate.toISOString().split('T')[0],
          isRecurring: false,
          schoolId,
          isPublic: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('EVENT');
      expect(res.body.schoolId).toBe(schoolId);

      createdEventId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/calendar')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Incomplete Event' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);

      const res = await request(getApp().getHttpServer())
        .post('/api/v1/calendar')
        .send({
          title: 'No Auth Event',
          type: 'HOLIDAY',
          startDate: startDate.toISOString().split('T')[0],
          schoolId,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /calendar/upcoming', () => {
    it('should list upcoming events and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/calendar/upcoming')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter upcoming events by schoolId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/calendar/upcoming?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // The event we just created should appear
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/calendar/upcoming');

      expect(res.status).toBe(401);
    });
  });
});
