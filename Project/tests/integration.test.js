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
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('End-to-End Integration Flow', () => {
  const uniqueTerm = `integration-test-term-${Date.now()}`;

  test('MongoDB -> In-Memory Trie -> REST API -> Suggestion Verification', async () => {
    // 1. Persist directly into MongoDB source of truth
    const savedTerm = await SearchTerm.create({
      term: uniqueTerm,
      frequency: 99999,
      clickCount: 500,
      lastSearchedAt: new Date()
    });
    expect(savedTerm._id).toBeDefined();

    // 2. Trie Manager rebuild / sync
    trieManager.syncInsert(savedTerm);
    expect(trieManager.trie.contains(uniqueTerm)).toBe(true);

    // 3. Query REST API with prefix
    const prefix = uniqueTerm.substring(0, 15);
    const res = await request(app)
      .get(`/api/search/suggestions?q=${prefix}&limit=5`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const suggestionTexts = res.body.suggestions.map(s => s.text);
    expect(suggestionTexts).toContain(uniqueTerm);

    // Verify it is ranked #1 due to high frequency
    expect(res.body.suggestions[0].text).toBe(uniqueTerm);

    // Clean up
    await SearchTerm.findByIdAndDelete(savedTerm._id);
    trieManager.syncDelete(uniqueTerm);
    expect(trieManager.trie.contains(uniqueTerm)).toBe(false);
  });
});
