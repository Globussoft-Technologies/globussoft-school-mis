const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Inventory (e2e)', () => {
  let token: string;
  let schoolId: string;
  let createdItemId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /inventory', () => {
    it('should add an inventory item and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'E2E Test Item: Projector',
          category: 'ELECTRONICS',
          description: 'HD projector for classroom use',
          quantity: 5,
          location: 'Storage Room A',
          condition: 'NEW',
          purchaseDate: '2024-01-15',
          purchasePrice: 25000,
          supplier: 'TechStore Ltd',
          schoolId,
          performedBy: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Item: Projector');
      expect(res.body.category).toBe('ELECTRONICS');
      expect(res.body.schoolId).toBe(schoolId);
      expect(res.body.quantity).toBe(5);

      createdItemId = res.body.id;
    });

    it('should add a furniture item', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'E2E Test Item: Student Desk',
          category: 'FURNITURE',
          quantity: 30,
          location: 'Classroom B12',
          condition: 'GOOD',
          schoolId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Item: Student Desk');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/inventory')
        .send({ name: 'No auth item', category: 'ELECTRONICS', schoolId });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /inventory', () => {
    it('should list all inventory items and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/inventory?category=ELECTRONICS')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by schoolId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/inventory?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should search by name', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/inventory?search=Projector')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/inventory');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /inventory/low-stock', () => {
    it('should return low-stock items and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/inventory/low-stock')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should accept custom threshold', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/inventory/low-stock?threshold=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/inventory/low-stock');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /inventory/:id', () => {
    it('should return a specific inventory item', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/inventory/${createdItemId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdItemId);
      expect(res.body.name).toBe('E2E Test Item: Projector');
    });

    it('should return 404 for non-existent item', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/inventory/nonexistent-item-id-9999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /inventory/:id', () => {
    it('should update an inventory item and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .patch(`/api/v1/inventory/${createdItemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 4, condition: 'GOOD', location: 'Lab Room 2' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', createdItemId);
      expect(res.body.quantity).toBe(4);
      expect(res.body.condition).toBe('GOOD');
    });
  });
});
