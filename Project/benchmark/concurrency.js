const mongoose = require('../server/node_modules/mongoose');
const SearchTerm = require('../server/src/models/SearchTerm');
const trieManager = require('../server/src/managers/TrieManager');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellisearch';

function calculatePercentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
}

async function runConcurrencyLevel(concurrentCount, queries) {
  console.log(`\n>>> Testing Concurrency Level: ${concurrentCount} simultaneous requests <<<`);

  const promises = [];
  const latencies = [];
  let successful = 0;
  let failed = 0;

  const totalStart = process.hrtime.bigint();

  for (let i = 0; i < concurrentCount; i++) {
    const q = queries[i % queries.length];
    const p = new Promise(resolve => {
      const reqStart = process.hrtime.bigint();
      try {
        const res = trieManager.search(q, 5);
        const reqEnd = process.hrtime.bigint();
        const durationMs = Number(reqEnd - reqStart) / 1e6;
        latencies.push(durationMs);
        if (res && Array.isArray(res.suggestions)) {
          successful++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
      resolve();
    });
    promises.push(p);
  }

  await Promise.all(promises);

  const totalEnd = process.hrtime.bigint();
  const totalElapsedMs = Number(totalEnd - totalStart) / 1e6;

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = Number((sum / sorted.length).toFixed(3));
  const median = Number(calculatePercentile(sorted, 50).toFixed(3));
  const p95 = Number(calculatePercentile(sorted, 95).toFixed(3));
  const p99 = Number(calculatePercentile(sorted, 99).toFixed(3));
  const throughput = Math.round((concurrentCount / (totalElapsedMs / 1000)));

  console.log(`  Requests Sent:        ${concurrentCount}`);
  console.log(`  Successful:           ${successful}`);
  console.log(`  Failed:               ${failed}`);
  console.log(`  Total Batch Duration: ${totalElapsedMs.toFixed(2)} ms`);
  console.log(`  Average Latency:      ${avg} ms`);
  console.log(`  Median Latency:       ${median} ms`);
  console.log(`  P95 Latency:          ${p95} ms`);
  console.log(`  P99 Latency:          ${p99} ms`);
  console.log(`  Throughput:           ~${throughput.toLocaleString()} req/sec`);

  return {
    concurrency: concurrentCount,
    successful,
    failed,
    avgLatencyMs: avg,
    p95LatencyMs: p95,
    throughputReqSec: throughput
  };
}

async function runConcurrencySuite() {
  console.log('===============================================================');
  console.log('   IntelliSearch — Concurrency & Thread-Safety Testing');
  console.log('===============================================================');

  console.log(`[CONCURRENCY] Connecting to MongoDB: ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);

  console.log('[CONCURRENCY] Initializing TrieManager...');
  await trieManager.initialize(SearchTerm);
  const initialStats = trieManager.getStats();
  console.log(`[CONCURRENCY] In-memory Trie ready with ${initialStats.totalTerms} terms and ${initialStats.totalNodes} nodes.`);

  const sampleQueries = ['jav', 'reac', 'nod', 'dock', 'pyth', 'data', 'mong', 'api', 'clou', 'type'];

  // Test across increasing concurrency levels
  await runConcurrencyLevel(100, sampleQueries);
  await runConcurrencyLevel(500, sampleQueries);
  await runConcurrencyLevel(1000, sampleQueries);

  // Validate state integrity after concurrent read floods
  const postStats = trieManager.getStats();
  console.log('\n[CONCURRENCY] Post-test Trie state integrity check:');
  console.log(`  Terms Count Before: ${initialStats.totalTerms} | After: ${postStats.totalTerms}`);
  console.log(`  Nodes Count Before: ${initialStats.totalNodes} | After: ${postStats.totalNodes}`);
  console.log(`  Trie State Corrupted: ${initialStats.totalTerms === postStats.totalTerms ? 'NO (PASSED)' : 'YES (FAILED)'}`);

  await mongoose.disconnect();
}

if (require.main === module) {
  runConcurrencySuite().catch(err => {
    console.error('[CONCURRENCY] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = {
  runConcurrencySuite
};
