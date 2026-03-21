import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getPrisma, closeTestApp } from './test-utils';

describe('Timetable Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let classId: string;
  let sectionId: string;
  let timetableId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();

    // Attempt to find a seeded timetable to use for ID-based tests
    const timetable = await prisma.timetable.findFirst({
      include: { class: true, section: true },
    });

    if (timetable) {
      timetableId = timetable.id;
      classId = timetable.classId;
      sectionId = timetable.sectionId;
    } else {
      // Fall back to any class/section pair so the query endpoint can still run
      const cls = await prisma.class.findFirst({ include: { sections: true } });
      if (cls) {
        classId = cls.id;
        if (cls.sections && cls.sections.length > 0) {
          sectionId = cls.sections[0].id;
        }
      }
    }
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /timetable', () => {
    it('should return the timetable for a class and section', async () => {
      expect(classId).toBeDefined();
      expect(sectionId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/timetable?classId=${classId}&sectionId=${sectionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // The endpoint returns a single timetable object or null when none is found
      if (res.body) {
        expect(res.body.classId).toBe(classId);
        expect(res.body.sectionId).toBe(sectionId);
        expect(Array.isArray(res.body.slots)).toBe(true);
      }
    });
  });

  describe('GET /timetable/:id', () => {
    it('should return a specific timetable by ID', async () => {
      if (!timetableId) {
        console.warn('No seeded timetable found – skipping GET /timetable/:id test');
        return;
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/timetable/${timetableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(timetableId);
      expect(res.body.class).toBeDefined();
      expect(res.body.section).toBeDefined();
      expect(Array.isArray(res.body.slots)).toBe(true);
    });

    it('should return 404 for a non-existent timetable ID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/timetable/nonexistent-id-000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
