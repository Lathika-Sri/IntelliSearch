require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });
const mongoose = require('../server/node_modules/mongoose');
const SearchTerm = require('../server/src/models/SearchTerm');
const SearchEvent = require('../server/src/models/SearchEvent');
const { normalizeTerm } = require('../server/src/utils/normalizer');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellisearch';

// Curated seed domains for programmatic realistic autocomplete generation
const CATEGORIES = {
  java: [
    'java', 'java spring boot', 'java collections', 'java interview questions',
    'java stream api', 'java 21 features', 'java virtual threads', 'java concurrency',
    'java multithreading', 'java memory model', 'java garbage collection', 'java design patterns',
    'java microservices', 'java hibernate', 'java jpa', 'java maven', 'java gradle',
    'java lambda expressions', 'java functional programming', 'java generics', 'java hashmap internal'
  ],
  javascript: [
    'javascript', 'javascript array methods', 'javascript closures', 'javascript event loop',
    'javascript promises', 'javascript async await', 'javascript interview questions',
    'javascript hoisting', 'javascript prototypes', 'javascript es6 features',
    'javascript reduce example', 'javascript map vs filter', 'javascript debounce vs throttle',
    'javascript generators', 'javascript proxy', 'javascript web workers', 'javascript typescript'
  ],
  react: [
    'react', 'react hooks', 'react usereducer', 'react useeffect tutorial',
    'react usememo vs usecallback', 'react context api', 'react router v6',
    'react server components', 'react query tanstack', 'react redux toolkit',
    'react interview questions', 'react lifecycle methods', 'react performance optimization',
    'react native', 'react custom hooks', 'react testing library', 'react tailwind css'
  ],
  nodejs: [
    'node.js', 'node.js express tutorial', 'node.js event loop', 'node.js streams',
    'node.js clustering', 'node.js worker threads', 'node.js rest api best practices',
    'node.js middleware', 'node.js authentication jwt', 'node.js rate limiting',
    'node.js microservices', 'node.js error handling', 'node.js mongodb mongoose'
  ],
  cloudAndDevops: [
    'aws lambda', 'aws s3 bucket', 'aws ec2 instance', 'aws dynamodb',
    'aws ecs fargate', 'aws cloudfront cdn', 'aws api gateway', 'aws iam roles',
    'docker container', 'docker compose tutorial', 'docker multi stage build',
    'kubernetes pod lifecycle', 'kubernetes ingress controller', 'kubernetes helm charts',
    'ci cd github actions', 'terraform infrastructure as code', 'linux bash scripting'
  ],
  databases: [
    'mongodb aggregation pipeline', 'mongodb indexing strategies', 'mongodb sharding',
    'mongodb vs postgresql', 'redis caching strategies', 'redis pub sub',
    'postgresql indexing btree', 'mysql performance tuning', 'sql join types',
    'database normalization 1nf 2nf 3nf', 'acid properties in database', 'cap theorem explained'
  ],
  softwareEngineering: [
    'software developer', 'software engineer', 'software developer roadmap 2026',
    'software engineer interview questions', 'software architecture best practices',
    'software development lifecycle sdlc', 'software testing and automation',
    'software design patterns', 'system design interview', 'system design rate limiter',
    'system design url shortener', 'system design cache invalidation',
    'microservices design patterns', 'saga pattern', 'cqrs and event sourcing',
    'clean architecture', 'solid principles with examples', 'domain driven design',
    'test driven development tdd', 'ci cd pipeline best practices'
  ],
  algorithms: [
    'binary search algorithm', 'merge sort vs quick sort', 'dijkstra algorithm',
    'trie data structure implementation', 'priority queue min heap', 'lru cache leetcode',
    'two pointers technique', 'sliding window maximum', 'dynamic programming memoization',
    'graph breadth first search', 'depth first search graph', 'topological sort'
  ]
};

// Modifiers and combinations for deterministic expansion
const MODIFIERS = [
  'tutorial', 'best practices', 'examples', 'cheatsheet', 'for beginners',
  'interview questions', 'architecture', 'performance optimization', 'step by step',
  'course', 'documentation', 'vs', 'guide', 'deep dive', 'internals',
  'crash course', 'roadmap 2026', 'common errors', 'unit testing', 'production ready'
];

const SECONDARY_MODIFIERS = [
  'explained', 'with diagram', 'in depth', 'hands on', 'cheat sheet',
  'code examples', 'mastery', 'overview', 'handbook', 'questions and answers'
];

/**
 * Pseudo-random number generator with deterministic seed (Linear Congruential Generator)
 */
class DeterministicRandom {
  constructor(seed = 42) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
  nextInt(min, max) {
    return Math.floor(min + this.next() * (max - min));
  }
}

/**
 * Generates N unique terms deterministically using curated base terms and vocabulary cross-products.
 */
