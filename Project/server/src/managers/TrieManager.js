const Trie = require('../algorithms/Trie');
const TopKRanker = require('../algorithms/TopKRanker');
const { normalizeTerm } = require('../utils/normalizer');
const logger = require('../utils/logger');

/**
 * TrieManager acts as the in-memory search engine and synchronization coordinator.
 * Keeps an in-memory Trie in sync with persistent MongoDB storage.
 */
class TrieManager {
  constructor() {
    this.trie = new Trie();
    this.ranker = new TopKRanker();
    this.isReady = false;
    this.searchCount = 0;
    this.lastRebuildAt = null;
  }

  /**
   * Initializes the in-memory Trie by streaming all active search terms from MongoDB.
   * Runs upon server startup.
   *
   * @param {import('mongoose').Model} SearchTermModel
   * @returns {Promise<{ termsLoaded: number, nodesCreated: number, durationMs: number }>}
   */
  async initialize(SearchTermModel) {
    const startTime = process.hrtime.bigint();
    logger.info('Initializing in-memory Trie from MongoDB...');

    this.trie.clear();
    let count = 0;

    try {
      // Stream terms in batches to minimize memory overhead during initial load
      const cursor = SearchTermModel.find({})
        .select('term frequency clickCount lastSearchedAt createdAt')
        .lean()
        .cursor();

      for await (const doc of cursor) {
        this.trie.insert(doc.term, {
          id: doc._id.toString(),
          frequency: doc.frequency,
          clickCount: doc.clickCount,
          lastSearchedAt: doc.lastSearchedAt,
          createdAt: doc.createdAt
        });
        count++;
      }

      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;
      this.isReady = true;
      this.lastRebuildAt = new Date();

      const stats = this.trie.getStats();
      logger.info('Trie successfully initialized', {
        terms: stats.totalTerms,
        nodes: stats.totalNodes,
        initializationMs: durationMs.toFixed(2)
      });

      return {
        termsLoaded: stats.totalTerms,
        nodesCreated: stats.totalNodes,
        durationMs
      };
    } catch (error) {
      this.isReady = false;
      logger.error('Failed to initialize in-memory Trie from MongoDB', { error: error.message });
      throw error;
    }
  }

  /**
   * High-Performance In-Memory Trie Autocomplete with Top-K Min-Heap Ranking.
   *
   * @param {string} rawQuery
   * @param {number} [limit=5]
   * @returns {{ suggestions: Array<{ text: string, score: number }>, metadata: Object }}
   */
  search(rawQuery, limit = 5) {
    const startTime = process.hrtime.bigint();
    const query = normalizeTerm(rawQuery);
    const parsedLimit = Math.min(20, Math.max(1, Number(limit) || 5));

    this.searchCount++;

    if (!query) {
      return {
        suggestions: [],
        metadata: {
          count: 0,
          candidatesCount: 0,
          processingTimeMs: 0
        }
      };
    }

    // Step 1: Traverse Trie to find prefix node: O(P)
    const prefixNode = this.trie.searchPrefix(query);
    if (!prefixNode) {
      const endTime = process.hrtime.bigint();
      const processingTimeMs = Number(endTime - startTime) / 1e6;
      return {
        suggestions: [],
        metadata: {
          count: 0,
          candidatesCount: 0,
          processingTimeMs: Number(processingTimeMs.toFixed(3))
        }
      };
    }

    // Step 2: Collect all candidate words in subtree
    const candidates = this.trie.collectCandidates(prefixNode, 5000);

    // Step 3: Top-K ranking using Min-Heap: O(C * log K)
    const topResults = this.ranker.selectTopK(candidates, parsedLimit);

    const endTime = process.hrtime.bigint();
    const processingTimeMs = Number(endTime - startTime) / 1e6;

    return {
      suggestions: topResults.map(item => ({
        text: item.text,
        score: item.score,
        frequency: item.metadata.frequency || 1,
        clickCount: item.metadata.clickCount || 0
      })),
      metadata: {
        count: topResults.length,
        candidatesCount: candidates.length,
        processingTimeMs: Number(processingTimeMs.toFixed(3))
      }
    };
  }

