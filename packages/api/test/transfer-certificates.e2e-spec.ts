const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Transfer Certificates (e2e)', () => {
  let token: string;
  let studentId: string;
  let adminUserId: string;
  let createdTcId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const prisma = getPrisma();
    const student = await prisma.student.findFirst();
    const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    studentId = student!.id;
    adminUserId = adminUser!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /transfer-certificates', () => {
    it('should generate a transfer certificate and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/transfer-certificates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          reasonForLeaving: 'Family relocation to another city',
          issuedBy: adminUserId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.reasonForLeaving).toBe('Family relocation to another city');
      expect(res.body).toHaveProperty('tcNumber');

      createdTcId = res.body.id;
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/transfer-certificates')
        .send({ studentId, reasonForLeaving: 'No auth test', issuedBy: adminUserId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /transfer-certificates', () => {
    it('should list all transfer certificates and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/transfer-certificates')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/transfer-certificates?status=PENDING')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/transfer-certificates');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /transfer-certificates/:id', () => {
    it('should return a specific TC by id', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/transfer-certificates/${createdTcId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdTcId);
      expect(res.body.studentId).toBe(studentId);
    });

    it('should return 404 for non-existent TC', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/transfer-certificates/nonexistent-tc-id-9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /transfer-certificates/:id/issue', () => {
    it('should issue a transfer certificate and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/transfer-certificates/${createdTcId}/issue`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdTcId);
      expect(res.body.status).toBe('ISSUED');
    });
  });

  describe('GET /transfer-certificates/:id/print', () => {
    it('should return print data for a TC', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/transfer-certificates/${createdTcId}/print`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Print endpoint returns flat print data with tcNumber (not { id })
      expect(res.body).toHaveProperty('tcNumber');
      expect(res.body).toHaveProperty('status');
    });
  });
});
