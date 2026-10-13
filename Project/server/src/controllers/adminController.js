const adminService = require('../services/adminService');
const trieManager = require('../managers/TrieManager');

class AdminController {
  async getTerms(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const data = await adminService.getTerms(page, limit, search);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async createTerm(req, res, next) {
    try {
      const { term, frequency, clickCount } = req.body;
      if (!term || typeof term !== 'string' || term.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Term is required and must be a valid string'
        });
      }

      const newTerm = await adminService.createTerm({ term, frequency, clickCount });
      return res.status(201).json({
        success: true,
        message: 'Search term created and synchronized to Trie',
        data: newTerm
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTerm(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await adminService.updateTerm(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Search term updated and synchronized to Trie',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTerm(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await adminService.deleteTerm(id);
      return res.status(200).json({
        success: true,
        message: 'Search term deleted and pruned from Trie',
        data: deleted
      });
    } catch (error) {
      next(error);
    }
  }

  async rebuildTrie(req, res, next) {
    try {
      const stats = await adminService.rebuildTrie();
      return res.status(200).json({
        success: true,
        message: 'In-memory Trie successfully rebuilt from MongoDB',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = trieManager.getStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
