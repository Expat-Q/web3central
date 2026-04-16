import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Activity, DollarSign, BarChart3, Layers, Info, Landmark, Globe, ShieldCheck, User, Tag, Coins, Users, Star, MessageSquare, Twitter } from 'lucide-react';
import ToolLogo from './ToolLogo';

const metricsCache = new Map();

const MetricCard = ({ label, value, icon, subValue, color }) => (
  <div className="bg-white/50 backdrop-blur-sm border border-white/60 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm`}>
        {icon}
      </div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{label}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-black text-gray-900 leading-none">
        {value || <span className="text-xs font-bold text-gray-300 inline-block px-2 py-0.5 bg-gray-100 rounded-full">Not Available</span>}
      </span>
      {subValue && (
        <span className={`text-xs font-bold mt-1 ${subValue.startsWith('+') ? 'text-emerald-500' : subValue.startsWith('-') ? 'text-rose-500' : 'text-gray-400'}`}>
          {subValue}
        </span>
      )}
    </div>
  </div>
);

const DetailRow = ({ icon, label, value, href }) => {
  if (!value) return null;

  const content = (
    <>
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">{label}</span>
      <span className="ml-auto text-sm font-semibold text-gray-800 truncate max-w-[55%] text-right">{value}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
      >
        {content}
      </a>
    );
  }

  return <div className="flex items-center gap-2 py-2 px-2 -mx-2">{content}</div>;
};

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

const CATEGORY_ALIASES = {
  dex: 'trading',
  perps: 'trading',
  web3chat: 'trading',
  trading: 'trading',
  interoperability: 'bridges',
  bridge: 'bridges',
  bridges: 'bridges',
  communitytools: 'community',
  community: 'community',
  security: 'security',
  analytics: 'analytics',
  infofi: 'analytics',
  researchfiles: 'analytics',
  wallets: 'wallets',
  wallet: 'wallets',
  nft: 'nft',
  defi: 'defi',
  staking: 'staking',
  rwa: 'rwa',
  l2: 'l2',
  onchainautonomy: 'onchain',
  vibecoding: 'community',
};

const CATEGORY_METRIC_POLICY = {
  trading: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating', 'reviews'],
  bridges: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating'],
  defi: ['tvl', 'volume24h', 'staking', 'pool2', 'tokenPrice', 'mcap', 'fdv', 'chains', 'rating'],
  staking: ['staking', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'pool2', 'chains', 'rating'],
  wallets: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'rating', 'chains', 'reviews'],
  nft: ['volume24h', 'tvl', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'rating', 'chains', 'reviews'],
  analytics: ['monthlyUsers', 'rating', 'reviews', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  security: ['monthlyUsers', 'rating', 'reviews', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  community: ['monthlyUsers', 'rating', 'reviews', 'chains', 'tokenPrice', 'mcap', 'fdv'],
  l2: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating'],
  rwa: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating'],
  onchain: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'chains', 'monthlyUsers', 'rating'],
  default: ['tvl', 'volume24h', 'tokenPrice', 'mcap', 'fdv', 'monthlyUsers', 'rating', 'reviews', 'chains']
};

