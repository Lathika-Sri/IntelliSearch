/**
 * PriorityQueue implemented as a Binary Min-Heap from first principles.
 * Supports custom comparator for flexible ranking.
 * Default comparator: (a, b) => a - b (creates a Min-Heap where root is minimum).
 */
class PriorityQueue {
  /**
   * @param {Function} comparator - (a, b) => number. Returns < 0 if a has higher priority than b.
   */
  constructor(comparator = (a, b) => a - b) {
    this.heap = [];
    this.comparator = comparator;
  }

  /**
   * Returns current number of elements in the heap.
   * @returns {number}
   */
  size() {
    return this.heap.length;
  }

  /**
   * Checks if heap is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Views the highest priority (top/root) element without removing it.
   * In a Min-Heap, this is the minimum element.
   * Time Complexity: O(1)
   */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Adds an element into the heap.
   * Time Complexity: O(log N)
   * @param {*} value
   */
  push(value) {
    this.heap.push(value);
    this._siftUp(this.heap.length - 1);
  }

  /**
   * Removes and returns the highest priority (top/root) element.
   * Time Complexity: O(log N)
   * @returns {*}
   */
  pop() {
    if (this.isEmpty()) {
      return null;
    }
    const root = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._siftDown(0);
    }
    return root;
  }

  /**
   * Restores heap property upward from index.
   * @private
   */
  _siftUp(index) {
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this.comparator(this.heap[index], this.heap[parentIndex]) < 0) {
        this._swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Restores heap property downward from index.
   * @private
   */
  _siftDown(index) {
    const length = this.heap.length;
    while (true) {
      let candidateIndex = index;
      const leftChild = (index << 1) + 1;
      const rightChild = leftChild + 1;

      if (
        leftChild < length &&
        this.comparator(this.heap[leftChild], this.heap[candidateIndex]) < 0
      ) {
        candidateIndex = leftChild;
      }

      if (
        rightChild < length &&
        this.comparator(this.heap[rightChild], this.heap[candidateIndex]) < 0
      ) {
        candidateIndex = rightChild;
      }

      if (candidateIndex !== index) {
        this._swap(index, candidateIndex);
        index = candidateIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Swaps two elements in the internal heap array.
   * @private
   */
  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

module.exports = PriorityQueue;
