import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp } from './test-utils';

describe('Expenses Module (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getAuthToken();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /expenses', () => {
    it('should create an expense record (201)', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Office Stationery Purchase',
          category: 'SUPPLIES',
          amount: 4500,
          date: today,
          vendor: 'Modern Stationery Store',
          invoiceNo: 'INV-2026-001',
          description: 'A4 paper, pens, markers and other stationery items for staff use',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Office Stationery Purchase');
      expect(res.body.category).toBe('SUPPLIES');
      expect(res.body.amount).toBe(4500);
    });
  });

  describe('GET /expenses', () => {
    it('should list all expenses (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
