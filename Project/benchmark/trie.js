const { normalizeTerm } = require('../server/src/utils/normalizer');

/**
 * Executes Trie prefix candidate search.
 *
 * @param {import('../server/src/algorithms/Trie')} trie
 * @param {string} rawPrefix
 * @returns {{ candidates: Array, latencyMs: number }}
 */
function runTrieSearch(trie, rawPrefix) {
  const prefix = normalizeTerm(rawPrefix);
  const startTime = process.hrtime.bigint();

  const prefixNode = trie.searchPrefix(prefix);
  let candidates = [];
  if (prefixNode) {
    candidates = trie.collectCandidates(prefixNode);
  }

  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  return {
    candidates,
    latencyMs
  };
}

/**
 * Executes Trie prefix search combined with bounded Min-Heap Top-K ranking.
 *
 * @param {import('../server/src/algorithms/Trie')} trie
 * @param {import('../server/src/algorithms/TopKRanker')} ranker
 * @param {string} rawPrefix
 * @param {number} [limit=5]
 * @returns {{ results: Array, candidatesCount: number, latencyMs: number }}
 */
function runTrieTopKSearch(trie, ranker, rawPrefix, limit = 5) {
  const prefix = normalizeTerm(rawPrefix);
  const startTime = process.hrtime.bigint();

  const prefixNode = trie.searchPrefix(prefix);
  let candidates = [];
  let results = [];

  if (prefixNode) {
    candidates = trie.collectCandidates(prefixNode);
    results = ranker.selectTopK(candidates, limit);
  }

  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  return {
    results,
    candidatesCount: candidates.length,
    latencyMs
  };
}

module.exports = {
  runTrieSearch,
  runTrieTopKSearch
};
