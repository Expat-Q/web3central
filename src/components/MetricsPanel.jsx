import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Activity, DollarSign, BarChart3, Layers, Info, Landmark, Globe, ShieldCheck, User, Tag } from 'lucide-react';
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

export default function MetricsPanel({ protocol, isOpen, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (isOpen && protocol?.slug) {
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
  }, [isOpen, protocol]);

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
      chains: (data?.chains?.length ? data.chains : fallback?.chains) || [],
      source: data ? 'DefiLlama (live)' : fallback?.lastUpdated ? 'Web3Central snapshot' : null
    };
  }, [data, protocol]);

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
                  {error && (
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

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <MetricCard
                      label="TVL"
                      value={formatCurrency(mergedMetrics.tvl)}
                      subValue={formatPercent(mergedMetrics.change7d)}
                      icon={<Landmark size={18} />}
                      color="from-purple-500 to-indigo-600"
                    />
                    <MetricCard
                      label="24h Volume"
                      value={formatCurrency(mergedMetrics.volume24h)}
                      icon={<Activity size={18} />}
                      color="from-cyan-500 to-blue-600"
                    />
                    <MetricCard
                      label="Market Cap"
                      value={formatCurrency(mergedMetrics.mcap)}
                      icon={<DollarSign size={18} />}
                      color="from-emerald-500 to-teal-600"
                    />
                    <MetricCard
                      label="FDV"
                      value={formatCurrency(mergedMetrics.fdv)}
                      icon={<BarChart3 size={18} />}
                      color="from-orange-500 to-amber-600"
                    />
                  </div>

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
