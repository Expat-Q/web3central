import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ExternalLink, Activity, DollarSign, BarChart3, Layers, Info,
  Landmark, Globe, ShieldCheck, User, Tag, Coins, Users, Star,
  MessageSquare, Twitter, MousePointerClick, CornerDownRight,
  Shield, ChevronRight, ArrowUpRight, Edit3
} from 'lucide-react';
import ToolLogo from './ToolLogo';
import RatingModal from './RatingModal';
import { useAuth } from '../context/AuthContext';

const metricsCache = new Map();

/* ─── Helpers ─── */
const parseUsers = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = String(value).replace(/[^\d]/g, '');
  if (!parsed) return null;
  const num = Number(parsed);
  return Number.isFinite(num) ? num : null;
};

const formatCount = (val) => {
  if (val === null || val === undefined) return null;
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return `${Math.round(val)}`;
};

const normalizeCategory = (category = '') =>
  String(category || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

/* ─── Category aliases & policies ─── */
const CATEGORY_ALIASES = {
  dex: 'trading', perps: 'trading', web3chat: 'trading', trading: 'trading',
  interoperability: 'bridges', bridge: 'bridges', bridges: 'bridges',
  communitytools: 'community', community: 'community',
  security: 'security', analytics: 'analytics', infofi: 'analytics', researchfiles: 'analytics',
  wallets: 'wallets', wallet: 'wallets', nft: 'nft', defi: 'defi',
  staking: 'staking', rwa: 'rwa', l2: 'l2', onchainautonomy: 'onchain', vibecoding: 'community',
};

const CATEGORY_METRIC_POLICY = {
  trading: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers'],
  bridges: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers'],
  defi: ['tvl', 'volume24h', 'staking', 'pool2', 'tokenPrice', 'mcap', 'fdv', 'chains'],
  staking: ['staking', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'pool2', 'chains'],
  wallets: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'chains'],
  nft: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'chains'],
  analytics: ['monthlyUsers', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  security: ['monthlyUsers', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  community: ['monthlyUsers', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  l2: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers'],
  rwa: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers'],
  onchain: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers'],
  default: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'chains'],
};

const SECURITY_CONFIG = {
  unaudited: { label: 'Unaudited',         color: 'text-red-600 bg-red-50 border-red-200',         icon: '🔴' },
  community: { label: 'Community Review',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: '🟡' },
  audited:   { label: 'Audited',           color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: '🟢' },
  verified:  { label: 'Verified',          color: 'text-purple-700 bg-purple-50 border-purple-200', icon: '✅' },
};

/* ─── Star Row ─── */
const StarRow = ({ score, size = 12 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        className={s <= Math.round(score) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
      />
    ))}
  </div>
);

/* ─── Rating Bar ─── */
const RatingBar = ({ label, pct }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs font-semibold text-gray-500 w-2">{label}</span>
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full bg-purple-500 rounded-full"
      />
    </div>
  </div>
);

/* ─── Stat Pill — equal width grid cell ─── */
const StatPill = ({ label, value, icon }) => (
  <div className="flex flex-col items-center justify-center py-3 px-1">
    <div className="flex items-center gap-1 mb-1">
      {icon && <span>{icon}</span>}
      <span className="text-sm font-black text-gray-900 leading-none">{value || '—'}</span>
    </div>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center leading-snug max-w-full">{label}</span>
  </div>
);

/* ─── Metric tile (defi metrics grid) ─── */
const MetricTile = ({ label, value, subValue, color }) => (
  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-base font-black text-gray-900 leading-tight">{value}</p>
    {subValue && (
      <p className={`text-[11px] font-bold mt-0.5 ${subValue.startsWith('+') ? 'text-emerald-500' : subValue.startsWith('-') ? 'text-rose-500' : 'text-gray-400'}`}>
        {subValue}
      </p>
    )}
  </div>
);

