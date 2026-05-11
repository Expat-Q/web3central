import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Calendar, User, Volume2, StopCircle, PlayCircle } from 'lucide-react';
import { fetchNewsBySlug } from '../services/apiService';

export default function NewsArticle() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

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
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [slug]);

  const speakArticle = async () => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      // Use the full content or a long summary
      const textToSpeak = article.title + ". " + (article.shortDescription || "") + ". " + article.contentMarkdown.replace(/[#*`]/g, '').slice(0, 4000);
      
      const res = await fetch(`${API}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToSpeak,
          voiceId: 'Xb7hHahAlSoxWIwCY9E2' // Alice (News style)
        })
      });
      
      if (!res.ok) throw new Error('ElevenLabs TTS failed');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      await audio.play();
    } catch (err) {
      console.warn('ElevenLabs fallback:', err);
      setIsSpeaking(false);
    }
  };

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
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
            <ChevronLeft size={20} className="mr-1" />
            Back to Home
          </Link>

          <button
            onClick={speakArticle}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm ${
              isSpeaking 
                ? "bg-rose-500 text-white shadow-rose-200" 
                : "bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"
            }`}
          >
            {isSpeaking ? (
              <><StopCircle size={18} /> Stop Listening</>
            ) : (
              <><Volume2 size={18} /> Listen to Article</>
            )}
          </button>
        </div>

        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm"
        >
          {/* Article Header */}
          <div className="relative h-64 md:h-[400px] w-full">
            <div className="absolute inset-0 bg-slate-900/20 z-10"></div>
            <img 
              src={article.thumbnailUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000'} 
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000';
              }}
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

            {/* Audio Progress Overlay (Optional) */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-15 bg-indigo-900/40 backdrop-blur-[2px] flex items-center justify-center"
                >
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [15, 40, 15] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1.5 bg-white rounded-full"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
