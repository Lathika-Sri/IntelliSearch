import React, { useState } from 'react';
import Navbar from './components/Navbar';
import SearchPage from './pages/SearchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BenchmarkPage from './pages/BenchmarkPage';
import AdminPage from './pages/AdminPage';
import { EditorialPageBadge, EditorialPill } from './components/Doodles';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');

  const getTabNumber = () => {
    switch (activeTab) {
      case 'search': return '1';
      case 'analytics': return '2';
      case 'benchmark': return '3';
      case 'admin': return '4';
      default: return '1';
    }
  };

  const getTabName = () => {
    switch (activeTab) {
      case 'search': return 'AUTOCOMPLETE LAB';
      case 'analytics': return 'TELEMETRY & INSIGHTS';
      case 'benchmark': return 'BENCHMARK SUITE';
      case 'admin': return 'REGISTRY INDEX';
      default: return 'PAGE';
    }
  };

  return (
    <div className="min-h-screen bg-graph-grid text-[#111827] flex flex-col selection:bg-[#FFE600] selection:text-black">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Page Content */}
      <main className="flex-1">
        {activeTab === 'search' && <SearchPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'benchmark' && <BenchmarkPage />}
        {activeTab === 'admin' && <AdminPage />}
      </main>

      {/* Editorial Notebook Footer (Directly inspired by the reference image's SWIPE <<< & Page Number 2) */}
      <footer className="border-t-2 border-black bg-white/95 py-4 px-4 sm:px-8 mt-16 shadow-[0px_-2px_0px_#000]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Bottom Left Pill */}
          <div className="flex items-center gap-3">
            <EditorialPill text={`${getTabName()} <<<`} />
            <span className="text-xs font-mono font-medium text-neutral-500 hidden md:inline">
              In-Memory Trie & Min-Heap Top-K Engine
            </span>
          </div>

          {/* Complexity Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-md bg-[#FEF08A] border border-black text-black font-semibold shadow-[1px_1px_0px_#000]">
              Complexity: O(P) + O(C log K)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white border border-black text-neutral-800 font-medium shadow-[1px_1px_0px_#000]">
              RAM: In-Memory Hot Tree
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white border border-black text-neutral-800 font-medium shadow-[1px_1px_0px_#000]">
              Disk: MongoDB Persistence
            </span>
          </div>

          {/* Bottom Right Yellow Number Badge (matching the image's yellow circle 2) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider hidden sm:inline">
              SECTION
            </span>
            <EditorialPageBadge number={getTabNumber()} />
          </div>
        </div>
      </footer>
    </div>
  );
}
