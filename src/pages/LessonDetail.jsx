import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { fetchLessonById, submitLessonProgress, rateCommunityLesson } from '../services/apiService';
import { LessonSkeleton } from '../components/Skeleton';

import {
    ArrowLeft,
    BookOpen,
    Award,
    CheckCircle2,
    Trophy,
    Sparkles,
    Unlock,
    ThumbsUp,
    ThumbsDown,
    Zap
} from 'lucide-react';


function extractHandle(str) {
    if (!str) return null;
    const match = str.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
    if (match) return match[1];
    return str.replace('@', '');
}

function AvatarWithFallback({ src, twitterHandle, name, className }) {
    const [idx, setIdx] = useState(0);
    const [failed, setFailed] = useState(false);
    
    const handle = extractHandle(twitterHandle);
    const srcs = [
        handle ? `https://unavatar.io/twitter/${handle}?fallback=false` : null,
        src,
    ].filter(Boolean);
    const current = srcs[idx];
    
    if (!current || failed) {
        return (
            <div className={`bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black shrink-0 ${className}`}>
                {name ? name.charAt(0).toUpperCase() : 'W'}
            </div>
        );
    }
    return (
        <img
            src={current}
            alt={name || 'Avatar'}
            className={`shrink-0 ${className}`}
            onError={() => idx < srcs.length - 1 ? setIdx(idx + 1) : setFailed(true)}
        />
    );
}

