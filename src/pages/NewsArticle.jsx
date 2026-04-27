import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, User, Tag } from 'lucide-react';
import { fetchNewsBySlug } from '../services/apiService';

export default function NewsArticle() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        const data = await fetchNewsBySlug(slug);
        setArticle(data);
      } catch (err) {
        console.error('Failed to load news article:', err);
        setError('Article not found.');
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-16 px-4">
        <div className="text-6xl mb-4">📰</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Article Not Found</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-bold mb-8 transition-colors">
          <ChevronLeft size={20} className="mr-1" />
          Back to Home
        </Link>

        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm"
        >
          {/* Article Header */}
          <div className="relative h-64 md:h-[400px] w-full">
            <div className="absolute inset-0 bg-slate-900/20 z-10"></div>
            <img 
              src={article.thumbnailUrl} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {article.tags && article.tags.length > 0 && (
              <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-8 md:p-12">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium mb-10 pb-10 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User size={16} className="text-indigo-500" />
                {article.author || 'Web3Central Editorial'}
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </div>
            </div>

            {/* Markdown Body */}
            <div className="prose prose-lg prose-indigo max-w-none prose-headings:font-black prose-a:text-indigo-600 hover:prose-a:text-indigo-800 prose-img:rounded-2xl">
              <ReactMarkdown>
                {article.contentMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
