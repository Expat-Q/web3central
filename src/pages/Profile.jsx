import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, LogOut, Award, BookOpen, Target, Zap, ChevronRight, TrendingUp,
    Bookmark, ExternalLink, Trash2, Edit3, Save, X, Twitter, FolderGit2
} from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import SafeLink from '../components/SafeLink';
import { updateProfile, fetchMyTools } from '../services/apiService';

const getDomain = (url) => {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return '';
    }
};

const ToolLogo = ({ tool }) => {
    const [imgError, setImgError] = useState(false);
    const domain = tool.url ? getDomain(tool.url) : null;
    const initialSrc = tool.logo || (domain ? `https://logo.clearbit.com/${domain}?size=128` : null);

    if (imgError || !initialSrc) {
        return (
            <div className="w-full h-full bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-sm">
                {tool.name ? tool.name.charAt(0).toUpperCase() : '?'}
            </div>
        );
    }

    return (
        <img
            src={initialSrc}
            alt={tool.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain drop-shadow-sm"
        />
    );
};

export default function Profile() {
    const { user, login, logout, loading: authLoading } = useAuth(); // assume login can update context cache
    const { bookmarks, toggleBookmark } = useBookmarks();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        completedLessons: 0,
        totalXP: 0,
        avgQuizScore: 0
    });

    const [myTools, setMyTools] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '', twitter: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || user.email === 'guest@web3central.internal')) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user && user.email !== 'guest@web3central.internal') {
            setEditForm({
                name: user.name || '',
                bio: user.bio || '',
                twitter: user.twitter || ''
            });

            let completed = 0;
            let avgScore = 0;

            if (user.learningProgress) {
                const lessons = (user.learningProgress instanceof Map)
                    ? Array.from(user.learningProgress.values())
                    : Object.values(user.learningProgress);

                completed = lessons.filter(l => l.completed).length;
                avgScore = completed > 0
                    ? lessons.reduce((sum, l) => sum + (l.quizScore || 0), 0) / completed
                    : 0;
            }

            setStats({
                completedLessons: completed,
                totalXP: user.totalXP || 0,
                avgQuizScore: Math.round(avgScore)
            });

            // fetch listed tools
            fetchMyTools().then(t => setMyTools(t)).catch(console.error);
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const updatedUser = await updateProfile(editForm);
            // Optimistically update the page and localStorage
            if (updatedUser.user) {
                localStorage.setItem('user', JSON.stringify(updatedUser.user));
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
            setIsEditing(false);
        }
    };

    if (authLoading || !user || user.email === 'guest@web3central.internal') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen text-gray-900 pt-32 pb-32 px-6 relative overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-50 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-60" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 opacity-60" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Profile Header */}
                <div className="bg-white border border-gray-100 p-8 md:p-14 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 blur-[120px] -z-10 rounded-full translate-x-32 -translate-y-32 group-hover:bg-purple-100 transition-colors duration-1000" />

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <div className="relative shrink-0">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-gray-900 text-white flex items-center justify-center text-5xl font-black shadow-2xl relative z-10">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-purple-600 border-4 border-white flex items-center justify-center text-white shadow-lg z-20 shadow-purple-200">
                                <Zap size={20} fill="currentColor" />
                            </div>
                        </div>

                        <div className="text-left flex-grow space-y-4">
                            {isEditing ? (
                                <div className="space-y-4 max-w-xl">
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full text-3xl font-black text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500"
                                        placeholder="Your Name"
                                    />
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        className="w-full text-gray-600 bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[100px] focus:ring-2 focus:ring-purple-500"
                                        placeholder="Add a bio... e.g., Smart Contract Dev @ Example"
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 flex-grow focus-within:ring-2 focus-within:ring-purple-500">
                                            <Twitter size={18} className="text-sky-500" />
                                            <input
                                                type="text"
                                                value={editForm.twitter}
                                                onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                                                className="w-full bg-transparent border-none focus:ring-0 p-4 text-gray-700 placeholder-gray-400"
                                                placeholder="Twitter handle (e.g. @0x_builder)"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-4">
                                        <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition">
                                            {saving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-none">{user.name}</h1>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-4 py-1.5 rounded-xl bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-widest border border-purple-100 flex items-center gap-2">
                                                <Award size={12} /> {user.rank || 'Novice'}
                                            </span>
                                            {user.role === 'admin' && (
                                                <span className="px-4 py-1.5 rounded-xl bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-widest border border-orange-100">Admin</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-gray-400 font-bold text-xs">
                                        <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"><Mail size={14} className="text-gray-400" /> {user.email}</span>
                                        {user.twitter && (
                                            <a href={user.twitter.startsWith('http') ? user.twitter : `https://x.com/${user.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100 text-sky-600 hover:bg-sky-100 transition">
                                                <Twitter size={14} /> {user.twitter}
                                            </a>
                                        )}
                                    </div>

                                    {user.bio ? (
                                        <p className="text-gray-600 leading-relaxed max-w-xl">{user.bio}</p>
                                    ) : (
                                        <p className="text-gray-400 italic max-w-xl text-sm">No bio provided. Tell the community about yourself!</p>
                                    )}
                                </>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="flex flex-col gap-3 shrink-0">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs uppercase tracking-widest transition-all shadow-sm border border-indigo-100"
                                >
                                    <Edit3 size={16} /> Edit Profile
                                </button>
                                <button
                                    onClick={logout}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-gray-100 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 font-bold text-xs uppercase tracking-widest transition-all shadow-sm"
                                >
                                    <LogOut size={16} /> Terminate
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
                    {[
                        { label: 'Completed Lessons', value: stats.completedLessons, icon: <BookOpen />, color: 'purple' },
                        { label: 'Total Mastery XP', value: stats.totalXP, icon: <Award />, color: 'indigo' },
                        { label: 'Avg. Quiz Score', value: `${stats.avgQuizScore}%`, icon: <Target />, color: 'purple' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className="bg-white p-10 flex flex-col items-center text-center group border border-gray-100 hover:border-purple-200 hover:shadow-[0_20px_50px_rgba(109,40,217,0.05)] transition-all rounded-[2.5rem] shadow-sm relative overflow-hidden"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-6 group-hover:scale-110 group-hover:text-purple-600 group-hover:bg-purple-50 transition-all duration-500 shadow-sm">
                                {React.cloneElement(stat.icon, { size: 32 })}
                            </div>
                            <h3 className="text-5xl font-black text-gray-900 mb-2 tracking-tight leading-none group-hover:text-purple-600 transition-colors">{stat.value}</h3>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Left Column (Learning & Submitted Tools) */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Learning Velocity */}
                        <div className="bg-white p-8 md:p-12 border border-gray-100 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                                        <TrendingUp size={20} />
                                    </div>
                                    Learning Velocity
                                </h2>
                            </div>

                            <div className="space-y-4 flex-grow">
                                {Object.keys(user.learningProgress || {}).length > 0 ? (
                                    Object.entries(user.learningProgress).map(([slug, progress], i) => (
                                        <div key={slug} className="p-6 rounded-[2rem] bg-gray-50 border border-gray-50 flex items-center justify-between hover:bg-white hover:border-purple-100 transition-all group relative overflow-hidden shadow-sm hover:shadow-md">
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-black text-xs text-gray-400 group-hover:text-purple-600 group-hover:border-purple-200 transition-all">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-gray-900 mb-1 tracking-tight capitalize">{slug.replace(/-/g, ' ')}</h4>
                                                    <div className="flex items-center gap-4">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            Efficiency: <span className="text-purple-600">{progress.quizScore}%</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse" />
                                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Mastered</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500 mb-6 font-medium text-lg leading-relaxed">Your mastery journey is awaiting initialization.</p>
                                        <Link to="/academy" className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white font-bold uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-gray-200 hover:bg-purple-600 hover:scale-[1.02]">
                                            Initialize Training <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* My Listed Tools */}
                        <div className="bg-white p-8 md:p-12 border border-gray-100 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-sm">
                                        <FolderGit2 size={20} />
                                    </div>
                                    My Submitted Tools
                                </h2>
                                <span className="px-4 py-2 bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-100">
                                    {myTools.length} Listed
                                </span>
                            </div>

                            <div className="space-y-4 flex-grow custom-scrollbar overflow-x-auto">
                                {myTools.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {myTools.map((tool) => (
                                            <div key={tool._id} className="p-5 rounded-[1.5rem] bg-gray-50 border border-gray-100 flex items-center justify-between hover:bg-white hover:border-sky-200 hover:shadow-lg transition-all group">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 p-2 flex-shrink-0">
                                                        <ToolLogo tool={tool} />
                                                    </div>
                                                    <div className="min-w-0 pr-4">
                                                        <h4 className="font-bold text-gray-900 truncate group-hover:text-sky-600 transition-colors">{tool.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`w-2 h-2 rounded-full ${tool.status === 'active' ? 'bg-emerald-500' : tool.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tool.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 px-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                        <FolderGit2 className="mx-auto text-slate-300 mb-4" size={40} />
                                        <p className="text-slate-800 font-bold mb-2">You haven't submitted any tools yet.</p>
                                        <Link to="/submit-tool" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sky-600 font-bold uppercase tracking-wider text-xs rounded-xl border border-slate-200 hover:border-sky-200 hover:shadow-md transition-all mt-4">
                                            Submit Protocol
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column (Saved Protocols) */}
                    <div className="bg-white p-8 md:p-10 border border-gray-100 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col h-full lg:max-h-[850px]">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-black tracking-tight text-gray-900 uppercase flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Bookmark size={18} className="fill-current" />
                                </div>
                                Saved Vault
                            </h2>
                        </div>

                        <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                            {bookmarks.length > 0 ? (
                                bookmarks.map((tool) => (
                                    <div key={tool.id || tool._id} className="p-4 rounded-3xl bg-white border border-gray-100 flex flex-col hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40 transition-all group">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-2 flex-shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
                                                <ToolLogo tool={tool} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors text-sm flex items-center gap-1.5">
                                                    {tool.name}
                                                    {tool.verified && (
                                                        <span title="Verified Protocol">
                                                            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">{tool.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <SafeLink
                                                url={tool.url}
                                                verified={false}
                                                hideDomain={true}
                                                className="flex-grow h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 hover:shadow-md transition-all text-[11px] font-bold uppercase tracking-wider relative group/link"
                                            >
                                                <div className="flex flex-row items-center justify-center gap-2 w-full absolute inset-0">
                                                    Launch <ExternalLink size={14} className="opacity-70 group-hover/link:opacity-100" />
                                                </div>
                                            </SafeLink>
                                            <button
                                                onClick={() => toggleBookmark(tool)}
                                                className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-200 transition-all shrink-0"
                                                title="Remove Bookmark"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 px-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                                    <Bookmark className="mx-auto text-slate-300 mb-4" size={40} />
                                    <p className="text-slate-800 font-bold mb-2">No tools saved yet</p>
                                    <Link to="/apps" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-bold uppercase tracking-wider text-[10px] rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 hover:shadow-md hover:text-indigo-700 transition-all mt-4">
                                        Directory
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
