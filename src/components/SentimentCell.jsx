import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export default function SentimentCell({ toolId, sentiment }) {
  const [bullCount, setBullCount] = useState(
    Array.isArray(sentiment?.bullish) ? sentiment.bullish.length : (typeof sentiment?.bullish === 'number' ? sentiment.bullish : 0)
  );
  const [bearCount, setBearCount] = useState(
    Array.isArray(sentiment?.bearish) ? sentiment.bearish.length : (typeof sentiment?.bearish === 'number' ? sentiment.bearish : 0)
  );
  const [userVote, setUserVote] = useState(sentiment?.userVote || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const bulls = Array.isArray(sentiment?.bullish) ? sentiment.bullish.length : (typeof sentiment?.bullish === 'number' ? sentiment.bullish : 0);
    const bears = Array.isArray(sentiment?.bearish) ? sentiment.bearish.length : (typeof sentiment?.bearish === 'number' ? sentiment.bearish : 0);
    setBullCount(bulls);
    setBearCount(bears);
    if (sentiment?.userVote) setUserVote(sentiment.userVote);
  }, [sentiment, toolId]);

  const total = bullCount + bearCount;
  const hasVotes = total > 0;
  const bullPct = hasVotes ? Math.round((bullCount / total) * 100) : 0;

  const handleVote = async (e, type) => {
    e.stopPropagation(); // Don't trigger row click
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`${API}/tools/${toolId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.success) {
        setBullCount(data.sentiment.bullish);
        setBearCount(data.sentiment.bearish);
        setUserVote(data.sentiment.userVote);
      }
    } catch (err) {
      console.error('Sentiment vote error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1 py-1" onClick={(e) => e.stopPropagation()}>
      {/* Percentage & Icon */}
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-black ${!hasVotes ? 'text-gray-400' : bullPct >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {hasVotes ? `${bullPct}%` : '—'}
        </span>

        {/* Voting Buttons: Exclusive Bull vs Bear */}
        <div className="flex items-center gap-0.5 bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/50">
          <button
            onClick={(e) => handleVote(e, 'bull')}
            disabled={loading}
            title={userVote === 'bull' ? "You voted Bullish (click to remove)" : "Vote Bullish 🚀"}
            className={`p-1 rounded-md text-[10px] font-bold transition-all ${
              userVote === 'bull'
                ? 'bg-emerald-500 text-white shadow-sm scale-105'
                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <TrendingUp size={11} />
          </button>

          <button
            onClick={(e) => handleVote(e, 'bear')}
            disabled={loading}
            title={userVote === 'bear' ? "You voted Bearish (click to remove)" : "Vote Bearish 🔻"}
            className={`p-1 rounded-md text-[10px] font-bold transition-all ${
              userVote === 'bear'
                ? 'bg-rose-500 text-white shadow-sm scale-105'
                : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
            }`}
          >
            <TrendingDown size={11} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-16 h-1 bg-gray-200/70 rounded-full overflow-hidden flex">
        {hasVotes ? (
          <>
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${bullPct}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${100 - bullPct}%` }}
            />
          </>
        ) : (
          <div className="h-full w-full bg-gray-200/80" />
        )}
      </div>
    </div>
  );
}
