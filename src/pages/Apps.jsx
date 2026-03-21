import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchToolsData } from "../services/apiService";
import { Star, ChevronRight, Rocket } from "lucide-react";

/* ── Helpers ── */
const getDomain = (url) => {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
};
const extractTwitterHandle = (url) => {
  if (!url) return null;
  const match = url.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
  return match ? match[1] : null;
};

const ToolLogo = ({ tool }) => {
  const [fallbackIdx, setFallbackIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const domain = tool.url ? getDomain(tool.url) : null;
  const handle = extractTwitterHandle(tool.twitter || tool.builder?.twitter);
  const sources = [
    tool.logo,
    handle ? `https://unavatar.io/twitter/${handle}?fallback=false` : null,
    domain ? `https://logo.clearbit.com/${domain}?size=128` : null,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
  ].filter(Boolean);
  const currentSrc = sources[fallbackIdx];
  if (!currentSrc || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg rounded-[inherit]">
        {tool.name ? tool.name.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }
  return (
    <img
      src={currentSrc}
      alt={tool.name}
      onError={() => fallbackIdx + 1 < sources.length ? setFallbackIdx(prev => prev + 1) : setFailed(true)}
      className="w-full h-full object-contain rounded-[inherit]"
    />
  );
};

/* ── Protocol Card ── */
const ProtocolCard = ({ tool }) => {
  const rating = tool.averageRating || tool.rating || 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35 }}
      className="border border-gray-100 rounded-[1.25rem] p-4 flex flex-col bg-white hover:border-purple-200 hover:shadow-md transition-all group"
    >
      <div className="w-[50px] h-[50px] mb-3 bg-white rounded-[14px] shadow-sm border border-gray-100 p-1 flex-shrink-0 overflow-hidden">
        <ToolLogo tool={tool} />
      </div>
      <h4 className="font-bold text-[15px] leading-tight mb-1 text-gray-900 truncate group-hover:text-purple-700 transition-colors">{tool.name}</h4>
      <p className="text-[11px] text-gray-500 leading-snug line-clamp-2 mb-4 flex-grow tracking-wide">
        {tool.description || "Trade tokens on a decentralized network."}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          {rating > 0 ? (
            <>
              <Star className="w-3.5 h-3.5 text-gray-900 fill-gray-900" strokeWidth={1} />
              <span className="text-[13px] font-bold text-gray-900">{rating.toFixed(1)}</span>
            </>
          ) : (
            <span className="text-[12px] font-medium text-gray-400">No Rating</span>
          )}
        </div>
        <a href={tool.url} target="_blank" rel="noreferrer" className="bg-[#f2efff] text-[#6d39ff] px-4 py-1.5 rounded-full text-[11px] font-bold hover:bg-[#e8e2ff] transition-colors">
          Open
        </a>
      </div>
    </motion.div>
  );
};

/* ── Category Section Definitions ── */
const SECTIONS = [
  { key: "trading",     label: "Trading",          dbKeys: ["dex", "perps", "trading"],     comingSoon: false },
  { key: "bridges",     label: "Bridges",           dbKeys: ["interoperability", "bridges"], comingSoon: false },
  { key: "defi",        label: "DeFi",              dbKeys: ["defi"],                        comingSoon: false },
  { key: "staking",     label: "Staking",           dbKeys: ["staking"],                     comingSoon: false },
  { key: "rwa",         label: "RWA",               dbKeys: ["rwa"],                         comingSoon: false },
  { key: "security",    label: "Security",          dbKeys: ["security"],                    comingSoon: false },
  { key: "analytics",   label: "Analytics",         dbKeys: ["analytics"],                   comingSoon: false },
  { key: "wallets",     label: "Wallets",           dbKeys: ["wallets"],                     comingSoon: false },
  { key: "l2",          label: "Layer 2",           dbKeys: ["l2"],                          comingSoon: false },
  { key: "nft",         label: "NFT",               dbKeys: ["nft"],                         comingSoon: false },
  { key: "gaming",      label: "Gaming",            dbKeys: ["gaming"],                      comingSoon: true  },
  { key: "privacy",     label: "Privacy",           dbKeys: ["privacy"],                     comingSoon: true  },
  { key: "predictions", label: "Predictions",       dbKeys: ["predictions"],                 comingSoon: true  },
  { key: "community",   label: "Community",         dbKeys: ["communityTools", "community"], comingSoon: false },
];

