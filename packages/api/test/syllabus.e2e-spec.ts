import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getPrisma, closeTestApp } from './test-utils';

describe('Syllabus Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let syllabusId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();

    // Resolve the ID of the first seeded syllabus entry
    const prisma = getPrisma();
    const syllabus = await prisma.syllabus.findFirst();
    if (syllabus) {
      syllabusId = syllabus.id;
    }
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /syllabus', () => {
    it('should return all syllabi', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/syllabus')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return syllabi with subject and chapters when data exists', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/syllabus')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      if (res.body.length > 0) {
        const first = res.body[0];
        expect(first.id).toBeDefined();
        expect(first.subject).toBeDefined();
        expect(first.class).toBeDefined();
        expect(Array.isArray(first.chapters)).toBe(true);
      }
    });
  });

  describe('GET /syllabus/:id', () => {
    it('should return a specific syllabus with chapters and topics', async () => {
      if (!syllabusId) {
        console.warn('No seeded syllabus found – skipping GET /syllabus/:id test');
        return;
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/syllabus/${syllabusId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(syllabusId);
      expect(res.body.subject).toBeDefined();
      expect(res.body.class).toBeDefined();
      expect(Array.isArray(res.body.chapters)).toBe(true);
      res.body.chapters.forEach((chapter: any) => {
        expect(chapter.id).toBeDefined();
        expect(Array.isArray(chapter.topics)).toBe(true);
      });
    });

    it('should return 404 for a non-existent syllabus ID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/syllabus/nonexistent-id-000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
