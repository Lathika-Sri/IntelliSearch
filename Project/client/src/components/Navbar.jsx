import React from 'react';
import { Search, BarChart3, Zap, Database, Command, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'search', label: 'Autocomplete', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'benchmark', label: 'Benchmarks', icon: Zap },
    { id: 'admin', label: 'Terms Registry', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#fafaf9]/95 backdrop-blur-md border-b-2 border-black">
      {/* Top Editorial Notebook Header Rule (inspired by the image: FIGURING OUT HUMANS | RAJ SHAMANI) */}
      <div className="border-b border-black/15 px-4 lg:px-8 py-1.5 bg-[#f5f5f4]/80 text-[11px] font-mono tracking-wider uppercase text-neutral-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-black">FIGURING OUT PREFIXES</span>
          <span>/</span>
          <span>IN-MEMORY TRIE & MIN-HEAP LAB</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span className="bg-[#FFE600] text-black px-1.5 py-0.2 rounded font-bold text-[10px] border border-black/30">
            LATENCY: &lt; 1MS
          </span>
          <span>SDE OPTIMIZATION SUITE</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setActiveTab('search')}
        >
          <div className="w-9 h-9 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] group-hover:-translate-y-0.5 transition-transform duration-150">
            <Command className="w-4 h-4 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-neutral-900">
                Intelli<span className="bg-[#FFE600] text-black px-1.5 py-0.5 rounded border border-black/40 shadow-[1px_1px_0px_#000] ml-0.5">Search</span>
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-black text-black shadow-[1px_1px_0px_#000]">
                O(P)
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 font-medium hidden sm:block">
              In-Memory Prefix Search Engine & Top-K Ranker
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FFE600] text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-200/80 border-2 border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black stroke-[2.5]' : 'text-neutral-600 stroke-2'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Engine Status Badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] text-neutral-900">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] border border-black animate-ping"></span>
          <span>Trie: Hot In-Memory</span>
        </div>
      </div>
    </header>
  );
}
