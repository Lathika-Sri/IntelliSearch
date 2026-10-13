const benchmarkService = require('../services/benchmarkService');

class BenchmarkController {
  async runBenchmark(req, res, next) {
    try {
      const { queries, iterations, limit } = req.body || {};
      const results = await benchmarkService.runComparison({ queries, iterations, limit });
      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BenchmarkController();
