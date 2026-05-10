import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fetchCuratedCourses } from '../services/apiService';
import { Search, Play, ExternalLink, Bookmark, Share2, Sparkles } from 'lucide-react';
import { useCourseBookmarks } from '../hooks/useCourseBookmarks';
import { CardSkeleton } from '../components/Skeleton';

const PLATFORM_COLORS = {
    'YouTube': 'text-red-600 bg-red-50',
    'Coursera': 'text-blue-600 bg-blue-50',
    'Udemy': 'text-purple-600 bg-purple-50',
    'Anthropic': 'text-amber-600 bg-amber-50',
    'GitHub': 'text-gray-700 bg-gray-100',
    'Other': 'text-indigo-600 bg-indigo-50'
};

export default function Academy() {
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceFilter, setPriceFilter] = useState('All'); // 'All', 'Free', 'Paid'
    const [levelFilter, setLevelFilter] = useState('All'); 
    const [platformFilter, setPlatformFilter] = useState('All');

    const { user } = useAuth();
    const { isBookmarked, toggleBookmark } = useCourseBookmarks();

    useEffect(() => {
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

        fetchCoursesData();
    }, []);

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const isFree = course.isFree;
        const matchesPrice = priceFilter === 'All' ? true : (priceFilter === 'Free' ? isFree : !isFree);
        const matchesLevel = levelFilter === 'All' ? true : course.level === levelFilter;
        const matchesPlatform = platformFilter === 'All' ? true : course.platform === platformFilter;

        return matchesSearch && matchesPrice && matchesLevel && matchesPlatform;
    });

    const uniquePlatforms = ['All', ...new Set(courses.map(c => c.platform).filter(Boolean))];
    const uniqueLevels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

    return (
        <div className="bg-white min-h-screen text-gray-900 pt-2 pb-32 px-6 relative overflow-x-hidden">
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
                            From basic bridging to institutional-grade analysis. Curated Web3 courses all in one place.
                        </p>
                    </motion.div>
                </div>

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

                                        {/* Share Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const shareUrl = `${window.location.origin}/academy?search=${encodeURIComponent(course.title)}`;
                                                if (navigator.share) {
                                                    navigator.share({ title: course.title, text: course.description, url: shareUrl }).catch(() => {});
                                                } else {
                                                    navigator.clipboard.writeText(shareUrl);
                                                    alert('Link copied to clipboard!');
                                                }
                                            }}
                                            className="absolute top-3 right-14 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-md border border-white/50 flex items-center justify-center text-gray-500 hover:text-purple-600 hover:scale-110 active:scale-95 transition-all"
                                            title="Share Course"
                                        >
                                            <Share2 size={16} />
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
                                                        {course.tags.slice(0, 3).map((tag, idx) => (
                                                            <span key={`${course._id}-${tag}-${idx}`} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">#{tag}</span>
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
            </div>
        </div>
    );
}
