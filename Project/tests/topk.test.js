const TopKRanker = require('../server/src/algorithms/TopKRanker');

describe('TopKRanker with Min-Heap', () => {
  let ranker;

  beforeEach(() => {
    ranker = new TopKRanker({
      frequencyWeight: 0.6,
      recencyWeight: 0.2,
      clickWeight: 0.2
    });
  });

  test('should return top K elements sorted in descending order of score', () => {
    const candidates = [
      { term: 'java', metadata: { frequency: 100, clickCount: 10 } },
      { term: 'javascript', metadata: { frequency: 500, clickCount: 100 } },
      { term: 'java spring', metadata: { frequency: 300, clickCount: 40 } },
      { term: 'java interview', metadata: { frequency: 50, clickCount: 5 } },
      { term: 'java collections', metadata: { frequency: 200, clickCount: 20 } }
    ];

    const results = ranker.selectTopK(candidates, 3);
    expect(results.length).toBe(3);
    expect(results[0].text).toBe('javascript');
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
  });

  test('should handle fewer results than K', () => {
    const candidates = [
      { term: 'docker', metadata: { frequency: 50 } },
      { term: 'docker compose', metadata: { frequency: 80 } }
    ];

    const results = ranker.selectTopK(candidates, 5);
    expect(results.length).toBe(2);
    expect(results[0].text).toBe('docker compose');
    expect(results[1].text).toBe('docker');
  });

  test('should handle K = 1', () => {
    const candidates = [
      { term: 'low', metadata: { frequency: 10 } },
      { term: 'high', metadata: { frequency: 1000 } },
      { term: 'mid', metadata: { frequency: 50 } }
    ];

    const results = ranker.selectTopK(candidates, 1);
    expect(results.length).toBe(1);
    expect(results[0].text).toBe('high');
  });

  test('should handle equal scores gracefully', () => {
    const candidates = [
      { term: 'term a', metadata: { frequency: 100 } },
      { term: 'term b', metadata: { frequency: 100 } }
    ];

    const results = ranker.selectTopK(candidates, 2);
    expect(results.length).toBe(2);
    expect(results[0].score).toBe(results[1].score);
  });

  test('should handle empty candidates and invalid K', () => {
    expect(ranker.selectTopK([], 5)).toEqual([]);
    expect(ranker.selectTopK(null, 5)).toEqual([]);
    expect(ranker.selectTopK([{ term: 'test', metadata: { frequency: 1 } }], 0)).toEqual([
      { text: 'test', score: expect.any(Number), metadata: { frequency: 1 } }
    ]); // k is clamped to Math.max(1, Math.floor(k))
  });
});
