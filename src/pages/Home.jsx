import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { fetchToolsData, fetchLatestNews, fetchCommunitySpotlight } from "../services/apiService";
import {
  Star, ExternalLink, ChevronRight, ChevronDown, ChevronLeft, Search, X,
  TrendingUp, Sparkles, ArrowLeftRight, Landmark,
  Share2, Wallet, ShieldCheck, BarChart3, Users,
  Trophy, Gamepad2, Lock, Building, Coins, Activity,
  Image, Target, Code2
} from "lucide-react";
import ToolLogo from "../components/ToolLogo";
import NewsCard from "../components/NewsCard";
import CategorySidebar from "../components/CategorySidebar";
// Sidebar is now rendered globally in App.jsx  import kept for potential direct use
import { PageSkeleton } from "../components/Skeleton";
import SafeLink from "../components/SafeLink";
import { useMetrics } from "../context/MetricsContext";
import { useBookmarks } from "../hooks/useBookmarks";
import SentimentCell from "../components/SentimentCell";
import TokenAnalysisTable from "../components/TokenAnalysisTable";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

const CATEGORY_TO_ROUTE = {
  dex: "trading", trading: "trading", perps: "trading",
  interoperability: "bridges", bridge: "bridges", bridges: "bridges",
  defi: "defi", nft: "nft", gaming: "gaming", wallets: "wallets",
  wallet: "wallets", security: "security", analytics: "analytics",
  communitytools: "communityTools", onchaintools: "communityTools", onchaintool: "communityTools",
  dao: "dao", governance: "dao", rwa: "rwa", cex: "cex", privacy: "privacy",
  predictions: "predictions",
};

const HOMEPAGE_CATEGORIES = [
  { id: "ai",             title: "Artificial Intelligence",  icon: Sparkles,       iconColor: "text-indigo-600",  to: "/apps/ai" },
  { id: "analytics",      title: "Analytics",                icon: BarChart3,      iconColor: "text-cyan-600",    to: "/apps/analytics" },
  { id: "bounty-hub",     title: "Bounty Hub",               icon: Target,         iconColor: "text-indigo-600",  to: "/apps/bounty-hub" },
  { id: "bridges",        title: "Bridges",                  icon: Share2,         iconColor: "text-blue-600",    to: "/apps/bridges" },
  { id: "cex",            title: "CEX",                      icon: Coins,          iconColor: "text-yellow-600",  to: "/apps/cex" },
  { id: "communityTools", title: "Onchain Tools",            icon: Code2,          iconColor: "text-teal-600",    to: "/apps/communityTools" },
  { id: "dao",            title: "DAO",                      icon: Building,       iconColor: "text-purple-600",  to: "/apps/dao" },
  { id: "defi",           title: "DeFi",                     icon: Landmark,       iconColor: "text-emerald-600", to: "/apps/defi" },
  { id: "depin",          title: "DePIN",                    icon: Activity,       iconColor: "text-orange-500",  to: "/apps/depin", comingSoon: true },
  { id: "gaming",         title: "Gaming",                   icon: Gamepad2,       iconColor: "text-green-600",   to: "/apps/gaming" },
  { id: "infofi",         title: "InfoFi",                   icon: Activity,       iconColor: "text-indigo-500",  to: "/apps/infofi" },
  { id: "infra",          title: "Infra & Dev Tools",        icon: Code2,          iconColor: "text-slate-500",   to: "/apps/infra" },
  { id: "nft",            title: "NFT",                      icon: Image,          iconColor: "text-pink-600",    to: "/apps/nft" },
  { id: "payments",       title: "Payments",                 icon: Wallet,         iconColor: "text-emerald-500", to: "/apps/payments", comingSoon: true },
  { id: "predictions",    title: "Predictions",              icon: Activity,       iconColor: "text-orange-600",  to: "/apps/predictions", comingSoon: true },
  { id: "privacy",        title: "Privacy",                  icon: Lock,           iconColor: "text-gray-600",    to: "/apps/privacy", comingSoon: true },
  { id: "rwa",            title: "RWA",                      icon: Building,       iconColor: "text-amber-600",   to: "/apps/rwa" },
  { id: "social",         title: "Social & DeSoc",           icon: Share2,         iconColor: "text-blue-400",    to: "/apps/social" },
  { id: "staking",        title: "Staking & Yield",          icon: Coins,          iconColor: "text-yellow-600",  to: "/apps/staking" },
  { id: "trading",        title: "Trading",                  icon: ArrowLeftRight, iconColor: "text-violet-600",  to: "/apps/trading" },
  { id: "wallets",        title: "Wallets",                  icon: Wallet,         iconColor: "text-slate-600",   to: "/apps/wallets" },
];

const norm = (cat = "") => cat.toLowerCase().replace(/[^a-z0-9]/g, "");
const getCategoryRoute = (cat = "") => CATEGORY_TO_ROUTE[norm(cat)] || norm(cat) || "trading";

/*  Trending score: clicks + ratings + weeklyTrend  */
const trendScore = (t) =>
  (t.weeklyTrendScore || 0) * 1.5 +
  (t.clickCount || 0) * 0.5 +
  (t.averageRating || t.rating || 0) * 10;

/*  Section Header — uniform icon color */
const SectionHeader = ({ icon: Icon, title, subtitle, to }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        {Icon && <Icon size={17} className="text-purple-600" />}
        <h2 className="text-base font-black text-gray-900 tracking-tight">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-gray-400 pl-[26px]">{subtitle}</p>}
    </div>
    {to && (
      <Link to={to} className="text-xs font-bold text-purple-600 hover:text-purple-500 flex items-center gap-1 transition-colors shrink-0">
        See all <ChevronRight size={13} />
      </Link>
    )}
  </div>
);

