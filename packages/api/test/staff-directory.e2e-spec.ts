import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getPrisma } from './test-utils';

describe('Staff Directory Module (e2e)', () => {
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

  describe('POST /staff-directory', () => {
    it('should create a staff profile (201)', async () => {
      const prisma = getPrisma();
      // Find a user without a staff profile
      const existingProfiles = await prisma.staffProfile.findMany({ select: { userId: true } });
      const existingIds = existingProfiles.map((p: any) => p.userId);

      const user = await prisma.user.findFirst({
        where: { schoolId, id: { notIn: existingIds } },
      });

      if (!user) {
        console.warn('No available user for staff profile creation test — skipping');
        return;
      }

      const empId = `EMP-TEST-${Date.now()}`;

      const res = await request(app.getHttpServer())
        .post('/api/v1/staff-directory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          userId: user.id,
          employeeId: empId,
          department: 'ACADEMIC',
          designation: 'Test Teacher',
          dateOfJoining: '2023-06-01',
          qualification: 'M.Sc., B.Ed.',
          experience: 3,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.employeeId).toBe(empId);
    });
  });

  describe('GET /staff-directory', () => {
    it('should list all staff profiles (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/staff-directory')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
