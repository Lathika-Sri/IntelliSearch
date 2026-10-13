/**
 * Query and term normalizer utility.
 * Cleans string inputs: lowercases, trims, and collapses multiple spaces.
 */
function normalizeTerm(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

module.exports = {
  normalizeTerm
};
