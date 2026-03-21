import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Meetings Module (e2e)', () => {
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

  describe('POST /meetings', () => {
    it('should create a meeting (201)', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Staff Coordination Meeting — March 2026',
          meetingDate: today,
          startTime: '10:00',
          endTime: '11:30',
          location: 'Conference Room A',
          type: 'STAFF',
          attendees: [{ name: 'Principal Sharma', role: 'Principal' }],
          agenda: [{ item: 'Exam schedule review', duration: 30 }],
          actionItems: [{ task: 'Finalize exam timetable', assignedTo: 'Coordinator', dueDate: today }],
          recordedBy: 'admin-user',
          schoolId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Staff Coordination Meeting — March 2026');
      expect(res.body.type).toBe('STAFF');
    });
  });

  describe('GET /meetings', () => {
    it('should list all meetings (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/meetings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /meetings/upcoming', () => {
    it('should return upcoming meetings (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/meetings/upcoming')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