export default function LessonDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finishing, setFinishing] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [scrollProgress, setScrollProgress] = useState(0);
    const [rating, setRating] = useState(null); // 'up' | 'down' | null

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const data = await fetchLessonById(slug);
                if (data) {
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

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            setScrollProgress(windowHeight > 0 ? totalScroll / windowHeight : 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Listen for external open-claude event
    useEffect(() => {
        const openClaude = () => window.dispatchEvent(new CustomEvent('open-claude'));
        return () => {};
    }, []);

    const handleCompleteLesson = async () => {
        setFinishing(true);
        setSubmitError('');
        if (user) {
            try {
                // Always use slug as the consistent key
                const result = await submitLessonProgress(lesson.slug || slug, 100);
                setSubmitResult(result);
                if (result?.user) {
                    setUser(result.user);
                    localStorage.setItem('user', JSON.stringify(result.user));
                }
            } catch (err) {
                console.error('Error saving progress:', err);
                setSubmitError('Could not save completion progress. Please retry.');
            }
        } else {
            setSubmitResult({ passed: true, isGuest: true });
        }
        setFinishing(false);
    };

    const handleRate = async (value) => {
        if (!user || !lesson?._id) return;
        try {
            const newRating = rating === value ? null : value;
            setRating(newRating);
            if (newRating) await rateCommunityLesson(lesson._id, newRating);
        } catch (err) {
            console.error('Rating error:', err);
        }
    };

    if (loading) return <LessonSkeleton />;


    if (!lesson) return (
        <div className="min-h-screen pt-40 flex flex-col items-center bg-white text-gray-500">
            <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
            <Link to="/academy" className="text-purple-600 hover:underline">Return to Academy</Link>
        </div>
    );

    const isCompleted = user?.learningProgress?.[lesson.slug]?.completed;

    return (
        <div className="min-h-screen bg-white relative">
            {/* Reading Progress bar */}
            <div
                className="fixed top-0 left-0 h-0.5 bg-gray-900 z-50 transition-all duration-100"
                style={{ width: `${scrollProgress * 100}%` }}
            />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">

                {/* ── Back nav ── */}
                <button
                    onClick={() => navigate('/academy')}
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-900 transition-colors mb-10 font-medium"
                >
                    <ArrowLeft size={15} /> Back to Academy
                </button>

                {/* ── Author / Meta row (X-style) ── */}
                <div className="flex items-start gap-3 mb-6">
                    {/* Using unavatar.io via AvatarWithFallback */}
                    <AvatarWithFallback
                        src={lesson.author?.avatarUrl}
                        twitterHandle={lesson.author?.twitter}
                        name={lesson.author?.name || lesson.author?.username || 'Web3Central'}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-50"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-bold text-gray-900 text-[15px]">{lesson.author?.username || lesson.author?.name || 'Web3Central'}</span>
                            <span className="text-gray-400 text-sm">@{lesson.author?.username || (lesson.author?.name || 'web3central').toLowerCase().replace(/\s+/g, '')}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-400 text-sm">
                                {new Date(lesson.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        {isCompleted && (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={10} /> Mastered
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Title ── */}
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight tracking-tight mb-3">
                    {lesson.title}
                </h1>

                {lesson.description && (
                    <p className="text-gray-500 text-base leading-relaxed mb-8 border-b border-gray-100 pb-8">
                        {lesson.description}
                    </p>
                )}

                {/* ── Lesson body (Markdown rendered) ── */}
                <div className="text-[15px] leading-[1.85] text-gray-900 font-medium">
                    <ReactMarkdown
                        components={{
                            h1: ({ children }) => <h1 className="text-2xl font-black text-gray-900 mt-8 mb-4">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-black text-gray-900 mt-7 mb-3">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">{children}</h3>,
                            p: ({ children }) => <p className="mb-5">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-2">{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-purple-300 pl-4 italic text-gray-700 mb-5">{children}</blockquote>
                            ),
                            code: ({ inline, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                if (inline) {
                                    return (
                                        <code className="bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                                return (
                                    <pre className="bg-gray-900 text-green-300 rounded-xl p-4 mb-5 overflow-x-auto text-[13px] leading-6 font-mono">
                                        {match?.[1] && <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">{match[1]}</div>}
                                        <code {...props}>{children}</code>
                                    </pre>
                                );
                            },
                        }}
                    >
                        {lesson.contentMarkdown || ''}
                    </ReactMarkdown>
                </div>



                {/* ── Complete / XP section ── */}
                {(!lesson.author || lesson.isCurated) && (
                    <div className="mt-8 border border-gray-100 rounded-2xl p-6 bg-gray-50">
                    {!submitResult ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                {(!lesson.author || lesson.isCurated) && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <Award size={16} className="text-amber-500" />
                                        <span className="font-bold text-gray-900 text-sm">Earn {lesson.xpReward || 100} XP</span>
                                    </div>
                                )}
                                <p className="text-gray-500 text-xs">
                                    {scrollProgress < 0.75 ? 'Read to the bottom to unlock completion.' : 'Ready to mark as completed!'}
                                </p>
                                {submitError && (
                                    <p className="text-red-600 text-xs font-semibold mt-2">{submitError}</p>
                                )}
                            </div>
                            <button
                                onClick={handleCompleteLesson}
                                disabled={finishing || scrollProgress < 0.75}
                                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-purple-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900 shadow-sm"
                            >
                                {finishing ? 'Saving...' : scrollProgress < 0.75
                                    ? <><Unlock size={14} className="opacity-60" /> Keep Reading</>
                                    : <><CheckCircle2 size={14} /> Mark as Completed</>
                                }
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Trophy size={18} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {submitResult.isGuest ? 'Lesson Read!' : 'Lesson Completed!'}
                                    </p>
                                    {(submitResult.xpGained > 0 && (!lesson.author || lesson.isCurated)) && (
                                        <p className="text-green-600 text-xs font-bold">+{submitResult.xpGained} XP · {submitResult.newRank}</p>
                                    )}
                                    {submitResult.isGuest && (
                                        <p className="text-gray-500 text-xs">
                                            <Link to="/signup" className="text-purple-600 font-semibold hover:underline">Create an account</Link> to track progress.
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/academy')}
                                className="shrink-0 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Continue Learning →
                            </button>
                        </motion.div>
                    )}
                </div>
                )}
            </div>
        </div>
    );
}
