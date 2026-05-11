import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Share2, ChevronRight, Check, Volume2 } from 'lucide-react';

export default function NewsCard({ article, index = 0 }) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

  const speakArticle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const res = await fetch(`${API}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: article.shortDescription || article.title,
          voiceId: 'Xb7hHahAlSoxWIwCY9E2' // Alice (News style)
        })
      });
      
      if (!res.ok) throw new Error('ElevenLabs TTS failed');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setIsSpeaking(false);
      await audio.play();
    } catch (err) {
      console.warn('ElevenLabs fallback to browser synthesis:', err);
      const utterance = new SpeechSynthesisUtterance(article.shortDescription || article.title);
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/news/${article.slug}`;
    const shareData = {
      title: article.title,
      text: article.shortDescription,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard failed:', err);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.4 }}
      className="group flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
        <img
          src={article.thumbnailUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000'}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000';
          }}
        />
        
        {/* Share Button (Top Right) */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleShare}
            className="p-2.5 bg-white/30 backdrop-blur-md border border-white/40 rounded-xl text-white hover:bg-white/50 hover:scale-105 active:scale-95 transition-all shadow-lg group/share"
            title="Share article"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <Check size={18} className="text-emerald-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="share"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <Share2 size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Tooltip for Copy Feedback */}
          <AnimatePresence>
            {copied && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-12 left-1/2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap shadow-xl border border-gray-800"
              >
                LINK COPIED!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tag (Top Left) */}
        {article.tags && article.tags[0] && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-600 shadow-sm border border-indigo-100">
            {article.tags[0]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 flex flex-col flex-grow">
        <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          <button 
            onClick={speakArticle}
            className={`flex items-center gap-1 p-1 rounded-md transition-all ${isSpeaking ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            title="Listen to summary"
          >
            <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} />
          </button>
        </div>
        
        <h3 className="text-lg font-black text-slate-900 leading-snug mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-6">
          {article.shortDescription}
        </p>
        
        <div className="mt-auto pt-5 border-t border-slate-50">
          <Link
            to={`/news/${article.slug}`}
            className="inline-flex items-center text-sm font-bold text-slate-900 hover:text-indigo-700 transition-colors group-hover:gap-2 gap-1 p-0"
          >
            Read Article <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
