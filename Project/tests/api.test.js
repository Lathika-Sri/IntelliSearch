const request = require('supertest');
const mongoose = require('../server/node_modules/mongoose');
const app = require('../server/src/app');
const SearchTerm = require('../server/src/models/SearchTerm');
const trieManager = require('../server/src/managers/TrieManager');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellisearch';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
  await trieManager.initialize(SearchTerm);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('API Endpoints Testing', () => {
  describe('GET /api/search/suggestions', () => {
    test('should return suggestions with valid query and limit', async () => {
      const res = await request(app)
        .get('/api/search/suggestions?q=jav&limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.query).toBe('jav');
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body.suggestions.length).toBeLessThanOrEqual(5);
      expect(res.body.metadata).toHaveProperty('processingTimeMs');
      expect(res.body.metadata).toHaveProperty('count');
    });

    test('should return 400 for empty query', async () => {
      const res = await request(app)
        .get('/api/search/suggestions?q=')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Query parameter "q" is required');
    });

    test('should return 400 for invalid limit', async () => {
      const res = await request(app)
        .get('/api/search/suggestions?q=jav&limit=100')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Limit must be an integer between 1 and 20');
    });

    test('should return empty list when no matches exist', async () => {
      const res = await request(app)
        .get('/api/search/suggestions?q=zzxxqqnonexistent')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.suggestions).toEqual([]);
      expect(res.body.metadata.count).toBe(0);
    });
  });

  describe('POST /api/search/click', () => {
    test('should record suggestion click and update frequency', async () => {
      const res = await request(app)
        .post('/api/search/click')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          query: 'jav',
          suggestion: 'java spring boot',
          sessionId: 'test_session_1'
        }))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.suggestion).toBe('java spring boot');
      expect(res.body.data.clickCount).toBeGreaterThanOrEqual(1);
    });

    test('should return 400 if suggestion is missing', async () => {
      const res = await request(app)
        .post('/api/search/click')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ query: 'jav' }))
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Analytics Endpoints', () => {
    test('GET /api/analytics/overview should return metrics', async () => {
      const res = await request(app)
        .get('/api/analytics/overview')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalSearches');
      expect(res.body.data).toHaveProperty('totalClicks');
      expect(res.body.data).toHaveProperty('ctrPercentage');
      expect(res.body.data).toHaveProperty('trieTerms');
    });

    test('GET /api/analytics/popular should return top items', async () => {
      const res = await request(app)
        .get('/api/analytics/popular?limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.topTerms)).toBe(true);
    });
  });

  describe('Admin Endpoints & Security', () => {
    test('should allow access with valid admin key', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('x-admin-key', 'admin-secret-key-123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalTerms');
      expect(res.body.data).toHaveProperty('totalNodes');
    });

    test('should fetch paginated terms list', async () => {
      const res = await request(app)
        .get('/api/admin/terms?page=1&limit=5')
        .set('x-admin-key', process.env.ADMIN_API_KEY || 'adminkey123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.terms.length).toBeLessThanOrEqual(5);
      expect(res.body.data.pagination).toHaveProperty('totalPages');
    });

    test('should rebuild Trie on demand', async () => {
      const res = await request(app)
        .post('/api/admin/trie/rebuild')
        .set('x-admin-key', 'admin-secret-key-123')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('rebuilt');
    });
  });
});
