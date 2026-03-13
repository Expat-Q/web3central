import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Tooltip from "../components/Tooltip";
import { fetchToolsData } from "../services/apiService";

export default function Apps() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [appsData, setAppsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const toolsData = await fetchToolsData();

        // Map the backend data to our category-based structure
        const transformedApps = [
          {
            id: "interoperability",
            name: "Interoperability Bridges",
            path: "/apps/interoperability",
            desc: "Connect across multiple blockchains effortlessly.",
            data: toolsData.interoperability || []
          },
          {
            id: "dex",
            name: "Decentralized Exchanges (DEX)",
            path: "/apps/dex",
            desc: "Trade assets peer-to-peer securely.",
            data: toolsData.dex || []
          },
          {
            id: "perps",
            name: "Perps",
            path: "/apps/perps",
            desc: "Perpetuals & derivatives platforms deep liquidity.",
            data: toolsData.perps || []
          },
          {
            id: "bountyHub",
            name: "Bounty Hub",
            path: "/apps/bounty-hub",
            desc: "Discover Web3 bounties, quest systems, and earn-to-learn opportunities.",
            data: toolsData.bountyHub || []
          },
          {
            id: "onchainAutonomy",
            name: "Onchain Autonomy",
            path: "/apps/onchain-autonomy",
            desc: "Automate transactions and agent workflows.",
            data: toolsData.onchainAutonomy || []
          },
          {
            id: "communityTools",
            name: "Community Tools",
            path: "/apps/community-tools",
            desc: "Governance and collaboration for Web3.",
            data: toolsData.communityTools || []
          }
        ];

        setAppsData(transformedApps);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // SEARCH + FILTER (optimized)
  const filtered = useMemo(() => {
    if (!appsData) return [];
    const q = query.trim().toLowerCase();

    return appsData.filter((app) => {
      // filter category
      if (filter !== "all" && app.id !== filter) return false;

      // search query
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.desc.toLowerCase().includes(q)
      );
    });
  }, [appsData, query, filter]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-white">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium text-sm mt-4">Fetching data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-xl text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!appsData) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-xl text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-32 pb-20 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="glow-overlay w-[600px] h-[600px] bg-indigo-500/10 top-[-10%] left-[-10%]" />
      <div className="glow-overlay w-[500px] h-[500px] bg-purple-500/10 bottom-[-10%] right-[-10%]" />

      {/* Header */}
      <div className="max-w-7xl mx-auto relative z-10 text-center mb-16">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-bold text-indigo-500 tracking-wider uppercase mb-8"
        >
          Protocol Directory
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-5xl font-bold mb-8 tracking-tight text-gray-900"
        >
          Web3Central <span className="text-purple-600">dApps</span>
        </motion.h1>
        <p className="text-gray-500 text-lg md:text-xl max-w-3xl mx-auto font-medium">
          The industry's most trusted directory for decentralized protocols and tools.
          Vetted, analyzed, and ready for institutional exploration.
        </p>
      </div>

      {/* Search + Filter Container */}
      <div className="max-w-7xl mx-auto px-4 mb-20">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
          <div className="relative flex-grow w-full">
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search protocols, categories, or tech stacks..."
              className="w-full bg-transparent border-none px-6 py-3 text-gray-900 focus:outline-none placeholder:text-gray-400 font-medium"
            />
            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-purple-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
              </svg>
            </div>
          </div>

          <div className="h-10 w-px bg-white/10 hidden md:block" />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-64 bg-gray-50 border border-gray-200 md:border-gray-200 rounded-xl md:rounded-xl px-6 py-3 text-sm font-medium text-gray-600 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {appsData.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Featured Marquee Section */}
      <section className="max-w-7xl mx-auto mb-24">
        <div className="flex items-center gap-4 mb-10 px-6">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-xl">🔥</div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Featured Protocols</h2>
        </div>

        <div className="relative overflow-hidden group">
          <div className="flex gap-8 animate-marquee py-4">
            {appsData.flatMap(category =>
              category.data ? category.data.filter(tool => tool.trending).slice(0, 2) : []
            ).concat(
              appsData.flatMap(category =>
                category.data ? category.data.filter(tool => tool.trending).slice(0, 2) : []
              )
            ).map((tool, i) => (
              <div
                key={`${tool.id}-${i}`}
                className="min-w-[380px] p-8 group/item hover:scale-[1.02] transition-transform duration-500 bg-white border border-gray-200 rounded-2xl shadow-sm"
                style={{ "--card-glow": "rgba(168, 85, 247, 0.2)" }}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">{tool.name}</h3>
                  <span className="bg-purple-50 text-purple-600 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-purple-100">Featured</span>
                </div>

                <p className="text-gray-500 text-base mb-8 font-medium leading-relaxed line-clamp-2">
                  {tool.description || tool.desc}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-2">
                    {tool.tags && tool.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{tag}</span>
                    ))}
                  </div>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover/item:scale-110 transition-transform"
                  >
                    ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 20s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}</style>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.flatMap(category =>
              category.data ? category.data.map(tool => ({ ...tool, category: category })) : []
            ).map((tool, i) => (
              <motion.div
                key={`${tool.id}-${i}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.8, ease: "easeOut" }}
                whileHover={{ y: -8 }}
                className="bg-white border border-gray-200 p-10 rounded-2xl flex flex-col group shadow-sm hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer"
                style={{ "--card-glow": "rgba(99, 102, 241, 0.15)" }}
                onClick={() => window.location.href = tool.category.path}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 group-hover:text-purple-600 transition-colors">{tool.name}</h3>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {tool.verified && (
                      <span className="w-6 h-6 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[10px] text-green-400" title="Verified Protocol">✓</span>
                    )}
                    {tool.trending && (
                      <span className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[10px] text-orange-400">🔥</span>
                    )}
                  </div>
                </div>

                <p className="text-gray-500 text-base mb-10 font-medium leading-relaxed">
                  {tool.description || tool.desc}
                </p>

                {/* Tags & visit link */}
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-2 mb-10">
                    {tool.tags && tool.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 text-[10px] rounded-lg bg-gray-50 text-gray-500 border border-gray-100 font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white">
                        {tool.builder && tool.builder.name ? tool.builder.name.charAt(0) : '?'}
                      </div>
                      <span className="text-xs font-medium text-gray-500">{tool.builder?.name || 'Verified Tool'}</span>
                    </div>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold transition-all shadow-lg shadow-purple-200 hover:bg-purple-700 hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                      Launch Tool
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 p-20 rounded-2xl text-center text-gray-500 text-lg font-medium">
            No protocols found. Try adjusting your search.
          </div>
        )}

        {/* CTA */}
        <div className="mt-32">
          <div className="hi-fi-card p-16 text-center relative overflow-hidden group" style={{ "--card-glow": "rgba(244, 114, 182, 0.2)" }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-pink-500/5" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-gray-900">Expand the Directory</h2>
            <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto font-medium">
              Are you a builder? Feature your protocol on web3central and reach institutional analysts.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/submit-tool" className="btn-primary px-12 py-4">
                Submit dApp
              </Link>
              <Link to="/support" className="btn-secondary px-12 py-4">
                Partner Inquiries
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
