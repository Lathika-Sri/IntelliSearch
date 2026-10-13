import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, RefreshCw, Search, CheckCircle, AlertCircle, Key, ShieldCheck } from 'lucide-react';
import { fetchAdminTerms, createAdminTerm, deleteAdminTerm, rebuildTrie, getAdminApiKey, setAdminApiKey } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

export default function AdminPage() {
  const [terms, setTerms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [toast, setToast] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newFrequency, setNewFrequency] = useState(500);

  // Admin Key Modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getAdminApiKey());

  const debouncedSearch = useDebounce(searchTerm, 300);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadTerms = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await fetchAdminTerms(page, 12, search);
      if (res && res.success) {
        setTerms(res.data.terms);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load terms:', err);
      if (err.response?.status === 401) {
        showToast('Unauthorized: Admin key required. Click "Admin Key" to configure.', 'error');
      } else if (err.response?.status === 429) {
        showToast('Rate limit reached (30 req/min). Please wait a moment.', 'error');
      } else {
        showToast(err.response?.data?.message || 'Error loading search terms', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms(1, debouncedSearch);
  }, [debouncedSearch]);

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setAdminApiKey(apiKeyInput);
    setIsKeyModalOpen(false);
    showToast('Admin API key updated!');
    loadTerms(1, debouncedSearch);
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    if (!newTerm.trim()) return;

    try {
      const res = await createAdminTerm({
        term: newTerm.trim(),
        frequency: Number(newFrequency) || 100
      });
      if (res && res.success) {
        showToast(`Term "${newTerm}" added and synchronized to in-memory Trie!`);
        setIsModalOpen(false);
        setNewTerm('');
        setNewFrequency(500);
        loadTerms(1, searchTerm);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create term', 'error');
    }
  };

  const handleDelete = async (id, termStr) => {
    if (!window.confirm(`Delete term "${termStr}" from MongoDB and Trie?`)) return;
    try {
      const res = await deleteAdminTerm(id);
      if (res && res.success) {
        showToast(`Pruned "${termStr}" from MongoDB and Trie!`);
        loadTerms(pagination.page, searchTerm);
      }
    } catch (err) {
      showToast('Failed to delete term', 'error');
    }
  };

  const handleRebuildTrie = async () => {
    setRebuilding(true);
    try {
      const res = await rebuildTrie();
      if (res && res.success) {
        showToast(
          `In-Memory Trie rebuilt: ${res.data.termsLoaded?.toLocaleString()} terms loaded in ${res.data.durationMs?.toFixed(1)} ms!`
        );
      }
    } catch (err) {
      showToast('Failed to rebuild Trie', 'error');
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium ${toast.type === 'success'
            ? 'bg-slate-900 border-indigo-500/50 text-indigo-300'
            : 'bg-slate-900 border-rose-500/50 text-rose-300'
            }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-indigo-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Search Term Registry & Index Synchronization
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Maintain MongoDB persistent records and trigger in-memory Trie re-indexing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors"
            title="Configure Admin API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Key</span>
          </button>

          <button
            onClick={handleRebuildTrie}
            disabled={rebuilding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${rebuilding ? 'animate-spin' : ''}`} />
            <span>{rebuilding ? 'Rebuilding...' : 'Rebuild Trie Index'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Search Term</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Filter terms by substring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Indexed Terms: <strong className="text-indigo-400 font-mono">{pagination.total.toLocaleString()}</strong>
        </div>
      </div>

      {/* Terms Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6 font-medium">Term</th>
                <th className="py-3.5 px-6 font-medium">Frequency</th>
                <th className="py-3.5 px-6 font-medium">Clicks</th>
                <th className="py-3.5 px-6 font-medium">Last Searched</th>
                <th className="py-3.5 px-6 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    Loading terms from MongoDB...
                  </td>
                </tr>
              ) : terms.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No terms match the filter.
                  </td>
                </tr>
              ) : (
                terms.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-6 text-slate-200 font-semibold">{item.term}</td>
                    <td className="py-3.5 px-6 text-indigo-400 font-bold">{item.frequency.toLocaleString()}</td>
                    <td className="py-3.5 px-6 text-blue-400">{item.clickCount?.toLocaleString() || 0}</td>
                    <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                      {new Date(item.lastSearchedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDelete(item._id, item.term)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete term"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>
          Page {pagination.page} of {pagination.totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => loadTerms(pagination.page - 1, searchTerm)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadTerms(pagination.page + 1, searchTerm)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Term Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Autocomplete Term</h3>
            <p className="text-xs text-slate-400 mb-4 font-normal">
              The term will be saved to MongoDB and immediately indexed in the in-memory Trie.
            </p>
            <form onSubmit={handleCreateTerm} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium">Term</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. distributed systems architecture"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium">Initial Search Frequency</label>
                <input
                  type="number"
                  min="1"
                  value={newFrequency}
                  onChange={(e) => setNewFrequency(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Save & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Configure Admin Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Admin Authentication Key</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 font-normal">
              Used to authenticate privileged operations (viewing terms, additions, deletions, Trie rebuilding). Default key is pre-configured.
            </p>
            <form onSubmit={handleSaveApiKey} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-medium">Admin API Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adminkey123"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput('adminkey123');
                  }}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Reset to Default
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                  >
                    Save & Authenticate
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
