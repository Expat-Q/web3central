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
  const [fallbackIdx, setFallbackIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  const domain = tool.url ? getDomain(tool.url) : null;
  const twitterUrl = tool.twitter || tool.builder?.twitter;
  const twitterHandle = extractTwitterHandle(twitterUrl);

  // Build ordered list of image sources to try
  // 1. Stored logo 2. Twitter avatar (unavatar) 3. Clearbit (404 on miss) 4. Google Favicon (always works)
  const sources = [
    tool.logo,
    twitterHandle ? `https://unavatar.io/twitter/${twitterHandle}?fallback=false` : null,
    domain ? `https://logo.clearbit.com/${domain}?size=128` : null,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
  ].filter(Boolean);

  const currentSrc = sources[fallbackIdx];

  if (!currentSrc || failed) {
    return (
      <div className="w-full h-full bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
        {tool.name ? tool.name.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={tool.name}
      onError={() => {
        if (fallbackIdx + 1 < sources.length) {
          setFallbackIdx(prev => prev + 1);
        } else {
          setFailed(true);
        }
      }}
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

const CATEGORY_META = {
  // --- Live categories ---
  trading:     { title: 'Trading',           desc: 'DEX and perpetual trading protocols', color: 'purple',  comingSoon: false },
  bridges:     { title: 'Bridges',            desc: 'Cross-chain asset transfers and messaging', color: 'blue',    comingSoon: false },
  defi:        { title: 'DeFi',               desc: 'Lending, yield, and stablecoins',   color: 'emerald', comingSoon: false },
  staking:     { title: 'Staking',            desc: 'Liquid staking and validator protocols', color: 'indigo',  comingSoon: false },
  rwa:         { title: 'Real World Assets',  desc: 'Tokenized real-world assets',        color: 'amber',   comingSoon: true  },
  security:    { title: 'Security',           desc: 'Wallet protection and scam prevention', color: 'red',     comingSoon: false },
  analytics:   { title: 'Analytics',          desc: 'Onchain data and portfolio tracking', color: 'cyan',    comingSoon: false },
  wallets:     { title: 'Wallets',            desc: 'Wallet tools and infrastructure',    color: 'slate',   comingSoon: false },
  l2:          { title: 'Layer 2',            desc: 'Scaling solutions built on L1 networks', color: 'violet',  comingSoon: false },
  nft:         { title: 'NFT',                desc: 'NFT minting, trading and management', color: 'pink',    comingSoon: false },
  gaming:      { title: 'Gaming',             desc: 'Onchain games and GameFi protocols', color: 'green',   comingSoon: true  },
  privacy:     { title: 'Privacy',            desc: 'Private transactions and ZK tools', color: 'gray',    comingSoon: true  },
  predictions: { title: 'Prediction Markets', desc: 'Bet on real-world outcome events',   color: 'orange',  comingSoon: true  },
  community:   { title: 'Community',          desc: 'DAO tools and decentralized coordination', color: 'teal',    comingSoon: false },
  // --- Legacy support ---
  dex:              { title: 'DEX',                    desc: 'Decentralized exchanges',           color: 'purple',  comingSoon: false },
  perps:            { title: 'Perpetuals',             desc: 'Derivatives and perpetual trading', color: 'purple',  comingSoon: false },
  interoperability: { title: 'Interoperability',       desc: 'Cross-chain protocols',             color: 'blue',    comingSoon: false },
  bountyHub:        { title: 'Bounty Hub',             desc: 'Earn rewards for Web3 contributions', color: 'amber',   comingSoon: false },
  onchainAutonomy:  { title: 'Onchain Automation',     desc: 'Automated smart contract protocols', color: 'indigo',  comingSoon: false },
  communityTools:   { title: 'Community Tools',        desc: 'DAO and coordination tools',         color: 'teal',    comingSoon: false },
};

const heroImages = {
  dex: '/images/heroes/hero-dex.png',
  perps: '/images/heroes/hero-perps.png',
  web3Chat: '/images/heroes/hero-perps.png',
  interoperability: '/images/heroes/hero-interoperability.png',
  onchainAutonomy: '/images/heroes/hero-onchain-autonomy.png',
  communityTools: '/images/heroes/hero-community-tools.png',
  bountyHub: '/images/heroes/hero-onchain-autonomy.png',
};

export default function CategoryPage({ categoryKey: propCategoryKey, title: propTitle, description: propDescription }) {
  const params = useParams();
  const categoryKey = propCategoryKey || params.categoryKey;
  const meta = CATEGORY_META[categoryKey] || {};
  const title = propTitle || meta.title || categoryKey;
  const description = propDescription || meta.desc || '';
  const isComingSoon = meta.comingSoon === true;
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
  const [tradingSubFilter, setTradingSubFilter] = useState("all"); // 'all' | 'dex' | 'perps'

  // Comparison Bench State (Synced with URL for ToolComparison compatibility)
  const [bench, setBench] = useState([]);

  useEffect(() => {
    const tools = searchParams.get("tools")?.split(",").filter(Boolean) || [];
    setBench(tools);
  }, [searchParams]);

  const toggleBench = (toolId) => {
    const strId = String(toolId);
    let newBench;
    if (bench.includes(strId)) {
      newBench = bench.filter(id => id !== strId);
    } else {
      if (bench.length >= 4) return;
      newBench = [...bench, strId];
    }
    setBench(newBench);
    setSearchParams(prev => {
      if (newBench.length > 0) {
        prev.set("tools", newBench.join(","));
      } else {
        prev.delete("tools");
      }
      return prev;
    });
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

  // ── App Store derived data ──
  const isFiltered = searchQuery || chainFilter !== 'all' || sortBy !== 'default' || tradingSubFilter !== 'all';

  // Featured = highest rated (or first if no ratings)
  const featured = useMemo(() => {
    if (isFiltered) return null;
    const sorted = [...data].sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
    return sorted[0] || null;
  }, [data, isFiltered]);

  // Trending = next 4 by TVL
  const trending = useMemo(() => {
    if (isFiltered) return [];
    const rest = data.filter(t => t._id !== featured?._id);
    return [...rest].sort((a, b) => (b.metrics?.tvl || 0) - (a.metrics?.tvl || 0)).slice(0, 4);
  }, [data, featured, isFiltered]);

  // New = everything else
  const newProtocols = useMemo(() => {
    if (isFiltered) return [];
    const trendingIds = new Set(trending.map(t => t._id));
    return data.filter(t => t._id !== featured?._id && !trendingIds.has(t._id));
  }, [data, featured, trending, isFiltered]);

  // Chain pills derived from data
  const chainPills = useMemo(() => {
    const chains = new Set();
    data.forEach(t => t.metrics?.chains?.forEach(c => chains.add(c)));
    return Array.from(chains).sort().slice(0, 5);
  }, [data]);

  // Derived filtered data when search/filters are active
  const filteredData = useMemo(() => {
    if (!isFiltered) return [];
    
    let result = [...data];

    // Trading sub-filter (DEX vs Perps)
    if (categoryKey === 'trading' && tradingSubFilter !== 'all') {
      const subFilterMap = {
        dex: ['dex', 'trading'],
        perps: ['perps', 'web3Chat'],
      };
      const matchCats = subFilterMap[tradingSubFilter] || [tradingSubFilter];
      result = result.filter(t => matchCats.includes(t.category));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }

    if (chainFilter !== 'all') {
      result = result.filter(t => t.metrics?.chains?.includes(chainFilter));
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
    } else if (sortBy === 'tvl') {
      result.sort((a, b) => (b.metrics?.tvl || 0) - (a.metrics?.tvl || 0));
    }

    return result;
  }, [data, isFiltered, searchQuery, chainFilter, sortBy, categoryKey, tradingSubFilter]);

  const StarRating = ({ value = 0, count }) => (
    <div className="flex items-center gap-1">
      <div className="flex gap-px">
        {[1,2,3,4,5].map(s => (
          <span key={s} className={`text-xs ${s <= Math.round(value) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
        ))}
      </div>
      <span className="text-xs text-gray-400 font-medium">{value ? value.toFixed(1) : '—'}{count ? ` (${count})` : ''}</span>
    </div>
  );

  const ProtocolCard = ({ app }) => {
    const rating = app.averageRating || app.rating || 0;
    return (
      <motion.div
        layout
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, scale: 0.9 }}
        className="group"
      >
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-100 transition-all duration-300 p-4 flex flex-col gap-3 h-full">
          {/* Icon + Verified */}
          <div className="flex items-start justify-between">
            {(() => {
              const twUrl = app.twitter || app.builder?.twitter;
              const Wrapper = twUrl ? 'a' : 'div';
              const wrapperProps = twUrl ? { href: twUrl, target: '_blank', rel: 'noreferrer', title: "Visit X Profile" } : {};
              
              return (
                <Wrapper {...wrapperProps} className="relative block group/logo">
                  <div className={`w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 p-2 shadow-sm ${twUrl ? 'group-hover/logo:border-purple-300 group-hover/logo:shadow-md transition-all' : ''}`}>
                    <ToolLogo tool={app} />
                  </div>
                  {app.verified && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center pointer-events-none">
                      <ShieldCheck size={8} className="text-white" />
                    </div>
                  )}
                </Wrapper>
              );
            })()}
            <button
              onClick={() => {
                if (!user || user.email === 'guest@web3central.internal') { navigate('/login'); return; }
                toggleBookmark(app);
              }}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${isBookmarked(app.id || app._id)
                ? 'bg-purple-50 border-purple-200 text-purple-600'
                : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-purple-300 hover:text-purple-600'}`}
            >
              <Bookmark size={13} className={isBookmarked(app.id || app._id) ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Name + Description */}
          <div className="flex-grow min-w-0">
            <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1 group-hover:text-purple-700 transition-colors line-clamp-1">{app.name}</h3>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{app.description}</p>
          </div>

          {/* Rating + Open */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div
              className="cursor-pointer"
              onClick={() => {
                if (!user || user.email === 'guest@web3central.internal') { navigate('/login'); } else { setSelectedTool(app); }
              }}
            >
              <StarRating value={rating} count={app.ratingCount} />
            </div>
            <div className="flex items-center gap-2">
              <SafeLink
                url={app.url}
                verified={false}
                hideDomain={true}
                className="flex items-center gap-1 px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-full hover:bg-purple-700 transition-colors whitespace-nowrap shadow-sm shadow-purple-600/20"
              >
                Open
              </SafeLink>
            </div>
          </div>

          {/* Compare bench toggle */}
          <button
            onClick={() => toggleBench(app._id || app.id)}
            className={`w-full text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-xl border-2 transition-all shadow-md ${bench.includes(String(app._id || app.id))
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200'
              : 'bg-white border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-indigo-100'}`}
          >
            {bench.includes(String(app._id || app.id)) ? <><Check size={10} className="inline mr-1" />Added to Compare</> : <><Plus size={10} className="inline mr-1" />Compare</>}
          </button>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading protocols...</p>
      </div>
    );
  }

  // ── Coming Soon Gate ──
  if (isComingSoon) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="pt-20 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Link to="/apps" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 leading-none">{title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
          </div>
        </div>
        {/* Coming Soon Body — Animated */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">

          {/* Animated background orbs */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute w-[400px] h-[400px] pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-purple-400/40 blur-[1px]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400/30 blur-[1px]" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-fuchsia-400/30 blur-[1px]" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute w-[300px] h-[300px] pointer-events-none"
          >
            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400/40 blur-[1px]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 rounded-full bg-violet-400/30 blur-[1px]" />
          </motion.div>

          {/* Pulsing glow background */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-72 h-72 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full blur-[80px] pointer-events-none"
          />

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mb-8"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/50 flex items-center justify-center shadow-xl shadow-purple-200/30"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative z-10 inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 text-xs font-bold px-5 py-2.5 rounded-full mb-6 uppercase tracking-widest shadow-sm"
          >
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-amber-500"
            />
            Coming Soon
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative z-10 text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            {title}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative z-10 text-gray-500 text-base max-w-lg leading-relaxed mb-10"
          >
            We're carefully curating the best <strong className="text-gray-700">{title}</strong> protocols for Web3Central.
            Be the first to know — or submit a protocol yourself.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="relative z-10 flex flex-col sm:flex-row items-center gap-3"
          >
            <Link
              to="/submit-tool"
              className="px-8 py-3.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 hover:scale-105 hover:-translate-y-0.5"
            >
              Submit a Protocol
            </Link>
            <Link
              to="/apps"
              className="px-8 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Browse Other Categories
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-gray-900">

      {/* ── Section 1: Header ── */}
      <div className="pt-20 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/apps" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 leading-none">{title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{data.length} protocol{data.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Bench bar — inline on desktop */}
          {bench.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-3 px-4 py-2 bg-indigo-600 rounded-2xl text-white shadow-lg"
            >
              <span className="text-sm font-bold">{bench.length} selected</span>
              <Link
                to={`/tool-comparison?tools=${bench.join(',')}`}
                className="px-4 py-1.5 bg-white text-indigo-600 text-xs font-black rounded-xl uppercase tracking-wider"
              >
                Analyze →
              </Link>
            </motion.div>
          )}
        </div>

        {/* Bench bar — full width on mobile */}
        {bench.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-3 flex items-center justify-between p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"
          >
            <span className="text-sm font-bold">{bench.length} protocol{bench.length > 1 ? 's' : ''} selected</span>
            <Link
              to={`/tool-comparison?tools=${bench.join(',')}`}
              className="px-4 py-1.5 bg-white text-indigo-600 text-xs font-black rounded-xl uppercase tracking-wider"
            >
              Analyze →
            </Link>
          </motion.div>
        )}
      </div>

      {/* ── Section 2: Search + Filter Pills ── */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-6 space-y-3">

        {/* Trading Sub-Filter (DEX / Perps) */}
        {categoryKey === 'trading' && (
          <div className="flex gap-2">
            {[
              { label: 'All Trading', value: 'all' },
              { label: 'DEX', value: 'dex' },
              { label: 'Perps', value: 'perps' },
            ].map(sf => (
              <button
                key={sf.value}
                onClick={() => setTradingSubFilter(sf.value)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${
                  tradingSubFilter === sf.value
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={`Search ${title?.toLowerCase() || 'protocols'}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 font-normal focus:border-purple-300 focus:ring-2 focus:ring-purple-50 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 shrink-0">
            {[
              { label: 'All', action: () => { setSortBy('default'); setChainFilter('all'); } , active: !isFiltered },
              { label: 'High TVL', action: () => setSortBy('tvl'), active: sortBy === 'tvl' },
              { label: 'Top Rated', action: () => setSortBy('rating'), active: sortBy === 'rating' },
              { label: 'Verified', action: () => setSortBy('default'), active: false },
              ...chainPills.map(c => ({ label: c, action: () => setChainFilter(c), active: chainFilter === c }))
            ].map(pill => (
              <button
                key={pill.label}
                onClick={pill.action}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${pill.active
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">

        {/* ── Filtered / Search results ── */}
        {isFiltered ? (
          filteredData.length === 0 ? (
            <div className="text-center py-20">
              <Search size={40} className="mx-auto text-gray-200 mb-4" />
              <p className="font-bold text-gray-900 mb-1">No protocols found</p>
              <p className="text-sm text-gray-400 mb-4">Try a different search or filter</p>
              <button
                onClick={() => { setSearchQuery(''); setSortBy('default'); setChainFilter('all'); }}
                className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredData.map(app => <ProtocolCard key={app._id} app={app} />)}
              </AnimatePresence>
            </motion.div>
          )
        ) : (
          <>
            {/* ── Section 3: Featured Hero Card ── */}
            {featured && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-8">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-700 p-6 md:p-8 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent" />
                  {/* Verified tag — top-right corner */}
                  {featured.verified && (
                    <span className="absolute top-4 right-4 z-20 flex items-center gap-1 text-xs text-emerald-300 font-bold bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <ShieldCheck size={13} /> Verified
                    </span>
                  )}
                  <div className="relative z-10 flex items-center gap-5">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 shrink-0 shadow-lg">
                      <ToolLogo tool={featured} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-purple-200 text-[10px] font-bold uppercase tracking-widest mb-1">Featured Protocol</p>
                      <h2 className="text-white font-bold text-2xl md:text-3xl leading-none mb-2">{featured.name}</h2>
                      <p className="text-purple-200 text-sm leading-relaxed line-clamp-2 max-w-2xl">{featured.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10 grid grid-cols-2 md:flex md:flex-row md:justify-end items-stretch md:items-center gap-3 mt-5">
                    <button
                      onClick={() => toggleBench(featured._id || featured.id)}
                      className={`w-full md:w-auto px-3 md:px-5 py-2.5 text-sm font-bold rounded-full border border-white/30 transition-all ${bench.includes(String(featured._id || featured.id)) ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                    >
                      {bench.includes(String(featured._id || featured.id)) ? '✓ Compare' : '+ Compare'}
                    </button>
                    <SafeLink
                      url={featured.url}
                      verified={false}
                      hideDomain={true}
                      className="w-full md:w-auto flex items-center justify-center px-4 md:px-6 py-2.5 bg-white text-gray-900 text-sm font-black rounded-full hover:bg-gray-100 transition-colors"
                    >
                      Open
                    </SafeLink>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Section 4: Trending ── */}
            {trending.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Trending</h2>
                  <button onClick={() => setSortBy('tvl')} className="text-sm text-purple-600 font-semibold hover:underline">See all</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {trending.map(app => <ProtocolCard key={app._id} app={app} />)}
                </div>
              </motion.div>
            )}

            {/* ── Section 5: New Protocols ── */}
            {newProtocols.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.2}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">New Protocols</h2>
                  <span className="text-xs text-gray-400 font-medium">{newProtocols.length} listed</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {newProtocols.map(app => <ProtocolCard key={app._id} app={app} />)}
                </div>
              </motion.div>
            )}

            {data.length === 0 && (
              <div className="text-center py-24">
                <LayoutGrid size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="font-bold text-gray-900 mb-1">No protocols listed yet</p>
                <p className="text-sm text-gray-400">Check back soon!</p>
              </div>
            )}
          </>
        )}

        {/* Submit CTA */}
        <div className="mt-16 p-8 bg-gray-900 rounded-2xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-indigo-600/20 pointer-events-none" />
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">Submit a Protocol</h3>
          <p className="text-gray-400 text-sm mb-5 relative z-10">Help build the most comprehensive Web3 directory.</p>
          <Link to="/submit-tool" className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all">
            Submit Protocol <Zap size={14} />
          </Link>
        </div>
      </div>

      {/* Rating Modal */}
      {selectedTool && (
        <RatingModal
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
          onRatingSubmitted={(newAvg) => {
            setData(prev => prev.map(t => t.id === selectedTool.id ? { ...t, rating: newAvg } : t));
          }}
        />
      )}
    </div>
  );
}