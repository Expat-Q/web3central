import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink, Sparkles, TrendingUp, ShieldCheck, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FloatingNotificationToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Listen for custom floating notification events dispatched across the app
    const handleFloatingAlert = (event) => {
      const { title, body, url, type, logoUrl } = event.detail || {};
      setToast({
        id: Date.now(),
        title: title || 'Web3Central Notification',
        body: body || 'New update available on Web3Central.',
        url: url || '/',
        type: type || 'protocol',
        logoUrl: logoUrl || null
      });

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToast(prev => (prev && prev.id === Date.now() ? null : prev));
      }, 6000);
    };

    window.addEventListener('web3central_floating_toast', handleFloatingAlert);
    return () => window.removeEventListener('web3central_floating_toast', handleFloatingAlert);
  }, []);

  if (!toast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-purple-500/30 p-4 overflow-hidden"
      >
        {/* Glow Accent */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          {/* Icon or Logo */}
          <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center shrink-0 overflow-hidden">
            {toast.logoUrl ? (
              <img src={toast.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Bell className="w-5 h-5 text-purple-300 animate-bounce" />
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-black tracking-wide text-white truncate">{toast.title}</h4>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-snug line-clamp-2">{toast.body}</p>

            {/* Action Link */}
            {toast.url && (
              <Link
                to={toast.url}
                onClick={() => setToast(null)}
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-white transition-colors"
              >
                View Details <ExternalLink size={12} />
              </Link>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
