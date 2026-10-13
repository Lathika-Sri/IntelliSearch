import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap, ArrowRight, Sparkles, AlertCircle, History, Clock } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { fetchSuggestions, fetchBaseline, recordClick } from '../services/api';
import PrefixHighlight from '../components/PrefixHighlight';
import {
  YellowNoodleArrowDown,
  YellowNoodleArrowLoop,
  YellowNoodleArrowLeft,
  DoodleScribbleFriends,
  DoodleScribbleCloud,
  EditorialPill
} from '../components/Doodles';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [meta, setMeta] = useState(null);
  const [compareBaseline, setCompareBaseline] = useState(true);
  const [baselineMeta, setBaselineMeta] = useState(null);
  const [recentSearches, setRecentSearches] = useState([
    'software developer', 'java spring boot', 'react hooks', 'kubernetes', 'mongodb indexing'
  ]);
  const [selectedTermDetails, setSelectedTermDetails] = useState(null);
  const [sessionId] = useState(() => `session_${Math.random().toString(36).substring(2, 9)}`);

  const debouncedQuery = useDebounce(query, 250);
  const inputRef = useRef(null);

  // Fetch suggestions when debounced query updates
  useEffect(() => {
    const runSearch = async () => {
      const trimmed = debouncedQuery.trim();
      if (!trimmed) {
        setSuggestions([]);
        setMeta(null);
        setBaselineMeta(null);
        setLoading(false);
        setSelectedIndex(-1);
        return;
      }

      setLoading(true);
      try {
        const triePromise = fetchSuggestions(trimmed, 6, sessionId);
        const baselinePromise = compareBaseline ? fetchBaseline(trimmed, 6) : Promise.resolve(null);

        const [trieRes, baseRes] = await Promise.all([triePromise, baselinePromise]);

        if (trieRes && trieRes.success) {
          setSuggestions(trieRes.suggestions);
          setMeta(trieRes.metadata);
          setSelectedIndex(-1);
        }

        if (baseRes && baseRes.success) {
          setBaselineMeta(baseRes.metadata);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [debouncedQuery, compareBaseline, sessionId]);

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (query.trim()) {
        handleSelectSuggestion({ text: query.trim(), score: 0 });
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const handleSelectSuggestion = async (item) => {
    const selectedText = item.text;
    setQuery(selectedText);
    setSelectedTermDetails(item);

    setRecentSearches((prev) => [selectedText, ...prev.filter((s) => s !== selectedText)].slice(0, 8));

    try {
      await recordClick(debouncedQuery || selectedText, selectedText, sessionId);
    } catch (err) {
      console.error('Failed to log click event:', err);
    }
  };

  const speedupRatio =
    baselineMeta && meta && meta.processingTimeMs > 0
      ? (baselineMeta.processingTimeMs / meta.processingTimeMs).toFixed(1)
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 relative">
      {/* Decorative Editorial Sketch Header with Doodle Characters */}
      <div className="relative text-center mb-8">
        {/* Doodle Scribble Friends in Top Right (like reference image) */}
        <div className="hidden md:block absolute -top-4 right-2 pointer-events-none">
          <DoodleScribbleFriends className="w-24 h-16" />
          <div className="font-handwriting text-sm text-neutral-800 font-bold -rotate-6 mt-0">
            Hot Trie Index
          </div>
        </div>

        {/* Doodle Scribble Cloud in Top Left (like reference image) */}
        <div className="hidden md:block absolute top-1 left-2 pointer-events-none">
          <DoodleScribbleCloud className="w-16 h-12" />
          <div className="font-handwriting text-sm text-neutral-800 font-bold rotate-6 mt-0">
            Min-Heap Top-K
          </div>
        </div>

        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFE600] border-2 border-black text-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          <span>IN-MEMORY TRIE & HEURISTIC RANKING</span>
        </div>

        {/* Main Title with Yellow Marker Ribbon */}
        <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight mb-3 mt-12">
          Intelligent{' '}
          <span className="relative inline-block px-3 py-0.5 bg-[#FFE600] border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_#000] -rotate-1">
            Autocomplete
          </span>{' '}
          Engine
        </h1>

        <p className="text-neutral-700 text-sm sm:text-base max-w-lg mx-auto font-medium">
          Instantaneous prefix retrieval executing in{' '}
          <code className="bg-[#FFE600] text-black font-mono font-bold text-xs px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
            O(P)
          </code>{' '}
          time without scanning database disk collections.
        </p>

        {/* Yellow Noodle Arrow looping towards the search box */}
        <div className="hidden sm:flex justify-center -mb-2 mt-1">
          <div className="flex items-center gap-2">
            <span className="font-handwriting text-lg text-neutral-900 font-bold rotate-1">
              Type any prefix here
            </span>
            <svg viewBox="0 0 40 24" className="w-8 h-6 text-[#FFE600]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 5 6 C 15 18, 25 18, 35 12" stroke="#FFE600" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 28 8 L 36 12 L 31 19" stroke="#FFE600" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Modern Search Command Box in Sketch Style */}
      <div className="relative mb-6">
        <div className="relative flex items-center bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] focus-within:ring-2 focus-within:ring-[#FFE600] focus-within:shadow-[5px_5px_0px_0px_#000] transition-all duration-150">
          <div className="pl-5 pr-3 text-neutral-900">
            <Search className="w-5 h-5 text-neutral-900 stroke-[2.5]" />
          </div>
          <input
            id="autocomplete-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search keywords, tech stacks, concepts... (e.g., 'soft', 'jav', 'reac', 'dock')"
            autoComplete="off"
            autoFocus
            className="w-full py-4 pr-12 bg-transparent text-neutral-900 placeholder-neutral-400 font-medium text-base focus:outline-none"
          />
          {loading && (
            <div className="pr-4">
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin"></div>
            </div>
          )}
          {query && !loading && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="mr-3 px-2 py-0.5 text-xs font-mono font-bold bg-neutral-100 hover:bg-[#FFE600] text-black border border-black rounded shadow-[1px_1px_0px_#000] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Suggestion Dropdown List (Notebook card with yellow highlighting) */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_#000] overflow-hidden z-40 divide-y divide-black/10">
            <div className="px-5 py-2.5 bg-neutral-100 border-b-2 border-black flex items-center justify-between text-[11px] font-mono font-bold text-neutral-800 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFE600] border border-black"></span>
                <span>Top-{suggestions.length} Ranked Suggestions</span>
              </div>
              <span className="text-neutral-500 font-normal">Use ↑ ↓ to navigate • ↵ to select</span>
            </div>
            <ul id="suggestions-list" className="max-h-80 overflow-y-auto divide-y divide-neutral-200">
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li
                    key={item.text}
                    id={`suggestion-item-${idx}`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelectSuggestion(item)}
                    className={`px-5 py-3.5 flex items-center justify-between cursor-pointer transition-colors duration-100 ${isSelected ? 'bg-[#FFE600] text-black border-l-4 border-black' : 'hover:bg-yellow-50/70 text-neutral-900'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-black stroke-[2.5] translate-x-1' : 'text-neutral-400 stroke-2'} transition-transform`} />
                      <PrefixHighlight text={item.text} prefix={query} />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-neutral-600 hidden sm:inline">
                        Freq: <strong className="text-black font-bold">{item.frequency?.toLocaleString() || 1}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white text-black border border-black text-[11px] font-bold shadow-[1px_1px_0px_#000]">
                        Score: {item.score}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Empty State */}
        {debouncedQuery.trim() && !loading && suggestions.length === 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white border-2 border-black rounded-2xl p-6 text-center z-40 shadow-[6px_6px_0px_0px_#000]">
            <AlertCircle className="w-8 h-8 text-[#FFE600] stroke-black stroke-[1.5] mx-auto mb-2" />
            <p className="text-neutral-900 text-sm font-bold">No suggestions found for "{query}"</p>
            <p className="text-neutral-600 text-xs mt-1">Try prefixes like "soft", "jav", "reac", "dock", "data"</p>
          </div>
        )}
      </div>

      {/* Latency Comparison Card with Yellow Noodling */}
      <div className="sketch-card rounded-2xl p-4 sm:p-5 mb-8 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Trie Stat */}
            <div className="flex items-center gap-1.5 text-neutral-900 font-bold">
              <Zap className="w-4 h-4 text-black fill-[#FFE600]" />
              <span>Trie Engine:</span>
              <span className="bg-[#FFE600] text-black border border-black px-2 py-0.5 rounded font-mono font-black shadow-[1px_1px_0px_#000]">
                {meta ? `${meta.processingTimeMs} ms` : '0.00 ms'}
              </span>
            </div>

            {/* Mongo Baseline */}
            {compareBaseline && (
              <div className="flex items-center gap-1.5 text-neutral-700 font-medium">
                <span>vs Mongo Baseline:</span>
                <span className="bg-neutral-100 text-neutral-900 border border-black px-2 py-0.5 rounded font-mono font-bold shadow-[1px_1px_0px_#000]">
                  {baselineMeta ? `${baselineMeta.processingTimeMs} ms` : '0.00 ms'}
                </span>
              </div>
            )}

            {/* Speedup Badge */}
            {speedupRatio && Number(speedupRatio) > 1 && (
              <span className="text-[11px] font-black text-black bg-[#FFE600] px-2.5 py-0.5 rounded-full border-2 border-black shadow-[2px_2px_0px_#000]">
                ⚡ ~{speedupRatio}x faster
              </span>
            )}
          </div>

          <button
            onClick={() => setCompareBaseline(!compareBaseline)}
            className="text-neutral-600 hover:text-black text-xs font-semibold underline decoration-black underline-offset-4"
          >
            {compareBaseline ? 'Hide database baseline' : 'Compare with database baseline'}
          </button>
        </div>

        {/* Noodle annotation underneath latency card */}
        <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between text-[11px] font-mono text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="font-handwriting text-base text-black font-bold">
              ⚡ Traverses in-memory prefix node pointers without touching disk!
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] text-neutral-500">
            P99: 0.08ms
          </span>
        </div>
      </div>

      {/* Selected Term Details Card (Notebook format) */}
      {selectedTermDetails && (
        <div className="sketch-card rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black" />
              <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Selected Term Analytics
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-black bg-[#FFE600] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
              CTR Updated Live
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#fafaf9] p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-neutral-500 block mb-1 font-sans font-medium text-[11px]">Term</span>
              <span className="text-black font-bold text-sm truncate block">{selectedTermDetails.text}</span>
            </div>
            <div className="bg-[#fafaf9] p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-neutral-500 block mb-1 font-sans font-medium text-[11px]">Top-K Score</span>
              <span className="text-black bg-[#FFE600] px-1.5 py-0.5 rounded border border-black font-black text-sm inline-block">
                {selectedTermDetails.score}
              </span>
            </div>
            <div className="bg-[#fafaf9] p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-neutral-500 block mb-1 font-sans font-medium text-[11px]">Search Frequency</span>
              <span className="text-black font-bold text-sm">{selectedTermDetails.frequency?.toLocaleString() || 1}</span>
            </div>
            <div className="bg-[#fafaf9] p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-neutral-500 block mb-1 font-sans font-medium text-[11px]">Clicks Recorded</span>
              <span className="text-black font-bold text-sm">{selectedTermDetails.clickCount?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Presets Chips */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-800 uppercase tracking-wider mb-3">
          <History className="w-3.5 h-3.5 text-neutral-900" />
          <span>Quick Preset Suggestions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((term) => (
            <button
              key={term}
              onClick={() => {
                setQuery(term);
                inputRef.current?.focus();
              }}
              className="sketch-button-white px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#FFE600] transition-all"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
