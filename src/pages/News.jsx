import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchLatestNews } from '../services/apiService';
import { BookOpen, Sparkles } from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';
import NewsCard from '../components/NewsCard';

export default function News() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNewsData = async () => {
            try {
                setLoading(true);
                const data = await fetchLatestNews().catch(() => []);
                setNews(data || []);
            } catch (err) {
                console.error('Error fetching news:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNewsData();
    }, []);

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
                            <Sparkles size={14} className="animate-pulse" /> Latest Updates
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-900 leading-[1.1]">
                            Crypto <span className="text-purple-600">News</span>
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl max-w-3xl font-normal leading-relaxed">
                            Stay updated with the latest in Web3, DeFi, NFTs, and more.
                        </p>
                    </motion.div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <CardSkeleton key={`news-skeleton-${i}`} />
                        ))}
                    </div>
                ) : news.length === 0 ? (
                    <div className="text-center py-24 text-gray-400">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-bold text-lg">No news published yet.</p>
                        <p className="text-sm mt-1">Check back soon for the latest updates.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.map((article, i) => (
                            <NewsCard key={article._id || i} article={article} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
