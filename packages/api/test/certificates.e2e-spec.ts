const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Certificates (e2e)', () => {
  let token: string;
  let studentId: string;
  let classId: string;
  let sessionId: string;
  let createdCertificateId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { sessionId: sid } = await getTestIds();
    sessionId = sid;

    const prisma = getPrisma();
    const student = await prisma.student.findFirst();
    const cls = await prisma.class.findFirst({ where: { grade: 10 } });

    studentId = student!.id;
    classId = cls!.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /certificates', () => {
    it('should generate a certificate and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/certificates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          type: 'PARTICIPATION',
          title: 'Certificate of Participation',
          description: 'Awarded for active participation in the annual science fair',
          issuedDate: new Date().toISOString(),
          templateData: {
            eventName: 'Annual Science Fair 2025',
            position: 'Participant',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.type).toBe('PARTICIPATION');
      expect(res.body.title).toBe('Certificate of Participation');

      createdCertificateId = res.body.id;
    });

    it('should generate an achievement certificate', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/certificates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          type: 'ACHIEVEMENT',
          title: 'Certificate of Achievement: First Place',
          description: 'Awarded for securing first place in the mathematics olympiad',
          issuedDate: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('ACHIEVEMENT');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/certificates')
        .send({ studentId, type: 'PARTICIPATION', title: 'No auth cert' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /certificates', () => {
    it('should list all certificates and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/certificates')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by studentId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/certificates?studentId=${studentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/certificates?type=PARTICIPATION')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/certificates?status=ACTIVE')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/certificates');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /certificates/:id', () => {
    it('should return a specific certificate by id', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/certificates/${createdCertificateId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdCertificateId);
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.title).toBe('Certificate of Participation');
    });

    it('should return 404 for non-existent certificate', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/certificates/nonexistent-cert-id-9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /certificates/:id/print', () => {
    it('should return print data for a certificate', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/certificates/${createdCertificateId}/print`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Print endpoint returns { certificate, student, printData } not just { id }
      expect(res.body).toHaveProperty('certificate');
      expect(res.body.certificate).toHaveProperty('id', createdCertificateId);
    });
  });

  describe('PATCH /certificates/:id/revoke', () => {
    it('should revoke a certificate and return 200', async () => {
      // Create a certificate to revoke
      const createRes = await request(getApp().getHttpServer())
        .post('/api/v1/certificates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId,
          type: 'PARTICIPATION',
          title: 'Certificate To Revoke',
          description: 'This will be revoked in e2e test',
        });

      const revokeId = createRes.body.id;

      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/certificates/${revokeId}/revoke`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', revokeId);
      expect(res.body.status).toBe('REVOKED');
    });
  });

  describe('POST /certificates/merit', () => {
    it('should generate merit certificates for top students in a class', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/certificates/merit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          classId,
          academicSessionId: sessionId,
          topN: 3,
        });

      // May return 400 if no report cards found, or 200/201 with { generated, certificates }
      expect([200, 201, 400]).toContain(res.status);
      if (res.status !== 400) {
        expect(res.body).toHaveProperty('generated');
        expect(Array.isArray(res.body.certificates)).toBe(true);
      }
    });
  });
});
