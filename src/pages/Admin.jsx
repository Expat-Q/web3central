import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  fetchPendingTools, updateToolStatus, deleteTool, 
  fetchPendingClaims, approveClaim, rejectClaim, 
  generateCryptoNews, createCourse,
  createQuest, fetchQuests, updateQuest, deleteQuest,
  fetchCommunitySpotlight, updateCommunitySpotlight,
  fetchStatsOverview,
  fetchLatestNews, updateNewsArticle, deleteNewsArticle, publishNewsArticle,
  fetchCuratedCourses, updateCuratedCourse, deleteCuratedCourse
} from '../services/apiService';
import { 
  Settings, CheckCircle2, XCircle, Trash2, Shield, 
  ExternalLink, MessageSquare, Plus, Star, Search,
  LayoutGrid, Rocket, Users, AlertCircle, FileText,
  BookOpen, Zap, Sparkles, Edit3, X, Save, RefreshCw
} from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingTools, setPendingTools] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questsList, setQuestsList] = useState([]);
  const [spotlightData, setSpotlightData] = useState(null);

  // Form States
  const [newsConfig, setNewsConfig] = useState({ query: 'Ethereum layer 2 scaling', count: 3 });
  const [generatingNews, setGeneratingNews] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', url: '', platform: 'YouTube', level: 'Beginner' });
  const [savingCourse, setSavingCourse] = useState(false);
  
  const [newQuest, setNewQuest] = useState({ title: '', description: '', reward: 50, category: 'Social', type: 'link', targetUrl: '' });
  const [savingQuest, setSavingQuest] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  
  const [updatingSpotlight, setUpdatingSpotlight] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [curatedCourses, setCuratedCourses] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [newManualNews, setNewManualNews] = useState({ title: '', shortDescription: '', thumbnailUrl: '', tags: '', contentMarkdown: '' });
  const [publishingNews, setPublishingNews] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tools, claims, q, stats, spotlight, news, courses] = await Promise.all([
        fetchPendingTools(),
        fetchPendingClaims(),
        fetchQuests(true),
        fetchStatsOverview(),
        fetchCommunitySpotlight(),
        fetchLatestNews(),
        fetchCuratedCourses()
      ]);
      setPendingTools(tools?.data || []);
      setPendingClaims(claims?.claims || []);
      setQuestsList(q?.data || []);
      setStats(stats);
      setSpotlightData(spotlight);
      setNewsArticles(news || []);
      setCuratedCourses(courses || []);
    } catch (err) {
      console.error('Admin data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleReviewTool = async (id, status) => {
    try {
      await updateToolStatus(id, status);
      setPendingTools(prev => prev.filter(t => t._id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleApproveClaim = async (id, profileId) => {
    try {
      await approveClaim(id, profileId);
      setPendingClaims(prev => prev.filter(c => c._id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleRejectClaim = async (id, profileId) => {
    if (!window.confirm('Reject this developer claim?')) return;
    try {
      await rejectClaim(id, profileId);
      setPendingClaims(prev => prev.filter(c => c._id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleCreateQuest = async (e) => {
    e.preventDefault();
    setSavingQuest(true);
    try {
      const questData = {
        ...newQuest,
        id: newQuest.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      };
      await createQuest(questData);
      setNewQuest({ title: '', description: '', reward: 50, category: 'Social', type: 'link', targetUrl: '' });
      loadData();
    } catch (err) { alert(err.message); }
    finally { setSavingQuest(false); }
  };

  const handleUpdateQuest = async (e) => {
    e.preventDefault();
    try {
      await updateQuest(editingQuest._id, editingQuest);
      setEditingQuest(null);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleUpdateQuestStatus = async (id, status) => {
    try {
      await updateQuest(id, { status });
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteQuest = async (id, title) => {
    if (!window.confirm(`Delete quest "${title}"?`)) return;
    try {
      await deleteQuest(id);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleUpdateNews = async (e) => {
    e.preventDefault();
    try {
      await updateNewsArticle(editingNews._id, editingNews);
      setEditingNews(null);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteNews = async (id, title) => {
    if (!window.confirm(`Delete news article "${title}"?`)) return;
    try {
      await deleteNewsArticle(id);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      await updateCuratedCourse(editingCourse._id, editingCourse);
      setEditingCourse(null);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Delete course "${title}"?`)) return;
    try {
      await deleteCuratedCourse(id);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handlePublishManualNews = async (e) => {
    e.preventDefault();
    setPublishingNews(true);
    try {
      const newsData = {
        ...newManualNews,
        tags: newManualNews.tags.split(',').map(t => t.trim()).filter(t => t),
        publishedAt: new Date()
      };
      await publishNewsArticle(newsData);
      setNewManualNews({ title: '', shortDescription: '', thumbnailUrl: '', tags: '', contentMarkdown: '' });
      alert('News article published!');
      loadData();
    } catch (err) { alert(err.message); }
    finally { setPublishingNews(false); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'review', label: 'Manage Tools', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'quests', label: 'Quests', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'content', label: 'Content Engine', icon: Rocket, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'spotlight', label: 'Builder Spotlight', icon: Users, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#fafafa]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-red-100">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Access Denied</h1>
          <p className="text-slate-500 font-medium">Administrator privileges are required to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pt-12 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                <Shield size={20} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin <span className="text-indigo-600">Command Center</span></h1>
            </div>
            <p className="text-slate-500 font-medium">Manage tools, lessons, and monitor platform health.</p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">System Online</span>
          </div>
        </header>

        <div className="mb-12 bg-white p-1 rounded-[1.5rem] border border-slate-100 shadow-sm inline-flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? `bg-[#4F46E5] text-white shadow-lg shadow-indigo-200` 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.id === 'review' && pendingTools.length > 0 && (
                <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                  {pendingTools.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-12">
          
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:border-indigo-100 transition-all duration-500">
                <div className="w-20 h-20 bg-blue-50/50 text-blue-600 rounded-[1.5rem] flex items-center justify-center shrink-0">
                  <Users size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Registered Users</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats?.users || 0}</h3>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:border-emerald-100 transition-all duration-500">
                <div className="w-20 h-20 bg-emerald-50/50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shrink-0">
                  <LayoutGrid size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Active Tools</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats?.activeTools || 0}</h3>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:border-amber-100 transition-all duration-500">
                <div className="w-20 h-20 bg-amber-50/50 text-amber-600 rounded-[1.5rem] flex items-center justify-center shrink-0">
                  <RefreshCw size={32} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Pending Reviews</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stats?.pendingTools || 0}</h3>
                </div>
              </div>
            </div>
          )}

          {/* ── REVIEWS TAB ── */}
          {activeTab === 'review' && (
            <div className="grid grid-cols-1 gap-12">
              {/* Tool Submissions */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <LayoutGrid size={24} className="text-blue-500" />
                    Protocol Submissions
                    <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black">{pendingTools.length}</span>
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingTools.map(tool => (
                    <AdminCard key={tool._id} title={tool.name} subtitle={tool.category} desc={tool.description}>
                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
                        <SafeLink href={tool.url} className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:underline">
                          View Site <ExternalLink size={12} />
                        </SafeLink>
                        <div className="flex gap-2">
                          <button onClick={() => handleReviewTool(tool._id, 'approved')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                            <CheckCircle2 size={20} />
                          </button>
                          <button onClick={() => handleReviewTool(tool._id, 'rejected')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <XCircle size={20} />
                          </button>
                        </div>
                      </div>
                    </AdminCard>
                  ))}
                  {pendingTools.length === 0 && <EmptyState text="No pending protocol submissions." />}
                </div>
              </section>

              {/* Developer Claims */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Shield size={24} className="text-indigo-500" />
                    Developer Claims
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black">{pendingClaims.length}</span>
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingClaims.map(claim => (
                    <AdminCard key={claim._id} title={claim.toolName || 'Project Claim'} subtitle={`User: ${claim.developer?.name || claim.developer?.email}`} desc={`Claim Status: ${claim.status}`}>
                      <div className="mt-6 flex gap-3">
                        <button onClick={() => handleApproveClaim(claim._id, claim.developer?.profileId)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                          Approve Claim
                        </button>
                        <button onClick={() => handleRejectClaim(claim._id, claim.developer?.profileId)} className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                          Reject
                        </button>
                      </div>
                    </AdminCard>
                  ))}
                  {pendingClaims.length === 0 && <EmptyState text="No pending developer claims." />}
                </div>
              </section>
            </div>
          )}

          {/* ── QUESTS TAB ── */}
          {activeTab === 'quests' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Form Section */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm sticky top-32">
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-amber-500" /> New Quest
                  </h2>
                  <form onSubmit={handleCreateQuest} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                      <input 
                        required
                        type="text" 
                        value={newQuest.title} 
                        onChange={e => setNewQuest({ ...newQuest, title: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20" 
                        placeholder="Quest title..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                      <textarea 
                        required
                        value={newQuest.description} 
                        onChange={e => setNewQuest({ ...newQuest, description: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 resize-none" 
                        rows={3}
                        placeholder="What should the user do?"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reward</label>
                        <input 
                          type="number" 
                          value={newQuest.reward} 
                          onChange={e => setNewQuest({ ...newQuest, reward: parseInt(e.target.value) })} 
                          className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                        <select 
                          value={newQuest.type} 
                          onChange={e => setNewQuest({ ...newQuest, type: e.target.value })} 
                          className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 appearance-none"
                        >
                          <option value="link">Link Click</option>
                          <option value="twitter-follow">X Follow</option>
                          <option value="discord-join">Discord Join</option>
                          <option value="community-post">Community Post</option>
                          <option value="app-rating">App Rating</option>
                          <option value="daily-streak">Daily Streak</option>
                          <option value="bug-report">Bug Report</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={savingQuest} 
                      className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                      {savingQuest ? 'Creating...' : 'Create Quest'}
                    </button>
                  </form>
                </div>
              </div>

              {/* List Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-900">Active Ecosystem Quests</h2>
                    <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-4 py-1.5 rounded-full uppercase tracking-widest">{questsList.length} total</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {questsList.map(quest => (
                      <div key={quest._id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start gap-6">
                          <div className={`w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 shrink-0`}>
                            {quest.reward}
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{quest.title}</h3>
                            <p className="text-sm text-slate-500 font-medium line-clamp-1 mb-2">{quest.description}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{quest.category}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">•</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{quest.type}</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                quest.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {quest.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setEditingQuest(quest)}
                            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => handleUpdateQuestStatus(quest._id, quest.status === 'active' ? 'ended' : 'active')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                              quest.status === 'active' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}
                          >
                            {quest.status === 'active' ? 'End' : 'Start'}
                          </button>
                          <button 
                            onClick={() => handleDeleteQuest(quest._id, quest.title)}
                            className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTENT ENGINE TAB ── */}
          {activeTab === 'content' && (
            <div className="space-y-12">
              {/* Manual News Editor */}
              <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Crypto News Engine</h2>
                    <p className="text-slate-500 font-medium">Draft and publish manual ecosystem updates.</p>
                  </div>
                </div>

                <form onSubmit={handlePublishManualNews} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">News Headline *</label>
                      <input required value={newManualNews.title} onChange={e => setNewManualNews({...newManualNews, title: e.target.value})} placeholder="Bitcoin surpasses new ATH..." className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Description *</label>
                      <input required value={newManualNews.shortDescription} onChange={e => setNewManualNews({...newManualNews, shortDescription: e.target.value})} placeholder="A brief summary for the card..." className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thumbnail Image URL *</label>
                      <input required value={newManualNews.thumbnailUrl} onChange={e => setNewManualNews({...newManualNews, thumbnailUrl: e.target.value})} placeholder="https://image-url.jpg" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags (Comma Separated)</label>
                      <input value={newManualNews.tags} onChange={e => setNewManualNews({...newManualNews, tags: e.target.value})} placeholder="DeFi, Market, Security" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Markdown Content Body *</label>
                    <textarea required rows={10} value={newManualNews.contentMarkdown} onChange={e => setNewManualNews({...newManualNews, contentMarkdown: e.target.value})} placeholder="# Write your news content here in Markdown..." className="w-full bg-[#0f172a] text-slate-300 border border-slate-800 p-8 rounded-3xl font-mono text-sm leading-relaxed outline-none focus:ring-4 focus:ring-indigo-500/10" />
                  </div>
                  <button type="submit" disabled={publishingNews} className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest text-sm">
                    {publishingNews ? 'Publishing to Chain...' : 'Publish News Article'}
                  </button>
                </form>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* News Generator */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">AI News Engine</h2>
                      <p className="text-sm text-slate-500 font-medium">Generate real-time crypto ecosystem updates.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Context</label>
                      <input 
                        type="text" 
                        value={newsConfig.query} 
                        onChange={e => setNewsConfig({ ...newsConfig, query: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5"
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        setGeneratingNews(true);
                        try { await generateCryptoNews(newsConfig.query, newsConfig.count); alert('News generated successfully!'); loadData(); }
                        catch (err) { alert(err.message); }
                        finally { setGeneratingNews(false); }
                      }}
                      disabled={generatingNews}
                      className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                      {generatingNews ? 'Synthesizing...' : 'Generate New Briefs'}
                    </button>
                  </div>
                </section>

                {/* Course Manager */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Curated Courses</h2>
                      <p className="text-sm text-slate-500 font-medium">Add high-signal external educational content.</p>
                    </div>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingCourse(true);
                    try { await createCourse(newCourse); setNewCourse({ title: '', url: '', platform: 'YouTube', level: 'Beginner' }); alert('Course added!'); loadData(); }
                    catch (err) { alert(err.message); }
                    finally { setSavingCourse(false); }
                  }} className="space-y-4">
                    <input required placeholder="Course Title" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none" />
                    <input required placeholder="External URL" value={newCourse.url} onChange={e => setNewCourse({...newCourse, url: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <select value={newCourse.platform} onChange={e => setNewCourse({...newCourse, platform: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none">
                        <option>YouTube</option><option>Mirror</option><option>Medium</option><option>Official Docs</option>
                      </select>
                      <select value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none">
                        <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                      </select>
                    </div>
                    <button type="submit" disabled={savingCourse} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all uppercase tracking-widest text-xs">
                      {savingCourse ? 'Indexing...' : 'Publish Course'}
                    </button>
                  </form>
                </section>
              </div>

              {/* News & Courses Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Existing News */}
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    Existing News Articles
                  </h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {newsArticles.map(article => (
                      <div key={article._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                        <div className="min-w-0 flex-1 mr-4">
                          <h4 className="font-bold text-slate-900 truncate">{article.title}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(article.publishedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingNews(article)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeleteNews(article._id, article.title)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {newsArticles.length === 0 && <EmptyState text="No news articles found" />}
                  </div>
                </div>

                {/* Existing Courses */}
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-600" />
                    Curated Academy Content
                  </h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {curatedCourses.map(course => (
                      <div key={course._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
                        <div className="min-w-0 flex-1 mr-4">
                          <h4 className="font-bold text-slate-900 truncate">{course.title}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.platform} • {course.level}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingCourse(course)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDeleteCourse(course._id, course.title)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {curatedCourses.length === 0 && <EmptyState text="No curated courses found" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SPOTLIGHT TAB ── */}
          {activeTab === 'spotlight' && spotlightData && (
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm max-w-4xl mx-auto space-y-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center">
                  <Users size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Builder Spotlight</h2>
                  <p className="text-slate-500 font-medium">Feature a visionary builder on the ecosystem homepage.</p>
                </div>
              </div>

              {(() => {
                const bs = spotlightData?.[0]?.builderSpotlight || spotlightData?.builderSpotlight || {};
                return (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setUpdatingSpotlight(true);
                    try {
                      const form = e.target;
                      const featuredTools = [];
                      for (let i = 0; i < 2; i++) {
                        const name = form[`ft_name_${i}`]?.value;
                        if (name) featuredTools.push({ name, description: form[`ft_desc_${i}`]?.value || '', initial: form[`ft_init_${i}`]?.value || name.charAt(0) });
                      }
                      await updateCommunitySpotlight({
                        builderSpotlight: {
                          name: form.bs_name.value, role: form.bs_role.value, description: form.bs_description.value,
                          story: form.bs_story.value, twitter: form.bs_twitter.value, xProfileImageUrl: form.bs_pfp.value,
                          featuredTools,
                        }
                      });
                      alert('Spotlight updated!');
                    } catch (err) { alert(err.message); }
                    finally { setUpdatingSpotlight(false); }
                  }} className="space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Builder Name" name="bs_name" val={bs.name} />
                      <FormField label="Role / Title" name="bs_role" val={bs.role} />
                      <FormField label="X / Twitter URL" name="bs_twitter" val={bs.twitter} />
                      <FormField label="PFP URL" name="bs_pfp" val={bs.xProfileImageUrl} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tagline</label>
                      <textarea name="bs_description" defaultValue={bs.description} rows={2} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 resize-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Narrative</label>
                      <textarea name="bs_story" defaultValue={bs.story} rows={8} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 resize-none" />
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Featured Tool Stack (2)</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[0, 1].map(i => {
                          const ft = bs.featuredTools?.[i] || {};
                          return (
                            <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                              <input name={`ft_init_${i}`} defaultValue={ft.initial} placeholder="Init" className="w-full bg-white border border-slate-100 p-3 rounded-xl font-black text-xs uppercase" />
                              <input name={`ft_name_${i}`} defaultValue={ft.name} placeholder="Name" className="w-full bg-white border border-slate-100 p-3 rounded-xl font-bold text-sm" />
                              <input name={`ft_desc_${i}`} defaultValue={ft.description} placeholder="Desc" className="w-full bg-white border border-slate-100 p-3 rounded-xl text-xs font-medium" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button type="submit" disabled={updatingSpotlight} className="w-full py-5 bg-fuchsia-600 text-white font-black rounded-2xl hover:bg-fuchsia-700 transition-all shadow-xl uppercase tracking-widest text-xs">
                      {updatingSpotlight ? 'Synchronizing...' : 'Update Spotlight Narrative'}
                    </button>
                  </form>
                );
              })()}
            </section>
          )}
        </div>
      </div>

      {/* Edit Quest Modal */}
      <AnimatePresence>
        {editingQuest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingQuest(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setEditingQuest(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Quest</h2>
                  <p className="text-sm text-slate-500 font-medium">Modify existing ecosystem tasks.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateQuest} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quest Title</label>
                  <input required value={editingQuest.title} onChange={e => setEditingQuest({...editingQuest, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reward Diamonds</label>
                  <input type="number" required value={editingQuest.reward} onChange={e => setEditingQuest({...editingQuest, reward: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target URL</label>
                  <input type="url" value={editingQuest.targetUrl} onChange={e => setEditingQuest({...editingQuest, targetUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                </div>
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  Save Changes <Save size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit News Modal */}
      <AnimatePresence>
        {editingNews && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingNews(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setEditingNews(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit News</h2>
                  <p className="text-sm text-slate-500 font-medium">Update ecosystem briefing content.</p>
                </div>
              </div>
              <form onSubmit={handleUpdateNews} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input required value={editingNews.title} onChange={e => setEditingNews({...editingNews, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thumbnail URL</label>
                  <input required value={editingNews.thumbnailUrl} onChange={e => setEditingNews({...editingNews, thumbnailUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Description</label>
                  <textarea rows={4} value={editingNews.shortDescription} onChange={e => setEditingNews({...editingNews, shortDescription: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 resize-none" />
                </div>
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  Update Article <Save size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Course Modal */}
      <AnimatePresence>
        {editingCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingCourse(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Edit3 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Course</h2>
                  <p className="text-sm text-slate-500 font-medium">Modify curated educational resource.</p>
                </div>
              </div>
              <form onSubmit={handleUpdateCourse} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Title</label>
                  <input required value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform</label>
                    <select value={editingCourse.platform} onChange={e => setEditingCourse({...editingCourse, platform: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none">
                      <option>YouTube</option><option>Mirror</option><option>Medium</option><option>Official Docs</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level</label>
                    <select value={editingCourse.level} onChange={e => setEditingCourse({...editingCourse, level: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL</label>
                  <input required value={editingCourse.url} onChange={e => setEditingCourse({...editingCourse, url: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
                </div>
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  Save Changes <Save size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminCard({ title, subtitle, desc, children }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{subtitle}</p>
      <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed mb-4">{desc}</p>
      {children}
    </div>
  );
}

function FormField({ label, name, val }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input name={name} defaultValue={val} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-indigo-500/5" />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{text}</p>
    </div>
  );
}

function SafeLink({ href, children, ...props }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}