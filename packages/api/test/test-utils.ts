import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
const request = require('supertest');

let app: INestApplication;
let prisma: PrismaService;
let accessToken: string;
let testSchoolId: string;
let testSessionId: string;

export async function setupTestApp(): Promise<INestApplication> {
  if (app) return app;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  prisma = app.get(PrismaService);

  return app;
}

export async function getAuthToken(): Promise<string> {
  if (accessToken) return accessToken;

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: 'admin@medicaps.edu.in', password: 'admin123' });

  accessToken = res.body.accessToken;
  return accessToken;
}

export async function getTestIds() {
  if (testSchoolId && testSessionId) return { schoolId: testSchoolId, sessionId: testSessionId };

  const school = await prisma.school.findFirst();
  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  testSchoolId = school!.id;
  testSessionId = session!.id;

  return { schoolId: testSchoolId, sessionId: testSessionId };
}

export function getApp() { return app; }
export function getPrisma() { return prisma; }

export async function closeTestApp() {
  if (app) await app.close();
}
