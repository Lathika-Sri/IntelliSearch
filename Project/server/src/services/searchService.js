const SearchTerm = require('../models/SearchTerm');
const SearchEvent = require('../models/SearchEvent');
const trieManager = require('../managers/TrieManager');
const logger = require('../utils/logger');
const { normalizeTerm } = require('../utils/normalizer');

/**
 * Service managing search operations, click tracking, and event persistence.
 */
class SearchService {
  /**
   * Retrieves Trie-based Top-K suggestions and logs search event asynchronously.
   *
   * @param {string} rawQuery
   * @param {number} [limit=5]
   * @param {string} [sessionId]
   */
  async getSuggestions(rawQuery, limit = 5, sessionId = null) {
    const query = normalizeTerm(rawQuery);
    const result = trieManager.search(query, limit);

    // Asynchronously record search event without blocking API response
    setImmediate(async () => {
      try {
        if (query) {
          await SearchEvent.create({
            query,
            eventType: 'SEARCH',
            sessionId: sessionId || 'anonymous',
            timestamp: new Date()
          });

          // If query matched an exact term, increment search frequency in MongoDB and sync Trie
          const existing = await SearchTerm.findOneAndUpdate(
            { term: query },
            { $inc: { frequency: 1 }, $set: { lastSearchedAt: new Date() } },
            { new: true }
          );

          if (existing) {
            trieManager.syncUpdate(query, {
              frequency: existing.frequency,
              lastSearchedAt: existing.lastSearchedAt
            });
          }
        }
      } catch (err) {
        logger.error(`Error logging search event for "${query}": ${err.message}`);
      }
    });

    return result;
  }

  /**
   * Retrieves MongoDB baseline suggestions for comparison.
   */
  async getBaselineSuggestions(rawQuery, limit = 5) {
    return trieManager.baselineSearch(SearchTerm, rawQuery, limit);
  }

  /**
   * Records suggestion click, increments frequency and clickCount, and updates Trie metadata.
   */
  async recordClick(rawQuery, rawSuggestion, sessionId = null) {
    const query = normalizeTerm(rawQuery);
    const suggestion = normalizeTerm(rawSuggestion);

    if (!suggestion) {
      throw new Error('Suggestion cannot be empty');
    }

    // Record click event
    const event = await SearchEvent.create({
      query: query || suggestion,
      selectedSuggestion: suggestion,
      eventType: 'SUGGESTION_CLICK',
      sessionId: sessionId || 'anonymous',
      timestamp: new Date()
    });

    // Atomically increment clickCount & frequency
    const updatedTerm = await SearchTerm.findOneAndUpdate(
      { term: suggestion },
      {
        $inc: { clickCount: 1, frequency: 2 },
        $set: { lastSearchedAt: new Date() }
      },
      { new: true, upsert: true }
    );

    // Synchronize metadata update to in-memory Trie
    trieManager.syncUpdate(suggestion, {
      id: updatedTerm._id.toString(),
      frequency: updatedTerm.frequency,
      clickCount: updatedTerm.clickCount,
      lastSearchedAt: updatedTerm.lastSearchedAt
    });

    logger.info(`Suggestion clicked: "${suggestion}" for query "${query}"`, {
      newFrequency: updatedTerm.frequency,
      newClicks: updatedTerm.clickCount
    });

    return {
      event,
      updatedTerm
    };
  }
}

module.exports = new SearchService();
