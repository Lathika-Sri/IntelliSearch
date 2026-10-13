const SearchTerm = require('../models/SearchTerm');
const SearchEvent = require('../models/SearchEvent');
const trieManager = require('../managers/TrieManager');

/**
 * Service providing search analytics, popularity metrics, trends, and CTR calculations.
 */
class AnalyticsService {
  /**
   * Retrieves high-level analytics summary.
   */
  async getOverview() {
    const [
      totalSearches,
      totalClicks,
      uniqueQueriesResult,
      zeroResultsResult
    ] = await Promise.all([
      SearchEvent.countDocuments({ eventType: 'SEARCH' }),
      SearchEvent.countDocuments({ eventType: 'SUGGESTION_CLICK' }),
      SearchEvent.distinct('query', { eventType: 'SEARCH' }),
      SearchEvent.countDocuments({ eventType: 'SEARCH', selectedSuggestion: null })
    ]);

    const totalImpressions = totalSearches;
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : 0;
    const trieStats = trieManager.getStats();

    return {
      totalSearches,
      totalClicks,
      uniqueQueries: uniqueQueriesResult.length,
      ctrPercentage: Number(ctr),
      trieTerms: trieStats.totalTerms,
      trieNodes: trieStats.totalNodes,
      totalSearchesServiced: trieStats.totalSearchesServiced,
      memory: trieStats.memory
    };
  }

  /**
   * Retrieves popular searches and top clicked suggestions.
   */
  async getPopular(limit = 10) {
    const parsedLimit = Math.max(1, Math.min(50, Number(limit) || 10));

    // Top terms by popularity in database
    const topTerms = await SearchTerm.find({})
      .sort({ frequency: -1 })
      .limit(parsedLimit)
      .select('term frequency clickCount')
      .lean();

    // Top clicked suggestions from events
    const topClickedSuggestions = await SearchEvent.aggregate([
      { $match: { eventType: 'SUGGESTION_CLICK', selectedSuggestion: { $ne: null } } },
      { $group: { _id: '$selectedSuggestion', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parsedLimit },
      { $project: { suggestion: '$_id', count: 1, _id: 0 } }
    ]);

    return {
      topTerms,
      topClickedSuggestions
    };
  }

  /**
   * Retrieves daily search activity trends for the past 7 days.
   */
  async getTrends(days = 7) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const trends = await SearchEvent.aggregate([
      { $match: { timestamp: { $gte: dateLimit } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            type: '$eventType'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.day': 1 } }
    ]);

    // Reshape into structured day records: { date, searches, clicks }
    const dayMap = new Map();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      dayMap.set(dayStr, { date: dayStr, searches: 0, clicks: 0 });
    }

    trends.forEach(item => {
      const day = item._id.day;
      if (dayMap.has(day)) {
        const record = dayMap.get(day);
        if (item._id.type === 'SEARCH') record.searches = item.count;
        if (item._id.type === 'SUGGESTION_CLICK') record.clicks = item.count;
      }
    });

    return Array.from(dayMap.values());
  }

  /**
   * Retrieves queries that returned zero suggestions.
   */
  async getZeroResults(limit = 10) {
    const zeroResults = await SearchEvent.aggregate([
      { $match: { eventType: 'SEARCH', selectedSuggestion: '__ZERO_RESULTS__' } },
      { $group: { _id: '$query', count: { $sum: 1 }, lastSearched: { $max: '$timestamp' } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { query: '$_id', count: 1, lastSearched: 1, _id: 0 } }
    ]);

    return zeroResults;
  }
}

module.exports = new AnalyticsService();
