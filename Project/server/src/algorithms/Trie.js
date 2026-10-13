const TrieNode = require('./TrieNode');
const { normalizeTerm } = require('../utils/normalizer');

/**
 * Custom in-memory Trie data structure for high-performance prefix searches.
 * Does not rely on any third-party trie libraries.
 */
class Trie {
  constructor() {
    this.root = new TrieNode();
    this.totalTerms = 0;
    this.totalNodes = 1; // Root node
  }

  /**
   * Inserts a term and associated metadata into the Trie.
   * Time Complexity: O(L) where L is term length.
   * Space Complexity: O(L) in the worst case for newly created nodes.
   *
   * @param {string} rawTerm
   * @param {Object} [metadata={}]
   * @returns {boolean} True if inserted as a new word, false if updated
   */
  insert(rawTerm, metadata = {}) {
    const term = normalizeTerm(rawTerm);
    if (!term) return false;

    let current = this.root;
    for (let i = 0; i < term.length; i++) {
      const char = term[i];
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode(char));
        this.totalNodes++;
      }
      current = current.children.get(char);
    }

    const wasEndOfWord = current.isEndOfWord;
    current.isEndOfWord = true;
    current.term = term;
    current.metadata = {
      id: metadata.id || metadata._id || null,
      frequency: Number(metadata.frequency ?? 1),
      clickCount: Number(metadata.clickCount ?? 0),
      lastSearchedAt: metadata.lastSearchedAt ? new Date(metadata.lastSearchedAt) : new Date(),
      createdAt: metadata.createdAt ? new Date(metadata.createdAt) : new Date()
    };

    if (!wasEndOfWord) {
      this.totalTerms++;
      return true;
    }
    return false;
  }

  /**
   * Traverses the Trie to locate the node corresponding to the given prefix.
   * Time Complexity: O(P) where P is prefix length.
   *
   * @param {string} rawPrefix
   * @returns {TrieNode|null}
   */
  searchPrefix(rawPrefix) {
    const prefix = normalizeTerm(rawPrefix);
    if (!prefix) return null;

    let current = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const char = prefix[i];
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char);
    }
    return current;
  }

  /**
   * Checks if an exact normalized term exists in the Trie.
   * Time Complexity: O(L) where L is term length.
   *
   * @param {string} rawTerm
   * @returns {boolean}
   */
  contains(rawTerm) {
    const term = normalizeTerm(rawTerm);
    if (!term) return false;

    const node = this.searchPrefix(term);
    return Boolean(node && node.isEndOfWord);
  }

  /**
   * Gathers all candidate terms in the subtree rooted at prefixNode using iterative DFS.
   * Iterative DFS avoids call stack limits on deeply nested trees.
   *
   * @param {TrieNode} prefixNode
   * @param {number} [maxCandidates=5000] - Safety ceiling to prevent memory ballooning
   * @returns {Array<{ term: string, metadata: Object }>}
   */
  collectCandidates(prefixNode, maxCandidates = 5000) {
    if (!prefixNode) return [];

    const candidates = [];
    const stack = [prefixNode];

    while (stack.length > 0 && candidates.length < maxCandidates) {
      const current = stack.pop();

      if (current.isEndOfWord && current.term) {
        candidates.push({
          term: current.term,
          metadata: current.metadata
        });
      }

      // Push child nodes onto stack
      for (const childNode of current.children.values()) {
        stack.push(childNode);
      }
    }

    return candidates;
  }

  /**
   * Updates metadata for an existing term in the Trie.
   * Time Complexity: O(L) where L is term length.
   *
   * @param {string} rawTerm
   * @param {Object} metadataUpdates
   * @returns {boolean} True if term was found and updated
   */
  update(rawTerm, metadataUpdates = {}) {
    const term = normalizeTerm(rawTerm);
    if (!term) return false;

    const node = this.searchPrefix(term);
    if (!node || !node.isEndOfWord) {
      return false;
    }

    node.metadata = {
      ...node.metadata,
      ...metadataUpdates,
      lastSearchedAt: metadataUpdates.lastSearchedAt
        ? new Date(metadataUpdates.lastSearchedAt)
        : node.metadata.lastSearchedAt
    };
    return true;
  }

  /**
   * Removes a term from the Trie while pruning dangling nodes.
   * Time Complexity: O(L) where L is term length.
   *
   * @param {string} rawTerm
   * @returns {boolean} True if term was found and removed
   */
  remove(rawTerm) {
    const term = normalizeTerm(rawTerm);
    if (!term) return false;

    let removed = false;

    const deleteHelper = (node, index) => {
      if (index === term.length) {
        if (!node.isEndOfWord) return false;
        node.isEndOfWord = false;
        node.term = null;
        node.metadata = null;
        this.totalTerms--;
        removed = true;
        // Node can be pruned if it has no other children
        return node.children.size === 0;
      }

      const char = term[index];
      const childNode = node.children.get(char);
      if (!childNode) return false;

      const shouldPruneChild = deleteHelper(childNode, index + 1);

      if (shouldPruneChild) {
        node.children.delete(char);
        this.totalNodes--;
        // Return true if current node is not word end and has no remaining children
        return !node.isEndOfWord && node.children.size === 0;
      }

      return false;
    };

    deleteHelper(this.root, 0);
    return removed;
  }

  /**
   * Clears all nodes from the Trie.
   */
  clear() {
    this.root = new TrieNode();
    this.totalTerms = 0;
    this.totalNodes = 1;
  }

  /**
   * Returns current statistics of the in-memory Trie.
   * @returns {{ totalNodes: number, totalTerms: number }}
   */
  getStats() {
    return {
      totalNodes: this.totalNodes,
      totalTerms: this.totalTerms
    };
  }
}

module.exports = Trie;
