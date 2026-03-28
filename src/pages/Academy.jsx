import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { fetchLessons, fetchCuratedCourses, fetchCommunityLessons, createCommunityLesson, upvoteCommunityLesson, rateCommunityLesson } from '../services/apiService';
import {
    BookOpen, Layers, Shield, Coins, ChevronRight, Clock,
    Award, CheckCircle2, Sparkles, Lock, ExternalLink,
    Play, Globe, Bookmark, Search, Users, Plus, Star, Heart, Edit3,
    ThumbsUp, ThumbsDown, Zap, Eye, PenLine
} from 'lucide-react';
import { useCourseBookmarks } from '../hooks/useCourseBookmarks';
import { FeedSkeleton, CardSkeleton } from '../components/Skeleton';


const PLATFORM_COLORS = {
    'Anthropic': 'bg-orange-100 text-orange-700 border-orange-200',
    'YouTube': 'bg-red-100 text-red-700 border-red-200',
    'Coursera': 'bg-blue-100 text-blue-700 border-blue-200',
    'Udemy': 'bg-purple-100 text-purple-700 border-purple-200',
    'GitHub': 'bg-gray-800 text-white border-gray-700',
    'Other': 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Academy() {
    const [lessons, setLessons] = useState([]);
    const [courses, setCourses] = useState([]);
    const [communityLessons, setCommunityLessons] = useState([]);
    const [lessonsLoading, setLessonsLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [communityLoading, setCommunityLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('lessons');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceFilter, setPriceFilter] = useState('All'); // 'All', 'Free', 'Paid'
    const [levelFilter, setLevelFilter] = useState('All'); 
    const [platformFilter, setPlatformFilter] = useState('All');
    const [dropOpen, setDropOpen] = useState(false);
    
    // Community Feed specific state
    const [communityMenuOpen, setCommunityMenuOpen] = useState(null); // holds lesson._id of open menu
    const [editingLesson, setEditingLesson] = useState(null); // { _id, title, description, contentMarkdown }
    const [showCommunityModal, setShowCommunityModal] = useState(false);
    const [submittingPost, setSubmittingPost] = useState(false);
    const [newPostData, setNewPostData] = useState({ title: '', description: '', contentMarkdown: '', module: 'Web3 Foundations' });
    const [communityPostError, setCommunityPostError] = useState('');


    const { user, loading: authLoading } = useAuth();
    const { toggleBookmark, isBookmarked } = useCourseBookmarks();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const fetchLessonsData = async () => {
            try {
                setLessonsLoading(true);
                const lessonsData = await fetchLessons().catch(() => []);
                setLessons(lessonsData || []);
            } catch (err) {
                console.error('Error fetching lessons:', err);
            } finally {
                setLessonsLoading(false);
            }
        };

        const fetchCoursesData = async () => {
            try {
                setCoursesLoading(true);
                const coursesData = await fetchCuratedCourses().catch(() => []);
                setCourses(coursesData);
            } catch (err) {
                console.error('Error fetching courses:', err);
            } finally {
                setCoursesLoading(false);
            }
        };

        const fetchCommunityData = async () => {
            try {
                setCommunityLoading(true);
                const communityData = await fetchCommunityLessons().catch(() => []);
                setCommunityLessons(communityData);
            } catch (err) {
                console.error('Error fetching academy data:', err);
            } finally {
                setCommunityLoading(false);
            }
        };

        fetchLessonsData();
        fetchCoursesData();
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
                    <div className="w-20 h-20 bg-purple-50 border border-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Lock size={36} className="text-purple-500" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-3">Academy Access</h1>
                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                        Sign in to access Web3 courses, lessons, and curated learning resources all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all text-sm shadow-lg"
                        >
                            Sign In to Continue
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-8 py-4 bg-purple-50 text-purple-700 font-bold rounded-2xl border border-purple-100 hover:bg-purple-100 transition-all text-sm"
                        >
                            Create Account
                        </button>
                    </div>
                    <p className="text-gray-400 text-xs mt-6">Free to join. No credit card required.</p>
                </motion.div>
            </div>
        );
    }

    const LESSON_MODULES = [
        { name: 'All', icon: <Layers size={16} />, color: 'bg-gray-900 text-white border-gray-900', inactive: 'bg-white border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900' },
        { name: 'Web3 Foundations', icon: <BookOpen size={16} />, color: 'bg-blue-600 text-white border-blue-600', inactive: 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700', dot: 'bg-blue-500' },
        { name: 'DeFi Architecture', icon: <Coins size={16} />, color: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700', dot: 'bg-emerald-500' },
        { name: 'Smart Contract Security', icon: <Shield size={16} />, color: 'bg-purple-600 text-white border-purple-600', inactive: 'bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700', dot: 'bg-purple-500' },
    ];

    const MODULE_COLORS = {
        'Web3 Foundations': { bg: 'bg-blue-50', text: 'text-blue-600', icon: <BookOpen size={22} className="text-blue-600" /> },
        'DeFi Architecture': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <Coins size={22} className="text-emerald-600" /> },
        'Smart Contract Security': { bg: 'bg-purple-50', text: 'text-purple-600', icon: <Shield size={22} className="text-purple-600" /> },
    };
    const defaultModule = { bg: 'bg-gray-50', text: 'text-gray-600', icon: <BookOpen size={22} className="text-gray-500" /> };

    const filteredLessons = activeCategory === 'All'
        ? lessons
        : lessons.filter(l => l.module === activeCategory);

    const isLocked = (prereqs = []) => {
        if (!user || prereqs.length === 0) return false;
        const progressObj = user?.learningProgress || {};
        return prereqs.some(reqId => !progressObj[reqId]?.completed);
    };

    const filteredCourses = courses.filter(course => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = course.title.toLowerCase().includes(query) ||
            (course.description && course.description.toLowerCase().includes(query)) ||
            (course.tags && course.tags.some(tag => tag.toLowerCase().includes(query)));

        let matchesPrice = true;
        if (priceFilter === 'Free') matchesPrice = course.isFree;
        if (priceFilter === 'Paid') matchesPrice = !course.isFree;

        const matchesLevel = levelFilter === 'All' || course.level === levelFilter;
        const matchesPlatform = platformFilter === 'All' || course.platform === platformFilter;

        return matchesSearch && matchesPrice && matchesLevel && matchesPlatform;
    });

    const uniquePlatforms = ['All', ...new Set(courses.map(c => c.platform).filter(Boolean))];
    const uniqueLevels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

    const handleUpvote = async (lessonId) => {
        if (!user) return navigate('/login');
        try {
            await upvoteCommunityLesson(lessonId);
            setCommunityLessons(prev => prev.map(l => {
                if (l._id !== lessonId) return l;
                const alreadyUpvoted = l.upvotes?.includes(user.id);
                return {
                    ...l,
                    upvotes: alreadyUpvoted
                        ? l.upvotes.filter(id => id !== user.id)
                        : [...(l.upvotes || []), user.id]
                };
            }));
        } catch (err) {
            console.error('Failed to upvote:', err);
        }
    };

    const handleRate = async (lessonId, rating) => {
        if (!user) return navigate('/login');
        try {
            const res = await rateCommunityLesson(lessonId, rating);
            if (res.success) {
                setCommunityLessons(prev => prev.map(l =>
                    l._id === lessonId ? { ...l, ratings: res.ratings } : l
                ));
            }
        } catch (err) {
            console.error('Failed to rate:', err);
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
                const refreshed = await fetchCommunityLessons();
                setCommunityLessons(refreshed);
                setShowCommunityModal(false);
                setNewPostData({ title: '', description: '', contentMarkdown: '', module: 'Web3 Foundations' });
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
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-60" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-14">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center text-center md:items-start md:text-left"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-bold text-purple-600 tracking-wider uppercase mb-6 shadow-sm">
                            <Sparkles size={14} className="animate-pulse" /> Structured Mastery
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-900 leading-[1.1]">
                            Your Web3 <span className="text-purple-600">Learning Path</span>
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl max-w-3xl font-normal leading-relaxed">
                            From basic bridging to institutional-grade analysis. Curated courses and interactive lessons all in one place.
                        </p>
                    </motion.div>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-col sm:flex-row gap-2 mb-10 pb-1">
                    <button
                        onClick={() => setActiveTab('lessons')}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all border ${activeTab === 'lessons'
                            ? 'bg-gray-900 text-white shadow-md border-gray-900'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-gray-200 shadow-sm'
                            }`}
                    >
                        <span className="flex items-center justify-center gap-2"><BookOpen size={15} /> Interactive Lessons</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${activeTab === 'courses'
                            ? 'bg-purple-600 text-white shadow-md border-purple-600'
                            : 'text-gray-500 hover:text-purple-700 hover:bg-purple-50 border-gray-200 shadow-sm'
                            }`}
                    >
                        <Globe size={15} /> Curated Courses
                        {courses.length > 0 && (
                            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">{courses.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${activeTab === 'community'
                            ? 'bg-blue-600 text-white shadow-md border-blue-600'
                            : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50 border-gray-200 shadow-sm'
                            }`}
                    >
                        <Users size={15} /> Community Feed
                    </button>
                </div>

                {/* ── LESSONS TAB ── */}
                {activeTab === 'lessons' && (
                    <>
                        <div className="sm:hidden mb-8 relative">
                            <button
                                onClick={() => setDropOpen(!dropOpen)}
                                className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                {activeCategory}
                                <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${dropOpen ? '-rotate-90' : 'rotate-90'}`} />
                            </button>
                            {dropOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                                        {LESSON_MODULES.map(cat => (
                                            <button
                                                key={cat.name}
                                                onClick={() => { setActiveCategory(cat.name); setDropOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors text-left ${activeCategory === cat.name
                                                    ? 'bg-purple-50 text-purple-700'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className="text-base">{cat.icon}</span>
                                                {cat.name}
                                                {activeCategory === cat.name && (
                                                    <span className="ml-auto text-purple-500">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Desktop: Colourized pill filters */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="hidden sm:flex sm:flex-wrap gap-2 mb-12"
                        >
                            {LESSON_MODULES.map(cat => (
                                <button
                                    key={cat.name}
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border shadow-sm ${
                                        activeCategory === cat.name ? cat.color : cat.inactive
                                    }`}
                                >
                                    {activeCategory === cat.name && cat.dot && (
                                        <span className={`w-2 h-2 rounded-full bg-white opacity-70`} />
                                    )}
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </motion.div>

                        {lessonsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <CardSkeleton key={`lesson-skeleton-${i}`} />
                                ))}
                            </div>
                        ) : filteredLessons.length === 0 ? (
                            <div className="text-center py-24 text-gray-400">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-bold text-lg">No lessons published yet.</p>
                                <p className="text-sm mt-1">Check back soon or ask the admin to publish lessons.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredLessons.map((lesson, i) => (
                                    <motion.div
                                        key={lesson._id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: (i % 3) * 0.1, duration: 0.6 }}
                                        className="group"
                                    >
                                        <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(109,40,217,0.08)] hover:border-purple-100 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                                            {/* Completed overlay badge */}
                                            {user?.learningProgress?.[lesson.slug]?.completed && (
                                                <div className="absolute top-4 right-4 flex items-center gap-1 bg-green-50 border border-green-100 text-green-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                                                    <CheckCircle2 size={9} /> Mastered
                                                </div>
                                            )}
                                            <div className="mb-6 flex items-start gap-4">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${(MODULE_COLORS[lesson.module] || defaultModule).bg}`}>
                                                    {(MODULE_COLORS[lesson.module] || defaultModule).icon}
                                                </div>
                                                <div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${(MODULE_COLORS[lesson.module] || defaultModule).text}`}>
                                                        {lesson.module}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{lesson.level}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="text-base md:text-lg font-black mb-2 tracking-tight text-gray-900 group-hover:text-purple-700 transition-colors leading-snug">{lesson.title}</h3>
                                                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{lesson.description}</p>
                                            </div>
                                            <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Zap size={13} className="text-amber-500" />
                                                    <span className="text-xs font-black text-gray-900">+{lesson.xpReward} XP</span>
                                                </div>
                                                {user?.learningProgress?.[lesson.slug]?.completed ? (
                                                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 pl-2 pr-3 py-1.5 rounded-full border border-green-100">
                                                        <CheckCircle2 size={12} />
                                                        <span className="font-bold text-[10px] uppercase tracking-wide">Done</span>
                                                    </div>
                                                ) : isLocked(lesson.prerequisites) ? (
                                                    <div className="flex items-center gap-1.5 text-gray-400 bg-gray-50 pl-2 pr-3 py-1.5 rounded-full border border-gray-200">
                                                        <Lock size={11} />
                                                        <span className="font-bold text-[10px] uppercase tracking-wide">Locked</span>
                                                    </div>
                                                ) : (
                                                    <Link
                                                        to={`/academy/${lesson.slug}`}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-purple-600 transition-all shadow-md"
                                                    >
                                                        Start <ChevronRight size={12} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── CURATED COURSES TAB ── */}
                {activeTab === 'courses' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Search and Filters */}
                        <div className="flex flex-col gap-4 mb-8 relative z-20">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-grow relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search courses by title, description, or tags..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] focus:border-purple-300 focus:ring-4 focus:ring-purple-50 transition-all font-medium text-sm outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                    {['All', 'Free', 'Paid'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setPriceFilter(filter)}
                                            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border whitespace-nowrap ${priceFilter === filter
                                                ? 'bg-gray-900 border-gray-900 text-white shadow-lg'
                                                : 'bg-white border-gray-100 text-gray-600 hover:border-purple-200 hover:text-purple-700 shadow-sm'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 items-center bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50 w-full md:w-auto">
                                <span className="hidden sm:inline-block text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Filters</span>
                                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                                    <select 
                                        value={levelFilter}
                                        onChange={(e) => setLevelFilter(e.target.value)}
                                        className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm cursor-pointer w-full"
                                    >
                                        {uniqueLevels.map(level => (
                                            <option key={level} value={level}>{level === 'All' ? 'All Levels' : level}</option>
                                        ))}
                                    </select>
                                    
                                    <select 
                                        value={platformFilter}
                                        onChange={(e) => setPlatformFilter(e.target.value)}
                                        className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm cursor-pointer w-full"
                                    >
                                        {uniquePlatforms.map(platform => (
                                            <option key={platform} value={platform}>{platform === 'All' ? 'All Platforms' : platform}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {coursesLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <CardSkeleton key={`course-skeleton-${i}`} />
                                ))}
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="text-center py-24 text-gray-400">
                                <Play size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-bold text-lg">No courses curated yet.</p>
                                <p className="text-sm mt-1 max-w-sm mx-auto">The team is sourcing the best Web3 courses. Check back soon!</p>
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="text-center py-24 text-gray-500">
                                <Search size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-bold text-lg text-gray-900">No courses found.</p>
                                <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setPriceFilter('All'); setLevelFilter('All'); setPlatformFilter('All'); }}
                                    className="mt-4 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-100 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredCourses.map((course, i) => {
                                    const platformStyle = PLATFORM_COLORS[course.platform] || PLATFORM_COLORS['Other'];
                                    return (
                                        <motion.div
                                            key={course._id}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
                                            className="relative"
                                        >
                                            {/* Bookmark Button — outside overflow-hidden so it's always visible */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggleBookmark(course);
                                                }}
                                                className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-md border border-white/50 flex items-center justify-center text-gray-500 hover:text-purple-600 hover:scale-110 active:scale-95 transition-all"
                                                title={isBookmarked(course._id) ? 'Remove Bookmark' : 'Bookmark Course'}
                                            >
                                                <Bookmark
                                                    size={16}
                                                    fill={isBookmarked(course._id) ? 'currentColor' : 'none'}
                                                    className={isBookmarked(course._id) ? 'text-purple-600' : ''}
                                                />
                                            </button>
                                            <a
                                                href={course.url}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="group block bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(109,40,217,0.08)] hover:border-purple-100 transition-all duration-500 h-full"
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-full h-44 overflow-hidden relative">
                                                    {course.thumbnail ? (
                                                        <img
                                                            src={course.thumbnail}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    {/* Fallback banner — shown when thumbnail is absent or broken */}
                                                    <div
                                                        className="w-full h-full items-center justify-center flex-col gap-2"
                                                        style={{ display: course.thumbnail ? 'none' : 'flex', background: 'linear-gradient(135deg,#ede9fe 0%,#c7d2fe 100%)' }}
                                                    >
                                                        <span className="text-3xl">
                                                            {course.platform === 'YouTube' ? '▶' :
                                                                course.platform === 'Coursera' ? '🎓' :
                                                                    course.platform === 'Udemy' ? '📚' :
                                                                        course.platform === 'Anthropic' ? '🤖' :
                                                                            course.platform === 'GitHub' ? '⌨️' : '🌐'}
                                                        </span>
                                                        <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">{course.platform}</span>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-6 flex flex-col gap-3">
                                                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{course.level}</span>
                                                    <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-purple-700 transition-colors">{course.title}</h3>
                                                    {course.description && (
                                                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{course.description}</p>
                                                    )}
                                                    {course.tags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            {course.tags.slice(0, 3).map(tag => (
                                                                <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">#{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-50">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{course.platform}</span>
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 group-hover:gap-2.5 transition-all">
                                                            Go to Course <ExternalLink size={12} />
                                                        </span>
                                                    </div>
                                                </div>
                                            </a>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── COMMUNITY FEED TAB ── */}
                {activeTab === 'community' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Community</h2>
                            <button
                                onClick={() => user ? setShowCommunityModal(true) : navigate('/login')}
                                className="flex px-5 py-2 bg-gray-900 text-white font-bold rounded-full text-[14px] items-center gap-2 hover:bg-gray-700 transition-colors"
                            >
                                <PenLine size={14} /> Post
                            </button>
                        </div>

                        {communityLoading ? (
                            <div className="max-w-[600px] mx-auto border border-gray-200 rounded-2xl overflow-hidden bg-white">
                                <FeedSkeleton rows={5} />
                            </div>
                        ) : communityLessons.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 max-w-[600px] mx-auto border border-gray-200 rounded-2xl bg-white">
                                <Users size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="font-bold text-base text-gray-900">Nothing here yet.</p>
                                <p className="text-sm mt-1">Be the first to share your Web3 knowledge!</p>
                            </div>
                        ) : (
                            <div className="max-w-[600px] mx-auto border border-gray-200 rounded-2xl overflow-hidden bg-white divide-y divide-gray-100">
                                {communityLessons.map((lesson, i) => {
                                    const initials = lesson.author?.username
                                        ? lesson.author.username.charAt(0).toUpperCase()
                                        : (lesson.author?.name ? lesson.author.name.charAt(0).toUpperCase() : '?');
                                    const isLiked = lesson.upvotes?.includes(user?.id);
                                    const diff = Date.now() - new Date(lesson.createdAt).getTime();
                                    const timeAgo = diff < 3600000
                                        ? `${Math.floor(diff / 60000)}m`
                                        : diff < 86400000
                                            ? `${Math.floor(diff / 3600000)}h`
                                            : `${Math.floor(diff / 86400000)}d`;

                                    return (
                                        <div
                                            key={lesson._id}
                                            className="flex gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/academy/${lesson.slug}`)}
                                        >
                                            {/* Avatar */}
                                            <div className="shrink-0 pt-0.5">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm text-gray-600 overflow-hidden">
                                                    {lesson.author?.avatarUrl
                                                        ? <img src={lesson.author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                                        : <span>{initials}</span>
                                                    }
                                                </div>
                                            </div>

                                            {/* Right column */}
                                            <div className="flex-grow min-w-0">
                                                {/* Header: Name · @handle · time · ··· */}
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <div className="flex items-baseline gap-1 flex-wrap min-w-0">
                                                        <span className="font-bold text-[15px] text-gray-900 leading-none">{lesson.author?.username || lesson.author?.name || 'Anonymous'}</span>
                                                        <span className="text-gray-500 text-[14px] hidden sm:inline">@{lesson.author?.username || (lesson.author?.name || 'user').toLowerCase().replace(/\s+/g, '')}</span>
                                                        <span className="text-gray-400 text-[14px]">·</span>
                                                        <span className="text-gray-500 text-[14px]">{timeAgo}</span>
                                                    </div>
                                                    {/* ⋯ menu */}
                                                    <div className="relative shrink-0 ml-1">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setCommunityMenuOpen(communityMenuOpen === lesson._id ? null : lesson._id); }}
                                                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                                            title="More"
                                                        >
                                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                                                            </svg>
                                                        </button>
                                                        {communityMenuOpen === lesson._id && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setCommunityMenuOpen(null)} />
                                                                <div className="absolute right-0 top-8 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl py-1 min-w-[140px] text-sm overflow-hidden">
                                                                    <button
                                                                        onClick={e => { e.stopPropagation(); setCommunityMenuOpen(null); }}
                                                                        className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                                                    >Follow</button>
                                                                    {user?.id === lesson.author?._id && (
                                                                        <>
                                                                            <button
                                                                                onClick={e => { e.stopPropagation(); setEditingLesson({ _id: lesson._id, title: lesson.title, description: lesson.description || '', contentMarkdown: lesson.contentMarkdown || '' }); setCommunityMenuOpen(null); }}
                                                                                className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                                                                            >Edit</button>
                                                                            <button
                                                                                onClick={e => { e.stopPropagation(); handleDeleteLesson(lesson._id); }}
                                                                                className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                                                                            >Delete</button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                </div>

                                                {/* Post text */}
                                                <p className="text-[15px] text-gray-900 leading-relaxed mb-3">
                                                    {lesson.title}
                                                    {lesson.description && (
                                                        <span className="text-gray-500"> — {lesson.description}</span>
                                                    )}
                                                </p>

                                                {/* Action bar — 3 buttons only: comment, like, share */}
                                                <div
                                                    className="flex items-center gap-1 -ml-2"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {/* Comment — opens the lesson */}
                                                    <button
                                                        onClick={() => navigate(`/academy/${lesson.slug}`)}
                                                        className="flex items-center gap-1 p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                                        title="Read lesson"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                                        </svg>
                                                    </button>

                                                    {/* Like */}
                                                    <button
                                                        onClick={() => handleUpvote(lesson._id)}
                                                        className={`flex items-center gap-1 p-2 rounded-full transition-all ${isLiked ? 'text-pink-500 bg-pink-50' : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50'}`}
                                                        title="Like"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="18" height="18" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                                        </svg>
                                                        {(lesson.upvotes?.length || 0) > 0 && (
                                                            <span className="text-[13px] tabular-nums">{lesson.upvotes.length}</span>
                                                        )}
                                                    </button>

                                                    {/* Share — copy link */}
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/academy/${lesson.slug}`);
                                                        }}
                                                        className="flex items-center gap-1 p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                                        title="Copy link"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                                            <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Mobile FAB removed for clean unified layout */}
                    </motion.div>
                )}
            </div>

            {/* Publish Lesson Modal */}
            {showCommunityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowCommunityModal(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl w-full max-w-2xl relative z-10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Plus size={24} className="text-purple-500" /> Publish a Lesson
                        </h2>
                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Title</label>
                                <input 
                                    required
                                    type="text" 
                                    value={newPostData.title}
                                    onChange={e => setNewPostData(prev => ({...prev, title: e.target.value}))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 font-medium" 
                                    placeholder="e.g. A Deep Dive into Zero-Knowledge Proofs"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Short Description (Optional)</label>
                                <input 
                                    type="text" 
                                    value={newPostData.description}
                                    onChange={e => setNewPostData(prev => ({...prev, description: e.target.value}))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 font-medium" 
                                    placeholder="A brief summary of what this covers."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 mt-2">Lesson Content (Markdown Supported)</label>
                                <textarea 
                                    required
                                    value={newPostData.contentMarkdown}
                                    onChange={e => setNewPostData(prev => ({...prev, contentMarkdown: e.target.value}))}
                                    className="w-full h-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 font-medium resize-none font-mono text-sm leading-relaxed" 
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
                                    className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setEditingLesson(null)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl w-full max-w-2xl relative z-10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <PenLine size={24} className="text-purple-500" /> Edit Lesson
                        </h2>
                        <form onSubmit={handleUpdateLesson} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Title</label>
                                <input 
                                    required
                                    type="text" 
                                    value={editingLesson.title}
                                    onChange={e => setEditingLesson(prev => ({...prev, title: e.target.value}))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 font-medium" 
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Short Description (Optional)</label>
                                <input 
                                    type="text" 
                                    value={editingLesson.description}
                                    onChange={e => setEditingLesson(prev => ({...prev, description: e.target.value}))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 font-medium" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 mt-2">Lesson Content (Markdown Supported)</label>
                                <textarea 
                                    required
                                    value={editingLesson.contentMarkdown}
                                    onChange={e => setEditingLesson(prev => ({...prev, contentMarkdown: e.target.value}))}
                                    className="w-full h-64 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 font-medium resize-none font-mono text-sm leading-relaxed" 
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
                                    className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                    {submittingPost ? 'Updating...' : 'Update Lesson'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
