import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, Zap, Shield, ChevronRight, CheckCircle2, Lock,
  ArrowUpRight, Gem, LayoutGrid, MessageSquare, Rocket, AlertCircle,
  Clock, Flame, Send, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";

export default function Quests() {
  const { user, setUser } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugForm, setBugForm] = useState({ title: '', description: '', url: '' });
  const [reportingBug, setReportingBug] = useState(false);
  
  const [startedQuests, setStartedQuests] = useState(() => {
    try {
      const saved = localStorage.getItem('started_quests');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('started_quests', JSON.stringify(startedQuests));
  }, [startedQuests]);

  useEffect(() => {
    fetchQuests();
  }, [user]);

  const fetchQuests = () => {
    const API_BASE = window.location.hostname === "localhost" ? "http://localhost:5000/api" : "/api";
    fetch(`${API_BASE}/quests`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          const enhanced = res.data.map(q => ({
            ...q,
            completed: user?.completedQuests?.includes(q.id) || user?.completedQuests?.includes(q._id)
          }));
          setQuests(enhanced);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleQuestAction = async (quest) => {
    const qId = quest._id || quest.id;
    if (quest.completed && quest.type !== 'daily-streak') return;

    // Daily login is a direct claim
    if (quest.type === 'daily-streak') {
      return claimQuest(qId);
    }

    // Bug report opens a modal
    if (quest.type === 'bug-report') {
      setShowBugModal(true);
      return;
    }

    // STEP 1: START QUEST (Open Link)
    if (!startedQuests.includes(qId)) {
      if (quest.targetUrl) {
        window.open(quest.targetUrl, '_blank');
      }
      setStartedQuests(prev => [...prev, qId]);
      return;
    }

    // STEP 2: VERIFY/CLAIM
    claimQuest(qId);
  };

  const claimQuest = async (qId, extraData = {}) => {
    setCompletingId(qId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/quests/${qId}/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(extraData)
      });
      const data = await res.json();
      
      if (data.success) {
        const updatedUser = { 
          ...user, 
          diamonds: data.diamonds, 
          totalXP: data.totalXP, 
          rank: data.rank,
          streak: data.streak,
          lastDailyClaim: data.lastDailyClaim || user.lastDailyClaim,
          completedQuests: [...(user.completedQuests || []), qId]
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setStartedQuests(prev => prev.filter(id => id !== qId));
        fetchQuests(); // Refresh to show completion
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Quest completion failed:', err);
      alert(err.message || 'Failed to complete quest. Please try again.');
    } finally {
      setCompletingId(null);
    }
  };

  const handleBugSubmit = async (e) => {
    e.preventDefault();
    setReportingBug(true);
    // Find bug quest id
    const bugQuest = quests.find(q => q.type === 'bug-report');
    if (bugQuest) {
      await claimQuest(bugQuest._id || bugQuest.id, { bugReport: bugForm });
      setShowBugModal(false);
      setBugForm({ title: '', description: '', url: '' });
    }
    setReportingBug(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'twitter-follow': return Star;
      case 'discord-join': return LayoutGrid;
      case 'daily-streak': return Flame;
      case 'community-post': return MessageSquare;
      case 'app-rating': return Trophy;
      case 'bug-report': return Shield;
      default: return Zap;
    }
  };

  const getColor = (cat) => {
    switch (cat) {
      case 'Social': return 'from-blue-500 to-indigo-600';
      case 'Daily': return 'from-orange-400 to-red-500';
      case 'Milestone': return 'from-purple-500 to-fuchsia-600';
      default: return 'from-slate-600 to-slate-800';
    }
  };

  const isClaimedToday = (type) => {
    if (type !== 'daily-streak') return false;
    const lastClaim = user?.lastDailyClaim ? new Date(user.lastDailyClaim) : null;
    return lastClaim && lastClaim.toDateString() === new Date().toDateString();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-32">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-100 pt-2 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6"
              >
                <Gem size={12} /> Architect Rewards
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6"
              >
                Level Up Your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Web3 Reputation</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-slate-500 font-medium leading-relaxed"
              >
                Complete verified ecosystem tasks, earn Diamonds, and climb the global leaderboard. 
                Your contribution shapes the future of the decentralized web.
              </motion.p>
            </div>

            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full lg:w-[400px] bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Trophy size={160} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                      <Flame size={24} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Streak</p>
                      <p className="text-lg font-black">{user?.streak || 0} Days</p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-xs font-black text-indigo-300 uppercase tracking-widest">
                    {user?.rank || 'Member'}
                  </div>
                </div>

                <div className="space-y-1 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Balance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{user?.diamonds || 0}</span>
                    <span className="text-indigo-400 font-bold flex items-center gap-1">
                      <Gem size={18} /> Diamonds
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Experience Points</span>
                    <span>{user?.totalXP || 0} XP</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((user?.totalXP || 0) / 1000) * 100, 100)}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quests Grid */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-[240px] bg-white rounded-[2rem] border border-slate-100 animate-pulse shadow-sm" />
            ))
          ) : (
            quests.map((quest, i) => {
              const Icon = getIcon(quest.type);
              const isStarted = startedQuests.includes(quest._id || quest.id);
              const isDone = quest.completed || isClaimedToday(quest.type);
              const isCompleting = completingId === (quest._id || quest.id);

              return (
                <motion.div
                  key={quest._id || quest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group bg-white p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col justify-between h-full
                    ${isDone ? 'border-emerald-100 opacity-80' : 'border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/30'}
                  `}
                >
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getColor(quest.category)} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                          <Gem size={14} className="fill-current" />
                          +{quest.reward}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{quest.category}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{quest.title}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2">{quest.description}</p>
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                    <button
                      disabled={isDone || isCompleting}
                      onClick={() => handleQuestAction(quest)}
                      className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2
                        ${isDone 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' 
                          : isCompleting
                            ? 'bg-slate-50 text-slate-400'
                            : isStarted
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:-translate-y-1'
                              : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl hover:-translate-y-1'
                        }
                      `}
                    >
                      {isDone ? (
                        <>Task Completed <CheckCircle2 size={16} /></>
                      ) : isCompleting ? (
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                      ) : isStarted ? (
                        <>Verify Activity <Shield size={16} /></>
                      ) : (
                        <>Start Quest <ArrowUpRight size={16} /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Bug Report Modal */}
      <AnimatePresence>
        {showBugModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBugModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowBugModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Report a Bug</h2>
                  <p className="text-sm text-slate-500 font-medium">Help us build a cleaner ecosystem.</p>
                </div>
              </div>

              <form onSubmit={handleBugSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Title</label>
                  <input 
                    required
                    type="text"
                    value={bugForm.title}
                    onChange={e => setBugForm({...bugForm, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20"
                    placeholder="e.g. Broken link on Uniswap page"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Context URL</label>
                  <input 
                    type="url"
                    value={bugForm.url}
                    onChange={e => setBugForm({...bugForm, url: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    required
                    value={bugForm.description}
                    onChange={e => setBugForm({...bugForm, description: e.target.value})}
                    className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 resize-none"
                    placeholder="What's not working as expected?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reportingBug}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {reportingBug ? 'Submitting...' : <>Submit Report & Claim Reward <Send size={18} /></>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
