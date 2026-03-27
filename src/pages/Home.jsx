import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { fetchToolsData, fetchCommunitySpotlight, fetchStatsOverview } from "../services/apiService";
import { Star, ExternalLink, ChevronRight, Zap, Sparkles } from "lucide-react";
import BuilderSpotlightCard from "../components/BuilderSpotlightCard";
import { PageSkeleton } from "../components/Skeleton";


/* ── Tool Logo with X/Twitter pfp fallback chain ── */
const getDomain = (url) => {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
};
const extractTwitterHandle = (url) => {
  if (!url) return null;
  const match = url.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
  return match ? match[1] : null;
};
const ToolLogo = ({ tool }) => {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const domain = tool.url ? getDomain(tool.url) : null;
  const handle = extractTwitterHandle(tool.twitter || tool.builder?.twitter);
  const sources = [
    tool.logo,
    handle ? `https://unavatar.io/twitter/${handle}?fallback=false` : null,
    domain ? `https://logo.clearbit.com/${domain}?size=128` : null,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
  ].filter(Boolean);
  const src = sources[idx];
  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg rounded-[inherit]">
        {tool.name?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={tool.name}
      className="w-full h-full object-cover rounded-[inherit]"
      onError={() => idx < sources.length - 1 ? setIdx(idx + 1) : setFailed(true)}
    />
  );
};

/* ── Animated Number Counter ── */
const AnimatedCounter = ({ value, duration = 2, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = parseInt(value, 10);
      if (start === end) return;
      const totalMilSecDur = parseInt(duration);
      const incrementTime = (totalMilSecDur / end) * 1000;
      const timer = setInterval(() => {
        start += 1;
        setCount(String(start));
        if (start === end) clearInterval(timer);
      }, incrementTime);
      return () => clearInterval(timer);
    }
  }, [value, duration, isInView]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
};

