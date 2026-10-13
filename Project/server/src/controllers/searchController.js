const searchService = require('../services/searchService');

/**
 * Controller handling prefix search and suggestion click requests.
 */
class SearchController {
  /**
   * GET /api/search/suggestions?q=jav&limit=5
   */
  async getSuggestions(req, res, next) {
    try {
      const { q, limit, sessionId } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "q" is required and cannot be empty'
        });
      }

      if (q.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "q" cannot exceed 100 characters'
        });
      }

      const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 5;
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be an integer between 1 and 20'
        });
      }

      const result = await searchService.getSuggestions(q, parsedLimit, sessionId);

      return res.status(200).json({
        success: true,
        query: q,
        suggestions: result.suggestions,
        metadata: result.metadata
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/baseline?q=jav&limit=5
   * Baseline search using MongoDB regex for live benchmarking and comparison.
   */
  async getBaseline(req, res, next) {
    try {
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "q" is required'
        });
      }

      const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 5;
      const result = await searchService.getBaselineSuggestions(q, parsedLimit);

      return res.status(200).json({
        success: true,
        query: q,
        suggestions: result.suggestions,
        metadata: result.metadata
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/search/click
   * Body: { query: 'jav', suggestion: 'java spring boot', sessionId: '...' }
   */
  async recordClick(req, res, next) {
    try {
      const { query, suggestion, sessionId } = req.body;

      if (!suggestion || typeof suggestion !== 'string' || suggestion.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Field "suggestion" is required'
        });
      }

      const result = await searchService.recordClick(query, suggestion, sessionId);

      return res.status(200).json({
        success: true,
        message: 'Click recorded successfully',
        data: {
          suggestion: result.updatedTerm.term,
          frequency: result.updatedTerm.frequency,
          clickCount: result.updatedTerm.clickCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
