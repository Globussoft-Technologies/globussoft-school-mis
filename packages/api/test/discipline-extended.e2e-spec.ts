const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Discipline Extended (e2e)', () => {
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
          time: '11:00',
          type: 'MISCONDUCT',
          severity: 'MINOR',
          description: 'Extended e2e disciplinary incident test',
          location: 'Library',
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
          description: 'No auth test',
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
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter incidents by studentId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/discipline/incidents?studentId=${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter incidents by severity=MINOR', async () => {
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

  describe('GET /discipline/red-flags', () => {
    it('should list red flags and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/red-flags')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter red flags by status=ACTIVE', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/red-flags?status=ACTIVE')
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

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/discipline/red-flags');

      expect(res.status).toBe(401);
    });
  });
});
