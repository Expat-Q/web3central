import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SafeLink from "../../components/SafeLink";
import Rating from "../../components/Rating";
import RatingModal from "../../components/RatingModal";
import { fetchToolsByCategory } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  ArrowUpDown,
  Filter,
  Zap,
  ShieldCheck,
  Plus,
  Check,
  ChevronLeft,
  LayoutGrid,
  TrendingUp,
  Database,
  ExternalLink,
  BarChart3,
  DollarSign,
  Activity,
  Coins,
  Bookmark,
  X
} from "lucide-react";
import { useBookmarks } from "../../hooks/useBookmarks";

const fmt = (n) => n > 0 ? '$' + new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 }).format(n) : '—';

const getDomain = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
};

const extractTwitterHandle = (url) => {
  if (!url) return null;
  const match = url.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
  return match ? match[1] : null;
};

// Custom robust logo component
const ToolLogo = ({ tool }) => {
  const [imgError, setImgError] = useState(false);

  const twitterHandle = extractTwitterHandle(tool.twitter || tool.socials?.twitter);
  const domain = tool.url ? getDomain(tool.url) : null;

  // Resolution Priority: Database Logo -> Twitter PFP -> Clearbit Domain -> Initial
  const initialSrc = tool.logo ||
    (twitterHandle ? `https://unavatar.io/twitter/${twitterHandle}` : null) ||
    (domain ? `https://logo.clearbit.com/${domain}?size=128` : null);

  if (imgError || !initialSrc) {
    return (
      <div className="w-full h-full bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
        {tool.name ? tool.name.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  return (
    <img
      src={initialSrc}
      alt={tool.name}
      onError={() => setImgError(true)}
      className="w-full h-full object-contain drop-shadow-sm"
    />
  );
};

// ── Animation Variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 80, damping: 18 }
  }
};

const fadeUp = {
  hidden: { y: 40, opacity: 0 },
  visible: (delay = 0) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }
  })
};

const slideRight = {
  hidden: { x: -60, opacity: 0 },
  visible: (delay = 0) => ({
    x: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }
  })
};

const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: (delay = 0) => ({
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }
  })
};