export default function MetricsPanel({ protocol, isOpen, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [reviews, setReviews] = React.useState([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const { user } = useAuth();

  const shouldFetchLiveMetrics = React.useMemo(() => {
    const category = normalizeCategory(protocol?.category);
    const group = CATEGORY_ALIASES[category] || 'default';
    if (!protocol?.slug) return false;
    return !['security', 'analytics', 'community'].includes(group);
  }, [protocol]);

  React.useEffect(() => {
    setDescExpanded(false);
    if (isOpen && shouldFetchLiveMetrics) {
      if (metricsCache.has(protocol.slug)) {
        setData(metricsCache.get(protocol.slug));
        setError(null);
      } else {
        fetchMetrics();
      }
    } else {
      setData(null);
      setError(null);
    }
    if (isOpen && protocol?.id) {
      fetchReviews();
    } else {
      setReviews([]);
    }
  }, [isOpen, protocol, shouldFetchLiveMetrics]);

  const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API}/ratings/${protocol.id}`);
      const result = await res.json();
      if (result.success) setReviews(result.data || []);
    } catch { setReviews([]); }
    finally { setReviewsLoading(false); }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/defi/protocol/${protocol.slug}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        metricsCache.set(protocol.slug, result.data);
      } else throw new Error(result.error || 'Failed to fetch metrics');
    } catch (err) {
      console.error('Metrics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || Number(val) === 0) return null;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  const formatPercent = (val) => {
    if (val === null || val === undefined || Number(val) === 0) return null;
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const mergedMetrics = React.useMemo(() => {
    const fb = protocol?.metrics || {};
    return {
      tvl: data?.tvl ?? fb?.tvl ?? null,
      change7d: data?.change_7d ?? fb?.tvlChange7d ?? null,
      volume24h: data?.volume24h ?? fb?.volume24h ?? null,
      mcap: data?.mcap ?? fb?.mcap ?? null,
      fdv: data?.fdv ?? fb?.fdv ?? null,
      tokenPrice: data?.tokenPrice ?? fb?.tokenPrice ?? null,
      staking: data?.staking ?? fb?.staking ?? null,
      pool2: data?.pool2 ?? fb?.pool2 ?? null,
      chains: (data?.chains?.length ? data.chains : fb?.chains) || [],
      source: data ? 'DefiLlama (live)' : fb?.lastUpdated ? 'Web3Central snapshot' : null,
    };
  }, [data, protocol]);

  /* Build defi metric tiles */
  const defiMetrics = React.useMemo(() => {
    const normalizedCat = normalizeCategory(protocol?.category);
    const catGroup = CATEGORY_ALIASES[normalizedCat] || 'default';
    const hasToken = Number(mergedMetrics.mcap) > 0 || Number(mergedMetrics.fdv) > 0 || Number(mergedMetrics.tokenPrice) > 0 || Boolean(protocol?.geckoId);

    const all = [
      { key: 'tvl', label: 'TVL', value: formatCurrency(mergedMetrics.tvl), subValue: formatPercent(mergedMetrics.change7d) },
      { key: 'volume24h', label: '24h Volume', value: formatCurrency(mergedMetrics.volume24h) },
      { key: 'mcap', label: 'Market Cap', value: hasToken ? formatCurrency(mergedMetrics.mcap) : null },
      { key: 'fdv', label: 'FDV', value: hasToken ? formatCurrency(mergedMetrics.fdv) : null },
      { key: 'tokenPrice', label: 'Token Price', value: hasToken ? formatCurrency(mergedMetrics.tokenPrice) : null },
      { key: 'monthlyUsers', label: 'Monthly Users', value: protocol?.monthlyUsers || formatCount(parseUsers(protocol?.monthlyUsers)) },
      { key: 'staking', label: 'Staking TVL', value: formatCurrency(mergedMetrics.staking) },
      { key: 'pool2', label: 'Pool2', value: formatCurrency(mergedMetrics.pool2) },
    ].filter((m) => m.value);

    const order = CATEGORY_METRIC_POLICY[catGroup] || CATEGORY_METRIC_POLICY.default;
    const byKey = new Map(all.map((m) => [m.key, m]));
    const selected = [];
    for (const key of order) {
      const m = byKey.get(key);
      if (m && !selected.find((s) => s.key === m.key)) selected.push(m);
      if (selected.length >= 6) break;
    }
    if (selected.length < 6) {
      for (const m of all) {
        if (!selected.find((s) => s.key === m.key)) selected.push(m);
        if (selected.length >= 6) break;
      }
    }
    return selected.slice(0, 6);
  }, [protocol, mergedMetrics]);

  /* Rating distribution */
  const ratingDistribution = React.useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { if (r.score >= 1 && r.score <= 5) counts[r.score]++; });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((s) => ({ label: s, pct: Math.round((counts[s] / total) * 100) }));
  }, [reviews]);

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length)
    : (protocol?.rating || 0);

  const sec = SECURITY_CONFIG[protocol?.securityLevel] || SECURITY_CONFIG['unaudited'];

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
          >
            {/* ── Close button ── */}
            <div className="sticky top-0 z-10 flex justify-end px-4 pt-4 pb-1 bg-white/80 backdrop-blur-md">
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* ══ PLAY STORE HEADER ══ */}
            <div className="px-5 pb-4 flex items-start gap-4">
              {/* Icon */}
              <div className="w-20 h-20 rounded-[22px] border border-gray-100 shadow-md overflow-hidden shrink-0 bg-white">
                <ToolLogo tool={protocol} />
              </div>
              {/* Name + meta */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-black text-gray-900 leading-tight">{protocol?.name}</h2>
                <p className="text-sm font-semibold text-purple-600 mt-0.5">
                  {protocol?.builder?.name || protocol?.builder?.handle || 'Unknown Developer'}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 font-medium capitalize">{protocol?.category}</span>
                  {protocol?.verified && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                      <ShieldCheck size={9} /> Verified
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${sec.color}`}>
                    {sec.icon} {sec.label}
                  </span>
                </div>
              </div>
            </div>

            {/* ══ STATS BAR (Play Store top metrics) ══ */}
            <div className="mx-5 mb-4 rounded-2xl border border-gray-100 bg-gray-50/70 overflow-hidden">
              <div className="grid grid-cols-4 divide-x divide-gray-100">
                <StatPill
                  label={`${reviews.length || 0} Reviews`}
                  value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  icon={<Star size={10} className="text-yellow-400 fill-yellow-400" />}
                />
                <StatPill
                  label="Security"
                  value={sec.label.split(' ')[0]}
                />
                <StatPill
                  label="Launches"
                  value={protocol?.clickCount > 0 ? formatCount(protocol.clickCount) : '—'}
                  icon={<MousePointerClick size={10} className="text-purple-500" />}
                />
                <StatPill
                  label="Chains"
                  value={mergedMetrics.chains.length > 0 ? mergedMetrics.chains.length : '—'}
                  icon={<Layers size={10} className="text-blue-500" />}
                />
              </div>
            </div>

            {/* ══ LAUNCH APP CTA (Play Store "Install" button) ══ */}
            <div className="px-5 mb-5">
              <a
                href={protocol?.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  fetch(`${API}/tools/${protocol?.id}/click`, { method: 'POST' }).catch(() => {});
                }}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-300/40 text-sm"
              >
                Launch App <ArrowUpRight size={16} />
              </a>
              {protocol?.url && (
                <p className="text-center text-[11px] text-gray-400 mt-1.5">
                  {protocol.url.replace(/^https?:\/\//, '').split('/')[0]}
                </p>
              )}
            </div>

            {/* ══ ABOUT THIS APP ══ */}
            <div className="px-5 mb-5 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-black text-gray-900">About this app</h3>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
              <p className={`text-sm text-gray-600 leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
                {protocol?.description || 'No description available for this protocol yet.'}
              </p>
              {protocol?.description && protocol.description.length > 120 && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="text-sm font-bold text-purple-600 hover:text-purple-500 mt-1 transition-colors"
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              )}

              {/* Tags / chain pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                {protocol?.category && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full border border-gray-200 capitalize">
                    {protocol.category}
                  </span>
                )}
                {mergedMetrics.chains.slice(0, 6).map((chain) => (
                  <span key={chain} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100">
                    {chain}
                  </span>
                ))}
                {mergedMetrics.chains.length > 6 && (
                  <span className="px-3 py-1 bg-gray-50 text-gray-400 text-xs font-semibold rounded-full border border-gray-100">
                    +{mergedMetrics.chains.length - 6} more
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="mt-4 space-y-0 divide-y divide-gray-50">
                {protocol?.url && (
                  <a href={protocol.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 py-2.5 text-sm text-gray-600 hover:text-purple-600 transition-colors group">
                    <Globe size={14} className="text-gray-400 group-hover:text-purple-500" />
                    <span className="truncate">{protocol.url.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-purple-400 shrink-0" />
                  </a>
                )}
                {(protocol?.builder?.twitter || protocol?.twitter) && (
                    <a href={protocol?.builder?.twitter || protocol?.twitter} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 py-2.5 text-sm text-gray-600 hover:text-purple-600 transition-colors group">
                      <Twitter size={14} className="text-gray-400 group-hover:text-purple-500" />
                      <span>@{((protocol?.builder?.handle || (protocol?.builder?.twitter || protocol?.twitter)?.split('/').pop()?.split('?')[0]) || '').replace(/^@+/, '')}</span>
                      <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-purple-400 shrink-0" />
                    </a>
                  )}
                {protocol?.auditLink && (
                  <a href={protocol.auditLink} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 py-2.5 text-sm text-gray-600 hover:text-purple-600 transition-colors group">
                    <ShieldCheck size={14} className="text-gray-400 group-hover:text-purple-500" />
                    <span>Audit Report</span>
                    <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-purple-400 shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {/* ══ ON-CHAIN METRICS GRID ══ */}
            {loading ? (
              <div className="px-5 mb-5 border-t border-gray-100 pt-5">
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : defiMetrics.length > 0 ? (
              <div className="px-5 mb-5 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black text-gray-900">On-Chain Metrics</h3>
                  {mergedMetrics.source && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                      {mergedMetrics.source}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {defiMetrics.map((m) => (
                    <MetricTile key={m.key} label={m.label} value={m.value} subValue={m.subValue} />
                  ))}
                </div>
                {protocol?.slug && (
                    <a
                      href={`https://defillama.com/protocol/${protocol.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-700 transition-all shadow-lg text-sm"
                    >
                      View full data on DefiLlama
                      <ExternalLink size={15} />
                    </a>
                  )}
              </div>
            ) : null}

            {/* ══ RATINGS & REVIEWS (Play Store style) ══ */}
            <div className="px-5 pb-12 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-gray-900">Ratings & Reviews</h3>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  <Edit3 size={11} />
                  Write a Review
                </button>
              </div>

              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <>
                  {/* Rating overview */}
                  <div className="flex gap-5 mb-5">
                    {/* Big score */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <span className="text-5xl font-black text-gray-900 leading-none">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                      <StarRow score={avgRating} size={14} />
                      <span className="text-[11px] text-gray-400 font-semibold mt-1">{reviews.length.toLocaleString()} reviews</span>
                    </div>

                    {/* Distribution bars */}
                    <div className="flex-1 space-y-1.5">
                      {ratingDistribution.map(({ label, pct }) => (
                        <RatingBar key={label} label={label} pct={pct} />
                      ))}
                    </div>
                  </div>

                  {/* Individual reviews */}
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare size={28} className="mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400 font-semibold">No reviews yet</p>
                      <p className="text-xs text-gray-300 mt-0.5">Be the first to review this app!</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {reviews.slice(0, 5).map((review) => (
                        <div key={review._id} className="border-t border-gray-50 pt-4 first:border-0 first:pt-0">
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                              {review.user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-900">{review.user?.name || 'Anonymous'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StarRow score={review.score} size={11} />
                                <span className="text-[11px] text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-gray-600 leading-relaxed mt-1.5">{review.comment}</p>
                              )}
                              {/* Developer reply */}
                              {review.developerReply && (
                                <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <CornerDownRight size={9} /> Developer Response
                                  </p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{review.developerReply}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {reviews.length > 5 && (
                        <button className="w-full py-3 text-sm font-bold text-purple-600 hover:text-purple-500 transition-colors border border-gray-100 rounded-2xl hover:bg-purple-50">
                          See all {reviews.length} reviews
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    {showRatingModal && protocol && (
      <RatingModal
        tool={protocol}
        onClose={() => setShowRatingModal(false)}
        onRatingSubmitted={(newAvg) => {
          setShowRatingModal(false);
        }}
      />
    )}
    </>
  );
}
