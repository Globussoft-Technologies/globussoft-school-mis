const request = require('supertest');
import { setupTestApp, getAuthToken, getTestIds, closeTestApp, getApp, getPrisma } from './test-utils';

describe('Library (e2e)', () => {
  let token: string;
  let schoolId: string;
  let createdBookId: string;

  beforeAll(async () => {
    await setupTestApp();
    token = await getAuthToken();

    const { schoolId: sid } = await getTestIds();
    schoolId = sid;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('POST /library/books', () => {
    it('should add a book and return 201', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/library/books')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `E2E Test Book ${Date.now()}`,
          author: 'E2E Author',
          isbn: `ISBN-E2E-${Date.now()}`,
          category: 'TEXTBOOK',
          publisher: 'E2E Publishers',
          publicationYear: 2024,
          totalCopies: 5,
          location: 'Shelf A-1',
          schoolId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.category).toBe('TEXTBOOK');
      expect(res.body.totalCopies).toBe(5);
      expect(res.body.availableCopies).toBe(5);

      createdBookId = res.body.id;
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/v1/library/books')
        .send({
          title: 'No Auth Book',
          author: 'No Auth',
          category: 'REFERENCE',
          schoolId,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /library/books', () => {
    it('should list all books and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/library/books')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter books by category', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/library/books?category=TEXTBOOK')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should search books by title', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/library/books?search=E2E')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by schoolId', async () => {
      const res = await request(getApp().getHttpServer())
        .get(`/api/v1/library/books?schoolId=${schoolId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/library/books');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /library/overdue', () => {
    it('should list overdue books and return 200', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/library/overdue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/v1/library/overdue');

      expect(res.status).toBe(401);
    });
  });
});
