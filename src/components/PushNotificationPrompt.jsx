import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Sparkles, ShieldCheck, Check } from 'lucide-react';

export default function PushNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // Check if browser supports Notification API
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Check if user has already granted or dismissed previously
    const dismissed = localStorage.getItem('web3central_push_dismissed');
    if (Notification.permission === 'default' && !dismissed) {
      // Auto trigger pop-up after 2.5 seconds of visiting
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnablePush = async () => {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setGranted(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 2000);

        new Notification('🔔 Web3Central Push Alerts Active', {
          body: 'You are now set up to receive real-time push alerts for new dApps, protocols, news, and market metrics even when away!',
          icon: '/logo.jpg',
        });
      } else {
        setIsVisible(false);
        localStorage.setItem('web3central_push_dismissed', 'true');
      }
    } catch (err) {
      console.error('Failed to request push notification permission:', err);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('web3central_push_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-[100] max-w-md w-full px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-white overflow-hidden backdrop-blur-2xl"
        >
          {/* Subtle Glow Backgrounds */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close push prompt"
          >
            <X size={16} />
          </button>

          {granted ? (
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Check size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Push Notifications Enabled!</h4>
                <p className="text-xs text-purple-200/80 font-medium mt-0.5">You will receive live dApp and market alerts.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/30 shadow-lg">
                  <Bell size={22} className="animate-bounce" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-purple-400/20 mb-1">
                    <Sparkles size={11} /> Stay Ahead
                  </div>
                  <h3 className="text-base font-black text-white leading-snug">
                    Turn on Web3Central Push Alerts
                  </h3>
                  <p className="text-xs text-purple-200/80 font-medium mt-1 leading-relaxed">
                    Get instant desktop & mobile alerts for new dApps, protocols, builder stories, and market metrics even when you're not on Web3Central.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleEnablePush}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <Bell size={15} /> Allow Notifications
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-purple-200 font-bold rounded-xl text-xs transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
