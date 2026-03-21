const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Discipline (e2e)', () => {
  let token: string;
  let studentId: string;
  let classId: string;
  let createdIncidentId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const class10 = await prisma.class.findFirst({ where: { grade: 10 } });
    const student = await prisma.student.findFirst();

    classId = class10!.id;
    studentId = student!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /discipline/incidents', () => {
    it('should log a disciplinary incident and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/discipline/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          date: new Date().toISOString().split('T')[0],
          time: '10:30',
          type: 'MISCONDUCT',
          severity: 'MINOR',
          description: 'Student was disruptive during class in e2e testing',
          location: 'Classroom 101',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.type).toBe('MISCONDUCT');
      expect(res.body.severity).toBe('MINOR');

      createdIncidentId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/discipline/incidents')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/discipline/incidents')
        .send({
          studentId,
          date: new Date().toISOString().split('T')[0],
          type: 'MISCONDUCT',
          severity: 'MINOR',
          description: 'Test incident',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /discipline/incidents', () => {
    it('should list all incidents and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/incidents')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter incidents by studentId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discipline/incidents?studentId=${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter incidents by classId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discipline/incidents?classId=${classId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter incidents by severity', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/incidents?severity=MINOR')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/incidents');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /discipline/actions', () => {
    it('should create a disciplinary action and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/discipline/actions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          incidentId: createdIncidentId,
          actionType: 'WARNING',
          description: 'Verbal warning given to student during e2e test',
          parentNotified: false,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.incidentId).toBe(createdIncidentId);
      expect(res.body.actionType).toBe('WARNING');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/discipline/actions')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Missing incidentId and actionType' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/discipline/actions')
        .send({ incidentId: createdIncidentId, actionType: 'WARNING' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /discipline/red-flags', () => {
    it('should return red flags list and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/red-flags')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter red flags by studentId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discipline/red-flags?studentId=${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter red flags by status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/red-flags?status=ACTIVE')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/red-flags');

      expect(res.status).toBe(401);
    });
  });
});
