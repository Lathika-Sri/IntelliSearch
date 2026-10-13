const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminLimiter } = require('../middleware/rateLimiter');
const { requireAdmin } = require('../middleware/auth');

router.use(adminLimiter);
router.use(requireAdmin);

router.get('/terms', adminController.getTerms);
router.post('/terms', adminController.createTerm);
router.put('/terms/:id', adminController.updateTerm);
router.delete('/terms/:id', adminController.deleteTerm);
router.post('/trie/rebuild', adminController.rebuildTrie);
router.get('/stats', adminController.getStats);

module.exports = router;