/*  Protocol Hover Card — rendered via portal so overflow-x:auto scroll rows can't clip it */
const ProtocolHoverCard = ({ tool, style }) => {
  const rating = tool.averageRating || tool.rating || 0;
  const chains = tool.metrics?.chains?.slice(0, 3) || [];
  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={style}
      className="w-[240px] bg-white rounded-2xl shadow-2xl border border-gray-150 overflow-hidden pointer-events-none"
    >
      {/* Dark header banner with logo */}
      <div className="h-[72px] bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
        </div>
        <div className="w-12 h-12 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-lg">
          <ToolLogo tool={tool} className="w-full h-full object-contain p-1.5" />
        </div>
      </div>

      <div className="p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 truncate leading-tight">{tool.name}</p>
            <p className="text-[10px] text-gray-400 capitalize font-semibold mt-0.5">{tool.category}</p>
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-0.5 shrink-0 bg-amber-50 border border-amber-100 rounded-lg px-1.5 py-0.5">
              <Star size={9} className="text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-black text-amber-700">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {tool.description && (
          <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{tool.description}</p>
        )}

        {chains.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {chains.map(c => (
              <span key={c} className="text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-100 rounded-md px-1.5 py-0.5">{c}</span>
            ))}
          </div>
        )}

        {tool.verified && (
          <div className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck size={10} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Verified Protocol</span>
          </div>
        )}

        <div className="pt-1 border-t border-gray-100">
          <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Click to explore →</span>
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

/*  App Card — full-wrap border (image + name + category all inside one bordered container) */
const AppCard = ({ tool, onOpen }) => {
  const [hovered, setHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const cardRef = useRef(null);
  const rating = tool.averageRating || tool.rating || 0;

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipStyle({
        position: 'fixed',
        left: rect.left + rect.width / 2,
        top: rect.top - 12,
        transform: 'translate(-50%, -100%)',
        zIndex: 99999,
      });
    }
    setHovered(true);
  };

  return (
    <div
      ref={cardRef}
      className="flex flex-col cursor-pointer group w-[130px] shrink-0"
      onClick={() => onOpen(tool)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Single unified card container: border + shadow wraps image, name, category */}
      <div
        className="w-[130px] rounded-2xl bg-white overflow-hidden"
        style={{
          border: hovered ? '2px solid rgba(109,57,255,0.35)' : '2px solid rgba(0,0,0,0.09)',
          boxShadow: hovered
            ? '0 8px 28px rgba(0,0,0,0.14), 0 2px 8px rgba(109,57,255,0.10)'
            : '0 2px 10px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
          transform: hovered ? 'translateY(-2px)' : 'none',
        }}
      >
        {/* Image area */}
        <div className="w-full h-[120px] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-3">
          <ToolLogo tool={tool} className="w-full h-full object-contain" />
        </div>

        {/* Text footer inside the same bordered box */}
        <div className="px-2.5 pt-2 pb-2.5 border-t border-gray-100/80">
          <p className="text-[12px] font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors leading-tight flex items-center gap-1">
            {tool.name}
            {tool.verified && <ShieldCheck size={9} className="text-emerald-500 shrink-0" />}
          </p>
          <p className="text-[10px] text-gray-400 capitalize truncate mt-0.5">{tool.category}</p>
          {rating > 0 ? (
            <div className="flex items-center gap-0.5 mt-1">
              <Star size={9} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] text-gray-500 font-semibold">{rating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-300 mt-1 block">Free</span>
          )}
        </div>
      </div>

      {/* Portal-rendered hover tooltip — escapes overflow clipping */}
      <AnimatePresence>
        {hovered && <ProtocolHoverCard tool={tool} style={tooltipStyle} />}
      </AnimatePresence>
    </div>
  );
};

/*  Horizontal Scroll Row  */
const HScrollRow = ({ children }) => (
  <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
    {children}
  </div>
);

/*  Category Row Section  */
const CategorySection = ({ icon, iconColor, title, subtitle, to, tools, onOpen, sectionId }) => {
  if (!tools.length) return null;
  return (
    <section id={sectionId}>
      <SectionHeader icon={icon} iconColor={iconColor} title={title} subtitle={subtitle} to={to} />
      <HScrollRow>
        {tools.map(tool => (
          <div key={tool._id || tool.id} className="snap-start shrink-0">
            <AppCard tool={tool} onOpen={onOpen} />
          </div>
        ))}
      </HScrollRow>
    </section>
  );
};

  /*  Top Charts Section  */
