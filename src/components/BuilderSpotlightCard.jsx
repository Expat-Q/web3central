import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, BookOpen, X } from 'lucide-react';

function extractHandle(str) {
  if (!str) return null;
  const match = str.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
  if (match) return match[1];
  return str.replace('@', ''); // handles "@handle" -> "handle" or "handle" -> "handle"
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
      <div className={`bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black ring-[6px] ring-white shadow-xl ${className}`}>
        {name ? name.charAt(0) : 'Z'}
      </div>
    );
  }
  return (
    <img
      src={current}
      alt={name}
      className={className}
      onError={() => {
        if (idx + 1 < srcs.length) setIdx(idx + 1);
        else setFailed(true);
      }}
    />
  );
}


export default function BuilderSpotlightCard({ bs }) {
  const [storyOpen, setStoryOpen] = useState(false);
  const tools =
    bs?.featuredTools?.length > 0
      ? bs.featuredTools
      : [
          { name: 'Anti Drain Tool', description: 'Protect from malicious drain txns', initial: 'AD' },
          { name: 'Poly Whales Tracker', description: 'Track Polymarket power traders', initial: 'PW' },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative rounded-[2rem] overflow-hidden bg-white/40 backdrop-blur-3xl border border-white/50 p-6 sm:p-8 flex flex-col gap-6 shadow-[0_40px_100px_rgba(100,20,200,0.06)] min-h-[400px] border-l-white/80 border-t-white/80 group"
    >
      {/* Dynamic Gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-fuchsia-400/30 to-purple-600/30 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl pointer-events-none group-hover:translate-x-10 transition-transform duration-700" />
      
      {/* Top Section */}
      <div className="flex items-center gap-5 relative z-10">
      <div className="relative">
          <AvatarWithFallback
            src={bs?.xProfileImageUrl}
            twitterHandle={bs?.twitter || bs?.twitterHandle}
            name={bs?.name}
            className="w-20 h-20 rounded-full object-cover ring-[6px] ring-white shadow-xl"
          />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#1DA1F2] border-[3px] border-white flex items-center justify-center text-white shadow-lg">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-black text-gray-900 tracking-tight">
              {bs?.name || 'Zun20'}
            </h4>
            <ShieldCheck size={18} className="text-blue-500" />
          </div>
          <p className="text-gray-500 font-medium text-xs mt-0.5">
            {bs?.role || 'Security Researcher & Builder'}
          </p>
        </div>
      </div>

      {/* Bio Element */}
      <div className="relative z-10 w-full p-4 rounded-2xl bg-white/60 border border-white/80 shadow-sm backdrop-blur-md">
        <p className="text-gray-600 text-sm leading-relaxed font-medium">
          {bs?.description ||
            'Creator of multiple security tools that protect the community. Known for building practical, impactful Web3 utilities.'}
        </p>
      </div>

      {/* Tools Section */}
      <div className="space-y-3 flex-1 relative z-10 mt-2">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-purple-500 fill-purple-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Featured Projects
          </p>
        </div>
        
        {tools.slice(0, 2).map((ft, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100/80 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-sm font-black text-white shrink-0 shadow-inner border border-gray-800">
              {ft.initial || ft.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{ft.name}</p>
              <p className="text-[11px] font-medium text-gray-500 truncate">{ft.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <button
        onClick={() => setStoryOpen(true)}
        className="relative z-10 flex items-center justify-center gap-2 w-full py-4 bg-gray-900 hover:bg-purple-600 text-white shadow-xl shadow-gray-200 hover:shadow-purple-200 text-sm font-black rounded-2xl transition-all hover:-translate-y-0.5 cursor-pointer"
      >
        Read Their Story <BookOpen size={16} />
      </button>

      {/* Story Modal */}
      <AnimatePresence>
        {storyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setStoryOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-8 relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setStoryOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X size={16} className="text-gray-500" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <AvatarWithFallback
                  src={bs?.xProfileImageUrl}
                  twitterHandle={bs?.twitter || bs?.twitterHandle}
                  name={bs?.name}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-purple-100"
                />
                <div>
                  <h3 className="text-xl font-black text-gray-900">{bs?.name || 'Zun20'}</h3>
                  <p className="text-sm text-gray-500">{bs?.role || 'Security Researcher & Builder'}</p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {bs?.story || bs?.description || 'This builder\'s full story is coming soon. Check back later for their complete journey in the Web3 space.'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