/* ── Coming Soon Mini Card ── */
const ComingSoonSection = ({ label, sectionKey }) => (
  <div className="py-12 flex flex-col items-center justify-center text-center rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-dashed border-gray-200">
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/50 flex items-center justify-center mb-4 shadow-sm"
    >
      <Rocket size={22} className="text-purple-500" />
    </motion.div>
    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-widest">
      <motion.span
        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full bg-amber-500"
      />
      Coming Soon
    </div>
    <p className="text-gray-400 text-sm max-w-xs">
      We're curating the best <strong className="text-gray-500">{label}</strong> protocols. Check back soon.
    </p>
  </div>
);

/* ── Main Page ── */
export default function Apps() {
  const [appsData, setAppsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const sectionRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const toolsData = await fetchToolsData();
        setAppsData(toolsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getToolsForSection = (section) => {
    if (!appsData) return [];
    const tools = [];
    const ids = new Set();
    for (const dbKey of section.dbKeys) {
      const arr = appsData[dbKey] || [];
      for (const t of arr) {
        const id = t._id || t.id;
        if ((t.status === 'active' || !t.status) && !ids.has(id)) {
          tools.push(t);
          ids.add(id);
        }
      }
    }
    return tools.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
  };

  const scrollToSection = (key) => {
    setActiveFilter(key);
    if (key === "All") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = sectionRefs.current[key];
    if (el) {
      const offset = 100; // account for fixed navbar
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-6 pt-4">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Browse Apps</h1>
          <p className="text-gray-400 text-sm mt-1">Explore the best protocols across every Web3 category</p>
        </div>

        {/* Sticky Filter Pills */}
        <div className="sticky top-[64px] z-30 bg-white/90 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-gray-100 mb-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {[{ key: "All", label: "All" }, ...SECTIONS.map(s => ({ key: s.key, label: s.label }))].map(f => (
              <button
                key={f.key}
                onClick={() => scrollToSection(f.key)}
                className={`shrink-0 px-5 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                  activeFilter === f.key
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Sections */}
        <div className="space-y-12">
          {SECTIONS.map(section => {
            const tools = getToolsForSection(section);
            const displayTools = tools.slice(0, 6);
            const hasMore = tools.length > 6;

            return (
              <section
                key={section.key}
                ref={el => sectionRefs.current[section.key] = el}
                id={`section-${section.key}`}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black tracking-tight text-gray-900">{section.label}</h2>
                    {section.comingSoon && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                        Coming Soon
                      </span>
                    )}
                    {!section.comingSoon && tools.length > 0 && (
                      <span className="text-[11px] font-semibold text-gray-400">{tools.length} protocol{tools.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {hasMore && !section.comingSoon && (
                    <Link
                      to={`/apps/${section.key}`}
                      className="flex items-center gap-1 text-[13px] font-bold text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      See all <ChevronRight size={14} />
                    </Link>
                  )}
                </div>

                {/* Cards or Coming Soon */}
                {section.comingSoon || displayTools.length === 0 ? (
                  <ComingSoonSection label={section.label} sectionKey={section.key} />
                ) : (
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4 md:overflow-visible md:snap-none md:pb-0">
                    {displayTools.map(tool => (
                      <div key={tool._id || tool.id} className="min-w-[160px] max-w-[180px] shrink-0 snap-start md:min-w-0 md:max-w-none md:shrink">
                        <ProtocolCard tool={tool} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

      </div>
    </div>
  );
}