const normalizeCategory = (category = '') => String(category || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

export default function MetricsPanel({ protocol, isOpen, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const shouldFetchLiveMetrics = React.useMemo(() => {
    const category = normalizeCategory(protocol?.category);
    const group = CATEGORY_ALIASES[category] || 'default';
    const hasSlug = Boolean(protocol?.slug);
    if (!hasSlug) return false;

    const offchainLike = ['security', 'analytics', 'community'].includes(group);

    return !offchainLike;
  }, [protocol]);

  React.useEffect(() => {
    if (isOpen && shouldFetchLiveMetrics) {
      if (metricsCache.has(protocol.slug)) {
        setData(metricsCache.get(protocol.slug));
        setError(null);
        return;
      }
      fetchMetrics();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, protocol, shouldFetchLiveMetrics]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
      const res = await fetch(`${API}/defi/protocol/${protocol.slug}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        metricsCache.set(protocol.slug, result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error("Metrics fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return null;
    if (Number(val) === 0) return null;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  const formatPercent = (val) => {
    if (val === null || val === undefined) return null;
    if (Number(val) === 0) return null;
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const mergedMetrics = React.useMemo(() => {
    const fallback = protocol?.metrics || {};
    return {
      tvl: data?.tvl ?? fallback?.tvl ?? null,
      change7d: data?.change_7d ?? fallback?.tvlChange7d ?? null,
      volume24h: data?.volume24h ?? fallback?.volume24h ?? null,
      mcap: data?.mcap ?? fallback?.mcap ?? null,
      fdv: data?.fdv ?? fallback?.fdv ?? null,
      tokenPrice: data?.tokenPrice ?? fallback?.tokenPrice ?? null,
      staking: data?.staking ?? fallback?.staking ?? null,
      pool2: data?.pool2 ?? fallback?.pool2 ?? null,
      chains: (data?.chains?.length ? data.chains : fallback?.chains) || [],
      source: data ? 'DefiLlama (live)' : fallback?.lastUpdated ? 'Web3Central snapshot' : null
    };
  }, [data, protocol]);

  const displayedMetrics = React.useMemo(() => {
    const normalizedCategory = normalizeCategory(protocol?.category);
    const categoryGroup = CATEGORY_ALIASES[normalizedCategory] || 'default';

    const hasToken = Number(mergedMetrics.mcap) > 0 || Number(mergedMetrics.fdv) > 0 || Number(mergedMetrics.tokenPrice) > 0 || Boolean(protocol?.geckoId);
    const monthlyUsersNum = parseUsers(protocol?.monthlyUsers);
    const ratingNum = Number(protocol?.rating || 0);
    const reviewsNum = Number(protocol?.reviews || protocol?.ratingCount || 0);
    const chainsCount = Array.isArray(mergedMetrics.chains) ? mergedMetrics.chains.length : 0;

    const allCandidates = [
      {
        key: 'tvl',
        label: 'TVL',
        value: formatCurrency(mergedMetrics.tvl),
        subValue: formatPercent(mergedMetrics.change7d),
        icon: <Landmark size={18} />,
        color: 'from-purple-500 to-indigo-600'
      },
      {
        key: 'volume24h',
        label: '24h Volume',
        value: formatCurrency(mergedMetrics.volume24h),
        icon: <Activity size={18} />,
        color: 'from-cyan-500 to-blue-600'
      },
      {
        key: 'mcap',
        label: 'Market Cap',
        value: hasToken ? formatCurrency(mergedMetrics.mcap) : null,
        icon: <DollarSign size={18} />,
        color: 'from-emerald-500 to-teal-600'
      },
      {
        key: 'fdv',
        label: 'FDV',
        value: hasToken ? formatCurrency(mergedMetrics.fdv) : null,
        icon: <BarChart3 size={18} />,
        color: 'from-orange-500 to-amber-600'
      },
      {
        key: 'tokenPrice',
        label: 'Token Price',
        value: hasToken ? formatCurrency(mergedMetrics.tokenPrice) : null,
        icon: <Coins size={18} />,
        color: 'from-fuchsia-500 to-purple-600'
      },
      {
        key: 'monthlyUsers',
        label: 'Monthly Users',
        value: protocol?.monthlyUsers || formatCount(monthlyUsersNum),
        icon: <Users size={18} />,
        color: 'from-sky-500 to-indigo-600'
      },
      {
        key: 'rating',
        label: 'Rating',
        value: ratingNum > 0 ? `${ratingNum.toFixed(1)} / 5` : null,
        icon: <Star size={18} />,
        color: 'from-amber-500 to-yellow-600'
      },
      {
        key: 'reviews',
        label: 'Reviews',
        value: reviewsNum > 0 ? formatCount(reviewsNum) : null,
        icon: <MessageSquare size={18} />,
        color: 'from-violet-500 to-purple-600'
      },
      {
        key: 'chains',
        label: 'Chains',
        value: chainsCount > 0 ? formatCount(chainsCount) : null,
        icon: <Layers size={18} />,
        color: 'from-slate-500 to-gray-700'
      },
      {
        key: 'staking',
        label: 'Staking TVL',
        value: formatCurrency(mergedMetrics.staking),
        icon: <Landmark size={18} />,
        color: 'from-indigo-500 to-blue-700'
      },
      {
        key: 'pool2',
        label: 'Pool2',
        value: formatCurrency(mergedMetrics.pool2),
        icon: <Activity size={18} />,
        color: 'from-emerald-500 to-green-700'
      }
    ].filter((m) => m.value);

    const preferredOrder = CATEGORY_METRIC_POLICY[categoryGroup] || CATEGORY_METRIC_POLICY.default;

    const byKey = new Map(allCandidates.map((m) => [m.key, m]));
    const selected = [];

    for (const key of preferredOrder) {
      const metric = byKey.get(key);
      if (metric && !selected.find((m) => m.key === metric.key)) {
        selected.push(metric);
      }
      if (selected.length >= 4) break;
    }

    if (selected.length < 4) {
      for (const metric of allCandidates) {
        if (!selected.find((m) => m.key === metric.key)) {
          selected.push(metric);
        }
        if (selected.length >= 4) break;
      }
    }

    return selected.slice(0, 4);
  }, [protocol, mergedMetrics]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-lg bg-gray-50/95 backdrop-blur-2xl border-l border-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/40 backdrop-blur-md border-b border-gray-100 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-1">
                  <ToolLogo tool={protocol} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">{protocol?.name}</h3>
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">{protocol?.category}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {loading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-32 bg-gray-200/50 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {error && shouldFetchLiveMetrics && (
                    <div className="text-center py-4 px-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <Info size={18} className="mx-auto mb-2 text-amber-600" />
                      <p className="font-bold text-amber-900 text-sm">Live DefiLlama data unavailable</p>
                      <p className="text-xs text-amber-700 mt-1">Showing available app details and fallback metrics.</p>
                    </div>
                  )}

                  {/* App Details */}
                  <div className="bg-white/60 backdrop-blur-sm border border-white/70 p-6 rounded-[2rem] shadow-sm">
                    <h4 className="text-sm font-black text-gray-900 mb-2 flex items-center gap-2">
                      <Info size={16} className="text-purple-500" /> App Details
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {protocol?.description || data?.description || 'No description available for this protocol yet.'}
                    </p>

                    <div className="border-t border-gray-100 pt-2">
                      <DetailRow icon={<Globe size={14} />} label="Website" value={protocol?.url?.replace(/^https?:\/\//, '')} href={protocol?.url} />
                      {(protocol?.builder?.twitter || protocol?.twitter) && (
                        <DetailRow 
                          icon={<Twitter size={14} />} 
                          label="X Profile" 
                          value={protocol?.builder?.handle || (protocol?.builder?.twitter || protocol?.twitter)?.split('/').pop()?.split('?')[0]} 
                          href={protocol?.builder?.twitter || protocol?.twitter} 
                        />
                      )}
                      <DetailRow icon={<Tag size={14} />} label="Category" value={protocol?.category} />
                      <DetailRow icon={<User size={14} />} label="Builder" value={protocol?.builder?.name || protocol?.builder?.handle} />
                      {protocol?.verified && (
                        <div className="flex items-center gap-2 py-2 px-2 -mx-2">
                          <span className="text-emerald-500"><ShieldCheck size={14} /></span>
                          <span className="text-xs font-bold uppercase tracking-tight text-emerald-700">Verified Listing</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics Grid (conditional, max 4) */}
                  {displayedMetrics.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {displayedMetrics.map((metric) => (
                        <MetricCard
                          key={metric.key}
                          label={metric.label}
                          value={metric.value}
                          subValue={metric.subValue}
                          icon={metric.icon}
                          color={metric.color}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 bg-gray-100/70 rounded-2xl border border-gray-200">
                      <p className="text-sm font-semibold text-gray-500">No live metrics available for this app yet.</p>
                    </div>
                  )}

                  {mergedMetrics.source && (
                    <p className="text-[11px] font-bold text-gray-400 -mt-4">Source: {mergedMetrics.source}</p>
                  )}

                  {/* Chains Section */}
                  <div className="bg-white/50 backdrop-blur-sm border border-white/60 p-6 rounded-[2rem] shadow-sm">
                    <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                      <Layers size={16} className="text-purple-500" /> Supported Chains
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {mergedMetrics.chains?.length > 0 ? (
                        mergedMetrics.chains.map(chain => (
                          <span key={chain} className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
                            {chain}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Information not available</span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-4 pb-12">
                    {protocol?.slug ? (
                      <a
                        href={`https://defillama.com/protocol/${protocol.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-purple-600 transition-all shadow-xl shadow-gray-200"
                      >
                        View on DefiLlama <ExternalLink size={16} />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-2 w-full py-4 bg-gray-200 text-gray-400 font-bold rounded-2xl cursor-not-allowed"
                      >
                        DefiLlama Link Unavailable
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
