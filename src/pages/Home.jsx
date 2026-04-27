import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { fetchToolsData, fetchLatestNews, fetchCommunitySpotlight } from "../services/apiService";
import {
  Star, ExternalLink, ChevronRight, Search, X,
  TrendingUp, Sparkles, ArrowLeftRight, Landmark,
  Share2, Wallet, ShieldCheck, BarChart3, Users
} from "lucide-react";
import ToolLogo from "../components/ToolLogo";
import NewsCard from "../components/NewsCard";
import CategorySidebar from "../components/CategorySidebar";
import { PageSkeleton } from "../components/Skeleton";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

const CATEGORY_TO_ROUTE = {
  dex: "trading", trading: "trading", perps: "trading",
  interoperability: "bridges", bridge: "bridges", bridges: "bridges",
  defi: "defi", nft: "nft", gaming: "gaming", wallets: "wallets",
  wallet: "wallets", security: "security", analytics: "analytics",
  community: "community", rwa: "rwa", cex: "cex", privacy: "privacy",
  predictions: "predictions",
};

const norm = (cat = "") => cat.toLowerCase().replace(/[^a-z0-9]/g, "");
const getCategoryRoute = (cat = "") => CATEGORY_TO_ROUTE[norm(cat)] || norm(cat) || "trading";

/* ── Trending score: clicks + ratings + weeklyTrend ── */
const trendScore = (t) =>
  (t.weeklyTrendScore || 0) * 1.5 +
  (t.clickCount || 0) * 0.5 +
  (t.averageRating || t.rating || 0) * 10;

