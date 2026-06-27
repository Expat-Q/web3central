import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ExternalLink, Activity, DollarSign, BarChart3, Layers, Info,
  Landmark, Globe, ShieldCheck, User, Tag, Coins, Users, Star,
  MessageSquare, Twitter, MousePointerClick, CornerDownRight,
  Shield, ChevronRight, ArrowUpRight, Edit3, Volume2, Gem,
  MessageCircle, Send
} from 'lucide-react';
import ToolLogo from './ToolLogo';
import RatingModal from './RatingModal';
import { useAuth } from '../context/AuthContext';
import { useMetrics } from '../context/MetricsContext';
import SafeLink from './SafeLink';
import SentimentMeter from './SentimentMeter';
import DevPulse from './DevPulse';

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
  staking: 'staking', rwa: 'rwa', l2: 'l2', onchainautonomy: 'onchain',
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
  unaudited: { label: 'Audited',         color: 'text-emerald-700 bg-emerald-50 border-emerald-200',         icon: '✅' },
  community: { label: 'Community Review',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: '🟡' },
  audited:   { label: 'Audited',           color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: '🟢' },
  verified:  { label: 'Verified',          color: 'text-purple-700 bg-purple-50 border-purple-200', icon: '✅' },
};

/* ─── Star Row ─── */
const ReviewAvatar = ({ user, isZKVerified }) => {
  const [hasError, setHasError] = React.useState(false);
  
  if (user?.avatarUrl && !hasError) {
    return (
      <img 
        src={user.avatarUrl} 
        alt={user.name} 
        className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-100 shadow-sm"
        onError={() => setHasError(true)}
      />
    );
  }
  
  if (isZKVerified) {
    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-indigo-200 border border-indigo-500/20 shadow-md shrink-0">
        <Shield size={16} className="text-indigo-300" />
      </div>
    );
  }
  
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
      {user?.name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
};

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

