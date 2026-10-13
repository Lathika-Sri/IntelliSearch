const express = require('express');
const router = express.Router();
const benchmarkController = require('../controllers/benchmarkController');

router.post('/run', benchmarkController.runBenchmark);

module.exports = router;
