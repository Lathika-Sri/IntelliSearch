
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach x-admin-key header
api.interceptors.request.use((config) => {
  const adminKey =
    localStorage.getItem('intellisearch_admin_key') ||
    import.meta.env.VITE_ADMIN_API_KEY ||
    'adminkey123';

  if (adminKey) {
    config.headers['x-admin-key'] = adminKey;
  }
  return config;
});

export const getAdminApiKey = () => {
  return (
    localStorage.getItem('intellisearch_admin_key') ||
    import.meta.env.VITE_ADMIN_API_KEY ||
    'adminkey123'
  );
};

export const setAdminApiKey = (key) => {
  if (key && key.trim()) {
    localStorage.setItem('intellisearch_admin_key', key.trim());
  } else {
    localStorage.removeItem('intellisearch_admin_key');
  }
};
// Search APIs
export const fetchSuggestions = async (q, limit = 5, sessionId = null) => {
  const res = await api.get('/search/suggestions', {
    params: { q, limit, sessionId }
  });
  return res.data;
};

export const fetchBaseline = async (q, limit = 5) => {
  const res = await api.get('/search/baseline', {
    params: { q, limit }
  });
  return res.data;
};

export const recordClick = async (query, suggestion, sessionId = null) => {
  const res = await api.post('/search/click', {
    query,
    suggestion,
    sessionId
  });
  return res.data;
};

// Analytics APIs
export const fetchAnalyticsOverview = async () => {
  const res = await api.get('/analytics/overview');
  return res.data;
};

export const fetchPopular = async (limit = 10) => {
  const res = await api.get('/analytics/popular', { params: { limit } });
  return res.data;
};

export const fetchTrends = async (days = 7) => {
  const res = await api.get('/analytics/trends', { params: { days } });
  return res.data;
};

export const fetchZeroResults = async (limit = 10) => {
  const res = await api.get('/analytics/zero-results', { params: { limit } });
  return res.data;
};

// Benchmark APIs
export const runBenchmarkComparison = async (payload) => {
  const res = await api.post('/benchmark/run', payload);
  return res.data;
};

// Admin APIs
export const fetchAdminTerms = async (page = 1, limit = 10, search = '') => {
  const res = await api.get('/admin/terms', { params: { page, limit, search } });
  return res.data;
};

export const createAdminTerm = async (termData) => {
  const res = await api.post('/admin/terms', termData);
  return res.data;
};

export const deleteAdminTerm = async (id) => {
  const res = await api.delete(`/admin/terms/${id}`);
  return res.data;
};

export const rebuildTrie = async () => {
  const res = await api.post('/admin/trie/rebuild');
  return res.data;
};

export const fetchAdminStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export default api;
