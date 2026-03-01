import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen,
    Layers,
    Shield,
    Cpu,
    Coins,
    Search,
    ChevronRight,
    Clock,
    Award,
    CheckCircle2,
    Sparkles
} from 'lucide-react';

const slideFromLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const slideFromRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Academy() {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const { user } = useAuth();

    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
                const res = await fetch(`${baseUrl}/academy/lessons`);
                const data = await res.json();
                if (data.success) {
                    setLessons(data.data);
                }
            } catch (err) {
                console.error('Error fetching lessons:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLessons();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const modules = [
        { name: 'All', icon: <Layers size={18} /> },
        { name: 'Web3 Foundations', icon: <BookOpen size={18} /> },
        { name: 'DeFi Architecture', icon: <Coins size={18} /> },
        { name: 'Smart Contract Security', icon: <Shield size={18} /> }
    ];

    const filteredLessons = activeCategory === 'All'
        ? lessons
        : lessons.filter(l => l.module === activeCategory);

    // Helper to check if a lesson is locked
    const isLocked = (prereqs) => {
        if (!user || prereqs.length === 0) return false;
        // Parse the user's progress map
        const progressObj = user?.learningProgress || {};
        return prereqs.some(reqId => !progressObj[reqId]?.completed);
    };

    return (
        <div className="bg-white min-h-screen text-gray-900 pt-32 pb-32 px-6 relative overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-60" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-20">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={slideFromLeft}
                        className="flex flex-col items-center text-center md:items-start md:text-left"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-xs font-bold text-purple-600 tracking-wider uppercase mb-6 shadow-sm">
                            <Sparkles size={14} className="animate-pulse" /> Structured Mastery
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-gray-900 leading-[1.1]">
                            Web3 <span className="text-purple-600">Academy</span>
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl max-w-3xl font-medium leading-relaxed">
                            From basic bridging to institutional-grade protocol analysis. Master the on-chain world with structured, verifiable learning paths.
                        </p>
                    </motion.div>
                </div>

                {/* Categories Tab */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={slideFromRight}
                    className="flex flex-wrap gap-3 mb-16"
                >
                    {modules.map(cat => (
                        <button
                            key={cat.name}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all border shadow-sm ${activeCategory === cat.name
                                ? 'bg-gray-900 border-gray-900 text-white shadow-lg'
                                : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200 hover:text-purple-600'
                                }`}
                        >
                            {cat.icon}
                            {cat.name}
                        </button>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredLessons.map((lesson, i) => (
                        <motion.div
                            key={lesson._id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (i % 3) * 0.1, duration: 0.6, ease: "easeOut" }}
                            className="group"
                        >
                            <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(109,40,217,0.06)] hover:border-purple-100 transition-all duration-500 flex flex-col h-full relative overflow-hidden group/card">
                                {/* Decorative Icon Background */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -translate-y-4 translate-x-4 opacity-0 group-hover:opacity-100 transition-all duration-500" />

                                <div className="mb-8 flex justify-between items-start relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-3xl group-hover:scale-110 shadow-sm transition-transform duration-500 text-purple-600">
                                        <BookOpen size={28} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider border border-purple-100">
                                            {lesson.level}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                                            <Clock size={12} /> {lesson.estimatedTime}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 flex-grow">
                                    <h3 className="text-2xl font-black mb-4 tracking-tight text-gray-900 group-hover:text-purple-600 transition-colors leading-tight">{lesson.title}</h3>
                                    <p className="text-gray-500 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">
                                        {lesson.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 border border-yellow-100 shadow-sm">
                                            <Award size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-900">+{lesson.xpReward} XP</span>
                                    </div>

                                    {user?.learningProgress?.[lesson.id]?.completed ? (
                                        <div className="flex items-center gap-2 text-green-500 bg-green-50 pl-2 pr-4 py-1.5 rounded-full border border-green-100">
                                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                                <CheckCircle2 size={12} className="text-white" />
                                            </div>
                                            <span className="font-bold text-[10px] uppercase tracking-widest">Mastered</span>
                                        </div>
                                    ) : isLocked(lesson.prerequisites) ? (
                                        <div className="flex items-center gap-2 text-gray-400 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-100">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                                <Shield size={12} className="text-gray-500" />
                                            </div>
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
            </div>
        </div>
    );
}
