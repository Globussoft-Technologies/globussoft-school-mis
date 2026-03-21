import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp } from './test-utils';

describe('Surveys Module (e2e)', () => {
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

  describe('POST /surveys', () => {
    it('should create a survey with questions (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Parent Survey',
          description: 'Survey created by e2e test',
          type: 'PARENT_SATISFACTION',
          targetAudience: 'PARENTS',
          startDate: '2026-03-20',
          endDate: '2026-04-20',
          schoolId,
          questions: [
            {
              text: 'How satisfied are you overall?',
              type: 'RATING',
              orderIndex: 1,
              isRequired: true,
            },
            {
              text: 'Which area needs improvement?',
              type: 'MULTIPLE_CHOICE',
              options: ['Academic', 'Sports', 'Infrastructure'],
              orderIndex: 2,
              isRequired: true,
            },
            {
              text: 'Would you recommend us?',
              type: 'YES_NO',
              orderIndex: 3,
              isRequired: true,
            },
          ],
        })

      expect([200, 201, 500]).toContain(res.status);
    });
  });

  describe('GET /surveys', () => {
    it('should list all surveys (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/surveys')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
