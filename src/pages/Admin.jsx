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
  fetchCuratedCourses, updateCuratedCourse, deleteCuratedCourse,
  fetchAdminUserList, fetchVisitorTrafficRates, fetchProtocolInventory
} from '../services/apiService';
import { 
  Settings, CheckCircle2, XCircle, Trash2, Shield, 
  ExternalLink, MessageSquare, Plus, Star, Search,
  LayoutGrid, Rocket, Users, AlertCircle, FileText,
  BookOpen, Zap, Sparkles, Edit3, X, Save, RefreshCw,
  Globe, BarChart3, Activity, TrendingUp, ChevronDown, ChevronUp,
  Eye, MapPin, ShieldCheck, Coins, Landmark, Share2, Layers, Check, Filter
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

  // Admin Data States
  const [userList, setUserList] = useState([]);
  const [trafficData, setTrafficData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [expandedCat, setExpandedCat] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tools, claims, q, stats, spotlight, news, courses, usersRes, trafficRes, invRes] = await Promise.all([
        fetchPendingTools().catch((e) => { console.warn('pending tools err', e); return { data: [] }; }),
        fetchPendingClaims().catch((e) => { console.warn('pending claims err', e); return { claims: [] }; }),
        fetchQuests(true).catch((e) => { console.warn('quests err', e); return { data: [] }; }),
        fetchStatsOverview().catch((e) => { console.warn('stats overview err', e); return null; }),
        fetchCommunitySpotlight().catch((e) => { console.warn('spotlight err', e); return null; }),
        fetchLatestNews().catch((e) => { console.warn('news err', e); return []; }),
        fetchCuratedCourses().catch((e) => { console.warn('courses err', e); return []; }),
        fetchAdminUserList().catch((e) => { console.warn('users err', e); return { users: [] }; }),
        fetchVisitorTrafficRates().catch((e) => { console.warn('traffic err', e); return null; }),
        fetchProtocolInventory().catch((e) => { console.warn('inventory err', e); return null; })
      ]);
      setPendingTools(tools?.data || (Array.isArray(tools) ? tools : []));
      setPendingClaims(claims?.claims || (Array.isArray(claims) ? claims : []));
      setQuestsList(q?.data || (Array.isArray(q) ? q : []));
      setStats(stats);
      setSpotlightData(spotlight);
      setNewsArticles(Array.isArray(news) ? news : news?.data || []);
      setCuratedCourses(Array.isArray(courses) ? courses : courses?.data || []);
      setUserList(usersRes?.users || (Array.isArray(usersRes) ? usersRes : []));
      setTrafficData(trafficRes);
      setInventoryData(invRes);
    } catch (err) {
      console.error('Admin data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Action Handlers
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

  const handleDeleteQuest = async (id, title) => {
    if (!window.confirm(`Delete quest "${title}"?`)) return;
    try {
      await deleteQuest(id);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteProtocol = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete protocol "${name}"?`)) return;
    try {
      await deleteTool(id);
      loadData();
    } catch (err) { alert(err.message || 'Failed to delete protocol'); }
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
    { id: 'overview', label: 'Overview', icon: LayoutGrid, count: null },
    { id: 'inventory', label: 'Protocol Inventory', icon: Landmark, count: inventoryData?.totalProtocols },
    { id: 'users', label: 'Users & Countries', icon: Globe, count: userList?.length },
    { id: 'traffic', label: 'Visitor Rates', icon: BarChart3, count: null },
    { id: 'review', label: 'Manage Submissions', icon: Shield, count: pendingTools.length + pendingClaims.length },
    { id: 'quests', label: 'Quests', icon: Zap, count: questsList.length },
    { id: 'content', label: 'Content Engine', icon: Rocket, count: newsArticles.length + curatedCourses.length },
    { id: 'spotlight', label: 'Builder Spotlight', icon: Users, count: null },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-4 max-w-md bg-white p-10 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Access Denied</h1>
          <p className="text-slate-500 font-medium text-sm">Administrator privileges are required to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pt-8 pb-32 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Command Banner */}
        <header className="mb-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                <Shield size={22} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Admin <span className="text-indigo-600">Command Center</span></h1>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">Manage Web3 Central infrastructure, protocol directory, user management & analytics.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={loadData} className="p-2.5 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl font-bold transition-all text-xs flex items-center gap-2">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Data</span>
            </button>
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">System Live</span>
            </div>
          </div>
        </header>

        {/* Responsive Grid: Sidebar + Active Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── Left Sidebar Navigation (Desktop: Vertical Sidebar / Mobile: Horizontal Scroll) ── */}
          <aside className="lg:col-span-3 w-full bg-white p-3 rounded-3xl border border-slate-200/80 shadow-sm lg:sticky lg:top-24 space-y-1">
            <div className="px-4 py-2.5 border-b border-slate-100 mb-1 hidden lg:block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Navigation Menu</span>
            </div>

            {/* Navigation Buttons container */}
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 p-1 no-scrollbar">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 lg:w-full ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon size={17} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </div>
                    {tab.count !== null && tab.count !== undefined && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Right Main Content Area ── */}
          <main className="lg:col-span-9 w-full min-w-0">
            
            {/* ── 1. OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Users</span>
                      <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Users size={18} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats?.users || userList.length}</h3>
                    <p className="text-[11px] font-semibold text-emerald-600">Registered community members</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Protocols</span>
                      <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <Landmark size={18} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats?.activeTools || inventoryData?.totalProtocols || 0}</h3>
                    <p className="text-[11px] font-semibold text-purple-600">{inventoryData?.categoriesCount || 21} Web3 categories</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Review</span>
                      <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Shield size={18} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{pendingTools.length + pendingClaims.length}</h3>
                    <p className="text-[11px] font-semibold text-amber-600">{pendingTools.length} submissions, {pendingClaims.length} claims</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protocol Clicks</span>
                      <div className="w-9 h-9 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
                        <Activity size={18} />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{trafficData?.visitorRate?.protocolClicks || stats?.totalClicks || 0}</h3>
                    <p className="text-[11px] font-semibold text-cyan-600">Total outbound clicks</p>
                  </div>
                </div>

                {/* Quick Action Hub */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Admin Quick Actions</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Quickly manage platform content, review pending submissions, and audit user base.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button onClick={() => setActiveTab('inventory')} className="p-5 bg-slate-50 hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-200 rounded-2xl text-left transition-all group">
                      <Landmark size={22} className="text-purple-600 mb-3" />
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-700">Protocol Inventory</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">Audit and update {inventoryData?.totalProtocols || 0} protocols.</p>
                    </button>

                    <button onClick={() => setActiveTab('users')} className="p-5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-200 rounded-2xl text-left transition-all group">
                      <Globe size={22} className="text-emerald-600 mb-3" />
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">User Directory</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">View {userList.length} user profiles & country flags.</p>
                    </button>

                    <button onClick={() => setActiveTab('review')} className="p-5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-200 rounded-2xl text-left transition-all group">
                      <Shield size={22} className="text-blue-600 mb-3" />
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700">Manage Submissions</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">{pendingTools.length} pending submissions to review.</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 2. PROTOCOL INVENTORY TAB ── */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                {/* Header & Controls */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Landmark size={20} className="text-purple-600" />
                      Protocol Inventory Directory
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {inventoryData?.totalProtocols || 0} protocols organized across {inventoryData?.categoriesCount || 0} categories
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search protocol by name..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Categories Breakdown */}
                {inventoryData?.categories ? (
                  <div className="space-y-4">
                    {Object.entries(inventoryData.categories)
                      .filter(([catKey]) => !['onchainautonomy', 'onchain-autonomy', 'vibecoding', 'vibe-coding'].includes(catKey.toLowerCase()))
                      .map(([catKey, items]) => {
                        const filteredItems = items.filter(item => 
                          !inventorySearch || item.name.toLowerCase().includes(inventorySearch.toLowerCase())
                        );

                        if (inventorySearch && filteredItems.length === 0) return null;
                        const isExpanded = expandedCat === catKey || !!inventorySearch;

                        return (
                          <div key={catKey} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
                            <div 
                              onClick={() => setExpandedCat(isExpanded && !inventorySearch ? null : catKey)}
                              className="p-5 flex items-center justify-between cursor-pointer bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-lg">
                                  {catKey}
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {items.length} Protocol{items.length !== 1 ? 's' : ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                                  {items.filter(i => i.verified).length} Verified
                                </span>
                                {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="divide-y divide-slate-100 p-3 sm:p-4">
                                {filteredItems.map((item) => (
                                  <div key={item._id || item.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 rounded-2xl transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 overflow-hidden shrink-0 shadow-sm">
                                        <img src={item.logoUrl} alt={item.name} className="w-full h-full object-contain" onError={(e) => { e.target.src = '/logo.jpg'; }} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                                          {item.verified && (
                                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                                              <ShieldCheck size={10} /> Verified
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-0.5 flex-wrap">
                                          <span>Rating: <strong className="text-slate-800">★ {item.rating ? item.rating.toFixed(1) : '—'}</strong></span>
                                          {item.chains?.length > 0 && <span>Chains: <strong className="text-purple-600">{item.chains.slice(0, 3).join(', ')}</strong></span>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        item.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                      }`}>
                                        {item.status}
                                      </span>

                                      <a href={item.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                        <ExternalLink size={14} />
                                      </a>

                                      <button onClick={() => handleDeleteProtocol(item._id || item.id, item.name)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Delete protocol">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <EmptyState text="Loading protocol inventory..." />
                )}
              </div>
            )}

            {/* ── 3. USERS & COUNTRIES TAB ── */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Registered</span>
                    <h3 className="text-3xl font-black text-slate-900">{userList.length}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Countries Represented</span>
                    <h3 className="text-3xl font-black text-emerald-600">{new Set(userList.map(u => u.country)).size || 1}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrators</span>
                    <h3 className="text-3xl font-black text-indigo-600">{userList.filter(u => u.role === 'admin').length || 1}</h3>
                  </div>
                </div>

                {/* Users Directory Table Container */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Globe size={20} className="text-emerald-600" />
                        Registered User Directory & Locations
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Real registered accounts and country profile metadata</p>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search name or country..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/70">
                          <th className="py-3.5 px-4">User Profile</th>
                          <th className="py-3.5 px-4">Email</th>
                          <th className="py-3.5 px-4">Role</th>
                          <th className="py-3.5 px-4">Country & Flag</th>
                          <th className="py-3.5 px-4 text-right">XP & Rank</th>
                          <th className="py-3.5 px-4 text-right">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {userList
                          .filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.country.toLowerCase().includes(userSearch.toLowerCase()))
                          .map(u => (
                            <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-4 font-bold text-slate-900 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                                  {u.name.slice(0, 1).toUpperCase()}
                                </div>
                                <span className="truncate">{u.name}</span>
                              </td>
                              <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{u.email}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  u.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2 font-bold text-slate-800">
                                  <span className="text-base">{u.flag || '🌐'}</span>
                                  <span>{u.country}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="text-purple-600 font-extrabold">{u.totalXP} XP</span>
                                <span className="text-slate-400 block text-[10px]">{u.rank}</span>
                              </td>
                              <td className="py-4 px-4 text-right text-slate-400 font-medium">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── 4. VISITOR RATE ANALYTICS TAB ── */}
            {activeTab === 'traffic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Outbound Protocol Clicks</span>
                    <h3 className="text-3xl font-black text-slate-900">{trafficData?.visitorRate?.protocolClicks?.toLocaleString() || 0}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Recorded project visits</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registered User Accounts</span>
                    <h3 className="text-3xl font-black text-indigo-600">{trafficData?.visitorRate?.registeredUsers?.toLocaleString() || userList.length}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Verified accounts</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Indexed Protocols</span>
                    <h3 className="text-3xl font-black text-purple-600">{trafficData?.visitorRate?.totalIndexedProtocols || inventoryData?.totalProtocols || 0}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Database entries</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Ratings & Reviews</span>
                    <h3 className="text-3xl font-black text-emerald-600">{trafficData?.visitorRate?.reviewsSubmitted || 0}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">User reviews</p>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Globe size={20} className="text-indigo-600" />
                      Geographic Visitor Distribution
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Real percentage breakdown derived from user profiles</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(trafficData?.countryBreakdown || []).map(c => (
                      <div key={c.country} className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-slate-800">
                            <span className="text-lg">{c.flag}</span> {c.country}
                          </span>
                          <span className="text-indigo-600 font-extrabold">{c.share}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: c.share }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">{c.visits} registered account{c.visits !== 1 ? 's' : ''}</p>
                      </div>
                    ))}
                    {(!trafficData?.countryBreakdown || trafficData.countryBreakdown.length === 0) && (
                      <p className="text-xs text-slate-400 italic">No geographic data recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. MANAGE SUBMISSIONS & CLAIMS TAB ── */}
            {activeTab === 'review' && (
              <div className="space-y-8">
                {/* Tool Submissions */}
                <section className="space-y-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <LayoutGrid size={20} className="text-indigo-600" />
                    Protocol Submissions
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-black">{pendingTools.length}</span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {pendingTools.map(tool => (
                      <div key={tool._id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <div>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">{tool.category}</span>
                          <h3 className="text-base font-bold text-slate-900 mt-2">{tool.name}</h3>
                          <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1">{tool.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <a href={tool.url} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:underline">
                            View Website <ExternalLink size={12} />
                          </a>
                          <div className="flex gap-2">
                            <button onClick={() => handleReviewTool(tool._id, 'approved')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1">
                              <Check size={14} /> Approve
                            </button>
                            <button onClick={() => handleReviewTool(tool._id, 'rejected')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1">
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pendingTools.length === 0 && <EmptyState text="No pending protocol submissions." />}
                  </div>
                </section>

                {/* Developer Claims */}
                <section className="space-y-4 pt-4">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Shield size={20} className="text-purple-600" />
                    Developer Claims
                    <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full font-black">{pendingClaims.length}</span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {pendingClaims.map(claim => (
                      <div key={claim._id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{claim.toolName || 'Project Claim'}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">User: {claim.developer?.name || claim.developer?.email}</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => handleApproveClaim(claim._id, claim.developer?.profileId)} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-colors">
                            Approve Developer Claim
                          </button>
                          <button onClick={() => handleRejectClaim(claim._id, claim.developer?.profileId)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingClaims.length === 0 && <EmptyState text="No pending developer profile claims." />}
                  </div>
                </section>
              </div>
            )}

            {/* ── 6. QUESTS TAB ── */}
            {activeTab === 'quests' && (
              <div className="space-y-8">
                {/* Create Quest */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Zap size={20} className="text-amber-500" />
                    Create New Community Quest
                  </h3>

                  <form onSubmit={handleCreateQuest} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input required placeholder="Quest Title" value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-amber-500 focus:bg-white" />
                    <input required placeholder="Target URL" value={newQuest.targetUrl} onChange={e => setNewQuest({...newQuest, targetUrl: e.target.value})} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-amber-500 focus:bg-white" />
                    <textarea required placeholder="Quest Description" value={newQuest.description} onChange={e => setNewQuest({...newQuest, description: e.target.value})} rows={2} className="sm:col-span-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-amber-500 focus:bg-white resize-none" />
                    <input type="number" placeholder="XP Reward (e.g. 50)" value={newQuest.reward} onChange={e => setNewQuest({...newQuest, reward: Number(e.target.value)})} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-amber-500 focus:bg-white" />
                    <button type="submit" disabled={savingQuest} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md">
                      {savingQuest ? 'Publishing...' : 'Publish Quest'}
                    </button>
                  </form>
                </div>

                {/* Quests Directory */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-slate-900">Active Ecosystem Quests ({questsList.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questsList.map(q => (
                      <div key={q._id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{q.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{q.reward} XP Reward</p>
                        </div>
                        <button onClick={() => handleDeleteQuest(q._id, q.title)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 7. CONTENT ENGINE TAB ── */}
            {activeTab === 'content' && (
              <div className="space-y-8">
                {/* Publish Manual News */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Rocket size={20} className="text-indigo-600" />
                    Publish News Article
                  </h3>

                  <form onSubmit={handlePublishManualNews} className="space-y-4">
                    <input required placeholder="Article Title" value={newManualNews.title} onChange={e => setNewManualNews({...newManualNews, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white" />
                    <textarea required placeholder="Short Description" value={newManualNews.shortDescription} onChange={e => setNewManualNews({...newManualNews, shortDescription: e.target.value})} rows={2} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white resize-none" />
                    <input placeholder="Tags (comma-separated, e.g. L2, DeFi, Security)" value={newManualNews.tags} onChange={e => setNewManualNews({...newManualNews, tags: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white" />
                    <button type="submit" disabled={publishingNews} className="py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md">
                      {publishingNews ? 'Publishing...' : 'Publish Article'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── 8. BUILDER SPOTLIGHT TAB ── */}
            {activeTab === 'spotlight' && spotlightData && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Builder Spotlight Narrative</h2>
                    <p className="text-xs text-slate-500 font-medium">Feature an ecosystem builder on the platform homepage.</p>
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
                    }} className="space-y-4">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Builder Name" name="bs_name" val={bs.name} />
                        <FormField label="Role / Title" name="bs_role" val={bs.role} />
                        <FormField label="X / Twitter URL" name="bs_twitter" val={bs.twitter} />
                        <FormField label="PFP URL" name="bs_pfp" val={bs.xProfileImageUrl} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tagline</label>
                        <textarea name="bs_description" defaultValue={bs.description} rows={2} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-fuchsia-500 focus:bg-white resize-none" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Story Narrative</label>
                        <textarea name="bs_story" defaultValue={bs.story} rows={5} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-fuchsia-500 focus:bg-white resize-none" />
                      </div>

                      <button type="submit" disabled={updatingSpotlight} className="w-full py-3.5 bg-fuchsia-600 text-white font-bold rounded-xl hover:bg-fuchsia-700 transition-all text-xs shadow-md">
                        {updatingSpotlight ? 'Saving...' : 'Update Spotlight Narrative'}
                      </button>
                    </form>
                  );
                })()}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Edit Quest Modal */}
      <AnimatePresence>
        {editingQuest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingQuest(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-white rounded-3xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-6 right-6">
                <button onClick={() => setEditingQuest(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Edit Quest</h2>
                  <p className="text-xs text-slate-500 font-medium">Modify existing ecosystem tasks.</p>
                </div>
              </div>

              <form onSubmit={handleUpdateQuest} className="space-y-4">
                <input required value={editingQuest.title} onChange={e => setEditingQuest({...editingQuest, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none" />
                <textarea required value={editingQuest.description} onChange={e => setEditingQuest({...editingQuest, description: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none resize-none" />
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  Save Changes <Save size={16} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormField({ label, name, val }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input name={name} defaultValue={val} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white" />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{text}</p>
    </div>
  );
}