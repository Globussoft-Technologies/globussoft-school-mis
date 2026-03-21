const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Rubrics (e2e)', () => {
  let token: string;
  let schoolId: string;
  let subjectId: string;
  let studentId: string;
  let createdRubricId: string;
  let createdCriterionId: string;
  let createdLevelId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;

    const prisma = getPrisma();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });
    const subject = await prisma.subject.findFirst({ where: { classId: cls!.id } });
    const student = await prisma.student.findFirst();

    subjectId = subject!.id;
    studentId = student!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /rubrics', () => {
    it('should create a rubric with criteria and levels and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/rubrics')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Test Rubric: Essay Assessment',
          description: 'Rubric for evaluating student essays',
          subjectId,
          schoolId,
          type: 'ESSAY',
          maxScore: 100,
          criteria: [
            {
              title: 'Content Quality',
              description: 'Relevance and depth of content',
              maxPoints: 40,
              orderIndex: 1,
              levels: [
                { title: 'Excellent', description: 'Exceeds expectations', points: 40, orderIndex: 1 },
                { title: 'Good', description: 'Meets expectations', points: 30, orderIndex: 2 },
                { title: 'Fair', description: 'Partially meets expectations', points: 20, orderIndex: 3 },
                { title: 'Poor', description: 'Does not meet expectations', points: 10, orderIndex: 4 },
              ],
            },
            {
              title: 'Grammar & Style',
              description: 'Language use and writing style',
              maxPoints: 30,
              orderIndex: 2,
              levels: [
                { title: 'Excellent', description: 'No errors', points: 30, orderIndex: 1 },
                { title: 'Good', description: 'Minor errors', points: 22, orderIndex: 2 },
                { title: 'Fair', description: 'Several errors', points: 15, orderIndex: 3 },
                { title: 'Poor', description: 'Many errors', points: 5, orderIndex: 4 },
              ],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Rubric: Essay Assessment');
      expect(res.body.schoolId).toBe(schoolId);
      expect(Array.isArray(res.body.criteria)).toBe(true);
      expect(res.body.criteria.length).toBe(2);
      expect(Array.isArray(res.body.criteria[0].levels)).toBe(true);

      createdRubricId = res.body.id;
      createdCriterionId = res.body.criteria[0].id;
      createdLevelId = res.body.criteria[0].levels[0].id;
    });

    it('should create a rubric without criteria and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/rubrics')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Simple Rubric',
          schoolId,
          maxScore: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Simple Rubric');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/rubrics')
        .send({ title: 'No auth rubric', schoolId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /rubrics', () => {
    it('should list all rubrics for a school and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/rubrics?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/rubrics?subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/rubrics');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /rubrics/:id', () => {
    it('should return a specific rubric with criteria', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/rubrics/${createdRubricId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdRubricId);
      expect(res.body.title).toBe('E2E Test Rubric: Essay Assessment');
      expect(Array.isArray(res.body.criteria)).toBe(true);
    });

    it('should return 404 for non-existent rubric', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/rubrics/nonexistent-rubric-id-9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /rubrics/:id/assess', () => {
    it('should assess a student with a rubric and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/rubrics/${createdRubricId}/assess`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          feedback: 'Good effort overall, needs improvement in grammar.',
          scores: [
            { criterionId: createdCriterionId, levelId: createdLevelId, points: 30, comment: 'Good content depth' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.rubricId).toBe(createdRubricId);
      expect(typeof res.body.totalScore).toBe('number');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post(`/api/v1/rubrics/${createdRubricId}/assess`)
        .send({ studentId, scores: [] });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /rubrics/:id/results', () => {
    it('should return rubric results summary', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/rubrics/${createdRubricId}/results`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rubric');
      expect(res.body).toHaveProperty('assessments');
      expect(res.body).toHaveProperty('summary');
      expect(res.body.summary).toHaveProperty('total');
      expect(res.body.summary).toHaveProperty('averageScore');
    });
  });
});
