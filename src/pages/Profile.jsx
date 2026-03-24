import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, LogOut, Award, BookOpen, Target, Zap, ChevronRight, TrendingUp,
    Bookmark, ExternalLink, Trash2, Edit3, Save, X, Twitter, FolderGit2, Settings
} from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useCourseBookmarks } from '../hooks/useCourseBookmarks';
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
    const { user, setUser, logout, loading: authLoading } = useAuth();
    const { bookmarks, toggleBookmark } = useBookmarks();
    const { bookmarks: courseBookmarks, toggleBookmark: toggleCourseBookmark } = useCourseBookmarks();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        completedLessons: 0,
        totalXP: 0
    });

    const [myTools, setMyTools] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '', twitter: '' });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

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

            if (user.learningProgress) {
                const lessons = (user.learningProgress instanceof Map)
                    ? Array.from(user.learningProgress.values())
                    : Object.values(user.learningProgress);

                completed = lessons.filter(l => l.completed).length;
            }

            setStats({
                completedLessons: completed,
                totalXP: user.totalXP || 0
            });

            // fetch listed tools
            fetchMyTools().then(t => setMyTools(t)).catch(console.error);
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveError('');
        try {
            const updatedUser = await updateProfile(editForm);
            if (updatedUser.user) {
                localStorage.setItem('user', JSON.stringify(updatedUser.user));
                setUser(updatedUser.user); // update context without reload
                setIsEditing(false);
            }
        } catch (error) {
            console.error(error);
            setSaveError('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
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
                <div className="bg-white border border-gray-100 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.04)] mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 blur-[120px] -z-10 rounded-full translate-x-32 -translate-y-32 group-hover:bg-purple-100 transition-colors duration-1000" />


                    <div className="flex flex-col items-center md:items-start md:flex-row gap-6">
                        <div className="relative shrink-0">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-2xl object-cover shadow-xl relative z-10" />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-3xl font-bold shadow-xl relative z-10">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-purple-600 border-3 border-white flex items-center justify-center text-white shadow-md z-20">
                                <Zap size={14} fill="currentColor" />
                            </div>
                        </div>

                        <div className="text-center md:text-left flex-grow space-y-4">
                                <>
                                    <div className="flex flex-col md:flex-row items-center gap-4">
                                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-none">{user.name}</h1>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-4 py-1.5 rounded-xl bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-widest border border-purple-100 flex items-center gap-2">
                                                <Award size={12} /> {user.rank || 'Novice'}
                                            </span>
                                            {user.role === 'admin' && (
                                                <span className="px-4 py-1.5 rounded-xl bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-widest border border-orange-100">Admin</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 font-bold text-xs">
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
                        </div>


                    </div>

                    {/* Edit Profile Modal */}
                    {isEditing && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsEditing(false)}>
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                            <div
                                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 space-y-5"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
                                    <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition">
                                        ✕
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 ml-1">Display Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 ml-1">Bio</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            className="w-full text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                                            placeholder="Add a bio... e.g., Smart Contract Dev @ Example"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 ml-1">Twitter Handle</label>
                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition">
                                            <Twitter size={16} className="text-sky-500 shrink-0" />
                                            <input
                                                type="text"
                                                value={editForm.twitter}
                                                onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                                                className="w-full bg-transparent border-none focus:ring-0 py-3 px-3 text-gray-700 placeholder-gray-400 outline-none"
                                                placeholder="@0x_builder"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button onClick={handleSaveProfile} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition text-sm">
                                        {saving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action icons — settings top-left, logout top-right */}
                    {!isEditing && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="absolute top-5 left-5 md:top-8 md:left-8 w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all z-20"
                                title="Edit Profile"
                            >
                                <Settings size={18} />
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to sign out?')) {
                                        logout();
                                    }
                                }}
                                className="absolute top-5 right-5 md:top-8 md:right-8 w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:text-red-600 hover:border-red-300 hover:bg-red-100 transition-all z-20"
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    {[
                        { label: 'Lessons Completed', value: stats.completedLessons, icon: <BookOpen size={18} />, color: 'purple' },
                        { label: 'Total XP Earned', value: stats.totalXP, icon: <Award size={18} />, color: 'indigo' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="bg-white px-4 py-5 flex flex-col items-center text-center border border-gray-100 hover:border-purple-200 transition-all rounded-2xl shadow-sm"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3">
                                {stat.icon}
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-tight leading-none">{stat.value}</h3>
                            <p className="text-gray-400 text-xs font-medium">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Left Column (Learning & Submitted Tools) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Learning Progress */}
                        <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-2xl shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-base font-bold tracking-tight text-gray-900 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                                        <TrendingUp size={16} />
                                    </div>
                                    Learning Progress
                                </h2>
                            </div>

                            <div className="space-y-4 flex-grow">
                                {Object.keys(user.learningProgress || {}).length > 0 ? (
                                    Object.entries(user.learningProgress).map(([slug, progress], i) => (
                                        <div key={slug} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between hover:bg-white hover:border-purple-100 transition-all">
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-bold text-xs text-gray-400">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-sm text-gray-900 capitalize">{slug.replace(/-/g, ' ')}</h4>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse" />
                                                <span className="text-xs font-semibold text-green-600">Completed</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500 mb-6 font-medium text-lg leading-relaxed">You haven't completed any lessons yet.</p>
                                        <Link to="/academy" className="inline-flex items-center gap-3 px-6 py-3 bg-purple-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:bg-purple-700">
                                            Start Learning <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* My Listed Tools */}
                        <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-2xl shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-sm font-bold tracking-tight text-gray-900 flex items-center gap-2 whitespace-nowrap">
                                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                                        <FolderGit2 size={16} />
                                    </div>
                                    Submitted Tools
                                </h2>
                                <span className="px-3 py-1.5 bg-slate-50 text-slate-500 font-medium text-xs rounded-lg border border-slate-100 whitespace-nowrap shrink-0">
                                    {myTools.length} Listed
                                </span>
                            </div>

                            <div className="space-y-4 flex-grow custom-scrollbar overflow-x-auto">
                                {myTools.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {myTools.map((tool) => (
                                            <div key={tool._id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between hover:bg-white hover:border-sky-200 transition-all group">
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

                    {/* Right Column (Saved Content) */}
                    <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-2xl shadow-sm flex flex-col h-full lg:max-h-[850px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-bold tracking-tight text-gray-900 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Bookmark size={14} className="fill-current" />
                                </div>
                                Saved Items
                            </h2>
                        </div>

                        <div className="space-y-8 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                            {/* Tools Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Tools</h3>
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
                                                    title="Remove Tool"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-500 text-xs font-medium">No tools saved yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Courses Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Courses</h3>
                                {courseBookmarks.length > 0 ? (
                                    courseBookmarks.map((course) => (
                                        <div key={course.id || course._id} className="p-4 rounded-3xl bg-white border border-gray-100 flex flex-col hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/40 transition-all group">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-16 h-12 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden bg-slate-50 flex items-center justify-center p-1 border border-slate-100">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt="" className="max-w-full max-h-full object-contain" onError={e => e.target.style.display = 'none'} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xl">🎓</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors text-sm">
                                                        {course.title}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">{course.platform}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <a
                                                    href={course.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-grow h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 hover:shadow-md transition-all text-[11px] font-bold uppercase tracking-wider relative group/link"
                                                >
                                                    <div className="flex flex-row items-center justify-center gap-2 w-full absolute inset-0">
                                                        Watch <ExternalLink size={14} className="opacity-70 group-hover/link:opacity-100" />
                                                    </div>
                                                </a>
                                                <button
                                                    onClick={() => toggleCourseBookmark(course)}
                                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-200 transition-all shrink-0"
                                                    title="Remove Course"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-500 text-xs font-medium">No courses saved yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