function generateDeterministicDataset(targetCount = 10000) {
  const rng = new DeterministicRandom(123456);
  const termSet = new Set();
  const dataset = [];

  // Add all base terms first
  for (const category of Object.values(CATEGORIES)) {
    for (const term of category) {
      const normalized = normalizeTerm(term);
      if (!termSet.has(normalized)) {
        termSet.add(normalized);
        // Base terms get high popularity (Zipf-like top distribution)
        const frequency = rng.nextInt(5000, 50000);
        const clickCount = Math.floor(frequency * (0.3 + rng.next() * 0.5));
        dataset.push({
          term: normalized,
          frequency,
          clickCount,
          lastSearchedAt: new Date(Date.now() - rng.nextInt(0, 15) * 86400000)
        });
      }
    }
  }

  // Cross product generation with modifiers
  const allBaseTerms = Array.from(termSet);
  for (const base of allBaseTerms) {
    for (const mod of MODIFIERS) {
      if (dataset.length >= targetCount) break;
      const combined = normalizeTerm(`${base} ${mod}`);
      if (!termSet.has(combined)) {
        termSet.add(combined);
        const frequency = rng.nextInt(200, 8000);
        const clickCount = Math.floor(frequency * (0.2 + rng.next() * 0.4));
        dataset.push({
          term: combined,
          frequency,
          clickCount,
          lastSearchedAt: new Date(Date.now() - rng.nextInt(0, 30) * 86400000)
        });
      }
    }
    if (dataset.length >= targetCount) break;
  }

  // 3-way combinations if targetCount > current
  if (dataset.length < targetCount) {
    for (const base of allBaseTerms) {
      for (const mod of MODIFIERS) {
        for (const sec of SECONDARY_MODIFIERS) {
          if (dataset.length >= targetCount) break;
          const combined = normalizeTerm(`${base} ${mod} ${sec}`);
          if (!termSet.has(combined)) {
            termSet.add(combined);
            const frequency = rng.nextInt(10, 1200);
            const clickCount = Math.floor(frequency * (0.1 + rng.next() * 0.3));
            dataset.push({
              term: combined,
              frequency,
              clickCount,
              lastSearchedAt: new Date(Date.now() - rng.nextInt(0, 60) * 86400000)
            });
          }
        }
        if (dataset.length >= targetCount) break;
      }
      if (dataset.length >= targetCount) break;
    }
  }

  return dataset;
}

/**
 * Generates sample search events for analytics dashboard.
 */
function generateSampleEvents(dataset, count = 2000) {
  const rng = new DeterministicRandom(98765);
  const events = [];
  const topDataset = dataset.slice(0, 50);

  for (let i = 0; i < count; i++) {
    const item = topDataset[rng.nextInt(0, topDataset.length)];
    const daysAgo = rng.nextInt(0, 7);
    const timestamp = new Date(Date.now() - (daysAgo * 86400000) - rng.nextInt(0, 86400000));
    const prefix = item.term.substring(0, rng.nextInt(2, Math.min(item.term.length, 6)));

    // 1. Search Event
    events.push({
      query: prefix,
      selectedSuggestion: null,
      eventType: 'SEARCH',
      timestamp,
      sessionId: `session_${rng.nextInt(100, 999)}`
    });

    // 2. 75% chance user clicked the suggestion
    if (rng.next() < 0.75) {
      events.push({
        query: prefix,
        selectedSuggestion: item.term,
        eventType: 'SUGGESTION_CLICK',
        timestamp: new Date(timestamp.getTime() + rng.nextInt(500, 3000)),
        sessionId: `session_${rng.nextInt(100, 999)}`
      });
    }
  }

  return events;
}

async function seedDatabase() {
  const args = process.argv.slice(2);
  let targetCount = 10000;
  const countArgIdx = args.indexOf('--count');
  if (countArgIdx !== -1 && args[countArgIdx + 1]) {
    targetCount = parseInt(args[countArgIdx + 1], 10) || 10000;
  }

  console.log(`[SEED] Connecting to MongoDB: ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('[SEED] Connected.');

  console.log(`[SEED] Generating deterministic dataset of ${targetCount} terms...`);
  const dataset = generateDeterministicDataset(targetCount);
  console.log(`[SEED] Generated ${dataset.length} unique terms.`);

  console.log('[SEED] Clearing existing search data...');
  await SearchTerm.deleteMany({});
  await SearchEvent.deleteMany({});

  console.log('[SEED] Inserting search terms in batches...');
  const BATCH_SIZE = 1000;
  for (let i = 0; i < dataset.length; i += BATCH_SIZE) {
    const batch = dataset.slice(i, i + BATCH_SIZE);
    await SearchTerm.insertMany(batch);
    process.stdout.write(`  Inserted ${Math.min(i + BATCH_SIZE, dataset.length)} / ${dataset.length} terms\r`);
  }
  console.log('\n[SEED] Search terms successfully inserted.');

  console.log('[SEED] Seeding realistic analytics search events...');
  const events = generateSampleEvents(dataset, 3000);
  await SearchEvent.insertMany(events);
  console.log(`[SEED] Inserted ${events.length} search events.`);

  console.log('[SEED] Database seeding complete! Verification:');
  const termCount = await SearchTerm.countDocuments();
  const eventCount = await SearchEvent.countDocuments();
  console.log(`  -> SearchTerms in DB: ${termCount}`);
  console.log(`  -> SearchEvents in DB: ${eventCount}`);

  await mongoose.disconnect();
  console.log('[SEED] Disconnected from MongoDB. Ready for benchmark and production runs.');
}

if (require.main === module) {
  seedDatabase().catch(err => {
    console.error('[SEED] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = {
  generateDeterministicDataset,
  seedDatabase
};
