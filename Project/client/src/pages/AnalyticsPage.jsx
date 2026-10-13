import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import {
  Search, MousePointerClick, TrendingUp, Layers, Activity,
  AlertTriangle, RefreshCw, Cpu, Sparkles
} from 'lucide-react';
import { fetchAnalyticsOverview, fetchPopular, fetchTrends, fetchZeroResults } from '../services/api';
import { YellowNoodleArrowLoop, DoodleScribbleCloud, EditorialPill } from '../components/Doodles';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [popular, setPopular] = useState({ topTerms: [], topClickedSuggestions: [] });
  const [trends, setTrends] = useState([]);
  const [zeroResults, setZeroResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, popRes, trRes, zrRes] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchPopular(8),
        fetchTrends(7),
        fetchZeroResults(5)
      ]);

      if (ovRes && ovRes.success) setOverview(ovRes.data);
      if (popRes && popRes.success) setPopular(popRes.data);
      if (trRes && trRes.success) setTrends(trRes.data);
      if (zrRes && zrRes.success) setZeroResults(zrRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-9 h-9 border-3 border-neutral-300 border-t-black rounded-full animate-spin"></div>
        <span className="font-mono text-xs text-neutral-600 font-bold uppercase tracking-wider">
          Compiling Telemetry...
        </span>
      </div>
    );
  }

  const popularChartData = popular.topTerms.map((t) => ({
    name: t.term.length > 18 ? `${t.term.slice(0, 18)}...` : t.term,
    searches: t.frequency,
    clicks: t.clickCount || 0
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFE600] border-2 border-black text-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000] mb-2">
            <Activity className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>REAL-TIME TELEMETRY ENGINE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            Search Telemetry & Insights
          </h1>
          <p className="text-neutral-700 text-sm mt-1 font-medium">
            Heuristic CTR feedback, query popularity distributions, and in-memory Trie heap health
          </p>
        </div>
        <button
          onClick={loadData}
          className="sketch-button-yellow flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Searches */}
        <div className="sketch-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-600 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
              Total Searches
            </span>
            <Search className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-black font-mono">
            {overview?.totalSearches?.toLocaleString() || 0}
          </p>
          <span className="text-[11px] font-mono font-medium text-neutral-600 mt-1 block">
            Serviced in RAM: {overview?.totalSearchesServiced?.toLocaleString() || 0}
          </span>
        </div>

        {/* Suggestion Clicks */}
        <div className="sketch-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-600 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
              Suggestion Clicks
            </span>
            <MousePointerClick className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-black font-mono">
            {overview?.totalClicks?.toLocaleString() || 0}
          </p>
          <span className="text-[11px] font-mono font-medium text-neutral-600 mt-1 block">
            Selected recommendations
          </span>
        </div>

        {/* Click-Through Rate */}
        <div className="sketch-card p-5 rounded-2xl relative overflow-hidden bg-yellow-50/50">
          <div className="flex items-center justify-between text-neutral-600 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
              Click-Through Rate
            </span>
            <TrendingUp className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-black font-mono bg-[#FFE600] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
              {overview?.ctrPercentage || 0}%
            </span>
          </div>
          <span className="text-[11px] font-mono font-medium text-neutral-700 mt-1.5 block">
            Clicks / Total Impressions
          </span>
        </div>

        {/* Trie Index Capacity */}
        <div className="sketch-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-600 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
              In-Memory Trie
            </span>
            <Layers className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-black font-mono">
            {overview?.trieTerms?.toLocaleString() || 0}
          </p>
          <span className="text-[11px] font-mono font-bold text-black bg-[#FEF08A] px-1.5 py-0.5 rounded border border-black/40 mt-1 inline-block">
            {overview?.trieNodes?.toLocaleString() || 0} Character Nodes
          </span>
        </div>
      </div>

      {/* Charts Section in Graph Paper Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Search Activity Trend Chart */}
        <div className="sketch-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FFE600] rounded-full border border-black"></span>
              <h2 className="text-xs font-mono font-bold text-neutral-900 uppercase tracking-wider">
                7-Day Activity Trends
              </h2>
            </div>
            <span className="text-xs text-neutral-500 font-mono">Daily Searches vs Clicks</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="searchGradYellow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFE600" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FFE600" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#111827" tick={{ fontSize: 11, fill: '#111827' }} />
                <YAxis stroke="#111827" tick={{ fontSize: 11, fill: '#111827' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #000000',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0px 0px #000000',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="searches" stroke="#000000" strokeWidth={2.5} fillOpacity={1} fill="url(#searchGradYellow)" name="Searches" />
                <Area type="monotone" dataKey="clicks" stroke="#ca8a04" strokeWidth={2} fillOpacity={0.3} fill="#ca8a04" name="Clicks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Popular Queries Bar Chart */}
        <div className="sketch-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-black rounded-full"></span>
              <h2 className="text-xs font-mono font-bold text-neutral-900 uppercase tracking-wider">
                Most Popular Queries
              </h2>
            </div>
            <span className="text-xs text-neutral-500 font-mono">Search Frequency</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#111827" tick={{ fontSize: 11, fill: '#111827' }} />
                <YAxis dataKey="name" type="category" stroke="#111827" tick={{ fontSize: 11, fill: '#111827' }} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #000000',
                    borderRadius: '12px',
                    boxShadow: '3px 3px 0px 0px #000000',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="searches" fill="#FFE600" stroke="#000000" strokeWidth={1.5} radius={[0, 6, 6, 0]} name="Frequency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Telemetry Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* In-Memory Memory Usage */}
        <div className="sketch-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 text-black border-b-2 border-black pb-2">
            <Cpu className="w-4 h-4 stroke-[2.5]" />
            <h2 className="text-xs font-mono font-bold text-neutral-900 uppercase tracking-wider">
              Process Memory Footprint
            </h2>
          </div>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-neutral-600 font-sans font-medium">Heap Used</span>
              <span className="text-black font-black font-mono">{overview?.memory?.heapUsedMb || 0} MB</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-neutral-600 font-sans font-medium">Heap Total</span>
              <span className="text-black font-bold font-mono">{overview?.memory?.heapTotalMb || 0} MB</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-neutral-600 font-sans font-medium">Process RSS</span>
              <span className="text-black font-bold font-mono">{overview?.memory?.rssMb || 0} MB</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-black font-bold font-sans">Total Trie Nodes</span>
              <span className="text-black font-black font-mono">{overview?.trieNodes?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* Top Clicked Suggestions */}
        <div className="sketch-card p-6 rounded-2xl">
          <h2 className="text-xs font-mono font-bold text-neutral-900 uppercase tracking-wider mb-4 border-b-2 border-black pb-2">
            Top Clicked Suggestions
          </h2>
          <div className="space-y-2">
            {popular.topClickedSuggestions.length === 0 ? (
              <p className="text-neutral-500 text-xs py-4 text-center">No clicks recorded yet</p>
            ) : (
              popular.topClickedSuggestions.slice(0, 5).map((item, idx) => (
                <div
                  key={item.suggestion}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border-2 border-black shadow-[2px_2px_0px_#000] text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[11px] font-mono font-black text-black w-5 bg-[#FFE600] rounded text-center border border-black">
                      {idx + 1}
                    </span>
                    <span className="text-neutral-900 font-bold truncate">{item.suggestion}</span>
                  </div>
                  <span className="text-black font-mono font-black bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
                    {item.count} clicks
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zero-Results Queries */}
        <div className="sketch-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 text-black border-b-2 border-black pb-2">
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <h2 className="text-xs font-mono font-bold text-neutral-900 uppercase tracking-wider">
              Zero-Result Queries
            </h2>
          </div>
          <div className="space-y-2">
            {zeroResults.length === 0 ? (
              <div className="text-center py-6 text-neutral-600 text-xs font-medium bg-neutral-50 rounded-xl border border-black/20 p-4">
                <span>0 missing terms detected. Full vocabulary coverage achieved.</span>
              </div>
            ) : (
              zeroResults.map((zr) => (
                <div
                  key={zr.query}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#fafaf9] border-2 border-black shadow-[2px_2px_0px_#000] text-xs"
                >
                  <span className="text-neutral-900 font-mono font-bold truncate">{zr.query}</span>
                  <span className="text-black bg-[#FEF08A] px-2 py-0.5 rounded border border-black font-mono font-bold text-[11px]">
                    {zr.count} misses
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
