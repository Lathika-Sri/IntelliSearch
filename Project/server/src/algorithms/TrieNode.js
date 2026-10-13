/**
 * TrieNode represents an individual character node inside the Trie.
 * Memory-conscious design using Map for child pointers.
 */
class TrieNode {
  /**
   * @param {string|null} char - The character this node represents
   */
  constructor(char = null) {
    this.char = char;
    /** @type {Map<string, TrieNode>} */
    this.children = new Map();
    this.isEndOfWord = false;
    /** @type {string|null} canonical term if isEndOfWord is true */
    this.term = null;
    /**
     * @type {{
     *   id?: string,
     *   frequency: number,
     *   clickCount: number,
     *   lastSearchedAt: Date,
     *   createdAt?: Date
     * }|null}
     */
    this.metadata = null;
  }
}

module.exports = TrieNode;