/* ─── BagsApp Integration UI ─── */
const BagsAppReputation = ({ protocol }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-4 text-white shadow-xl mb-6 relative overflow-hidden group">
      {/* Coming Soon overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
        <div className="flex items-center gap-2 bg-amber-500/90 text-black text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">
          <span className="w-2 h-2 rounded-full bg-black/30 animate-pulse" />
          Coming Soon
        </div>
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Gem size={40} />
      </div>
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Gem size={16} className="text-indigo-300" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Reputation Market</span>
          </div>
          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/20">
            via BagsApp
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key Price</p>
            <p className="text-xl font-black">— ETH</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Social Rank</p>
            <p className="text-xl font-black">#—</p>
          </div>
        </div>

        <button disabled className="w-full py-2 bg-indigo-600/50 rounded-xl text-xs font-black cursor-not-allowed opacity-60">
          Trade Reputation Keys
        </button>
      </div>
    </div>
  );
};

export default function MetricsPanel({ protocol, isOpen, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [reviews, setReviews] = React.useState([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [inspectReview, setInspectReview] = React.useState(null);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const { user } = useAuth();
  const { clickCounts } = useMetrics();
  const audioRef = React.useRef(null);

  const speakDescription = async () => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      // Build a dynamic summary for the protocol
      const tvl = mergedMetrics.tvl ? formatCurrency(mergedMetrics.tvl) : "";
      const vol = mergedMetrics.volume24h ? formatCurrency(mergedMetrics.volume24h) : "";
      const chainCount = mergedMetrics.chains.length;
      
      let summaryText = `This is ${protocol?.name}. ${protocol?.description || ""}`;
      if (tvl || vol) {
        summaryText += ` Currently, it has ${tvl ? "a Total Value Locked of " + tvl : ""}${tvl && vol ? " and " : ""}${vol ? "a 24-hour trading volume of " + vol : ""}.`;
      }
      if (chainCount > 0) {
        summaryText += ` It is available on ${chainCount} ${chainCount === 1 ? 'chain' : 'chains'}, including ${mergedMetrics.chains.slice(0, 3).join(', ')}.`;
      }

      const res = await fetch(`${API}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: summaryText,
          voiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel (Friendly Assistant)
        })
      });
      
      if (!res.ok) throw new Error('ElevenLabs TTS failed');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.warn('ElevenLabs fallback:', err);
      // Fallback text
      const fallbackText = `${protocol?.name}. ${protocol?.description || ""}`;
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentClickCount = React.useMemo(() => {
    return clickCounts[protocol?.id] !== undefined ? clickCounts[protocol.id] : (protocol?.clickCount || 0);
  }, [clickCounts, protocol]);

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
                <h2 className="text-xl font-black text-gray-900 leading-tight flex items-center gap-1.5">
                  {protocol?.name}
                  {protocol?.verified && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 shrink-0">
                      <ShieldCheck size={9} /> Verified
                    </span>
                  )}
                </h2>
                <p className="text-sm font-semibold text-purple-600 mt-0.5">
                  {protocol?.builder?.name || protocol?.builder?.handle || 'Unknown Developer'}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 font-medium capitalize">{protocol?.category}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${protocol?.isTestnet ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>
                    {protocol?.isTestnet ? '🧪 Testnet' : '🌐 Mainnet'}
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
                  label="Network"
                  value={protocol?.isTestnet ? 'Testnet' : 'Mainnet'}
                />
                <StatPill
                  label="Launches"
                  value={currentClickCount > 0 ? formatCount(currentClickCount) : '—'}
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
              <SafeLink
                url={protocol?.url}
                verified={false}
                hideDomain={true}
                toolId={protocol?.id}
                currentCount={currentClickCount}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-300/40 text-sm"
              >
                Launch App <ArrowUpRight size={16} />
              </SafeLink>
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
                <button 
                  onClick={speakDescription}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    isSpeaking ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  }`}
                >
                  <Volume2 size={12} className={isSpeaking ? "animate-pulse" : ""} />
                  {isSpeaking ? "Speaking..." : "Listen AI Voice"}
                </button>
              </div>
              
              <BagsAppReputation protocol={protocol} />

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
                {protocol?.builder?.discord && (
                  <a href={protocol.builder.discord.startsWith('http') ? protocol.builder.discord : `https://discord.gg/${protocol.builder.discord}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 py-2.5 text-sm text-gray-600 hover:text-purple-600 transition-colors group">
                    <MessageCircle size={14} className="text-gray-400 group-hover:text-purple-500" />
                    <span>Discord</span>
                    <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-purple-400 shrink-0" />
                  </a>
                )}
                {protocol?.builder?.telegram && (
                  <a href={protocol.builder.telegram.startsWith('http') ? protocol.builder.telegram : `https://t.me/${protocol.builder.telegram.replace(/^@/, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 py-2.5 text-sm text-gray-600 hover:text-purple-600 transition-colors group">
                    <Send size={14} className="text-gray-400 group-hover:text-purple-500" />
                    <span>Telegram</span>
                    <ExternalLink size={11} className="ml-auto text-gray-300 group-hover:text-purple-400 shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {/* ══ GITHUB DEV PULSE ══ */}
            {protocol?.githubRepo && (
              <div className="px-5 mb-5 border-t border-gray-100 pt-5">
                <DevPulse githubRepo={protocol.githubRepo} githubCommits={protocol.githubCommits} />
              </div>
            )}

            {/* ══ SENTIMENT METER ══ */}
            <div className="border-t border-gray-100">
              <SentimentMeter toolId={protocol?.id} initialSentiment={protocol?.sentiment} />
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
                            <ReviewAvatar user={review.user} isZKVerified={review.isZKVerified} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                  {review.user?.name || 'Anonymous'}
                                  {review.isZKVerified && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm">
                                      ZK-Proof Verified 🛡️
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StarRow score={review.score} size={11} />
                                <span className="text-[11px] text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-gray-600 leading-relaxed mt-1.5">{review.comment}</p>
                              )}
                              {review.isZKVerified && (
                                <button 
                                  onClick={() => setInspectReview(review)}
                                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-600 hover:text-purple-500 transition-colors bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-100"
                                >
                                  Inspect ZK Proof <ChevronRight size={10} />
                                </button>
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
          fetchReviews(); // Refetch reviews immediately to show the new verified ZK rating!
        }}
      />
    )}
    {inspectReview && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white border border-gray-150 rounded-3xl max-w-lg w-full p-8 relative overflow-y-auto max-h-[85vh] text-left shadow-2xl"
        >
          <button
            onClick={() => setInspectReview(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 leading-tight">ZK Proof Certificate</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">On-Chain Identity Verified</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-widest mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verification Status: Success
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
                This review is cryptographically proven to be authored by a real Ethereum wallet that has interacted with the protocol's official smart contracts. The author's identity is completely verified and shielded using Zero-Knowledge zk-SNARKs.
              </p>
            </div>

            {/* Nullifier Hash */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nullifier Hash (Double-Vote Prevention)</p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                <code className="text-xs text-gray-800 font-mono truncate flex-1 font-bold">{inspectReview.nullifierHash}</code>
              </div>
            </div>

            {/* Signed message */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Signed Message Plaintext</p>
              <pre className="p-3 bg-gray-50 border border-gray-155 rounded-xl text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed font-semibold">
                {inspectReview.signedMessage}
              </pre>
            </div>

            {/* Hex Signature */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cryptographic Wallet Signature (Gasless)</p>
              <div className="p-3 bg-gray-50 border border-gray-155 rounded-xl">
                <code className="text-[10px] text-gray-600 font-mono break-all leading-normal block font-bold">{inspectReview.signature}</code>
              </div>
            </div>

            {/* Zama FHE Encrypted Score */}
            {inspectReview.fheCiphertext && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" /> Zama FHE Encrypted Score
                </p>
                <div className="p-4 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl space-y-2">
                  <p className="text-[10px] text-fuchsia-700 font-semibold leading-relaxed">
                    The rating score has been encrypted using Zama's Fully Homomorphic Encryption (TFHE-rs) scheme. The encrypted ciphertext can be aggregated on-chain without ever revealing individual scores.
                  </p>
                  <div className="flex items-center gap-2 p-2.5 bg-fuchsia-50 border border-fuchsia-100 rounded-lg">
                    <code className="text-[10px] text-fuchsia-800 font-mono truncate flex-1 font-bold">{inspectReview.fheCiphertext}</code>
                  </div>
                </div>
              </div>
            )}

            {/* 0G Labs Decentralized Storage */}
            {inspectReview.ogLabsTxHash && (
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> 0G Labs Storage Transaction
                </p>
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-2">
                  <p className="text-[10px] text-cyan-700 font-semibold leading-relaxed">
                    The proof certificate and encrypted score are permanently stored on the 0G decentralized storage network for tamper-proof auditability.
                  </p>
                  <div className="flex items-center gap-2 p-2.5 bg-cyan-50 border border-cyan-100 rounded-lg">
                    <code className="text-[10px] text-cyan-800 font-mono truncate flex-1 font-bold">{inspectReview.ogLabsTxHash}</code>
                  </div>
                </div>
              </div>
            )}

            {/* ZK Groth16 Parameters */}
            {inspectReview.zkProof && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={10} className="text-purple-500 animate-pulse" /> ZK-SNARK Witness Parameters (Groth16 Curves)
                </p>
                <div className="grid grid-cols-1 gap-2 text-[10px] font-mono text-gray-400">
                  <div className="p-3 bg-gray-50 border border-gray-155 rounded-xl space-y-1.5 text-gray-700 shadow-sm">
                    <p className="font-bold text-purple-600 uppercase tracking-wider text-[8px]">pi_a (G1 Curve Point)</p>
                    <div className="truncate text-gray-800 font-mono text-[11px]">X: {inspectReview.zkProof?.proof?.pi_a?.[0]}</div>
                    <div className="truncate text-gray-800 font-mono text-[11px]">Y: {inspectReview.zkProof?.proof?.pi_a?.[1]}</div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-155 rounded-xl space-y-1.5 text-gray-700 shadow-sm">
                    <p className="font-bold text-purple-600 uppercase tracking-wider text-[8px]">pi_b (G2 Curve Ext Point)</p>
                    <div className="truncate text-gray-800 font-mono text-[11px]">X.0: {inspectReview.zkProof?.proof?.pi_b?.[0]?.[0]}</div>
                    <div className="truncate text-gray-800 font-mono text-[11px]">Y.0: {inspectReview.zkProof?.proof?.pi_b?.[1]?.[0]}</div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-155 rounded-xl space-y-1.5 text-gray-700 shadow-sm">
                    <p className="font-bold text-purple-600 uppercase tracking-wider text-[8px]">pi_c (G1 Curve Point)</p>
                    <div className="truncate text-gray-800 font-mono text-[11px]">X: {inspectReview.zkProof?.proof?.pi_c?.[0]}</div>
                    <div className="truncate text-gray-800 font-mono text-[11px]">Y: {inspectReview.zkProof?.proof?.pi_c?.[1]}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setInspectReview(null)}
            className="w-full mt-6 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all text-sm"
          >
            Close Certificate
          </button>
        </motion.div>
      </div>
    )}
    </>
  );
}
