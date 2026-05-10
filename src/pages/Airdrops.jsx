import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Search, ExternalLink, Gift, Sparkles, X,
  Clock, DollarSign, Shield, CheckCircle, AlertCircle,
  Star, Zap, Users, TrendingUp, ArrowRight, Filter, Activity
} from 'lucide-react';
import { fetchAirdrops } from '../services/apiService';

/* ── Status config ─────────────────────────────────── */
const STATUS_CONFIG = {
  CONFIRMED:        { label: 'Confirmed',        bg: 'bg-emerald-50',  text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle },
  POTENTIAL:        { label: 'Potential',         bg: 'bg-amber-50',    text: 'text-amber-600',   border: 'border-amber-200',   icon: Star },
  VERIFICATION:     { label: 'Verification',      bg: 'bg-blue-50',     text: 'text-blue-600',    border: 'border-blue-200',    icon: Shield },
  REWARD_AVAILABLE: { label: 'Claimable',          bg: 'bg-purple-50',   text: 'text-purple-600',  border: 'border-purple-200',  icon: Gift },
  DISTRIBUTED:      { label: 'Distributed',        bg: 'bg-gray-50',     text: 'text-gray-500',    border: 'border-gray-200',    icon: CheckCircle },
  SNAPSHOT:         { label: 'Snapshot',           bg: 'bg-indigo-50',   text: 'text-indigo-600',  border: 'border-indigo-200',  icon: AlertCircle },
};

const getStatus = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.POTENTIAL;

/* ── Format helpers ────────────────────────────────── */
const fmtRaise = (v) => {
  if (!v) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,$]/g, ''));
  if (isNaN(n) || n <= 0) return null;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};

const fmtTime = (mins) => {
  if (!mins || mins <= 0) return null;
  if (mins >= 60) return `${Math.round(mins / 60)}h`;
  return `${mins} min`;
};

const fmtFollowers = (n) => {
  if (!n) return null;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
};

/* ── Status Badge ──────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = getStatus(status);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

/* ── Rating Bar ────────────────────────────────────── */
const RatingBar = ({ rating }) => {
  if (!rating && rating !== 0) return null;
  const pct = Math.min(100, Math.max(0, rating));
  const color = pct >= 70 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-grow h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-black text-gray-500">{rating}</span>
    </div>
  );
};

