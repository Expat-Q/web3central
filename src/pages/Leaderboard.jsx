import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchLeaderboard } from '../services/apiService';
import { Trophy, Medal, Zap, Star, TrendingUp, Twitter, ExternalLink, Search, Gem } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard()
      .then(setLeaders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Medal size={24} className="text-yellow-500 fill-current" />;
    if (index === 1) return <Medal size={24} className="text-slate-400 fill-current" />;
    if (index === 2) return <Medal size={24} className="text-amber-600 fill-current" />;
    return <span className="text-gray-400 font-black italic">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-white pt-2 pb-20 px-6 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-yellow-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-40" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-40" />

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-amber-200"
          >
            <Trophy size={40} className="text-white fill-current" />
          </motion.div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">Leaderboard</h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-sm">Ranking Top Diamond XP Holders</p>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-50 rounded-3xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {leaders.map((leader, index) => {
              const isMe = currentUser?.id === leader.id;
              return (
                <motion.div
                  key={leader.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative p-5 rounded-[2.5rem] flex items-center justify-between border transition-all hover:scale-[1.02] active:scale-[0.98]
                    ${isMe 
                      ? 'bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-100/50' 
                      : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm shrink-0">
                      {getRankIcon(index)}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-900 shadow-md border-2 border-white shrink-0">
                        {leader.avatarUrl ? (
                          <img src={leader.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {leader.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-gray-900 text-lg leading-none">
                            {leader.name}
                          </h3>
                          {isMe && <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{leader.rank}</span>
                          {leader.twitter && (
                            <a 
                              href={`https://x.com/${leader.twitter.replace('@', '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sky-500 hover:text-sky-600 transition-colors"
                            >
                              <Twitter size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <Gem size={14} className="fill-current" />
                        <span className="text-xl font-black">{leader.diamonds || 0}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diamond XP</span>
                    </div>
                    
                    <div className="hidden md:flex flex-col items-end border-l border-gray-100 pl-8">
                      <div className="flex items-center gap-1.5 text-indigo-500">
                        <TrendingUp size={14} />
                        <span className="text-xl font-black">{leader.totalXP || 0}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total XP</span>
                    </div>
                  </div>

                  {/* Decorative Glow for Top 3 */}
                  {index < 3 && (
                    <div className={`absolute inset-0 -z-10 blur-3xl opacity-10 rounded-full
                      ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-400' : 'bg-amber-600'}`} 
                    />
                  )}
                </motion.div>
              );
            })}

            {leaders.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                <Search size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-800 font-bold">No entries found yet.</p>
                <p className="text-gray-400 text-sm">Be the first to complete a quest and top the charts!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
