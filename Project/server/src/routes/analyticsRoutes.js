const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { analyticsLimiter } = require('../middleware/rateLimiter');

router.get('/overview', analyticsLimiter, analyticsController.getOverview);
router.get('/popular', analyticsLimiter, analyticsController.getPopular);
router.get('/trends', analyticsLimiter, analyticsController.getTrends);
router.get('/zero-results', analyticsLimiter, analyticsController.getZeroResults);

module.exports = router;
