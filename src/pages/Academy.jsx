import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchCuratedCourses } from '../services/apiService';
import {
    BookOpen, Layers, Shield, Coins, ChevronRight, Clock,
    Award, CheckCircle2, Sparkles, Lock, ExternalLink,
    Play, Globe, Bookmark
} from 'lucide-react';
import { useCourseBookmarks } from '../hooks/useCourseBookmarks';

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
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('lessons');
    const { user, loading: authLoading } = useAuth();
    const { toggleBookmark, isBookmarked } = useCourseBookmarks();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const fetchAll = async () => {
            try {
                const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
                const [lessonsRes, coursesData] = await Promise.all([
                    fetch(`${baseUrl}/academy/lessons`).then(r => r.json()),
                    fetchCuratedCourses().catch(() => [])
                ]);
                if (lessonsRes.success) setLessons(lessonsRes.data);
                setCourses(coursesData);
            } catch (err) {
                console.error('Error fetching academy data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const LESSON_MODULES = [
        { name: 'All', icon: <Layers size={18} /> },
        { name: 'Web3 Foundations', icon: <BookOpen size={18} /> },
        { name: 'DeFi Architecture', icon: <Coins size={18} /> },
        { name: 'Smart Contract Security', icon: <Shield size={18} /> }
    ];

    const filteredLessons = activeCategory === 'All'
        ? lessons
        : lessons.filter(l => l.module === activeCategory);

    const isLocked = (prereqs = []) => {
        if (!user || prereqs.length === 0) return false;
        const progressObj = user?.learningProgress || {};
        return prereqs.some(reqId => !progressObj[reqId]?.completed);
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
                        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-gray-900 leading-[1.1]">
                            Web3 <span className="text-purple-600">Academy</span>
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl max-w-3xl font-medium leading-relaxed">
                            From basic bridging to institutional-grade analysis. Curated courses, lessons, and quizzes — all in one place.
                        </p>
                    </motion.div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-10 border-b border-gray-100 pb-1">
                    <button
                        onClick={() => setActiveTab('lessons')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'lessons'
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <span className="flex items-center gap-2"><BookOpen size={15} /> Interactive Lessons</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'courses'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-500 hover:text-purple-700 hover:bg-purple-50'
                            }`}
                    >
                        <Globe size={15} /> Curated Courses
                        {courses.length > 0 && (
                            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-bold">{courses.length}</span>
                        )}
                    </button>
                </div>

                {/* ── LESSONS TAB ── */}
                {activeTab === 'lessons' && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-wrap gap-3 mb-12"
                        >
                            {LESSON_MODULES.map(cat => (
                                <button
                                    key={cat.name}
                                    onClick={() => setActiveCategory(cat.name)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all border shadow-sm ${activeCategory === cat.name
                                        ? 'bg-gray-900 border-gray-900 text-white shadow-lg'
                                        : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200 hover:text-purple-600'
                                        }`}
                                >
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </motion.div>

                        {filteredLessons.length === 0 ? (
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
                                        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(109,40,217,0.06)] hover:border-purple-100 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -translate-y-4 translate-x-4 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                            <div className="mb-8 flex justify-between items-start relative z-10">
                                                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-3xl group-hover:scale-110 shadow-sm transition-transform duration-500 text-purple-600">
                                                    <BookOpen size={28} />
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider border border-purple-100">{lesson.level}</span>
                                                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                                                        <Clock size={12} /> {lesson.estimatedTime}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative z-10 flex-grow">
                                                <h3 className="text-2xl font-black mb-4 tracking-tight text-gray-900 group-hover:text-purple-600 transition-colors leading-tight">{lesson.title}</h3>
                                                <p className="text-gray-500 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">{lesson.description}</p>
                                            </div>
                                            <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 border border-yellow-100 shadow-sm"><Award size={14} /></div>
                                                    <span className="text-xs font-bold text-gray-900">+{lesson.xpReward} XP</span>
                                                </div>
                                                {user?.learningProgress?.[lesson.id]?.completed ? (
                                                    <div className="flex items-center gap-2 text-green-500 bg-green-50 pl-2 pr-4 py-1.5 rounded-full border border-green-100">
                                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><CheckCircle2 size={12} className="text-white" /></div>
                                                        <span className="font-bold text-[10px] uppercase tracking-widest">Mastered</span>
                                                    </div>
                                                ) : isLocked(lesson.prerequisites) ? (
                                                    <div className="flex items-center gap-2 text-gray-400 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-100">
                                                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"><Shield size={12} className="text-gray-500" /></div>
                                                        <span className="font-bold text-[10px] uppercase tracking-widest">Locked</span>
                                                    </div>
                                                ) : (
                                                    <Link
                                                        to={`/academy/${lesson.slug}`}
                                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-gray-200"
                                                    >
                                                        Initialize <ChevronRight size={14} />
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
                        {courses.length === 0 ? (
                            <div className="text-center py-24 text-gray-400">
                                <Play size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-bold text-lg">No courses curated yet.</p>
                                <p className="text-sm mt-1 max-w-sm mx-auto">The team is sourcing the best Web3 courses. Check back soon!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {courses.map((course, i) => {
                                    const platformStyle = PLATFORM_COLORS[course.platform] || PLATFORM_COLORS['Other'];
                                    return (
                                        <motion.div
                                            key={course._id}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
                                        >
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
                                                    <div className="absolute top-3 right-3 flex gap-2">
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${platformStyle} bg-white/90 backdrop-blur`}>
                                                            {course.platform}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border bg-white/90 backdrop-blur ${course.isFree ? 'text-emerald-700 border-emerald-200' : 'text-amber-700 border-amber-200'}`}>
                                                            {course.isFree ? 'FREE' : 'PAID'}
                                                        </span>
                                                    </div>

                                                    {/* Bookmark Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            toggleBookmark(course);
                                                        }}
                                                        className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-sm border border-white/20 flex items-center justify-center text-gray-500 hover:text-purple-600 hover:scale-110 active:scale-95 transition-all z-20"
                                                    >
                                                        <Bookmark
                                                            size={18}
                                                            fill={isBookmarked(course._id) ? 'currentColor' : 'none'}
                                                            className={isBookmarked(course._id) ? 'text-purple-600' : ''}
                                                        />
                                                    </button>
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
            </div>
        </div>
    );
}
