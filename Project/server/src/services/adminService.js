const SearchTerm = require('../models/SearchTerm');
const trieManager = require('../managers/TrieManager');
const { normalizeTerm } = require('../utils/normalizer');

/**
 * Service managing admin operations for search terms and Trie lifecycle.
 */
class AdminService {
  /**
   * Retrieves paginated search terms with optional search filter.
   */
  async getTerms(page = 1, limit = 20, search = '') {
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const query = {};

    if (search && search.trim()) {
      const normalized = normalizeTerm(search);
      query.term = { $regex: normalized, $options: 'i' };
    }

    const [terms, total] = await Promise.all([
      SearchTerm.find(query)
        .sort({ frequency: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      SearchTerm.countDocuments(query)
    ]);

    return {
      terms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  }

  /**
   * Creates a new search term in MongoDB and synchronizes with in-memory Trie.
   */
  async createTerm(data) {
    const term = normalizeTerm(data.term);
    if (!term) {
      throw new Error('Term string is required');
    }

    const newDoc = await SearchTerm.create({
      term,
      frequency: Number(data.frequency) || 1,
      clickCount: Number(data.clickCount) || 0,
      lastSearchedAt: new Date()
    });

    trieManager.syncInsert(newDoc);
    return newDoc;
  }

  /**
   * Updates an existing search term in MongoDB and updates in-memory Trie.
   */
  async updateTerm(id, data) {
    const existing = await SearchTerm.findById(id);
    if (!existing) {
      throw new Error('Search term not found');
    }

    const oldTerm = existing.term;
    const updatedTerm = data.term ? normalizeTerm(data.term) : oldTerm;

    existing.term = updatedTerm;
    if (data.frequency !== undefined) existing.frequency = Number(data.frequency);
    if (data.clickCount !== undefined) existing.clickCount = Number(data.clickCount);
    existing.lastSearchedAt = new Date();

    const saved = await existing.save();

    if (oldTerm !== updatedTerm) {
      trieManager.syncDelete(oldTerm);
      trieManager.syncInsert(saved);
    } else {
      trieManager.syncUpdate(updatedTerm, {
        frequency: saved.frequency,
        clickCount: saved.clickCount,
        lastSearchedAt: saved.lastSearchedAt
      });
    }

    return saved;
  }

  /**
   * Deletes a search term from MongoDB and removes from in-memory Trie.
   */
  async deleteTerm(id) {
    const existing = await SearchTerm.findByIdAndDelete(id);
    if (!existing) {
      throw new Error('Search term not found');
    }

    trieManager.syncDelete(existing.term);
    return existing;
  }

  /**
   * Force rebuilds the entire in-memory Trie from MongoDB.
   */
  async rebuildTrie() {
    return trieManager.rebuild(SearchTerm);
  }
}

module.exports = new AdminService();
