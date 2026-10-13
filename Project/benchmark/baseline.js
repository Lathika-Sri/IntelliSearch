const { normalizeTerm } = require('../server/src/utils/normalizer');

/**
 * Baseline search using MongoDB regex.
 *
 * @param {import('mongoose').Model} SearchTermModel
 * @param {string} rawPrefix
 * @param {number} [limit=5]
 * @returns {Promise<{ results: Array, latencyMs: number }>}
 */
async function runMongoBaselineSearch(SearchTermModel, rawPrefix, limit = 5) {
  const prefix = normalizeTerm(rawPrefix);
  const startTime = process.hrtime.bigint();

  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const results = await SearchTermModel.find({ term: new RegExp(`^${escaped}`, 'i') })
    .sort({ frequency: -1 })
    .limit(limit)
    .select('term frequency')
    .lean();

  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  return {
    results,
    latencyMs
  };
}

module.exports = {
  runMongoBaselineSearch
};