export default function CategoryPage({ categoryKey: propCategoryKey, title, description }) {
  const params = useParams();
  const categoryKey = propCategoryKey || params.categoryKey;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const autoOpenAppId = searchParams.get('rate');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const { toggleBookmark, isBookmarked } = useBookmarks();

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [chainFilter, setChainFilter] = useState("all");

  // Comparison Bench State (Synced with URL for ToolComparison compatibility)
  const [bench, setBench] = useState([]);

  useEffect(() => {
    const tools = searchParams.get("tools")?.split(",").filter(Boolean) || [];
    setBench(tools);
  }, [searchParams]);

  const toggleBench = (toolId) => {
    let newBench;
    if (bench.includes(toolId)) {
      newBench = bench.filter(id => id !== toolId);
    } else {
      if (bench.length >= 4) return;
      newBench = [...bench, toolId];
    }
    setBench(newBench);
    setSearchParams({ tools: newBench.join(",") });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const toolsData = await fetchToolsByCategory(categoryKey);
        const activeTools = toolsData.filter(tool => tool.status === 'active' || !tool.status);
        setData(activeTools);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (categoryKey) fetchData();
  }, [categoryKey]);

  // Analytical Logic: Search, Filter, Sort
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }

    if (chainFilter !== "all") {
      result = result.filter(item =>
        item.metrics?.chains?.includes(chainFilter)
      );
    }

    if (sortBy === "tvl") {
      result.sort((a, b) => (b.metrics?.tvl || 0) - (a.metrics?.tvl || 0));
    } else if (sortBy === "mcap") {
      result.sort((a, b) => (b.metrics?.mcap || 0) - (a.metrics?.mcap || 0));
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [data, searchQuery, sortBy, chainFilter]);

  // Extract unique chains for filter
  const allChains = useMemo(() => {
    const chains = new Set();
    data.forEach(item => {
      item.metrics?.chains?.forEach(c => chains.add(c));
    });
    return Array.from(chains).sort();
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-slate-400 font-semibold uppercase tracking-[0.25em] text-[11px] mt-6">Loading protocols...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-white min-h-screen text-gray-900 relative overflow-hidden">
      {/* ── Background Decor ── */}
      <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-indigo-100/30 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute top-[40%] left-0 w-[600px] h-[600px] bg-purple-100/20 rounded-full blur-[140px] -translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-100/20 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Hero Section ── */}
      <div className="relative pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Breadcrumb Navigation */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <Link to="/apps" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/60 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-300 shadow-sm mb-10">
              <ChevronLeft size={14} /> Back to Directory
            </Link>
          </motion.div>

          {/* Hero Content Grid */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">

            {/* Left: Title Block */}
            <div className="max-w-3xl">
              {/* Accent Label */}
              <motion.div
                variants={slideRight}
                initial="hidden"
                animate="visible"
                custom={0.1}
                className="flex items-center gap-3 mb-6"
              >
                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-500" />
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Protocol Directory</span>
              </motion.div>

              {/* Main Title */}
              <motion.h1
                variants={slideRight}
                initial="hidden"
                animate="visible"
                custom={0.2}
                className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6"
              >
                {title}
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.35}
                className="text-slate-500 text-lg leading-relaxed max-w-2xl"
              >
                {description}
              </motion.p>

              {/* Stats Chips */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.5}
                className="flex flex-wrap items-center gap-3 mt-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/80 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[12px] font-bold text-slate-700">{filteredData.length} Protocols</span>
                </div>
                {allChains.length > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/80 shadow-sm">
                    <LayoutGrid size={13} className="text-indigo-500" />
                    <span className="text-[12px] font-bold text-slate-700">{allChains.length} Networks</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right: Bench Comparison Bar */}
            {bench.length > 0 && (
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                custom={0.4}
                className="flex items-center gap-4 p-2.5 pl-6 pr-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-indigo-200/40 shrink-0"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Benchmarked</span>
                  <span className="text-sm font-extrabold">{bench.length} Protocol{bench.length > 1 ? 's' : ''}</span>
                </div>
                <Link
                  to={`/tool-comparison?tools=${bench.join(",")}`}
                  className="px-5 py-2.5 rounded-xl bg-white text-indigo-600 text-[11px] font-bold uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  Analyze
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Analytical Controls */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.5}
          className="mb-12 grid grid-cols-1 md:grid-cols-4 gap-3 p-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm"
        >
          <div className="md:col-span-2 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-50/80 border border-slate-100 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            />
          </div>

          <div className="relative group">
            <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-50/80 border border-slate-100 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-600 appearance-none cursor-pointer hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="default">Sort: Default</option>
              <option value="tvl">Sort: TVL</option>
              <option value="mcap">Sort: Market Cap</option>
              <option value="rating">Sort: Rating</option>
            </select>
          </div>

          <div className="relative group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-slate-50/80 border border-slate-100 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-600 appearance-none cursor-pointer hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="all">Network: All</option>
              {allChains.map(chain => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Dynamic Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredData.map((app) => {
              const m = app.metrics || {};
              const hasMetrics = m.tvl > 0 || m.mcap > 0;
              const metrics = [
                { label: 'TVL', value: fmt(m.tvl), change: m.tvlChange24h, icon: <Database size={13} /> },
                { label: 'Market Cap', value: fmt(m.mcap), icon: <BarChart3 size={13} /> },
                { label: 'Token Price', value: fmt(m.tokenPrice), icon: <DollarSign size={13} /> },
                { label: 'FDV', value: fmt(m.fdv), icon: <Coins size={13} /> },
                { label: 'Volume 24h', value: fmt(m.volume24h), icon: <Activity size={13} /> },
              ];

              return (
                <motion.div
                  key={app._id || app.id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group h-full"
                >
                  <div className="bg-white border border-slate-200/80 h-full flex flex-col rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(99,102,241,0.12)] hover:border-indigo-200 transition-all duration-500 relative overflow-hidden">

                    {/* ─── Section 1: Logo + Add Button ─── */}
                    <div className="flex items-center justify-between p-6 pb-0">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-2 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-500">
                          <ToolLogo tool={app} />
                        </div>
                        {app.verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm" title="Verified">
                            <ShieldCheck size={10} className="text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBookmark(app)}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 ${isBookmarked(app.id || app._id)
                            ? 'bg-purple-50 border-purple-200 text-purple-600 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'
                            }`}
                          title={isBookmarked(app.id || app._id) ? "Remove Bookmark" : "Bookmark Tool"}
                        >
                          <Bookmark size={14} className={isBookmarked(app.id || app._id) ? "fill-current" : ""} />
                        </button>

                        <button
                          onClick={() => toggleBench(app.id)}
                          className={`h-9 px-3.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 ${bench.includes(app.id)
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200/50'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm'
                            }`}
                        >
                          {bench.includes(app.id) ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add</>}
                        </button>
                      </div>
                    </div>

                    {/* ─── Section 2: Header ─── */}
                    <div className="px-6 pt-4">
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors duration-300 leading-snug">
                        {app.name}
                      </h3>
                    </div>

                    {/* ─── Section 3: Description Text ─── */}
                    <div className="px-6 pt-2 pb-3">
                      <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                        {app.description}
                      </p>
                    </div>

                    {/* Builder Social Links */}
                    {app.builder?.twitter && (
                      <div className="px-6 pb-2">
                        <a
                          href={app.builder.twitter.startsWith('http') ? app.builder.twitter : `https://x.com/${app.builder.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-[#1DA1F2] transition-colors"
                        >
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                          {app.builder.name || app.builder.twitter}
                        </a>
                      </div>
                    )}

                    {/* ─── Section 3b: Rating & Community ─── */}
                    <div className="px-6 pb-4 flex items-center justify-between">
                      <div
                        className="flex items-center gap-1.5 cursor-pointer group/rating"
                        onClick={() => {
                          if (!user || user.email === 'guest@web3central.internal') {
                            navigate('/login');
                          } else {
                            setSelectedTool(app);
                          }
                        }}
                      >
                        <div className="flex gap-0.5 text-sm">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= (app.averageRating || app.rating || 0) ? "text-yellow-400" : "text-slate-200"}>★</span>
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 group-hover/rating:text-indigo-500 transition-colors mt-0.5">
                          ({app.ratingCount || 0})
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (!user || user.email === 'guest@web3central.internal') {
                            navigate('/login');
                          } else {
                            setSelectedTool(app);
                          }
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 hover:text-indigo-600 hover:underline px-2 py-1 bg-indigo-50 rounded-lg"
                      >
                        Rate
                      </button>
                    </div>

                    {/* ─── Section 4: On-chain Metrics Table ─── */}
                    {categoryKey !== 'communityTools' && (
                      <div className="mx-4 mb-4 rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/50">
                        {/* Metrics Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white/60">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp size={11} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">On-chain Metrics</span>
                          </div>
                          {hasMetrics && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        </div>
                        {/* Metric Rows */}
                        {metrics.map((metric, i) => (
                          <div key={metric.label} className={`flex items-center justify-between px-4 py-2.5 ${i < metrics.length - 1 ? 'border-b border-slate-100/80' : ''} ${i % 2 === 0 ? 'bg-white/40' : 'bg-slate-50/30'} hover:bg-indigo-50/40 transition-colors`}>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300 group-hover:text-indigo-400 transition-colors">{metric.icon}</span>
                              <span className="text-[11px] font-semibold text-slate-500">{metric.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-bold text-slate-900 tabular-nums">{metric.value}</span>
                              {metric.change !== undefined && metric.change !== null && (
                                <span className={`text-[10px] font-bold tabular-nums ${metric.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {metric.change >= 0 ? '+' : ''}{metric.change?.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ─── Section 5: Launch Button ─── */}
                    <div className="mt-auto p-4 pt-0">
                      <SafeLink
                        url={app.url}
                        verified={false}
                        hideDomain={true}
                        className="group flex items-center justify-between w-full p-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl hover:shadow-indigo-900/20 active:scale-[0.98] transition-all duration-300"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-100 group-hover:text-white transition-colors">
                            LAUNCH APP
                          </span>
                          {app.verified && <ShieldCheck size={14} className="text-emerald-400" />}
                        </div>
                        <ExternalLink size={15} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </SafeLink>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="py-24 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200"
          >
            <LayoutGrid className="mx-auto text-slate-200 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No protocols found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
          </motion.div>
        )}

        {/* Submit CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          custom={0}
          className="mt-24 mb-16 p-12 md:p-16 bg-slate-900 rounded-3xl text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-white relative z-10">Submit a Protocol</h2>
          <p className="text-slate-400 mb-8 text-base max-w-xl mx-auto relative z-10">Help build the most comprehensive Web3 protocol directory.</p>
          <Link to="/submit-tool" className="relative z-10 inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-xl shadow-indigo-900/30 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all">
            Submit Protocol <Zap size={15} />
          </Link>
        </motion.div>
      </div>

      {/* Rating/Note Modal */}
      {selectedTool && (
        <RatingModal
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
          onRatingSubmitted={(newAvg) => {
            setData(prevData => prevData.map(t =>
              t.id === selectedTool.id ? { ...t, rating: newAvg } : t
            ));
          }}
        />
      )}
    </div>
  );
}
