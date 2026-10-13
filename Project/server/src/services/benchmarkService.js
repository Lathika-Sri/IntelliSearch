const SearchTerm = require('../models/SearchTerm');
const trieManager = require('../managers/TrieManager');
const TopKRanker = require('../algorithms/TopKRanker');
const { normalizeTerm } = require('../utils/normalizer');

/**
 * Service to execute rigorous, empirical benchmarks comparing:
 * 1. MongoDB baseline regex prefix search
 * 2. In-memory Trie search
 * 3. In-memory Trie + Min-Heap Top-K ranking
 */
class BenchmarkService {
  /**
   * Calculates percentile from a sorted array of numbers.
   */
  _calculatePercentile(sortedArr, p) {
    if (sortedArr.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
  }

  /**
   * Computes latency statistics (Avg, Median, P95, P99, Min, Max).
   */
  _computeStats(latencies) {
    if (latencies.length === 0) {
      return { avg: 0, median: 0, p95: 0, p99: 0, min: 0, max: 0, totalRuns: 0 };
    }
    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const avg = Number((sum / sorted.length).toFixed(3));
    const median = Number(this._calculatePercentile(sorted, 50).toFixed(3));
    const p95 = Number(this._calculatePercentile(sorted, 95).toFixed(3));
    const p99 = Number(this._calculatePercentile(sorted, 99).toFixed(3));
    const min = Number(sorted[0].toFixed(3));
    const max = Number(sorted[sorted.length - 1].toFixed(3));

    return {
      avg,
      median,
      p95,
      p99,
      min,
      max,
      totalRuns: latencies.length
    };
  }

  /**
   * Runs comparative benchmark with a list of sample queries.
   *
   * @param {Object} options
   * @param {Array<string>} [options.queries]
   * @param {number} [options.iterations=50]
   * @param {number} [options.limit=5]
   */
  async runComparison(options = {}) {
    const queries = options.queries && options.queries.length > 0
      ? options.queries
      : ['jav', 'reac', 'nod', 'pyth', 'dock', 'data', 'clou', 'mong', 'api', 'type'];

    const iterations = Math.min(200, Math.max(5, Number(options.iterations) || 50));
    const limit = Math.min(20, Math.max(1, Number(options.limit) || 5));

    const mongoLatencies = [];
    const trieLatencies = [];
    const trieTopKLatencies = [];

    const ranker = new TopKRanker();
    let totalCandidatesProcessed = 0;

    for (let i = 0; i < iterations; i++) {
      const q = queries[i % queries.length];
      const normalizedQuery = normalizeTerm(q);

      // --- 1. MongoDB Baseline Regex ---
      const mongoStart = process.hrtime.bigint();
      const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await SearchTerm.find({ term: new RegExp(`^${escapedQuery}`, 'i') })
        .sort({ frequency: -1 })
        .limit(limit)
        .select('term frequency')
        .lean();
      const mongoEnd = process.hrtime.bigint();
      mongoLatencies.push(Number(mongoEnd - mongoStart) / 1e6);

      // --- 2. In-Memory Trie (Raw Subtree Traversal) ---
      const trieStart = process.hrtime.bigint();
      const prefixNode = trieManager.trie.searchPrefix(normalizedQuery);
      let candidates = [];
      if (prefixNode) {
        candidates = trieManager.trie.collectCandidates(prefixNode);
      }
      const trieEnd = process.hrtime.bigint();
      trieLatencies.push(Number(trieEnd - trieStart) / 1e6);

      totalCandidatesProcessed += candidates.length;

      // --- 3. In-Memory Trie + Min-Heap Top-K ---
      const topKStart = process.hrtime.bigint();
      const topKPrefixNode = trieManager.trie.searchPrefix(normalizedQuery);
      if (topKPrefixNode) {
        const topKCandidates = trieManager.trie.collectCandidates(topKPrefixNode);
        ranker.selectTopK(topKCandidates, limit);
      }
      const topKEnd = process.hrtime.bigint();
      trieTopKLatencies.push(Number(topKEnd - topKStart) / 1e6);
    }

    const mongoStats = this._computeStats(mongoLatencies);
    const trieStats = this._computeStats(trieLatencies);
    const trieTopKStats = this._computeStats(trieTopKLatencies);

    const speedupMultiplier = trieTopKStats.avg > 0
      ? Number((mongoStats.avg / trieTopKStats.avg).toFixed(1))
      : 0;

    return {
      datasetTerms: trieManager.trie.getStats().totalTerms,
      totalIterations: iterations,
      requestedLimit: limit,
      queriesTested: queries,
      speedupMultiplier,
      averageCandidatesPerQuery: Math.round(totalCandidatesProcessed / iterations),
      results: {
        mongoBaseline: mongoStats,
        trieOnly: trieStats,
        triePlusTopK: trieTopKStats
      }
    };
  }
}

module.exports = new BenchmarkService();
