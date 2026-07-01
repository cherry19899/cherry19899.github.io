import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  getJobs, fulltextSearch,
  getSavedSearches, createSavedSearch, deleteSavedSearch,
} from '../lib/api';
import { useAppCtx } from '../App';
import { CATEGORIES, CAT_COLORS } from '../lib/constants';
import { t } from '../lib/i18n';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function greeting() {
  const h = new Date().getHours();
  const tr = t();
  if (h >= 5 && h < 12) return tr.goodMorning;
  if (h >= 12 && h < 17) return tr.goodAfternoon;
  return tr.goodEvening;
}

interface Job {
  id: number; title: string; description?: string; budget: number | string;
  category?: string; posted_by_name?: string; client_username?: string;
  applications?: number; applicants_count?: number;
  apply_cost?: number; is_urgent?: boolean; created_at: string;
  deadline?: string;
}

// Days until a deadline (negative = past). null if no/invalid date.
function daysUntil(d?: string): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

interface Filters {
  minBudget: string;
  maxBudget: string;
  urgentOnly: boolean;
}

const DEFAULT_FILTERS: Filters = { minBudget: '', maxBudget: '', urgentOnly: false };

// ─── Budget Slider ────────────────────────────────────────────────────────────

function BudgetSlider({
  min, max, value, onChange,
}: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void;
}) {
  const rangeRef = useRef<HTMLDivElement>(null);

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const handleTrackClick = (e: React.MouseEvent, isRight: boolean) => {
    if (!rangeRef.current) return;
    const rect = rangeRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newVal = Math.round(min + ratio * (max - min));
    if (isRight) {
      onChange([value[0], Math.max(value[0], newVal)]);
    } else {
      onChange([Math.min(value[1], newVal), value[1]]);
    }
  };

  return (
    <div className="px-2">
      <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-2">
        <span>{value[0]} π</span>
        <span>{value[1]} π</span>
      </div>
      <div ref={rangeRef} className="relative h-6 flex items-center cursor-pointer" onClick={e => {
        if (!rangeRef.current) return;
        const rect = rangeRef.current.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const newVal = Math.round(min + ratio * (max - min));
        const leftDist = Math.abs(newVal - value[0]);
        const rightDist = Math.abs(newVal - value[1]);
        if (leftDist < rightDist) onChange([Math.min(newVal, value[1]), value[1]]);
        else onChange([value[0], Math.max(newVal, value[0])]);
      }}>
        {/* Track */}
        <div className="absolute w-full h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full" />
        {/* Active range */}
        <div
          className="absolute h-1.5 bg-emerald-400 rounded-full"
          style={{ left: `${pct(value[0])}%`, width: `${pct(value[1]) - pct(value[0])}%` }}
        />
        {/* Thumb left */}
        <input
          type="range" min={min} max={max} value={value[0]}
          onChange={e => onChange([Math.min(Number(e.target.value), value[1]), value[1]])}
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
          style={{ zIndex: value[0] > max - 10 ? 5 : 3 }}
        />
        {/* Thumb right */}
        <input
          type="range" min={min} max={max} value={value[1]}
          onChange={e => onChange([value[0], Math.max(Number(e.target.value), value[0])])}
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
          style={{ zIndex: 4 }}
        />
      </div>
      {/* Preset quick buttons */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {[[0,50],[50,200],[200,500],[500,2000]].map(([a,b]) => (
          <button
            key={`${a}-${b}`}
            onClick={() => onChange([a, b])}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              value[0] === a && value[1] === b
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
            }`}
          >
            {a}–{b} π
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

function FilterSheet({
  filters, onApply, onClose, savedSearches, onSaveSearch, onDeleteSavedSearch, onLoadSearch,
}: {
  filters: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
  savedSearches: any[];
  onSaveSearch: () => void;
  onDeleteSavedSearch: (id: number) => void;
  onLoadSearch: (s: any) => void;
}) {
  const tr = t();
  const [draft, setDraft] = useState<Filters>(filters);
  const budgetRange: [number, number] = [
    parseInt(draft.minBudget) || 0,
    parseInt(draft.maxBudget) || 2000,
  ];

  const hasFilters = draft.minBudget || draft.maxBudget || draft.urgentOnly;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl pb-8 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mt-4 mb-5" />

        <div className="px-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{tr.filters}</h2>
            {hasFilters && (
              <button
                onClick={() => setDraft(DEFAULT_FILTERS)}
                className="text-xs text-red-400 font-semibold"
              >
                {tr.clearFilters}
              </button>
            )}
          </div>

          {/* Budget range */}
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">{tr.budget}</p>
          <BudgetSlider
            min={0}
            max={2000}
            value={budgetRange}
            onChange={([lo, hi]) => setDraft(d => ({ ...d, minBudget: String(lo), maxBudget: String(hi) }))}
          />

          {/* Urgent only toggle */}
          <div className="flex items-center justify-between mt-5 mb-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{tr.urgentOnly}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{tr.onlyUrgent}</p>
            </div>
            <button
              onClick={() => setDraft(d => ({ ...d, urgentOnly: !d.urgentOnly }))}
              className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${draft.urgentOnly ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${draft.urgentOnly ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Saved searches */}
          {savedSearches.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">{tr.savedSearches}</p>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map(s => (
                  <div key={s.id} className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-full px-3 py-1">
                    <button
                      onClick={() => { onLoadSearch(s); onClose(); }}
                      className="text-xs text-gray-700 dark:text-slate-200 font-medium"
                    >
                      🔍 {s.name}
                    </button>
                    <button
                      onClick={() => onDeleteSavedSearch(s.id)}
                      className="text-gray-300 dark:text-slate-500 hover:text-red-400 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onSaveSearch}
              className="flex-1 py-3 rounded-2xl border border-emerald-300 dark:border-emerald-700 text-emerald-500 text-sm font-semibold"
            >
              + {tr.saveSearch}
            </button>
            <button
              onClick={() => { onApply(draft); onClose(); }}
              className="flex-[2] py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold"
            >
              {tr.applyFilters}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Save Search Modal ────────────────────────────────────────────────────────

function SaveSearchModal({
  onSave, onClose,
}: {
  onSave: (name: string, alert: boolean) => void;
  onClose: () => void;
}) {
  const tr = t();
  const [name, setName] = useState('');
  const [alert, setAlert] = useState(false);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mb-5" />
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">{tr.saveSearch}</h2>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Python jobs under 100π"
          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400 mb-3"
        />
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-700 dark:text-slate-300">{tr.searchAlert}</p>
          <button
            onClick={() => setAlert(a => !a)}
            className={`w-12 h-6 rounded-full relative transition-colors ${alert ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${alert ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </div>
        <button
          onClick={() => name.trim() && onSave(name.trim(), alert)}
          disabled={!name.trim()}
          className="w-full h-12 rounded-full bg-emerald-500 text-white font-semibold disabled:opacity-50"
        >
          {tr.save}
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── Autocomplete dropdown ────────────────────────────────────────────────────

function AutocompleteDropdown({
  suggestions, onSelect,
}: {
  suggestions: string[];
  onSelect: (s: string) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl shadow-xl z-50 overflow-hidden">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onMouseDown={e => { e.preventDefault(); onSelect(s); }}
          className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAppCtx();
  const nav = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [dueSoon, setDueSoon] = useState(false);
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const sugTimer = useRef<ReturnType<typeof setTimeout>>();
  const tr = t();

  const filtersActive = !!(filters.minBudget || filters.maxBudget || filters.urgentOnly);

  // ── Load saved searches ───────────────────────────────────────────────────

  useEffect(() => {
    if (user) {
      getSavedSearches()
        .then(d => setSavedSearches(d?.searches || d || []))
        .catch(() => {});
    }
  }, [user]);

  // ── Autocomplete ──────────────────────────────────────────────────────────

  useEffect(() => {
    clearTimeout(sugTimer.current);
    if (search.length < 2) { setSuggestions([]); return; }
    sugTimer.current = setTimeout(async () => {
      try {
        const res = await fulltextSearch(search, 'limit=5');
        const jobs: Job[] = res?.jobs || res || [];
        // extract unique title fragments as suggestions
        const sugs = jobs.slice(0, 5).map((j: Job) => j.title);
        setSuggestions(sugs);
      } catch { setSuggestions([]); }
    }, 200);
    return () => clearTimeout(sugTimer.current);
  }, [search]);

  // ── Job fetch ─────────────────────────────────────────────────────────────

  const load = useCallback(async (p = 1, replace = true) => {
    if (p === 1) setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(p), limit: '20', sort });
      if (cat !== 'all') qs.set('category', cat);
      if (search) qs.set('search', search);
      if (filters.minBudget) qs.set('min_budget', filters.minBudget);
      if (filters.maxBudget) qs.set('max_budget', filters.maxBudget);
      if (filters.urgentOnly) qs.set('urgent', '1');
      const data = await getJobs(qs.toString());
      const list: Job[] = data?.jobs || data || [];
      setJobs(prev => replace ? list : [...prev, ...list]);
      setHasMore(list.length === 20);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  }, [cat, sort, search, filters]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(1, true), search ? 300 : 0);
    return () => clearTimeout(timer.current);
  }, [load]);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────

  useEffect(() => {
    let startY = 0;
    let pulling = false;
    const THRESHOLD = 70;

    const onStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !refreshing) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 0 && window.scrollY <= 0) {
        setPullDist(Math.min(dy * 0.5, 90));
      } else {
        pulling = false;
        setPullDist(0);
      }
    };
    const onEnd = () => {
      if (!pulling) return;
      pulling = false;
      setPullDist(prev => {
        if (prev >= THRESHOLD * 0.5) {
          setRefreshing(true);
          load(1, true).finally(() => setRefreshing(false));
        }
        return 0;
      });
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [load, refreshing]);

  // ── Saved search actions ──────────────────────────────────────────────────

  const handleSaveSearch = async (name: string, alertEnabled: boolean) => {
    try {
      const params = { search, category: cat, sort, ...filters };
      const s = await createSavedSearch({ name, query_params: params, alert_enabled: alertEnabled });
      setSavedSearches(prev => [...prev, s?.search || { id: Date.now(), name }]);
    } catch {}
    setShowSaveModal(false);
  };

  const handleDeleteSaved = async (id: number) => {
    try { await deleteSavedSearch(id); }
    catch {}
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  const handleLoadSearch = (s: any) => {
    const p = s.query_params || {};
    if (p.search) setSearch(p.search);
    if (p.category) setCat(p.category);
    if (p.sort) setSort(p.sort);
    setFilters({
      minBudget: p.minBudget || '',
      maxBudget: p.maxBudget || '',
      urgentOnly: p.urgentOnly || false,
    });
  };

  const visibleJobs = dueSoon
    ? jobs.filter(j => { const d = daysUntil(j.deadline); return d !== null && d <= 7; })
    : jobs;

  return (
    <div className="max-w-lg mx-auto animate-fade-in bg-white dark:bg-slate-900 min-h-screen">

      {/* Pull-to-refresh indicator */}
      {(pullDist > 0 || refreshing) && (
        <div
          className="flex items-center justify-center text-emerald-500 overflow-hidden transition-[height]"
          style={{ height: refreshing ? 40 : pullDist }}
        >
          <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
      )}

      {/* Greeting */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-xs text-gray-400 dark:text-slate-500">{greeting()},</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">{user?.username || ''} 👋</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-slate-500">{tr.balance}</p>
          <p className="text-base font-bold text-emerald-500">{(user as any)?.balance_pi ?? '0'} π</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-24 z-30 bg-white dark:bg-slate-900 px-4 pt-2 border-b border-gray-100 dark:border-slate-800">
        {/* Search with autocomplete */}
        <div className="relative mb-3 flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder={tr.searchJobs}
              className="w-full pl-10 pr-4 h-11 rounded-full bg-gray-100 dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            {/* Autocomplete suggestions */}
            {searchFocused && suggestions.length > 0 && (
              <AutocompleteDropdown
                suggestions={suggestions}
                onSelect={s => { setSearch(s); setSuggestions([]); }}
              />
            )}
          </div>

          {/* Filter button — badge if active */}
          <button
            onClick={() => setShowFilterSheet(true)}
            className={`relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              filtersActive ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {filtersActive && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Active filters strip */}
        {filtersActive && (
          <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
            {filters.minBudget && (
              <span className="flex-shrink-0 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full px-2.5 py-1 font-medium">
                ≥{filters.minBudget} π
                <button onClick={() => setFilters(f => ({ ...f, minBudget: '' }))} className="ml-1">×</button>
              </span>
            )}
            {filters.maxBudget && (
              <span className="flex-shrink-0 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full px-2.5 py-1 font-medium">
                ≤{filters.maxBudget} π
                <button onClick={() => setFilters(f => ({ ...f, maxBudget: '' }))} className="ml-1">×</button>
              </span>
            )}
            {filters.urgentOnly && (
              <span className="flex-shrink-0 text-xs bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full px-2.5 py-1 font-medium">
                🔥 Urgent
                <button onClick={() => setFilters(f => ({ ...f, urgentOnly: false }))} className="ml-1">×</button>
              </span>
            )}
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="flex-shrink-0 text-xs text-gray-400 dark:text-slate-500 font-medium"
            >
              {tr.clearFilters}
            </button>
          </div>
        )}

        {/* Saved searches quick row */}
        {savedSearches.length > 0 && (
          <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide">
            {savedSearches.slice(0, 5).map(s => (
              <button
                key={s.id}
                onClick={() => handleLoadSearch(s)}
                className="flex-shrink-0 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-full px-3 py-1 font-medium"
              >
                🔍 {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                cat === c.key
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-slate-400">{visibleJobs.length} {tr.jobs.toLowerCase()}</span>
            <button
              onClick={() => setDueSoon(v => !v)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                dueSoon ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
              }`}
            >
              ⏰ {tr.dueSoon}
            </button>
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-xs bg-gray-100 dark:bg-slate-800 border-0 text-gray-600 dark:text-slate-400 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="newest">{tr.newest}</option>
            <option value="budget_high">{tr.budgetHigh}</option>
            <option value="budget_low">{tr.budgetLow}</option>
          </select>
        </div>
      </div>

      {/* Job list */}
      <div className="p-4 space-y-3 pb-32">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <JobSkeleton key={i} />)
          : visibleJobs.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-3">🔍</span>
              <p className="font-semibold text-gray-900 dark:text-white">{tr.noJobsFound}</p>
              <p className="text-sm text-gray-400 mt-1">{tr.tryDifferentFilters}</p>
            </div>
          )
          : visibleJobs.map(job => (
            <JobCard key={job.id} job={job} onClick={() => nav(`/job/${job.id}`)} />
          ))
        }
        {!loading && hasMore && (
          <button onClick={() => load(page + 1, false)} className="w-full py-3 text-sm text-emerald-500 font-semibold">
            {tr.loadMore}
          </button>
        )}
      </div>

      {/* FAB */}
      {user && (
        <button
          onClick={() => nav('/post-job')}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white text-3xl font-light active:scale-95 transition-transform"
        >
          +
        </button>
      )}

      {/* Filter sheet */}
      {showFilterSheet && (
        <FilterSheet
          filters={filters}
          onApply={f => setFilters(f)}
          onClose={() => setShowFilterSheet(false)}
          savedSearches={savedSearches}
          onSaveSearch={() => { setShowFilterSheet(false); setShowSaveModal(true); }}
          onDeleteSavedSearch={handleDeleteSaved}
          onLoadSearch={handleLoadSearch}
        />
      )}

      {/* Save search modal */}
      {showSaveModal && (
        <SaveSearchModal
          onSave={handleSaveSearch}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

// ─── JobCard ──────────────────────────────────────────────────────────────────

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const catColor = CAT_COLORS[job.category?.toLowerCase() || 'other'] || CAT_COLORS.other;
  const author = job.posted_by_name || job.client_username || 'unknown';
  const applicants = job.applications ?? job.applicants_count ?? 0;
  const tr = t();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white leading-snug flex-1 line-clamp-2">{job.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-emerald-500 font-bold text-sm">{Number(job.budget)} π</span>
          <button className="text-gray-300 dark:text-slate-600 hover:text-emerald-400 transition-colors" onClick={e => e.stopPropagation()}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>

      {job.description && (
        <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">{job.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${catColor}`}>{job.category}</span>
        {job.is_urgent && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-500">{tr.urgent}</span>}
        {(job.apply_cost ?? 0) > 0 && <span className="text-xs text-gray-400 dark:text-slate-500">{job.apply_cost} connects</span>}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
            {author[0]?.toUpperCase()}
          </div>
          <span className="text-gray-500 dark:text-slate-400">@{author}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-slate-500">{applicants} {tr.applicants}</span>
          <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">{tr.open}</span>
          <span className="text-gray-400 dark:text-slate-500">{timeAgo(job.created_at)}</span>
        </div>
      </div>

      <button
        onClick={onClick}
        className="w-full h-10 rounded-full bg-emerald-500 text-white text-sm font-semibold active:scale-[0.98] transition-transform shadow-sm shadow-emerald-500/30"
      >
        {tr.applyNow}
      </button>
    </div>
  );
}

function JobSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 skeleton rounded w-2/3" />
        <div className="h-4 skeleton rounded w-12" />
      </div>
      <div className="h-3 skeleton rounded w-full" />
      <div className="h-3 skeleton rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 skeleton rounded-full w-20" />
        <div className="h-5 skeleton rounded-full w-16" />
      </div>
      <div className="h-10 skeleton rounded-full w-full" />
    </div>
  );
}
