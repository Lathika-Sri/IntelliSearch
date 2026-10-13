const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { searchLimiter } = require('../middleware/rateLimiter');

router.get('/suggestions', searchLimiter, searchController.getSuggestions);
router.get('/baseline', searchLimiter, searchController.getBaseline);
router.post('/click', searchLimiter, searchController.recordClick);

module.exports = router;
