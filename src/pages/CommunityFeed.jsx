import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { fetchCommunityLessons, createCommunityLesson, upvoteCommunityLesson, rateCommunityLesson } from '../services/apiService';
import {
    Users, Plus, Heart, Eye, Share2, Edit3, Trash2, CheckCircle2, Sparkles, Lock
} from 'lucide-react';
import { FeedSkeleton } from '../components/Skeleton';

export default function CommunityFeed() {
    const [communityLessons, setCommunityLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Feed specifics
    const [communityMenuOpen, setCommunityMenuOpen] = useState(null); 
    const [editingLesson, setEditingLesson] = useState(null); 
    const [showCommunityModal, setShowCommunityModal] = useState(false);
    const [communityPostSuccess, setCommunityPostSuccess] = useState(false);
    const [submittingPost, setSubmittingPost] = useState(false);
    const [newPostData, setNewPostData] = useState({ title: '', description: '', contentMarkdown: '', module: 'Web3 Foundations' });
    const [communityPostError, setCommunityPostError] = useState('');

    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const fetchCommunityData = async () => {
            try {
                setLoading(true);
                const communityData = await fetchCommunityLessons().catch(() => []);
                setCommunityLessons(communityData);
            } catch (err) {
                console.error('Error fetching community data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunityData();
    }, [user]);

    // ── LOGIN GATE ──
    if (!authLoading && !user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-6 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Lock size={36} className="text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-3">Community Access</h1>
                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                        Sign in to access the community feed and share your Web3 knowledge.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all text-sm shadow-lg"
                        >
                            Sign In to Continue
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-8 py-4 bg-blue-50 text-blue-700 font-bold rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all text-sm"
                        >
                            Create Account
                        </button>
                    </div>
                    <p className="text-gray-400 text-xs mt-6">Free to join. No credit card required.</p>
                </motion.div>
            </div>
        );
    }

    const handleUpvote = async (lessonId) => {
        if (!user) return navigate('/login');
        try {
            await upvoteCommunityLesson(lessonId);
            setCommunityLessons(prev => prev.map(l => {
                if (l._id !== lessonId) return l;
                const alreadyUpvoted = l.upvotes?.includes(user.id || user._id);
                return {
                    ...l,
                    upvotes: alreadyUpvoted
                        ? l.upvotes.filter(id => id !== user.id && id !== user._id)
                        : [...(l.upvotes || []), user.id || user._id]
                };
            }));
        } catch (err) {
            console.error('Failed to upvote:', err);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!user) return;
        if (!window.confirm('Delete this lesson? This cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
            await fetch(`${API}/academy/community/${lessonId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommunityLessons(prev => prev.filter(l => l._id !== lessonId));
            setCommunityMenuOpen(null);
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        setSubmittingPost(true);
        setCommunityPostError('');
        try {
            const token = localStorage.getItem('token');
            const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
            const res = await fetch(`${API}/academy/community/${editingLesson._id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    title: editingLesson.title,
                    description: editingLesson.description,
                    contentMarkdown: editingLesson.contentMarkdown
                })
            });
            const data = await res.json();
            if (data.success) {
                setCommunityLessons(prev => prev.map(l => l._id === editingLesson._id ? data.data : l));
                setEditingLesson(null);
            } else {
                throw new Error(data.error || 'Failed to update lesson');
            }
        } catch (err) {
            console.error("Failed to update lesson:", err);
            setCommunityPostError(err?.message || 'Failed to update lesson. Please try again.');
        } finally {
            setSubmittingPost(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setSubmittingPost(true);
        setCommunityPostError('');
        try {
            const res = await createCommunityLesson({
                ...newPostData,
                level: 'Intermediate' 
            });
            if (res.success) {
                const newLesson = {
                    ...res.data,
                    author: {
                        _id: user.id || user._id,
                        name: user.name,
                        username: user.username,
                        avatarUrl: user.avatarUrl
                    },
                    upvotes: [],
                    createdAt: new Date().toISOString()
                };
                
                setCommunityLessons(prev => [newLesson, ...prev]);
                setShowCommunityModal(false);
                setNewPostData({ title: '', description: '', contentMarkdown: '', module: 'Web3 Foundations' });
                
                setCommunityPostSuccess(true);
                setTimeout(() => setCommunityPostSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Failed to create post:", err);
            setCommunityPostError(err?.message || 'Failed to publish lesson. Please try again.');
        } finally {
            setSubmittingPost(false);
        }
    };

    return (
        <div className="bg-white min-h-screen text-gray-900 pt-32 pb-32 px-6 relative overflow-x-hidden">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-60" />
            </div>

            {/* Success Toast */}
            <AnimatePresence>
                {communityPostSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                            <CheckCircle2 size={20} />
                        </div>
                        <p className="text-white font-black tracking-tight">Your post has been published!</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-14">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center text-center md:items-start md:text-left"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-600 tracking-wider uppercase mb-6 shadow-sm">
                            <Sparkles size={14} className="animate-pulse" /> Architect Hub
                        </span>
                        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900 leading-[1.1]">
                                    Community <span className="text-blue-600">Feed</span>
                                </h1>
                                <p className="text-gray-500 text-lg max-w-2xl font-normal leading-relaxed">
                                    Learn from other builders. Share your insights. Upvote the best content.
                                </p>
                            </div>
                            <button
                                onClick={() => user ? setShowCommunityModal(true) : navigate('/login')}
                                className="flex px-6 py-3 shrink-0 bg-gray-900 text-white font-bold rounded-xl text-[14px] items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
                            >
                                <Plus size={16} /> Publish Lesson
                            </button>
                        </div>
                    </motion.div>
                </div>

                {loading ? (
                    <div className="max-w-[700px] border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <FeedSkeleton rows={5} />
                    </div>
                ) : communityLessons.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 max-w-[700px] border border-gray-100 rounded-[2rem] shadow-sm bg-white">
                        <Users size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold text-base text-gray-900">Nothing here yet.</p>
                        <p className="text-sm mt-1">Be the first to share your Web3 knowledge!</p>
                    </div>
                ) : (
                    <div className="max-w-[700px] flex flex-col gap-6">
                        {communityLessons.map((lesson, i) => {
                            const initials = lesson.author?.username
                                ? lesson.author.username.charAt(0).toUpperCase()
                                : (lesson.author?.name ? lesson.author.name.charAt(0).toUpperCase() : '?');
                            const isLiked = lesson.upvotes?.includes(user?.id || user?._id);
                            const diff = Date.now() - new Date(lesson.createdAt).getTime();
                            const timeAgo = diff < 0 ? 'just now' : diff < 3600000
                                ? `${Math.floor(diff / 60000)}m`
                                : diff < 86400000
                                    ? `${Math.floor(diff / 3600000)}h`
                                    : `${Math.floor(diff / 86400000)}d`;

                            const isLong = lesson.contentMarkdown?.length > 450;

                            return (
                                <motion.div
                                    key={lesson._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300"
                                >
                                    <div className="p-6 md:p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center font-black text-lg text-blue-600 shadow-sm border border-white">
                                                    {lesson.author?.avatarUrl ? (
                                                        <img src={lesson.author.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
                                                    ) : (
                                                        <span>{initials}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 tracking-tight leading-none mb-1">
                                                        {lesson.author?.username || lesson.author?.name || 'Anonymous Builder'}
                                                    </div>
                                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                        {timeAgo}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Context Menu for Author */}
                                            {user && (user.id === lesson.author?._id || user._id === lesson.author?._id) && (
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setCommunityMenuOpen(communityMenuOpen === lesson._id ? null : lesson._id); }}
                                                        className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                                                    </button>
                                                    {communityMenuOpen === lesson._id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setCommunityMenuOpen(null)} />
                                                            <div className="absolute right-0 top-12 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 min-w-[160px] overflow-hidden">
                                                                <button 
                                                                    onClick={() => { setEditingLesson({ ...lesson }); setCommunityMenuOpen(null); }}
                                                                    className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Edit3 size={16} /> Edit Post
                                                                </button>
                                                                <button 
                                                                    onClick={() => { handleDeleteLesson(lesson._id); setCommunityMenuOpen(null); }}
                                                                    className="w-full text-left px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Trash2 size={16} /> Delete Post
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <h3 
                                            className="text-xl md:text-2xl font-black text-gray-900 mb-4 tracking-tight leading-tight cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={() => navigate(`/academy/${lesson.slug}`)}
                                        >
                                            {lesson.title}
                                        </h3>

                                        <div className="prose prose-slate prose-sm max-w-none text-gray-600 leading-relaxed font-medium mb-6">
                                            <ReactMarkdown>
                                                {isLong 
                                                    ? `${lesson.contentMarkdown.substring(0, 450)}...` 
                                                    : lesson.contentMarkdown
                                                }
                                            </ReactMarkdown>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={() => handleUpvote(lesson._id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isLiked ? 'bg-pink-50 text-pink-600 shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-pink-600'}`}
                                                >
                                                    <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 1 : 2} />
                                                    {lesson.upvotes?.length || 0}
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/academy/${lesson.slug}`)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-all"
                                                >
                                                    <Eye size={18} /> {isLong ? 'Read More' : 'Details'}
                                                </button>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    const shareUrl = `${window.location.origin}/academy/${lesson.slug}`;
                                                    if (navigator.share) {
                                                        navigator.share({ title: lesson.title, url: shareUrl }).catch(() => {});
                                                    } else {
                                                        navigator.clipboard.writeText(shareUrl);
                                                        alert('Link copied to clipboard!');
                                                    }
                                                }}
                                                className="w-10 h-10 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-blue-600 flex items-center justify-center transition-all"
                                                title="Share"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Publish Lesson Modal */}
            {showCommunityModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowCommunityModal(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl w-full max-w-2xl relative z-10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Plus size={24} className="text-blue-500" /> Publish a Lesson
                        </h2>
                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Title</label>
                                <input 
                                    required
                                    type="text" 
                                    value={newPostData.title}
                                    onChange={e => setNewPostData(prev => ({...prev, title: e.target.value}))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 font-medium" 
                                    placeholder="e.g. A Deep Dive into Zero-Knowledge Proofs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 mt-2">Lesson Content (Markdown Supported)</label>
                                <textarea 
                                    required
                                    value={newPostData.contentMarkdown}
                                    onChange={e => setNewPostData(prev => ({...prev, contentMarkdown: e.target.value}))}
                                    className="w-full h-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 font-medium resize-none font-mono text-sm leading-relaxed" 
                                    placeholder="Write your lesson content here... Use markdown for headers, lists, code, etc."
                                />
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                {communityPostError && (
                                    <p className="mr-auto text-sm font-medium text-red-600">{communityPostError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowCommunityModal(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingPost}
                                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {submittingPost ? 'Publishing...' : 'Publish Lesson'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
            
            {/* Edit Lesson Modal */}
            {editingLesson && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingLesson(null)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl w-full max-w-2xl relative z-10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Edit3 size={24} className="text-amber-500" /> Edit Lesson
                        </h2>
                        <form onSubmit={handleUpdateLesson} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Title</label>
                                <input 
                                    required
                                    type="text" 
                                    value={editingLesson.title}
                                    onChange={e => setEditingLesson(prev => ({...prev, title: e.target.value}))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 font-medium" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 mt-2">Lesson Content</label>
                                <textarea 
                                    required
                                    value={editingLesson.contentMarkdown}
                                    onChange={e => setEditingLesson(prev => ({...prev, contentMarkdown: e.target.value}))}
                                    className="w-full h-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 font-medium resize-none font-mono text-sm leading-relaxed" 
                                />
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                {communityPostError && (
                                    <p className="mr-auto text-sm font-medium text-red-600">{communityPostError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setEditingLesson(null)}
                                    className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingPost}
                                    className="px-8 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
                                >
                                    {submittingPost ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
