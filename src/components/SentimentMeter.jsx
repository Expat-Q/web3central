import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export default function SentimentMeter({ toolId, initialSentiment }) {
  const [bullCount, setBullCount] = useState(initialSentiment?.bullish?.length || 0);
  const [bearCount, setBearCount] = useState(initialSentiment?.bearish?.length || 0);
  const [userVote, setUserVote] = useState(null);
  const [voterId, setVoterId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(null);

  // Sync state if initialSentiment changes (e.g. user opens a different protocol)
  useEffect(() => {
    setBullCount(initialSentiment?.bullish?.length || 0);
    setBearCount(initialSentiment?.bearish?.length || 0);
    setUserVote(null); // Reset user vote since we don't know it on the client yet without an API call
  }, [initialSentiment, toolId]);

  const totalVotes = bullCount + bearCount;
  const bullPercent = totalVotes > 0 ? Math.round((bullCount / totalVotes) * 100) : 50;
  const bearPercent = totalVotes > 0 ? 100 - bullPercent : 50;

  const handleVote = async (type) => {
    if (loading) return;
    setLoading(true);
    setAnimating(type);
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
        setVoterId(data.sentiment.voterId);
      }
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(null), 600);
    }
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Community Sentiment</p>
        {totalVotes > 0 && (
          <span className="text-[10px] text-gray-300 font-medium">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Vote Buttons */}
      <div className="flex gap-2 mb-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleVote('bull')}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            userVote === 'bull'
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100'
              : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
          }`}
        >
          <AnimatePresence mode="wait">
            {animating === 'bull' ? (
              <motion.div
                key="anim"
                initial={{ y: 0 }}
                animate={{ y: [-4, 0, -2, 0] }}
                transition={{ duration: 0.4 }}
              >
                <TrendingUp size={16} />
              </motion.div>
            ) : (
              <TrendingUp size={16} />
            )}
          </AnimatePresence>
          Bullish
          {bullCount > 0 && <span className="text-xs opacity-70">({bullCount})</span>}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleVote('bear')}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
            userVote === 'bear'
              ? 'bg-red-50 text-red-500 border-red-200 shadow-sm shadow-red-100'
              : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          }`}
        >
          <AnimatePresence mode="wait">
            {animating === 'bear' ? (
              <motion.div
                key="anim"
                initial={{ y: 0 }}
                animate={{ y: [4, 0, 2, 0] }}
                transition={{ duration: 0.4 }}
              >
                <TrendingDown size={16} />
              </motion.div>
            ) : (
              <TrendingDown size={16} />
            )}
          </AnimatePresence>
          Bearish
          {bearCount > 0 && <span className="text-xs opacity-70">({bearCount})</span>}
        </motion.button>
      </div>

      {/* Progress Bar */}
      {totalVotes > 0 && (
        <div className="relative">
          <div className="flex rounded-full overflow-hidden h-2 bg-gray-100">
            <motion.div
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-l-full"
              initial={{ width: '50%' }}
              animate={{ width: `${bullPercent}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
            <motion.div
              className="bg-gradient-to-r from-red-400 to-red-500 rounded-r-full"
              initial={{ width: '50%' }}
              animate={{ width: `${bearPercent}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] font-bold text-emerald-500">{bullPercent}% Bull</span>
            <span className="text-[10px] font-bold text-red-400">{bearPercent}% Bear</span>
          </div>
        </div>
      )}
    </div>
  );
}
