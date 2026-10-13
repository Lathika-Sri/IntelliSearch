const PriorityQueue = require('./PriorityQueue');

/**
 * TopKRanker calculates heuristic relevance scores and extracts the Top-K candidates
 * using a bounded Min-Heap of size K in O(C log K) time complexity, where C is candidate
 * count and K is requested limit.
 */
class TopKRanker {
  /**
   * @param {Object} [options]
   * @param {number} [options.frequencyWeight=0.6]
   * @param {number} [options.recencyWeight=0.2]
   * @param {number} [options.clickWeight=0.2]
   */
  constructor(options = {}) {
    this.frequencyWeight = Number(
      options.frequencyWeight ?? process.env.RANK_FREQUENCY_WEIGHT ?? 0.6
    );
    this.recencyWeight = Number(
      options.recencyWeight ?? process.env.RANK_RECENCY_WEIGHT ?? 0.2
    );
    this.clickWeight = Number(
      options.clickWeight ?? process.env.RANK_CLICK_WEIGHT ?? 0.2
    );
  }

  /**
   * Computes a normalized relevance score for a given candidate.
   *
   * Scoring Breakdown:
   * 1. Frequency Score: Logarithmic damping log10(frequency + 1) normalized against typical search scale.
   * 2. Recency Score: Exponential decay based on days elapsed since last search (half-life of 30 days).
   * 3. CTR Score: Click-through rate heuristic (clicks / impressions), bounded [0, 1].
   *
   * @param {Object} candidate
   * @returns {number}
   */
  calculateScore(candidate) {
    const meta = candidate.metadata || {};
    const frequency = Math.max(1, Number(meta.frequency) || 1);
    const clickCount = Math.max(0, Number(meta.clickCount) || 0);
    const lastSearchedAt = meta.lastSearchedAt ? new Date(meta.lastSearchedAt) : new Date();

    // 1. Normalized frequency component (log10 damping to avoid extreme outliers)
    const logFreq = Math.log10(frequency + 1);
    const normalizedFrequency = Math.min(1, logFreq / 6); // Assumes max scale ~1,000,000 searches

    // 2. Recency score: exponential time decay over 30 days
    const now = Date.now();
    const diffDays = Math.max(0, (now - lastSearchedAt.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.exp(-diffDays / 30);

    // 3. CTR Score (Click-Through Rate): clicks / frequency, capped at 1.0
    const clickThroughScore = Math.min(1, clickCount / frequency);

    // Combined weighted score scaled to standard integer representation (or float)
    const rawScore =
      this.frequencyWeight * normalizedFrequency +
      this.recencyWeight * recencyScore +
      this.clickWeight * clickThroughScore;

    // Return composite score (with basic frequency component so score is also human-intuitive)
    const compositeScore = Math.round((rawScore * 10000) + (frequency * 0.1));
    return compositeScore;
  }

  /**
   * Extracts Top-K candidates using a bounded Min-Heap of size K.
   *
   * Time Complexity: O(C * log K) where C is candidates.length, K is limit.
   * Space Complexity: O(K) auxiliary space for the heap.
   *
   * Compared to Array.sort() which is O(C * log C) and copies all C items,
   * this is significantly faster and uses less memory when C >> K.
   *
   * @param {Array<{ term: string, metadata: Object }>} candidates
   * @param {number} k - Number of top items desired
   * @returns {Array<{ text: string, score: number, metadata: Object }>}
   */
  selectTopK(candidates, k = 5) {
    const limit = Math.max(1, Math.floor(k));
    if (!candidates || candidates.length === 0) {
      return [];
    }

    // Min-Heap comparator: smaller score has higher priority (sits at root)
    const minHeap = new PriorityQueue((a, b) => a.score - b.score);

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const score = this.calculateScore(candidate);
      const item = {
        text: candidate.term,
        score,
        metadata: candidate.metadata || {}
      };

      if (minHeap.size() < limit) {
        minHeap.push(item);
      } else if (item.score > minHeap.peek().score) {
        minHeap.pop();
        minHeap.push(item);
      }
    }

    // Drain the min heap to obtain items sorted ascending
    const result = new Array(minHeap.size());
    let idx = minHeap.size() - 1;
    while (!minHeap.isEmpty()) {
      result[idx] = minHeap.pop();
      idx--;
    }

    return result;
  }
}

module.exports = TopKRanker;
