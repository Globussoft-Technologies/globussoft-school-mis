import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, getPrisma, closeTestApp } from './test-utils';

describe('Students Module (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let schoolId: string;
  let sessionId: string;
  let classId: string;
  let sectionId: string;
  let createdStudentId: string;
  const uniqueSuffix = Date.now();

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
    const ids = await getTestIds();
    schoolId = ids.schoolId;
    sessionId = ids.sessionId;

    // Fetch a real class and section from the seeded database
    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ include: { sections: true } });
    if (cls) {
      classId = cls.id;
      if (cls.sections && cls.sections.length > 0) {
        sectionId = cls.sections[0].id;
      }
    }
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /students', () => {
    it('should return a list of students', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter students by classId', async () => {
      expect(classId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/students?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((student: any) => {
        expect(student.classId).toBe(classId);
      });
    });
  });

  describe('POST /students', () => {
    it('should create a new student with school context', async () => {
      expect(classId).toBeDefined();
      expect(sectionId).toBeDefined();

      const res = await request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${token}`)
        .send({
          admissionNo: `ADM-TEST-${uniqueSuffix}`,
          firstName: 'New',
          lastName: 'Student',
          email: `student_${uniqueSuffix}@medicaps.edu.in`,
          classId,
          sectionId,
          dateOfBirth: '2010-06-15',
          gender: 'MALE',
          academicSessionId: sessionId,
          schoolId,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.admissionNo).toBe(`ADM-TEST-${uniqueSuffix}`);
      expect(res.body.user).toBeDefined();
      createdStudentId = res.body.id;
    });
  });

  describe('GET /students/:id', () => {
    it('should return a specific student with guardians', async () => {
      expect(createdStudentId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.id).toBe(createdStudentId);
      expect(res.body.guardians).toBeDefined();
      expect(Array.isArray(res.body.guardians)).toBe(true);
      expect(res.body.user).toBeDefined();
    });
  });
});