/* ── Material Symbol helper ── */
const Icon = ({ name, size = 22 }) => (
  <span
    className="material-symbols-rounded"
    style={{ fontSize: size, fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

/* ── Category chip config ── */
const CATEGORIES = [
  { label: "Trading",     icon: "currency_exchange",      path: "/apps/trading",     bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200", hoverBg: "hover:bg-purple-100" },
  { label: "Bridges",     icon: "share",                  path: "/apps/bridges",     bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200",   hoverBg: "hover:bg-blue-100"   },
  { label: "DeFi",        icon: "account_balance",        path: "/apps/defi",        bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200",hoverBg: "hover:bg-emerald-100"},
  { label: "Security",    icon: "shield",                 path: "/apps/security",    bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",    hoverBg: "hover:bg-red-100"    },
  { label: "Analytics",   icon: "bar_chart",              path: "/apps/analytics",   bg: "bg-cyan-50",    text: "text-cyan-700",   border: "border-cyan-200",   hoverBg: "hover:bg-cyan-100"   },
  { label: "Wallets",     icon: "account_balance_wallet", path: "/apps/wallets",     bg: "bg-slate-50",   text: "text-slate-700",  border: "border-slate-200",  hoverBg: "hover:bg-slate-100"  },
  { label: "Layer 2",     icon: "layers",                 path: "/apps/l2",          bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200", hoverBg: "hover:bg-violet-100" },
  { label: "NFT",         icon: "image",                  path: "/apps/nft",         bg: "bg-pink-50",    text: "text-pink-700",   border: "border-pink-200",   hoverBg: "hover:bg-pink-100"   },
  { label: "Gaming",      icon: "sports_esports",         path: "/apps/gaming",      bg: "bg-green-50",   text: "text-green-700",  border: "border-green-200",  hoverBg: "hover:bg-green-100"  },
  { label: "Privacy",     icon: "lock",                   path: "/apps/privacy",     bg: "bg-gray-50",    text: "text-gray-700",   border: "border-gray-200",   hoverBg: "hover:bg-gray-100"   },
  { label: "Predictions", icon: "monitoring",             path: "/apps/predictions", bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-200", hoverBg: "hover:bg-orange-100" },
  { label: "Community",   icon: "group",                  path: "/apps/community",   bg: "bg-teal-50",    text: "text-teal-700",   border: "border-teal-200",   hoverBg: "hover:bg-teal-100"   },
];

export default function Home() {
  const [appsData, setAppsData] = useState(null);
  const [communitySpotlight, setCommunitySpotlight] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [toolsData, spotlightData, statsData] = await Promise.all([
          fetchToolsData(),
          fetchCommunitySpotlight(),
          fetchStatsOverview()
        ]);
        setAppsData(toolsData);
        setCommunitySpotlight(spotlightData);
        setPlatformStats(statsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allTools = appsData ? Object.values(appsData).flat() : [];
  const activeToolsCount = platformStats?.activeTools || allTools.length || 0;
  const inReviewCount = platformStats?.pendingTools || 0;
  const communityToolsList = appsData?.communityTools || [];
  const recentlyAdded = [...communityToolsList]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 8);

  const activeTrendingTools = allTools.length
    ? [...allTools]
      .filter(t => t.status === 'active' || !t.status)
      .sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0))
      .slice(0, 6)
    : [];

  const bs = communitySpotlight?.[0]?.builderSpotlight || communitySpotlight?.builderSpotlight;

  const faqs = [
    { q: "What is Web3Central?", a: "Web3Central is a clean, professional hub for all things decentralized — from academy tracks to protocol comparisons." },
    { q: "How do I start learning?", a: "Visit our Academy section to explore structured paths designed by industry experts." },
    { q: "Is it free to use?", a: "Yes, Web3Central is an open resource for the community to explore and learn about Web3." },
    { q: "How do I submit a tool?", a: "Click 'Submit Tool' in the nav — our team reviews and lists verified tools within 48 hours." },
  ];

  const marqueeContent = (tools) => (
    <>
      {tools.map((t, i) => (
        <span key={i} className="flex items-center gap-2 shrink-0">
          <span className="text-purple-600 font-bold text-xs tracking-widest uppercase">NEW APP LISTED</span>
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
          <Link to={`/apps/${t.category}`} className="text-gray-600 hover:text-purple-600 transition-colors text-xs font-medium">
            {t.name || t.title}
          </Link>
          <span className="mx-6 text-gray-200">|</span>
        </span>
      ))}
    </>
  );

  if (loading) {
    return <PageSkeleton />;
  }


  return (
    <div className="bg-white min-h-screen overflow-x-hidden text-gray-900">
      {/* Spacer for fixed navbar */}
      <div className="h-20" />

      {/* ── Marquee Ticker ── */}
      {recentlyAdded.length > 0 && (
        <div className="w-full bg-purple-50 border-b border-purple-100 overflow-hidden flex py-2">
          <div className="whitespace-nowrap flex items-center gap-4 animate-marquee">
            {marqueeContent(recentlyAdded)}
            <span aria-hidden="true" className="flex items-center gap-4">{marqueeContent(recentlyAdded)}</span>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-0 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-100/60 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 space-y-8 text-center lg:text-left"
            >

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-gray-900">
                  Discover the Future
                  <br />
                  of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Web3 Apps.</span>
                </h1>
                <p className="text-gray-500 text-base md:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  The definitive marketplace for decentralized tools. Curated protocols across DeFi, security, analytics, and more.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/apps"
                  className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-300/40 hover:scale-105 active:scale-95 text-sm"
                >
                  Explore Apps
                </Link>
                <Link
                  to="/submit-tool"
                  className="px-8 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all text-sm"
                >
                  List Your Dapp
                </Link>

              </div>
            </motion.div>

            {/* Right column — 3D hero visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 hidden lg:flex items-center justify-center"
            >
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-indigo-600/20 rounded-3xl blur-2xl" />
                <img
                  src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800"
                  alt="Web3 Ecosystem"
                  className="relative rounded-3xl border border-white/10 shadow-2xl w-full object-cover h-[340px]"
                />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#0b0b16]/60 to-transparent" />
              </div>
            </motion.div>
          </div>

          {/* ── Live Stats Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-5
                       grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-gray-200"
          >
            {[
              { label: "ACTIVE TOOLS", value: activeToolsCount, suffix: "+" },
              { label: "IN REVIEW", value: inReviewCount },
              { label: "USERS", value: platformStats?.users || 0 },
              { label: "CATEGORIES", value: 14 },
            ].map((stat, i) => (
              <div key={i} className="text-center px-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} />
                </h3>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              Explore Categories
            </h2>
            <p className="text-gray-400 text-sm mt-1">Jump into any corner of Web3</p>
          </div>
          <Link to="/apps" className="text-purple-600 hover:text-purple-500 text-sm font-bold flex items-center gap-1 transition-colors">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-3 sm:overflow-visible sm:snap-none sm:pb-0">
          {CATEGORIES.map((cat, i) => {
            /* Count tools from live data */
            const catKey = cat.path.split('/').pop();
            const count = appsData
              ? Object.entries(appsData)
                  .filter(([k]) => {
                    const aliases = {
                      trading: ['dex', 'perps', 'trading'],
                      bridges: ['interoperability', 'bridges'],
                      community: ['communityTools', 'community'],
                    };
                    return (aliases[catKey] || [catKey]).includes(k);
                  })
                  .flatMap(([, v]) => v)
                  .filter(t => t.status === 'active' || !t.status).length
              : 0;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="min-w-[130px] shrink-0 snap-start sm:min-w-0 sm:shrink"
              >
                <Link
                  to={cat.path}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${cat.bg} ${cat.border} ${cat.hoverBg} transition-all group hover:shadow-lg hover:-translate-y-1 active:scale-[0.97] h-full`}
                >
                  <div className={`text-${cat.text.split('-')[1]}-600 group-hover:scale-110 transition-transform`}>
                    <Icon name={cat.icon} size={32} />
                  </div>
                  <span className={`text-[13px] font-bold ${cat.text} text-center leading-tight`}>
                    {cat.label}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] font-semibold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full border border-gray-100">
                      {count} app{count !== 1 ? 's' : ''}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── TOP CHARTS + BUILDER SPOTLIGHT ── */}
      <section className="py-4 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Top Charts (left, 3/5 width) ── */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Top Charts</h2>
                <p className="text-white/40 text-sm mt-1">Trending protocols right now</p>
              </div>
              <Link to="/apps" className="text-purple-600 hover:text-purple-500 text-sm font-bold flex items-center gap-1 transition-colors">
                See all <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-2">
              {activeTrendingTools.length > 0 ? activeTrendingTools.map((tool, i) => {
                const rating = tool.averageRating || tool.rating || 0;
                return (
                  <motion.div
                    key={tool._id || tool.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition-all group"
                  >
                    {/* Rank */}
                    <span className="text-xl font-black text-gray-200 w-6 text-center shrink-0">{i + 1}</span>

                    {/* Logo */}
                    <div className="w-12 h-12 rounded-2xl shrink-0 overflow-hidden border border-gray-200">
                      <ToolLogo tool={tool} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-purple-600 transition-colors">{tool.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-gray-400 text-[11px] capitalize">{tool.category || 'Protocol'}</span>
                        {rating > 0 && (
                          <>
                            <span className="text-white/20 text-[10px]">•</span>
                            <div className="flex items-center gap-0.5">
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                              <span className="text-gray-600 text-[11px] font-bold">{rating.toFixed(1)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* GET button */}
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 px-4 py-1.5 bg-purple-50 hover:bg-purple-600 border border-purple-200 hover:border-purple-600 text-purple-600 hover:text-white text-[11px] font-bold rounded-full transition-all"
                    >
                      GET
                    </a>
                  </motion.div>
                );
              }) : (
                <div className="text-center py-16 text-white/30">
                  <Zap size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-500">No trending tools yet</p>
                  <p className="text-sm mt-1 text-gray-400">Submit a protocol to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Builder Spotlight (right, 2/5 width) ── */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-gray-900">Builder Spotlight</h2>
              <p className="text-gray-400 text-sm mt-1">Featuring the community's best</p>
            </div>

            <BuilderSpotlightCard bs={bs} />
          </div>
        </div>
      </section>

      {/* ── FAQ + Newsletter ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black tracking-tight text-gray-900">Got Questions?</h2>
            <p className="text-gray-400 text-base mt-2">Everything you need to know about the platform.</p>
          </div>

          <div className="space-y-3 mb-14">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-100 transition-colors gap-4"
                >
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-[11px] font-bold text-purple-600 shrink-0">{i + 1}</span>
                    {faq.q}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${openFaq === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed pl-14">{faq.a}</div>
                )}
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <h3 className="text-lg font-black text-gray-900">Stay Updated.</h3>
              <p className="text-gray-400 text-sm mt-0.5">Join our community of builders.</p>
            </div>
            <form
              className="flex gap-2 w-full md:w-auto"
              onSubmit={(e) => { e.preventDefault(); alert("Newsletter coming soon!"); }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-60 bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 transition-colors text-sm text-gray-900 placeholder:text-gray-400"
              />
              <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all text-sm whitespace-nowrap">
                Join
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
