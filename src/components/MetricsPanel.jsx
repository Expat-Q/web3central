import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Activity, DollarSign, BarChart3, TrendingUp, Layers, Info, Landmark } from 'lucide-react';

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

export default function MetricsPanel({ protocol, isOpen, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (isOpen && protocol?.slug) {
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
    if (!val) return null;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  const formatPercent = (val) => {
    if (!val) return null;
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

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
                  <img src={protocol?.logo} alt={protocol?.name} className="w-full h-full object-contain" />
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
              ) : error ? (
                <div className="text-center py-12 px-6 bg-rose-50 rounded-3xl border border-rose-100">
                  <Info size={32} className="mx-auto mb-3 text-rose-500" />
                  <p className="font-bold text-rose-900">Protocol not found on DefiLlama</p>
                  <p className="text-sm text-rose-600 mt-1">We only show on-chain metrics for protocols tracked by DefiLlama.</p>
                </div>
              ) : (
                <>
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <MetricCard
                      label="TVL"
                      value={formatCurrency(data?.tvl)}
                      subValue={formatPercent(data?.change_7d)}
                      icon={<Landmark size={18} />}
                      color="from-purple-500 to-indigo-600"
                    />
                    <MetricCard
                      label="24h Volume"
                      value={formatCurrency(data?.volume24h)}
                      icon={<Activity size={18} />}
                      color="from-cyan-500 to-blue-600"
                    />
                    <MetricCard
                      label="Market Cap"
                      value={formatCurrency(data?.mcap)}
                      icon={<DollarSign size={18} />}
                      color="from-emerald-500 to-teal-600"
                    />
                    <MetricCard
                      label="FDV"
                      value={formatCurrency(data?.fdv)}
                      icon={<BarChart3 size={18} />}
                      color="from-orange-500 to-amber-600"
                    />
                  </div>

                  {/* Chains Section */}
                  <div className="bg-white/50 backdrop-blur-sm border border-white/60 p-6 rounded-[2rem] shadow-sm">
                    <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                      <Layers size={16} className="text-purple-500" /> Supported Chains
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data?.chains?.length > 0 ? (
                        data.chains.map(chain => (
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
                    <a
                      href={`https://defillama.com/protocol/${protocol?.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-purple-600 transition-all shadow-xl shadow-gray-200"
                    >
                      View on DefiLlama <ExternalLink size={16} />
                    </a>
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