const TopChartsSection = ({ tools, onOpen }) => {
  if (!tools || tools.length === 0) return null;
  return (
    <section>
      <SectionHeader
        icon={Trophy}
        iconColor="text-yellow-500"
        title="Top Charts"
        subtitle="The highest performing protocols across all categories"
        to="/apps"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {tools.map((tool, idx) => {
          const rating = tool.averageRating || tool.rating || 0;
          return (
            <button
              key={tool._id || tool.id}
              onClick={() => onOpen(tool)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 group"
            >
              {/* Rank number */}
              <span className={`text-sm font-black w-6 text-center shrink-0 ${
                idx === 0 ? 'text-yellow-500' :
                idx === 1 ? 'text-gray-400' :
                idx === 2 ? 'text-amber-700' : 'text-gray-300'
              }`}>
                {idx + 1}
              </span>

              {/* Logo */}
              <div className="w-10 h-10 rounded-xl border border-gray-100 overflow-hidden bg-white shrink-0 shadow-sm">
                <ToolLogo tool={tool} className="w-full h-full object-contain p-1" />
              </div>

              {/* Name + category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">{tool.name}</p>
                <p className="text-xs text-gray-400 capitalize truncate">{tool.category}</p>
              </div>

              {/* Rating or arrow */}
              <div className="shrink-0 flex items-center gap-1">
                {rating > 0 ? (
                  <>
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-gray-600">{rating.toFixed(1)}</span>
                  </>
                ) : (
                  <ExternalLink size={12} className="text-gray-300 group-hover:text-purple-400 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const UrlSafetyScanner = () => {
  const [scanVal, setScanVal] = useState("");
  const [scanStatus, setScanStatus] = useState("idle"); // idle, scanning, verified, phishing, web2, unlisted
  const [scanData, setScanData] = useState(null);
  const [scanInputDomain, setScanInputDomain] = useState("");

  const triggerScan = async () => {
    let val = scanVal.trim().toLowerCase();
    if (!val) return;

    // Extract hostname from URL
    try {
      if (val.includes("://")) {
        val = new URL(val).hostname;
      } else {
        const parts = val.split("/");
        val = parts[0];
      }
    } catch (e) {}

    const domain = val.replace(/^www\./, "");
    setScanInputDomain(domain);
    setScanStatus("scanning");

    try {
      const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";
      const response = await fetch(`${API_BASE}/tools/verify-domain?domain=${domain}`);
      const data = await response.json();

      if (data.success && data.status) {
        if (data.status === "verified") {
          setScanData(data);
          setScanStatus("verified");
        } else if (data.status === "phishing") {
          setScanData(data);
          setScanStatus("phishing");
        } else {
          checkWeb2Fallback(domain);
        }
      } else {
        checkWeb2Fallback(domain);
      }
    } catch (err) {
      checkWeb2Fallback(domain);
    }
  };

  const checkWeb2Fallback = (domain) => {
    const recognizedWeb2 = [
      "google.com", "github.com", "twitter.com", "x.com", "discord.com",
      "vercel.app", "youtube.com", "medium.com", "coingecko.com", "defillama.com",
      "wikipedia.org", "openai.com", "microsoft.com", "apple.com"
    ];
    const isWeb2Safe = recognizedWeb2.some(w2 => domain === w2 || domain.endsWith(`.${w2}`));
    if (isWeb2Safe) {
      setScanStatus("web2");
    } else {
      setScanStatus("unlisted");
    }
  };

  return (
    <div className="w-full h-auto lg:h-[280px] rounded-[2rem] bg-slate-900 border border-slate-800 p-6 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="space-y-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <h3 className="text-xs font-black tracking-widest uppercase text-purple-400">Threat Scanner</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Verify if any URL is indexed in Web3Central or is a verified safe Web2 portal.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={scanVal}
            onChange={(e) => setScanVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && triggerScan()}
            placeholder="Enter URL (e.g. curve.fi)..."
            className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all font-medium"
          />
          <button
            onClick={triggerScan}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] shadow-lg shadow-purple-900/20 active:scale-95 shrink-0"
          >
            Scan
          </button>
        </div>
      </div>

      {/* Result Display area */}
      <div className="mt-4 flex-1 flex flex-col justify-end z-10 min-h-[100px]">
        {scanStatus === "idle" && (
          <div className="text-center py-4 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20">
            <p className="text-[11px] font-semibold text-slate-600">Waiting for URL scan input...</p>
          </div>
        )}

        {scanStatus === "scanning" && (
          <div className="flex flex-col items-center justify-center py-4 gap-2 border border-slate-800 rounded-2xl bg-slate-950/30">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] font-semibold text-purple-400 animate-pulse">Running telemetry check...</p>
          </div>
        )}

        {scanStatus === "verified" && scanData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 border border-emerald-900/40 rounded-2xl bg-emerald-950/10 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">🛡️ Verified Safe</span>
              {scanData.rating && (
                <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold">
                  ★ {Number(scanData.rating).toFixed(1)}
                </div>
              )}
            </div>
            <h4 className="text-sm font-black text-white">{scanData.appName}</h4>
            <p className="text-[10px] text-slate-400 truncate">
              Verified Registry URL: <a href={scanData.officialUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold hover:underline">{scanData.officialUrl.replace(/^https?:\/\//, '')}</a>
            </p>
          </motion.div>
        )}

        {scanStatus === "phishing" && scanData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 border border-red-950/60 rounded-2xl bg-red-950/20 flex flex-col gap-1.5 animate-pulse-slow"
          >
            <span className="text-[9px] font-black tracking-widest text-red-500 uppercase">🚨 Phishing Warning</span>
            <h4 className="text-xs font-bold text-white leading-tight">Mimic Clone of {scanData.appName}!</h4>
            <p className="text-[9px] text-slate-400">
              Connecting wallet here is extremely unsafe. Correct URL: <a href={scanData.officialUrl} target="_blank" rel="noreferrer" className="text-red-400 font-bold hover:underline break-all">{scanData.officialUrl.replace(/^https?:\/\//, '')}</a>
            </p>
          </motion.div>
        )}

        {scanStatus === "web2" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 border border-blue-900/40 rounded-2xl bg-blue-950/10 flex flex-col gap-1"
          >
            <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase">🌐 Recognized Web2 Service</span>
            <h4 className="text-xs font-bold text-white truncate">{scanInputDomain}</h4>
            <p className="text-[9px] text-slate-400 leading-tight">
              Highly recognized, authentic Web2 service. Unlisted in DeFi directory, but safe to visit.
            </p>
          </motion.div>
        )}

        {scanStatus === "unlisted" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 border border-slate-800 rounded-2xl bg-slate-950/30 flex flex-col gap-1"
          >
            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">⚪ Unlisted Website</span>
            <h4 className="text-xs font-bold text-white truncate">{scanInputDomain}</h4>
            <p className="text-[9px] text-slate-400 leading-tight">
              Not indexed in our database. Proceed with absolute caution and double-check signatures.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------
   HOME PAGE
   ---------------------------------------- */
export default function Home() {
  const { selectedChain, setSelectedChain } = useMetrics();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const [tableCategory, setTableCategory] = useState("All");
  const [tableSort, setTableSort] = useState("trending");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);


  const [allTools, setAllTools] = useState([]);
  const [newsFeed, setNewsFeed] = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topCharts, setTopCharts] = useState({});

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("for-you");
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [spotlightList, setSpotlightList] = useState([]);

  const navigate = useNavigate();

  /*  Data fetch  */
  useEffect(() => {
    const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

    Promise.all([
      fetchToolsData(),
      fetchLatestNews(),
      fetchCommunitySpotlight(),
      fetch(`${API_BASE}/tools/top-charts`).then(r => r.ok ? r.json() : {}).catch(() => ({}))
    ])
      .then(([toolsData, newsData, spotlightData, topChartsRes]) => {
        const tools = Object.values(toolsData || {})
          .filter(Array.isArray).flat()
          .filter(t => t.status === "active" || !t.status);
        setAllTools(tools);
        setNewsFeed(newsData || []);

        // Top charts  backend returns { success, data: { category: [tools] } }
        if (topChartsRes?.data) setTopCharts(topChartsRes.data);
        else if (typeof topChartsRes === 'object') setTopCharts(topChartsRes);
        
        // Handle spotlight data  supports both array and legacy single object
        const raw = spotlightData;
        let spotlights = [];
        if (Array.isArray(raw)) {
          spotlights = raw.map(r => r?.builderSpotlight).filter(Boolean);
        } else if (raw?.builderSpotlight) {
          spotlights = [raw.builderSpotlight];
        } else if (raw?.[0]?.builderSpotlight) {
          spotlights = raw.map(r => r?.builderSpotlight).filter(Boolean);
        }
        setSpotlightList(spotlights);
        if (spotlights[0]) setSpotlight(spotlights[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Handle cross-page scrolling from sidebar
  const location = useLocation();
  useEffect(() => {
    if (!loading && location.state?.scrollToSection) {
      setTimeout(() => {
        const el = document.getElementById(`section-${location.state.scrollToSection}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Clear state to avoid scrolling again on re-render
        navigate("/", { replace: true, state: {} });
      }, 100);
    }
  }, [loading, location.state, navigate]);

  /*  Spotlight Carousel Interval  */
  useEffect(() => {
    if (spotlightList.length <= 1) return;
    const interval = setInterval(() => {
      setSpotlightIndex(prev => {
        const next = (prev + 1) % spotlightList.length;
        setSpotlight(spotlightList[next]);
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [spotlightList]);

  /*  Featured Carousel Interval  */
  useEffect(() => {
    const trendingList = allTools
      .sort((a, b) => trendScore(b) - trendScore(a))
      .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
      
    if (trendingList.length === 0) return;
    const maxItems = Math.min(trendingList.length, 5);
    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % maxItems);
    }, 5000);
    return () => clearInterval(interval);
  }, [allTools]);

  /*  Debounced search  */
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`${API}/tools/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
        setSearchOpen(true);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /*  Open tool  navigate to category page + open MetricsPanel  */
  const openTool = (tool) => {
    const route = getCategoryRoute(tool.category);
    navigate(`/apps/${route}`, {
      state: { openToolId: tool.id || tool._id }
    });
  };

  /*  Derived data  */
  const byCats = (cats) =>
    filteredTools.filter(t => cats.includes(norm(t.category))).sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 12);

  const filteredTools = selectedChain === 'All' 
    ? allTools 
    : allTools.filter(t => t.metrics?.chains?.some(c => c.toLowerCase() === selectedChain.toLowerCase()));

  const trending    = [...filteredTools].sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 10);
  const topRated = [...filteredTools].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 10);
  const newArrivals = [...filteredTools].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 10);

  // Filter top charts by chain too
  const filteredTopCharts = {};
  Object.keys(topCharts).forEach(cat => {
    filteredTopCharts[cat] = topCharts[cat].filter(t => 
      selectedChain === 'All' || t.metrics?.chains?.some(c => c.toLowerCase() === selectedChain.toLowerCase())
    );
  });
  const formatCurrency = (val, noTokenDash = false) => {
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) === 0) {
      if (noTokenDash) return <span className="text-rose-400 font-extrabold tracking-widest text-xs cursor-help" title="No token data available">―</span>;
      return "—";
    }
    const num = Number(val);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    if (num < 1) return `$${num.toFixed(4)}`;
    return `$${num.toFixed(2)}`;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) setCatDropdownOpen(false);
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) setSortDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const renderPercentChange = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return <span className="text-gray-300">—</span>;
    }
    const num = Number(val);
    if (num === 0) return <span className="text-gray-400 font-bold text-[11px]">0.00%</span>;
    const isPositive = num > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 font-bold text-[11px] ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isPositive ? '▲' : '▼'} {Math.abs(num).toFixed(2)}%
      </span>
    );
  };

  // Detect if protocol has real DeFi TVL (on-chain locked value)
  const DEFI_CATEGORIES = new Set(['defi', 'trading', 'bridges', 'staking', 'lending', 'cex']);
  const isDeFi = (tool) => {
    const hasTvl = tool.metrics?.tvl > 0;
    const cat = (tool.category || '').toLowerCase();
    return hasTvl || DEFI_CATEGORIES.has(cat);
  };

  // Small color-coded badge to clarify metric source
  const MetricBadge = ({ label, variant }) => {
    const styles = variant === 'defi'
      ? 'bg-purple-50 text-purple-600 border-purple-100'
      : 'bg-sky-50 text-sky-600 border-sky-100';
    return (
      <span className={`inline-block ml-1 px-1 py-0 rounded text-[8px] font-bold tracking-tight border ${styles}`}>
        {label}
      </span>
    );
  };

  // Table tools processing — only include protocols with onchain data
  let tableTools = [...allTools].filter(t => {
    const m = t.metrics;
    if (!m) return false;
    // Must have at least one onchain metric: TVL, token price, market cap, or chains
    return (m.tvl > 0) || (m.tokenPrice > 0) || (m.mcap > 0) || (m.chains?.length > 0);
  });

  // 1. Filter by selected chain (from global useMetrics)
  if (selectedChain !== 'All') {
    tableTools = tableTools.filter(t => 
      t.metrics?.chains?.some(c => c.toLowerCase() === selectedChain.toLowerCase())
    );
  }

  // 2. Filter by Category
  if (tableCategory !== 'All') {
    const categoryMap = {
      trading: ["trading", "dex", "perps"],
      bridges: ["bridges", "interoperability", "bridge"],
      wallets: ["wallets", "wallet"],
      analytics: ["analytics"],
      infofi: ["infofi"],
      "bounty-hub": ["bounty-hub", "bountyhub"],
      community: ["community", "communitytools"],
      infra: ["infra", "infradevtools"],
      social: ["social", "socialdesoc"],
      staking: ["staking", "stakingyield"]
    };
    const targetCats = categoryMap[tableCategory.toLowerCase()] || [tableCategory.toLowerCase()];
    tableTools = tableTools.filter(t => targetCats.includes(norm(t.category)));
  }

  // 3. Sort — on-chain data first, ratings/reviews last
  const onchainScore = (t) => {
    const tvl = t.metrics?.tvl || 0;
    const mcap = t.metrics?.mcap || 0;
    const vol = t.metrics?.volume24h || 0;
    return Math.max(tvl, mcap) + vol;
  };

  if (tableSort === 'trending') {
    tableTools.sort((a, b) => {
      const aScore = onchainScore(a);
      const bScore = onchainScore(b);
      // Both have on-chain data: sort by magnitude
      if (aScore > 0 && bScore > 0) return bScore - aScore;
      // One has data, other doesn't: data first
      if (aScore > 0) return -1;
      if (bScore > 0) return 1;
      // Neither has data: fall back to trend score
      return trendScore(b) - trendScore(a);
    });
  } else if (tableSort === 'rating') {
    tableTools.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
  } else if (tableSort === 'newest') {
    tableTools.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (tableSort === 'commits') {
    const getCommits = (t) => t.githubCommits?.count30d || t.metrics?.githubCommits?.count30d || 0;
    tableTools.sort((a, b) => getCommits(b) - getCommits(a));
  }

  // Pagination
  const totalTableTools = tableTools.length;
  const totalPages = Math.max(1, Math.ceil(totalTableTools / tablePageSize));
  const safePage = Math.min(tablePage, totalPages);
  const tableDisplayTools = tableTools.slice((safePage - 1) * tablePageSize, safePage * tablePageSize);

  // Reset page when filters change
  const handleCategoryChange = (cat) => { setTableCategory(cat); setTablePage(1); setCatDropdownOpen(false); };
  const handleSortChange = (e) => { setTableSort(e.target.value); setTablePage(1); };

  if (loading) return <PageSkeleton />;

  return (
    <div id="section-for-you" className="flex-1 min-w-0 w-full overflow-x-hidden">
      {/*  New arrivals ticker  */}
      {newArrivals.length > 0 && (
        <div className="w-full bg-purple-50 border-b border-purple-100 overflow-hidden flex py-1.5">
          <div className="whitespace-nowrap flex items-center gap-4 animate-marquee">
            {[...newArrivals, ...newArrivals].map((t, i) => (
              <span key={i} className="flex items-center gap-2 shrink-0">
                <span className="text-purple-600 font-bold text-[10px] tracking-widest uppercase">New</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <button
                  onClick={() => openTool(t)}
                  className="text-gray-500 hover:text-purple-600 transition-colors text-xs font-medium"
                >
                  {t.name}
                </button>
                <span className="mx-4 text-gray-200">|</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/*  Main content  */}
      <main className="px-4 sm:px-5 lg:px-7 pt-0 pb-8 space-y-4">
        {/* InfoFi & Contract Safety Wedge Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 border border-purple-500/20 text-white rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[11px] font-bold rounded-full uppercase tracking-wider">
              <Sparkles size={13} className="text-purple-300" />
              Onchain InfoFi & Smart Contract Security Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Real-time Web3 Intelligence, Community Sentiment & Smart Contract Safety
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium leading-relaxed">
              Track Bull/Bear community sentiment, prevent contract drain attacks, analyze live TVL shifts, and receive instant OS push notifications for new protocol opportunities.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 z-10">
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl">
              <ShieldCheck size={14} /> Anti-Drain Verified
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-xl">
              <Bell size={14} /> OS Push Alerts
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
            <div ref={searchRef} className="relative flex-1">
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-purple-400 transition-all shadow-sm">
                <Search size={16} className="text-gray-300 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && query.trim()) {
                      navigate(`/apps?q=${encodeURIComponent(query)}`);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search apps, protocols, categories..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300 font-medium"
                />
                {query && (
                  <button onClick={() => { setQuery(""); setSearchResults([]); setSearchOpen(false); }}>
                    <X size={14} className="text-gray-300 hover:text-gray-500" />
                  </button>
                )}
                {searchLoading && (
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </div>

              {/* Search dropdown  clicking opens MetricsPanel */}
              {searchOpen && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{searchResults.length} results</p>
                  </div>
                  {searchResults.map(tool => (
                    <button
                      key={tool._id || tool.id}
                      onClick={() => { openTool(tool); setSearchOpen(false); setQuery(""); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-white">
                        <ToolLogo tool={tool} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700">{tool.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{tool.category}</p>
                      </div>
                      <ExternalLink size={12} className="text-gray-200 group-hover:text-purple-400 shrink-0" />
                    </button>
                  ))}
                  <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50">
                    <button
                      onClick={() => { navigate(`/apps?q=${encodeURIComponent(query)}`); setSearchOpen(false); }}
                      className="text-xs text-purple-600 font-bold flex items-center gap-1"
                    >
                      <Search size={11} /> See all results for "{query}"
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Microsoft Store-style Hero ── */}
          {trending.length > 0 && (() => {
            const hero = trending[currentFeaturedIndex] || trending[0];
            const side = [
              trending[(currentFeaturedIndex + 1) % Math.min(trending.length, 5)],
              trending[(currentFeaturedIndex + 2) % Math.min(trending.length, 5)],
              trending[(currentFeaturedIndex + 3) % Math.min(trending.length, 5)],
            ].filter(Boolean);

            return (
              <div className="w-full flex flex-col lg:flex-row gap-3 select-none">
                {/* Left: Large featured card — takes 58% on desktop */}
                <div
                  className="lg:w-[58%] min-h-[300px] lg:min-h-[360px] rounded-[1.75rem] relative overflow-hidden cursor-pointer group"
                  style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}
                  onClick={() => openTool(hero)}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900" />
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentFeaturedIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col justify-end p-7 z-10"
                    >
                      {/* Logo floating */}
                      <div className="absolute top-6 right-6 w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-2.5 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                        <ToolLogo tool={hero} className="w-full h-full object-contain" />
                      </div>

                      <span className="text-[10px] font-black tracking-widest uppercase text-purple-300 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        Featured
                      </span>
                      <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none mb-3">
                        {hero.name}
                      </h2>
                      <p className="text-purple-200/75 text-base leading-relaxed line-clamp-2 max-w-md mb-6">
                        {hero.description}
                      </p>
                      <div className="flex items-center gap-2">
                        {hero.url && (
                          <SafeLink
                            url={hero.url}
                            verified={false}
                            hideDomain={true}
                            toolId={hero.id || hero._id}
                            currentCount={hero.clickCount}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 rounded-xl font-bold text-xs hover:bg-gray-50 transition-colors shadow-lg"
                          >
                            <ExternalLink size={12} /> Visit
                          </SafeLink>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openTool(hero); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl font-bold text-xs transition-colors backdrop-blur-sm"
                        >
                          Details
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Dot indicators */}
                  <div className="absolute bottom-5 right-6 flex items-center gap-1.5 z-20">
                    {Array.from({ length: Math.min(trending.length, 5) }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentFeaturedIndex(idx); }}
                        className={`h-1 rounded-full transition-all duration-300 ${currentFeaturedIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Right: 3 smaller tiles — wider to balance hero */}
                <div className="flex flex-row lg:flex-col gap-3 lg:w-[42%] shrink-0">
                  {side.map((tool, i) => (
                    <div
                      key={tool._id || tool.id}
                      onClick={() => openTool(tool)}
                      className="flex-1 lg:flex-none lg:h-[98px] rounded-[1.25rem] overflow-hidden relative cursor-pointer group"
                      style={{
                        background: [
                          'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
                          'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                          'linear-gradient(135deg, #1a0533 0%, #6d28d9 100%)',
                        ][i],
                        boxShadow: '0 2px 16px rgba(0,0,0,0.16)',
                      }}
                    >
                      <div className="absolute inset-0 p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-200">
                          <ToolLogo tool={tool} className="w-full h-full object-contain p-1.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-white truncate leading-tight">{tool.name}</p>
                          <p className="text-[10px] text-white/50 capitalize truncate mt-0.5">{tool.category}</p>
                        </div>
                        <ExternalLink size={12} className="text-white/30 group-hover:text-white/70 shrink-0 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/*  New Arrivals */}
          <CategorySection
            sectionId="section-new"
            icon={Sparkles}
            iconColor="text-emerald-500"
            title="New Arrivals"
            subtitle="Recently listed on web3central"
            to="/apps"
            tools={newArrivals}
            onOpen={openTool}
          />

          {/* 5 curated category rows */}
          {(() => {
            const HOME_5_CATS = [
              { id: "defi",    aliases: ["defi"],                      ...HOMEPAGE_CATEGORIES.find(c => c.id === "defi") },
              { id: "wallets", aliases: ["wallets", "wallet"],          ...HOMEPAGE_CATEGORIES.find(c => c.id === "wallets") },
              { id: "trading", aliases: ["trading", "dex", "perps"],   ...HOMEPAGE_CATEGORIES.find(c => c.id === "trading") },
              { id: "nft",     aliases: ["nft"],                        ...HOMEPAGE_CATEGORIES.find(c => c.id === "nft") },
              { id: "ai",      aliases: ["ai"],                         ...HOMEPAGE_CATEGORIES.find(c => c.id === "ai") },
            ];
            return (
              <>
                {HOME_5_CATS.map(cat => {
                  const catTools = filteredTools
                    .filter(t => cat.aliases.includes(norm(t.category)))
                    .sort((a, b) => trendScore(b) - trendScore(a))
                    .slice(0, 12);
                  if (!catTools.length) return null;
                  return (
                    <CategorySection
                      key={cat.id}
                      sectionId={`section-${cat.id}`}
                      icon={cat.icon}
                      iconColor={cat.iconColor}
                      title={cat.title}
                      subtitle={`Top rated ${cat.title.toLowerCase()} protocols`}
                      to={cat.to}
                      tools={catTools}
                      onOpen={openTool}
                    />
                  );
                })}
                {/* Browse all categories CTA */}
                <div className="flex items-center justify-center py-2">
                  <Link
                    to="/apps"
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-2xl text-sm font-bold transition-all shadow-sm"
                  >
                    Browse all categories <ChevronRight size={15} />
                  </Link>
                </div>
              </>
            );
          })()}

          {/*  Top Charts Section: Table layout with dynamic filters  */}
          <section id="section-top-charts" className="py-4 space-y-4">
            <SectionHeader
              icon={Trophy}
              iconColor="text-amber-500"
              title="Top Charts"
              subtitle="Comprehensive protocol directory with on-chain metrics, reviews, and activity"
            />

            {/* Table Filters Panel */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
              {/* Chain Selector Bubbles */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                {['All', 'Solana', 'Base', 'Ethereum', 'BSC'].map((chain) => (
                  <button
                    key={chain}
                    onClick={() => setSelectedChain(chain)}
                    className={`px-4 py-2 rounded-full text-xs font-black tracking-tight transition-all border ${
                      (selectedChain || 'All').toLowerCase() === chain.toLowerCase()
                        ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-900/10'
                        : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {chain === 'All' ? 'All Networks' : chain}
                  </button>
                ))}
              </div>

              {/* Category & Sort Selector Dropdowns */}
              <div className="flex items-center gap-2">
                {/* Custom Category Dropdown */}
                <div ref={catDropdownRef} className="relative">
                  <button
                    onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                    className={`flex items-center gap-2 bg-white border rounded-2xl px-4 py-2 text-xs font-bold outline-none cursor-pointer shadow-sm min-w-[160px] transition-all ${
                      catDropdownOpen ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="truncate text-gray-700">
                      {tableCategory === 'All' ? 'All Categories' : HOMEPAGE_CATEGORIES.find(c => c.id === tableCategory)?.title || tableCategory}
                    </span>
                    <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {catDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1.5 w-[220px] bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 z-50 py-1.5 max-h-[320px] overflow-y-auto scrollbar-hide"
                      >
                        <button
                          onClick={() => handleCategoryChange('All')}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold transition-all ${
                            tableCategory === 'All' ? 'bg-purple-600 text-white font-bold' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                        >
                          All Categories
                        </button>
                        {HOMEPAGE_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold transition-all ${
                              tableCategory === cat.id ? 'bg-purple-600 text-white font-bold' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                          >
                            {cat.title}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Custom Sort Dropdown */}
                <div ref={sortDropdownRef} className="relative">
                  <button
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className={`flex items-center gap-2 bg-white border rounded-2xl px-4 py-2 text-xs font-bold outline-none cursor-pointer shadow-sm min-w-[140px] transition-all ${
                      sortDropdownOpen ? 'border-purple-400 ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="truncate text-gray-700">
                      {tableSort === 'trending' && '⚡ Trending'}
                      {tableSort === 'rating' && '★ Top Rated'}
                      {tableSort === 'newest' && '🆕 New Arrivals'}
                      {tableSort === 'commits' && '💻 GitHub Commits'}
                    </span>
                    <ChevronDown size={14} className={`ml-auto text-gray-400 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {sortDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-1.5 w-[160px] bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 z-50 py-1.5"
                      >
                        {[
                          { id: 'trending', label: '⚡ Trending' },
                          { id: 'rating', label: '★ Top Rated' },
                          { id: 'newest', label: '🆕 New Arrivals' },
                          { id: 'commits', label: '💻 GitHub Commits' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => { setTableSort(opt.id); setTablePage(1); setSortDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold transition-all ${
                              tableSort === opt.id ? 'bg-purple-600 text-white font-bold' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Responsive Table Container */}
            <div className="w-full overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-black uppercase tracking-widest bg-gray-50/40">
                    <th className="py-4 px-3 sm:px-5 text-center w-10 sm:w-12 sticky left-0 z-30 bg-[#f9fafb]">#</th>
                    <th className="py-4 px-3 sm:px-4 sticky left-[36px] sm:left-[48px] z-30 bg-[#f9fafb] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Name</th>
                    <th className="py-4 px-3 sm:px-4 text-right">Price</th>
                    <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[120px]">Market Cap</th>
                    <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[120px]">Volume(24h)</th>
                    <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[120px]">TVL</th>
                    <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[90px]">1h %</th>
                    <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[90px]">24h %</th>
                    <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[90px]">7d %</th>
                    <th className="hidden sm:table-cell py-4 px-4 text-center min-w-[100px]">Rating</th>
                    <th className="py-4 px-3 sm:px-4 text-center min-w-[110px] sm:min-w-[130px]">Sentiment</th>
                    <th className="hidden sm:table-cell py-4 px-5 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {tableDisplayTools.length > 0 ? (
                    tableDisplayTools.map((tool, idx) => {
                      const rating = tool.averageRating || tool.rating || 0;
                      const symbol = tool.metrics?.tokenSymbol || tool.id.slice(0, 4).toUpperCase();
                      const defi = isDeFi(tool);
                      const hasToken = (tool.metrics?.tokenPrice > 0) || (tool.metrics?.mcap > 0);
                      const globalIdx = (safePage - 1) * tablePageSize + idx + 1;
                      
                      return (
                        <tr 
                          key={tool._id || tool.id} 
                          className="hover:bg-[#f8f5ff] transition-colors group cursor-pointer"
                          onClick={() => openTool(tool)}
                        >
                          {/* Rank # — sticky */}
                          <td className="py-4 px-3 sm:px-5 text-center font-extrabold text-xs text-black sticky left-0 z-20 bg-white group-hover:bg-[#f8f5ff]">
                            {globalIdx}
                          </td>

                          {/* App Name — sticky */}
                          <td className="py-4 px-3 sm:px-4 sticky left-[36px] sm:left-[48px] z-20 bg-white group-hover:bg-[#f8f5ff] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-gray-100 overflow-hidden bg-white shrink-0 p-1 shadow-sm">
                                <ToolLogo tool={tool} className="w-full h-full object-contain" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                    {tool.name}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                    {symbol}
                                  </span>
                                  {tool.verified && (
                                    <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-3 sm:px-4 text-right font-semibold text-xs text-gray-900">
                            {formatCurrency(tool.metrics?.tokenPrice, !hasToken)}
                          </td>

                          {/* Market Cap */}
                          <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs text-gray-900">
                            {formatCurrency(tool.metrics?.mcap, !hasToken)}
                          </td>

                          {/* Volume(24h) */}
                          <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs text-gray-900">
                            <div className="flex items-center justify-end gap-0.5">
                              {formatCurrency(tool.metrics?.volume24h, !hasToken)}
                              {tool.metrics?.volume24h > 0 && (
                                <MetricBadge
                                  label={defi ? "DEX" : "Mkt"}
                                  variant={defi ? "defi" : "token"}
                                />
                              )}
                            </div>
                          </td>

                          {/* TVL */}
                          <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs text-gray-900">
                            {formatCurrency(tool.metrics?.tvl)}
                          </td>

                          {/* 1h % */}
                          <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs">
                            {renderPercentChange(tool.metrics?.tvlChange1h)}
                          </td>

                          {/* 24h % */}
                          <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs">
                            <div className="flex items-center justify-end gap-0.5">
                              {renderPercentChange(tool.metrics?.tvlChange24h)}
                              {tool.metrics?.tvlChange24h != null && Number(tool.metrics?.tvlChange24h) !== 0 && (
                                <MetricBadge
                                  label={defi ? "TVL" : "Price"}
                                  variant={defi ? "defi" : "token"}
                                />
                              )}
                            </div>
                          </td>

                          {/* 7d % */}
                          <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs">
                            {renderPercentChange(tool.metrics?.tvlChange7d)}
                          </td>

                          {/* Rating */}
                          <td className="hidden sm:table-cell py-4 px-4">
                            <div className="flex flex-col items-center justify-center">
                              {rating > 0 ? (
                                <>
                                  <div className="flex items-center gap-0.5">
                                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs font-bold text-gray-800">{rating.toFixed(1)}</span>
                                  </div>
                                  <span className="text-[9px] text-gray-400 font-semibold mt-0.5">
                                    ({tool.ratingCount || tool.reviews || 0})
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-300 text-[10px] font-semibold">—</span>
                              )}
                            </div>
                          </td>

                          {/* Sentiment (Bullish / Bearish) */}
                          <td className="py-4 px-3 sm:px-4">
                            <SentimentCell toolId={tool.id || tool._id} sentiment={tool.sentiment} />
                          </td>

                          {/* Action */}
                          <td className="hidden sm:table-cell py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => toggleBookmark(tool)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isBookmarked(tool.id || tool._id)
                                  ? 'bg-amber-50 border-amber-200 text-amber-500'
                                  : 'bg-white border-gray-100 text-gray-300 hover:text-amber-500 hover:border-gray-200'
                              }`}
                              title={isBookmarked(tool.id || tool._id) ? "Remove Bookmark" : "Bookmark app"}
                            >
                              <Star size={14} fill={isBookmarked(tool.id || tool._id) ? "currentColor" : "none"} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="12" className="py-12 text-center text-xs font-semibold text-gray-400">
                        No protocols found matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalTableTools > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3 mt-3 shadow-sm">
                {/* Left: Showing count */}
                <span className="text-xs font-semibold text-gray-500">
                  Showing {(safePage - 1) * tablePageSize + 1} – {Math.min(safePage * tablePageSize, totalTableTools)} out of {totalTableTools}
                </span>

                {/* Center: Page numbers */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTablePage(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

                    if (start > 1) {
                      pages.push(
                        <button key={1} onClick={() => setTablePage(1)} className="w-8 h-8 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-all">1</button>
                      );
                      if (start > 2) pages.push(<span key="dots-start" className="text-gray-400 text-xs px-1">•••</span>);
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setTablePage(i)}
                          className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${
                            i === safePage
                              ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200/50'
                              : 'border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push(<span key="dots-end" className="text-gray-400 text-xs px-1">•••</span>);
                      pages.push(
                        <button key={totalPages} onClick={() => setTablePage(totalPages)} className="w-8 h-8 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-all">{totalPages}</button>
                      );
                    }

                    return pages;
                  })()}
                  <button
                    onClick={() => setTablePage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Right: Page size selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-semibold">Show</span>
                  <select
                    value={tablePageSize}
                    onChange={(e) => { setTablePageSize(Number(e.target.value)); setTablePage(1); }}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-purple-400 cursor-pointer"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* ═══ Token Analysis Table (CMC-style coin directory) ═══ */}
          <TokenAnalysisTable />

          {/*  Builder Spotlight Carousel  */}
          {spotlightList.length > 0 && (
            <section className="my-8">
              <SectionHeader
                icon={Users}
                iconColor="text-fuchsia-500"
                title="Builder Spotlight"
                subtitle="Meet the architects behind your favorite dApps"
              />
              <div className="w-full rounded-[2rem] bg-white border border-gray-100 shadow-sm overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={spotlightIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.45 }}
                    className="p-6 sm:p-8 flex flex-col md:flex-row gap-8"
                  >
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={spotlight.xProfileImageUrl || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"}
                          alt={spotlight.name}
                          className="w-16 h-16 rounded-full border-2 border-fuchsia-100 object-cover"
                        />
                        <div>
                          <h3 className="text-xl font-black text-gray-900">{spotlight.name}</h3>
                          <p className="text-sm font-bold text-fuchsia-600">{spotlight.role}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                        {spotlight.description}
                      </p>
                      {spotlight.twitter && (
                        <a href={spotlight.twitter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          Follow on X
                        </a>
                      )}
                    </div>

                    {spotlight.featuredTools?.length > 0 && (
                      <div className="md:w-72 shrink-0 space-y-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Built by {spotlight.name}</p>
                        {spotlight.featuredTools.map((ft, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-sm text-gray-900 shadow-sm shrink-0">
                              {ft.initial}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 truncate">{ft.name}</p>
                              <p className="text-xs text-gray-500 truncate">{ft.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Carousel dot indicators */}
                {spotlightList.length > 1 && (
                  <div className="flex items-center justify-center gap-2 pb-5">
                    {spotlightList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSpotlightIndex(idx); setSpotlight(spotlightList[idx]); }}
                        className={`h-1.5 rounded-full transition-all ${spotlightIndex === idx ? 'w-6 bg-fuchsia-500' : 'w-1.5 bg-gray-200'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/*  Latest News */}
          {newsFeed.length > 0 && (
            <section id="section-news" className="border-t border-gray-100 pt-4">
              <SectionHeader
                icon={BarChart3}
                iconColor="text-purple-500"
                title="Latest in Web3"
                subtitle="Market updates and protocol news"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsFeed.slice(0, 3).map((article, i) => (
                  <NewsCard key={article._id || i} article={article} index={i} />
                ))}
              </div>
            </section>
        )}

      </main>
    </div>
  );
}