/* ── VC Fund Logo Stack ────────────────────────────── */
const FundStack = ({ funds }) => {
  if (!funds?.length) return null;
  const shown = funds.slice(0, 5);
  const extra = funds.length - shown.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((f, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-100 shadow-sm ${
              f.tier === 1 ? 'ring-1 ring-amber-300' : ''
            }`}
            title={`${f.name}${f.tier ? ` (Tier ${f.tier})` : ''}${f.isLead ? ' — Lead' : ''}`}
          >
            {f.logo ? (
              <img src={f.logo} alt={f.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-gray-400">
                {f.name?.charAt(0)}
              </div>
            )}
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-1.5 text-[9px] font-bold text-gray-400">+{extra}</span>
      )}
      <span className="ml-2 text-[9px] font-bold text-gray-500 truncate max-w-[100px]">
        {shown[0]?.name}{shown.length > 1 ? ` +${funds.length - 1}` : ''}
      </span>
    </div>
  );
};

/* ── Airdrop Card ──────────────────────────────────── */
const AirdropCard = ({ activity, index }) => {
  const cfg = getStatus(activity.status);
  const raised = fmtRaise(activity.totalRaise);
  const time = fmtTime(activity.totalTimeMinutes);
  const hasActiveTasks = !activity.noActiveTask;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      className={`group relative bg-white border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 ${cfg.border} hover:border-purple-300`}
    >
      {/* Badges row */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        {hasActiveTasks && (
          <span className="flex items-center gap-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm">
            <Activity size={8} /> Active
          </span>
        )}
        {activity.reward && (
          <span className="flex items-center gap-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm">
            <Gift size={8} /> {activity.reward}
          </span>
        )}
      </div>

      {/* Header: Logo + Name */}
      <div className="p-5 pb-0">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 overflow-hidden shadow-sm shrink-0">
            {activity.logo ? (
              <img
                src={activity.logo}
                alt={activity.name}
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.fallback-icon')?.classList.remove('hidden'); }}
              />
            ) : null}
            <div className={`fallback-icon ${activity.logo ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-500 font-black text-base`}>
              {activity.name?.charAt(0)}
            </div>
          </div>
          <div className="flex-grow min-w-0 pr-16">
            <h3 className="font-bold text-[15px] text-gray-900 truncate group-hover:text-purple-700 transition-colors">
              {activity.name}
            </h3>
            {activity.symbol && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                ${activity.symbol}
              </span>
            )}
          </div>
        </div>

        {/* Status + Rating */}
        <div className="flex items-center gap-3 mb-4">
          <StatusBadge status={activity.status} />
          {activity.rating && (
            <div className="flex-grow">
              <RatingBar rating={activity.rating} />
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl px-2 py-2 text-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Raised</p>
            <p className="text-[11px] font-black text-gray-900">{raised || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-2 py-2 text-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Cost</p>
            <p className="text-[11px] font-black text-gray-900">
              {activity.totalCost > 0 ? `$${activity.totalCost}` : 'Free'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl px-2 py-2 text-center">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time</p>
            <p className="text-[11px] font-black text-gray-900">{time || '—'}</p>
          </div>
        </div>

        {/* Activity types */}
        {activity.activityTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {activity.activityTypes.slice(0, 4).map((t, i) => (
              <span key={i} className="text-[8px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {t}
              </span>
            ))}
            {activity.activityTypes.length > 4 && (
              <span className="text-[8px] font-bold text-gray-400 px-1 py-0.5">
                +{activity.activityTypes.length - 4}
              </span>
            )}
          </div>
        )}

        {/* VC Backers */}
        {activity.funds?.length > 0 && (
          <div className="mb-3 py-2 px-2.5 bg-gradient-to-r from-amber-50/60 to-orange-50/40 rounded-xl border border-amber-100/80">
            <div className="flex items-center gap-1 mb-1.5">
              <Users size={9} className="text-amber-500" />
              <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Backed by</span>
            </div>
            <FundStack funds={activity.funds} />
          </div>
        )}

        {/* Twitter Score */}
        {activity.twitterScore > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-[10px] font-bold text-gray-600">
                Score: {Math.round(activity.twitterScore).toLocaleString()}
              </span>
            </div>
            {activity.followersCount > 0 && (
              <span className="text-[10px] text-gray-400">
                · {fmtFollowers(activity.followersCount)} followers
              </span>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <a
          href={activity.claimUrl || activity.checkUrl || activity.exploreUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
        >
          {activity.status === 'REWARD_AVAILABLE' ? 'Claim Reward' :
           activity.status === 'DISTRIBUTED' ? 'View Details' :
           activity.status === 'VERIFICATION' ? 'Check Status' :
           hasActiveTasks ? 'Start Tasks' :
           'Explore Activity'}
          <ExternalLink size={12} />
        </a>
      </div>
    </motion.div>
  );
};

/* ── STATUS FILTER PILLS ───────────────────────────── */
const STATUS_FILTERS = [
  { key: 'all',              label: 'All' },
  { key: 'CONFIRMED',        label: 'Confirmed' },
  { key: 'POTENTIAL',        label: 'Potential' },
  { key: 'VERIFICATION',     label: 'Verification' },
  { key: 'REWARD_AVAILABLE', label: 'Claimable' },
  { key: 'SNAPSHOT',         label: 'Snapshot' },
  { key: 'DISTRIBUTED',      label: 'Distributed' },
];

/* ── MAIN PAGE ─────────────────────────────────────── */
export default function Airdrops() {
  const [airdrops, setAirdrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [source, setSource] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchAirdrops();
        setAirdrops(res.data || []);
        setSource(res.source || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...airdrops];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.symbol?.toLowerCase().includes(q) ||
        a.activityTypes?.some(t => t.toLowerCase().includes(q)) ||
        a.funds?.some(f => f.name?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [airdrops, statusFilter, searchQuery]);

  // Count by status
  const statusCounts = useMemo(() => {
    const counts = { all: airdrops.length };
    airdrops.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  }, [airdrops]);

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/apps" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-gray-900">Airdrop Tracker</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {filtered.length} activit{filtered.length !== 1 ? 'ies' : 'y'} tracked
                {statusFilter !== 'all' && (
                  <span className="ml-1 text-purple-500 font-bold">
                    · {getStatus(statusFilter).label}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6 md:p-8 mb-8 overflow-hidden text-white"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl"
              >
                <Gift size={28} />
              </motion.div>
            </div>
            <div className="flex-grow">
              <h2 className="text-xl md:text-2xl font-black mb-2">Drop Hunting Dashboard</h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-2xl">
                Track <strong className="text-white">confirmed and potential airdrops</strong> across the crypto ecosystem.
                Complete tasks, interact with protocols, and claim your rewards.
              </p>
            </div>
            <a
              href="https://cryptorank.io/drophunting"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-[10px] font-bold px-3 py-2 rounded-xl border border-white/20 shrink-0 hover:bg-white/25 transition-colors"
            >
              <Sparkles size={12} />
              Powered by CryptoRank
            </a>
          </div>
        </motion.div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {STATUS_FILTERS.map(sf => {
            const count = statusCounts[sf.key] || 0;
            const isActive = statusFilter === sf.key;
            return (
              <button
                key={sf.key}
                onClick={() => setStatusFilter(sf.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                }`}
              >
                {sf.label}
                {count > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, symbol, task type, or VC backer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-50 outline-none transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">Failed to load airdrop data.</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="font-bold text-gray-900 mb-1">No airdrops found</p>
            <p className="text-sm text-gray-400">Try a different search or status filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((activity, i) => (
              <AirdropCard key={activity.id || i} activity={activity} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
