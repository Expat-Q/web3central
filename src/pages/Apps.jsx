import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchToolsData } from "../services/apiService";
import { Star } from "lucide-react";

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
  const twitterUrl = tool.twitter || tool.builder?.twitter;
  const twitterHandle = extractTwitterHandle(twitterUrl);

  const sources = [
    tool.logo,
    twitterHandle ? `https://unavatar.io/twitter/${twitterHandle}?fallback=false` : null,
    domain ? `https://logo.clearbit.com/${domain}?size=128` : null,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
  ].filter(Boolean);

  const currentSrc = sources[fallbackIdx];

  if (!currentSrc || failed) {
    return (
      <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg rounded-[inherit]">
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
      className="w-full h-full object-contain rounded-[inherit]"
    />
  );
};

const ProtocolCard = ({ tool }) => {
  const rating = tool.averageRating || tool.rating || 0;
  return (
    <div className="border border-gray-100 rounded-[1.25rem] p-4 flex flex-col bg-white hover:border-gray-200 transition-colors shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
      <div className="w-[50px] h-[50px] mb-3 bg-white rounded-[14px] shadow-sm border border-gray-100 p-1 flex-shrink-0">
        <ToolLogo tool={tool} />
      </div>
      <h4 className="font-bold text-[15px] leading-tight mb-1 text-gray-900 truncate">{tool.name}</h4>
      <p className="text-[11px] text-gray-500 leading-snug line-clamp-3 mb-4 flex-grow tracking-wide">
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
    </div>
  );
};

export default function Apps() {
  const [filter, setFilter] = useState("All");
  const [appsData, setAppsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const filters = [
    "All",
    "Trading", "Bridges", "DeFi", "Staking", "RWA",
    "Security", "Analytics", "Wallets", "L2",
    "NFT", "Gaming", "Privacy", "Predictions", "Community"
  ];

  const catMap = {
    "Trading": "trading",
    "Bridges": "bridges",
    "DeFi": "defi",
    "Staking": "staking",
    "RWA": "rwa",
    "Security": "security",
    "Analytics": "analytics",
    "Wallets": "wallets",
    "L2": "l2",
    "NFT": "nft",
    "Gaming": "gaming",
    "Privacy": "privacy",
    "Predictions": "predictions",
    "Community": "community",
  };

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

  const displayTools = useMemo(() => {
    if (!appsData) return [];

    let source = [];
    if (filter === "All") {
      source = Object.values(appsData).flat();
    } else {
      source = appsData[catMap[filter]] || [];
    }
    
    const unique = [];
    const ids = new Set();
    for (const t of source) {
      if ((t.status === 'active' || !t.status) && !ids.has(t._id || t.id)) {
        unique.push(t);
        ids.add(t._id || t.id);
      }
    }
    
    return unique.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
  }, [appsData, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#6d39ff]/30 border-t-[#6d39ff] rounded-full animate-spin"></div>
      </div>
    );
  }

  const featured = displayTools.length > 0 ? displayTools[0] : null;
  const trending = displayTools.slice(1, 5);
  const newProtocols = displayTools.slice(5, 9);

  return (
    <div className="bg-[#f0f2f5] min-h-screen pt-24 pb-12 px-4 font-sans text-gray-900 flex justify-center">
      <div className="w-full bg-white rounded-[24px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit max-w-7xl">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-[14px] text-[13px] font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-[#7042F8] text-white shadow-[0_4px_12px_rgba(112,66,248,0.25)]' : 'bg-[#F4F5F7] text-[#4b5563] hover:bg-[#EBECEF]'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Featured Card */}
        {featured && (
          <div className="mb-10 w-full rounded-[20px] bg-gradient-to-r from-[#7b1bf7] to-[#12a1ff] p-7 md:p-8 flex items-center gap-6 shadow-md relative overflow-hidden">
            <div className="w-24 h-24 bg-white rounded-[20px] p-2 flex-shrink-0 shadow-lg relative z-10">
               <ToolLogo tool={featured} />
            </div>
            <div className="relative z-10 flex flex-col items-start gap-1">
              <h2 className="text-white text-[28px] font-bold leading-none">{featured.name}</h2>
              <p className="text-white/80 text-[13px] mb-3 font-medium max-w-sm tracking-wide line-clamp-2">
                {featured.description || "Trade tokens on a decentralized network."}
              </p>
              <a href={featured.url} target="_blank" rel="noreferrer" className="bg-white text-[#6d39ff] px-6 py-2 rounded-full text-[13px] font-bold hover:shadow-lg transition-all">
                Open
              </a>
            </div>
          </div>
        )}

        {/* Trending Grid */}
        {trending.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold tracking-tight text-gray-900">Trending</h3>
              {filter !== 'All' && catMap[filter] && (
                <Link to={`/apps/${catMap[filter]}`} className="text-[13px] font-bold text-[#7042F8] hover:underline">
                  Show More →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trending.map(t => <ProtocolCard key={t._id || t.id} tool={t} />)}
            </div>
          </div>
        )}

        {/* New Protocols Grid */}
        {newProtocols.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold tracking-tight text-gray-900">New Protocols</h3>
              {filter !== 'All' && catMap[filter] && (
                <Link to={`/apps/${catMap[filter]}`} className="text-[13px] font-bold text-[#7042F8] hover:underline">
                  Show More →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {newProtocols.map(t => <ProtocolCard key={t._id || t.id} tool={t} />)}
            </div>
          </div>
        )}

        {displayTools.length === 0 && (
          <div className="text-center py-24 text-gray-400 font-medium">No protocols found for {filter}</div>
        )}
      </div>
    </div>
  );
}
