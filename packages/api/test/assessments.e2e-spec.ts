const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Assessments (e2e)', () => {
  let token: string;
  let subjectId: string;
  let classId: string;
  let sessionId: string;
  let createdAssessmentId: string;
  let createdBankId: string;
  let createdQuestionId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const class10 = await prisma.class.findFirst({ where: { grade: 10 } });
    const subject = await prisma.subject.findFirst({ where: { classId: class10!.id } });

    classId = class10!.id;
    subjectId = subject!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /assessments', () => {
    it('should create an assessment and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E Unit Test Assessment',
          type: 'UNIT_TEST',
          tier: 1,
          subjectId,
          classId,
          academicSessionId: sessionId,
          totalMarks: 100,
          passingMarks: 40,
          duration: 60,
          instructions: 'Answer all questions',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Unit Test Assessment');
      expect(res.body.type).toBe('UNIT_TEST');
      expect(res.body.totalMarks).toBe(100);

      createdAssessmentId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/assessments')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Missing fields' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/assessments')
        .send({ title: 'No auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /assessments', () => {
    it('should list all assessments and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/assessments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/assessments?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/assessments?subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /assessments/:id', () => {
    it('should return a specific assessment', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/assessments/${createdAssessmentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdAssessmentId);
      expect(res.body.title).toBe('E2E Unit Test Assessment');
    });

    it('should return 404 for non-existent assessment', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/assessments/nonexistent-id-00000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /assessments/:id/publish', () => {
    it('should publish the assessment and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/assessments/${createdAssessmentId}/publish`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdAssessmentId);
      expect(res.body.isPublished).toBe(true);
    });
  });

  describe('POST /question-bank/banks', () => {
    it('should create a question bank and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/question-bank/banks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subjectId,
          name: 'E2E Test Question Bank',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Question Bank');
      expect(res.body.subjectId).toBe(subjectId);

      createdBankId = res.body.id;
    });

    it('should return 400 or 500 when fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/question-bank/banks')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect([400, 500]).toContain(res.status);
    });
  });

  describe('GET /question-bank/banks', () => {
    it('should list all question banks and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/question-bank/banks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by subjectId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/question-bank/banks?subjectId=${subjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /question-bank/questions', () => {
    it('should add a question to a bank and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/question-bank/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bankId: createdBankId,
          type: 'MCQ',
          text: 'What is 2 + 2?',
          options: { A: '3', B: '4', C: '5', D: '6' },
          correctAnswer: 'B',
          explanation: 'Basic arithmetic: 2 + 2 = 4',
          marks: 2,
          difficultyLevel: 'EASY',
          tags: ['math', 'arithmetic'],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('MCQ');
      expect(res.body.text).toBe('What is 2 + 2?');
      expect(res.body.bankId).toBe(createdBankId);

      createdQuestionId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/question-bank/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({ bankId: createdBankId });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /question-bank/banks/:bankId/questions', () => {
    it('should return questions for a bank', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/question-bank/banks/${createdBankId}/questions`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter questions by type', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/question-bank/banks/${createdBankId}/questions?type=MCQ`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter questions by difficulty level', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/question-bank/banks/${createdBankId}/questions?difficultyLevel=EASY`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
