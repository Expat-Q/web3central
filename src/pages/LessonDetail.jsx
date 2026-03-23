import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { fetchLessonById, submitLessonProgress } from '../services/apiService';
import {
    ArrowLeft,
    BookOpen,
    Award,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Trophy,
    Sparkles,
    Timer,
    Unlock,
    ArrowLeftCircle
} from 'lucide-react';

export default function LessonDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);

    const [finishing, setFinishing] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [completeError, setCompleteError] = useState('');

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const data = await fetchLessonById(slug);
                if (data) {
                    if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
                        data.quiz = data.quiz[0];
                    }
                    setLesson(data);
                }
            } catch (err) {
                console.error('Error fetching lesson:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [slug]);

    const handleCompleteLesson = async () => {
        setFinishing(true);
        setCompleteError('');
        if (user) {
            try {
                const result = await submitLessonProgress(lesson.id, 100);
                setSubmitResult(result);
                
                if (result?.success && result.user) {
                    setUser(result.user);
                    localStorage.setItem('user', JSON.stringify(result.user));
                }
            } catch (err) {
                console.error('Error saving progress:', err);
                setCompleteError('Failed to save your progress. Please try again.');
            }
        } else {
            setSubmitResult({ passed: true, isGuest: true }); // Fallback for unauthenticated viewers
        }
        setFinishing(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!lesson) return (
        <div className="min-h-screen pt-40 flex flex-col items-center bg-white text-gray-500">
            <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
            <Link to="/academy" className="text-purple-600 hover:underline">Return to Academy</Link>
        </div>
    );
    return (
        <div className="min-h-screen pt-32 pb-32 px-6 bg-white relative overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header Navigation */}
                <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <button
                        onClick={() => navigate('/academy')}
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors bg-gray-50 hover:bg-purple-50 px-4 py-2 rounded-xl"
                    >
                        <ArrowLeft size={16} /> Back to Curriculum
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 font-bold text-xs uppercase tracking-wider">
                            <BookOpen size={14} /> {lesson.module}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100 font-bold text-xs uppercase tracking-wider">
                            <Award size={14} /> +{lesson.xpReward} XP
                        </div>
                    </div>
                </div>

                {!submitResult ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.04)] overflow-hidden"
                    >
                        {/* Title Section */}
                        <div className="p-8 md:p-12 border-b border-gray-100 bg-gray-50/50">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                                {lesson.title}
                            </h1>
                        </div>

                        {/* Markdown Content */}
                        <div className="p-5 md:p-12 max-w-none lesson-content">
                            <ReactMarkdown>{lesson.contentMarkdown}</ReactMarkdown>
                        </div>

                        {/* Complete Lesson Action */}
                        <div className="p-6 md:p-8 border-t border-gray-100 flex flex-col items-center gap-3 bg-purple-50/30">
                            <button
                                onClick={handleCompleteLesson}
                                disabled={finishing}
                                className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-base transition-all shadow-md hover:shadow-purple-200 flex items-center gap-2 disabled:opacity-50"
                            >
                                {finishing ? 'Saving Progress...' : 'Mark as Completed'} <CheckCircle2 size={18} />
                            </button>
                            {completeError && (
                                <p className="text-red-500 text-sm font-medium">{completeError}</p>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.04)] overflow-hidden"
                    >
                        <div className="p-12 md:p-20 text-center">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full mb-8 shadow-inner border border-green-100">
                                <Trophy size={48} className="text-green-500" />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Lesson Completed!</h2>

                            {submitResult?.isGuest ? (
                                <p className="text-gray-500 mb-8 max-w-md mx-auto">Great job completing the reading! Sign in or create an account to start earning XP and tracking your progress across modules.</p>
                            ) : submitResult?.passed ? (
                                submitResult.xpGained > 0 ? (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8 inline-block text-left max-w-md mx-auto">
                                        <h4 className="font-bold text-emerald-700 flex items-center gap-2 justify-center mb-2">
                                            <Sparkles size={18} /> Experience Gained
                                        </h4>
                                        <p className="text-emerald-800 text-sm text-center">
                                            You earned <strong>+{submitResult.xpGained} XP!</strong> Your total is now <strong>{submitResult.newTotalXP} XP</strong>. You hold the rank of <strong>{submitResult.newRank}</strong>.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 inline-block text-left max-w-md mx-auto">
                                        <h4 className="font-bold text-blue-700 flex items-center gap-2 justify-center mb-2">
                                            <CheckCircle2 size={18} /> Already Mastered
                                        </h4>
                                        <p className="text-blue-800 text-sm text-center">
                                            You've already completed this lesson. Your XP total is <strong>{submitResult.newTotalXP} XP</strong>.
                                        </p>
                                    </div>
                                )
                            ) : null}

                            <div>
                                <button
                                    onClick={() => navigate('/academy')}
                                    className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2 mx-auto"
                                >
                                    Return to Curriculum <ArrowLeftCircle size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