  /**
   * Baseline MongoDB search for latency comparison in benchmarks.
   * Searches MongoDB using regex prefix query with frequency sorting.
   *
   * @param {import('mongoose').Model} SearchTermModel
   * @param {string} rawQuery
   * @param {number} [limit=5]
   * @returns {Promise<{ suggestions: Array<{ text: string, score: number }>, metadata: Object }>}
   */
  async baselineSearch(SearchTermModel, rawQuery, limit = 5) {
    const startTime = process.hrtime.bigint();
    const query = normalizeTerm(rawQuery);
    const parsedLimit = Math.min(20, Math.max(1, Number(limit) || 5));

    if (!query) {
      return {
        suggestions: [],
        metadata: { count: 0, processingTimeMs: 0 }
      };
    }

    // Escape regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedQuery}`, 'i');

    const results = await SearchTermModel.find({ term: regex })
      .sort({ frequency: -1 })
      .limit(parsedLimit)
      .select('term frequency clickCount')
      .lean();

    const endTime = process.hrtime.bigint();
    const processingTimeMs = Number(endTime - startTime) / 1e6;

    return {
      suggestions: results.map(doc => ({
        text: doc.term,
        score: doc.frequency,
        frequency: doc.frequency,
        clickCount: doc.clickCount || 0
      })),
      metadata: {
        count: results.length,
        processingTimeMs: Number(processingTimeMs.toFixed(3))
      }
    };
  }

  /**
   * Synchronizes newly created term to in-memory Trie.
   */
  syncInsert(doc) {
    try {
      this.trie.insert(doc.term, {
        id: doc._id?.toString(),
        frequency: doc.frequency,
        clickCount: doc.clickCount,
        lastSearchedAt: doc.lastSearchedAt,
        createdAt: doc.createdAt
      });
      logger.debug(`Synced new term to Trie: "${doc.term}"`);
    } catch (err) {
      logger.error(`Error syncing term "${doc.term}" to Trie: ${err.message}`);
    }
  }

  /**
   * Synchronizes term updates (e.g. frequency, clicks) to in-memory Trie.
   */
  syncUpdate(term, updates) {
    try {
      const updated = this.trie.update(term, updates);
      if (!updated) {
        // If not in Trie yet, insert it
        this.trie.insert(term, updates);
      }
      logger.debug(`Synced updates for term "${term}" to Trie`);
    } catch (err) {
      logger.error(`Error updating term "${term}" in Trie: ${err.message}`);
    }
  }

  /**
   * Synchronizes term deletion to in-memory Trie.
   */
  syncDelete(term) {
    try {
      this.trie.remove(term);
      logger.debug(`Removed term "${term}" from Trie`);
    } catch (err) {
      logger.error(`Error deleting term "${term}" from Trie: ${err.message}`);
    }
  }

  /**
   * Rebuilds the in-memory Trie from scratch.
   */
  async rebuild(SearchTermModel) {
    return this.initialize(SearchTermModel);
  }

  /**
   * Returns health, memory, and algorithm statistics.
   */
  getStats() {
    const stats = this.trie.getStats();
    const memory = process.memoryUsage();
    return {
      isReady: this.isReady,
      totalTerms: stats.totalTerms,
      totalNodes: stats.totalNodes,
      totalSearchesServiced: this.searchCount,
      lastRebuildAt: this.lastRebuildAt,
      memory: {
        heapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMb: Number((memory.heapTotal / 1024 / 1024).toFixed(2)),
        rssMb: Number((memory.rss / 1024 / 1024).toFixed(2))
      }
    };
  }
}

// Export singleton instance
const trieManagerInstance = new TrieManager();
module.exports = trieManagerInstance;
