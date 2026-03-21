const request = require('supertest');
import { setupTestApp, getAuthToken, closeTestApp, getApp } from './test-utils';

describe('Bus Management (e2e)', () => {
  let token: string;
  let createdVehicleId: string;
  let createdRouteId: string;
  let vehicleCounter = Date.now();

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /bus/vehicles', () => {
    it('should create a vehicle and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/bus/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          number: `E2E-BUS-${vehicleCounter++}`,
          type: 'BUS',
          capacity: 45,
          driverName: 'John Driver',
          driverPhone: '9876543210',
          conductorName: 'Jane Conductor',
          conductorPhone: '9876543211',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('BUS');
      expect(res.body.capacity).toBe(45);
      expect(res.body.driverName).toBe('John Driver');

      createdVehicleId = res.body.id;
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/bus/vehicles')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'BUS' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/bus/vehicles')
        .send({ number: `E2E-BUS-NOAUTH-${vehicleCounter++}`, capacity: 30 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /bus/vehicles', () => {
    it('should list all vehicles and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/bus/vehicles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/bus/vehicles');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /bus/routes', () => {
    it('should create a route and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/bus/routes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'E2E Test Route - North',
          description: 'Test route covering north area',
          vehicleId: createdVehicleId,
          isActive: true,
          stops: [
            { name: 'Main Gate', orderIndex: 0, estimatedArrival: '07:00' },
            { name: 'City Center', orderIndex: 1, estimatedArrival: '07:15' },
            { name: 'School', orderIndex: 2, estimatedArrival: '07:30' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Route - North');
      expect(res.body.vehicleId).toBe(createdVehicleId);

      createdRouteId = res.body.id;
    });

    it('should create a route without stops', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/bus/routes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'E2E Test Route - South',
          isActive: false,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('E2E Test Route - South');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/bus/routes')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/bus/routes')
        .send({ name: 'No Auth Route' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /bus/routes', () => {
    it('should list all routes and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/bus/routes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by activeOnly', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/bus/routes?activeOnly=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/bus/routes');

      expect(res.status).toBe(401);
    });
  });
});
