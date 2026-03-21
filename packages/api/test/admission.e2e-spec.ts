import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Admission Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let sessionId: string;
  let createdEnquiryId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
    const ids = await getTestIds();
    sessionId = ids.sessionId;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /admission/enquiries', () => {
    it('should return a list of enquiries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admission/enquiries')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /admission/enquiries', () => {
    it('should create a new enquiry', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admission/enquiries')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentName: 'Rahul Sharma',
          parentName: 'Ramesh Sharma',
          parentPhone: '9876543210',
          parentEmail: 'ramesh.sharma@example.com',
          classAppliedFor: 'Grade 5',
          source: 'WALK_IN',
          notes: 'Interested in admission for next session',
          academicSessionId: sessionId,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.studentName).toBe('Rahul Sharma');
      expect(res.body.parentName).toBe('Ramesh Sharma');
      expect(res.body.status).toBeDefined();
      createdEnquiryId = res.body.id;
    });
  });

  describe('GET /admission/enquiries/:id', () => {
    it('should return a specific enquiry by ID', async () => {
      expect(createdEnquiryId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admission/enquiries/${createdEnquiryId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(createdEnquiryId);
      expect(res.body.studentName).toBe('Rahul Sharma');
      expect(res.body.parentName).toBe('Ramesh Sharma');
    });
  });

  describe('PATCH /admission/enquiries/:id/status', () => {
    it('should update the status of an enquiry', async () => {
      expect(createdEnquiryId).toBeDefined();

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admission/enquiries/${createdEnquiryId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'FOLLOW_UP' })
        .expect(200);

      expect(res.body.id).toBe(createdEnquiryId);
      expect(res.body.status).toBe('FOLLOW_UP');
    });
  });
});
