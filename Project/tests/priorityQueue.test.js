const PriorityQueue = require('../server/src/algorithms/PriorityQueue');

describe('PriorityQueue (Min-Heap)', () => {
  test('should initialize empty', () => {
    const pq = new PriorityQueue();
    expect(pq.size()).toBe(0);
    expect(pq.isEmpty()).toBe(true);
    expect(pq.peek()).toBeNull();
    expect(pq.pop()).toBeNull();
  });

  test('should insert and maintain minimum element at root', () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.push(10);
    pq.push(4);
    pq.push(15);
    pq.push(1);
    pq.push(7);

    expect(pq.size()).toBe(5);
    expect(pq.peek()).toBe(1);

    expect(pq.pop()).toBe(1);
    expect(pq.peek()).toBe(4);
    expect(pq.pop()).toBe(4);
    expect(pq.pop()).toBe(7);
    expect(pq.pop()).toBe(10);
    expect(pq.pop()).toBe(15);
    expect(pq.isEmpty()).toBe(true);
  });

  test('should handle custom object comparator', () => {
    const pq = new PriorityQueue((a, b) => a.score - b.score);
    pq.push({ text: 'apple', score: 50 });
    pq.push({ text: 'banana', score: 10 });
    pq.push({ text: 'cherry', score: 30 });

    expect(pq.peek().text).toBe('banana');
    expect(pq.pop().text).toBe('banana');
    expect(pq.pop().text).toBe('cherry');
    expect(pq.pop().text).toBe('apple');
  });

  test('should handle duplicates correctly', () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.push(5);
    pq.push(5);
    pq.push(2);

    expect(pq.pop()).toBe(2);
    expect(pq.pop()).toBe(5);
    expect(pq.pop()).toBe(5);
    expect(pq.isEmpty()).toBe(true);
  });
});
