const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const data = await analyticsService.getOverview();
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getPopular(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const data = await analyticsService.getPopular(limit);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const days = req.query.days ? parseInt(req.query.days, 10) : 7;
      const data = await analyticsService.getTrends(days);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getZeroResults(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const data = await analyticsService.getZeroResults(limit);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
