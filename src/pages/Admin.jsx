import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, Users, LayoutDashboard, Database, Activity,
  CheckCircle, Trash2, Plus, X, Lock, ExternalLink
} from 'lucide-react';
import {
  fetchStatsOverview, fetchToolsData, deleteTool, createTool,
  generateAiQuiz, createAcademyLesson, fetchCommunitySpotlight, updateCommunitySpotlight,
  reviewTool, fetchCuratedCourses, createCuratedCourse, deleteCuratedCourse
} from '../services/apiService';

const ADMIN_PASSWORD = '213478';

const CATEGORIES = [
  { id: 'dex', name: 'Decentralized Exchanges (DEX)' },
  { id: 'interoperability', name: 'Interoperability Bridges' },
  { id: 'onchainAutonomy', name: 'Onchain Autonomy' },
  { id: 'bountyHub', name: 'Bounty Hub' },
  { id: 'web3Chat', name: 'Perpetual Protocols' },
  { id: 'communityTools', name: 'Community Tools' },
  { id: 'researchFiles', name: 'Research Platforms' },
];

export default function Admin() {
  // Password Gate State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Dashboard State
  const [stats, setStats] = useState(null);
  const [toolsList, setToolsList] = useState([]);
  const [spotlightData, setSpotlightData] = useState(null);
  const [updatingSpotlight, setUpdatingSpotlight] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Add Tool State
  const [showAddTool, setShowAddTool] = useState(false);
  const [addingTool, setAddingTool] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    url: '',
    category: 'dex',
    twitter: '',
    logo: ''
  });

  // Academy Suite State
  const [lessonForm, setLessonForm] = useState({
    title: '', description: '', duration: '', xpReward: 100,
    level: 'Beginner', order: 1, content: '', module: 'Web3 Foundations'
  });
  const [quizPreview, setQuizPreview] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Curated Courses State
  const [curatedCourses, setCuratedCourses] = useState([]);
  const [savingCourse, setSavingCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '', description: '', url: '', platform: 'Anthropic',
    thumbnail: '', level: 'Beginner', isFree: true, tags: ''
  });

  // Check localStorage for previous unlock
  useEffect(() => {
    const unlocked = sessionStorage.getItem('admin_unlocked');
    if (unlocked === 'true') setIsUnlocked(true);
  }, []);

  // Load data once unlocked
  useEffect(() => {
    if (!isUnlocked) return;
    const loadData = async () => {
      try {
        const [statsData, toolsData, spotlightRes, coursesData] = await Promise.all([
          fetchStatsOverview().catch(() => ({ users: 0, activeTools: 0, pendingTools: 0 })),
          fetchToolsData().catch(() => ({})),
          fetchCommunitySpotlight().catch(() => ({ builderSpotlight: { name: '', role: '', description: '', twitter: '', xProfileImageUrl: '' } })),
          fetchCuratedCourses().catch(() => [])
        ]);
        setStats(statsData);
        const toolsArrays = Object.entries(toolsData)
          .filter(([key]) => key !== 'tooltipExplanations')
          .map(([_, val]) => val);
        setToolsList(toolsArrays.flat());
        setSpotlightData(spotlightRes);
        setCuratedCourses(coursesData);
      } catch (error) {
        console.error("Failed to load admin stats", error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [isUnlocked]);

  // Password submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      setPasswordError('');
      sessionStorage.setItem('admin_unlocked', 'true');
    } else {
      setPasswordError('Incorrect access code');
      setPasswordInput('');
    }
  };

  // Delete tool handler
  const handleRemoveTool = async (category, id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTool(category, id);
      setToolsList(prev => prev.filter(t => (t.id || t._id) !== id));
      setStats(prev => ({ ...prev, activeTools: (prev.activeTools || 1) - 1 }));
    } catch (error) {
      alert('Failed to delete tool');
    }
  };

  // Review tool handler (Accept/Reject)
  const handleReviewTool = async (category, id, name, action) => {
    if (!window.confirm(`Are you sure you want to ${action} "${name}"?`)) return;
    try {
      await reviewTool(category, id, { action });
      setToolsList(prev => prev.map(t => (t.id || t._id) === id ? { ...t, status: action === 'accept' ? 'active' : 'rejected' } : t));
      setStats(prev => ({
        ...prev,
        activeTools: action === 'accept' ? (prev.activeTools || 0) + 1 : prev.activeTools,
        pendingTools: Math.max((prev.pendingTools || 1) - 1, 0)
      }));
    } catch (error) {
      alert(`Failed to ${action} tool`);
    }
  };

  // Add tool handler
  const handleAddTool = async (e) => {
    e.preventDefault();
    if (!newTool.name || !newTool.description || !newTool.url) {
      return alert('Name, description, and URL are required');
    }
    setAddingTool(true);
    try {
      const result = await createTool(newTool.category, {
        name: newTool.name,
        description: newTool.description,
        url: newTool.url,
        twitter: newTool.twitter,
        logo: newTool.logo,
        status: 'active'
      });
      setToolsList(prev => [...prev, { ...result, category: newTool.category }]);
      setNewTool({ name: '', description: '', url: '', category: 'dex', twitter: '', logo: '' });
      setShowAddTool(false);
      setStats(prev => ({ ...prev, activeTools: (prev.activeTools || 0) + 1 }));
      alert('Tool added successfully!');
    } catch (error) {
      alert('Failed to add tool. Make sure you are logged in as admin.');
    }
    setAddingTool(false);
  };

  // Curated Course handlers
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.url) return alert('Title and URL are required');
    setSavingCourse(true);
    try {
      let finalThumbnail = newCourse.thumbnail;

      // Auto-extract or assign thumbnails if the thumbnail field is empty
      if (!finalThumbnail) {
        const urlLower = newCourse.url.toLowerCase();

        // 1. YouTube
        if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
          const videoIdMatch = newCourse.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (videoIdMatch && videoIdMatch[1]) {
            finalThumbnail = `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
          }
        }
        // 2. Github
        else if (urlLower.includes('github.com')) {
          finalThumbnail = 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
        }
        // 3. Platform Defaults based on dropdown selection
        else {
          switch (newCourse.platform) {
            case 'Udemy':
              finalThumbnail = 'https://s.udemycdn.com/meta/default-meta-image-v2.png';
              break;
            case 'Coursera':
              finalThumbnail = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png';
              break;
            case 'Anthropic':
              finalThumbnail = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Anthropic_logo.svg/1200px-Anthropic_logo.svg.png';
              break;
            default:
              // Fallback image if nothing matches
              finalThumbnail = 'https://images.unsplash.com/photo-1639762681485-074b7f4f24fe?w=800&auto=format&fit=crop&q=60';
          }
        }
      }

      const payload = {
        ...newCourse,
        thumbnail: finalThumbnail,
        tags: newCourse.tags ? newCourse.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      const result = await createCuratedCourse(payload);
      setCuratedCourses(prev => [result.data, ...prev]);
      setNewCourse({ title: '', description: '', url: '', platform: 'Anthropic', thumbnail: '', level: 'Beginner', isFree: true, tags: '' });
      alert('Course added successfully!');
    } catch (err) {
      alert('Failed to add course. Make sure you are logged in.');
    }
    setSavingCourse(false);
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteCuratedCourse(id);
      setCuratedCourses(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete course.');
    }
  };

  const handleSpotlightUpdate = async (e) => {
    e.preventDefault();
    setUpdatingSpotlight(true);
    try {
      await updateCommunitySpotlight(spotlightData);
      alert('Builder Spotlight updated successfully!');
    } catch (err) {
      alert('Failed to update Spotlight.');
    }
    setUpdatingSpotlight(false);
  };

  // Academy handlers
  const handleGenerateQuiz = async () => {
    if (!lessonForm.content) return alert("Write some lesson content first!");
    setGeneratingQuiz(true);
    try {
      const res = await generateAiQuiz(lessonForm.content);
      if (res.success) setQuizPreview(res.quiz);
      else alert(res.message || "Failed to generate quiz");
    } catch (e) {
      alert("Error generating quiz");
    }
    setGeneratingQuiz(false);
  };

  const handlePublishLesson = async () => {
    if (!lessonForm.title || !lessonForm.content || !quizPreview) return alert("Complete all fields and generate a quiz first.");
    setPublishing(true);
    try {
      const slug = lessonForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = {
        ...lessonForm,
        contentMarkdown: lessonForm.content,
        quiz: quizPreview,
        slug,
        id: slug
      };
      await createAcademyLesson(payload);
      alert("Lesson Published Successfully!");
      setLessonForm({ title: '', description: '', duration: '', xpReward: 100, level: 'Beginner', order: 1, content: '', module: 'Web3 Foundations' });
      setQuizPreview(null);
    } catch (e) {
      alert("Error publishing lesson");
    }
    setPublishing(false);
  };

  // ── PASSWORD GATE ──
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-8 text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-white">Admin Access</h2>
              <p className="text-indigo-300 text-sm mt-1">Enter access code to continue</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-8 space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Access Code"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-sm text-center font-medium">{passwordError}</p>
              )}
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md"
              >
                Unlock Dashboard
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── LOADING STATE ──
  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ── COMPUTED LISTS ──
  const activeTools = toolsList.filter(t => t.status === 'active' || t.status === 'experimental');
  const pendingTools = toolsList.filter(t => t.status === 'pending');

  // ── DASHBOARD ──
  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <ShieldAlert className="text-indigo-600" size={32} />
              Admin Command Center
            </h1>
            <p className="text-slate-500 mt-1">Manage tools, lessons, and monitor platform health.</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm border border-indigo-100">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            System Online
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Registered Users</p>
              <h3 className="text-3xl font-black text-slate-900">{stats?.users || 0}</h3>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database size={28} />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Active Tools</p>
              <h3 className="text-3xl font-black text-slate-900">{stats?.activeTools || 0}</h3>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity size={28} />
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Pending Submissions</p>
              <h3 className="text-3xl font-black text-slate-900">{stats?.pendingTools || 0}</h3>
            </div>
          </motion.div>
        </div>

        {/* Tool Management + Add Tool */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Existing Tools List */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard size={20} className="text-indigo-500" />
                Manage Active Tools
              </h2>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {activeTools.length} tools
              </span>
            </div>
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
              {activeTools.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <CheckCircle size={48} className="text-emerald-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">No tools yet</h3>
                  <p className="text-slate-500 text-sm mt-1">Add your first tool using the form.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {activeTools.map(tool => (
                    <li key={tool.id || tool._id} className="p-4 flex flex-col hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm border border-slate-200">
                            {tool.name ? tool.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{tool.name}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                                {tool.category?.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTool(tool.category, tool.id || tool._id, tool.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 flex items-center justify-center"
                          title="Remove Tool"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="pl-14 pr-2">
                        <p className="text-sm text-slate-600 line-clamp-2">{tool.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Architect: <span className="text-slate-700">{tool.builder?.name || tool.builder?.handle || 'Anonymous'}</span></span>
                          {tool.url && <a href={tool.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors">Launch Link ↗</a>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Add New Tool */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus size={20} className="text-emerald-600" />
                Add New Tool
              </h2>
            </div>
            <form onSubmit={handleAddTool} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category *</label>
                <select
                  value={newTool.category}
                  onChange={e => setNewTool({ ...newTool, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tool Name *</label>
                <input
                  type="text"
                  value={newTool.name}
                  onChange={e => setNewTool({ ...newTool, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Uniswap"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website URL *</label>
                <input
                  type="url"
                  value={newTool.url}
                  onChange={e => setNewTool({ ...newTool, url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="https://uniswap.org"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description *</label>
                <textarea
                  value={newTool.description}
                  onChange={e => setNewTool({ ...newTool, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20 h-20 resize-none"
                  placeholder="Brief description of what this tool does..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Twitter / X URL</label>
                  <input
                    type="text"
                    value={newTool.twitter}
                    onChange={e => setNewTool({ ...newTool, twitter: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="https://x.com/uniswap"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logo URL</label>
                  <input
                    type="text"
                    value={newTool.logo}
                    onChange={e => setNewTool({ ...newTool, logo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingTool}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-50 mt-2"
              >
                {addingTool ? 'Adding...' : 'Add Tool to Platform'}
              </button>
            </form>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          <div className="p-6 border-b border-slate-100 bg-amber-50/50 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
              <Activity size={20} className="text-amber-600" />
              Pending Submissions
            </h2>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              {pendingTools.length} awaiting review
            </span>
          </div>
          <div className="p-0 overflow-y-auto custom-scrollbar max-h-[600px]">
            {pendingTools.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <CheckCircle size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-600">All caught up</h3>
                <p className="text-slate-500 text-sm mt-1">No pending tool submissions to review.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingTools.map(tool => (
                  <li key={tool.id || tool._id} className="p-6 flex flex-col hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg border border-amber-200 shadow-sm">
                          {tool.name ? tool.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">{tool.name}</h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                              {tool.category?.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border border-amber-200">Needs Review</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewTool(tool.category, tool.id || tool._id, tool.name, 'accept')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReviewTool(tool.category, tool.id || tool._id, tool.name, 'reject')}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold rounded-xl transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <p className="text-sm text-slate-600 mb-4">{tool.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Architect Handle</p>
                          <p className="font-medium text-slate-700">{tool.builder?.name || tool.builder?.handle || 'Anonymous'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Launch Link</p>
                          {tool.url ? (
                            <a href={tool.url} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                              {tool.url.replace(/^https?:\/\/(www\.)?/, '')} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No URL provided</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Academy Content Suite */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 bg-slate-900 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database size={20} className="text-indigo-400" />
              Academy Content Engine <span className="text-[10px] ml-2 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">AI POWERED</span>
            </h2>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lesson Title</label>
                <input type="text" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium" placeholder="Understanding Oracles" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Short Description</label>
                <input type="text" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium" placeholder="How external data reaches the blockchain..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module</label>
                <select value={lessonForm.module} onChange={e => setLessonForm({ ...lessonForm, module: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                  <option>Web3 Foundations</option>
                  <option>DeFi Architecture</option>
                  <option>Smart Contract Security</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</label>
                <input type="text" value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" placeholder="10 min" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">XP Reward</label>
                <input type="number" value={lessonForm.xpReward} onChange={e => setLessonForm({ ...lessonForm, xpReward: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level</label>
                <select value={lessonForm.level} onChange={e => setLessonForm({ ...lessonForm, level: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syllabus Order</label>
                <input type="number" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Markdown Content Body</label>
              <textarea
                value={lessonForm.content}
                onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                className="w-full h-[300px] bg-slate-900 text-slate-300 font-mono text-sm border border-slate-800 p-5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 custom-scrollbar"
                placeholder="# Write your content here..."
              />
            </div>

            {/* AI Quiz Gen */}
            <div className="flex items-center justify-between p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div>
                <h4 className="font-bold text-indigo-900">Auto-Generate Quiz</h4>
                <p className="text-xs text-indigo-700/70 mt-1">AI-powered quiz generation from your lesson content.</p>
              </div>
              <button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz || !lessonForm.content}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {generatingQuiz ? 'Synthesizing...' : 'Generate AI Quiz'}
              </button>
            </div>

            {quizPreview && (
              <div className="space-y-4 border border-emerald-200 bg-emerald-50 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-2"><CheckCircle size={18} /> Quiz Payload Built</h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">Ready For Publish</span>
                </div>
                <pre className="text-[10px] text-emerald-800 bg-emerald-100 p-4 rounded-xl overflow-x-auto font-mono max-h-[200px] custom-scrollbar">
                  {JSON.stringify(quizPreview, null, 2)}
                </pre>
                <button
                  onClick={handlePublishLesson}
                  disabled={publishing}
                  className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                >
                  {publishing ? 'Publishing...' : 'Publish Masterclass to DB'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Builder Spotlight Editor */}
        {spotlightData && spotlightData.builderSpotlight && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mt-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users size={20} className="text-indigo-500" />
                Edit Builder Spotlight
              </h2>
            </div>
            <form onSubmit={handleSpotlightUpdate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Builder Name</label>
                  <input type="text" value={spotlightData.builderSpotlight.name || ''} onChange={e => setSpotlightData({ ...spotlightData, builderSpotlight: { ...spotlightData.builderSpotlight, name: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                  <input type="text" value={spotlightData.builderSpotlight.role || ''} onChange={e => setSpotlightData({ ...spotlightData, builderSpotlight: { ...spotlightData.builderSpotlight, role: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Twitter URL</label>
                  <input type="text" value={spotlightData.builderSpotlight.twitter || ''} onChange={e => setSpotlightData({ ...spotlightData, builderSpotlight: { ...spotlightData.builderSpotlight, twitter: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avatar Image URL</label>
                  <input type="text" value={spotlightData.builderSpotlight.xProfileImageUrl || ''} onChange={e => setSpotlightData({ ...spotlightData, builderSpotlight: { ...spotlightData.builderSpotlight, xProfileImageUrl: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biography / Description</label>
                <textarea rows={3} value={spotlightData.builderSpotlight.description || ''} onChange={e => setSpotlightData({ ...spotlightData, builderSpotlight: { ...spotlightData.builderSpotlight, description: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium custom-scrollbar" />
              </div>
              <button disabled={updatingSpotlight} type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-50">
                {updatingSpotlight ? 'Saving Spotlight...' : 'Publish Spotlight Update'}
              </button>
            </form>
          </div>
        )}

        {/* Curated Courses Manager */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mt-8">
          <div className="p-6 border-b border-slate-100 bg-purple-50/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database size={20} className="text-purple-500" />
              Curated Courses Manager
            </h2>
            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">{curatedCourses.length} courses</span>
          </div>
          <div className="p-8 space-y-6">
            <form onSubmit={handleAddCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Title *</label>
                <input type="text" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" placeholder="e.g. Prompt Engineering for Developers" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course URL *</label>
                <input type="url" value={newCourse.url} onChange={e => setNewCourse({ ...newCourse, url: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" placeholder="https://..." required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <input type="text" value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" placeholder="Short course description..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thumbnail URL</label>
                <input type="text" value={newCourse.thumbnail} onChange={e => setNewCourse({ ...newCourse, thumbnail: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" placeholder="Image URL (Leave blank for YouTube videos to auto-generate)" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform</label>
                  <select value={newCourse.platform} onChange={e => setNewCourse({ ...newCourse, platform: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                    {['Anthropic', 'YouTube', 'Coursera', 'Udemy', 'GitHub', 'Other'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level</label>
                  <select value={newCourse.level} onChange={e => setNewCourse({ ...newCourse, level: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                    <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing</label>
                  <select value={newCourse.isFree} onChange={e => setNewCourse({ ...newCourse, isFree: e.target.value === 'true' })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                    <option value="true">Free</option><option value="false">Paid</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags (comma-separated)</label>
                <input type="text" value={newCourse.tags} onChange={e => setNewCourse({ ...newCourse, tags: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium" placeholder="defi, smart-contracts, ai" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={savingCourse} className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-50">
                  {savingCourse ? 'Adding...' : '+ Add Course'}
                </button>
              </div>
            </form>

            {curatedCourses.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Existing Courses</h3>
                <ul className="space-y-3">
                  {curatedCourses.map(course => (
                    <li key={course._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{course.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{course.platform} · {course.level} · {course.isFree ? 'Free' : 'Paid'}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <a href={course.url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-700"><ExternalLink size={15} /></a>
                        <button onClick={() => handleDeleteCourse(course._id, course.title)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}