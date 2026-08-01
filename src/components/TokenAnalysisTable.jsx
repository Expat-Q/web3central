import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import SentimentCell from './SentimentCell';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

const formatPrice = (val) => {
  if (!val && val !== 0) return '—';
  const num = Number(val);
  if (num >= 1000) return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;
  return `$${num.toFixed(6)}`;
};

const formatLargeNum = (val) => {
  if (!val) return '—';
  const num = Number(val);
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatSupply = (val, symbol) => {
  if (!val) return '—';
  const num = Number(val);
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B ${symbol || ''}`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M ${symbol || ''}`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K ${symbol || ''}`;
  return `${num.toLocaleString()} ${symbol || ''}`;
};

const PctChange = ({ val }) => {
  if (val === null || val === undefined || isNaN(Number(val))) return <span className="text-gray-300">—</span>;
  const num = Number(val);
  if (num === 0) return <span className="text-gray-400">0.00%</span>;
  const isUp = num > 0;
  return (
    <span className={`flex items-center gap-0.5 justify-end font-semibold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isUp ? '+' : ''}{num.toFixed(2)}%
    </span>
  );
};

export default function TokenAnalysisTable() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCoins = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/tools/token-market?page=1&per_page=100`);
        const data = await res.json();
        if (!cancelled && data.success) {
          setCoins(data.data || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load token data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCoins();
    // Refresh every 5 minutes
    const interval = setInterval(fetchCoins, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const totalPages = Math.max(1, Math.ceil(coins.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const displayCoins = coins.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section id="section-token-analysis" className="py-4 space-y-4">
      {/* Header — clean standard icon without AI gradient background */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Coins size={22} className="text-amber-500" />
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Token Analysis</h2>
            <p className="text-xs text-gray-500 font-medium">Live cryptocurrency market cap, prices, and sentiment</p>
          </div>
        </div>
        <a
          href="https://www.coingecko.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Powered by CoinGecko <ExternalLink size={9} />
        </a>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-black text-black uppercase tracking-widest bg-gray-50/40">
              <th className="py-4 px-3 sm:px-5 text-center w-10 sm:w-12 sticky left-0 z-30 bg-[#f9fafb]">#</th>
              <th className="py-4 px-3 sm:px-4 sticky left-[36px] sm:left-[48px] z-30 bg-[#f9fafb] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Name</th>
              <th className="py-4 px-3 sm:px-4 text-right">Price</th>
              <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[85px]">1h %</th>
              <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[85px]">24h %</th>
              <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[85px]">7d %</th>
              <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[120px]">Market Cap</th>
              <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[120px]">Volume(24h)</th>
              <th className="hidden sm:table-cell py-4 px-4 text-right min-w-[140px]">Circulating Supply</th>
              <th className="py-4 px-3 sm:px-4 text-center min-w-[110px] sm:min-w-[130px]">Sentiment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-4 px-3 sm:px-5 text-center sticky left-0 bg-white"><div className="h-3 w-6 bg-gray-100 rounded animate-pulse mx-auto" /></td>
                  <td className="py-4 px-3 sm:px-4 sticky left-[36px] sm:left-[48px] bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                        <div className="h-2 w-10 bg-gray-50 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-4 text-right"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse ml-auto" /></td>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="hidden sm:table-cell py-4 px-4 text-right"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse ml-auto" /></td>
                  ))}
                  <td className="py-4 px-3 sm:px-4 text-center"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse mx-auto" /></td>
                </tr>
              ))
            ) : error ? (
              <tr><td colSpan="10" className="py-12 text-center text-xs font-semibold text-gray-400">{error}</td></tr>
            ) : displayCoins.length > 0 ? (
              displayCoins.map((coin) => (
                <tr
                  key={coin.id}
                  className="hover:bg-[#fffdf5] transition-colors group cursor-pointer"
                  onClick={() => window.open(`https://www.coingecko.com/en/coins/${coin.id}`, '_blank')}
                >
                  {/* Rank */}
                  <td className="py-4 px-3 sm:px-5 text-center font-extrabold text-xs text-black sticky left-0 z-20 bg-white group-hover:bg-[#fffdf5]">
                    {coin.rank}
                  </td>

                  {/* Name & Logo */}
                  <td className="py-4 px-3 sm:px-4 sticky left-[36px] sm:left-[48px] z-20 bg-white group-hover:bg-[#fffdf5] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-100 shadow-sm"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate group-hover:text-amber-700 transition-colors block">
                          {coin.name}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                          {coin.symbol}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-3 sm:px-4 text-right font-bold text-xs text-gray-900">
                    {formatPrice(coin.price)}
                  </td>

                  {/* 1h % */}
                  <td className="hidden sm:table-cell py-4 px-4 text-right text-xs">
                    <PctChange val={coin.priceChange1h} />
                  </td>

                  {/* 24h % */}
                  <td className="hidden sm:table-cell py-4 px-4 text-right text-xs">
                    <PctChange val={coin.priceChange24h} />
                  </td>

                  {/* 7d % */}
                  <td className="hidden sm:table-cell py-4 px-4 text-right text-xs">
                    <PctChange val={coin.priceChange7d} />
                  </td>

                  {/* Market Cap */}
                  <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs text-gray-900">
                    {formatLargeNum(coin.marketCap)}
                  </td>

                  {/* Volume(24h) */}
                  <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs text-gray-900">
                    {formatLargeNum(coin.volume24h)}
                  </td>

                  {/* Circulating Supply */}
                  <td className="hidden sm:table-cell py-4 px-4 text-right font-semibold text-xs text-gray-600">
                    {formatSupply(coin.circulatingSupply, coin.symbol)}
                  </td>

                  {/* Sentiment */}
                  <td className="py-4 px-3 sm:px-4">
                    {(() => {
                      const upPct = coin.sentimentUpPercentage ?? 70;
                      const isBull = upPct >= 50;
                      return (
                        <div className="flex flex-col items-center justify-center gap-1 py-1" title={`CoinGecko Sentiment: ${upPct}% Bullish`}>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-black ${isBull ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {upPct}%
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isBull ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                            }`}>
                              {isBull ? '🚀 Bull' : '🔻 Bear'}
                            </span>
                          </div>
                          <div className="w-16 h-1 bg-gray-200/80 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${upPct}%` }} />
                            <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${100 - upPct}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="9" className="py-12 text-center text-xs font-semibold text-gray-400">No token data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {coins.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">
            Showing {(safePage - 1) * pageSize + 1} – {Math.min(safePage * pageSize, coins.length)} out of {coins.length}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
              Math.max(0, safePage - 3),
              Math.min(totalPages, safePage + 2)
            ).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${
                  p === safePage
                    ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200/50'
                    : 'border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-semibold">Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
