require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('../server/node_modules/mongoose');
const SearchTerm = require('../server/src/models/SearchTerm');
const Trie = require('../server/src/algorithms/Trie');
const TopKRanker = require('../server/src/algorithms/TopKRanker');
const { runMongoBaselineSearch } = require('./baseline');
const { runTrieSearch, runTrieTopKSearch } = require('./trie');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellisearch';

function calculatePercentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
}

function computeMetrics(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const total = sorted.reduce((sum, v) => sum + v, 0);
  const avg = total / sorted.length;
  const median = calculatePercentile(sorted, 50);
  const p95 = calculatePercentile(sorted, 95);
  const p99 = calculatePercentile(sorted, 99);
  const throughput = Math.round((1000 / avg));

  return {
    avgMs: Number(avg.toFixed(3)),
    medianMs: Number(median.toFixed(3)),
    p95Ms: Number(p95.toFixed(3)),
    p99Ms: Number(p99.toFixed(3)),
    minMs: Number(sorted[0].toFixed(3)),
    maxMs: Number(sorted[sorted.length - 1].toFixed(3)),
    throughputOpsPerSec: throughput
  };
}

async function runBenchmarkSuite() {
  console.log('===============================================================');
  console.log('   IntelliSearch — Performance Benchmark Suite');
  console.log('===============================================================\n');

  console.log(`[BENCHMARK] Connecting to MongoDB: ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);

  const totalTermsInDb = await SearchTerm.countDocuments();
  console.log(`[BENCHMARK] Total terms in MongoDB: ${totalTermsInDb}`);

  if (totalTermsInDb === 0) {
    console.warn('[BENCHMARK] No search terms found. Run "npm run seed" first.');
    await mongoose.disconnect();
    return;
  }

  // Build in-memory Trie
  console.log('\n[BENCHMARK] Building in-memory Trie from MongoDB records...');
  const memBefore = process.memoryUsage();
  const trie = new Trie();
  const ranker = new TopKRanker();

  const loadStart = process.hrtime.bigint();
  const termsCursor = SearchTerm.find({}).lean().cursor();
  let loadedCount = 0;

  for await (const doc of termsCursor) {
    trie.insert(doc.term, {
      id: doc._id.toString(),
      frequency: doc.frequency,
      clickCount: doc.clickCount,
      lastSearchedAt: doc.lastSearchedAt,
      createdAt: doc.createdAt
    });
    loadedCount++;
  }

  const loadEnd = process.hrtime.bigint();
  const loadDurationMs = Number(loadEnd - loadStart) / 1e6;
  const memAfter = process.memoryUsage();
  const trieStats = trie.getStats();

  const heapDiffMb = ((memAfter.heapUsed - memBefore.heapUsed) / (1024 * 1024)).toFixed(2);

  console.log(`[BENCHMARK] Trie Loaded: ${trieStats.totalTerms} terms, ${trieStats.totalNodes} nodes in ${loadDurationMs.toFixed(2)}ms`);
  console.log(`[BENCHMARK] Approximate Heap Consumed: ${heapDiffMb} MB\n`);

  // Warm up JIT
  console.log('[BENCHMARK] Warming up V8 engine with sample queries...');
  for (let i = 0; i < 50; i++) {
    runTrieTopKSearch(trie, ranker, 'jav', 5);
  }

  const TEST_QUERIES = [
    'jav', 'reac', 'nod', 'pyth', 'dock', 'data',
    'clou', 'mong', 'api', 'type', 'algo', 'syst'
  ];
  const ITERATIONS_PER_QUERY = 25; // 300 total measurements per method
  const LIMIT = 5;

  console.log(`[BENCHMARK] Executing ${TEST_QUERIES.length * ITERATIONS_PER_QUERY} requests per method (Limit = ${LIMIT})...\n`);

  const mongoLatencies = [];
  const trieLatencies = [];
  const trieTopKLatencies = [];
  let totalCandidates = 0;

  // Run tests
  for (const q of TEST_QUERIES) {
    for (let i = 0; i < ITERATIONS_PER_QUERY; i++) {
      // 1. Mongo Regex Baseline
      const mongoRes = await runMongoBaselineSearch(SearchTerm, q, LIMIT);
      mongoLatencies.push(mongoRes.latencyMs);

      // 2. Trie Only (traversal of subtree)
      const trieRes = runTrieSearch(trie, q);
      trieLatencies.push(trieRes.latencyMs);

      // 3. Trie + Min-Heap Top-K
      const topKRes = runTrieTopKSearch(trie, ranker, q, LIMIT);
      trieTopKLatencies.push(topKRes.latencyMs);
      totalCandidates += topKRes.candidatesCount;
    }
  }

  const mongoMetrics = computeMetrics(mongoLatencies);
  const trieMetrics = computeMetrics(trieLatencies);
  const trieTopKMetrics = computeMetrics(trieTopKLatencies);

  const speedup = (mongoMetrics.avgMs / trieTopKMetrics.avgMs).toFixed(1);

  // Formatted Console Table
  console.log('---------------------------------------------------------------------------------------');
  console.log(`Dataset: ${totalTermsInDb.toLocaleString()} terms | Total Runs: ${mongoLatencies.length} per method`);
  console.log('---------------------------------------------------------------------------------------');
  console.log(
    'Method'.padEnd(20) +
    'Avg Latency'.padEnd(16) +
    'Median'.padEnd(14) +
    'P95'.padEnd(14) +
    'P99'.padEnd(14) +
    'Throughput'
  );
  console.log('---------------------------------------------------------------------------------------');
  console.log(
    'MongoDB Baseline'.padEnd(20) +
    `${mongoMetrics.avgMs} ms`.padEnd(16) +
    `${mongoMetrics.medianMs} ms`.padEnd(14) +
    `${mongoMetrics.p95Ms} ms`.padEnd(14) +
    `${mongoMetrics.p99Ms} ms`.padEnd(14) +
    `~${mongoMetrics.throughputOpsPerSec} req/s`
  );
  console.log(
    'Trie (Subtree DFS)'.padEnd(20) +
    `${trieMetrics.avgMs} ms`.padEnd(16) +
    `${trieMetrics.medianMs} ms`.padEnd(14) +
    `${trieMetrics.p95Ms} ms`.padEnd(14) +
    `${trieMetrics.p99Ms} ms`.padEnd(14) +
    `~${trieMetrics.throughputOpsPerSec} req/s`
  );
  console.log(
    'Trie + Top-K (Heap)'.padEnd(20) +
    `${trieTopKMetrics.avgMs} ms`.padEnd(16) +
    `${trieTopKMetrics.medianMs} ms`.padEnd(14) +
    `${trieTopKMetrics.p95Ms} ms`.padEnd(14) +
    `${trieTopKMetrics.p99Ms} ms`.padEnd(14) +
    `~${trieTopKMetrics.throughputOpsPerSec} req/s`
  );
  console.log('---------------------------------------------------------------------------------------');
  console.log(`>>> Performance Multiplier: Trie + Top-K is ~${speedup}x FASTER than MongoDB Baseline <<<\n`);

  const report = {
    timestamp: new Date().toISOString(),
    datasetSize: totalTermsInDb,
    trieNodes: trieStats.totalNodes,
    heapMemoryMb: Number(heapDiffMb),
    totalQueriesExecuted: mongoLatencies.length,
    speedupMultiplier: Number(speedup),
    averageCandidatesExamined: Math.round(totalCandidates / (TEST_QUERIES.length * ITERATIONS_PER_QUERY)),
    metrics: {
      mongoBaseline: mongoMetrics,
      trieOnly: trieMetrics,
      trieTopK: trieTopKMetrics
    }
  };

  const outputPath = path.resolve(__dirname, 'results.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`[BENCHMARK] Saved benchmark report to ${outputPath}`);

  await mongoose.disconnect();
}

if (require.main === module) {
  runBenchmarkSuite().catch(err => {
    console.error('[BENCHMARK] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = {
  runBenchmarkSuite
};
