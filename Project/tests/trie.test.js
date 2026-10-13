const Trie = require('../server/src/algorithms/Trie');

describe('Trie Data Structure', () => {
  let trie;

  beforeEach(() => {
    trie = new Trie();
  });

  test('should insert and check contains', () => {
    expect(trie.insert('java', { frequency: 100 })).toBe(true);
    expect(trie.contains('java')).toBe(true);
    expect(trie.contains('jav')).toBe(false);
    expect(trie.contains('javascript')).toBe(false);
  });

  test('should normalize terms on insertion and search', () => {
    trie.insert('  Java Spring Boot  ', { frequency: 50 });
    expect(trie.contains('java spring boot')).toBe(true);
    expect(trie.contains('JAVA SPRING BOOT')).toBe(true);
    expect(trie.contains('  java  spring  boot  ')).toBe(true);
  });

  test('should handle duplicate insertion as update', () => {
    expect(trie.insert('react', { frequency: 10 })).toBe(true);
    expect(trie.getStats().totalTerms).toBe(1);

    // Duplicate insert returns false and updates metadata
    expect(trie.insert('react', { frequency: 25 })).toBe(false);
    expect(trie.getStats().totalTerms).toBe(1);

    const node = trie.searchPrefix('react');
    expect(node.metadata.frequency).toBe(25);
  });

  test('should handle missing and empty prefixes', () => {
    trie.insert('python');
    expect(trie.searchPrefix('')).toBeNull();
    expect(trie.searchPrefix('   ')).toBeNull();
    expect(trie.searchPrefix('xyz')).toBeNull();
  });

  test('should collect all candidates under a prefix node', () => {
    trie.insert('java', { frequency: 100 });
    trie.insert('javascript', { frequency: 200 });
    trie.insert('java spring boot', { frequency: 150 });
    trie.insert('python', { frequency: 50 });

    const prefixNode = trie.searchPrefix('jav');
    expect(prefixNode).not.toBeNull();

    const candidates = trie.collectCandidates(prefixNode);
    const terms = candidates.map(c => c.term);

    expect(terms).toContain('java');
    expect(terms).toContain('javascript');
    expect(terms).toContain('java spring boot');
    expect(terms).not.toContain('python');
    expect(candidates.length).toBe(3);
  });

  test('should update metadata for an existing term', () => {
    trie.insert('golang', { frequency: 10, clickCount: 2 });
    const updated = trie.update('golang', { frequency: 15, clickCount: 5 });
    expect(updated).toBe(true);

    const node = trie.searchPrefix('golang');
    expect(node.metadata.frequency).toBe(15);
    expect(node.metadata.clickCount).toBe(5);

    expect(trie.update('nonexistent', { frequency: 1 })).toBe(false);
  });

  test('should remove terms and prune nodes', () => {
    trie.insert('car');
    trie.insert('card');
    trie.insert('care');

    const initialNodes = trie.getStats().totalNodes;
    expect(trie.contains('card')).toBe(true);

    const removed = trie.remove('card');
    expect(removed).toBe(true);
    expect(trie.contains('card')).toBe(false);
    expect(trie.contains('car')).toBe(true);
    expect(trie.contains('care')).toBe(true);
    expect(trie.getStats().totalNodes).toBeLessThan(initialNodes);

    // Removing non-existent term
    expect(trie.remove('unknown')).toBe(false);
  });
});