/* ── Section Header ── */
const SectionHeader = ({ icon: Icon, iconColor = "text-purple-600", title, subtitle, to }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        {Icon && <Icon size={18} className={iconColor} />}
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

/* ── App Card (Play Store style) ── */
const AppCard = ({ tool, onOpen }) => {
  const rating = tool.averageRating || tool.rating || 0;
  return (
    <div
      className="flex flex-col gap-2 cursor-pointer group w-40 shrink-0"
      onClick={() => onOpen(tool)}
    >
      <div className="w-40 h-40 rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm group-hover:shadow-md group-hover:border-purple-100 transition-all">
        <ToolLogo tool={tool} className="w-full h-full object-contain p-2" />
      </div>
      <div className="space-y-0.5 px-0.5">
        <p className="text-[13px] font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">{tool.name}</p>
        <p className="text-[11px] text-gray-400 capitalize truncate">{tool.category}</p>
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] text-gray-500 font-semibold">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Horizontal Scroll Row ── */
const HScrollRow = ({ children }) => (
  <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
    {children}
  </div>
);

/* ── Category Row Section ── */
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

/* ══════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════ */
export default function Home() {
  const [allTools, setAllTools] = useState([]);
  const [newsFeed, setNewsFeed] = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [loading, setLoading] = useState(true);

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

  /* ── Data fetch ── */
  useEffect(() => {
    Promise.all([fetchToolsData(), fetchLatestNews(), fetchCommunitySpotlight()])
      .then(([toolsData, newsData, spotlightData]) => {
        const tools = Object.values(toolsData || {})
          .filter(Array.isArray).flat()
          .filter(t => t.status === "active" || !t.status);
        setAllTools(tools);
        setNewsFeed(newsData || []);
        
        // Handle spotlight data — supports both array and legacy single object
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

  /* ── Spotlight Carousel Interval ── */
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

  /* ── Featured Carousel Interval ── */
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

  /* ── Debounced search ── */
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

  /* ── Open tool → navigate to category page + open MetricsPanel ── */
  const openTool = (tool) => {
    const route = getCategoryRoute(tool.category);
    navigate(`/apps/${route}`, {
      state: { openToolId: tool.id || tool._id }
    });
  };

  /* ── Derived data ── */
  const byCats = (cats) =>
    allTools.filter(t => cats.includes(norm(t.category))).sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 12);

  const trending    = [...allTools].sort((a, b) => trendScore(b) - trendScore(a)).slice(0, 12);
  const newArrivals = [...allTools].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 12);
  const tradingApps  = byCats(["trading", "dex", "perps"]);
  const defiApps     = byCats(["defi"]);
  const bridgesApps  = byCats(["bridges", "interoperability", "bridge"]);
  const walletsApps  = byCats(["wallets", "wallet"]);
  const securityApps = byCats(["security"]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-gray-900 flex">

      {/* ── Desktop Sidebar (full height from top-0) ── */}
      <CategorySidebar
        activeSection={activeSection}
        onSelect={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Scrollable content column ── */}
      <div className="flex-1 min-w-0">
      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* ── New arrivals ticker ── */}
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

      {/* ── Main content ── */}
      <main className="px-4 sm:px-5 lg:px-7 py-5 space-y-8">

        {/* Search bar + mobile hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              aria-label="Open sidebar"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

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

              {/* Search dropdown — clicking opens MetricsPanel */}
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

          {/* ⓪ Featured Hero Banner Carousel */}
          {trending.length > 0 && (
            <div className="w-full rounded-[2rem] bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 p-8 md:p-10 text-white relative overflow-hidden shadow-2xl h-auto md:h-[280px] flex items-center">
              {/* Background glow effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeaturedIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10 flex flex-col md:flex-row gap-8 items-center w-full"
                >
                  {/* Hero App Logo */}
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-black/40 backdrop-blur-md p-4 border border-white/10 shrink-0 shadow-2xl">
                    <ToolLogo tool={trending[currentFeaturedIndex]} className="w-full h-full object-contain drop-shadow-lg" />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                      <span className="text-[11px] font-black tracking-widest uppercase text-purple-300 mb-2 block">Featured</span>
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{trending[currentFeaturedIndex].name}</h1>
                    </div>
                    
                    <p className="text-purple-100/80 text-sm md:text-base leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-3">
                      {trending[currentFeaturedIndex].description}
                    </p>
                  </div>
                  
                  <div className="flex flex-row md:flex-col items-center justify-center gap-3 shrink-0 md:ml-auto">
                    {trending[currentFeaturedIndex].url && (
                      <a 
                        href={trending[currentFeaturedIndex].url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex justify-center items-center gap-2 px-6 py-3 w-full md:w-40 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg"
                      >
                        <ExternalLink size={16} /> Open App
                      </a>
                    )}
                    <button 
                      onClick={() => openTool(trending[currentFeaturedIndex])}
                      className="flex justify-center items-center gap-2 px-6 py-3 w-full md:w-40 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-bold transition-colors backdrop-blur-sm"
                    >
                      Details
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Indicators */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                {Array.from({ length: Math.min(trending.length, 5) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentFeaturedIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${currentFeaturedIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ① Trending Now — all categories, ranked by clicks + ratings */}
          <CategorySection
            id="section-trending"
            sectionId="section-trending"
            icon={TrendingUp}
            iconColor="text-orange-500"
            title="Trending Now"
            subtitle="Most active apps across all categories this week"
            to="/apps"
            tools={trending}
            onOpen={openTool}
          />
          
          {/* ── Builder Spotlight Carousel ── */}
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

          {/* ② New Arrivals */}
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

          {/* ③ Top in Trading */}
          <CategorySection
            sectionId="section-trading"
            icon={ArrowLeftRight}
            iconColor="text-violet-600"
            title="Top in Trading"
            subtitle="DEX and perpetual protocols"
            to="/apps/trading"
            tools={tradingApps}
            onOpen={openTool}
          />

          {/* ④ Top in DeFi */}
          <CategorySection
            sectionId="section-defi"
            icon={Landmark}
            iconColor="text-emerald-600"
            title="Top in DeFi"
            subtitle="Lending, yield, and stablecoins"
            to="/apps/defi"
            tools={defiApps}
            onOpen={openTool}
          />

          {/* ⑤ Top in Bridges */}
          <CategorySection
            sectionId="section-bridges"
            icon={Share2}
            iconColor="text-blue-600"
            title="Top in Bridges"
            subtitle="Cross-chain asset transfers"
            to="/apps/bridges"
            tools={bridgesApps}
            onOpen={openTool}
          />

          {/* ⑥ Top in Wallets */}
          <CategorySection
            sectionId="section-wallets"
            icon={Wallet}
            iconColor="text-slate-600"
            title="Top in Wallets"
            subtitle="Wallet tools and infrastructure"
            to="/apps/wallets"
            tools={walletsApps}
            onOpen={openTool}
          />

          {/* ⑦ Top in Security */}
          <CategorySection
            sectionId="section-security"
            icon={ShieldCheck}
            iconColor="text-red-500"
            title="Top in Security"
            subtitle="Wallet protection and scam prevention"
            to="/apps/security"
            tools={securityApps}
            onOpen={openTool}
          />

          {/* ⑧ Latest News */}
          {newsFeed.length > 0 && (
            <section className="border-t border-gray-100 pt-6">
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
    </div>
  );
}
